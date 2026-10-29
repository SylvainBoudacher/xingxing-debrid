import { DiscoverEpisodePickRow } from "@/components/DiscoverEpisodePickRow";
import type { Occupant } from "@/lib/discoverReleases";
import type { EpisodePicks } from "@/lib/releasePicks";

interface DiscoverEpisodePicksProps {
  episodes: EpisodePicks[];
  sendingHash: string | null;
  libraryHash: string | null;
  onSend: (occ: Occupant, addToLibrary: boolean) => void;
}

// Choix rapides d'une saison sans pack : une ligne par épisode.
export function DiscoverEpisodePicks({
  episodes,
  sendingHash,
  libraryHash,
  onSend,
}: DiscoverEpisodePicksProps) {
  return (
    <div className="space-y-1.5">
      {episodes.map((entry, i) => (
        <DiscoverEpisodePickRow
          key={entry.picks[0].occ.infoHash}
          entry={entry}
          index={i}
          sendingHash={sendingHash}
          libraryHash={libraryHash}
          onSend={onSend}
        />
      ))}
    </div>
  );
}
