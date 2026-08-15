import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (database) return database;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Add the Supabase Postgres connection string to the server environment.");
  }

  client = postgres(connectionString, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  database = drizzle(client, { schema });
  return database;
}

export async function closeDb() {
  if (client) await client.end({ timeout: 5 });
  client = null;
  database = null;
}
