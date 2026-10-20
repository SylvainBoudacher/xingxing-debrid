import { useEffect } from "react";
import { toast } from "sonner";
import { markSeen } from "../core/growth";
import type { PotagerScene } from "../render/createPotagerScene";
import type { SimHost } from "../sim/simHost";
import { flowerName } from "./herbierView";

// Une éclosion montrée au joueur devient « vue » ; une première découverte est annoncée.
export function useBloomAnnounce(scene: PotagerScene | null, host: SimHost | null) {
  useEffect(() => {
    if (!scene || !host) return;
    return scene.onBloomSeen((key) => {
      let announce: ReturnType<typeof markSeen>["announce"] = null;
      host.update((s) => {
        const r = markSeen(s, key);
        announce = r.announce;
        return r.save;
      });
      const a = announce as ReturnType<typeof markSeen>["announce"];
      if (a) toast(`Nouvelle découverte ! ${flowerName(a.species, a.color)}`);
    });
  }, [scene, host]);
}
