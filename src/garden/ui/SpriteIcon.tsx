import { spriteDataUrl, type SpriteRef } from "../sprites/sprite";

// Sprite 48x72 : l'objet est dessiné dans le bas de l'image.
export function SpriteIcon({ sprite, className }: { sprite: SpriteRef; className?: string }) {
  return (
    <img
      src={spriteDataUrl(sprite)}
      alt=""
      draggable={false}
      className={`[image-rendering:pixelated] ${className ?? ""}`}
    />
  );
}
