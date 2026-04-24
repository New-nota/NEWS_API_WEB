# News Web Dashboard

Next.js dashboard for viewing user-specific news and analytics from PostgreSQL.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Auth.js / NextAuth (Google OAuth)
- PostgreSQL (`pg`)

## Main features

- Google sign-in
- Protected pages:
  - `/dashboard`
  - `/analytics`
- Protected API routes:
  - `GET /api/news`
  - `GET /api/analytics`
  - `POST /api/searches`
  - `GET /api/searches/:id`
- Filters, pagination, request queue UI
- Security middleware headers
- Unified API response shape: `{ ok, data|error, requestId }`

## Responsibility split with NEWS_API_ETL_Project

- `NEWS_API_ETL_Project` owns data ingestion, NewsAPI calls, filtering/scoring, and writing results to DB.
- `NEWS_API_WEB` owns authentication, user dashboard UI, analytics UI, and enqueueing user requests into `search_requests`.
- `NEWS_API_WEB` does not call NewsAPI and does not run ETL workers.

## Quick start

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

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
AUTH_TRUST_HOST=false
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

## Database bootstrap

Create required dashboard tables:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_app_schema.sql
```

Shared DB contract (compatible with `NEWS_API_ETL_Project`) is:
- `app_users`
- `articles`
- `search_requests`
- `user_news`
- `request_stats`

News pipeline workers should write/update data in these shared tables; this web app only reads them (plus creates queue rows in `search_requests`).

## API examples

```text
GET /api/news?q=ai&keyword=AI&author=Ivan%20Petrov&language=ru&page=1&limit=20
GET /api/analytics
POST /api/searches
GET /api/searches/123
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

Success response:

```json
{
  "ok": true,
  "data": {},
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

## Docker

Build image:

```bash
docker build -t news-web-dashboard .
```

Run container:

```bash
docker run --rm -p 3000:3000 --env-file .env.local news-web-dashboard
```
