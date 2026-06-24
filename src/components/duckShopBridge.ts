import type { Variant } from "./duckTypes";

// Bridge between the canvas pool (PixelPool, module-scope/imperative) and the
// React shop UI (DuckShop). Plain module-level callbacks: PixelPool emits drop
// / open events the panel listens to, and the panel injects saved ducks back
// into the pool. No global state library, matching the rest of the codebase.

export interface DuckSpec {
  id: string;
  name: string;
  variant: Variant;
  scale: number;
}

// A duck dropped onto the shop, with handles back into the live pool duck.
export interface DroppedDuck {
  id: string;
  variant: Variant;
  scale: number;
  saved: boolean;
  name: string;
  release: () => void; // let the duck swim again (called when the panel closes)
  markSaved: (name: string) => void; // tag the live pool duck as saved + named
}

let dropCb: ((d: DroppedDuck) => void) | null = null;
let openCb: (() => void) | null = null;
let injectCb: ((spec: DuckSpec) => void) | null = null;
let pending: DuckSpec[] = [];

export function onDuckDrop(cb: ((d: DroppedDuck) => void) | null) {
  dropCb = cb;
}
export function emitDuckDrop(d: DroppedDuck) {
  dropCb?.(d);
}

export function onShopOpen(cb: (() => void) | null) {
  openCb = cb;
}
export function emitShopOpen() {
  openCb?.();
}

// PixelPool registers its spawn function on mount. Specs requested before the
// pool exists (saved ducks loaded at startup) are queued and flushed here.
export function registerInjector(cb: ((spec: DuckSpec) => void) | null) {
  injectCb = cb;
  if (cb && pending.length) {
    pending.forEach(cb);
    pending = [];
  }
}
export function injectDuck(spec: DuckSpec) {
  if (injectCb) injectCb(spec);
  else pending.push(spec);
}
