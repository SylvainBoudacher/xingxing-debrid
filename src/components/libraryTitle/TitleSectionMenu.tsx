import type { DebridControls } from "@/components/libraryParts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import vlcLogo from "@/assets/vlc.png";
import { Check, Copy, Download, ListChecks, Loader2, MoreHorizontal } from "lucide-react";

interface TitleSectionMenuProps {
  // Toutes les actions portent sur la saison entière : les libellés le disent.
  count: number;
  links: string[];
  sectionKey: string;
  debrid: DebridControls;
  allSeen: boolean;
  onToggleSeenAll: () => void;
  onSelectEpisodes?: () => void;
}

export function TitleSectionMenu({
  count,
  links,
  sectionKey,
  debrid,
  allSeen,
  onToggleSeenAll,
  onSelectEpisodes,
}: TitleSectionMenuProps) {
  const downloading = debrid.bulkDownloading === sectionKey;
  const copying = debrid.bulkCopying === sectionKey;
  const vlcing = debrid.bulkVlc === sectionKey;
  const busy = downloading || copying || vlcing;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Actions de la saison"
          title="Actions de la saison"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => debrid.openVlcMany(links, sectionKey)} disabled={vlcing}>
          <img src={vlcLogo} className="h-4 w-4" alt="" />
          Lire les {count} épisodes avec VLC
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => debrid.downloadMany(links, sectionKey)}
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          Télécharger les {count} épisodes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => debrid.copyMany(links, sectionKey)} disabled={copying}>
          {copying ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          Partager les {count} liens
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleSeenAll}>
          <Check className="h-4 w-4" strokeWidth={allSeen ? 3 : 2} />
          {allSeen ? "Marquer la saison comme non vue" : "Marquer la saison comme vue"}
        </DropdownMenuItem>
        {onSelectEpisodes && (
          <DropdownMenuItem onClick={onSelectEpisodes}>
            <ListChecks className="h-4 w-4" />
            Choisir des épisodes
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
