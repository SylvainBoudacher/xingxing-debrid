import { describe, expect, it } from "vitest";
import pkg from "../../package.json";
import { PATCH_NOTES } from "@/lib/patchnotes";
import { LATEST_VERSION } from "@/lib/version";

describe("LATEST_VERSION", () => {
  it("suit la première note de version et package.json", () => {
    expect(LATEST_VERSION).toBe(PATCH_NOTES[0].version);
    expect(LATEST_VERSION).toBe(pkg.version);
  });
});
