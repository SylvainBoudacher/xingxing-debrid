import { useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Collapse } from "../Collapse";
import { DnsGuideContent, OsTabs } from "../dnsGuide/DnsGuideContent";
import { detectedOs, type Os } from "../dnsGuide/dnsData";

export function NetworkGuideSection({
  open,
  onToggle,
  onRetest,
  retesting,
}: {
  open: boolean;
  onToggle: () => void;
  onRetest: () => void;
  retesting: boolean;
}) {
  const [os, setOs] = useState<Os>(detectedOs);

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-1 pb-2 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Changer de DNS
        </span>
        <span className="h-px flex-1 bg-black/8 dark:bg-white/8" />
        <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {open ? "Masquer" : "Voir le tutoriel"}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      <Collapse open={open}>
        <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Suivez les etapes dans l'ordre. Comptez deux minutes.
            </p>
            <OsTabs os={os} onChange={setOs} />
          </div>
          <DnsGuideContent
            os={os}
            afterSteps={
              <button
                type="button"
                onClick={onRetest}
                disabled={retesting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${retesting ? "animate-spin" : ""}`} />
                J'ai change mon DNS, retester ma connexion
              </button>
            }
          />
        </div>
      </Collapse>
    </section>
  );
}
