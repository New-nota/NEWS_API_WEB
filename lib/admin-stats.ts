import "server-only";
import { Pool } from "pg";

/**
 * Singleton pg pool. Reuses the connection across hot-reloads in dev so you
 * don't exhaust Postgres connections. Uses the same DATABASE_URL your app
 * already connects with. Swap for your shared pool if you have one.
 */
const globalForPg = globalThis as unknown as { _adminPgPool?: Pool };

const pool =
  globalForPg._adminPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForPg._adminPgPool = pool;

async function q<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

// Your real status vocabulary
const SUCCESS = `'success'`;
const ERROR = `('error','failed')`;
const PENDING = `('queued','running','processing','pending')`;

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

export async function getAdminStats() {
  const [
    kpisRows,
    topKeywords,
    topUsers,
    requestsPerDay,
    statusBreakdown,
    timingRows,
    tokensPerDay,
    sentiment,
    signupsPerDay,
    recentRequests,
    usersDetail,
  ] = await Promise.all([
    // ---- KPI block (single round-trip) ----
    q(`SELECT
        (SELECT count(*)::int FROM app_users) AS total_users,
        (SELECT count(*)::int FROM app_users WHERE last_login_at > now() - interval '7 days')  AS active_7d,
        (SELECT count(*)::int FROM app_users WHERE last_login_at > now() - interval '30 days') AS active_30d,
        (SELECT count(*)::int FROM app_users WHERE created_at    > now() - interval '7 days')  AS new_users_7d,
        (SELECT count(*)::int FROM search_requests) AS total_requests,
        (SELECT count(*)::int FROM search_requests WHERE created_at > now() - interval '7 days') AS requests_7d,
        (SELECT count(*)::int FROM search_requests WHERE status = ${SUCCESS}) AS requests_done,
        (SELECT count(*)::int FROM search_requests WHERE status IN ${ERROR}) AS requests_error,
        (SELECT count(*)::int FROM search_requests WHERE status IN ${PENDING}) AS requests_pending,
        (SELECT count(*)::int FROM request_ai_report) AS total_reports,
        (SELECT coalesce(sum(total_tokens),0)::bigint FROM request_ai_report) AS total_tokens,
        (SELECT count(*)::int FROM articles) AS total_articles,
        (SELECT count(*)::int FROM search_requests WHERE is_trial = true) AS trial_requests
      `),

    // ---- Most frequent search keywords ----
    q(`SELECT lower(keyword) AS keyword, count(*)::int AS c
         FROM search_requests
        WHERE keyword IS NOT NULL AND keyword <> ''
        GROUP BY lower(keyword)
        ORDER BY c DESC
        LIMIT 20`),

    // ---- Top users by request volume ----
    q(`SELECT coalesce(u.email, 'unknown') AS email, count(*)::int AS c
         FROM search_requests s
         LEFT JOIN app_users u ON u.id = s.user_id
        GROUP BY u.email
        ORDER BY c DESC
        LIMIT 10`),

    // ---- Requests per day (last 30 days) ----
    q(`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*)::int AS c
         FROM search_requests
        WHERE created_at > now() - interval '30 days'
        GROUP BY 1 ORDER BY 1`),

    // ---- Status breakdown (current queue health) ----
    q(`SELECT coalesce(status, '(null)') AS status, count(*)::int AS c
         FROM search_requests
        GROUP BY status
        ORDER BY c DESC`),

    // ---- Processing time for completed requests ----
    q(`SELECT
          round(avg(extract(epoch FROM (finished_at - started_at)))::numeric, 1) AS avg_seconds,
          round(max(extract(epoch FROM (finished_at - started_at)))::numeric, 1) AS max_seconds
         FROM search_requests
        WHERE status = ${SUCCESS} AND finished_at IS NOT NULL AND started_at IS NOT NULL`),

    // ---- Token usage per day (Mistral cost proxy) ----
    q(`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
              coalesce(sum(total_tokens), 0)::bigint AS tokens
         FROM request_ai_report
        WHERE created_at > now() - interval '30 days'
        GROUP BY 1 ORDER BY 1`),

    // ---- Sentiment distribution across AI reports ----
    q(`SELECT coalesce(sentiment_label, '(none)') AS label, count(*)::int AS c
         FROM request_ai_report
        GROUP BY sentiment_label
        ORDER BY c DESC`),

    // ---- New signups per day (last 30 days) ----
    q(`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*)::int AS c
         FROM app_users
        WHERE created_at > now() - interval '30 days'
        GROUP BY 1 ORDER BY 1`),

    // ---- Live feed: most recent requests ----
    q(`SELECT s.id::int AS id,
              s.keyword,
              s.status,
              s.is_trial,
              to_char(s.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
              coalesce(u.email, '—') AS email
         FROM search_requests s
         LEFT JOIN app_users u ON u.id = s.user_id
        ORDER BY s.created_at DESC
        LIMIT 15`),

    // ---- Per-user breakdown (each user with their own stats) ----
    q(`SELECT
          u.id::int AS id,
          coalesce(u.email, '—') AS email,
          coalesce(u.name, '—')  AS name,
          coalesce(u.trial_uses, 0) AS trial_uses,
          to_char(u.created_at, 'YYYY-MM-DD') AS created_at,
          to_char(u.last_login_at, 'YYYY-MM-DD HH24:MI') AS last_login_at,
          count(s.id)::int AS requests,
          count(s.id) FILTER (WHERE s.status = ${SUCCESS})::int AS success,
          count(s.id) FILTER (WHERE s.status IN ${ERROR})::int  AS errors
         FROM app_users u
         LEFT JOIN search_requests s ON s.user_id = u.id
        GROUP BY u.id, u.email, u.name, u.trial_uses, u.created_at, u.last_login_at
        ORDER BY requests DESC, u.created_at DESC`),
  ]);

  return {
    kpis: kpisRows[0] as Record<string, unknown>,
    topKeywords: topKeywords as { keyword: string; c: number }[],
    topUsers: topUsers as { email: string; c: number }[],
    requestsPerDay: requestsPerDay as { day: string; c: number }[],
    statusBreakdown: statusBreakdown as { status: string; c: number }[],
    timing: (timingRows[0] ?? {}) as Record<string, unknown>,
    tokensPerDay: tokensPerDay as { day: string; tokens: string }[],
    sentiment: sentiment as { label: string; c: number }[],
    signupsPerDay: signupsPerDay as { day: string; c: number }[],
    recentRequests: recentRequests as {
      id: number;
      keyword: string;
      status: string;
      is_trial: boolean;
      created_at: string;
      email: string;
    }[],
    usersDetail: usersDetail as {
      id: number;
      email: string;
      name: string;
      trial_uses: number;
      created_at: string;
      last_login_at: string | null;
      requests: number;
      success: number;
      errors: number;
    }[],
  };
}
