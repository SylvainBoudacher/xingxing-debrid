// Forme canonique d'un titre pour la comparaison : minuscules, accents retires,
// ponctuation et separateurs de release (points, tirets, apostrophes) reduits a
// des espaces. "L'Attaque.des.Titans" et "L'attaque des titans" convergent.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
