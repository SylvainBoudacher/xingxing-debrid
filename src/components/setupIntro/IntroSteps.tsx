import { MonitorPlay, Play, Plus, Search, type LucideIcon } from "lucide-react";
import { STEPS } from "./stage";

const ICONS: Record<string, LucideIcon> = {
  Cherchez: Search,
  Ajoutez: Plus,
  Lancez: Play,
  Regardez: MonitorPlay,
};

/**
 * Le temps du scenario en cours, sous la scene : un seul a la fois, il entre quand
 * l'action demarre au-dessus et sort quand elle se termine (pilote par la timeline).
 */
export function IntroSteps() {
  return (
    <div className="relative mt-3 h-9">
      {STEPS.map((label) => {
        const Icon = ICONS[label];
        return (
          <div
            key={label}
            data-step
            className="absolute inset-x-0 flex items-center justify-center opacity-0"
          >
            {/* Le libelle est centre sur la scene ; l'icone est accrochee a sa gauche,
                hors du flux, pour ne pas decaler le texte. */}
            <span className="relative text-sm font-semibold text-zinc-900 dark:text-white">
              <span className="absolute inset-y-0 right-full mr-2 flex items-center">
                <span
                  data-step-icon
                  className="grid h-7 w-7 place-items-center rounded-xl bg-indigo-500/12 ring-1 ring-indigo-500/20"
                >
                  <Icon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </span>
              </span>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
