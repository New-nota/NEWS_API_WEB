import { pool } from "@/lib/db";
import { cache } from "react";

export type AppUser = {
  id: number;
  google_sub: string;
  email: string;
  name: string | null;
  image_url: string | null;
  created_at: string;
  last_login_at: string;
};

const getCachedAuthSession = cache(async () => {
  const { auth } = await import("@/auth");
  return auth();
});

type GoogleProfileInput = {
  googleSub: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
};

function parsePositiveInteger(input: unknown): number | null {
  const value = typeof input === "number" ? input : typeof input === "string" ? Number(input) : Number.NaN;
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export async function upsertUserFromGoogleProfile(input: GoogleProfileInput): Promise<AppUser> {
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
    RETURNING id, google_sub, email, name, image_url, created_at::text, last_login_at::text
  `;

  const { rows } = await pool.query<AppUser>(query, [
    input.googleSub,
    input.email,
    input.name,
    input.imageUrl,
  ]);

  return rows[0];
}

export async function getUserByGoogleSub(googleSub: string): Promise<AppUser | null> {
  const { rows } = await pool.query<AppUser>(
    `
      SELECT id, google_sub, email, name, image_url, created_at::text, last_login_at::text
      FROM app_users
      WHERE google_sub = $1
      LIMIT 1
    `,
    [googleSub],
  );
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<AppUser | null> {
  const { rows } = await pool.query<AppUser>(
    `
      SELECT id, google_sub, email, name, image_url, created_at::text, last_login_at::text
      FROM app_users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return rows[0] ?? null;
}

export async function resolveAppUserIdFromSessionUser(user: {
  appUserId?: unknown;
  googleSub?: unknown;
}): Promise<number | null> {
  const fromToken = parsePositiveInteger(user.appUserId);
  if (fromToken) return fromToken;

  if (typeof user.googleSub !== "string" || user.googleSub.length === 0) {
    return null;
  }

  const appUser = await getUserByGoogleSub(user.googleSub);
  return appUser?.id ?? null;
}

export async function getCurrentAppUserId(): Promise<number | null> {
  const session = await getCachedAuthSession();

  if (!session?.user) return null;
  return resolveAppUserIdFromSessionUser({
    appUserId: session.user.appUserId,
    googleSub: session.user.googleSub,
  });
}

export async function getCurrentSession() {
  return getCachedAuthSession();
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const appUserId = await getCurrentAppUserId();
  if (!appUserId) return null;
  return getUserById(appUserId);
}
