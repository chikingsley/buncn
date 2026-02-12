import { Route, Routes } from "react-router-dom";
import { SiteHeader } from "@/components/layouts/site-header";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/sonner";
import { DataGridLivePage } from "@/routes/data-grid-live-page";
import { DataGridPage } from "@/routes/data-grid-page";
import { DataGridRenderPage } from "@/routes/data-grid-render-page";
import { HomePage } from "@/routes/home-page";

export function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background font-sans antialiased">
      <SiteHeader />
      <main className="flex-1">
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<DataGridPage />} path="/data-grid" />
          <Route element={<DataGridLivePage />} path="/data-grid-live" />
          <Route element={<DataGridRenderPage />} path="/data-grid-render" />
        </Routes>
      </main>
      <TailwindIndicator />
      <Toaster />
    </div>
  );
}
