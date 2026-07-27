import { describe, expect, it } from "vitest";
import { rootTitle } from "@/lib/mangaTitleRoot";

describe("rootTitle", () => {
  it("coupe au premier separateur de sous-titre", () => {
    expect(rootTitle("Mushoku Tensei : Nouvelle vie, nouvelle chance")).toBe("Mushoku Tensei");
    expect(rootTitle("Mon Destin... Entre Les Mains Des Femmes")).toBe("Mon Destin");
    expect(rootTitle("Fullmetal Alchemist - Perfect Edition")).toBe("Fullmetal Alchemist");
    expect(rootTitle("Vinland Saga, edition deluxe")).toBe("Vinland Saga");
    expect(rootTitle("Death Note (Black Edition)")).toBe("Death Note");
  });

  it("ignore un titre sans sous-titre", () => {
    expect(rootTitle("Naruto")).toBeNull();
    expect(rootTitle("Spy x Family")).toBeNull();
    expect(rootTitle("Dr. Stone")).toBeNull();
  });

  it("ignore une racine trop courte pour rester discriminante", () => {
    expect(rootTitle("One - Punch Man")).toBeNull();
    expect(rootTitle("Ao : Haru Ride")).toBeNull();
    expect(rootTitle("Yotsuba, le petit monstre")).toBeNull();
  });

  it("garde une racine d'un seul mot si elle est assez longue", () => {
    expect(rootTitle("Vagabond : Edition Deluxe")).toBe("Vagabond");
    expect(rootTitle("Berserk : Deluxe Edition")).toBeNull();
  });
});
