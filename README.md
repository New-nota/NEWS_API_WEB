# News Web Dashboard

Next.js dashboard for viewing user-specific news and analytics from PostgreSQL. Each user signs in with Google, stores their own NewsAPI key, and enqueues search requests executed by the companion `NEWS_API_ETL_Project`.

## Stack

- Next.js 16 (App Router, `--webpack`, `output: "standalone"`)
- React 19 + TypeScript 5.8
- Auth.js / NextAuth 5 (Google OAuth, JWT sessions)
- PostgreSQL via `pg` (singleton `Pool`)
- Node `node:test` for unit tests
- Per-user NewsAPI key encryption with AES-256-GCM (`node:crypto`)

## Main features

- Google sign-in with `app_users` upsert on first login
- Per-user NewsAPI key stored encrypted in `users_keys` (AES-256-GCM, only `last4` exposed); key goes through statuses: `pending_validation → validating → valid / invalid / exhausted`
- **Trial mode**: users without a saved key get a limited number of free trial requests (`TRIAL_REQUEST_LIMIT`, default 3); trial requests are tagged `is_trial = true`
- Protected pages:
  - `/dashboard` — search-request form, request list, paginated news with filters
  - `/analytics` — totals, top keywords, top sources, request stats, AI aggregates
  - `/searches/[id]` — request details with statistics, AI Briefing, and request-scoped news
  - `/profile` — account info + NewsAPI key management
  - `/admin` — operator-only statistics dashboard (requires `ADMIN_EMAILS`)
- Protected API routes:
  - `GET  /api/news` — list user's news with `q`, `keyword`, `author`, `language`, `page`, `limit`
  - `GET  /api/analytics` — aggregates for the current user (includes `ai` block)
  - `POST /api/searches` — enqueue a `search_requests` row (requires saved key or remaining trial uses)
  - `GET  /api/searches/:id` — status, per-request stats, and `ai_report` for the current user
  - `GET/POST/DELETE /api/profile/news-api-key` — manage the encrypted NewsAPI key
  - `GET  /api/health` — liveness probe, always returns `{ ok: true }`
- Auto-refresh on the dashboard while any request is `queued` or `running` (3 s polling)
- In-memory per-user-and-IP rate limit on `POST /api/searches` (20 req / 60 s)
- Same-origin check on mutating requests (`POST` / `DELETE`)
- Security headers added by `proxy.ts` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`)
- Unified API response shape: `{ ok, data | error, requestId }` (request id is read from `x-request-id` header or generated)

## Admin dashboard

`/admin` is a server-rendered statistics page gated by the `ADMIN_EMAILS` env var (comma-separated list of allowed emails). Non-admins see a 403 state page.

The dashboard shows, in a single page load:

- **KPI cards**: total users, active in 7 d / 30 d, new signups in 7 d, total/weekly requests, success rate, error and pending counts, AI reports count, total Mistral token usage, articles in DB, trial request count
- **Time series charts** (last 30 days): requests per day, Mistral token spend per day, new user registrations per day
- **Rankings**: top 20 search keywords, top 10 users by request volume, status breakdown (queue health), AI-report sentiment distribution
- **Processing time**: average and max seconds for `success` requests
- **Per-user table**: each registered user with their request totals, success/error counts, trial uses, registration date, and last login
- **Live feed**: last 15 requests across all users with keyword, user email, status badge, and timestamp

All data is fetched server-side in a single `Promise.all` round-trip (`lib/admin-stats.ts`).

## Responsibility split with `NEWS_API_ETL_Project`

- `NEWS_API_ETL_Project` owns ingestion: polls `search_requests`, calls NewsAPI with the user's decrypted key, runs filtering/scoring, writes `articles`, `user_news`, and `request_stats`. It also generates AI briefings and writes them to `request_ai_report`.
- `NEWS_API_WEB` owns: Google auth, user provisioning (`app_users`), encrypted key storage (`users_keys`), trial quota tracking, the dashboard / analytics / profile / admin UI, and enqueueing rows into `search_requests`.
- This app does **not** call NewsAPI, does **not** call any LLM, and does **not** run ETL workers. AI briefings are read-only here.
- Both projects share `NEWS_API_KEY_ENCRYPTION_SECRET` so the ETL worker can decrypt keys written here.

## AI Briefing

Each completed search request can have an AI-generated briefing written by the ETL worker into `request_ai_report`. The frontend only **reads and renders** these reports — it never calls an LLM, never stores AI provider keys, and never regenerates summaries on page load.

The briefing is exposed by `GET /api/searches/:id` as `ai_report: AIReport | null` and rendered by `<AIBriefingCard />` on `/searches/[id]`. It contains:

- `summary`, `key_points`, `highlights`
- `sentiment_label` (`positive` / `neutral_positive` / `neutral` / `neutral_negative` / `negative`) and `sentiment_score`
- `sentiment_distribution` (positive / neutral / negative percent)
- `main_topics`, `data_quality_warnings`
- `model_provider`, `model_name`, `news_count`, `created_at`
- `status` (`success` | `failed` | `pending`) with `error_text` on failure

UI states: `queued` / `running` (request not finished), `success` + `ai_report === null` (missing), `ai_report.status === "failed"` (failure with reason), `ai_report.status === "success"` (full briefing). All optional fields are normalized to empty arrays before render so the page never crashes on partial data.

Authorization: AI reports are always fetched through `search_requests.user_id`. The SQL joins `request_ai_report` via `LEFT JOIN ... ON air.search_request_id = sr.id` and the `WHERE` clause requires `sr.user_id = $current_user`. A user cannot fetch another user's `ai_report` by guessing a search-request id.

Analytics: `GET /api/analytics` returns an `ai` block with `total_reports`, `failed_reports`, `avg_sentiment_score`, sentiment counts by label, and `top_topics` aggregated from `main_topics` JSONB arrays.

## Quick start

```bash
npm ci
cp .env.example .env.local
# fill in DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET,
# NEWS_API_KEY_ENCRYPTION_SECRET, and optionally ADMIN_EMAILS in .env.local
npm run dev
```

Open `http://localhost:3000` — unauthenticated users are redirected to `/login`.

## Environment variables

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/db_news
DB_CONNECTION_TIMEOUT_MS=5000
DB_STATEMENT_TIMEOUT_MS=10000
DB_IDLE_TIMEOUT_MS=10000

# Auth.js / Google OAuth
AUTH_SECRET=replace_me_with_a_long_random_secret
AUTH_GOOGLE_ID=replace_me
AUTH_GOOGLE_SECRET=replace_me
# Set to true when running behind a reverse proxy (e.g. Vercel, nginx)
AUTH_TRUST_HOST=false

# Encryption key for users_keys.encrypted_key.
# MUST match NEWS_API_ETL_Project so the worker can decrypt user-supplied NewsAPI keys.
# Falls back to AUTH_SECRET if unset, but a dedicated value is recommended.
NEWS_API_KEY_ENCRYPTION_SECRET=replace_me_with_32+_random_chars

# Comma-separated list of Google-account emails that can access /admin.
# Leave empty to disable the admin page entirely.
ADMIN_EMAILS=you@example.com

# How many free trial requests a new user gets before they must add a NewsAPI key.
TRIAL_REQUEST_LIMIT=3
```

## Scripts

```bash
npm run dev           # next dev --webpack
npm run build         # next build --webpack (standalone output)
npm run start         # next start
npm run lint          # eslint . --max-warnings=0
npm run typecheck     # tsc --noEmit
npm run test:build    # tsc -p tsconfig.test.json
npm run test          # test:build + node --test --test-isolation=none
npm run format        # prettier --check .
npm run format:write
npm run check         # lint + typecheck + test + build
```

Tests use `node:test` and live in `tests/` (`validation.test.ts`, `ai-report.test.ts`).

## Database

The data tables are shared with `NEWS_API_ETL_Project`. Apply the schema from `db/migrations/`:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_app_schema.sql
```

Both apps must point at the same `DATABASE_URL`.

Tables this app reads/writes:

| Table                | Access from this app                                                      |
| -------------------- | --------------------------------------------------------------------------|
| `app_users`          | upsert on Google sign-in, read; `trial_uses` incremented by ETL          |
| `users_keys`         | insert/update/delete/read (AES-256-GCM, `service = 'news_api'`, tracks `status`) |
| `search_requests`    | insert (status `queued`, `is_trial` flag), read                          |
| `user_news`          | read                                                                      |
| `articles`           | read (joined via `user_news`)                                            |
| `request_stats`      | read (joined per request)                                                |
| `request_ai_report`  | read (joined per request, scoped by `search_requests.user_id`)           |

ETL writes/updates everything else. This app only enqueues `search_requests` and reads dashboard data.

## API examples

```text
GET    /api/health
GET    /api/news?q=ai&keyword=AI&author=Ivan%20Petrov&language=ru&page=1&limit=20
GET    /api/analytics
POST   /api/searches
GET    /api/searches/123
GET    /api/profile/news-api-key
POST   /api/profile/news-api-key
DELETE /api/profile/news-api-key
```

`POST /api/searches` body:

```json
{
  "keyword": "ai",
  "language": "ru",
  "limitCount": 20,
  "pageSize": 50
}
```

Constraints: `keyword` ≤ 120 chars, `language` is ISO 639-1 (defaults to `ru`), `limitCount` ∈ [1, 500], `pageSize` ∈ [1, 100]. Returns `403 NEWS_API_KEY_REQUIRED` if the user has no saved key and no trial uses remaining; `429 RATE_LIMITED` (with `details.retryAfterSeconds`) past 20 requests per minute per user+IP.

`POST /api/profile/news-api-key` body:

```json
{ "apiKey": "<your NewsAPI key, 20–256 chars>" }
```

Success / error envelope:

```json
{ "ok": true,  "data": { "...": "..." }, "requestId": "..." }
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "..." }, "requestId": "..." }
```

Common error codes: `UNAUTHORIZED`, `FORBIDDEN`, `FORBIDDEN_ORIGIN`, `NEWS_API_KEY_REQUIRED`, `VALIDATION_ERROR`, `INVALID_JSON`, `RATE_LIMITED`, `NOT_FOUND`, `INTERNAL_ERROR`.

## Project layout

```
app/
  (protected)/
    admin/          # operator stats dashboard (ADMIN_EMAILS gate)
    analytics/      # per-user analytics
    dashboard/      # search form, news table, filters, auto-refresh
    profile/        # account + NewsAPI key management
    searches/[id]/  # request details + AI Briefing
  api/
    auth/           # NextAuth handlers
    health/         # GET /api/health — liveness probe
    news/           # GET /api/news
    analytics/      # GET /api/analytics
    searches/       # POST /api/searches, GET /api/searches/:id
    profile/        # news-api-key CRUD
  login/            # Google sign-in page
auth.ts             # NextAuth config + signIn/jwt/session callbacks
proxy.ts            # security headers (matcher excludes _next assets)
lib/
  db.ts             # singleton pg Pool
  users.ts          # app_users upsert, session → appUserId, trial status
  user-news-api-key.ts  # AES-256-GCM encrypt/decrypt for users_keys
  news.ts           # paginated user_news query + filter options
  analytics.ts      # per-user aggregates (incl. AI block)
  searches.ts       # create / list / get search_requests (joins request_ai_report)
  admin-stats.ts    # server-only: all KPIs + charts for /admin in one Promise.all
  ai-report.ts      # AIReport type + sentiment helpers
  api-auth.ts       # requireAppUserIdFromAuthRequest / requireCurrentAppUserId
  api-response.ts   # jsonOk / jsonError / handleApiError / requestId
  app-error.ts      # AppError class
  validation.ts     # input parsers (text, language, integers, …)
  news-filters.ts   # parse filters from URL searchParams
  rate-limit.ts     # in-memory token bucket
  request-security.ts  # ensureSameOrigin + getClientIp
components/
  auth/             # GoogleSignInButton, SignOutButton
  dashboard/        # search form, news table, filter form, status tracker, auto-refresh
  searches/         # AIBriefingCard
  analytics/        # AIAnalyticsSection
  profile/          # NewsApiKeyForm
db/
  migrations/       # 0001_app_schema.sql — baseline schema for shared tables
tests/              # node:test specs (validation, ai-report)
```

## Docker

```bash
docker build -t news-web-dashboard .
docker run --rm -p 3000:3000 --env-file .env.local news-web-dashboard
```

The image is built with `output: "standalone"` and runs as the non-root `nextjs` user. A `HEALTHCHECK` polls `http://127.0.0.1:3000/api/health`.
