export interface Point {
  x: number;
  y: number;
}

// La liane part vers le haut du parent et rejoint l'enfant par le bas : les deux
// points de contrôle encadrent la moitié de la montée.
const controls = (from: Point, to: Point): [Point, Point] => {
  const my = (from.y + to.y) / 2;
  return [
    { x: from.x, y: my },
    { x: to.x, y: my + 30 },
  ];
};

export function vinePath(from: Point, to: Point): string {
  const [c1, c2] = controls(from, to);
  return `M${from.x} ${from.y} C${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}

export function vinePointAt(from: Point, to: Point, t: number): Point {
  const [c1, c2] = controls(from, to);
  const u = 1 - t;
  const at = (a: number, b: number, c: number, d: number) =>
    u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  return { x: at(from.x, c1.x, c2.x, to.x), y: at(from.y, c1.y, c2.y, to.y) };
}
