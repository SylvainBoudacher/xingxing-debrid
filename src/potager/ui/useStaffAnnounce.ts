import { useEffect } from "react";
import { toast } from "sonner";
import { announceEntries, orphanDiscoveries } from "../core/staff/announce";
import type { ColorId } from "../core/catalog/colors";
import type { SpeciesId } from "../core/catalog/species";
import type { SimHost } from "../sim/simHost";
import { flowerName } from "./herbierView";

const EVERY_MS = 2000;

// Une fleur cueillie par le cueilleur avant d'avoir été vue s'annonce ici, Potager ouvert.
export function useStaffAnnounce(host: SimHost | null) {
  useEffect(() => {
    if (!host) return;
    const id = setInterval(() => {
      const s = host.state();
      const keys = s ? orphanDiscoveries(s) : [];
      if (!keys.length) return;
      host.update((cur) => announceEntries(cur, keys));
      for (const k of keys) {
        const [species, color] = k.split(":") as [SpeciesId, ColorId];
        toast(`Nouvelle découverte ! ${flowerName(species, color)}`);
      }
    }, EVERY_MS);
    return () => clearInterval(id);
  }, [host]);
}
