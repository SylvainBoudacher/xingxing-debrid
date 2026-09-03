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
    </ShimmerButton>
  );
}
