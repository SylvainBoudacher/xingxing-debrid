import { useRef, useState } from "react";
import { Route } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { JourneyScene } from "./journey/JourneyScene";
import { JOURNEY_STEPS } from "./journey/journeySteps";
import type { JourneySequence } from "./journey/journeyTimeline";

export function JourneyTab() {
  const [step, setStep] = useState(0);
  const sequenceRef = useRef<JourneySequence | null>(null);

  return (
    <SettingsPanel
      icon={Route}
      title="Le parcours d'un film"
      subtitle="De la recherche à la lecture, étape par étape."
    >
      <JourneyScene onStep={setStep} sequenceRef={sequenceRef} />

      <ol className="mt-5 flex flex-col gap-1.5">
        {JOURNEY_STEPS.map(({ icon: Icon, title, text }, i) => {
          const active = i === step;
          return (
            <li key={title}>
              <button
                onClick={() => sequenceRef.current?.goTo(i)}
                className={`flex w-full gap-4 rounded-xl px-3 py-3 text-left transition-colors ${
                  active
                    ? "bg-indigo-500/8 ring-1 ring-indigo-500/25"
                    : "hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors ${
                    active
                      ? "bg-indigo-500/15 ring-indigo-500/30"
                      : "bg-zinc-500/8 ring-black/6 dark:ring-white/8"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`}
                  />
                </div>
                <div className="min-w-0 pt-1">
                  <p
                    className={`text-sm font-semibold ${active ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
                  >
                    {i + 1}. {title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {text}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </SettingsPanel>
  );
}
