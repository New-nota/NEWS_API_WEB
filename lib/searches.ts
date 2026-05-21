import { pool } from "@/lib/db";
import type { AIReport } from "@/lib/ai-report";
import { AppError } from "@/lib/app-error";

export type SearchRequest = {
  id: number;
  user_id: number;
  keyword: string;
  language: string;
  limit_count: number;
  page_size: number;
  status: string;
  is_trial: boolean;
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
  ai_report: AIReport | null;
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

const AI_REPORT_JSON_SQL = `
  CASE
    WHEN air.search_request_id IS NULL THEN NULL
    ELSE json_build_object(
      'status', air.status,
      'error_text', air.error_text,
      'model_provider', air.model_provider,
      'model_name', air.model_name,
      'news_count', air.news_count,
      'summary', air.summary,
      'key_points', air.main_conclusions,
      'sentiment_label', air.sentiment_label,
      'sentiment_score', air.sentiment_score,
      'sentiment_distribution', air.sentiment_distribution,
      'main_topics', air.main_topics,
      'highlights', jsonb_build_array(air.highlight),
      'data_quality_warnings', air.data_quality_warnings,
      'created_at', air.created_at::text
    )
  END AS ai_report
`;

const TRIAL_LIMIT = parseInt(process.env.TRIAL_REQUEST_LIMIT ?? "3", 10);

export async function createSearchRequest(input: CreateSearchRequestInput): Promise<SearchRequest> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // FOR UPDATE лочит строку — без этого два параллельных запроса
    // могут оба прочитать trial_uses=2 и оба пройти, дав пользователю 4 trial
    const userRow = await client.query<{ trial_uses: number }>(
      "SELECT trial_uses FROM app_users WHERE id = $1 FOR UPDATE",
      [input.userId],
    );
    const trialUses = userRow.rows[0].trial_uses;

    // valid и exhausted = ключ есть и рабочий
    // pending_validation и invalid = ключа фактически нет, trial ещё можно тратить
    const keyRow = await client.query<{ status: string }>(
      "SELECT status FROM users_keys WHERE user_id = $1 AND service = 'news_api'",
      [input.userId],
    );
    const keyStatus = keyRow.rows[0]?.status ?? null;
    const hasUsableKey = keyStatus === "valid" || keyStatus === "exhausted";

    let isTrial: boolean;

    if (hasUsableKey) {
      isTrial = false;
    } else if (trialUses < TRIAL_LIMIT) {
      isTrial = true;
      await client.query(
        "UPDATE app_users SET trial_uses = trial_uses + 1 WHERE id = $1",
        [input.userId],
      );
    } else {
      throw new AppError(
        403,
        `Trial requests exhausted (${TRIAL_LIMIT}/${TRIAL_LIMIT}). Please add your NewsAPI key.`,
        "NEWS_API_KEY_REQUIRED",
      );
    }

    const { rows } = await client.query<SearchRequest>(
      `
        INSERT INTO search_requests (
          user_id, keyword, language, limit_count, page_size, status, is_trial
        )
        VALUES ($1, $2, $3, $4, $5, 'queued', $6)
        RETURNING
          id, user_id, keyword, language, limit_count, page_size,
          status, is_trial, error_text,
          created_at::text, started_at::text, finished_at::text
      `,
      [input.userId, input.keyword, input.language ?? "ru", input.limitCount, input.pageSize, isTrial],
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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
        COUNT(un.id)::int AS loaded_rows,
        ${AI_REPORT_JSON_SQL}
      FROM search_requests AS sr
      LEFT JOIN request_stats AS rs ON rs.search_request_id = sr.id
      LEFT JOIN user_news AS un ON un.search_request_id = sr.id
      LEFT JOIN request_ai_report AS air ON air.search_request_id = sr.id
      WHERE sr.id = $1 AND sr.user_id = $2
      GROUP BY
        sr.id,
        rs.search_request_id,
        rs.income_articles,
        rs.accepted_articles,
        rs.rejected_articles,
        rs.reasons_counts,
        rs.prime_reasons,
        air.search_request_id,
        air.status,
        air.error_text,
        air.model_provider,
        air.model_name,
        air.news_count,
        air.summary,
        air.main_conclusions,
        air.sentiment_label,
        air.sentiment_score,
        air.sentiment_distribution,
        air.main_topics,
        air.highlight,
        air.data_quality_warnings,
        air.created_at
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
