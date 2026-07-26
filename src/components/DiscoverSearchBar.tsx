import { Loader2, Search, X } from "lucide-react";
import { motion } from "motion/react";
import type { FormEvent } from "react";

interface DiscoverSearchBarProps {
  /** Masquée (repliée) sur les onglets curatifs Ma liste / Pour vous */
  visible: boolean;
  query: string;
  placeholder: string;
  loading: boolean;
  showClear: boolean;
  onQueryChange: (q: string) => void;
  onClear: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function DiscoverSearchBar({
  visible,
  query,
  placeholder,
  loading,
  showClear,
  onQueryChange,
  onClear,
  onSubmit,
}: DiscoverSearchBarProps) {
  return (
    <motion.form
      initial={false}
      animate={
        visible
          ? { opacity: 1, y: 0, height: "auto", marginBottom: 32 }
          : { opacity: 0, y: -12, height: 0, marginBottom: 0 }
      }
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 26,
        opacity: { duration: 0.15 },
      }}
      onSubmit={onSubmit}
      className={`mx-auto max-w-2xl ${visible ? "" : "pointer-events-none"}`}
    >
      <div className="relative flex items-center gap-3 rounded-full bg-white/90 dark:bg-zinc-800/80 px-5 py-3.5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.7)]">
        <span className="relative h-5 w-5 shrink-0">
          <Search
            className={`absolute inset-0 h-5 w-5 text-zinc-500 dark:text-zinc-400 transition-opacity duration-200 ${
              loading ? "opacity-0 delay-150" : "opacity-100"
            }`}
          />
          <Loader2
            className={`absolute inset-0 h-5 w-5 text-zinc-500 dark:text-zinc-400 animate-spin transition-opacity duration-200 ${
              loading ? "opacity-100 delay-150" : "opacity-0"
            }`}
          />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-500 outline-none text-base pr-8"
        />
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200/90 dark:bg-zinc-700/80 hover:bg-zinc-300 dark:hover:bg-zinc-600/80 transition-colors"
          >
            <X className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          </button>
        )}
      </div>
    </motion.form>
  );
}
