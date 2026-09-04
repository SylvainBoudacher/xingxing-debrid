import { motion } from "motion/react";
import { Check } from "lucide-react";
import { SETUP_STEPS, stepIndex, type StepId } from "./steps";

export function SetupStepper({
  currentId,
  /** Remplissage du segment courant, de 0 a 1. */
  progress = 0,
  onNavigate,
}: {
  currentId: StepId;
  progress?: number;
  onNavigate: (id: StepId) => void;
}) {
  const current = stepIndex(currentId);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Progression de la configuration"
      className="min-w-0 flex-1"
    >
      <div className="flex items-end gap-2">
        {SETUP_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const fill = done ? 1 : active ? Math.min(Math.max(progress, 0), 1) : 0;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!done}
              onClick={() => onNavigate(step.id)}
              aria-current={active ? "step" : undefined}
              className={`group flex flex-1 flex-col gap-1.5 ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`h-1 w-full overflow-hidden rounded-full ${
                  active ? "bg-indigo-500/30" : "bg-black/10 dark:bg-white/12"
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{ scaleX: fill }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "left" }}
                  className={`h-full w-full rounded-full ${active ? "bg-indigo-500" : "bg-indigo-600/70"}`}
                />
              </div>
              <span
                className={`flex items-center justify-center gap-1 text-[11px] font-medium leading-tight transition-colors ${
                  active
                    ? "text-zinc-900 dark:text-white"
                    : done
                      ? "text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {done && <Check className="h-3 w-3 shrink-0 text-indigo-500" />}
                <span className="truncate">{step.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
