import { useState } from "react";
import { ArrowRight, ChevronDown, CircleAlert } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Collapse } from "@/components/Collapse";
import { HELP_ERRORS } from "./errorsHelp";
import type { HelpPanelId } from "./helpNav";

export function ErrorsHelpTab({ onGoTo }: { onGoTo: (panel: HelpPanelId) => void }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <SettingsPanel
      icon={CircleAlert}
      title="Erreurs fréquentes"
      subtitle="Ce que veulent dire les messages d'erreur, et quoi faire."
    >
      <div className="flex flex-col gap-2">
        {HELP_ERRORS.map((err, i) => {
          const isOpen = open === i;
          return (
            <div
              key={err.message}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-900/60 ring-1 ring-black/6 dark:ring-white/6"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {err.message}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <Collapse open={isOpen}>
                <div className="space-y-3 px-4 pb-4 text-xs leading-relaxed">
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Pourquoi ?</p>
                    <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{err.why}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Que faire ?</p>
                    <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">{err.fix}</p>
                  </div>
                  {err.link && (
                    <button
                      onClick={() => onGoTo(err.link!.panel)}
                      className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {err.link.label}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </Collapse>
            </div>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
