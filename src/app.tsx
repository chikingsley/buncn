import * as React from "react";
import { Route, Routes } from "react-router-dom";
import { SiteHeader } from "@/components/layouts/site-header";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";

const HomePage = React.lazy(() =>
  import("@/routes/home-page").then((module) => ({ default: module.HomePage }))
);
const DataGridPage = React.lazy(() =>
  import("@/routes/data-grid-page").then((module) => ({
    default: module.DataGridPage,
  }))
);
const DataGridLivePage = React.lazy(() =>
  import("@/routes/data-grid-live-page").then((module) => ({
    default: module.DataGridLivePage,
  }))
);
const DataGridRenderPage = React.lazy(() =>
  import("@/routes/data-grid-render-page").then((module) => ({
    default: module.DataGridRenderPage,
  }))
);

export function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans antialiased">
      <SiteHeader />
      <main className="flex-1">
        <React.Suspense
          fallback={<div className="p-4 text-sm">Loading...</div>}
        >
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<DataGridPage />} path="/data-grid" />
            <Route element={<DataGridLivePage />} path="/data-grid-live" />
            <Route element={<DataGridRenderPage />} path="/data-grid-render" />
          </Routes>
        </React.Suspense>
      </main>
      <TailwindIndicator />
      <Toaster />
    </div>
  );
}
