import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSize } from "@/lib/debrid";
import { addAlias } from "@/lib/mangaAliases";
import type { MangaItem } from "@/lib/mangaItem";
import { searchMangaByName, type MangaRelease } from "@/lib/mangaReleases";
import { toastNetworkError } from "@/lib/networkError";
import { parseMangaName, spanLabel } from "@/lib/parseVolume";
import { Loader2, Plus, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

interface MangaMatchModalProps {
  item: MangaItem;
  getC411Key: () => string;
  addingHash: string | null;
  onAdd: (release: MangaRelease, item: MangaItem) => void;
  /** L'alias enregistre doit relancer la recherche automatique de la fiche. */
  onAliasSaved: () => void;
  onClose: () => void;
}

/**
 * Arbitrage manuel : l'utilisateur cherche lui-meme sur C411 le titre de
 * l'edition francaise. Le titre retenu est memorise comme alias de l'oeuvre,
 * pour que la recherche automatique le trouve ensuite toute seule.
 */
export function MangaMatchModal({
  item,
  getC411Key,
  addingHash,
  onAdd,
  onAliasSaved,
  onClose,
}: MangaMatchModalProps) {
  const [query, setQuery] = useState(item.titleFr ?? item.title);
  const [results, setResults] = useState<MangaRelease[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function runSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || searching) return;
    setSearching(true);
    try {
      setResults(await searchMangaByName(trimmed, getC411Key()));
    } catch (err) {
      toastNetworkError(err);
    } finally {
      setSearching(false);
    }
  }

  // Le titre memorise est celui de la serie deduit du nom du torrent, pas la
  // requete : c'est lui qui permettra au filtrage par prefixe de retrouver
  // toutes les autres releases de l'oeuvre.
  async function addAndRemember(release: MangaRelease) {
    const seriesTitle = parseMangaName(release.torrentName).seriesTitle;
    await addAlias(item.id, seriesTitle || query.trim());
    toast.success(`« ${seriesTitle || query.trim()} » retenu pour ${item.title}`);
    onAdd(release, item);
    onAliasSaved();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950"
      >
        <div className="flex items-center gap-3 border-b border-black/5 p-4 dark:border-white/5">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Chercher « {item.title} » sur C411
            </h2>
            <p className="text-xs text-zinc-500">
              Le titre choisi sera retenu pour cette oeuvre et réutilisé automatiquement.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={runSearch} className="flex gap-2 p-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre de l'édition française"
            autoFocus
          />
          <Button type="submit" disabled={searching}>
            {searching ? <Loader2 className="animate-spin" /> : <Search />}
            Chercher
          </Button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {results === null ? (
            <p className="py-8 text-center text-xs text-zinc-400">
              Recherche limitée à la catégorie manga de C411.
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Aucun résultat.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {results.map((release) => (
                <li
                  key={release.infoHash}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-zinc-700 dark:text-zinc-300">
                      {release.torrentName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>{spanLabel(release.span)}</span>
                      <span>{formatSize(release.size)}</span>
                      <span>{release.seeders} seeders</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={addingHash !== null || (!!release.format && release.format !== "CBZ")}
                    onClick={() => void addAndRemember(release)}
                  >
                    {addingHash === release.infoHash ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Plus />
                    )}
                    Ajouter
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
