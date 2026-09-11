import { scopeLabel } from "@/lib/discoverReleases";
import type { ReleaseTags } from "@/lib/releaseTags";

interface ReleaseTagBadgesProps {
  tags: ReleaseTags;
  // La portée (saison / épisode) n'a de sens que pour les séries.
  showScope?: boolean;
  className?: string;
}

const BADGE = "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide";

// Badges qualité / codec / langues d'une release, partagés entre la fiche
// Découverte et la fiche bibliothèque.
export function ReleaseTagBadges({ tags, showScope = true, className }: ReleaseTagBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {showScope && tags.scope && (
        <span
          className={`${BADGE} ${
            tags.scope.kind === "episode"
              ? "bg-sky-500/12 text-sky-600 dark:text-sky-400"
              : "bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-400"
          }`}
        >
          {scopeLabel(tags.scope)}
        </span>
      )}
      {tags.resolution && (
        <span className={`${BADGE} bg-indigo-500/12 text-indigo-700 dark:text-indigo-300`}>
          {tags.resolution}
        </span>
      )}
      {tags.videoCodec && (
        <span className={`${BADGE} bg-black/6 dark:bg-white/6 text-zinc-500 dark:text-zinc-400`}>
          {tags.videoCodec}
        </span>
      )}
      {tags.specialVersion && (
        <span className={`${BADGE} bg-amber-500/12 text-amber-600 dark:text-amber-400`}>
          {tags.specialVersion}
        </span>
      )}
      {tags.languages.map((l) => (
        <span key={l} className={`${BADGE} bg-green-500/10 text-green-600 dark:text-green-400`}>
          {l}
        </span>
      ))}
    </div>
  );
}
