import { Pool } from "pg";

declare global {
  var __newsDashboardPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;
const connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? 5000);
const statementTimeout = Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 10000);
const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS ?? 10000);

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

export const pool =
  global.__newsDashboardPool ??
  new Pool({
    connectionString,
    // connectionTimeoutMillis: Number.isFinite(connectionTimeoutMillis)
    //   ? Math.max(1000, Math.trunc(connectionTimeoutMillis))
    //   : 5000,
    // statement_timeout: Number.isFinite(statementTimeout)
    //   ? Math.max(1000, Math.trunc(statementTimeout))
    //   : 10000,
    // idleTimeoutMillis: Number.isFinite(idleTimeoutMillis)
    //   ? Math.max(1000, Math.trunc(idleTimeoutMillis))
    //   : 10000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__newsDashboardPool = pool;
}
