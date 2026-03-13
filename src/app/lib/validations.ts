import {
  array,
  number,
  object,
  string,
  type infer as ZodInfer,
  enum as zodEnum,
} from "zod";
import { flagConfig } from "@/config/flag";
import { type Task, tasks } from "@/db/schema";
import type {
  ExtendedColumnFilter,
  ExtendedColumnSort,
} from "@/types/data-table";

export interface GetTasksSchema {
  createdAt: number[];
  estimatedHours: number[];
  filterFlag: (typeof flagConfig.featureFlags)[number]["value"] | null;
  filters: ExtendedColumnFilter<Task>[];
  joinOperator: "and" | "or";
  page: number;
  perPage: number;
  priority: Task["priority"][];
  sort: ExtendedColumnSort<Task>[];
  status: Task["status"][];
  title: string;
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

function normalizeEnumArray<T extends string>(
  values: string[],
  validValues: readonly T[]
): T[] {
  const uniqueValues = [...new Set(values)].filter((value): value is T =>
    validValues.includes(value as T)
  );

  // Treat "all selected" as equivalent to "no filter".
  if (uniqueValues.length === validValues.length) {
    return [];
  }

  return uniqueValues;
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
    status: normalizeEnumArray(
      parseStringArray(searchParams.get("status")),
      tasks.status.enumValues
    ),
    priority: normalizeEnumArray(
      parseStringArray(searchParams.get("priority")),
      tasks.priority.enumValues
    ),
    estimatedHours: parseNumberArray(searchParams.get("estimatedHours")),
    createdAt: parseNumberArray(searchParams.get("createdAt")),
    filters: parseJson<ExtendedColumnFilter<Task>[]>(
      searchParams.get("filters"),
      []
    ),
    joinOperator: searchParams.get("joinOperator") === "or" ? "or" : "and",
  };
}

export const createTaskSchema = object({
  title: string(),
  label: zodEnum(tasks.label.enumValues),
  status: zodEnum(tasks.status.enumValues),
  priority: zodEnum(tasks.priority.enumValues),
  estimatedHours: number().optional(),
});

export const updateTaskSchema = object({
  title: string().optional(),
  label: zodEnum(tasks.label.enumValues).optional(),
  status: zodEnum(tasks.status.enumValues).optional(),
  priority: zodEnum(tasks.priority.enumValues).optional(),
  estimatedHours: number().optional(),
});

export const updateTasksSchema = object({
  ids: array(string()).min(1),
  label: zodEnum(tasks.label.enumValues).optional(),
  status: zodEnum(tasks.status.enumValues).optional(),
  priority: zodEnum(tasks.priority.enumValues).optional(),
});

export const deleteTasksSchema = object({
  ids: array(string()).min(1),
});

export type CreateTaskSchema = ZodInfer<typeof createTaskSchema>;
export type UpdateTaskSchema = ZodInfer<typeof updateTaskSchema>;
export type UpdateTasksSchema = ZodInfer<typeof updateTasksSchema>;
export type DeleteTasksSchema = ZodInfer<typeof deleteTasksSchema>;
