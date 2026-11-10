import { describe, expect, test } from "vitest";
import { mergeUpdates, type EntryUpdate } from "./merge";
import { alert, tvEntry, VF_1080 } from "./testFixtures";
import type { RadarExpectation } from "./types";

const update = (patch: Partial<EntryUpdate> = {}): EntryUpdate => ({
  expectation: VF_1080,
  known: {},
  baseline: [],
  alerts: [],
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
      new Map([[id, update({ alerts: [alert("full")] })]]),
    );
    expect(merged[0].alerts).toEqual([]);
  });

  test("une ligne sans changement de réglage reçoit son résultat", () => {
    const merged = mergeUpdates(
      [tvEntry()],
      new Map([[id, update({ alerts: [alert("full")], aired: [1] })]]),
    );
    expect(merged[0].alerts).toHaveLength(1);
    expect(merged[0].aired).toEqual([1]);
    expect(merged[0].expectation).toEqual(VF_1080);
  });

  test("une ligne sans résultat reste identique", () => {
    const entry = tvEntry();
    expect(mergeUpdates([entry], new Map())[0]).toBe(entry);
  });
});
