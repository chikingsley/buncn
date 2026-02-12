import { lazy, Suspense } from "react";
import {
  DataGridSkeleton,
  DataGridSkeletonGrid,
  DataGridSkeletonToolbar,
} from "@/components/data-grid/data-grid-skeleton";

const DataGridLiveDemo = lazy(() =>
  import("@/app/data-grid-live/components/data-grid-live-demo").then((mod) => ({
    default: mod.DataGridLiveDemo,
  }))
);

export function DataGridLivePage() {
  return (
    <Suspense
      fallback={
        <DataGridSkeleton className="container flex flex-col gap-4 py-4">
          <DataGridSkeletonToolbar actionCount={4} />
          <DataGridSkeletonGrid />
        </DataGridSkeleton>
      }
    >
      <DataGridLiveDemo />
    </Suspense>
  );
}
