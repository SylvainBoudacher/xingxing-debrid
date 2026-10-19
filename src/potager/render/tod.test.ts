import { describe, expect, it } from "vitest";
import { lightingAt } from "./tod";

describe("lumière selon l'heure", () => {
  it("découpe la journée en quatre phases", () => {
    expect(lightingAt(5.99).phase).toBe("nuit");
    expect(lightingAt(6).phase).toBe("matin");
    expect(lightingAt(10).phase).toBe("jour");
    expect(lightingAt(17).phase).toBe("soir");
    expect(lightingAt(20).phase).toBe("nuit");
  });

  it("n'allume les lanternes que la nuit", () => {
    expect([3, 8, 12, 18, 22].map((h) => lightingAt(h).lanterns)).toEqual([
      true,
      false,
      false,
      false,
      true,
    ]);
  });
});
