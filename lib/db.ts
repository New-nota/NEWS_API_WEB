import { Pool } from "pg";

declare global {
  var __newsDashboardPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

function clampMillis(raw: string | undefined, fallback: number): number {
  const value = Number(raw ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1000, Math.trunc(value));
}

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

export const pool =
  global.__newsDashboardPool ??
  new Pool({
    connectionString,
    connectionTimeoutMillis: clampMillis(process.env.DB_CONNECTION_TIMEOUT_MS, 5000),
    statement_timeout: clampMillis(process.env.DB_STATEMENT_TIMEOUT_MS, 10000),
    idleTimeoutMillis: clampMillis(process.env.DB_IDLE_TIMEOUT_MS, 10000),
  });

if (process.env.NODE_ENV !== "production") {
  global.__newsDashboardPool = pool;
}
