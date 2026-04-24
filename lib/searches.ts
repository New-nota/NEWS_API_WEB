import { pool } from "@/lib/db";

export type SearchRequest = {
  id: number;
  user_id: number;
  keyword: string;
  language: string;
  limit_count: number;
  page_size: number;
  status: string;
  error_text: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type SearchRequestDetails = SearchRequest & {
  income_articles: number | null;
  accepted_articles: number | null;
  rejected_articles: number | null;
  reasons_counts: unknown;
  prime_reasons: unknown;
  loaded_rows: number;
};

type CreateSearchRequestInput = {
  userId: number;
  keyword: string;
  language?: string;
  limitCount: number;
  pageSize: number;
};

function normalizeListLimit(limit: number) {
  if (!Number.isFinite(limit)) return 20;
  return Math.min(Math.max(Math.trunc(limit), 1), 100);
}

export async function createSearchRequest(input: CreateSearchRequestInput): Promise<SearchRequest> {
  const { rows } = await pool.query<SearchRequest>(
    `
      INSERT INTO search_requests (
        user_id,
        keyword,
        language,
        limit_count,
        page_size,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'queued')
      RETURNING
        id,
        user_id,
        keyword,
        language,
        limit_count,
        page_size,
        status,
        error_text,
        created_at::text,
        started_at::text,
        finished_at::text
    `,
    [input.userId, input.keyword, input.language ?? "ru", input.limitCount, input.pageSize],
  );

  return rows[0];
}

export async function getSearchRequestByIdForUser(
  searchRequestId: number,
  userId: number,
): Promise<SearchRequestDetails | null> {
  const { rows } = await pool.query<SearchRequestDetails>(
    `
      SELECT
        sr.id,
        sr.user_id,
        sr.keyword,
        sr.language,
        sr.limit_count,
        sr.page_size,
        sr.status,
        sr.error_text,
        sr.created_at::text,
        sr.started_at::text,
        sr.finished_at::text,
        rs.income_articles,
        rs.accepted_articles,
        rs.rejected_articles,
        rs.reasons_counts,
        rs.prime_reasons,
        COUNT(un.id)::int AS loaded_rows
      FROM search_requests AS sr
      LEFT JOIN request_stats AS rs ON rs.search_request_id = sr.id
      LEFT JOIN user_news AS un ON un.search_request_id = sr.id
      WHERE sr.id = $1 AND sr.user_id = $2
      GROUP BY
        sr.id,
        rs.search_request_id,
        rs.income_articles,
        rs.accepted_articles,
        rs.rejected_articles,
        rs.reasons_counts,
        rs.prime_reasons
      LIMIT 1
    `,
    [searchRequestId, userId],
  );

  return rows[0] ?? null;
}

export async function listSearchRequestsForUser(userId: number, limit = 20): Promise<SearchRequest[]> {
  const normalizedLimit = normalizeListLimit(limit);

  const { rows } = await pool.query<SearchRequest>(
    `
      SELECT
        sr.id,
        sr.user_id,
        sr.keyword,
        sr.language,
        sr.limit_count,
        sr.page_size,
        sr.status,
        sr.error_text,
        sr.created_at::text,
        sr.started_at::text,
        sr.finished_at::text
      FROM search_requests AS sr
      WHERE sr.user_id = $1
      ORDER BY sr.created_at DESC
      LIMIT $2
    `,
    [userId, normalizedLimit],
  );

  return rows;
}
