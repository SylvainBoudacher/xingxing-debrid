import { useEffect, useRef } from "react";
import { PANEL_STYLE } from "./hdPanel";

// Court message au-dessus de l'avatar, qui le suit à l'écran.
export function AvatarBubble({
  text,
  icon,
  where,
}: {
  text: string;
  // image affichée avant le texte (sprite de fleur)
  icon?: string;
  where: () => { x: number; y: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const at = where();
      if (ref.current)
        ref.current.style.transform = `translate(${at.x}px, ${at.y}px) translate(-50%, -100%)`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [where]);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-20 -mt-24 flex items-center gap-2 px-3 py-1 text-lg whitespace-nowrap"
      style={PANEL_STYLE}
    >
      {icon && (
        <img src={icon} alt="" className="h-8 w-8" style={{ imageRendering: "pixelated" }} />
      )}
      {text}
    </div>
  );
}
