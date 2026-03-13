import { QueryClient } from "@tanstack/react-query";

declare global {
  var __buncnQueryClient__: QueryClient | undefined;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      },
    },
  });
}

export const appQueryClient =
  globalThis.__buncnQueryClient__ ?? createQueryClient();

if (typeof globalThis !== "undefined") {
  globalThis.__buncnQueryClient__ = appQueryClient;
}
