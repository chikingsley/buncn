import * as z from "zod";
import { flagConfig } from "@/config/flag";
import { type Task, tasks } from "@/db/schema";
import type {
  ExtendedColumnFilter,
  ExtendedColumnSort,
} from "@/types/data-table";

export interface GetTasksSchema {
  filterFlag: (typeof flagConfig.featureFlags)[number]["value"] | null;
  page: number;
  perPage: number;
  sort: ExtendedColumnSort<Task>[];
  title: string;
  status: Task["status"][];
  priority: Task["priority"][];
  estimatedHours: number[];
  createdAt: number[];
  filters: ExtendedColumnFilter<Task>[];
  joinOperator: "and" | "or";
}

function parseNumberArray(value: string | null): number[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function parseStringArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseTasksSearchParams(
  searchParams: URLSearchParams
): GetTasksSchema {
  const filterFlag = searchParams.get("filterFlag");
  const validFlags = flagConfig.featureFlags.map((flag) => flag.value);
  const parsedFilterFlag =
    filterFlag && validFlags.includes(filterFlag as (typeof validFlags)[number])
      ? (filterFlag as GetTasksSchema["filterFlag"])
      : null;

  return {
    filterFlag: parsedFilterFlag,
    page: Number(searchParams.get("page") ?? 1) || 1,
    perPage: Number(searchParams.get("perPage") ?? 10) || 10,
    sort: parseJson<ExtendedColumnSort<Task>[]>(searchParams.get("sort"), [
      { id: "createdAt", desc: true },
    ]),
    title: searchParams.get("title") ?? "",
    status: parseStringArray(searchParams.get("status")) as Task["status"][],
    priority: parseStringArray(
      searchParams.get("priority")
    ) as Task["priority"][],
    estimatedHours: parseNumberArray(searchParams.get("estimatedHours")),
    createdAt: parseNumberArray(searchParams.get("createdAt")),
    filters: parseJson<ExtendedColumnFilter<Task>[]>(
      searchParams.get("filters"),
      []
    ),
    joinOperator: searchParams.get("joinOperator") === "or" ? "or" : "and",
  };
}

export const createTaskSchema = z.object({
  title: z.string(),
  label: z.enum(tasks.label.enumValues),
  status: z.enum(tasks.status.enumValues),
  priority: z.enum(tasks.priority.enumValues),
  estimatedHours: z.number().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  label: z.enum(tasks.label.enumValues).optional(),
  status: z.enum(tasks.status.enumValues).optional(),
  priority: z.enum(tasks.priority.enumValues).optional(),
  estimatedHours: z.number().optional(),
});

export type CreateTaskSchema = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;
