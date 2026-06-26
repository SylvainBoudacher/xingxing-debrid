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
let removeCb: ((id: string) => void) | null = null;
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

// The pool reserved some saved ducks on its own (display limit lowered); the
// shop persists the reserved flag and refreshes its list.
let reservedCb: ((ids: string[]) => void) | null = null;
export function onDucksReserved(cb: ((ids: string[]) => void) | null) {
  reservedCb = cb;
}
export function emitDucksReserved(ids: string[]) {
  reservedCb?.(ids);
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

// Pull a duck back out of the pool (moved to reserve). No queueing: a duck can
// only be removed once it is actually swimming.
export function registerRemover(cb: ((id: string) => void) | null) {
  removeCb = cb;
}
export function removeDuck(id: string) {
  removeCb?.(id);
}

// Live count of visible ducks in the pool (saved + random), used to enforce the
// board cap before putting a reserved duck back in the water.
let countCb: (() => number) | null = null;
export function registerCounter(cb: (() => number) | null) {
  countCb = cb;
}
export function poolSize(): number {
  return countCb?.() ?? 0;
}

// Spawn an arbitrary variant directly into the pool (dev tool). Bypasses the
// MAX_DUCKS cap like saved ducks do, so it always produces a duck.
let variantSpawnerCb: ((v: Variant) => void) | null = null;
export function registerVariantSpawner(cb: ((v: Variant) => void) | null) {
  variantSpawnerCb = cb;
}
export function spawnVariant(v: Variant) {
  variantSpawnerCb?.(v);
}

// Clear saved/name on a live pool duck when it's released from the collection.
let releaserCb: ((id: string) => void) | null = null;
export function registerReleaser(cb: ((id: string) => void) | null) {
  releaserCb = cb;
}
export function releaseDuck(id: string) {
  releaserCb?.(id);
}

// Hit-test for the shop icon drawn on the canvas, so the panel's click-outside
// handler can ignore clicks that land on the icon (which toggles the panel).
let shopHitCb: ((x: number, y: number) => boolean) | null = null;
export function registerShopHitTest(cb: ((x: number, y: number) => boolean) | null) {
  shopHitCb = cb;
}
export function isOverShopIcon(x: number, y: number): boolean {
  return shopHitCb?.(x, y) ?? false;
}
