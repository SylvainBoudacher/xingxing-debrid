import { SPRITE_COLORS } from "@/components/gardenButtonSprites";

export function PixelSprite({
  rows,
  scale,
  className,
}: {
  rows: string[];
  scale: number;
  className?: string;
}) {
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      aria-hidden
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={className}
    >
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={SPRITE_COLORS[ch]} />
          ),
        ),
      )}
    </svg>
  );
}
