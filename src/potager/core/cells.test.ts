import { describe, expect, it } from "vitest";
import { MAP } from "./catalog/map";
import { cellAt, parcelCells } from "./cells";

describe("cases des parcelles", () => {
  it("découpe la parcelle de départ en 6 x 3 cases", () => {
    const cells = parcelCells("p0");
    const r = MAP.parcels.find((p) => p.id === "p0")!.rect;
    expect(cells).toHaveLength(18);
    expect(new Set(cells.map((c) => c.key)).size).toBe(18);
    for (const c of cells) {
      expect(c.rect.x0).toBeGreaterThanOrEqual(r.x0);
      expect(c.rect.x1).toBeLessThanOrEqual(r.x1);
      expect(c.rect.z0).toBeGreaterThanOrEqual(r.z0);
      expect(c.rect.z1).toBeLessThanOrEqual(r.z1);
    }
  });

  it("retrouve la case sous un point", () => {
    const first = parcelCells("p0")[0];
    expect(cellAt(first.center, ["p0"])?.key).toBe(first.key);
    expect(cellAt({ x: 0, z: 0 }, [])).toBeNull();
  });
});
