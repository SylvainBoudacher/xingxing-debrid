import c411Logo from "@/assets/sources/C411.webp";
import nyaaLogo from "@/assets/sources/nyaa.webp";
import { BookOpen, Compass, type LucideIcon } from "lucide-react";

export type SearchMode = "discover" | "manga" | "c411" | "nyaa";

// Modes du sélecteur en bout de barre. "discover" (défaut) redirige vers la
// page Découverte (TMDB) ; c411 / nyaa lancent une recherche brute sur place.
export const SEARCH_MODES: Array<{
  id: SearchMode;
  label: string;
  icon?: LucideIcon;
  logo?: string;
  tip: string;
}> = [
  { id: "discover", label: "Films & Séries", icon: Compass, tip: "Recherche guidée via TMDB" },
  { id: "manga", label: "Mangas", icon: BookOpen, tip: "Recherche guidée via MangaDex" },
  { id: "c411", label: "C411", logo: c411Logo, tip: "Recherche directe - torrent généraliste" },
  { id: "nyaa", label: "Nyaa", logo: nyaaLogo, tip: "Recherche directe - animé" },
];

/**
 * Contour + halo de la barre de recherche selon le mode. Films & Séries garde
 * l'aspect neutre d'origine ; les autres modes posent une teinte discrète : la
 * bordure reste très pâle, la couleur se lit surtout dans le halo diffus.
 * Nyaa passe en ardoise en thème clair, où le blanc serait invisible.
 */
export const MODE_BAR_ACCENT: Record<SearchMode, string> = {
  discover:
    "border-black/5 dark:border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.7)]",
  manga:
    "border-rose-500/20 dark:border-rose-400/25 shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_28px_4px_rgba(244,63,94,0.26)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_30px_4px_rgba(244,63,94,0.32)]",
  c411: "border-emerald-500/20 dark:border-emerald-400/25 shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_28px_4px_rgba(16,185,129,0.26)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_30px_4px_rgba(16,185,129,0.32)]",
  nyaa: "border-slate-500/20 dark:border-white/25 shadow-[0_8px_40px_rgba(0,0,0,0.12),0_0_28px_4px_rgba(100,116,139,0.24)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.7),0_0_30px_4px_rgba(255,255,255,0.24)]",
};
