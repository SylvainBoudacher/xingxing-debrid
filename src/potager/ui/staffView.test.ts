import { describe, expect, it } from "vitest";
import { levelLine, statusLabel } from "./staffView";

describe("libellés des employés", () => {
  it("décrit le repos et les attentes", () => {
    expect(statusLabel({ kind: "idle" })).toBe("Rien à faire");
    expect(statusLabel({ kind: "pause" })).toBe("En pause");
    expect(statusLabel({ kind: "puits" })).toBe("Va au puits");
    expect(statusLabel({ kind: "abri" })).toBe("Passe à l'abri");
    expect(statusLabel({ kind: "etal" })).toBe("Attend à l'étal");
    expect(statusLabel({ kind: "noSeeds" })).toBe("Attend : plus de graines au coffre");
    expect(statusLabel({ kind: "chestFull" })).toBe("Attend : coffre plein");
  });

  it("nomme la parcelle par son numéro", () => {
    const work = (gesture: "arroser" | "chasser" | "desherber" | "becher" | "semer" | "cueillir") =>
      statusLabel({ kind: "work", gesture, cell: "p0:1:2" });
    expect(work("arroser")).toBe("Arrose la parcelle 1");
    expect(work("chasser")).toBe("Chasse une corneille sur la parcelle 1");
    expect(work("desherber")).toBe("Désherbe la parcelle 1");
    expect(work("becher")).toBe("Bêche la parcelle 1");
    expect(work("semer")).toBe("Sème la parcelle 1");
    expect(work("cueillir")).toBe("Cueille la parcelle 1");
    expect(statusLabel({ kind: "work", gesture: "arroser", cell: "p3:0:0" })).toBe(
      "Arrose la parcelle 4",
    );
    expect(statusLabel({ kind: "work", gesture: "servir", cell: "etal" })).toBe("Sert un client");
  });

  it("résume un niveau", () => {
    expect(levelLine(1)).toBe("Niveau 1 : 60 % de vitesse, 40 % de Bien");
    expect(levelLine(5)).toBe("Niveau 5 : 100 % de vitesse, 100 % de Bien");
  });
});
