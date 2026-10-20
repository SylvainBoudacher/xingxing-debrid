import { motion } from "motion/react";
import { useEffect, useRef } from "react";

// « +14 PO » qui monte et s'efface au-dessus de l'étal.
export function GainPop({
  gain,
  where,
  onDone,
}: {
  gain: number;
  where: () => { x: number; y: number };
  onDone: () => void;
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
    <div ref={ref} className="pointer-events-none fixed top-0 left-0 z-20 -mt-28">
      <motion.p
        className="text-3xl font-bold text-[#f4d070]"
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          textShadow: "0 2px 3px rgba(0,0,0,0.8)",
        }}
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: -50, opacity: 0 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        onAnimationComplete={onDone}
      >
        +{gain} PO
      </motion.p>
    </div>
  );
}
