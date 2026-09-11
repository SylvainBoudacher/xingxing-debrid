import type { TitleCredits as Credits } from "@/lib/libraryTitle";

interface TitleCreditsProps {
  credits: Credits;
  // Série : TMDB donne le créateur, pas un réalisateur.
  series: boolean;
  className?: string;
}

// Réalisateur et tête d'affiche, sous le résumé du bandeau.
export function TitleCredits({ credits, series, className }: TitleCreditsProps) {
  return (
    <div className={`space-y-0.5 text-xs leading-relaxed ${className ?? ""}`}>
      {credits.director && (
        <p className="text-zinc-500 dark:text-zinc-400">
          {series ? "Créée par " : "Réalisé par "}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            {credits.director.name}
          </span>
        </p>
      )}
      {credits.cast.length > 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">
          Avec{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">
            {credits.cast.join(", ")}
          </span>
        </p>
      )}
    </div>
  );
}
