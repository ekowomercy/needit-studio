import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | null = null;
let db: Database | null = null;

/** Create the Drizzle database from a Postgres connection string. */
export function createDatabase(config?: PoolConfig): Database {
  return drizzle(new Pool(config), { schema });
}

/** Singleton pool backed by DATABASE_URL (or explicit config). */
export function getDatabase(config?: PoolConfig): Database {
  if (!db) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...config,
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export * as schema from './schema';
export * from './schema';
export * from './ids';