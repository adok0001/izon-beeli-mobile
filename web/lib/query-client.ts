import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "An unexpected error occurred.";
}

export function makeQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Mutations with their own onError already surface the failure —
        // the global handler would double-toast them.
        if (mutation.options.onError) return;
        toast.error("Something went wrong", { description: errorMessage(error) });
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only surface initial-load failures; background refetches that
        // still have data render stale content, not a broken screen.
        if (query.state.data !== undefined) return;
        // Keyed by queryHash so retries/refetches update one toast
        // instead of stacking duplicates.
        toast.error("Something went wrong", {
          id: `query-error:${query.queryHash}`,
          description: errorMessage(error),
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
