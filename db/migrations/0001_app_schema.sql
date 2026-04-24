BEGIN;

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NULL,
  image_url TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  source_name TEXT NULL,
  author TEXT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'ru',
  limit_count INTEGER NOT NULL CHECK (limit_count > 0),
  page_size INTEGER NOT NULL CHECK (page_size > 0),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'success', 'failed')),
  error_text TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS user_news (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  search_request_id BIGINT NOT NULL REFERENCES search_requests(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, article_id, search_request_id)
);

CREATE TABLE IF NOT EXISTS request_stats (
  id BIGSERIAL PRIMARY KEY,
  search_request_id BIGINT NOT NULL UNIQUE REFERENCES search_requests(id) ON DELETE CASCADE,
  income_articles INTEGER NOT NULL DEFAULT 0,
  accepted_articles INTEGER NOT NULL DEFAULT 0,
  rejected_articles INTEGER NOT NULL DEFAULT 0,
  reasons_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  prime_reasons JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_google_sub ON app_users (google_sub);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users (email);
CREATE INDEX IF NOT EXISTS idx_search_requests_user_id ON search_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_search_requests_status ON search_requests (status);
CREATE INDEX IF NOT EXISTS idx_search_requests_user_id_created_at ON search_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_news_user_id ON user_news (user_id);
CREATE INDEX IF NOT EXISTS idx_user_news_search_request_id ON user_news (search_request_id);
CREATE INDEX IF NOT EXISTS idx_user_news_user_id_fetched_at ON user_news (user_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_stats_search_request_id ON request_stats (search_request_id);

COMMIT;
