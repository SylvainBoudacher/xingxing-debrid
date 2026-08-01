import { ShimmerButton } from "@/components/ui/shimmer-button";

interface LetterboxdFeedPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

// Pilule de la source "Top Letterboxd" : seule source non-TMDB, signalée par le
// shimmer. Les couleurs passent par des variables CSS pour suivre le thème
// (ShimmerButton ne prend qu'une valeur par prop).
export function LetterboxdFeedPill({ label, active, onClick }: LetterboxdFeedPillProps) {
  return (
    <ShimmerButton
      onClick={onClick}
      borderRadius="9999px"
      shimmerDuration="3.5s"
      background="var(--lb-pill-bg)"
      shimmerColor="var(--lb-pill-shine)"
      className={`gap-1.5 px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
        active
          ? "text-white ring-indigo-500 [--lb-pill-bg:#4f46e5] [--lb-pill-shine:#ffffff]"
          : "text-zinc-500 ring-black/10 [--lb-pill-bg:rgba(255,255,255,0.9)] [--lb-pill-shine:#6366f1] hover:text-zinc-900 dark:text-zinc-400 dark:ring-white/10 dark:[--lb-pill-bg:rgba(39,39,42,0.8)] dark:[--lb-pill-shine:#ffffff] dark:hover:text-white"
      }`}
    >
      {label}
      {/* Même badge que le bouton Manga de l'accueil, aux couleurs Letterboxd. */}
      <span
        className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
          active
            ? "bg-white/15 text-emerald-200"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
        }`}
      >
        <span className="h-1 w-1 animate-pulse rounded-full bg-[#00e054]" />
        New
      </span>
    </ShimmerButton>
  );
}
