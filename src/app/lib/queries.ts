import type { Task } from "@/db/schema";
import type { GetTasksSchema } from "./validations";

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

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function buildTasksQuery(input: GetTasksSchema) {
  const params = new URLSearchParams();

  params.set("page", String(input.page));
  params.set("perPage", String(input.perPage));

  if (input.filterFlag) {
    params.set("filterFlag", input.filterFlag);
  }
  if (input.title) {
    params.set("title", input.title);
  }
  if (input.status.length > 0) {
    params.set("status", input.status.join(","));
  }
  if (input.priority.length > 0) {
    params.set("priority", input.priority.join(","));
  }
  if (input.estimatedHours.length > 0) {
    params.set("estimatedHours", input.estimatedHours.join(","));
  }
  if (input.createdAt.length > 0) {
    params.set("createdAt", input.createdAt.join(","));
  }
  if (input.sort.length > 0) {
    params.set("sort", JSON.stringify(input.sort));
  }
  if (input.filters.length > 0) {
    params.set("filters", JSON.stringify(input.filters));
  }
  params.set("joinOperator", input.joinOperator);

  return params.toString();
}

export async function getTasks(input: GetTasksSchema) {
  try {
    const query = buildTasksQuery(input);
    const result = await fetchJson<{ data: RawTaskRow[]; pageCount: number }>(
      `/api/tasks?${query}`
    );

    return {
      data: result.data.map(mapTaskRow),
      pageCount: result.pageCount,
    };
  } catch {
    return { data: [], pageCount: 0 };
  }
}

export async function getTaskStatusCounts() {
  try {
    return await fetchJson<{
      todo: number;
      "in-progress": number;
      done: number;
      canceled: number;
    }>("/api/tasks/status-counts");
  } catch {
    return { todo: 0, "in-progress": 0, done: 0, canceled: 0 };
  }
}

export async function getTaskPriorityCounts() {
  try {
    return await fetchJson<{ low: number; medium: number; high: number }>(
      "/api/tasks/priority-counts"
    );
  } catch {
    return { low: 0, medium: 0, high: 0 };
  }
}

export async function getEstimatedHoursRange() {
  try {
    return await fetchJson<{ min: number; max: number }>(
      "/api/tasks/estimated-hours-range"
    );
  } catch {
    return { min: 0, max: 0 };
  }
}
