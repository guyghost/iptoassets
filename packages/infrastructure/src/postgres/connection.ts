import * as schema from "./schema.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

function isNeonUrl(url: string) {
  return url.includes("neon.tech");
}

export async function createDatabase(connectionString: string): Promise<Database> {
  if (isNeonUrl(connectionString)) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const sql = neon(connectionString);
    return drizzle(sql, { schema });
  }
  const pg = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new pg.default.Pool({ connectionString });
  return drizzle(pool, { schema });
}
