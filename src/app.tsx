import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { SiteHeader } from "@/components/layouts/site-header";
import { Shell } from "@/components/shell";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";

const HomePage = lazy(() =>
  import("@/routes/home-page").then((module) => ({ default: module.HomePage }))
);
const DataGridPage = lazy(() =>
  import("@/routes/data-grid-page").then((module) => ({
    default: module.DataGridPage,
  }))
);
const DataGridLivePage = lazy(() =>
  import("@/routes/data-grid-live-page").then((module) => ({
    default: module.DataGridLivePage,
  }))
);
const DataGridRenderPage = lazy(() =>
  import("@/routes/data-grid-render-page").then((module) => ({
    default: module.DataGridRenderPage,
  }))
);
const MailPage = lazy(() =>
  import("@/routes/mail-page").then((module) => ({
    default: module.MailPage,
  }))
);
const MediaPlayerPage = lazy(() =>
  import("@/routes/media-player-page").then((module) => ({
    default: module.MediaPlayerPage,
  }))
);

export function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans antialiased">
      <SiteHeader />
      <main className="flex-1">
        <Suspense
          fallback={
            <Shell>
              <DataTableSkeleton columnCount={5} filterCount={2} shrinkZero />
            </Shell>
          }
        >
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<DataGridPage />} path="/data-grid" />
            <Route element={<DataGridLivePage />} path="/data-grid-live" />
            <Route element={<DataGridRenderPage />} path="/data-grid-render" />
            <Route element={<MailPage />} path="/mail" />
            <Route element={<MediaPlayerPage />} path="/media-player" />
          </Routes>
        </Suspense>
      </main>
      <TailwindIndicator />
      <Toaster />
    </div>
  );
}
