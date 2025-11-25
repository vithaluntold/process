import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@/shared/schema";
import WebSocket from "ws";

const globalForDb = globalThis as typeof globalThis & { 
  __neonPool?: Pool;
  __drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL ?? null;
}

function initializePool(): Pool | null {
  const databaseUrl = getDatabaseUrl();
  
  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.warn('[DB] DATABASE_URL not set - database features will be unavailable');
    }
    return null;
  }

  neonConfig.webSocketConstructor = WebSocket as any;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;

  const pool = new Pool({
    connectionString: databaseUrl,
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    min: 0,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    maxUses: 750,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1_000,
  });

  pool.on("error", (err: Error) => {
    console.error("Unexpected Neon pool error", err);
  });

  process.once("beforeExit", async () => {
    await pool?.end().catch(() => undefined);
  });

  return pool;
}

function getPool(): Pool {
  if (!globalForDb.__neonPool) {
    const pool = initializePool();
    if (!pool) {
      throw new Error("DATABASE_URL_POOLED or DATABASE_URL must be set. Please configure your database connection.");
    }
    globalForDb.__neonPool = pool;
  }
  return globalForDb.__neonPool;
}

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!globalForDb.__drizzleDb) {
    const pool = getPool();
    globalForDb.__drizzleDb = drizzle(pool, { schema });
  }
  return globalForDb.__drizzleDb;
}

export const pool = new Proxy({} as Pool, {
  get(target, prop, receiver) {
    const actualPool = getPool();
    const value = Reflect.get(actualPool, prop, actualPool);
    if (typeof value === 'function') {
      return value.bind(actualPool);
    }
    return value;
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(target, prop, receiver) {
    const actualDb = getDb();
    const value = Reflect.get(actualDb, prop, actualDb);
    if (typeof value === 'function') {
      return value.bind(actualDb);
    }
    return value;
  },
});
