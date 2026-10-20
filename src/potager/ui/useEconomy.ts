import { useCallback } from "react";
import type { SachetId } from "../core/economy/catalog";
import { serve as serveClient } from "../core/economy/clients";
import {
  buyChestUpgrade,
  buyParcel,
  buySachet,
  buyStallUpgrade,
  buyTool,
  type Refusal,
} from "../core/economy/shop";
import { stockStall, unstockStall } from "../core/economy/stall";
import type { Grade, ParcelId, PotagerSave, Seed, ToolId } from "../core/types";
import type { SimHost } from "../sim/simHost";

const REFUSAL: Record<Refusal, string> = {
  po: "Pas assez de PO",
  place: "Plus de place pour les graines",
  deja: "Déjà acheté",
};

type Outcome = PotagerSave | { refused: Refusal };

// Ventes et achats : chaque refus s'affiche dans la bulle de l'avatar.
export function useEconomy(host: SimHost | null, say: (text: string) => void) {
  // déplacement entre le sac et l'étal ; null : refusé avec ce message
  const move = useCallback(
    (fn: (s: PotagerSave) => PotagerSave | null, refused: string) => {
      const s = host?.state();
      if (!host || !s) return;
      if (!fn(s)) return say(refused);
      host.update((cur) => fn(cur) ?? cur);
    },
    [host, say],
  );

  const buy = useCallback(
    (fn: (s: PotagerSave) => Outcome): boolean => {
      const s = host?.state();
      if (!host || !s) return false;
      const out = fn(s);
      if ("refused" in out) {
        say(REFUSAL[out.refused]);
        return false;
      }
      host.update((cur) => {
        const next = fn(cur);
        return "refused" in next ? cur : next;
      });
      return true;
    },
    [host, say],
  );

  return {
    stock: (slot: number) => move((s) => stockStall(s, slot), "La réserve est pleine"),
    unstock: (i: number) => move((s) => unstockStall(s, i), "Ton sac est plein"),
    serve: (stallIndex: number, grade: Grade): number | null => {
      let gain: number | null = null;
      host?.update((s) => {
        const r = serveClient(s, stallIndex, grade, Math.random);
        if (!r) return s;
        gain = r.gain;
        return r.save;
      });
      return gain;
    },
    buySachet: (id: SachetId): Seed[] | null => {
      const s = host?.state();
      if (!host || !s) return null;
      // tirage aléatoire : appliqué une seule fois, sur l'état courant
      const out = buySachet(s, id, Math.random);
      if ("refused" in out) {
        say(REFUSAL[out.refused]);
        return null;
      }
      host.update(() => out.save);
      if (out.toChest) say("Sac plein : graines rangées à l'abri");
      return out.seeds;
    },
    buyParcel: (id: ParcelId) => buy((s) => buyParcel(s, id)),
    buyTool: (id: ToolId) => buy((s) => buyTool(s, id)),
    upgradeStall: () => buy(buyStallUpgrade),
    upgradeChest: () => buy(buyChestUpgrade),
  };
}
