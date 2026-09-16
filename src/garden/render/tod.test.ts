import { describe, expect, it } from "vitest";
import { todOf } from "./tod";

const at = (h: number) => new Date(2026, 9, 1, h, 30);

describe("todOf", () => {
  it("découpe la journée en quatre ambiances", () => {
    expect(todOf(at(5))).toBe("nuit");
    expect(todOf(at(6))).toBe("matin");
    expect(todOf(at(10))).toBe("midi");
    expect(todOf(at(17))).toBe("soir");
    expect(todOf(at(21))).toBe("nuit");
  });
});
