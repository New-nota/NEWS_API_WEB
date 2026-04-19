# News Web Dashboard for NEWS_API_ETL_Project

Веб-интерфейс для твоего текущего Python ETL-проекта. Он не заменяет ETL, а живёт рядом с ним:
- Python по-прежнему тянет новости из NewsAPI;
- фильтрует их;
- складывает в PostgreSQL;
- Next.js показывает ленту и аналитику в браузере после входа через Google.

## Что умеет
- вход через Google;
- защищённые страницы `/dashboard` и `/analytics`;
- просмотр новостей из PostgreSQL;
- фильтрация по `keyword`, `author`, `language`, поиск по тексту;
- аналитика по языкам, авторам, keyword и дням;
- защищённые API-роуты `/api/news` и `/api/analytics`.

## Важно
Этот проект специально подогнан под текущую таблицу из твоего Python-репозитория:
- таблица: `bad_news_bears`
- поля: `id`, `language`, `key_word`, `author`, `title`, `description`, `url`, `published_at`, `fetched_at`

Если ты потом изменишь ETL — просто поправишь mapping в `.env.local`.

## Чего сейчас нет в БД
Твоя текущая таблица **не хранит**:
- `source.name` из NewsAPI;
- статус статьи (`accepted/rejected`) в самой БД;
- причины отбраковки в БД.

Значит вебка **не может честно показать** source/status/reject reasons, пока ты не начнёшь это сохранять в PostgreSQL.

## Стек
- Next.js
- React
- TypeScript
- Bun
- Auth.js / NextAuth
- PostgreSQL (`pg`)

## Быстрый старт

```bash
bun install
cp .env.example .env.local
bun run dev
```

Открывай:

```text
http://localhost:3000
```

## Что заполнить в `.env.local`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/news_db
AUTH_SECRET=your_long_random_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
AUTH_TRUST_HOST=true

NEWS_TABLE=bad_news_bears
NEWS_COL_ID=id
NEWS_COL_TITLE=title
NEWS_COL_DESCRIPTION=description
NEWS_COL_AUTHOR=author
NEWS_COL_URL=url
NEWS_COL_PUBLISHED_AT=published_at
NEWS_COL_FETCHED_AT=fetched_at
NEWS_COL_KEYWORD=key_word
NEWS_COL_LANGUAGE=language
```

## Google OAuth
В Google Cloud Console создай OAuth Client ID и добавь redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

## Архитектура

```text
Твой Python ETL -> PostgreSQL (news_db.bad_news_bears) -> Next.js dashboard
```

## API

### Получить новости
```text
GET /api/news?q=ai&keyword=AI&author=Ivan%20Petrov&language=ru&page=1&limit=20
```

### Получить аналитику
```text
GET /api/analytics
```

## Что я бы советовал допилить в ETL потом
1. Сохранять `source.name` в таблицу.
2. Создать отдельную таблицу `etl_run_stats` для причин отбраковки.
3. Добавить поле `status` или `is_valid`, если хочешь видеть модерацию/фильтры в вебке.

Тогда дашборд станет заметно жирнее.
