import { Input } from "@/components/ui/input";
import { addAlias } from "@/lib/mangaAliases";
import { mangaCoverUrl, MANGA_STATUS_LABELS, type MangaItem } from "@/lib/mangaItem";
import type { MangaRelease } from "@/lib/mangaReleases";
import { parseMangaName, spanLabel } from "@/lib/parseVolume";
import { useMangaSearch } from "@/lib/useMangaSearch";
import { BookMarked, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface MangaLinkModalProps {
  release: MangaRelease;
  busy: boolean;
  onPick: (release: MangaRelease, item: MangaItem) => void;
  onClose: () => void;
}

/**
 * Rattache une release CBZ trouvee dans la recherche generale a une oeuvre
 * MangaDex, pour l'ajouter a la bibliotheque manga. Le titre de serie deduit
 * du nom du torrent sert de requete initiale et est memorise comme alias.
 */
export function MangaLinkModal({ release, busy, onPick, onClose }: MangaLinkModalProps) {
  const seriesTitle = parseMangaName(release.torrentName).seriesTitle;
  const [query, setQuery] = useState(seriesTitle);
  const { results, loading } = useMangaSearch(query);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function pick(item: MangaItem) {
    if (busy) return;
    if (seriesTitle) await addAlias(item.id, seriesTitle);
    onPick(release, item);
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
              Ajouter à la bibliothèque manga
            </h2>
            <p className="truncate text-xs text-zinc-500">
              {spanLabel(release.span)} — {release.torrentName}
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

        <div className="p-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre de l'œuvre"
            autoFocus
          />
          <p className="mt-2 text-xs text-zinc-500">
            Choisissez l'oeuvre correspondante : le titre du torrent sera retenu pour elle.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {loading && results === null ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : results === null ? null : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Aucune œuvre trouvée.</p>
          ) : (
            <div className="space-y-2">
              {results.map((item) => {
                const cover = mangaCoverUrl(item, 256);
                return (
                  <button
                    key={item.id}
                    onClick={() => pick(item)}
                    disabled={busy}
                    className="flex w-full items-center gap-3 rounded-xl bg-black/3 px-3 py-2 text-left transition-colors hover:bg-black/6 disabled:opacity-50 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-16 w-11 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-md bg-black/6 dark:bg-white/6">
                        <BookMarked className="h-4 w-4 text-zinc-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {[item.year, MANGA_STATUS_LABELS[item.status]].filter(Boolean).join(" — ")}
                      </p>
                    </div>
                    {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-zinc-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
