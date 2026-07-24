import type { SavedDuck } from "@/lib/savedDucks";
import type { Variant } from "./duckTypes";

export interface DuckStack {
  key: string;
  ducks: SavedDuck[];
}

// Two ducks stack only if they look strictly identical: same species (body +
// beak + pattern + effect), same accessory and its color, same shiny roll.
export function variantKey(v: Variant): string {
  return [
    v.body,
    v.beak,
    v.acc,
    v.accColor ?? "",
    v.pattern ?? "",
    v.effect ?? "",
    v.shiny ? "shiny" : "",
  ].join("|");
}

export function stackDucks(ducks: SavedDuck[]): DuckStack[] {
  const byKey = new Map<string, DuckStack>();
  const stacks: DuckStack[] = [];
  for (const d of ducks) {
    const key = variantKey(d.variant);
    let stack = byKey.get(key);
    if (!stack) {
      stack = { key, ducks: [] };
      byKey.set(key, stack);
      stacks.push(stack);
    }
    stack.ducks.push(d);
  }
  return stacks;
}
