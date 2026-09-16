import { iconDataUrl, spriteDataUrl, type SpriteRef } from "../sprites/sprite";

// Sprite 48x72 dessiné dans le bas de l'image ; `cropped` le recadre sur son dessin.
export function SpriteIcon({
  sprite,
  cropped = false,
  className,
}: {
  sprite: SpriteRef;
  cropped?: boolean;
  className?: string;
}) {
  return (
    <img
      src={cropped ? iconDataUrl(sprite) : spriteDataUrl(sprite)}
      alt=""
      draggable={false}
      className={`[image-rendering:pixelated] ${className ?? ""}`}
    />
  );
}
