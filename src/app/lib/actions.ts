import type { Task } from "@/db/schema";
import { getErrorMessage } from "@/lib/handle-error";
import { emitTasksChanged } from "./tasks-events";
import type { CreateTaskSchema, UpdateTaskSchema } from "./validations";

async function request(path: string, init: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      body.error ?? `Request failed with status ${response.status}`
    );
  }

  return response.json().catch(() => null);
}

export async function createTask(input: CreateTaskSchema) {
  try {
    await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
    emitTasksChanged();

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  try {
    await request(`/api/tasks/${input.id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    emitTasksChanged();

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function updateTasks(input: {
  ids: string[];
  label?: Task["label"];
  status?: Task["status"];
  priority?: Task["priority"];
}) {
  try {
    await request("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    emitTasksChanged();

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function deleteTask(input: { id: string }) {
  try {
    await request(`/api/tasks/${input.id}`, {
      method: "DELETE",
    });
    emitTasksChanged();

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}

export async function deleteTasks(input: { ids: string[] }) {
  try {
    await request("/api/tasks", {
      method: "DELETE",
      body: JSON.stringify(input),
    });
    emitTasksChanged();

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: getErrorMessage(err) };
  }
}
