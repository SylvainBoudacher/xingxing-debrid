/** Reperes de la scene, en px depuis le coin haut-gauche du cadre (420 x 240). */
export const STAGE = { width: 420, height: 240 };

/** Grille de la bibliotheque : 4 vignettes sur une ligne, la 2e est celle qu'on vient d'ajouter. */
export const TILE = { width: 88, height: 132, gap: 10, top: 48, left: 16 };
export const TILE_COUNT = 4;
export const ADDED_TILE_INDEX = 1;

const addedTileLeft = TILE.left + ADDED_TILE_INDEX * (TILE.width + TILE.gap);

/** Les deux pilules d'action, empilees sous la vignette : streaming au-dessus,
 * telechargement en dessous. Meme largeur, memes centrees sur la vignette. */
export const ACTION_PILL = { width: 110, height: 20 };
const actionPillLeft = addedTileLeft + TILE.width / 2 - ACTION_PILL.width / 2;

export const STREAM_PILL = {
  left: actionPillLeft,
  top: TILE.top + TILE.height + 12,
};

export const DOWNLOAD_PILL = {
  left: actionPillLeft,
  top: STREAM_PILL.top + ACTION_PILL.height + 4,
};

export const CURSOR_MARKS = {
  start: { x: 46, y: 206 },
  searchBar: { x: 112, y: 34 },
  addButton: { x: 384, y: 84 },
  libraryTile: { x: addedTileLeft + TILE.width / 2, y: TILE.top + TILE.height / 2 },
  streamPill: {
    x: STREAM_PILL.left + ACTION_PILL.width / 2,
    y: STREAM_PILL.top + ACTION_PILL.height / 2,
  },
  playButton: { x: 28, y: 212 },
};

export const CAPTIONS = ["Cherchez", "Ajoutez", "Lancez", "Regardez"];

/** Duree fictive du film, pour que la barre de progression avance a une vitesse credible. */
export const FILM_SECONDS = 8340;

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
