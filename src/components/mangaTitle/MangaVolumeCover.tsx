import { FadeImage } from "@/components/FadeImage";
import { coverUrl } from "@/lib/services/mangadex";

interface MangaVolumeCoverProps {
  mangaId: string;
  // Cover MangaDex du tome, null quand MangaDex n'en a pas.
  coverFileName: string | null;
  // Cover de l'oeuvre, reprise avec le numéro en surimpression.
  fallbackFileName: string | null;
  number: number | null;
  // Vignette de la vue liste : numéro plus petit.
  compact?: boolean;
  className?: string;
}

export function MangaVolumeCover({
  mangaId,
  coverFileName,
  fallbackFileName,
  number,
  compact = false,
  className = "",
}: MangaVolumeCoverProps) {
  const file = coverFileName ?? fallbackFileName;
  const generic = !coverFileName;

  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${className}`}
    >
      {file && (
        <FadeImage
          src={coverUrl(mangaId, file, 256)}
          alt=""
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover ${generic ? "brightness-50" : ""}`}
        />
      )}
      {generic && number !== null && (
        <span
          className={`absolute inset-0 flex items-center justify-center ${compact ? "text-sm" : "text-3xl"} font-black tabular-nums text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]`}
        >
          {number}
        </span>
      )}
    </div>
  );
}
