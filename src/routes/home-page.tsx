import { useCallback, useEffect, useState } from "react";
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
  tasks: { data: Task[]; pageCount: number };
  statusCounts: Awaited<ReturnType<typeof getTaskStatusCounts>>;
  priorityCounts: Awaited<ReturnType<typeof getTaskPriorityCounts>>;
  estimatedHoursRange: Awaited<ReturnType<typeof getEstimatedHoursRange>>;
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

  const fetchData = useCallback(async () => {
    const search = parseTasksSearchParams(new URLSearchParams(searchParamsKey));
    const validFilters = getValidFilters(search.filters);

    const [tasks, statusCounts, priorityCounts, estimatedHoursRange] =
      await Promise.all([
        getTasks({ ...search, filters: validFilters }),
        getTaskStatusCounts(),
        getTaskPriorityCounts(),
        getEstimatedHoursRange(),
      ]);

    setData({ tasks, statusCounts, priorityCounts, estimatedHoursRange });
  }, [searchParamsKey]);

  useEffect(() => {
    let stale = false;
    const run = async () => {
      await fetchData();
    };
    if (!stale) {
      run();
    }
    return () => {
      stale = true;
    };
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
