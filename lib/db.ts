import { Pool, type QueryResultRow } from "pg";

declare global {
  var financePool: Pool | undefined;
  var financeSchemaPromise: Promise<void> | undefined;
}

function getPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.financePool) {
    global.financePool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost")
        ? false
        : {
            rejectUnauthorized: false,
          },
    });
  }

  return global.financePool;
}

export async function ensureSchema() {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  if (!global.financeSchemaPromise) {
    global.financeSchemaPromise = (async () => {
      const pool = getPool();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS incomes (
          id BIGSERIAL PRIMARY KEY,
          month DATE NOT NULL,
          source TEXT NOT NULL DEFAULT '',
          amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
          note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT '',
          monthly_limit NUMERIC(12, 2) NOT NULL CHECK (monthly_limit >= 0),
          note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id BIGSERIAL PRIMARY KEY,
          budget_id BIGINT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
          spent_on DATE NOT NULL,
          description TEXT NOT NULL,
          amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
          note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS incomes_month_idx ON incomes (month);
        CREATE INDEX IF NOT EXISTS expenses_spent_on_idx ON expenses (spent_on DESC);
        CREATE INDEX IF NOT EXISTS expenses_budget_id_idx ON expenses (budget_id);
      `);
    })();
  }

  await global.financeSchemaPromise;
  return true;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
) {
  await ensureSchema();
  return getPool().query<T>(text, params);
}
