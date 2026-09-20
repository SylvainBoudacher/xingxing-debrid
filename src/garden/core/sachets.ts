import { bump } from "./counters";
import { entryId, knownEntries } from "./discovery";
import { advance, GAUGES } from "./pity";
import { rollSachetSeed, type Rng } from "./rolls";
import { DAY, startOfDay } from "./time";
import type { GardenSave, SachetType, Seed } from "./types";

export const MAX_PENDING = 7;
export const SEEDS_PER_SACHET = 3;

export const nextSachetAt = (now: number): number => startOfDay(now) + DAY;

export function creditDaily(save: GardenSave, now: number): GardenSave {
  const today = startOfDay(now);
  const { lastDailyAt, pending } = save.sachets;
  if (lastDailyAt === today) return save;
  // première partie, ou horloge qui recule : on recale sans créditer
  if (lastDailyAt <= 0 || today < lastDailyAt)
    return { ...save, sachets: { ...save.sachets, lastDailyAt: today } };

  const days = Math.round((today - lastDailyAt) / DAY);
  const added = Math.min(days, Math.max(0, MAX_PENDING - pending.length));
  const grown: SachetType[] = added
    ? [...pending, ...Array.from({ length: added }, () => "quotidien" as const)]
    : pending;
  return { ...save, sachets: { lastDailyAt: today, pending: grown } };
}

export function openSachet(save: GardenSave, rng: Rng): { save: GardenSave; seeds: Seed[] } | null {
  const [first, ...rest] = save.sachets.pending;
  if (!first) return null;

  const known = knownEntries(save);
  const pity = { ...save.pity };
  const seeds: Seed[] = [];
  for (let i = 0; i < SEEDS_PER_SACHET; i++) {
    const seed = rollSachetSeed(known, pity, rng);
    const id = entryId(seed.species, seed.color);
    pity.dryDiscovery = known.has(id) ? advance(GAUGES.discovery, pity.dryDiscovery) : 0;
    pity.dryRare = seed.rarity === "commune" ? advance(GAUGES.rare, pity.dryRare) : 0;
    known.add(id);
    seeds.push(seed);
  }

  const next: GardenSave = {
    ...save,
    inventory: { ...save.inventory, seeds: [...save.inventory.seeds, ...seeds] },
    sachets: { ...save.sachets, pending: rest },
    pity,
  };
  return { save: bump(next, "sachetsOpened"), seeds };
}
