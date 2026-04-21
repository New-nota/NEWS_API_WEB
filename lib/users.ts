import { pool } from "@/lib/db";

type GoogleProfileInput = {
    googleSub: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
};

export async function upsertUserFromGoogleProfile(input: GoogleProfileInput) {
    const query = `
    INSERT INTO app_users (
    google_sub,
    email,
    name,
    image_url,
    last_login_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (google_sub) DO UPDATE
    SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    image_url = EXCLUDED.image_url,
    last_login_at = NOW()
    RETURNING id, google_sub, email, name, image_url, created_at, last_login_at
    `;
    const { rows } = await pool.query(query, [input.googleSub, input.email, input.name, input.imageUrl,]);
    return rows[0];
};

export async function getUserByGoogleSub(googleSub: string) {
    const { rows } = await pool.query (
        `
        SELECT id, google_sub, email, name, image_url, created_at, last_login_at
        FROM app_users
        WHERE google_sub = $1
        LIMIT 1
        `, [googleSub]
    );
    return rows[0] ?? null;
};

export async function getCurrentAppUser() {
    const { auth } = await import("@/auth");
    const session = await auth();

    const googleSub = session?.user?.googleSub;
    if (!googleSub) return null;

    return getUserByGoogleSub(googleSub);
}