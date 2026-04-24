import { pool } from "@/lib/db";

export const NEWS_PAGE_DEFAULT = 1;
export const NEWS_LIMIT_DEFAULT = 20;
export const NEWS_LIMIT_MAX = 100;
export const NEWS_TEXT_MAX_LENGTH = 120;

export type NewsRecord = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  url: string;
  publishedAt: string | null;
  fetchedAt: string | null;
  keyword: string | null;
  language: string | null;
};

export type NewsFilters = {
  q?: string;
  keyword?: string;
  author?: string;
  language?: string;
  page?: number;
  limit?: number;
};

export type UserNewsRecord = NewsRecord & {
  sourceName: string | null;
  searchRequestId: number;
};

export type UserNewsListResult = {
  rows: UserNewsRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type NewsFilterOptions = {
  keywords: string[];
  authors: string[];
  languages: string[];
};

function sanitizePage(value?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return NEWS_PAGE_DEFAULT;
  }
  return Math.floor(value);
}

function sanitizeLimit(value?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return NEWS_LIMIT_DEFAULT;
  }
  return Math.min(Math.max(Math.floor(value), 1), NEWS_LIMIT_MAX);
}

function buildUserNewsWhere(filters: NewsFilters, initialParamIndex = 2) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (filters.keyword) {
    values.push(filters.keyword);
    conditions.push(`un.keyword = $${initialParamIndex + values.length - 1}`);
  }

  if (filters.author) {
    values.push(filters.author);
    conditions.push(`a.author = $${initialParamIndex + values.length - 1}`);
  }

  if (filters.language) {
    values.push(filters.language);
    conditions.push(`sr.language = $${initialParamIndex + values.length - 1}`);
  }

  if (filters.q) {
    values.push(`%${filters.q}%`);
    const param = `$${initialParamIndex + values.length - 1}`;
    conditions.push(`(a.title ILIKE ${param} OR COALESCE(a.description, '') ILIKE ${param})`);
  }

  return {
    whereSql: conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "",
    values,
  };
}

export async function getUserNewsFilterOptions(userId: number): Promise<NewsFilterOptions> {
  const [keywordsResult, authorsResult, languagesResult] = await Promise.all([
    pool.query<{ value: string }>(
      `
        SELECT DISTINCT un.keyword::text AS value
        FROM user_news AS un
        WHERE un.user_id = $1
          AND un.keyword IS NOT NULL
        ORDER BY 1
        LIMIT 100
      `,
      [userId],
    ),
    pool.query<{ value: string }>(
      `
        SELECT DISTINCT a.author::text AS value
        FROM user_news AS un
        JOIN articles AS a ON a.id = un.article_id
        WHERE un.user_id = $1
          AND a.author IS NOT NULL
        ORDER BY 1
        LIMIT 100
      `,
      [userId],
    ),
    pool.query<{ value: string }>(
      `
        SELECT DISTINCT sr.language::text AS value
        FROM user_news AS un
        JOIN search_requests AS sr ON sr.id = un.search_request_id
        WHERE un.user_id = $1
          AND sr.language IS NOT NULL
        ORDER BY 1
        LIMIT 50
      `,
      [userId],
    ),
  ]);

  return {
    keywords: keywordsResult.rows.map((row) => row.value),
    authors: authorsResult.rows.map((row) => row.value),
    languages: languagesResult.rows.map((row) => row.value),
  };
}

export async function listNewsForUser(
  userId: number,
  filters: NewsFilters = {},
): Promise<UserNewsListResult> {
  const page = sanitizePage(filters.page);
  const limit = sanitizeLimit(filters.limit);
  const offset = (page - 1) * limit;
  const { whereSql, values } = buildUserNewsWhere(filters);
  const queryValues = [userId, ...values];

  const countResult = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM user_news AS un
      JOIN articles AS a ON a.id = un.article_id
      JOIN search_requests AS sr ON sr.id = un.search_request_id
      WHERE un.user_id = $1
      ${whereSql}
    `,
    queryValues,
  );

  const total = Number(countResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listValues = [...queryValues, limit, offset];
  const { rows } = await pool.query<UserNewsRecord>(
    `
      SELECT
        a.id::text AS id,
        a.url::text AS url,
        a.source_name::text AS "sourceName",
        a.author::text AS author,
        a.title::text AS title,
        a.description::text AS description,
        a.published_at::text AS "publishedAt",
        un.keyword::text AS keyword,
        un.fetched_at::text AS "fetchedAt",
        sr.language::text AS language,
        un.search_request_id AS "searchRequestId"
      FROM user_news AS un
      JOIN articles AS a ON a.id = un.article_id
      JOIN search_requests AS sr ON sr.id = un.search_request_id
      WHERE un.user_id = $1
      ${whereSql}
      ORDER BY un.fetched_at DESC NULLS LAST, a.published_at DESC NULLS LAST, a.id DESC
      LIMIT $${listValues.length - 1}
      OFFSET $${listValues.length}
    `,
    listValues,
  );

  return {
    rows,
    total,
    page,
    limit,
    totalPages,
  };
}
