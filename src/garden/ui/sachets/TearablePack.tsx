import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import type { Rarity, SachetType } from "../../core/types";
import { SACHET_H, SACHET_W, sachetDataUrl, TEAR_ROW } from "../../sprites/sachet";
import type { SpriteRef } from "../../sprites/sprite";
import { SpriteIcon } from "../SpriteIcon";
import { RARITY_COLOR } from "../toolMeta";
import { PACK_SCALE, TEAR_THRESHOLD, tearProgress } from "./packFlow";

const W = SACHET_W * PACK_SCALE;
const H = SACHET_H * PACK_SCALE;
const BAND = TEAR_ROW * PACK_SCALE;

// Sachet du dessus. onStart part au premier geste (glisser ou clic) : le sachet est
// ouvert et sauvegardé tout de suite, d'où la lueur de rareté par la fente.
export function TearablePack({
  type,
  glow,
  familyIcon,
  onStart,
  onRip,
  onTorn,
}: {
  type: SachetType;
  glow: Rarity | null;
  familyIcon: SpriteRef | null;
  onStart: () => void;
  onRip: (clientX: number, clientY: number) => void;
  onTorn: () => void;
}) {
  const reduced = useReducedMotion();
  const url = sachetDataUrl(type);
  const bandRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const ripped = useRef(false);
  // un clic qui termine un glisser n'est pas un clic
  const dragged = useRef(false);
  const [torn, setTorn] = useState(false);
  const x = useMotionValue(0);
  const bandY = useMotionValue(0);
  const bandRotate = useMotionValue(0);
  const shakeX = useMotionValue(0);
  const progress = useTransform(x, (v) => tearProgress(v, W));
  const glowOpacity = useTransform(progress, (p) => Math.min(1, 0.2 + p * 1.2));

  useAnimationFrame((t) => {
    shakeX.set(reduced || ripped.current ? 0 : Math.sin(t / 22) * progress.get() * 4);
  });

  const start = () => {
    if (started.current) return;
    started.current = true;
    onStart();
  };

  const rip = () => {
    if (ripped.current) return;
    ripped.current = true;
    setTorn(true);
    const box = bandRef.current?.getBoundingClientRect();
    if (box) onRip(box.left + box.width / 2, box.bottom);
    animate(bandY, -160, { duration: 0.35, ease: "easeOut" });
    animate(bandRotate, 35, { duration: 0.35 });
    animate(x, W * 1.4, { duration: 0.35, ease: "easeIn" }).then(onTorn);
  };

  const autoTear = () => {
    if (ripped.current) return;
    start();
    animate(x, W * TEAR_THRESHOLD, { duration: 0.25, ease: "easeInOut" }).then(rip);
  };

  return (
    <motion.div
      className="relative"
      style={{ width: W, height: H, x: shakeX }}
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="absolute inset-0 cursor-pointer"
        style={{ clipPath: `inset(${BAND}px 0 0 0)` }}
        onClick={autoTear}
      >
        <img src={url} alt="" draggable={false} className="size-full [image-rendering:pixelated]" />
        {type === "dore" && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(110deg, transparent 40%, rgba(255,255,240,.55) 50%, transparent 60%)",
              backgroundSize: "300% 100%",
              WebkitMaskImage: `url(${url})`,
              maskImage: `url(${url})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
            }}
            animate={{ backgroundPosition: ["150% 0%", "-50% 0%"] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
          />
        )}
        {familyIcon && (
          <motion.div
            className="absolute inset-x-0 top-[42%] flex justify-center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SpriteIcon sprite={familyIcon} cropped className="w-16 drop-shadow-[0_0_6px_#fff8]" />
          </motion.div>
        )}
      </div>
      {glow && (
        <motion.div
          className="pointer-events-none absolute -inset-x-6 blur-[6px]"
          style={{
            top: BAND - 20,
            height: 40,
            opacity: glowOpacity,
            background: `radial-gradient(50% 50% at 50% 50%, ${RARITY_COLOR[glow]}, transparent)`,
          }}
        />
      )}
      <motion.div
        ref={bandRef}
        className="absolute left-0 top-0 cursor-grab overflow-hidden active:cursor-grabbing"
        style={{ width: W, height: BAND, x, y: bandY, rotate: bandRotate }}
        drag={torn ? false : "x"}
        dragConstraints={{ left: 0, right: W }}
        dragElastic={0}
        dragMomentum={false}
        onPointerDown={() => (dragged.current = false)}
        onDragStart={() => {
          dragged.current = true;
          start();
        }}
        onDragEnd={() => {
          if (progress.get() >= TEAR_THRESHOLD) rip();
          else animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
        }}
        onClick={() => {
          if (!dragged.current) autoTear();
        }}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          className="absolute left-0 top-0 max-w-none [image-rendering:pixelated]"
          style={{ width: W, height: H }}
        />
      </motion.div>
    </motion.div>
  );
}
