import type { SpriteRef } from "../../sprites/sprite";
import type { CounterId } from "../counters";
import type { DecorId, PlotId, Rarity, SachetType, SpeciesId } from "../types";
import type { RecipeId } from "./recipes";

export type NodeId = string;
export type BranchId = "jardin" | "collection" | "decor" | "champ";
export type HerbierMeasure = "entrees" | "raretes" | "familles" | "variantes";

export type Task =
  | { kind: "counter"; id: CounterId; target: number }
  | { kind: "herbier"; measure: HerbierMeasure; target: number }
  | { kind: "panier"; items: { species: SpeciesId; count: number }[] };

export type Reward =
  | { kind: "sachet-quotidien" }
  | { kind: "sachet"; sachet: SachetType }
  | { kind: "parcelle"; plot: PlotId }
  | { kind: "decor"; decor: DecorId; count: number }
  | { kind: "graines"; rarity: Rarity; count: number }
  | { kind: "recettes"; recipes: RecipeId[] };

export interface TreeNode {
  id: NodeId;
  branch: BranchId;
  parent?: NodeId;
  // espace 1000 x 640, racine en bas
  x: number;
  y: number;
  title: string;
  taskLabel: string;
  rewardLabel: string;
  rewardNote: string;
  icon: SpriteRef;
  task: Task;
  reward: Reward;
}

export const BRANCHES: Record<BranchId, { name: string; color: string }> = {
  jardin: { name: "Jardinage", color: "#8fcf5a" },
  collection: { name: "Collection", color: "#b58ae6" },
  decor: { name: "Décor", color: "#f0a050" },
  champ: { name: "Champ", color: "#d9b46a" },
};

const counter = (id: CounterId, target: number): Task => ({ kind: "counter", id, target });
const herbier = (measure: HerbierMeasure, target: number): Task => ({
  kind: "herbier",
  measure,
  target,
});
const panier = (items: { species: SpeciesId; count: number }[]): Task => ({
  kind: "panier",
  items,
});

export const TREE: TreeNode[] = [
  {
    id: "root",
    branch: "champ",
    x: 500,
    y: 575,
    title: "Le potager s'éveille",
    taskLabel: "Semer ta première graine",
    rewardLabel: "Poignée de graines",
    rewardNote: "3 graines communes pour commencer",
    icon: { name: "graine", color: "cream" },
    task: counter("sown", 1),
    reward: { kind: "graines", rarity: "commune", count: 3 },
  },

  {
    id: "j1",
    branch: "jardin",
    parent: "root",
    x: 330,
    y: 470,
    title: "Main verte",
    taskLabel: "Faire éclore 5 fleurs",
    rewardLabel: "Deuxième sachet du jour",
    rewardNote: "2 sachets gratuits chaque jour au lieu d'un",
    icon: { name: "pousse" },
    task: counter("bloomed", 5),
    reward: { kind: "sachet-quotidien" },
  },
  {
    id: "j2",
    branch: "jardin",
    parent: "j1",
    x: 190,
    y: 380,
    title: "Arrosoir bien rempli",
    taskLabel: "Arroser 20 fois",
    rewardLabel: "Sachet doré",
    rewardNote: "Une graine rare ou mieux garantie",
    icon: { name: "arrosoir" },
    task: counter("watered", 20),
    reward: { kind: "sachet", sachet: "dore" },
  },
  {
    id: "j3",
    branch: "jardin",
    parent: "j2",
    x: 110,
    y: 260,
    title: "Tas de compost",
    taskLabel: "Ratisser 30 tas de feuilles",
    rewardLabel: "Bottes de paille",
    rewardNote: "4 bottes à poser dans le champ",
    icon: { name: "rateau" },
    task: counter("raked", 30),
    reward: { kind: "decor", decor: "paille", count: 4 },
  },
  {
    id: "j4",
    branch: "jardin",
    parent: "j2",
    x: 250,
    y: 240,
    title: "Belles plantes",
    taskLabel: "Cueillir 5 belles plantes",
    rewardLabel: "Graines rares",
    rewardNote: "3 graines rares",
    icon: { name: "bouton", color: "white" },
    task: counter("pickedBeautiful", 5),
    reward: { kind: "graines", rarity: "rare", count: 3 },
  },

  {
    id: "h1",
    branch: "collection",
    parent: "root",
    x: 420,
    y: 400,
    title: "Herbier ouvert",
    taskLabel: "Découvrir 5 fleurs",
    rewardLabel: "Sachet de famille",
    rewardNote: "Trois graines de la même espèce",
    icon: { name: "aster", color: "violet" },
    task: herbier("entrees", 5),
    reward: { kind: "sachet", sachet: "famille" },
  },
  {
    id: "h2",
    branch: "collection",
    parent: "h1",
    x: 380,
    y: 280,
    title: "Œil du collectionneur",
    taskLabel: "Découvrir une fleur rare",
    rewardLabel: "Sachet doré",
    rewardNote: "Une graine rare ou mieux garantie",
    icon: { name: "dahlia", color: "violet" },
    task: herbier("raretes", 1),
    reward: { kind: "sachet", sachet: "dore" },
  },
  {
    id: "h3",
    branch: "collection",
    parent: "h2",
    x: 330,
    y: 150,
    title: "Première famille",
    taskLabel: "Compléter une famille de couleurs",
    rewardLabel: "Graine légendaire",
    rewardNote: "Une graine légendaire",
    icon: { name: "tournesol", color: "yellow" },
    task: herbier("familles", 1),
    reward: { kind: "graines", rarity: "legendaire", count: 1 },
  },
  {
    id: "h4",
    branch: "collection",
    parent: "h2",
    x: 450,
    y: 170,
    title: "Fleur givrée",
    taskLabel: "Obtenir une variante spéciale",
    rewardLabel: "Sachet de famille",
    rewardNote: "Trois graines de la même espèce",
    icon: { name: "colchique", color: "white" },
    task: herbier("variantes", 1),
    reward: { kind: "sachet", sachet: "famille" },
  },

  {
    id: "d1",
    branch: "decor",
    parent: "root",
    x: 580,
    y: 400,
    title: "Clôture",
    taskLabel: "Cueillir 10 fleurs",
    rewardLabel: "Clôture en bois",
    rewardNote: "12 segments à placer",
    icon: { name: "cloture" },
    task: counter("picked", 10),
    reward: { kind: "decor", decor: "cloture", count: 12 },
  },
  {
    id: "d2",
    branch: "decor",
    parent: "d1",
    x: 620,
    y: 280,
    title: "Lueurs du soir",
    taskLabel: "Faire éclore 3 fleurs après 18 h",
    rewardLabel: "Lanternes",
    rewardNote: "4 lanternes qui éclairent la nuit",
    icon: { name: "lanterne" },
    task: counter("nightBloom", 3),
    reward: { kind: "decor", decor: "lanterne", count: 4 },
  },
  {
    id: "d3",
    branch: "decor",
    parent: "d1",
    x: 520,
    y: 250,
    title: "Récolte d'automne",
    taskLabel: "Cueillir 25 fleurs",
    rewardLabel: "Citrouilles",
    rewardNote: "6 citrouilles décoratives",
    icon: { name: "citrouille" },
    task: counter("picked", 25),
    reward: { kind: "decor", decor: "citrouille", count: 6 },
  },
  {
    id: "d4",
    branch: "decor",
    parent: "d2",
    x: 640,
    y: 150,
    title: "Panier des vendanges",
    taskLabel: "Déposer 2 dahlias, 2 cosmos et 1 aster",
    rewardLabel: "Arbres",
    rewardNote: "2 arbres à planter en bordure",
    icon: { name: "tas" },
    task: panier([
      { species: "dahlia", count: 2 },
      { species: "cosmos", count: 2 },
      { species: "aster", count: 1 },
    ]),
    reward: { kind: "decor", decor: "arbre", count: 2 },
  },

  {
    id: "c1",
    branch: "champ",
    parent: "root",
    x: 690,
    y: 470,
    title: "Deuxième parcelle",
    taskLabel: "Découvrir 8 fleurs",
    rewardLabel: "Parcelle 2",
    rewardNote: "+ 16 cases de terre",
    icon: { name: "jeune" },
    task: herbier("entrees", 8),
    reward: { kind: "parcelle", plot: "p2" },
  },
  {
    id: "c2",
    branch: "champ",
    parent: "c1",
    x: 780,
    y: 290,
    title: "Panier du jardinier",
    taskLabel: "Déposer 2 chrysanthèmes, 2 sedums et 1 bruyère",
    rewardLabel: "Graines rares",
    rewardNote: "3 graines rares",
    icon: { name: "secateur" },
    task: panier([
      { species: "chrysantheme", count: 2 },
      { species: "sedum", count: 2 },
      { species: "bruyere", count: 1 },
    ]),
    reward: { kind: "graines", rarity: "rare", count: 3 },
  },
  {
    id: "c3",
    branch: "champ",
    parent: "c1",
    x: 900,
    y: 370,
    title: "Troisième parcelle",
    taskLabel: "Découvrir 20 fleurs",
    rewardLabel: "Parcelle 3",
    rewardNote: "+ 24 cases de terre",
    icon: { name: "rosetremiere", color: "pink" },
    task: herbier("entrees", 20),
    reward: { kind: "parcelle", plot: "p3" },
  },
  {
    id: "c4",
    branch: "champ",
    parent: "c3",
    x: 860,
    y: 150,
    title: "Grand champ",
    taskLabel: "Découvrir 35 fleurs",
    rewardLabel: "Parcelle 4",
    rewardNote: "+ 16 cases de terre",
    icon: { name: "chrysantheme", color: "bronze" },
    task: herbier("entrees", 35),
    reward: { kind: "parcelle", plot: "p4" },
  },
  // Atelier (sous-projet 6a) : greffé sur Jardinage et Collection
  {
    id: "a1",
    branch: "jardin",
    parent: "j1",
    x: 290,
    y: 340,
    title: "Le chaudron",
    taskLabel: "Presser 3 fleurs",
    rewardLabel: "L'atelier",
    rewardNote: "Le chaudron, l'élixir de croissance et la rosée du matin",
    icon: { name: "chaudron" },
    task: counter("pressed", 3),
    reward: { kind: "recettes", recipes: ["croissance", "rosee"] },
  },
  {
    id: "a2",
    branch: "jardin",
    parent: "j4",
    x: 215,
    y: 120,
    title: "Teinturier",
    taskLabel: "Récupérer 3 brassages",
    rewardLabel: "Teinture",
    rewardNote: "Change la couleur d'une plante avant l'éclosion",
    icon: { name: "fiole", color: "pink" },
    task: counter("brewed", 3),
    reward: { kind: "recettes", recipes: ["teinture"] },
  },
  {
    id: "a3",
    branch: "collection",
    parent: "h3",
    x: 300,
    y: 60,
    title: "Seconde vue",
    taskLabel: "Utiliser 5 préparations",
    rewardLabel: "Élixir de clairvoyance",
    rewardNote: "Révèle une plante avant l'éclosion",
    icon: { name: "fiole", color: "violet" },
    task: counter("potionsUsed", 5),
    reward: { kind: "recettes", recipes: ["clairvoyance"] },
  },
  {
    id: "a4",
    branch: "collection",
    parent: "h4",
    x: 430,
    y: 65,
    title: "Premier givre",
    taskLabel: "Récupérer 5 brassages",
    rewardLabel: "Poudre de givre",
    rewardNote: "Une chance de fleur givrée",
    icon: { name: "poudre", color: "white" },
    task: counter("brewed", 5),
    reward: { kind: "recettes", recipes: ["givre"] },
  },
  {
    id: "a5",
    branch: "collection",
    parent: "a4",
    x: 545,
    y: 95,
    title: "Poussières d'étoiles",
    taskLabel: "Utiliser 15 préparations",
    rewardLabel: "Poudres d'or et de lune",
    rewardNote: "Des chances de fleurs dorées et lumineuses",
    icon: { name: "poudre", color: "yellow" },
    task: counter("potionsUsed", 15),
    reward: { kind: "recettes", recipes: ["or", "lune"] },
  },
];

const BY_ID = new Map(TREE.map((n) => [n.id, n]));

export const nodeById = (id: NodeId): TreeNode | undefined => BY_ID.get(id);
