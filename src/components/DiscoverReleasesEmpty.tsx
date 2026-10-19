import c411Logo from "@/assets/sources/C411.webp";
import nyaaLogo from "@/assets/sources/nyaa.webp";

const TRACKER_BUTTON =
  "flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-700 ring-1 ring-black/10 transition-colors hover:bg-zinc-100 dark:bg-zinc-800/80 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-zinc-700/80";

interface DiscoverReleasesEmptyProps {
  message: string;
  onSearchC411: () => void;
  onSearchNyaa: () => void;
}

// Aucune release trouvée : renvoie vers une recherche brute sur un tracker.
export function DiscoverReleasesEmpty({
  message,
  onSearchC411,
  onSearchNyaa,
}: DiscoverReleasesEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16">
      <p className="text-center text-sm text-zinc-500">{message}</p>
      <div className="flex flex-col items-center gap-3">
        <p className="max-w-xs text-center text-xs text-zinc-400 dark:text-zinc-500">
          Peut-être juste mal répertorié entre TMDB et C411. Cherchez directement sur un tracker :
        </p>
        <div className="flex items-center gap-2.5">
          <button onClick={onSearchC411} className={TRACKER_BUTTON}>
            <img src={c411Logo} alt="" className="h-5 w-5 rounded-full object-cover bg-white" />
            Chercher sur C411
          </button>
          <button onClick={onSearchNyaa} className={TRACKER_BUTTON}>
            <img src={nyaaLogo} alt="" className="h-5 w-5 rounded-full object-cover bg-white" />
            Chercher sur Nyaa
          </button>
        </div>
      </div>
    </div>
  );
}
