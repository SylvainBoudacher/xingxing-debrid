import type { Page } from "@/components/AppMenu";
import type { LibraryFilter } from "@/lib/libraryPrefs";
import { Compass, Library as LibraryIcon, Search } from "lucide-react";
import type { ReactNode } from "react";

type LibraryEmptyStateProps =
  | { kind: "empty"; onNavigate: (page: Page) => void }
  | { kind: "noMatch"; query: string; filter: LibraryFilter; onReset: () => void }
  | { kind: "noGenre"; onClearGenres: () => void };

const PRIMARY =
  "flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500";
const SECONDARY =
  "flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15";

// Le message nomme ce qui vide l'écran : la recherche passe avant le filtre,
// c'est elle que l'utilisateur vient de taper.
function noMatchMessage(query: string, filter: LibraryFilter): string {
  if (query.trim()) return `Aucun titre ne correspond à « ${query.trim()} ».`;
  if (filter === "done") return "Aucun titre vu pour l'instant.";
  return "Tout est vu, bravo !";
}

export function LibraryEmptyState(props: LibraryEmptyStateProps) {
  if (props.kind === "empty") {
    return (
      <Frame message="Aucun téléchargement pour l'instant.">
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => props.onNavigate("main")} className={PRIMARY}>
            <Search className="h-3.5 w-3.5" />
            Rechercher
          </button>
          <button onClick={() => props.onNavigate("discover")} className={SECONDARY}>
            <Compass className="h-3.5 w-3.5" />
            Découvrir
          </button>
        </div>
      </Frame>
    );
  }

  if (props.kind === "noGenre") {
    return (
      <Frame message="Aucun titre dans ces genres.">
        <button onClick={props.onClearGenres} className={`mt-1 ${SECONDARY}`}>
          Effacer les genres
        </button>
      </Frame>
    );
  }

  return (
    <Frame message={noMatchMessage(props.query, props.filter)}>
      <button onClick={props.onReset} className={`mt-1 ${SECONDARY}`}>
        Tout afficher
      </button>
    </Frame>
  );
}

function Frame({ message, children }: { message: string; children: ReactNode }) {
  return (
    <div className="mt-24 flex flex-col items-center gap-3 text-center text-zinc-400 dark:text-zinc-500">
      <LibraryIcon className="h-10 w-10" strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
      {children}
    </div>
  );
}
