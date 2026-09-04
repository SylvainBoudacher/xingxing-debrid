import { ChevronDown, Globe, ShieldCheck } from "lucide-react";
import { Collapse } from "../Collapse";
import { DnsFlow } from "./DnsFlow";

const REASSURANCE = [
  "Ce n'est pas un VPN : votre connexion, votre debit et votre adresse IP ne changent pas.",
  "C'est un reglage systeme standard, reversible en trente secondes.",
  "1.1.1.1 (Cloudflare) et 8.8.8.8 (Google) sont des annuaires publics et gratuits.",
];

export function NetworkExplainer({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-1 pb-2 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Comprendre
        </span>
        <span className="h-px flex-1 bg-black/8 dark:bg-white/8" />
        <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {open ? "Masquer" : "En savoir plus"}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      <Collapse open={open}>
        <div className="space-y-3 pb-1">
          <div className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 ring-1 ring-black/6 dark:ring-white/6 px-5 py-4">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 ring-1 ring-violet-500/20">
                <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">
                  Le DNS, c'est l'annuaire d'internet
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Vous tapez un nom de site, le DNS renvoie l'adresse de la machine qui l'heberge.
                  Par defaut, c'est l'annuaire de votre operateur qui repond. S'il refuse de
                  repondre pour c411.org, le site parait hors ligne alors qu'il fonctionne. La
                  solution est de demander a un autre annuaire.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <DnsFlow />
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-500/8 ring-1 ring-emerald-500/20 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Changer de DNS n'a rien de risque
              </p>
            </div>
            <ul className="space-y-1.5">
              {REASSURANCE.map((line) => (
                <li
                  key={line}
                  className="flex gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Collapse>
    </section>
  );
}
