import { customAlphabet } from "nanoid";

import type {
  CreateTaskSchema,
  GetTasksSchema,
  UpdateTaskSchema,
  UpdateTasksSchema,
} from "@/app/lib/validations";
import { DB_TABLES, db } from "@/db";
import type { Task } from "@/db/schema";

type SqlParam =
  | string
  | number
  | boolean
  | Date
  | null
  | Array<string | number>;

type TaskFilter = GetTasksSchema["filters"][number];
type TaskFilterVariant = TaskFilter["variant"];
type TaskComparisonOperator = Extract<
  TaskFilter["operator"],
  "gt" | "gte" | "lt" | "lte"
>;

interface RawTaskRow {
  archived: boolean;
  code: string;
  createdAt: Date | string;
  estimatedHours: number | string;
  id: string;
  label: Task["label"];
  priority: Task["priority"];
  status: Task["status"];
  title: string | null;
  updatedAt: Date | string | null;
}

const TASK_FILTER_COLUMN_MAP: Partial<Record<keyof Task, string>> = {
  title: "title",
  status: "status",
  priority: "priority",
  estimatedHours: "estimated_hours",
  createdAt: "created_at",
};

const TASK_SORT_COLUMN_MAP: Partial<Record<keyof Task, string>> = {
  estimatedHours: "estimated_hours",
  createdAt: "created_at",
};

const TASK_SORTABLE_COLUMNS = new Set([
  "archived",
  "code",
  "createdAt",
  "estimatedHours",
  "label",
  "priority",
  "status",
  "title",
] as const satisfies ReadonlyArray<keyof Task>);

const DATE_VARIANTS = new Set<TaskFilterVariant>(["date", "dateRange"]);
const NUMBER_VARIANTS = new Set<TaskFilterVariant>(["number", "range"]);

const COMPARISON_OPERATOR_MAP: Record<TaskComparisonOperator, string> = {
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

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

function pushParam(values: SqlParam[], value: SqlParam) {
  values.push(value);
  return `$${values.length}`;
}

function isDateVariant(variant: TaskFilterVariant) {
  return DATE_VARIANTS.has(variant);
}

function isNumberVariant(variant: TaskFilterVariant) {
  return NUMBER_VARIANTS.has(variant);
}

function getStringValue(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.find((item) => item !== "");
  }

  return value === "" ? undefined : value;
}

function getStringArray(value: string | string[]) {
  return (Array.isArray(value) ? value : [value]).filter((item) => item !== "");
}

function getNumberArray(value: string | string[]) {
  return getStringArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function getNumberValue(value: string | string[]) {
  const candidate = getStringValue(value);
  if (!candidate) {
    return undefined;
  }

  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function getDayBounds(value: string | string[]) {
  const candidate = getStringValue(value);
  if (!candidate) {
    return null;
  }

  const date = new Date(Number(candidate));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getRelativeDayBounds(offset: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function buildTextSearchClause(
  column: string,
  value: string | string[],
  operator: "iLike" | "notILike",
  values: SqlParam[]
) {
  const candidate = getStringValue(value);
  if (!candidate) {
    return null;
  }

  const comparator = operator === "iLike" ? "ILIKE" : "NOT ILIKE";
  return `${column} ${comparator} ${pushParam(values, `%${candidate}%`)}`;
}

function buildEqualityClause(
  column: string,
  filter: TaskFilter,
  values: SqlParam[],
  comparator: "=" | "<>"
) {
  if (isDateVariant(filter.variant)) {
    const bounds = getDayBounds(filter.value);
    if (!bounds) {
      return null;
    }

    const start = pushParam(values, bounds.start);
    const end = pushParam(values, bounds.end);
    return comparator === "="
      ? `(${column} >= ${start} AND ${column} <= ${end})`
      : `(${column} < ${start} OR ${column} > ${end})`;
  }

  if (isNumberVariant(filter.variant)) {
    const numeric = getNumberValue(filter.value);
    if (numeric === undefined) {
      return null;
    }

    return `${column} ${comparator} ${pushParam(values, numeric)}`;
  }

  const value = getStringValue(filter.value);
  if (!value) {
    return null;
  }

  return `${column} ${comparator} ${pushParam(values, value)}`;
}

function buildArrayClause(
  column: string,
  value: string | string[],
  values: SqlParam[],
  quantifier: "ANY" | "ALL"
) {
  const items = getStringArray(value);
  if (items.length === 0) {
    return null;
  }

  const comparator = quantifier === "ANY" ? "=" : "<>";
  return `${column} ${comparator} ${quantifier}(${pushParam(values, items)})`;
}

function buildEmptyClause(
  column: string,
  variant: TaskFilterVariant,
  operator: "isEmpty" | "isNotEmpty"
) {
  if (variant === "text") {
    return operator === "isEmpty"
      ? `(${column} IS NULL OR ${column} = '')`
      : `(${column} IS NOT NULL AND ${column} <> '')`;
  }

  return operator === "isEmpty" ? `${column} IS NULL` : `${column} IS NOT NULL`;
}

function buildComparisonClause(
  column: string,
  filter: TaskFilter,
  operator: TaskComparisonOperator,
  values: SqlParam[]
) {
  if (isDateVariant(filter.variant)) {
    const bounds = getDayBounds(filter.value);
    if (!bounds) {
      return null;
    }

    const target =
      operator === "lt" || operator === "gte" ? bounds.start : bounds.end;

    return `${column} ${COMPARISON_OPERATOR_MAP[operator]} ${pushParam(
      values,
      target
    )}`;
  }

  const numeric = getNumberValue(filter.value);
  if (numeric === undefined) {
    return null;
  }

  return `${column} ${COMPARISON_OPERATOR_MAP[operator]} ${pushParam(
    values,
    numeric
  )}`;
}

function buildDateBetweenClause(
  column: string,
  value: string | string[],
  values: SqlParam[]
) {
  const [lowerValue, upperValue] = getStringArray(value);
  const lowerBounds = lowerValue ? getDayBounds(lowerValue) : null;
  const upperBounds = upperValue ? getDayBounds(upperValue) : null;

  if (lowerBounds && upperBounds) {
    const start = pushParam(values, lowerBounds.start);
    const end = pushParam(values, upperBounds.end);
    return `(${column} >= ${start} AND ${column} <= ${end})`;
  }

  if (lowerBounds) {
    return `${column} >= ${pushParam(values, lowerBounds.start)}`;
  }

  if (upperBounds) {
    return `${column} <= ${pushParam(values, upperBounds.end)}`;
  }

  return null;
}

function buildNumericBetweenClause(
  column: string,
  value: string | string[],
  values: SqlParam[]
) {
  const numericValues = getNumberArray(value);

  if (numericValues.length >= 2) {
    const start = pushParam(values, numericValues[0] as number);
    const end = pushParam(values, numericValues[1] as number);
    return `(${column} >= ${start} AND ${column} <= ${end})`;
  }

  const [numeric] = numericValues;
  if (numeric === undefined) {
    return null;
  }

  return `${column} >= ${pushParam(values, numeric)}`;
}

function buildBetweenClause(
  column: string,
  filter: TaskFilter,
  values: SqlParam[]
) {
  return isDateVariant(filter.variant)
    ? buildDateBetweenClause(column, filter.value, values)
    : buildNumericBetweenClause(column, filter.value, values);
}

function buildRelativeToTodayClause(
  column: string,
  value: string | string[],
  values: SqlParam[]
) {
  const numeric = getNumberValue(value);
  if (numeric === undefined) {
    return null;
  }

  const bounds = getRelativeDayBounds(numeric);
  const start = pushParam(values, bounds.start);
  const end = pushParam(values, bounds.end);
  return `(${column} >= ${start} AND ${column} <= ${end})`;
}

function buildTaskFilterClause(filter: TaskFilter, values: SqlParam[]) {
  const column = TASK_FILTER_COLUMN_MAP[filter.id];
  if (!column) {
    return null;
  }

  switch (filter.operator) {
    case "iLike":
    case "notILike":
      return buildTextSearchClause(
        column,
        filter.value,
        filter.operator,
        values
      );
    case "eq":
      return buildEqualityClause(column, filter, values, "=");
    case "ne":
      return buildEqualityClause(column, filter, values, "<>");
    case "inArray":
      return buildArrayClause(column, filter.value, values, "ANY");
    case "notInArray":
      return buildArrayClause(column, filter.value, values, "ALL");
    case "isEmpty":
    case "isNotEmpty":
      return buildEmptyClause(column, filter.variant, filter.operator);
    case "lt":
    case "lte":
    case "gt":
    case "gte":
      return buildComparisonClause(column, filter, filter.operator, values);
    case "isBetween":
      return buildBetweenClause(column, filter, values);
    case "isRelativeToToday":
      return buildRelativeToTodayClause(column, filter.value, values);
    default:
      return null;
  }
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
  if (input.estimatedHours[0] !== undefined) {
    whereClauses.push(`estimated_hours >= $${values.length + 1}`);
    values.push(input.estimatedHours[0]);
  }
  if (input.estimatedHours[1] !== undefined) {
    whereClauses.push(`estimated_hours <= $${values.length + 1}`);
    values.push(input.estimatedHours[1]);
  }
  if (input.createdAt[0] !== undefined) {
    const start = new Date(input.createdAt[0]);
    start.setHours(0, 0, 0, 0);
    whereClauses.push(`created_at >= $${values.length + 1}`);
    values.push(start);
  }
  if (input.createdAt[1] !== undefined) {
    const end = new Date(input.createdAt[1]);
    end.setHours(23, 59, 59, 999);
    whereClauses.push(`created_at <= $${values.length + 1}`);
    values.push(end);
  }

  if (input.filters.length > 0) {
    const advancedClauses = input.filters
      .map((filter) => buildTaskFilterClause(filter, values))
      .filter((clause): clause is string => Boolean(clause));

    if (advancedClauses.length > 0) {
      whereClauses.push(
        `(${advancedClauses.join(` ${input.joinOperator.toUpperCase()} `)})`
      );
    }
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const orderBy =
    input.sort.length > 0
      ? input.sort
          .filter((item): item is typeof item & { id: keyof Task } =>
            TASK_SORTABLE_COLUMNS.has(item.id as keyof Task)
          )
          .map((item) => {
            const column = TASK_SORT_COLUMN_MAP[item.id] ?? item.id;
            const direction = item.desc ? "DESC" : "ASC";
            return `${column} ${direction}`;
          })
          .join(", ")
      : "created_at DESC";

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
  await db.unsafe(
    `INSERT INTO ${DB_TABLES.tasks} (id, code, title, status, label, priority, estimated_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12)(),
      `TASK-${customAlphabet("0123456789", 4)()}`,
      input.title,
      input.status,
      input.label,
      input.priority,
      input.estimatedHours ?? 0,
    ]
  );
}

export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  const fields: string[] = [];
  const values: SqlParam[] = [];

  if (input.title !== undefined) {
    fields.push(`title = ${pushParam(values, input.title)}`);
  }
  if (input.label !== undefined) {
    fields.push(`label = ${pushParam(values, input.label)}`);
  }
  if (input.status !== undefined) {
    fields.push(`status = ${pushParam(values, input.status)}`);
  }
  if (input.priority !== undefined) {
    fields.push(`priority = ${pushParam(values, input.priority)}`);
  }
  if (input.estimatedHours !== undefined) {
    fields.push(`estimated_hours = ${pushParam(values, input.estimatedHours)}`);
  }

  if (fields.length === 0) {
    return;
  }

  values.push(input.id);

  await db.unsafe(
    `UPDATE ${DB_TABLES.tasks}
     SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length}`,
    values
  );
}

export async function updateTasks(input: UpdateTasksSchema) {
  if (input.ids.length === 0) {
    return;
  }

  if (
    input.label === undefined &&
    input.status === undefined &&
    input.priority === undefined
  ) {
    return;
  }

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
  await db.unsafe(`DELETE FROM ${DB_TABLES.tasks} WHERE id = $1`, [input.id]);
}

export async function deleteTasks(input: { ids: string[] }) {
  if (input.ids.length === 0) {
    return;
  }

  await db.unsafe(`DELETE FROM ${DB_TABLES.tasks} WHERE id = ANY($1)`, [
    input.ids,
  ]);
}
