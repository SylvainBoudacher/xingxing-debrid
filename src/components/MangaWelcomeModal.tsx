import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, Compass, Library, X } from "lucide-react";
import { MANGA_WELCOME_STEPS } from "@/components/mangaWelcomeSteps";
import { MangaWelcomeHero } from "@/components/MangaWelcomeHero";

const HIGHLIGHT_ICONS = [Compass, Library, BookOpen];

export function MangaWelcomeModal({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const step = MANGA_WELCOME_STEPS[index];
  const isLast = index === MANGA_WELCOME_STEPS.length - 1;

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => Math.min(MANGA_WELCOME_STEPS.length - 1, Math.max(0, i + delta)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-[#f4f6fc] dark:bg-zinc-900 ring-1 ring-black/8 dark:ring-white/8 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/12 ring-1 ring-violet-500/20">
              <BookOpen className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Nouveau : Mangas
              </p>
              <p className="text-[11px] text-zinc-500">Version 1.6.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {step.hero ? (
                <MangaWelcomeHero />
              ) : (
                <img
                  src={step.image}
                  alt=""
                  className="mx-auto max-h-[50vh] w-auto rounded-xl ring-1 ring-black/10 dark:ring-white/10 shadow-lg"
                />
              )}

              <p
                className={`mt-5 font-semibold text-zinc-900 dark:text-white ${
                  step.hero ? "text-2xl text-center" : "text-lg"
                }`}
              >
                {step.title}
              </p>
              <p
                className={`mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 ${
                  step.hero ? "text-center max-w-xl mx-auto" : ""
                }`}
              >
                {step.body}
              </p>

              {step.extra && (
                <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
                  {step.extra}
                </p>
              )}

              {step.highlights && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {step.highlights.map((label, i) => {
                    const Icon = HIGHLIGHT_ICONS[i];
                    return (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 ring-1 ring-violet-500/20 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-black/6 dark:border-white/6">
          <button
            onClick={() => go(-1)}
            disabled={index === 0}
            className="flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/6 dark:hover:bg-white/6 transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
            Precedent
          </button>

          <div className="flex items-center gap-1.5">
            {MANGA_WELCOME_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                aria-label={`Étape ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-5 bg-violet-600"
                    : "w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => (isLast ? onClose() : go(1))}
            className="flex h-9 items-center gap-1 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 text-sm font-medium text-white transition-colors"
          >
            {isLast ? "C'est parti" : "Suivant"}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
