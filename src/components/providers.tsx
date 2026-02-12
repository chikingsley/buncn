"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider {...props}>
        <TooltipProvider delayDuration={120}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </TooltipProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
