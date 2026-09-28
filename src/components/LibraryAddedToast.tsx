import { LibraryToastCard } from "@/components/LibraryToastCard";
import { posterUrl } from "@/lib/posterPreload";
import { releaseBadges } from "@/lib/releaseBadges";
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

export function LibraryAddedToast({ item, releaseName, pending, onOpen }: LibraryAddedToastProps) {
  return (
    <LibraryToastCard
      posterSrc={item.posterPath ? posterUrl(item.posterPath, "w154") : null}
      fallbackIcon={<Film className="h-5 w-5" />}
      pending={pending}
      statusLabel={pending ? "Débridage en cours" : "Ajouté à la bibliothèque"}
      title={item.title}
      year={item.year || undefined}
      badges={releaseBadges(releaseName)}
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
