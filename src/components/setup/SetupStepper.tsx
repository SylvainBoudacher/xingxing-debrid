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
      <div className="flex items-end gap-3">
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
              className={`group flex min-w-0 flex-1 basis-0 flex-col gap-2 ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`h-1.5 w-full overflow-hidden rounded-full ${
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
                className={`flex items-center justify-center gap-1.5 text-sm font-semibold leading-tight transition-colors ${
                  active
                    ? "text-zinc-900 dark:text-white"
                    : done
                      ? "text-zinc-600 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {done && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />}
                <span className="truncate">{step.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
