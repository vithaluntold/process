import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import * as schema from "@/shared/schema";
import WebSocket from "ws";

type DrizzleDB = ReturnType<typeof drizzleNeon<typeof schema>> | ReturnType<typeof drizzleNode<typeof schema>>;
type PoolType = NeonPool | PgPool;

const globalForDb = globalThis as typeof globalThis & { 
  __dbPool?: PoolType;
  __drizzleDb?: DrizzleDB;
};

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL ?? null;
}

function isNeonDatabase(url: string): boolean {
  return url.includes('neon.tech') || url.includes('neon.');
}

function initializePool(): PoolType | null {
  const databaseUrl = getDatabaseUrl();
  
  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      console.warn('[DB] DATABASE_URL not set - database features will be unavailable');
    }
    return null;
  }

  if (isNeonDatabase(databaseUrl)) {
    neonConfig.webSocketConstructor = WebSocket as any;
    neonConfig.useSecureWebSocket = true;
    neonConfig.pipelineTLS = false;
    neonConfig.pipelineConnect = false;

    const pool = new NeonPool({
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

    console.log('[DB] Using Neon serverless driver');
    return pool;
  } else {
    // Railway PostgreSQL configuration with optimized timeouts
    const pool = new PgPool({
      connectionString: databaseUrl,
      max: process.env.NODE_ENV === "production" ? 10 : 3,
      min: 1, // Keep at least 1 connection alive
      idleTimeoutMillis: 30_000, // 30 seconds
      connectionTimeoutMillis: 15_000, // 15 seconds for Railway
      query_timeout: 30_000, // 30 seconds for queries
      statement_timeout: 30_000, // 30 seconds for statements
      ssl: process.env.NODE_ENV === "production" ? {
        rejectUnauthorized: false // Railway requires this for SSL
      } : false,
    });

    pool.on("error", (err: Error) => {
      console.error("Unexpected PostgreSQL pool error", err);
    });

    pool.on("connect", () => {
      console.log('[DB] PostgreSQL pool connected successfully');
    });

    console.log('[DB] Using standard PostgreSQL driver');
    return pool;
  }
}

function getPool(): PoolType {
  if (!globalForDb.__dbPool) {
    const pool = initializePool();
    if (!pool) {
      throw new Error("DATABASE_URL_POOLED or DATABASE_URL must be set. Please configure your database connection.");
    }
    globalForDb.__dbPool = pool;
  }
  return globalForDb.__dbPool;
}

function getDb(): DrizzleDB {
  if (!globalForDb.__drizzleDb) {
    const pool = getPool();
    const databaseUrl = getDatabaseUrl()!;
    
    if (isNeonDatabase(databaseUrl)) {
      globalForDb.__drizzleDb = drizzleNeon(pool as NeonPool, { schema });
    } else {
      globalForDb.__drizzleDb = drizzleNode(pool as PgPool, { schema });
    }
  }
  return globalForDb.__drizzleDb;
}

export const pool = new Proxy({} as PoolType, {
  get(target, prop, receiver) {
    const actualPool = getPool();
    const value = Reflect.get(actualPool, prop, actualPool);
    if (typeof value === 'function') {
      return value.bind(actualPool);
    }
    return value;
  },
});

export const db = new Proxy({} as DrizzleDB, {
  get(target, prop, receiver) {
    const actualDb = getDb();
    const value = Reflect.get(actualDb, prop, actualDb);
    if (typeof value === 'function') {
      return value.bind(actualDb);
    }
    return value;
  },
});
