import { Suspense } from "react";
import { DataGridDemo } from "@/app/data-grid/components/data-grid-demo";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";

export function DataGridPage() {
  return (
    <Suspense
      fallback={
        <DataGridSkeleton className="container flex flex-col gap-4 py-4">
          <DataGridSkeletonToolbar actionCount={5} />
          <DataGridSkeletonGrid />
        </DataGridSkeleton>
      }
    >
      <DataGridDemo />
    </Suspense>
  );
}
