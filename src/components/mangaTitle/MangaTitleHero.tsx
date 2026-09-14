import { ExpandableText } from "@/components/ExpandableText";
import { FadeImage } from "@/components/FadeImage";
import { MANGA_STATUS_LABELS } from "@/lib/mangaItem";
import type { MangaEntry } from "@/lib/mangaLibrary";
import type { ShelfCounts } from "@/lib/mangaShelf";
import { coverUrl } from "@/lib/services/mangadex";
import type { ReactNode } from "react";

interface MangaTitleHeroProps {
  entry: MangaEntry;
  counts: ShelfCounts;
  // Boutons d'action sous la présentation.
  children: ReactNode;
}

export function MangaTitleHero({ entry, counts, children }: MangaTitleHeroProps) {
  const { meta } = entry;
  const cover = meta.coverFileName ? coverUrl(entry.mangaId, meta.coverFileName, 512) : null;
  const complete = counts.published > 0 && counts.missing === 0;

  return (
    <div className="relative">
      {/* Remonte sous la barre du haut, transparente tant qu'on n'a pas défilé.
      Pas de bandeau large chez MangaDex : la cover floutée en tient lieu. */}
      <div className="relative -mt-14 h-72 w-full overflow-hidden bg-gradient-to-br from-indigo-500/25 via-zinc-200 to-zinc-300 dark:from-indigo-500/20 dark:via-zinc-800 dark:to-zinc-900">
        {cover && (
          <FadeImage
            src={cover}
            alt=""
            decoding="async"
            className="h-full w-full scale-125 object-cover object-[center_30%] opacity-60 blur-2xl"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f6fc] via-[#f4f6fc]/60 via-30% to-transparent dark:from-black dark:via-black/60" />
      </div>

      <div className="relative mx-auto -mt-48 flex max-w-5xl items-start gap-7 px-6">
        <div className="aspect-[2/3] w-52 flex-none overflow-hidden rounded-xl bg-zinc-200 shadow-2xl ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10">
          {cover ? (
            <FadeImage
              src={cover}
              alt={meta.title}
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
              {meta.title}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-12">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
            {meta.title}
          </h1>
          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300">
            {[meta.year, MANGA_STATUS_LABELS[meta.status]].filter(Boolean).join(" · ")}
          </p>

          {counts.published > 0 && (
            <div className="mt-3 max-w-md">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {complete
                    ? "Collection complète"
                    : `${counts.collected} / ${counts.published} tomes`}
                </span>
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                  {counts.read} lu{counts.read > 1 ? "s" : ""}
                </span>
              </div>
              <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.08]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-indigo-500/40"
                  style={{ width: `${Math.round((counts.collected / counts.published) * 100)}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                  style={{
                    width: `${Math.round((Math.min(counts.read, counts.published) / counts.published) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {meta.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-white/10 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {meta.description && (
            <ExpandableText text={meta.description} lines={3} className="mt-3" />
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
