import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DATABASE_PREFIX } from "@/lib/constants";

const DB_PATH = "data/buncn.sqlite";

const dir = dirname(DB_PATH);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(DB_PATH, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");

export const DB_TABLES = {
  tasks: `${DATABASE_PREFIX}_tasks`,
  skaters: `${DATABASE_PREFIX}_skaters`,
  mails: `${DATABASE_PREFIX}_mails`,
} as const;

const RE_READ = /^\s*(SELECT|WITH)\b/i;
const RE_RETURNING = /\bRETURNING\b/i;

function convertParam(value: unknown): string | number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return String(value);
}

function prepareQuery(
  sql: string,
  params?: unknown[]
): { sql: string; params: (string | number | null)[] } {
  let converted = sql;

  // Remove PostgreSQL type casts
  converted = converted.replace(/::jsonb/g, "");
  converted = converted.replace(/::text/g, "");

  // ILIKE → LIKE (SQLite LIKE is case-insensitive for ASCII)
  converted = converted.replace(/\bNOT\s+ILIKE\b/gi, "NOT LIKE");
  converted = converted.replace(/\bILIKE\b/gi, "LIKE");

  if (!params || params.length === 0) {
    return { sql: converted, params: [] };
  }

  // Build flat param list, tracking where each original $N maps to
  const flatParams: (string | number | null)[] = [];
  const paramMap = new Map<number, { start: number; count: number }>();

  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const start = flatParams.length;

    if (Array.isArray(param)) {
      for (const item of param) {
        flatParams.push(convertParam(item));
      }
      paramMap.set(i + 1, { start, count: param.length });
    } else {
      flatParams.push(convertParam(param));
      paramMap.set(i + 1, { start, count: 1 });
    }
  }

  // Expand = ANY($N) → IN (?, ?, ...)
  converted = converted.replace(/=\s*ANY\(\$(\d+)\)/g, (_, numStr) => {
    const info = paramMap.get(Number(numStr));
    if (!info || info.count === 0) {
      return "IN (NULL)";
    }
    const placeholders = Array.from(
      { length: info.count },
      (_, i) => `?${info.start + i + 1}`
    ).join(", ");
    return `IN (${placeholders})`;
  });

  // Expand <> ALL($N) → NOT IN (?, ?, ...)
  converted = converted.replace(/<>\s*ALL\(\$(\d+)\)/g, (_, numStr) => {
    const info = paramMap.get(Number(numStr));
    if (!info || info.count === 0) {
      return "NOT IN (NULL)";
    }
    const placeholders = Array.from(
      { length: info.count },
      (_, i) => `?${info.start + i + 1}`
    ).join(", ");
    return `NOT IN (${placeholders})`;
  });

  // Replace remaining $N with ?M (mapped to flat position)
  converted = converted.replace(/\$(\d+)/g, (_, numStr) => {
    const info = paramMap.get(Number(numStr));
    if (!info) {
      return `?${Number(numStr)}`;
    }
    return `?${info.start + 1}`;
  });

  return { sql: converted, params: flatParams };
}

export interface DbClient {
  begin<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
  unsafe<T = unknown[]>(sql: string, params?: unknown[]): Promise<T>;
}

export const db: DbClient = {
  unsafe<T = unknown[]>(sql: string, params?: unknown[]): Promise<T> {
    const q = prepareQuery(sql, params);

    const isRead = RE_READ.test(q.sql);
    const hasReturning = RE_RETURNING.test(q.sql);

    if (isRead || hasReturning) {
      const stmt = sqlite.query(q.sql);
      const rows = stmt.all(...q.params);
      return Promise.resolve(rows as T);
    }

    const stmt = sqlite.query(q.sql);
    stmt.run(...q.params);
    return Promise.resolve([] as unknown as T);
  },

  async begin<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
    sqlite.exec("BEGIN");
    try {
      const result = await fn(db);
      sqlite.exec("COMMIT");
      return result;
    } catch (err) {
      sqlite.exec("ROLLBACK");
      throw err;
    }
  },
};
