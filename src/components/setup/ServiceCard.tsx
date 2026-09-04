import { motion } from "motion/react";
import { ACCENTS, TONES, type ServiceCardData } from "./serviceCards";
import { item } from "./motionVariants";

export function ServiceCard({ logo, title, badge, description, accent }: ServiceCardData) {
  const tone = ACCENTS[accent];

  return (
    <motion.div
      variants={item}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/80 px-5 py-4 ring-1 ring-black/6 transition-colors dark:bg-zinc-900/70 dark:ring-white/6 ${tone.glow}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent ${tone.bar}`}
      />
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${tone.icon}`}
        >
          <img src={logo} alt="" className="h-5 w-5 object-contain" />
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
          {title}
        </p>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONES[badge.tone]}`}
        >
          {badge.label}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
    </motion.div>
  );
}
