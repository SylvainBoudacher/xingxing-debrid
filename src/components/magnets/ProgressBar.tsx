import { motion } from "motion/react";

export function ProgressBar({ downloaded, size }: { downloaded: number; size: number }) {
  if (!size || !downloaded) return null;
  const pct = Math.min(100, (downloaded / size) * 100);
  return (
    <div className="mt-1.5 h-[3px] w-full rounded-full bg-black/6 dark:bg-white/6 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-indigo-500"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}
