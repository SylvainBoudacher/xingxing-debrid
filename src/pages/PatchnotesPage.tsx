import { motion } from "motion/react";
import { ArrowLeft, Home, Magnet, Menu, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PATCH_NOTES } from "@/lib/patchnotes";

interface PatchnotesPageProps {
  onBack: () => void;
  onNavigate: (page: "magnets" | "preferences") => void;
}

export function PatchnotesPage({ onBack, onNavigate }: PatchnotesPageProps) {
  return (
    <main className="relative flex min-h-screen flex-col bg-[#f4f6fc] bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#d7e0fb_0%,_#edf1fa_45%,_#fafbfe_75%)] dark:bg-black dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_20%,_#0c1d56_0%,_#04091a_45%,_#000000_75%)]">

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl">
        <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 sm:px-8">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onBack}
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>

          <h1 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight absolute left-1/2 -translate-x-1/2">Patch notes</h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors"
              >
                <Menu className="h-4 w-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onBack}>
                <Home className="mr-2 h-4 w-4" />
                Accueil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("magnets")}>
                <Magnet className="mr-2 h-4 w-4" />
                Magnets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("preferences")}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mx-auto w-full max-w-xl px-6 pt-8 pb-12 sm:px-8 space-y-10"
      >
        {PATCH_NOTES.map((note) => (
          <article key={note.version}>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-sm font-bold text-white">
                V{note.version}
              </span>
              <span className="text-xs text-zinc-500">{note.date}</span>
            </div>

            <div className="space-y-6">
              {note.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2.5">{section.title}</h2>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </motion.div>
    </main>
  );
}
