import { posterUrl } from "@/lib/posterPreload";
import { parseRelease, parseReleaseScope } from "@/lib/parseRelease";
import type { TmdbItem } from "@/lib/tmdbItem";
import { ArrowRight, Check, Film, LoaderCircle } from "lucide-react";
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
  const tags = badges(releaseName);

  return (
    <div className="bg-background border-border flex w-[380px] items-center gap-3 rounded-2xl border p-3 shadow-lg">
      <div className="bg-muted h-[84px] w-14 shrink-0 overflow-hidden rounded-lg">
        {item.posterPath ? (
          <img
            src={posterUrl(item.posterPath, "w154")}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <Film className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
          {pending ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-emerald-500" />
          )}
          {pending ? "Débridage en cours" : "Ajouté à la bibliothèque"}
        </div>
        <div className="text-foreground truncate text-sm font-semibold">
          {item.title}
          {item.year ? (
            <span className="text-muted-foreground font-normal"> ({item.year})</span>
          ) : null}
        </div>
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
      >
        Voir
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
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
