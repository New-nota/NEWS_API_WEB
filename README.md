# News Web Dashboard

Next.js dashboard for viewing user-specific news and analytics from PostgreSQL. Each user signs in with Google, stores their own NewsAPI key, and enqueues search requests that are executed by the companion `NEWS_API_ETL_Project`.

## Stack

- Next.js 16 (App Router, `--webpack`, `output: "standalone"`)
- React 19 + TypeScript 5.8
- Auth.js / NextAuth 5 (Google OAuth, JWT sessions)
- PostgreSQL via `pg` (singleton `Pool`)
- Node `node:test` for unit tests
- Per-user NewsAPI key encryption with AES-256-GCM (`node:crypto`)

## Main features

- Google sign-in with `app_users` upsert on first login
- Per-user NewsAPI key stored encrypted in `users_keys` (AES-256-GCM, only `last4` exposed)
- Protected pages:
  - `/dashboard` — search-request form, request list, paginated news with filters
  - `/analytics` — totals, top keywords, top sources, request stats, AI aggregates
  - `/searches/[id]` — request details with statistics, AI Briefing, and request-scoped news
  - `/profile` — account info + NewsAPI key management
- Protected API routes:
  - `GET  /api/news` — list user's news with `q`, `keyword`, `author`, `language`, `page`, `limit`
  - `GET  /api/analytics` — aggregates for the current user (includes `ai` block)
  - `POST /api/searches` — enqueue a `search_requests` row (requires saved NewsAPI key)
  - `GET  /api/searches/:id` — status, per-request stats, and `ai_report` for the current user
  - `GET/POST/DELETE /api/profile/news-api-key` — manage the encrypted NewsAPI key
- Auto-refresh on the dashboard while any request is `queued` or `running` (3s polling)
- In-memory per-user-and-IP rate limit on `POST /api/searches` (20 req / 60s)
- Same-origin check on mutating requests (`POST` / `DELETE`)
- Security headers added by `proxy.ts` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`)
- Unified API response shape: `{ ok, data | error, requestId }` (request id is read from `x-request-id` header or generated)

## Responsibility split with `NEWS_API_ETL_Project`

- `NEWS_API_ETL_Project` owns ingestion: it polls `search_requests`, calls NewsAPI with the user's decrypted key, runs filtering/scoring, writes `articles`, `user_news`, and `request_stats`. It also generates AI briefings and writes them to `request_ai_reports`.
- `NEWS_API_WEB` owns: Google auth, user provisioning (`app_users`), encrypted key storage (`users_keys`), the dashboard / analytics / profile / search-details UI, and enqueueing rows into `search_requests`.
- This app does **not** call NewsAPI, does **not** call any LLM, and does **not** run ETL workers. AI briefings are read-only here.
- Both projects share `NEWS_API_KEY_ENCRYPTION_SECRET` so the ETL worker can decrypt keys written here.

## AI Briefing

Each completed search request can have an AI-generated briefing written by the ETL worker into `request_ai_reports`. The frontend only **reads and renders** these reports — it never calls an LLM, never stores AI provider keys, and never regenerates summaries on page load.

The briefing is exposed by `GET /api/searches/:id` as `ai_report: AIReport | null` and rendered by `<AIBriefingCard />` on `/searches/[id]`. It contains:

- `summary`, `key_points`, `highlights`
- `sentiment_label` (`positive` / `neutral_positive` / `neutral` / `neutral_negative` / `negative`) and `sentiment_score`
- `sentiment_distribution` (positive / neutral / negative percent)
- `main_topics`, `data_quality_warnings`
- `model_provider`, `model_name`, `news_count`, `created_at`
- `status` (`success` | `failed` | `pending`) with `error_text` on failure

UI states: `queued` / `running` (request not finished), `success` + `ai_report === null` (missing), `ai_report.status === "failed"` (failure with reason), `ai_report.status === "success"` (full briefing). All optional fields are normalized to empty arrays before render so the page never crashes on partial data.

Authorization: AI reports are always fetched through `search_requests.user_id`. The SQL joins `request_ai_reports` via `LEFT JOIN ... ON air.search_request_id = sr.id` and the `WHERE` clause requires `sr.user_id = $current_user`. A user cannot fetch another user's `ai_report` by guessing a search-request id.

Analytics: `GET /api/analytics` returns an `ai` block with `total_reports`, `failed_reports`, `avg_sentiment_score`, sentiment counts by label, and `top_topics` aggregated from `main_topics` JSONB arrays.

## Quick start

```bash
npm ci
cp .env.example .env.local
# fill in DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET,
# and NEWS_API_KEY_ENCRYPTION_SECRET in .env.local
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
```

## Scripts

```bash
npm run dev         # next dev --webpack
npm run build       # next build --webpack (standalone output)
npm run start       # next start
npm run lint        # eslint . --max-warnings=0
npm run typecheck   # tsc --noEmit
npm run test        # tsc -p tsconfig.test.json && node --test dist-tests/tests/**/*.test.js
npm run format      # prettier --check .
npm run format:write
npm run check       # lint + typecheck + test + build
```

Tests use `node:test` and live in `tests/` (currently `validation.test.ts` covering input parsers and the rate limiter).

## Database

The data tables (`app_users`, `articles`, `search_requests`, `user_news`, `request_stats`, `users_keys`) are shared with `NEWS_API_ETL_Project`, which is the source of truth for the schema. This repo does not ship a migration file — apply schema from the ETL project, then point both apps at the same `DATABASE_URL`.

Tables this app reads/writes:

| Table                | Access from this app             |
| -------------------- | -------------------------------- |
| `app_users`          | upsert on Google sign-in, read   |
| `users_keys`         | insert/update/delete/read (AES-256-GCM, service = `news_api`) |
| `search_requests`    | insert (status `queued`), read   |
| `user_news`          | read                             |
| `articles`           | read (joined via `user_news`)    |
| `request_stats`      | read (joined per request)        |
| `request_ai_reports` | read (joined per request, scoped by `search_requests.user_id`) |

ETL workers should write/update everything else. This app only enqueues `search_requests` and reads dashboard data.

## API examples

```text
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

Constraints: `keyword` ≤ 120 chars, `language` is ISO 639-1 (defaults to `ru`), `limitCount` ∈ [1, 500], `pageSize` ∈ [1, 100]. Returns `403 NEWS_API_KEY_REQUIRED` if the user has not saved a NewsAPI key, and `429 RATE_LIMITED` (with `details.retryAfterSeconds`) past 20 requests per minute per user+IP.

`POST /api/profile/news-api-key` body:

```json
{ "apiKey": "<your NewsAPI key, 20–256 chars>" }
```

Success response:

```json
{
  "ok": true,
  "data": { "...": "..." },
  "requestId": "..."
}
```

Error response:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  },
  "requestId": "..."
}
```

Common error codes: `UNAUTHORIZED`, `FORBIDDEN`, `FORBIDDEN_ORIGIN`, `NEWS_API_KEY_REQUIRED`, `VALIDATION_ERROR`, `INVALID_JSON`, `RATE_LIMITED`, `NOT_FOUND`, `INTERNAL_ERROR`.

## Project layout

```
app/
  (protected)/        # dashboard, analytics, profile, searches/[id] (server components)
  api/                # auth, news, analytics, searches, profile/news-api-key
  login/              # Google sign-in page
auth.ts               # NextAuth config + signIn/jwt/session callbacks
proxy.ts              # security headers (matcher excludes _next assets)
lib/
  db.ts               # singleton pg Pool
  users.ts            # app_users upsert + session → appUserId resolution
  user-news-api-key.ts# AES-256-GCM encrypt/decrypt for users_keys
  news.ts             # paginated user_news query + filter options (incl. searchRequestId)
  analytics.ts        # per-user aggregates (incl. AI block)
  searches.ts         # create / list / get search_requests (joins request_ai_reports)
  ai-report.ts        # AIReport type + sentiment helpers
  api-auth.ts         # requireAppUserIdFromAuthRequest / requireCurrentAppUserId
  api-response.ts     # jsonOk / jsonError / handleApiError / requestId
  app-error.ts        # AppError class
  validation.ts       # parseRequiredText / parseLanguage / parseStrictPositiveInteger / ...
  news-filters.ts     # parse filters from URL or searchParams
  rate-limit.ts       # in-memory token bucket
  request-security.ts # ensureSameOrigin + getClientIp
components/
  auth/               # GoogleSignInButton, SignOutButton
  dashboard/          # search form, news table, filter form, status tracker, auto-refresh
  searches/           # AIBriefingCard
  analytics/          # AIAnalyticsSection
  profile/            # NewsApiKeyForm
tests/                # node:test specs (validation, rate-limit, ai-report)
```

## Docker

```bash
docker build -t news-web-dashboard .
docker run --rm -p 3000:3000 --env-file .env.local news-web-dashboard
```

The image is built with `output: "standalone"` and runs as the non-root `nextjs` user. A `HEALTHCHECK` polls `http://127.0.0.1:3000/`.
