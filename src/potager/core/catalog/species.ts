import type { Rarity } from "../types";
import type { ColorId } from "./colors";

export type HarvestTool = "main" | "secateur";

interface SpeciesData {
  id: string;
  name: string;
  feminine: boolean;
  tool: HarvestTool;
  note: string;
  colors: readonly { color: ColorId; rarity: Rarity }[];
}

const c = (color: ColorId, rarity: Rarity) => ({ color, rarity });

// Ordre du catalogue : celui de l'Herbier.
export const SPECIES = [
  {
    id: "tournesol",
    name: "Tournesol",
    feminine: false,
    tool: "secateur",
    note: "Il a suivi le soleil tout l'été ; en automne, sa tête lourde regarde enfin le sol et nourrit les mésanges.",
    colors: [
      c("yellow", "commune"),
      c("orange", "commune"),
      c("bronze", "rare"),
      c("burgundy", "epique"),
      c("white", "legendaire"),
    ],
  },
  {
    id: "rosetremiere",
    name: "Rose trémière",
    feminine: true,
    tool: "secateur",
    note: "Elle pousse contre les murs chauds et fleurit de bas en haut, comme une échelle qu'on grimpe jusqu'aux premiers froids.",
    colors: [
      c("pink", "commune"),
      c("white", "commune"),
      c("yellow", "rare"),
      c("red", "rare"),
      c("black", "legendaire"),
    ],
  },
  {
    id: "dahlia",
    name: "Dahlia",
    feminine: false,
    tool: "secateur",
    note: "Plus on le coupe, plus il fleurit. Ses pompons tiennent jusqu'à la première gelée, qui les noircit en une nuit.",
    colors: [
      c("red", "commune"),
      c("orange", "commune"),
      c("pink", "rare"),
      c("apricot", "rare"),
      c("burgundy", "epique"),
      c("blue", "legendaire"),
    ],
  },
  {
    id: "cosmos",
    name: "Cosmos",
    feminine: false,
    tool: "main",
    note: "Léger comme une plume, il danse au moindre souffle. Les abeilles tardives lui rendent visite jusqu'en octobre.",
    colors: [
      c("pink", "commune"),
      c("white", "commune"),
      c("red", "rare"),
      c("orange", "rare"),
      c("yellow", "epique"),
      c("black", "legendaire"),
    ],
  },
  {
    id: "aster",
    name: "Aster",
    feminine: false,
    tool: "main",
    note: "On l'appelle aussi l'étoile d'automne : ses petites marguerites s'ouvrent quand le reste du jardin s'endort.",
    colors: [
      c("violet", "commune"),
      c("lilac", "commune"),
      c("blue", "rare"),
      c("pink", "rare"),
      c("white", "epique"),
    ],
  },
  {
    id: "chrysantheme",
    name: "Chrysanthème",
    feminine: false,
    tool: "secateur",
    note: "Il attend que les jours raccourcissent pour fleurir. Ses capitules serrés résistent au vent et à la pluie.",
    colors: [
      c("bronze", "commune"),
      c("yellow", "commune"),
      c("white", "commune"),
      c("red", "rare"),
      c("pink", "rare"),
      c("lime", "legendaire"),
    ],
  },
  {
    id: "bruyere",
    name: "Bruyère",
    feminine: true,
    tool: "main",
    note: "Un tapis de clochettes minuscules qui colore les landes. Elle aime la terre pauvre et les matins brumeux.",
    colors: [
      c("heather", "commune"),
      c("pink", "commune"),
      c("white", "rare"),
      c("lilac", "epique"),
    ],
  },
  {
    id: "colchique",
    name: "Colchique",
    feminine: false,
    tool: "main",
    note: "Il sort de terre sans feuilles quand les prés jaunissent. Joli à regarder, à ne jamais goûter.",
    colors: [
      c("lilac", "commune"),
      c("pink", "commune"),
      c("violet", "rare"),
      c("white", "epique"),
    ],
  },
  {
    id: "anemone",
    name: "Anémone du Japon",
    feminine: true,
    tool: "main",
    note: "Ses fleurs se balancent en haut de longues tiges fines. Elle éclaire les coins d'ombre jusqu'aux premières gelées.",
    colors: [
      c("pink", "commune"),
      c("white", "commune"),
      c("lilac", "rare"),
      c("burgundy", "epique"),
    ],
  },
  {
    id: "sedum",
    name: "Sedum",
    feminine: false,
    tool: "secateur",
    note: "Ses feuilles charnues gardent l'eau de l'été. Ses dômes de petites étoiles rougissent à mesure que l'automne avance.",
    colors: [
      c("pink", "commune"),
      c("burgundy", "commune"),
      c("white", "rare"),
      c("lime", "epique"),
    ],
  },
  {
    id: "amarante",
    name: "Amarante",
    feminine: true,
    tool: "secateur",
    note: "Ses épis retombent comme des cordelettes de velours. Une fois séchée, elle garde sa couleur tout l'hiver.",
    colors: [
      c("red", "commune"),
      c("burgundy", "commune"),
      c("lime", "rare"),
      c("orange", "epique"),
      c("yellow", "legendaire"),
    ],
  },
  {
    id: "vergedor",
    name: "Verge d'or",
    feminine: true,
    tool: "main",
    note: "Ses plumets dorés s'inclinent au bord des chemins. Les papillons de fin de saison s'y arrêtent volontiers.",
    colors: [
      c("yellow", "commune"),
      c("orange", "rare"),
      c("apricot", "epique"),
      c("white", "legendaire"),
    ],
  },
  {
    id: "heliopsis",
    name: "Héliopsis",
    feminine: false,
    tool: "secateur",
    note: "Un cousin du tournesol, plus modeste et plus têtu : il fleurit sans relâche de juillet aux premiers froids.",
    colors: [
      c("yellow", "commune"),
      c("orange", "commune"),
      c("bronze", "rare"),
      c("red", "epique"),
    ],
  },
  {
    id: "lanternelune",
    name: "Lanterne-de-lune",
    feminine: true,
    tool: "main",
    note: "On raconte qu'elle ne pousse que dans les jardins bien soignés. La nuit, ses clochettes éclairent le champ d'une lueur froide.",
    colors: [c("blue", "legendaire"), c("white", "legendaire"), c("violet", "legendaire")],
  },
] as const satisfies readonly SpeciesData[];

export type SpeciesId = (typeof SPECIES)[number]["id"];

export interface SpeciesDef extends SpeciesData {
  id: SpeciesId;
}

const BY_ID = new Map<string, SpeciesDef>(SPECIES.map((s) => [s.id, s]));

export const isSpeciesId = (v: string): v is SpeciesId => BY_ID.has(v);

export const speciesOf = (id: SpeciesId): SpeciesDef => BY_ID.get(id)!;

export const harvestTool = (id: SpeciesId): HarvestTool => speciesOf(id).tool;

export const rarityOf = (species: SpeciesId, color: ColorId): Rarity | null =>
  speciesOf(species).colors.find((x) => x.color === color)?.rarity ?? null;

export const CATALOG_ENTRIES = SPECIES.flatMap((s) =>
  s.colors.map(({ color, rarity }) => ({ species: s.id as SpeciesId, color, rarity })),
);

export interface CatalogEntry {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
}

const BY_RARITY = CATALOG_ENTRIES.reduce<Record<string, CatalogEntry[]>>((acc, e) => {
  (acc[e.rarity] ??= []).push(e);
  return acc;
}, {});

export const entriesOfRarity = (rarity: Rarity): CatalogEntry[] => BY_RARITY[rarity] ?? [];
