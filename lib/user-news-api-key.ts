import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { pool } from "@/lib/db";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const NEWSAPI_SERVICE = "news_api";

export type NewsApiKeyStatus = {
  hasNewsApiKey: boolean;
  last4: string | null;
  updatedAt: string | null;
};

type EncryptedUserKey = {
  encryptedKey: string;
  iv: string;
  authTag: string;
};

type UserKeyRow = {
  encrypted_key: string;
  iv: string;
  auth_tag: string;
};

function getEncryptionKey() {
  const secret = process.env.NEWS_API_KEY_ENCRYPTION_SECRET ?? process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("NEWS_API_KEY_ENCRYPTION_SECRET or AUTH_SECRET must be set to store user keys.");
  }

  return createHash("sha256").update(secret).digest();
}

function encryptUserKey(apiKey: string): EncryptedUserKey {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptUserKey(row: UserKeyRow): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(row.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(row.auth_tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(row.encrypted_key, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getNewsApiKeyStatusForUser(userId: number): Promise<NewsApiKeyStatus> {
  const { rows } = await pool.query<NewsApiKeyStatus>(
    `
      SELECT
        TRUE AS "hasNewsApiKey",
        key_last4 AS "last4",
        updated_at::text AS "updatedAt"
      FROM users_keys
      WHERE user_id = $1 AND service = $2
      LIMIT 1
    `,
    [userId, NEWSAPI_SERVICE],
  );

  return rows[0] ?? { hasNewsApiKey: false, last4: null, updatedAt: null };
}

export async function hasNewsApiKeyForUser(userId: number): Promise<boolean> {
  const { rows } = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM users_keys
        WHERE user_id = $1 AND service = $2
      ) AS exists
    `,
    [userId, NEWSAPI_SERVICE],
  );

  return rows[0]?.exists ?? false;
}

export async function saveNewsApiKeyForUser(
  userId: number,
  apiKey: string,
): Promise<NewsApiKeyStatus> {
  const encrypted = encryptUserKey(apiKey);
  const last4 = apiKey.slice(-4);

  const { rows } = await pool.query<NewsApiKeyStatus>(
    `
      INSERT INTO users_keys (
        user_id,
        service,
        encrypted_key,
        iv,
        auth_tag,
        key_last4,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, service) DO UPDATE
      SET
        encrypted_key = EXCLUDED.encrypted_key,
        iv = EXCLUDED.iv,
        auth_tag = EXCLUDED.auth_tag,
        key_last4 = EXCLUDED.key_last4,
        updated_at = NOW()
      RETURNING
        TRUE AS "hasNewsApiKey",
        key_last4 AS "last4",
        updated_at::text AS "updatedAt"
    `,
    [
      userId,
      NEWSAPI_SERVICE,
      encrypted.encryptedKey,
      encrypted.iv,
      encrypted.authTag,
      last4,
    ],
  );

  return rows[0];
}

export async function deleteNewsApiKeyForUser(userId: number): Promise<NewsApiKeyStatus> {
  await pool.query(
    `
      DELETE FROM users_keys
      WHERE user_id = $1 AND service = $2
    `,
    [userId, NEWSAPI_SERVICE],
  );

  return { hasNewsApiKey: false, last4: null, updatedAt: null };
}

export async function getDecryptedNewsApiKeyForUser(userId: number): Promise<string | null> {
  const { rows } = await pool.query<UserKeyRow>(
    `
      SELECT encrypted_key, iv, auth_tag
      FROM users_keys
      WHERE user_id = $1 AND service = $2
      LIMIT 1
    `,
    [userId, NEWSAPI_SERVICE],
  );

  const row = rows[0];
  return row ? decryptUserKey(row) : null;
}