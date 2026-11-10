import { describe, expect, test } from "vitest";
import { mergeUpdates, type EntryUpdate } from "./merge";
import { alert, tvEntry, VF_1080 } from "./testFixtures";
import type { RadarExpectation } from "./types";

const update = (patch: Partial<EntryUpdate> = {}): EntryUpdate => ({
  expectation: VF_1080,
  known: {},
  baseline: [],
  newAlerts: [],
  replaced: [],
  packs: {},
  episodes: [],
  aired: [],
  ...patch,
});

const id = "tv-10-3";

describe("mergeUpdates", () => {
  test("Review Focus 2 : ligne supprimée pendant la vérification ignorée", () => {
    expect(mergeUpdates([], new Map([[id, update()]]))).toEqual([]);
  });

  test("Review Focus 2 : réglage changé pendant la vérification, résultat ignoré", () => {
    const changed: RadarExpectation = { language: "vostfr", resolution: "any", mode: "soft" };
    const merged = mergeUpdates(
      [tvEntry({ expectation: changed })],
      new Map([[id, update({ newAlerts: [alert("full")] })]]),
    );
    expect(merged[0].alerts).toEqual([]);
  });

  test("une ligne sans changement de réglage reçoit son résultat", () => {
    const merged = mergeUpdates(
      [tvEntry()],
      new Map([[id, update({ newAlerts: [alert("full")], aired: [1] })]]),
    );
    expect(merged[0].alerts).toHaveLength(1);
    expect(merged[0].aired).toEqual([1]);
    expect(merged[0].expectation).toEqual(VF_1080);
  });

  test("une ligne sans résultat reste identique", () => {
    const entry = tvEntry();
    expect(mergeUpdates([entry], new Map())[0]).toBe(entry);
  });

  test("I3 : des alertes marquées vues pendant la vérification ne reviennent pas", () => {
    const merged = mergeUpdates([tvEntry({ alerts: [] })], new Map([[id, update()]]));
    expect(merged[0].alerts).toEqual([]);
  });

  test("I3 : les alertes existantes sont conservées, les nouvelles ajoutées", () => {
    const merged = mergeUpdates(
      [tvEntry({ alerts: [alert("partial", "e1")] })],
      new Map([[id, update({ newAlerts: [alert("full", "e2")] })]]),
    );
    expect(merged[0].alerts.map((a) => a.content)).toEqual(["e1", "e2"]);
  });

  test("I3 : une alerte complète retire la mi-alerte du même contenu", () => {
    const merged = mergeUpdates(
      [tvEntry({ alerts: [alert("partial", "e6")] })],
      new Map([[id, update({ newAlerts: [alert("full", "e6")], replaced: ["e6"] })]]),
    );
    expect(merged[0].alerts.map((a) => a.level)).toEqual(["full"]);
  });

  test("I3 : les versions connues s'additionnent", () => {
    const vf = { language: "vf", resolution: "1080p" } as const;
    const vo = { language: "vo", resolution: "720p" } as const;
    const merged = mergeUpdates(
      [tvEntry({ known: { e1: [vf] } })],
      new Map([[id, update({ known: { e1: [vo], e2: [vf] } })]]),
    );
    expect(merged[0].known).toEqual({ e1: [vf, vo], e2: [vf] });
  });

  test("la couverture déjà figée d'un pack est conservée", () => {
    const merged = mergeUpdates(
      [tvEntry({ packs: { a: [1] } })],
      new Map([[id, update({ packs: { a: [1, 2], b: [3] } })]]),
    );
    expect(merged[0].packs).toEqual({ a: [1], b: [3] });
  });
});
