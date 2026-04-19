import { pool } from "@/lib/db";
import { newsColumnSql, newsTableSql } from "@/lib/schema";

export type AnalyticsResult = {
  cards: {
    totalNews: number;
    uniqueAuthors: number;
    uniqueKeywords: number;
    latestPublication: string | null;
  };
  byLanguage: Array<{ label: string; count: number }>;
  byAuthor: Array<{ label: string; count: number }>;
  byKeyword: Array<{ label: string; count: number }>;
  byDay: Array<{ label: string; count: number }>;
};

export async function getAnalytics(): Promise<AnalyticsResult> {
  const [cardsResult, byLanguageResult, byAuthorResult, byKeywordResult, byDayResult] =
    await Promise.all([
      pool.query<{
        total_news: string;
        unique_authors: string;
        unique_keywords: string;
        latest_publication: string | null;
      }>(
        `SELECT
          COUNT(*)::text AS total_news,
          COUNT(DISTINCT ${newsColumnSql.author})::text AS unique_authors,
          COUNT(DISTINCT ${newsColumnSql.keyword})::text AS unique_keywords,
          MAX(${newsColumnSql.publishedAt})::text AS latest_publication
        FROM ${newsTableSql}`,
      ),
      pool.query<{ label: string; count: string }>(
        `SELECT COALESCE(${newsColumnSql.language}::text, 'unknown') AS label, COUNT(*)::text AS count
         FROM ${newsTableSql}
         GROUP BY 1
         ORDER BY COUNT(*) DESC, 1 ASC`,
      ),
      pool.query<{ label: string; count: string }>(
        `SELECT COALESCE(${newsColumnSql.author}::text, 'unknown') AS label, COUNT(*)::text AS count
         FROM ${newsTableSql}
         GROUP BY 1
         ORDER BY COUNT(*) DESC, 1 ASC
         LIMIT 10`,
      ),
      pool.query<{ label: string; count: string }>(
        `SELECT COALESCE(${newsColumnSql.keyword}::text, 'unknown') AS label, COUNT(*)::text AS count
         FROM ${newsTableSql}
         GROUP BY 1
         ORDER BY COUNT(*) DESC, 1 ASC
         LIMIT 10`,
      ),
      pool.query<{ label: string; count: string }>(
        `SELECT DATE(${newsColumnSql.publishedAt})::text AS label, COUNT(*)::text AS count
         FROM ${newsTableSql}
         WHERE ${newsColumnSql.publishedAt} IS NOT NULL
         GROUP BY 1
         ORDER BY 1 DESC
         LIMIT 14`,
      ),
    ]);

  const cardsRow = cardsResult.rows[0];

  return {
    cards: {
      totalNews: Number(cardsRow?.total_news ?? 0),
      uniqueAuthors: Number(cardsRow?.unique_authors ?? 0),
      uniqueKeywords: Number(cardsRow?.unique_keywords ?? 0),
      latestPublication: cardsRow?.latest_publication ?? null,
    },
    byLanguage: byLanguageResult.rows.map((row) => ({ label: row.label, count: Number(row.count) })),
    byAuthor: byAuthorResult.rows.map((row) => ({ label: row.label, count: Number(row.count) })),
    byKeyword: byKeywordResult.rows.map((row) => ({ label: row.label, count: Number(row.count) })),
    byDay: byDayResult.rows
      .map((row) => ({ label: row.label, count: Number(row.count) }))
      .reverse(),
  };
}
