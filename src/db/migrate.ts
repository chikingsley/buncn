import { DB_TABLES, db } from "@/db";

const createTasksTable = `
CREATE TABLE IF NOT EXISTS ${DB_TABLES.tasks} (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done', 'canceled')),
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  label TEXT NOT NULL DEFAULT 'bug' CHECK (label IN ('bug', 'feature', 'enhancement', 'documentation')),
  estimated_hours REAL NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);`;

const createSkatersTable = `
CREATE TABLE IF NOT EXISTS ${DB_TABLES.skaters} (
  id TEXT PRIMARY KEY,
  "order" INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  email TEXT,
  stance TEXT NOT NULL DEFAULT 'regular' CHECK (stance IN ('regular', 'goofy')),
  style TEXT NOT NULL DEFAULT 'street' CHECK (style IN ('street', 'vert', 'park', 'freestyle', 'all-around')),
  status TEXT NOT NULL DEFAULT 'amateur' CHECK (status IN ('amateur', 'sponsored', 'pro', 'legend')),
  years_skating INTEGER NOT NULL DEFAULT 0,
  started_skating TEXT,
  is_pro INTEGER NOT NULL DEFAULT 0,
  tricks TEXT,
  media TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);`;

const createMailsTable = `
CREATE TABLE IF NOT EXISTS ${DB_TABLES.mails} (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  folder TEXT NOT NULL DEFAULT 'inbox'
    CHECK (folder IN ('inbox', 'drafts', 'sent', 'junk', 'trash', 'archive')),
  read INTEGER NOT NULL DEFAULT 0,
  labels TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);`;

export async function runMigrate() {
  console.log("Running SQL migrations...");
  const start = Date.now();

  await db.unsafe(createTasksTable);
  await db.unsafe(createSkatersTable);
  await db.unsafe(createMailsTable);

  console.log(`Migrations completed in ${Date.now() - start}ms`);
  process.exit(0);
}

runMigrate().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});
