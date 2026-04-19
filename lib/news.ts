import { pool } from "@/lib/db";
import { newsColumnSql, newsTableSql } from "@/lib/schema";

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

export type NewsListResult = {
  rows: NewsRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  options: {
    keywords: string[];
    authors: string[];
    languages: string[];
  };
};

function sanitizePage(value?: number): number {
  if (!value || Number.isNaN(value) || value < 1) return 1;
  return Math.floor(value);
}

function sanitizeLimit(value?: number): number {
  if (!value || Number.isNaN(value)) return 20;
  return Math.min(Math.max(Math.floor(value), 1), 100);
}

function buildWhere(filters: NewsFilters) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (filters.keyword) {
    values.push(filters.keyword);
    conditions.push(`${newsColumnSql.keyword} = $${values.length}`);
  }

  if (filters.author) {
    values.push(filters.author);
    conditions.push(`${newsColumnSql.author} = $${values.length}`);
  }

  if (filters.language) {
    values.push(filters.language);
    conditions.push(`${newsColumnSql.language} = $${values.length}`);
  }

  if (filters.q) {
    values.push(`%${filters.q}%`);
    conditions.push(
      `(${newsColumnSql.title} ILIKE $${values.length} OR COALESCE(${newsColumnSql.description}, '') ILIKE $${values.length})`,
    );
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

async function getFilterOptions() {
  const [keywordsResult, authorsResult, languagesResult] = await Promise.all([
    pool.query<{ value: string }>(
      `SELECT DISTINCT ${newsColumnSql.keyword} AS value
       FROM ${newsTableSql}
       WHERE ${newsColumnSql.keyword} IS NOT NULL
       ORDER BY 1
       LIMIT 100`,
    ),
    pool.query<{ value: string }>(
      `SELECT DISTINCT ${newsColumnSql.author} AS value
       FROM ${newsTableSql}
       WHERE ${newsColumnSql.author} IS NOT NULL
       ORDER BY 1
       LIMIT 100`,
    ),
    pool.query<{ value: string }>(
      `SELECT DISTINCT ${newsColumnSql.language} AS value
       FROM ${newsTableSql}
       WHERE ${newsColumnSql.language} IS NOT NULL
       ORDER BY 1
       LIMIT 50`,
    ),
  ]);

  return {
    keywords: keywordsResult.rows.map((row) => row.value),
    authors: authorsResult.rows.map((row) => row.value),
    languages: languagesResult.rows.map((row) => row.value),
  };
}

export async function listNews(filters: NewsFilters): Promise<NewsListResult> {
  const page = sanitizePage(filters.page);
  const limit = sanitizeLimit(filters.limit);
  const offset = (page - 1) * limit;

  const { whereSql, values } = buildWhere(filters);

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM ${newsTableSql}
     ${whereSql}`,
    values,
  );

  const total = Number(countResult.rows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const listValues = [...values, limit, offset];
  const rowsResult = await pool.query<NewsRecord>(
    `SELECT
       ${newsColumnSql.id}::text AS id,
       ${newsColumnSql.title}::text AS title,
       ${newsColumnSql.description}::text AS description,
       ${newsColumnSql.author}::text AS author,
       ${newsColumnSql.url}::text AS url,
       ${newsColumnSql.publishedAt}::text AS "publishedAt",
       ${newsColumnSql.fetchedAt}::text AS "fetchedAt",
       ${newsColumnSql.keyword}::text AS keyword,
       ${newsColumnSql.language}::text AS language
     FROM ${newsTableSql}
     ${whereSql}
     ORDER BY ${newsColumnSql.publishedAt} DESC NULLS LAST, ${newsColumnSql.id} DESC
     LIMIT $${listValues.length - 1}
     OFFSET $${listValues.length}`,
    listValues,
  );

  const options = await getFilterOptions();

  return {
    rows: rowsResult.rows,
    total,
    page,
    limit,
    totalPages,
    options,
  };
}
