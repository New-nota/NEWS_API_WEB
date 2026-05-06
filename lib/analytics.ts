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
  ai: {
    total_reports: number;
    failed_reports: number;
    avg_sentiment_score: number | null;
    positive_count: number;
    neutral_positive_count: number;
    neutral_count: number;
    neutral_negative_count: number;
    negative_count: number;
    top_topics: Array<{
      topic: string;
      count: number;
    }>;
  };
};

export async function getAnalyticsForUser(userId: number): Promise<UserAnalyticsResult> {
  const [summary, keywords, sources, requests, aiStats, aiTopics] = await Promise.all([
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
    pool.query<{
      total_reports: number;
      failed_reports: number;
      avg_sentiment_score: number | null;
      positive_count: number;
      neutral_positive_count: number;
      neutral_count: number;
      neutral_negative_count: number;
      negative_count: number;
    }>(
      `
        SELECT
          COUNT(*) FILTER (WHERE air.status = 'success')::int AS total_reports,
          COUNT(*) FILTER (WHERE air.status = 'failed')::int AS failed_reports,
          AVG(air.sentiment_score) FILTER (WHERE air.status = 'success')::float AS avg_sentiment_score,
          COUNT(*) FILTER (WHERE air.sentiment_label = 'positive')::int AS positive_count,
          COUNT(*) FILTER (WHERE air.sentiment_label = 'neutral_positive')::int AS neutral_positive_count,
          COUNT(*) FILTER (WHERE air.sentiment_label = 'neutral')::int AS neutral_count,
          COUNT(*) FILTER (WHERE air.sentiment_label = 'neutral_negative')::int AS neutral_negative_count,
          COUNT(*) FILTER (WHERE air.sentiment_label = 'negative')::int AS negative_count
        FROM request_ai_report AS air
        JOIN search_requests AS sr ON sr.id = air.search_request_id
        WHERE sr.user_id = $1
      `,
      [userId],
    ),
    pool.query<{ topic: string; count: number }>(
      `
        SELECT
          topic::text AS topic,
          COUNT(*)::int AS count
        FROM request_ai_report AS air
        JOIN search_requests AS sr ON sr.id = air.search_request_id
        CROSS JOIN LATERAL jsonb_array_elements_text(air.main_topics) AS topic
        WHERE sr.user_id = $1
          AND air.status = 'success'
        GROUP BY topic
        ORDER BY count DESC
        LIMIT 10
      `,
      [userId],
    ),
  ]);

  const aiRow = aiStats.rows[0] ?? {
    total_reports: 0,
    failed_reports: 0,
    avg_sentiment_score: null,
    positive_count: 0,
    neutral_positive_count: 0,
    neutral_count: 0,
    neutral_negative_count: 0,
    negative_count: 0,
  };

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
    ai: {
      total_reports: aiRow.total_reports,
      failed_reports: aiRow.failed_reports,
      avg_sentiment_score: aiRow.avg_sentiment_score,
      positive_count: aiRow.positive_count,
      neutral_positive_count: aiRow.neutral_positive_count,
      neutral_count: aiRow.neutral_count,
      neutral_negative_count: aiRow.neutral_negative_count,
      negative_count: aiRow.negative_count,
      top_topics: aiTopics.rows,
    },
  };
}
