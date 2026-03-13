import * as schema from "./schema.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

function isNeonUrl(url: string) {
  return url.includes("neon.tech");
}

export async function createDatabase(connectionString: string): Promise<Database> {
  if (isNeonUrl(connectionString)) {
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const ws = await import("ws");
    neonConfig.webSocketConstructor = ws.default;
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const pool = new Pool({ connectionString });
    return drizzle(pool, { schema });
  }
  const pg = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new pg.default.Pool({ connectionString });
  return drizzle(pool, { schema });
}
