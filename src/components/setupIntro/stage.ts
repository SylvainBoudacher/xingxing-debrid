/** Reperes de la scene, en px depuis le coin haut-gauche du cadre (420 x 240). */
export const STAGE = { width: 420, height: 240 };

export const CURSOR_MARKS = {
  start: { x: 46, y: 206 },
  searchBar: { x: 112, y: 34 },
  addButton: { x: 384, y: 84 },
  playButton: { x: 28, y: 212 },
};

export const CAPTIONS = ["Cherchez", "Ajoutez", "Regardez"];

/** Duree fictive du film, pour que la barre de progression avance a une vitesse credible. */
export const FILM_SECONDS = 8340;

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
