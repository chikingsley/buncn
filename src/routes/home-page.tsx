import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FeatureFlagsProvider } from "@/app/components/feature-flags-provider";
import { TasksTable } from "@/app/components/tasks-table";
import {
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTaskStatusCounts,
  getTasks,
} from "@/app/lib/queries";
import { subscribeToTasksChanged } from "@/app/lib/tasks-events";
import { parseTasksSearchParams } from "@/app/lib/validations";
import { Shell } from "@/components/shell";
import type { Task } from "@/db/schema";
import { getValidFilters } from "@/lib/data-table";

interface TasksData {
  estimatedHoursRange: Awaited<ReturnType<typeof getEstimatedHoursRange>>;
  priorityCounts: Awaited<ReturnType<typeof getTaskPriorityCounts>>;
  statusCounts: Awaited<ReturnType<typeof getTaskStatusCounts>>;
  tasks: { data: Task[]; pageCount: number };
}

const EMPTY_TASKS_DATA: TasksData = {
  tasks: { data: [], pageCount: 0 },
  statusCounts: { todo: 0, "in-progress": 0, done: 0, canceled: 0 },
  priorityCounts: { low: 0, medium: 0, high: 0 },
  estimatedHoursRange: { min: 0, max: 0 },
};

function useTasksData(searchParams: URLSearchParams) {
  const [data, setData] = useState<TasksData>(EMPTY_TASKS_DATA);
  const searchParamsKey = searchParams.toString();
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const search = parseTasksSearchParams(new URLSearchParams(searchParamsKey));
    const validFilters = getValidFilters(search.filters);

    const [tasks, statusCounts, priorityCounts, estimatedHoursRange] =
      await Promise.all([
        getTasks({ ...search, filters: validFilters }),
        getTaskStatusCounts(),
        getTaskPriorityCounts(),
        getEstimatedHoursRange(),
      ]);

    if (requestId !== requestIdRef.current) {
      return;
    }

    setData({ tasks, statusCounts, priorityCounts, estimatedHoursRange });
  }, [searchParamsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return subscribeToTasksChanged(fetchData);
  }, [fetchData]);

  return data;
}

export function HomePage() {
  const [searchParams] = useSearchParams();
  const data = useTasksData(searchParams);

  return (
    <Shell>
      <FeatureFlagsProvider>
        <TasksTable
          data={data.tasks.data}
          estimatedHoursRange={data.estimatedHoursRange}
          pageCount={data.tasks.pageCount}
          priorityCounts={data.priorityCounts}
          statusCounts={data.statusCounts}
        />
      </FeatureFlagsProvider>
    </Shell>
  );
}
