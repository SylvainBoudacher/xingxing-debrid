import { useEffect } from "react";
import type { SimHost } from "../sim/simHost";
import type { ActiveGame } from "./minigames/minigameKit";

// La case du mini-jeu en cours est transmise à la simulation : les employés la laissent au joueur.
export function usePlayerBusy(host: SimHost | null, game: ActiveGame | null) {
  const busy =
    game?.target.kind === "cell" ? game.target.key : game?.gesture === "servir" ? "etal" : null;
  useEffect(() => {
    if (!host) return;
    host.update((s) => (s.playerBusy === busy ? s : { ...s, playerBusy: busy }));
    return () => host.update((s) => (s.playerBusy === null ? s : { ...s, playerBusy: null }));
  }, [host, busy]);
}
