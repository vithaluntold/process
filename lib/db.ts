import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "@/shared/schema";
import WebSocket from "ws";

const databaseUrl = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_POOLED or DATABASE_URL must be set");
}

neonConfig.webSocketConstructor = WebSocket as any;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

const globalForDb = globalThis as typeof globalThis & { __neonPool?: Pool };
if (!globalForDb.__neonPool) {
  globalForDb.__neonPool = new Pool({
    connectionString: databaseUrl,
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    min: 0,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    maxUses: 750,
    keepAlive: true,
    keepAliveInitialDelayMillis: 1_000,
  });

  globalForDb.__neonPool.on("error", (err: Error) => {
    console.error("Unexpected Neon pool error", err);
  });

  process.once("beforeExit", async () => {
    await globalForDb.__neonPool?.end().catch(() => undefined);
  });
}

export const pool = globalForDb.__neonPool;
export const db = drizzle(pool, { schema });
