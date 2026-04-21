import { pool } from "@/lib/db";

type CreateSearchRequestInput = {
    userId: number;
    keyword: string;
    language?: string;
    limitCount: number;
    pageSize: number;
};

export async function createSearchRequest(input: CreateSearchRequestInput) {
    const { rows } = await pool.query (
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
        RETURNING id, user_id, keyword, language, limit_count, page_size, status, created_at
        `,
        [input.userId, input.keyword, input.language ?? "ru", input.limitCount, input.pageSize]
    );
    return rows[0];
}

export async function getSearchRequestByIdForUser(searchRequestId: number, userId: number) {
    const { rows } = await pool.query(
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
        sr.created_at,
        sr.started_at,
        sr.finished_at,
        rs.income_articles,
        rs.accepted_articles,
        rs.rejected_articles,
        rs.reasons_counts,
        rs.prime_reason,
        COUNT(un.id)::int AS loaded_rows 
        FROM search_requests as sr LEFT JOIN request_stats as rs 
        ON rs.search_request_id = sr.id
        LEFT JOIN user_news as un ON un.search_request_id = sr.id
        WHERE sr.id = $1 AND sr.user_id = $2
        GROUP BY
        sr.id, rs.search_request_id, rs.income_articles, rs.accepted_articles,
        rs.rejected_articles, rs.reasons_counts, rs.prime_reason
        LIMIT 1
        `, [searchRequestId, userId]
    );
    return rows[0] ?? null;
}


export async function listSearchRequestsForUser(userId: number, limit = 20) {
    const { rows } = await pool.query(
        `
        SELECT
        sr.id,
        sr.keyword,
        sr.language,
        sr.page_size,
        sr.status,
        sr.error_text,
        sr.created_at,
        sr.started_at,
        sr.finished_at,
        rs.income_articles,
        rs.accepted_articles,
        rs.rejected_articles
        FROM search_requests as sr LEFT JOIN request_stats as rs
        ON rs.search_request_id = sr.id
        WHERE sr.user_id = $1
        ORDER BY sr.created_at DESC
        LIMIT $2
        `,
        [userId, limit]
    );
    return rows;
}
