import type { PanInfo } from "motion/react";

// Bloc catégorie sous le curseur. `elementsFromPoint` traverse la pile :
// la carte en cours de glissement, au-dessus, n'occulte pas la cible.
//
// L'événement pointeur donne des coordonnées écran directement ; `info.point`
// est relatif à la page et sert de repli (tactile).
export function dropIdAt(
  event: MouseEvent | TouchEvent | PointerEvent,
  info: PanInfo,
): string | null {
  const native = event as PointerEvent;
  const x = typeof native.clientX === "number" ? native.clientX : info.point.x - window.scrollX;
  const y = typeof native.clientY === "number" ? native.clientY : info.point.y - window.scrollY;
  for (const el of document.elementsFromPoint(x, y)) {
    // La carte glissée est sous le curseur : remonter son DOM mènerait à son
    // bloc d'origine, jamais à la cible. On saute tous ses éléments.
    if ((el as HTMLElement).closest("[data-dragging]")) continue;
    const dropId = (el as HTMLElement).closest<HTMLElement>("[data-drop-id]")?.dataset.dropId;
    if (dropId) return dropId;
  }
  return null;
}
