import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;
export function db() {
  const databaseUrl = process.env.DATABASE_URL || process.env.storage_DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  if (!database) database = drizzle(postgres(databaseUrl, { max: 5 }), { schema });
  return database;
}
