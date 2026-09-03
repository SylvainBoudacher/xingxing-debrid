import { LibraryToastCard } from "@/components/LibraryToastCard";
import type { MangaItem } from "@/lib/mangaItem";
import { mangaCoverUrl } from "@/lib/mangaItem";
import type { MangaRelease } from "@/lib/mangaReleases";
import { spanLabel, type VolumeSpan } from "@/lib/parseVolume";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

interface MangaLibraryAddedToastProps {
  item: MangaItem;
  release: MangaRelease;
  /** Nombre de tomes reellement ajoutes ; absent tant que le debridage tourne. */
  volumeCount?: number;
  pending?: boolean;
  onOpen?: () => void;
}

function badges(span: VolumeSpan | null, volumeCount?: number): string[] {
  const out: string[] = [];
  if (span) out.push(spanLabel(span));
  // "Tome 12" + "1 tome" n'apprend rien : on masque le compte dans ce cas.
  const redundant = span?.kind === "single" && volumeCount === 1;
  if (volumeCount && !redundant) out.push(volumeCount === 1 ? "1 tome" : `${volumeCount} tomes`);
  return out;
}

export function toastMangaLibraryAdded({
  item,
  release,
  volumeCount,
  pending,
  onOpen,
}: MangaLibraryAddedToastProps) {
  toast.custom(
    (id) => (
      <LibraryToastCard
        posterSrc={mangaCoverUrl(item, 256)}
        fallbackIcon={<BookOpen className="h-5 w-5" />}
        pending={pending}
        statusLabel={pending ? "Débridage en cours" : "Ajouté à la bibliothèque"}
        title={item.title}
        year={item.year || undefined}
        badges={badges(release.span, volumeCount)}
        onOpen={
          onOpen
            ? () => {
                toast.dismiss(id);
                onOpen();
              }
            : undefined
        }
      />
    ),
    {
      unstyled: true,
      classNames: { toast: "!bg-transparent !border-0 !p-0 !shadow-none" },
    },
  );
}
