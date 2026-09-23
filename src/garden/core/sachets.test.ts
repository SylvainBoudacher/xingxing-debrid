import { describe, expect, it } from "vitest";
import { creditDaily, MAX_PENDING, openSachet, SEEDS_PER_SACHET } from "./sachets";
import { createStarterSave } from "./starter";
import { DAY, startOfDay } from "./time";
import type { GardenSave, SachetType } from "./types";

const NOW = new Date(2026, 9, 20, 15, 30).getTime();
const day = (n: number) => startOfDay(NOW) - n * DAY;

const withSachets = (lastDailyAt: number, pending: SachetType[]): GardenSave => ({
  ...createStarterSave(),
  sachets: { lastDailyAt, pending },
});

describe("creditDaily", () => {
  it("première partie : pose la date du jour sans rien créditer", () => {
    const s = creditDaily(withSachets(0, ["quotidien"]), NOW);
    expect(s.sachets).toEqual({ lastDailyAt: startOfDay(NOW), pending: ["quotidien"] });
  });

  it("crédite un sachet par jour écoulé", () => {
    expect(creditDaily(withSachets(day(1), []), NOW).sachets.pending).toEqual(["quotidien"]);
    expect(creditDaily(withSachets(day(3), []), NOW).sachets.pending).toHaveLength(3);
  });

  it("ne crédite rien deux fois le même jour et rend la même sauvegarde", () => {
    const s = withSachets(day(0), ["quotidien"]);
    expect(creditDaily(s, NOW)).toBe(s);
  });

  it("plafonne à 7 sachets en attente", () => {
    const s = creditDaily(withSachets(day(30), ["quotidien"]), NOW);
    expect(s.sachets.pending).toHaveLength(MAX_PENDING);
    expect(s.sachets.lastDailyAt).toBe(startOfDay(NOW));
  });

  it("horloge qui recule : recale la date sans créditer", () => {
    const s = creditDaily(withSachets(startOfDay(NOW) + 5 * DAY, []), NOW);
    expect(s.sachets).toEqual({ lastDailyAt: startOfDay(NOW), pending: [] });
  });

  it("passage à l'heure d'hiver : un jour de 25 h reste un jour", () => {
    const after = new Date(2026, 9, 25, 12).getTime();
    const before = startOfDay(new Date(2026, 9, 24, 12).getTime());
    expect(creditDaily(withSachets(before, []), after).sachets.pending).toHaveLength(1);
  });
});

describe("openSachet", () => {
  it("retire un sachet et rend trois graines rangées dans l'inventaire", () => {
    const base = withSachets(day(0), ["quotidien", "quotidien"]);
    const r = openSachet(base, () => 0.5)!;
    expect(r.seeds).toHaveLength(SEEDS_PER_SACHET);
    expect(r.save.sachets.pending).toEqual(["quotidien"]);
    expect(r.save.inventory.seeds).toHaveLength(base.inventory.seeds.length + SEEDS_PER_SACHET);
    expect(r.save.progress.counters.sachetsOpened).toBe(1);
  });

  it("sans sachet en attente, ne fait rien", () => {
    expect(openSachet(withSachets(day(0), []), () => 0.5)).toBeNull();
  });

  it("une nouveauté remet la jauge de découverte à zéro, une commune fait monter celle de rareté", () => {
    const base: GardenSave = {
      ...withSachets(day(0), ["quotidien"]),
      inventory: { ...createStarterSave().inventory, seeds: [] },
      pity: { dryDiscovery: 9, dryRare: 4 },
    };
    // 0,99 : jamais de rare, jamais de nouveauté voulue. La première graine sort
    // quand même inconnue (rien n'est connu), les deux suivantes repiochent cette
    // entrée devenue connue.
    const r = openSachet(base, () => 0.99)!;
    expect(r.seeds.every((s) => s.rarity === "commune")).toBe(true);
    expect(r.save.pity.dryDiscovery).toBe(2);
    expect(r.save.pity.dryRare).toBe(7);
  });

  it("ne tire jamais deux fois la même entrée dans un sachet", () => {
    const base: GardenSave = {
      ...withSachets(day(0), ["quotidien"]),
      inventory: { ...createStarterSave().inventory, seeds: [] },
    };
    const r = openSachet(base, () => 0)!;
    const ids = r.seeds.map((s) => `${s.species}:${s.color}`);
    expect(new Set(ids).size).toBe(SEEDS_PER_SACHET);
  });
});

describe("sachets spéciaux", () => {
  // suite pseudo-aléatoire : un rng constant rendrait trois fois la même graine
  const varied = () => {
    let x = 12345;
    return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  };
  const rng = varied();

  it("le sachet doré donne au moins une graine rare ou mieux", () => {
    const s = withSachets(day(0), ["dore"]);
    const { seeds } = openSachet(s, varied())!;
    expect(seeds).toHaveLength(SEEDS_PER_SACHET);
    expect(seeds.some((seed) => seed.rarity !== "commune")).toBe(true);
  });

  it("le sachet de famille donne trois graines de la même espèce", () => {
    const s = withSachets(day(0), ["famille"]);
    const { seeds } = openSachet(s, varied())!;
    expect(seeds).toHaveLength(SEEDS_PER_SACHET);
    expect(new Set(seeds.map((seed) => seed.species)).size).toBe(1);
  });

  it("ouvre le premier sachet de la pile et garde les autres", () => {
    const s = withSachets(day(0), ["famille", "quotidien"]);
    expect(openSachet(s, rng)!.save.sachets.pending).toEqual(["quotidien"]);
  });
});
