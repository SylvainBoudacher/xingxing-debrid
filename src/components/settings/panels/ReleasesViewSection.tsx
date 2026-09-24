import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loadReleasesView,
  releasesViewQueryKey,
  saveReleasesView,
  type ReleasesView,
} from "@/lib/releasesView";
import { FieldTitle, ViewOptionCard } from "../controls";

// Choix entre les cartes par résolution et la liste complète dans la fiche
// d'un film / d'une série.
export function ReleasesViewSection() {
  const queryClient = useQueryClient();
  const view = useQuery({
    queryKey: releasesViewQueryKey,
    staleTime: Infinity,
    queryFn: loadReleasesView,
  }).data;

  async function handleChange(next: ReleasesView) {
    queryClient.setQueryData(releasesViewQueryKey, next);
    await saveReleasesView(next);
  }

  return (
    <>
      <FieldTitle
        title="Fiche d'un film ou d'une série"
        hint="Les versions proposées quand vous ouvrez une fiche depuis Découvrir ou la bibliothèque."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <ViewOptionCard
          label="Choix rapide"
          selected={view === "quick"}
          onClick={() => handleChange("quick")}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {["4K", "1080p"].map((res) => (
              <div key={res} className="rounded-lg bg-black/4 dark:bg-white/5 px-2.5 py-2">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{res}</p>
                <div className="mt-1.5 h-4 rounded-full bg-indigo-600/90" />
              </div>
            ))}
          </div>
        </ViewOptionCard>

        <ViewOptionCard
          label="Liste complète"
          selected={view === "full"}
          onClick={() => handleChange("full")}
        >
          <div className="space-y-1.5">
            {["2160P  X265  MULTI", "1080P  X264  VFF"].map((tags) => (
              <div
                key={tags}
                className="flex items-center justify-between gap-2 rounded-lg bg-black/4 dark:bg-white/5 px-2.5 py-1.5"
              >
                <span className="text-[10px] font-semibold text-zinc-500 whitespace-pre">
                  {tags}
                </span>
                <span className="h-3 w-8 rounded-full bg-indigo-600/90" />
              </div>
            ))}
          </div>
        </ViewOptionCard>
      </div>
    </>
  );
}
