import logo from "@/assets/logo.png";
import { motion } from "motion/react";

/**
 * Écran de démarrage affiché pendant le prefetch des données TMDB.
 * S'anime à l'entrée et à la sortie via AnimatePresence dans App.tsx.
 */
export function SplashScreen() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f4f6fc] dark:bg-[#04050c]"
    >
      {/* Halo d'ambiance indigo — identique à DiscoverPage */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[440px] w-[700px] rounded-full bg-indigo-600/20 blur-[120px]"
        />
        <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute -bottom-24 -right-32 h-96 w-96 rounded-full bg-sky-500/8 blur-[110px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo avec animation pulse douce */}
        <motion.img
          src={logo}
          alt="c411"
          initial={{ opacity: 0, scale: 0.88, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-20 w-20 rounded-2xl shadow-xl shadow-indigo-500/20"
        />

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Bon retour chez Xingxing
        </motion.p>

        {/* Barre de progression indéterminée */}
        <div className="w-40 h-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-indigo-500"
            animate={{ x: ["-100%", "200%"] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "50%" }}
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-xs text-zinc-400 dark:text-zinc-500 tracking-wide"
        >
          Chargement de la bibliothèque…
        </motion.p>
      </div>
    </motion.div>
  );
}
