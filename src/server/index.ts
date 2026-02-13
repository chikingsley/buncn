import {
  type CreateTaskSchema,
  parseTasksSearchParams,
  type UpdateTaskSchema,
} from "@/app/lib/validations";
import { getErrorMessage } from "@/lib/handle-error";
import {
  createSkaters,
  getSkaters,
  patchSkaters,
  removeSkaters,
} from "@/server/skaters";
import {
  createTask,
  deleteTask,
  deleteTasks,
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTaskStatusCounts,
  getTasks,
  updateTask,
  updateTasks,
} from "@/server/tasks";
import app from "../index.html";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const isDev = process.env.NODE_ENV !== "production";

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: isDev
    ? {
        hmr: true,
        console: true,
      }
    : false,
  routes: {
    "/api/tasks": {
      GET: async (req) => {
        try {
          const input = parseTasksSearchParams(new URL(req.url).searchParams);
          return json(await getTasks(input));
        } catch (error) {
          return json({ error: getErrorMessage(error) }, { status: 500 });
        }
      },
      POST: async (req) => {
        try {
          const body = (await req.json()) as CreateTaskSchema;
          await createTask(body);
          return json({ data: null, error: null });
        } catch (error) {
          return json(
            { data: null, error: getErrorMessage(error) },
            { status: 500 }
          );
        }
      },
      PATCH: async (req) => {
        try {
          const body = (await req.json()) as {
            ids: string[];
            label?: "bug" | "feature" | "enhancement" | "documentation";
            status?: "todo" | "in-progress" | "done" | "canceled";
            priority?: "low" | "medium" | "high";
          };
          await updateTasks(body);
          return json({ data: null, error: null });
        } catch (error) {
          return json(
            { data: null, error: getErrorMessage(error) },
            { status: 500 }
          );
        }
      },
      DELETE: async (req) => {
        try {
          const body = (await req.json()) as { ids: string[] };
          await deleteTasks(body);
          return json({ data: null, error: null });
        } catch (error) {
          return json(
            { data: null, error: getErrorMessage(error) },
            { status: 500 }
          );
        }
      },
    },
    "/api/tasks/:id": {
      PATCH: async (req) => {
        try {
          const id = req.params.id;
          if (!id) {
            return json({ error: "Task id is required" }, { status: 400 });
          }

          const body = (await req.json()) as UpdateTaskSchema;
          await updateTask({ id, ...body });
          return json({ data: null, error: null });
        } catch (error) {
          return json(
            { data: null, error: getErrorMessage(error) },
            { status: 500 }
          );
        }
      },
      DELETE: async (req) => {
        try {
          const id = req.params.id;
          if (!id) {
            return json({ error: "Task id is required" }, { status: 400 });
          }

          await deleteTask({ id });
          return json({ data: null, error: null });
        } catch (error) {
          return json(
            { data: null, error: getErrorMessage(error) },
            { status: 500 }
          );
        }
      },
    },
    "/api/tasks/status-counts": {
      GET: async () => json(await getTaskStatusCounts()),
    },
    "/api/tasks/priority-counts": {
      GET: async () => json(await getTaskPriorityCounts()),
    },
    "/api/tasks/estimated-hours-range": {
      GET: async () => json(await getEstimatedHoursRange()),
    },
    "/api/skaters": {
      GET: async () => {
        try {
          return json(await getSkaters());
        } catch (error) {
          return json({ error: getErrorMessage(error) }, { status: 500 });
        }
      },
      POST: async (req) => {
        try {
          const body = await req.json();
          const result = await createSkaters(body);

          if (
            isObject(result) &&
            "status" in result &&
            typeof result.status === "number"
          ) {
            return json(result, { status: result.status });
          }

          return json(result);
        } catch (error) {
          return json({ error: getErrorMessage(error) }, { status: 500 });
        }
      },
      PATCH: async (req) => {
        try {
          const body = await req.json();
          const result = await patchSkaters(body);

          if (
            isObject(result) &&
            "status" in result &&
            typeof result.status === "number"
          ) {
            return json(result, { status: result.status });
          }

          return json(result);
        } catch (error) {
          return json({ error: getErrorMessage(error) }, { status: 500 });
        }
      },
      DELETE: async (req) => {
        try {
          const body = await req.json();
          const result = await removeSkaters(body);

          if (
            isObject(result) &&
            "status" in result &&
            typeof result.status === "number"
          ) {
            return json(result, { status: result.status });
          }

          return json(result);
        } catch (error) {
          return json({ error: getErrorMessage(error) }, { status: 500 });
        }
      },
    },
    "/api/*": () => json({ error: "Not found" }, { status: 404 }),
    "/*": app,
  },
});

console.log(`API server running on http://localhost:${server.port}`);
