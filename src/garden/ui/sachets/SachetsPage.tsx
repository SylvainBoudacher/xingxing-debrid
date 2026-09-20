import { useEffect, useState } from "react";
import { herbierProgress } from "../../core/herbier";
import { chanceOf, GAUGES } from "../../core/pity";
import type { GardenSave, Seed } from "../../core/types";
import { PityGauge } from "./PityGauge";
import { SachetPack } from "./SachetPack";
import { delays, SeedReveal, STEP_MS } from "./SeedReveal";

export function SachetsPage({
  save,
  opened,
  onOpen,
}: {
  save: GardenSave;
  opened: { seq: number; seeds: Seed[] };
  onOpen: () => void;
}) {
  const herbier = herbierProgress(save);
  const complete = herbier.found === herbier.total;
  // les jauges ne bougent qu'une fois la dernière carte retournée
  const [pity, setPity] = useState(save.pity);
  useEffect(() => {
    const last = delays(opened.seeds);
    const total = (last[last.length - 1] ?? 0) + STEP_MS;
    const id = setTimeout(() => setPity(save.pity), total);
    return () => clearTimeout(id);
  }, [opened.seq, opened.seeds, save.pity]);
  return (
    <div className="flex flex-1 gap-4 overflow-auto p-5">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-xl bg-[radial-gradient(60%_60%_at_50%_40%,rgba(243,195,74,.10),transparent)]">
        <SachetPack pending={save.sachets.pending.length} onOpen={onOpen} />
        <SeedReveal key={opened.seq} seeds={opened.seeds} />
      </div>
      <aside className="flex w-[240px] flex-col gap-2.5">
        {complete ? (
          <section className="rounded-xl border border-amber-300/30 bg-[#1a1216]/85 px-3 py-2.5 text-[11px] text-[#a99a8a]">
            Toutes les fleurs sont découvertes.
          </section>
        ) : (
          <PityGauge
            title="Chance de nouveauté"
            chance={chanceOf(GAUGES.discovery, pity.dryDiscovery)}
            rule="+2 points par graine sans nouveauté, jusqu'à 75 %. Retour à 25 % dès qu'une fleur inconnue sort."
          />
        )}
        <PityGauge
          title="Chance de rare ou mieux"
          chance={chanceOf(GAUGES.rare, pity.dryRare)}
          rule="+2 points par graine sans rare, jusqu'à 70 %. Retour à 25 % dès qu'une rare sort."
        />
      </aside>
    </div>
  );
}
