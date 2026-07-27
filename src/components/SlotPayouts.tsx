import { PAYOUTS, PRIZE_LABEL } from "./slotCopy";
import { SlotSymbolIcon } from "./slotSymbols";

// Table des gains du bandit manchot. Le 777 est le seul lot à exiger les trois
// rouleaux, le reste se paie à la paire.
export function SlotPayouts() {
  return (
    <div className="rounded-xl bg-black/25 p-3 ring-1 ring-white/10">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300/80">
        Table des gains
      </p>
      <ul className="space-y-1">
        {PAYOUTS.map((p) => (
          <li key={p.prize} className="flex items-center gap-2 text-[11px] text-zinc-300">
            <SlotSymbolIcon symbol={p.symbol} size={18} />
            <span className="flex-1 truncate">
              {PRIZE_LABEL[p.prize]}
              {p.prize === "jackpot" && <span className="text-zinc-500"> (trois 777)</span>}
            </span>
            <span className="tabular-nums text-zinc-500">{p.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-zinc-500">
        Deux symboles identiques paient la rareté du symbole, trois la donnent en shiny. Aucune
        paire : la malchance nourrit le pity du bassin.
      </p>
    </div>
  );
}
