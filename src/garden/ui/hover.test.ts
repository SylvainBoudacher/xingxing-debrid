import { describe, expect, it } from "vitest";
import { createStarterSave } from "../core/starter";
import type { GardenSave } from "../core/types";
import { describeTarget, toneOf } from "./hover";

const NOW = new Date(2026, 9, 1, 12).getTime();
const s: GardenSave = {
  ...createStarterSave(),
  tiles: { "0,1": { kind: "decor", id: "lanterne" } },
};

describe("describeTarget", () => {
  it("case : description, action et tonalité", () => {
    const ok = describeTarget(s, { kind: "tile", key: "1,1" }, "creuser", NOW);
    expect(ok.info.title).toBe("Terre");
    expect(ok.plan).toMatchObject({ ok: true, label: "Creuser un trou" });
    expect(toneOf(ok)).toBe("ok");

    const no = describeTarget(s, { kind: "tile", key: "0,0" }, "creuser", NOW);
    expect(toneOf(no)).toBe("no");
  });

  it("la Main sur du décor le range et le laisse déplaçable", () => {
    const v = describeTarget(s, { kind: "tile", key: "0,1" }, "main", NOW);
    expect(v.plan).toMatchObject({ ok: true, label: "Ranger la lanterne" });
    expect(v.movable).toBe(true);
    expect(toneOf(v)).toBe("ok");
    expect(describeTarget(s, { kind: "tile", key: "0,1" }, "arroser", NOW).movable).toBe(false);
  });

  it("corbeau", () => {
    const v = describeTarget(s, { kind: "crow", id: "c" }, "rateau", NOW);
    expect(v.info.title).toBe("Corbeau");
    expect(v.plan).toMatchObject({ ok: true, label: "Chasser" });
  });
});
