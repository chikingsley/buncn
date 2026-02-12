import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { FeatureFlagsProvider } from "@/app/components/feature-flags-provider";
import { TasksTable } from "@/app/components/tasks-table";
import {
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTaskStatusCounts,
  getTasks,
} from "@/app/lib/queries";
import { parseTasksSearchParams } from "@/app/lib/validations";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Shell } from "@/components/shell";
import { getValidFilters } from "@/lib/data-table";

export function HomePage() {
  const [searchParams] = useSearchParams();

  return (
    <Shell>
      <Suspense
        fallback={
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
        }
      >
        <FeatureFlagsProvider>
          <TasksTableWrapper searchParams={searchParams} />
        </FeatureFlagsProvider>
      </Suspense>
    </Shell>
  );
}

function TasksTableWrapper({
  searchParams,
}: {
  searchParams: URLSearchParams;
}) {
  const promises = React.useMemo(() => {
    const search = parseTasksSearchParams(searchParams);
    const validFilters = getValidFilters(search.filters);

    return Promise.all([
      getTasks({
        ...search,
        filters: validFilters,
      }),
      getTaskStatusCounts(),
      getTaskPriorityCounts(),
      getEstimatedHoursRange(),
    ]);
  }, [searchParams]);

  return <TasksTable promises={promises} />;
}
