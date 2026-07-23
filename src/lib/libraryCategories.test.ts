import { describe, expect, it } from "vitest";
import type { DisplayItem, LibraryEntry } from "./library";
import {
  assignHashes,
  categoryCounts,
  categoryOf,
  createCategory,
  deleteCategory,
  fromLegacyLists,
  moveCategory,
  pruneCategories,
  renameCategory,
  UNCLASSIFIED,
  type CategoryConfig,
} from "./libraryCategories";

function entry(hash: string): LibraryEntry {
  return {
    infoHash: hash,
    title: hash,
    provider: "discover",
    category: 1,
    size: 1,
    addedAt: 0,
    files: [],
    enriched: true,
    watched: {},
  } as LibraryEntry;
}

function single(hash: string): DisplayItem {
  return { type: "single", entry: entry(hash) };
}

function group(id: number, hashes: string[]): DisplayItem {
  return {
    type: "group",
    group: {
      tmdbId: id,
      tmdb: {
        id,
        mediaType: "tv",
        title: `S${id}`,
        posterPath: null,
        year: "",
        voteAverage: 0,
        overview: "",
      },
      entries: hashes.map(entry),
    },
  };
}

const base: CategoryConfig = {
  categories: [
    { id: "c1", name: "Soirée", createdAt: 0 },
    { id: "c2", name: "Doudou", createdAt: 1 },
  ],
  assign: { a: "c1" },
};

describe("createCategory / renameCategory", () => {
  it("ajoute une catégorie nommée", () => {
    const next = createCategory(base, "  Cinéma  ");
    expect(next.categories).toHaveLength(3);
    expect(next.categories[2].name).toBe("Cinéma");
  });

  it("refuse un nom vide", () => {
    expect(createCategory(base, "  ").categories).toHaveLength(2);
    expect(renameCategory(base, "c1", " ").categories[0].name).toBe("Soirée");
  });

  it("renomme la bonne catégorie", () => {
    expect(renameCategory(base, "c2", "Confort").categories[1].name).toBe("Confort");
  });
});

describe("deleteCategory", () => {
  it("rend ses titres non classés sans les supprimer", () => {
    const next = deleteCategory(base, "c1");
    expect(next.categories.map((c) => c.id)).toEqual(["c2"]);
    expect(next.assign).toEqual({});
    expect(categoryOf(next, single("a"))).toBeNull();
  });
});

describe("moveCategory", () => {
  it("déplace d'un cran", () => {
    expect(moveCategory(base, "c2", -1).categories.map((c) => c.id)).toEqual(["c2", "c1"]);
  });

  it("ignore un déplacement hors bornes", () => {
    expect(moveCategory(base, "c1", -1)).toBe(base);
    expect(moveCategory(base, "c2", 1)).toBe(base);
  });
});

describe("assignHashes", () => {
  it("range un titre, une seule catégorie à la fois", () => {
    const next = assignHashes(base, ["a"], "c2");
    expect(next.assign.a).toBe("c2");
  });

  it("null remet le titre dans les non classés", () => {
    expect(assignHashes(base, ["a"], null).assign).toEqual({});
  });

  it("range toutes les saisons d'une série d'un coup", () => {
    const next = assignHashes(base, ["s1", "s2"], "c1");
    expect(categoryOf(next, group(10, ["s1", "s2"]))).toBe("c1");
  });
});

describe("categoryOf", () => {
  it("garde une série classée quand une saison récente n'est pas affectée", () => {
    const config = assignHashes(base, ["s1"], "c2");
    expect(categoryOf(config, group(10, ["s1", "s2"]))).toBe("c2");
  });

  it("ignore une affectation vers une catégorie supprimée", () => {
    const config: CategoryConfig = { categories: [], assign: { a: "disparue" } };
    expect(categoryOf(config, single("a"))).toBeNull();
  });
});

describe("pruneCategories", () => {
  it("retire les affectations sans entrée", () => {
    const config = assignHashes(base, ["mort"], "c1");
    expect(pruneCategories(config, new Set(["a"])).assign).toEqual({ a: "c1" });
  });

  it("renvoie la même config si rien ne change", () => {
    expect(pruneCategories(base, new Set(["a"]))).toBe(base);
  });
});

describe("categoryCounts", () => {
  it("compte les non classés à part", () => {
    const counts = categoryCounts(base, [single("a"), single("b"), group(10, ["s1"])]);
    expect(counts.get("c1")).toBe(1);
    expect(counts.get(UNCLASSIFIED)).toBe(2);
  });
});

describe("fromLegacyLists", () => {
  it("convertit chaque liste en catégorie", () => {
    const config = fromLegacyLists([
      { id: "l1", name: "Soirée", hashes: ["a", "b"], createdAt: 0 },
      { id: "l2", name: "Doudou", hashes: ["b", "c"], createdAt: 1 },
    ]);
    expect(config.categories.map((c) => c.name)).toEqual(["Soirée", "Doudou"]);
    // "b" était dans deux listes : la première gagne, une seule catégorie par titre.
    expect(config.assign).toEqual({ a: "l1", b: "l1", c: "l2" });
  });
});
