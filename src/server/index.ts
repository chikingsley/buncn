import { UTApi } from "uploadthing/server";
import {
  type CreateTaskSchema,
  parseTasksSearchParams,
  type UpdateTaskSchema,
} from "@/app/lib/validations";
import { getErrorMessage } from "@/lib/handle-error";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
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

const utapi = new UTApi();

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    if (pathname === "/api/tasks" && req.method === "GET") {
      try {
        const input = parseTasksSearchParams(url.searchParams);
        return json(await getTasks(input));
      } catch (error) {
        return json({ error: getErrorMessage(error) }, { status: 500 });
      }
    }

    if (pathname === "/api/tasks/status-counts" && req.method === "GET") {
      return json(await getTaskStatusCounts());
    }

    if (pathname === "/api/tasks/priority-counts" && req.method === "GET") {
      return json(await getTaskPriorityCounts());
    }

    if (
      pathname === "/api/tasks/estimated-hours-range" &&
      req.method === "GET"
    ) {
      return json(await getEstimatedHoursRange());
    }

    if (pathname === "/api/tasks" && req.method === "POST") {
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
    }

    if (pathname === "/api/tasks" && req.method === "PATCH") {
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
    }

    if (pathname.startsWith("/api/tasks/") && req.method === "PATCH") {
      try {
        const id = pathname.split("/").at(-1);
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
    }

    if (pathname.startsWith("/api/tasks/") && req.method === "DELETE") {
      try {
        const id = pathname.split("/").at(-1);
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
    }

    if (pathname === "/api/tasks" && req.method === "DELETE") {
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
    }

    if (pathname === "/api/skaters" && req.method === "GET") {
      try {
        return json(await getSkaters());
      } catch (error) {
        return json({ error: getErrorMessage(error) }, { status: 500 });
      }
    }

    if (pathname === "/api/skaters" && req.method === "POST") {
      const rateLimit = await checkRateLimit(req);
      if (!rateLimit.success) {
        return rateLimitResponse(rateLimit);
      }

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
    }

    if (pathname === "/api/skaters" && req.method === "PATCH") {
      const rateLimit = await checkRateLimit(req);
      if (!rateLimit.success) {
        return rateLimitResponse(rateLimit);
      }

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
    }

    if (pathname === "/api/skaters" && req.method === "DELETE") {
      const rateLimit = await checkRateLimit(req);
      if (!rateLimit.success) {
        return rateLimitResponse(rateLimit);
      }

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
    }

    if (pathname === "/api/uploadthing/delete" && req.method === "POST") {
      const rateLimit = await checkRateLimit(req);
      if (!rateLimit.success) {
        return rateLimitResponse(rateLimit);
      }

      try {
        const payload = (await req.json()) as { fileKeys?: string[] };
        const fileKeys = payload.fileKeys ?? [];

        if (fileKeys.length === 0) {
          return json({ error: "No file keys provided" }, { status: 400 });
        }

        const result = await utapi.deleteFiles(fileKeys);
        return json({ success: true, result });
      } catch (error) {
        return json({ error: getErrorMessage(error) }, { status: 500 });
      }
    }

    if (pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, { status: 404 });
    }

    const distDir = `${process.cwd()}/dist`;
    const pathnameFile = pathname === "/" ? "/index.html" : pathname;
    const file = Bun.file(`${distDir}${pathnameFile}`);

    if (await file.exists()) {
      return new Response(file);
    }

    const indexFile = Bun.file(`${distDir}/index.html`);
    if (await indexFile.exists()) {
      return new Response(indexFile, {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }

    return new Response("API server is running", { status: 200 });
  },
});

console.log(`API server running on http://localhost:${server.port}`);
