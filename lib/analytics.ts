import { pool } from "@/lib/db";

export type UserAnalyticsResult = {
  summary: {
    total_user_news: number;
    unique_articles: number;
  };
  keywords: Array<{ keyword: string | null; count: number }>;
  sources: Array<{ source_name: string | null; count: number }>;
  requests: {
    queued_count: number;
    running_count: number;
    success_count: number;
    failed_count: number;
    total_income_articles: number;
    total_accepted_articles: number;
    total_rejected_articles: number;
  };
};

export async function getAnalyticsForUser(userId: number): Promise<UserAnalyticsResult> {
  const [summary, keywords, sources, requests] = await Promise.all([
    pool.query<{ total_user_news: number; unique_articles: number }>(
      `
        SELECT
          COUNT(*)::int AS total_user_news,
          COUNT(DISTINCT un.article_id)::int AS unique_articles
        FROM user_news AS un
        WHERE un.user_id = $1
      `,
      [userId],
    ),
    pool.query<{ keyword: string | null; count: number }>(
      `
        SELECT
          un.keyword,
          COUNT(*)::int AS count
        FROM user_news AS un
        WHERE un.user_id = $1
        GROUP BY un.keyword
        ORDER BY count DESC
        LIMIT 10
      `,
      [userId],
    ),
    pool.query<{ source_name: string | null; count: number }>(
      `
        SELECT
          a.source_name,
          COUNT(*)::int AS count
        FROM user_news AS un
        JOIN articles AS a ON a.id = un.article_id
        WHERE un.user_id = $1
        GROUP BY a.source_name
        ORDER BY count DESC
        LIMIT 10
      `,
      [userId],
    ),
    pool.query<{
      queued_count: number;
      running_count: number;
      success_count: number;
      failed_count: number;
      total_income_articles: number;
      total_accepted_articles: number;
      total_rejected_articles: number;
    }>(
      `
        SELECT
          COUNT(*) FILTER (WHERE sr.status = 'queued')::int AS queued_count,
          COUNT(*) FILTER (WHERE sr.status = 'running')::int AS running_count,
          COUNT(*) FILTER (WHERE sr.status = 'success')::int AS success_count,
          COUNT(*) FILTER (WHERE sr.status = 'failed')::int AS failed_count,
          COALESCE(SUM(rs.income_articles), 0)::int AS total_income_articles,
          COALESCE(SUM(rs.accepted_articles), 0)::int AS total_accepted_articles,
          COALESCE(SUM(rs.rejected_articles), 0)::int AS total_rejected_articles
        FROM search_requests AS sr
        LEFT JOIN request_stats AS rs ON rs.search_request_id = sr.id
        WHERE sr.user_id = $1
      `,
      [userId],
    ),
  ]);

  return {
    summary: summary.rows[0] ?? { total_user_news: 0, unique_articles: 0 },
    keywords: keywords.rows,
    sources: sources.rows,
    requests: requests.rows[0] ?? {
      queued_count: 0,
      running_count: 0,
      success_count: 0,
      failed_count: 0,
      total_income_articles: 0,
      total_accepted_articles: 0,
      total_rejected_articles: 0,
    },
  };
}
