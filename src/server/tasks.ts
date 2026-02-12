import { customAlphabet } from "nanoid";
import { generateRandomTask } from "@/app/lib/utils";
import type {
  CreateTaskSchema,
  GetTasksSchema,
  UpdateTaskSchema,
} from "@/app/lib/validations";
import { DB_TABLES, db } from "@/db";
import type { Task } from "@/db/schema";

type SqlParam = string | number | boolean | Date | null | string[];

interface RawTaskRow {
  id: string;
  code: string;
  title: string | null;
  status: Task["status"];
  priority: Task["priority"];
  label: Task["label"];
  estimatedHours: number | string;
  archived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

function mapTaskRow(row: RawTaskRow): Task {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    status: row.status,
    priority: row.priority,
    label: row.label,
    estimatedHours: Number(row.estimatedHours ?? 0),
    archived: Boolean(row.archived),
    createdAt:
      row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
  };
}

export async function getTasks(input: GetTasksSchema) {
  const offset = (input.page - 1) * input.perPage;
  const whereClauses: string[] = [];
  const values: SqlParam[] = [];

  if (input.title) {
    whereClauses.push(`title ILIKE $${values.length + 1}`);
    values.push(`%${input.title}%`);
  }
  if (input.status.length > 0) {
    whereClauses.push(`status = ANY($${values.length + 1})`);
    values.push(input.status);
  }
  if (input.priority.length > 0) {
    whereClauses.push(`priority = ANY($${values.length + 1})`);
    values.push(input.priority);
  }
  if (input.estimatedHours[0]) {
    whereClauses.push(`estimated_hours >= $${values.length + 1}`);
    values.push(input.estimatedHours[0]);
  }
  if (input.estimatedHours[1]) {
    whereClauses.push(`estimated_hours <= $${values.length + 1}`);
    values.push(input.estimatedHours[1]);
  }
  if (input.createdAt[0]) {
    const start = new Date(input.createdAt[0]);
    start.setHours(0, 0, 0, 0);
    whereClauses.push(`created_at >= $${values.length + 1}`);
    values.push(start);
  }
  if (input.createdAt[1]) {
    const end = new Date(input.createdAt[1]);
    end.setHours(23, 59, 59, 999);
    whereClauses.push(`created_at <= $${values.length + 1}`);
    values.push(end);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sortable = new Set([
    "code",
    "title",
    "status",
    "priority",
    "label",
    "estimatedHours",
    "archived",
    "createdAt",
  ]);
  const orderBy =
    input.sort.length > 0
      ? input.sort
          .filter((item) => sortable.has(item.id))
          .map((item) => {
            const column =
              item.id === "estimatedHours"
                ? "estimated_hours"
                : item.id === "createdAt"
                  ? "created_at"
                  : item.id;
            return `${column} ${item.desc ? "DESC" : "ASC"}`;
          })
          .join(", ")
      : "created_at ASC";

  const rows = await db.unsafe<RawTaskRow[]>(
    `SELECT id, code, title, status, priority, label, estimated_hours AS "estimatedHours", archived, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM ${DB_TABLES.tasks}
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, input.perPage, offset]
  );

  const countRows = await db.unsafe<Array<{ count: string }>>(
    `SELECT COUNT(*)::text AS count FROM ${DB_TABLES.tasks} ${whereSql}`,
    values
  );

  const total = Number(countRows[0]?.count ?? 0);
  return {
    data: rows.map(mapTaskRow),
    pageCount: Math.ceil(total / input.perPage),
  };
}

export async function getTaskStatusCounts() {
  const rows = await db.unsafe<Array<{ status: string; count: string }>>(
    `SELECT status, COUNT(*)::text AS count FROM ${DB_TABLES.tasks} GROUP BY status HAVING COUNT(*) > 0`
  );

  return rows.reduce(
    (acc, { status, count }) => {
      if (status in acc) {
        acc[status as keyof typeof acc] = Number(count);
      }
      return acc;
    },
    { todo: 0, "in-progress": 0, done: 0, canceled: 0 }
  );
}

export async function getTaskPriorityCounts() {
  const rows = await db.unsafe<Array<{ priority: string; count: string }>>(
    `SELECT priority, COUNT(*)::text AS count FROM ${DB_TABLES.tasks} GROUP BY priority HAVING COUNT(*) > 0`
  );

  return rows.reduce(
    (acc, { priority, count }) => {
      if (priority in acc) {
        acc[priority as keyof typeof acc] = Number(count);
      }
      return acc;
    },
    { low: 0, medium: 0, high: 0 }
  );
}

export async function getEstimatedHoursRange() {
  const [result] = await db.unsafe<
    Array<{ min: number | null; max: number | null }>
  >(
    `SELECT COALESCE(MIN(estimated_hours), 0) AS min, COALESCE(MAX(estimated_hours), 0) AS max FROM ${DB_TABLES.tasks}`
  );

  return { min: Number(result?.min ?? 0), max: Number(result?.max ?? 0) };
}

export async function createTask(input: CreateTaskSchema) {
  await db.begin(async (tx) => {
    const [newTask] = await tx.unsafe<Array<{ id: string }>>(
      `INSERT INTO ${DB_TABLES.tasks} (code, title, status, label, priority)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        `TASK-${customAlphabet("0123456789", 4)()}`,
        input.title,
        input.status,
        input.label,
        input.priority,
      ]
    );

    const [oldest] = await tx.unsafe<Array<{ id: string }>>(
      `SELECT id FROM ${DB_TABLES.tasks} WHERE id != $1 ORDER BY created_at ASC LIMIT 1`,
      [newTask?.id ?? ""]
    );

    if (oldest?.id) {
      await tx.unsafe(`DELETE FROM ${DB_TABLES.tasks} WHERE id = $1`, [
        oldest.id,
      ]);
    }
  });
}

export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  await db.unsafe(
    `UPDATE ${DB_TABLES.tasks}
     SET title = $1, label = $2, status = $3, priority = $4, estimated_hours = COALESCE($5, estimated_hours), updated_at = CURRENT_TIMESTAMP
     WHERE id = $6`,
    [
      input.title ?? null,
      input.label ?? null,
      input.status ?? null,
      input.priority ?? null,
      input.estimatedHours ?? null,
      input.id,
    ]
  );
}

export async function updateTasks(input: {
  ids: string[];
  label?: Task["label"];
  status?: Task["status"];
  priority?: Task["priority"];
}) {
  await db.unsafe(
    `UPDATE ${DB_TABLES.tasks}
     SET label = COALESCE($1, label),
         status = COALESCE($2, status),
         priority = COALESCE($3, priority),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ANY($4)`,
    [
      input.label ?? null,
      input.status ?? null,
      input.priority ?? null,
      input.ids,
    ]
  );
}

export async function deleteTask(input: { id: string }) {
  await db.begin(async (tx) => {
    await tx.unsafe(`DELETE FROM ${DB_TABLES.tasks} WHERE id = $1`, [input.id]);
    const task = generateRandomTask();
    await tx.unsafe(
      `INSERT INTO ${DB_TABLES.tasks} (id, code, title, status, priority, label, estimated_hours, archived)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        task.id,
        task.code,
        task.title,
        task.status,
        task.priority,
        task.label,
        task.estimatedHours,
        task.archived,
      ]
    );
  });
}

export async function deleteTasks(input: { ids: string[] }) {
  await db.begin(async (tx) => {
    await tx.unsafe(`DELETE FROM ${DB_TABLES.tasks} WHERE id = ANY($1)`, [
      input.ids,
    ]);

    for (const _ of input.ids) {
      const task = generateRandomTask();
      await tx.unsafe(
        `INSERT INTO ${DB_TABLES.tasks} (id, code, title, status, priority, label, estimated_hours, archived)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          task.id,
          task.code,
          task.title,
          task.status,
          task.priority,
          task.label,
          task.estimatedHours,
          task.archived,
        ]
      );
    }
  });
}
