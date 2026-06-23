import { QueryClient } from "@tanstack/react-query";

// Cache memoire uniquement (pas de persister). Defauts penses pour une app
// desktop : pas de refetch au focus fenetre, une seule reprise sur erreur.
// Le staleTime par service est surcharge dans chaque hook (TMDB long, C411 court).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
