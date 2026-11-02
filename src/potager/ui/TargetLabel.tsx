import { useEffect, useRef, useState } from "react";
import { findTarget } from "../core/actions";
import type { PotagerScene } from "../render/createPotagerScene";
import type { SimHost } from "../sim/simHost";
import { PANEL_STYLE } from "./hdPanel";
import { targetInfo, type TargetInfo } from "./targetInfo";

const REFRESH_MS = 250;
// au-dessus de l'objet, pour ne pas le cacher
const LIFT_PX = 90;

// Étiquette de l'objet devant l'avatar : ce que c'est et à quoi il sert.
export function TargetLabel({
  scene,
  host,
  hidden,
}: {
  scene: PotagerScene;
  host: SimHost;
  hidden: boolean;
}) {
  const [label, setLabel] = useState<TargetInfo | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hidden) return;
    const read = () => {
      const s = host.state();
      const t = s && findTarget(s, scene.avatar.pose());
      const next = s && t ? targetInfo(s, t) : null;
      setLabel((cur) =>
        cur?.title === next?.title && cur?.at.x === next?.at.x && cur?.at.z === next?.at.z
          ? cur
          : next,
      );
    };
    read();
    const id = setInterval(read, REFRESH_MS);
    return () => clearInterval(id);
  }, [scene, host, hidden]);

  const at = label?.at;
  useEffect(() => {
    if (!at) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const p = scene.project(at);
      if (ref.current)
        ref.current.style.transform = `translate(${p.x}px, ${p.y - LIFT_PX}px) translate(-50%, -100%)`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [scene, at]);

  if (!label || hidden) return null;
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-20 px-3 py-2 text-center whitespace-nowrap"
      style={PANEL_STYLE}
    >
      <p className="text-lg">{label.title}</p>
      <p className="text-sm text-[#ecd3a0]">{label.text}</p>
      <p className="mt-1 text-xs opacity-70">Espace pour interagir</p>
    </div>
  );
}
