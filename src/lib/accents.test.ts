import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Garde-fou : les textes affiches doivent etre accentues.
 * Liste des formes fautives les plus courantes dans cette app ; completer au besoin.
 */
const WRONG = [
  "acces",
  "apercu",
  "apres",
  "arriere",
  "bibliotheque",
  "categorie",
  "categories",
  "cle",
  "cles",
  "complete",
  "completement",
  "decouverte",
  "decouvrir",
  "defaut",
  "deja",
  "demarrage",
  "derniere",
  "desormais",
  "detail",
  "details",
  "donnees",
  "duree",
  "ecran",
  "edition",
  "egalement",
  "element",
  "elements",
  "entree",
  "entierement",
  "episode",
  "episodes",
  "etape",
  "etapes",
  "etre",
  "facon",
  "fenetre",
  "fonctionnalite",
  "francais",
  "general",
  "immediatement",
  "meme",
  "numero",
  "parametre",
  "parametres",
  "premiere",
  "priorite",
  "probleme",
  "problemes",
  "qualite",
  "recompense",
  "recuperer",
  "reglage",
  "reglages",
  "reseau",
  "resultat",
  "resultats",
  "selection",
  "serie",
  "series",
  "systeme",
  "telechargement",
  "telecharger",
  "theme",
  "unite",
  "verification",
  "verifier",
  "verifiez",
];
const WRONG_RE = new RegExp(`\\b(${WRONG.join("|")})\\b`, "i");

/** Une chaine est consideree affichee si elle contient une phrase francaise. */
const FRENCH =
  /\b(le|la|les|des|dans|pour|est|avec|votre|vous|une|qui|du|au|sur|et|ce|cette|en|par)\b/i;
const CLASSNAME = /(^|\s)(flex|grid|rounded|text-|bg-|px-|py-|dark:|hover:)/;
const STRING = /"([^"\n\\]*)"|'([^'\n\\]*)'|`([^`\\]*)`/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return p.includes("lib/data") ? [] : sourceFiles(p);
    if (!/\.tsx?$/.test(p) || p.endsWith(".test.ts")) return [];
    return [p];
  });
}

describe("accents des textes affiches", () => {
  it("aucun mot francais non accentue dans les chaines affichees", () => {
    const offenses: string[] = [];
    for (const file of sourceFiles("src")) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/^\s*import /.test(line)) return;
          for (const m of line.matchAll(STRING)) {
            const text = m[1] ?? m[2] ?? m[3] ?? "";
            if (!text.includes(" ") || !FRENCH.test(text) || CLASSNAME.test(text)) continue;
            if (WRONG_RE.test(text)) offenses.push(`${file}:${i + 1}: ${text.slice(0, 90)}`);
          }
        });
    }
    expect(offenses).toEqual([]);
  });
});
