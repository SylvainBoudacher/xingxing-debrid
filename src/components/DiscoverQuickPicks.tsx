import { DiscoverQuickPickCard } from "@/components/DiscoverQuickPickCard";
import type { Occupant } from "@/lib/discoverReleases";
import type { QuickPick } from "@/lib/releasePicks";

interface DiscoverQuickPicksProps {
  picks: QuickPick[];
  sendingHash: string | null;
  libraryHash: string | null;
  onSend: (occ: Occupant, addToLibrary: boolean) => void;
}

// Grille des choix rapides d'une fiche : une carte par résolution disponible.
export function DiscoverQuickPicks({
  picks,
  sendingHash,
  libraryHash,
  onSend,
}: DiscoverQuickPicksProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
      {picks.map((pick, i) => (
        <DiscoverQuickPickCard
          key={pick.occ.infoHash}
          pick={pick}
          index={i}
          sendingHash={sendingHash}
          libraryHash={libraryHash}
          onSend={onSend}
        />
      ))}
    </div>
  );
}
