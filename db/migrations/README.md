# Migrations

Baseline SQL migration for shared tables used by `NEWS_API_WEB` and `NEWS_API_ETL_Project`:

- `app_users`
- `articles`
- `search_requests`
- `user_news`
- `request_stats`

Run manually with `psql`:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_app_schema.sql
```

This project does not run ETL jobs. It only reads dashboard data and creates queue records in `search_requests`.
