import * as React from "react";
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
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shell";
import type { Task } from "@/db/schema";
import { getValidFilters } from "@/lib/data-table";

interface TasksData {
  tasks: { data: Task[]; pageCount: number };
  statusCounts: Awaited<ReturnType<typeof getTaskStatusCounts>>;
  priorityCounts: Awaited<ReturnType<typeof getTaskPriorityCounts>>;
  estimatedHoursRange: Awaited<ReturnType<typeof getEstimatedHoursRange>>;
}

function useTasksData(searchParams: URLSearchParams) {
  const [data, setData] = React.useState<TasksData | null>(null);
  const searchParamsKey = searchParams.toString();

  const fetchData = React.useCallback(async () => {
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

  React.useEffect(() => {
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

  React.useEffect(() => {
    return subscribeToTasksChanged(fetchData);
  }, [fetchData]);

  return data;
}

export function HomePage() {
  const [searchParams] = useSearchParams();
  const data = useTasksData(searchParams);

  if (!data) {
    return (
      <Shell>
        <DataTableSkeleton
          cellWidths={[
            "10rem",
            "30rem",
            "10rem",
            "10rem",
            "6rem",
            "6rem",
            "6rem",
          ]}
          columnCount={7}
          filterCount={2}
          shrinkZero
        />
      </Shell>
    );
  }

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
