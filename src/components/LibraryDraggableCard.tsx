import { dropIdAt } from "@/lib/libraryDropTarget";
import { motion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";

interface LibraryDraggableCardProps {
  /** Bloc survolé pendant le glisser (null en dehors d'un bloc ou au relâché). */
  onHover: (dropId: string | null) => void;
  onDrop: (dropId: string) => void;
  children: ReactNode;
}

// En mode Personnalisé, chaque carte se glisse dans un bloc catégorie.
// Le glisser passe par motion (pointer events) et non par le drag HTML5 :
// dans le WebView, l'image de la jaquette et le bouton de la carte captent
// le geste natif, et le dépôt n'arrive jamais.
export function LibraryDraggableCard({ onHover, onDrop, children }: LibraryDraggableCardProps) {
  const [dragging, setDragging] = useState(false);
  // Le relâchement d'un drag émet un click sur le bouton de la carte, qui
  // ouvrirait la fiche : on l'avale en phase capture.
  const suppressClick = useRef(false);

  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.2}
      whileDrag={{ scale: 0.92, zIndex: 30, cursor: "grabbing" }}
      data-dragging={dragging ? "" : undefined}
      onDragStart={() => {
        setDragging(true);
        suppressClick.current = true;
      }}
      onDrag={(event, info) => onHover(dropIdAt(event, info))}
      onDragEnd={(event, info) => {
        const dropId = dropIdAt(event, info);
        onHover(null);
        setDragging(false);
        if (dropId) onDrop(dropId);
        // Le click éventuel arrive juste après le pointerup, avant ce timeout :
        // on ne bloque donc jamais un vrai clic ultérieur.
        setTimeout(() => {
          suppressClick.current = false;
        }, 0);
      }}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className="relative cursor-grab touch-none select-none active:cursor-grabbing [&_img]:[-webkit-user-drag:none]"
    >
      {children}
    </motion.div>
  );
}
