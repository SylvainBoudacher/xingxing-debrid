import type { CSSProperties } from "react";
import type { PixelPaths } from "./slotPixelArt";

// Dessin pixel-art en SVG: une grille de w x h pixels affichée à `scale` px par
// pixel, sans lissage.
export function PixelSprite({
  paths,
  w,
  h,
  scale,
  label,
  style,
}: {
  paths: PixelPaths;
  w: number;
  h: number;
  scale: number;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={style}
    >
      {paths.map((p) => (
        <path key={p.fill} d={p.d} fill={p.fill} />
      ))}
    </svg>
  );
}
