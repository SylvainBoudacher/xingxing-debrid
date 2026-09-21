import { herbierProgress } from "../../core/herbier";
import { TREE } from "../../core/catalog/tree";
import { openNodes } from "../../core/progression";
import { PLOTS } from "../../core/plots";
import type { GardenSave } from "../../core/types";

const card = "rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-3 py-2";
const key = "text-[10px] uppercase tracking-wide text-[#a99a8a]";
const value = "font-serif text-[17px] text-[#f3dca0]";

export function SummaryBar({ save }: { save: GardenSave }) {
  const herbier = herbierProgress(save);
  const done = TREE.filter((n) => save.progress.nodes[n.id]).length;
  const goals = openNodes(save);
  return (
    <header className="flex flex-wrap items-stretch gap-2 px-5 pt-4">
      <section className={`${card} min-w-[190px] flex-1`}>
        <div className={key}>Paliers</div>
        <div className={value}>
          {done} / {TREE.length}
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#2c2027] ring-1 ring-inset ring-amber-300/25">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8a6a3a] to-[#f3c34a] transition-[width] duration-700"
            style={{ width: `${(done / TREE.length) * 100}%` }}
          />
        </div>
      </section>
      <section className={card}>
        <div className={key}>Herbier</div>
        <div className={value}>
          {herbier.found} / {herbier.total}
        </div>
      </section>
      <section className={card}>
        <div className={key}>Parcelles</div>
        <div className={value}>
          {save.plots.length} / {Object.keys(PLOTS).length}
        </div>
      </section>
      <section className={card}>
        <div className={key}>Sachets</div>
        <div className={value}>{save.sachets.pending.length} à ouvrir</div>
      </section>
      <section className={`${card} min-w-[220px] flex-[2]`}>
        <div className={key}>En cours</div>
        <ul className="mt-0.5 text-[11px] leading-snug text-[#d8c9b4]">
          {goals.slice(0, 3).map((n) => (
            <li key={n.id}>{n.taskLabel}</li>
          ))}
          {!goals.length && <li className="text-[#a99a8a]">Tout est terminé.</li>}
        </ul>
      </section>
    </header>
  );
}
