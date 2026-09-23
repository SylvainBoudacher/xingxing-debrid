/** Reperes de la scene, en px depuis le coin haut-gauche du cadre. */
export const STAGE = { width: 520, height: 220 };

/** Duree de chaque etape : la timeline et la liste se calent dessus. */
export const STEP_MS = 4000;
export const STEP_COUNT = 3;

export const NODE = { width: 96, height: 56 };

const MID_Y = (STAGE.height - NODE.height) / 2;
const CENTER_X = (STAGE.width - NODE.width) / 2;
const RIGHT_X = STAGE.width - 20 - NODE.width;
const TOP_Y = 24;
const BOTTOM_Y = STAGE.height - 24 - NODE.height;

/**
 * Schema des etapes 2 et 3 : le choix d'une version sur C411 l'ajoute a la
 * bibliotheque et l'envoie a AllDebrid en meme temps ; AllDebrid ouvre ensuite
 * le choix entre streaming (VLC) et telechargement.
 */
export const NODES = {
  c411: { left: 20, top: MID_Y },
  debrid: { left: CENTER_X, top: TOP_Y },
  library: { left: CENTER_X, top: BOTTOM_Y },
  vlc: { left: RIGHT_X, top: TOP_Y - 14 },
  folder: { left: RIGHT_X, top: TOP_Y + NODE.height + 10 },
} as const;

type NodeId = keyof typeof NODES;

const rightEdge = (id: NodeId) => ({
  x: NODES[id].left + NODE.width,
  y: NODES[id].top + NODE.height / 2,
});
const leftEdge = (id: NodeId) => ({ x: NODES[id].left, y: NODES[id].top + NODE.height / 2 });

/** Les liaisons, du bord droit d'un noeud au bord gauche du suivant. */
export const LINKS = {
  toDebrid: { from: rightEdge("c411"), to: leftEdge("debrid") },
  toLibrary: { from: rightEdge("c411"), to: leftEdge("library") },
  toVlc: { from: rightEdge("debrid"), to: leftEdge("vlc") },
  toFolder: { from: rightEdge("debrid"), to: leftEdge("folder") },
};

export type LinkId = keyof typeof LINKS;

/** Taille du paquet qui voyage le long des liaisons. */
export const PACKET = 10;

export const RESULTS = [
  { name: "Dune.2021.MULTi.1080p", size: "4,2 Go", seeders: 812 },
  { name: "Dune.2021.VFF.2160p", size: "18 Go", seeders: 240 },
  { name: "Dune.2021.720p", size: "1,9 Go", seeders: 96 },
];
