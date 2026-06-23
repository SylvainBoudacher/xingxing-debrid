import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { AppMenu, type Page } from "@/components/AppMenu";
import { PATCH_NOTES } from "@/lib/patchnotes";

interface PatchnotesPageProps {
  onBack: () => void;
  onNavigate: (page: Page) => void;
  hasPendingUpdate: boolean;
  onShowPendingUpdate: () => void;
}

export function PatchnotesPage({
  onBack,
  onNavigate,
  hasPendingUpdate,
  onShowPendingUpdate,
}: PatchnotesPageProps) {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#d7e0fb_0%,_#edf1fa_45%,_#fafbfe_75%)] dark:bg-black dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight absolute left-1/2 -translate-x-1/2">
            Patch notes
          </h1>

          <AppMenu
            currentPage="patchnotes"
            onNavigate={onNavigate}
            onBack={onBack}
            hasPendingUpdate={hasPendingUpdate}
            onShowPendingUpdate={onShowPendingUpdate}
          />
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto w-full max-w-3xl px-6 pt-8 pb-12 sm:px-10 space-y-12"
      >
        {PATCH_NOTES.map((note) => (
          <article key={note.version}>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-sm font-bold text-white">
                V{note.version}
              </span>
              <span className="text-xs text-zinc-500">{note.date}</span>
            </div>

            {note.intro && (
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {note.intro}
              </p>
            )}

            {note.introImage && (
              <figure className="mb-8">
                <img
                  src={note.introImage.src}
                  alt={note.introImage.caption ?? `Version ${note.version}`}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                  }}
                  className="w-full rounded-xl ring-1 ring-black/10 dark:ring-white/10 shadow-sm"
                />
                {note.introImage.caption && (
                  <figcaption className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
                    {note.introImage.caption}
                  </figcaption>
                )}
              </figure>
            )}

            <div className="space-y-8">
              {note.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-3">
                    {section.title}
                  </h2>
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed"
                      >
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {section.images?.map((image) => (
                    <figure key={image.src} className="mt-5">
                      <img
                        src={image.src}
                        alt={image.caption ?? section.title}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                        }}
                        className="w-full rounded-xl ring-1 ring-black/10 dark:ring-white/10 shadow-sm"
                      />
                      {image.caption && (
                        <figcaption className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
                          {image.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </section>
              ))}
            </div>
          </article>
        ))}
      </motion.div>
    </main>
  );
}
