import type { TmdbItem } from "@/lib/tmdbItem";

// Geometrie du ruban. Le centre de la case i est a i * PITCH + CARD_W / 2 :
// la gouttiere vient apres la case, pas autour.
export const CARD_W = 110;
export const CARD_GAP = 10;
export const PITCH = CARD_W + CARD_GAP;
export const STRIP_LEN = 60;
export const WINNER_INDEX = 52;
export const JITTER_RATIO = 0.35;
// Une dizaine de cases tiennent a l'ecran : en dessous de cet ecart, deux
// exemplaires du meme film seraient visibles en meme temps.
export const MIN_GAP = 8;

// Ruban d'attente : assez de cases pour couvrir la plus large fenetre, la
// tuile etant repetee deux fois pour que la boucle ne montre pas de couture.
export const IDLE_LEN = 20;
export const IDLE_SPEED = 26;

// Duree d'un tour de boucle : la tuile defile exactement de sa propre longueur.
export function marqueeDuration(cellCount: number): number {
  return (cellCount * PITCH) / IDLE_SPEED;
}

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

// Reprise trop proche : soit dans les MIN_GAP cases deja posees, soit le
// gagnant a moins de MIN_GAP cases avant sa propre case (le gagnant n'est pas
// encore pose, la fenetre arriere ne peut pas le voir).
function tooClose(strip: TmdbItem[], i: number, cand: TmdbItem, winner: TmdbItem): boolean {
  for (let k = Math.max(0, i - MIN_GAP); k < i; k++) {
    if (strip[k].id === cand.id) return true;
  }
  const toWinner = WINNER_INDEX - i;
  return toWinner > 0 && toWinner <= MIN_GAP && cand.id === winner.id;
}

// Le sac est vide sans remise : un film ne peut revenir qu'apres un rebrassage.
// La contrainte d'ecart ne peut donc echouer qu'a la frontiere entre deux sacs,
// ou juste autour du gagnant. Pool minuscule : on accepte la reprise plutot que
// de boucler.
function take(bag: TmdbItem[], strip: TmdbItem[], i: number, winner: TmdbItem): TmdbItem {
  for (let t = bag.length - 1; t >= 0; t--) {
    if (!tooClose(strip, i, bag[t], winner)) return bag.splice(t, 1)[0];
  }
  return bag.pop() as TmdbItem;
}

// Le gagnant est pose pendant la construction, pas ecrase a la fin : sinon les
// cases voisines auraient ete choisies sans savoir qu'il allait arriver.
export function buildStrip(pool: TmdbItem[], winner: TmdbItem): TmdbItem[] {
  const strip: TmdbItem[] = [];
  let bag: TmdbItem[] = [];
  for (let i = 0; i < STRIP_LEN; i++) {
    if (i === WINNER_INDEX) {
      strip.push(winner);
      continue;
    }
    if (bag.length === 0) bag = shuffled(pool);
    strip.push(take(bag, strip, i, winner));
  }
  return strip;
}

// random est injectable pour les tests. Le jitter empeche l'arret pile au
// centre, comme dans les vraies ouvertures de caisses.
export function stripOffset(containerWidth: number, random: number = Math.random()): number {
  const jitter = (random * 2 - 1) * JITTER_RATIO * PITCH;
  return PITCH * WINNER_INDEX + CARD_W / 2 - containerWidth / 2 + jitter;
}
