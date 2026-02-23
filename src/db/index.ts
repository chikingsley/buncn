import postgres from "postgres";
import { env } from "@/env";
import { DATABASE_PREFIX } from "@/lib/constants";

function normalizeDatabaseUrl(databaseUrl: string) {
  const parsed = new URL(databaseUrl);

  if (parsed.hostname === "localhost") {
    parsed.hostname = "127.0.0.1";
  }

  return parsed.toString();
}

export const db = postgres(normalizeDatabaseUrl(env.DATABASE_URL), {
  connect_timeout: 3,
});

export const DB_TABLES = {
  tasks: `${DATABASE_PREFIX}_tasks`,
  skaters: `${DATABASE_PREFIX}_skaters`,
  mails: `${DATABASE_PREFIX}_mails`,
} as const;
