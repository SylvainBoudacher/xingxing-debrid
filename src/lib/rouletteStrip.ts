import type { TmdbItem } from "@/lib/tmdbItem";

// Geometrie du ruban. Le centre de la case i est a i * PITCH + CARD_W / 2 :
// la gouttiere vient apres la case, pas autour.
export const CARD_W = 110;
export const CARD_GAP = 10;
export const PITCH = CARD_W + CARD_GAP;
export const STRIP_LEN = 60;
export const WINNER_INDEX = 52;
export const JITTER_RATIO = 0.35;

export const SPIN_MS = 6000;
// Depart tres rapide, longue trainee : les dernieres cases prennent la moitie
// du temps.
export const SPIN_EASE: [number, number, number, number] = [0.08, 0.82, 0.17, 1];

function shuffled(items: TmdbItem[]): TmdbItem[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Le pool (~40 films) est tire sans remise puis rebrasse, ce qui evite qu'un
// meme film revienne trois cases plus loin. La case du gagnant est ecrasee en
// dernier : c'est elle qui doit tomber sous le curseur.
export function buildStrip(pool: TmdbItem[], winner: TmdbItem): TmdbItem[] {
  const strip: TmdbItem[] = [];
  let bag: TmdbItem[] = [];
  while (strip.length < STRIP_LEN) {
    if (bag.length === 0) bag = shuffled(pool);
    const next = bag.pop() as TmdbItem;
    const prev = strip[strip.length - 1];
    if (prev && prev.id === next.id && bag.length > 0) {
      strip.push(bag.pop() as TmdbItem);
      bag.push(next);
      continue;
    }
    strip.push(next);
  }
  strip[WINNER_INDEX] = winner;
  return strip;
}

// random est injectable pour les tests. Le jitter empeche l'arret pile au
// centre, comme dans les vraies ouvertures de caisses.
export function stripOffset(containerWidth: number, random: number = Math.random()): number {
  const jitter = (random * 2 - 1) * JITTER_RATIO * PITCH;
  return PITCH * WINNER_INDEX + CARD_W / 2 - containerWidth / 2 + jitter;
}
