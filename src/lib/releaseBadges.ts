import { parseRelease, parseReleaseScope } from "@/lib/parseRelease";

// Badges techniques (portée, qualité, langue, codec) extraits d'un nom de release.
export function releaseBadges(releaseName: string): string[] {
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
