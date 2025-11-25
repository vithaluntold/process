import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@/shared/schema";
import WebSocket from "ws";

const globalForDb = globalThis as typeof globalThis & { 
  __neonPool?: Pool;
  __dbInitialized?: boolean;
};

function initializePool(): Pool {
  const databaseUrl = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_POOLED or DATABASE_URL must be set");
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
    globalForDb.__neonPool = initializePool();
  }
  return globalForDb.__neonPool;
}

export const pool = new Proxy({} as Pool, {
  get(_, prop) {
    return (getPool() as any)[prop];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    const actualPool = getPool();
    const actualDb = drizzle(actualPool, { schema });
    return (actualDb as any)[prop];
  },
});
