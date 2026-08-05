import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface PointerProps {
  children: ReactNode;
  className?: string;
  /** Faux pour ancrer le visuel sur sa pointe (fleche) plutot que sur son centre. */
  centered?: boolean;
}

/**
 * Curseur custom rendu dans le parent DOM immediat. Masque le curseur systeme
 * tant que la souris survole ce parent : le rendu est identique sur macOS et
 * Windows, contrairement aux curseurs natifs.
 */
export function Pointer({ children, className, centered = true }: PointerProps) {
  const anchor = useRef<HTMLSpanElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 900, damping: 60, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 900, damping: 60, mass: 0.4 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const parent = anchor.current?.parentElement;
    if (!parent) return;
    const previous = parent.style.cursor;
    parent.style.cursor = "none";

    const place = (e: MouseEvent, jump: boolean) => {
      // L'ancre est en position fixed : son rect corrige un eventuel ancetre
      // transforme, ou vaut simplement (0, 0).
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const left = e.clientX - rect.left;
      const top = e.clientY - rect.top;
      rawX.set(left);
      rawY.set(top);
      if (jump) {
        x.jump(left);
        y.jump(top);
      }
    };
    const onEnter = (e: MouseEvent) => {
      place(e, true);
      setVisible(true);
    };
    const onMove = (e: MouseEvent) => place(e, false);
    const onLeave = () => setVisible(false);

    parent.addEventListener("mouseenter", onEnter);
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.style.cursor = previous;
      parent.removeEventListener("mouseenter", onEnter);
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [rawX, rawY, x, y]);

  return (
    <span ref={anchor} className="pointer-events-none fixed inset-0 z-[60]">
      <AnimatePresence>
        {visible ? (
          <motion.div
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute"
          >
            <div
              className={`${centered ? "-translate-x-1/2 -translate-y-1/2" : ""} ${className ?? ""}`}
            >
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
