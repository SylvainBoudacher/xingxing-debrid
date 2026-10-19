import { useCallback, useSyncExternalStore } from "react";
import type { PotagerSave } from "../core/types";
import type { SimHost } from "../sim/simHost";

// État de la simulation, relu à chaque tick
export function useHostState(host: SimHost | null): PotagerSave | null {
  const subscribe = useCallback((cb: () => void) => host?.subscribe(cb) ?? (() => {}), [host]);
  return useSyncExternalStore(subscribe, () => host?.state() ?? null);
}
