"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appQueryClient } from "@/lib/query-client";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <QueryClientProvider client={appQueryClient}>
      <NextThemesProvider {...props}>
        <TooltipProvider delay={120}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </TooltipProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
