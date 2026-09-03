import { LibraryToastCard } from "@/components/LibraryToastCard";
import { posterUrl } from "@/lib/posterPreload";
import { parseRelease, parseReleaseScope } from "@/lib/parseRelease";
import type { TmdbItem } from "@/lib/tmdbItem";
import { Film } from "lucide-react";
import { toast } from "sonner";

interface LibraryAddedToastProps {
  item: TmdbItem;
  /** Nom brut de la release, sert a extraire les badges techniques */
  releaseName: string;
  /** Le debridage est encore en cours cote AllDebrid */
  pending?: boolean;
  onOpen: () => void;
}

function badges(releaseName: string): string[] {
  const { quality, language, codec } = parseRelease(releaseName);
  const scope = parseReleaseScope(releaseName);
  const out: string[] = [];
  if (scope?.kind === "episode")
    out.push(`S${String(scope.season).padStart(2, "0")}E${String(scope.episode).padStart(2, "0")}`);
  else if (scope?.kind === "season") out.push(`Saison ${scope.season}`);
  else if (scope?.kind === "complete") out.push("Intégrale");
  if (quality) out.push(quality.toUpperCase());
  if (language) out.push(language);
  if (codec) out.push(codec);
  return out;
}

export function LibraryAddedToast({ item, releaseName, pending, onOpen }: LibraryAddedToastProps) {
  return (
    <LibraryToastCard
      posterSrc={item.posterPath ? posterUrl(item.posterPath, "w154") : null}
      fallbackIcon={<Film className="h-5 w-5" />}
      pending={pending}
      statusLabel={pending ? "Débridage en cours" : "Ajouté à la bibliothèque"}
      title={item.title}
      year={item.year || undefined}
      badges={badges(releaseName)}
      onOpen={onOpen}
    />
  );
}

export function toastLibraryAdded(
  props: Omit<LibraryAddedToastProps, "onOpen"> & {
    onOpen: () => void;
  },
) {
  toast.custom(
    (id) => (
      <LibraryAddedToast
        {...props}
        onOpen={() => {
          toast.dismiss(id);
          props.onOpen();
        }}
      />
    ),
    {
      unstyled: true,
      classNames: { toast: "!bg-transparent !border-0 !p-0 !shadow-none" },
    },
  );
}
