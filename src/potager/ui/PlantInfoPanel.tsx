import { useEffect, useRef, useState } from "react";
import { findTarget } from "../core/actions";
import { RARITY_COLOR, RARITY_LABEL } from "../core/catalog/rarity";
import { plantInfo, STAGE_LABEL, type PlantInfo } from "../core/plantInfo";
import type { PotagerScene } from "../render/createPotagerScene";
import type { SimHost } from "../sim/simHost";
import { PANEL_STYLE } from "./hdPanel";
import { formatDuration, SOW_LABEL } from "./plantInfoView";

const REFRESH_MS = 250;
// décalage à droite de la case, pour ne pas cacher la plante
const SIDE_PX = 56;
const MARGIN_PX = 8;

// Fiche de la plante devant l'avatar, accrochée à sa case.
export function PlantInfoPanel({
  scene,
  host,
  hidden,
}: {
  scene: PotagerScene;
  host: SimHost;
  hidden: boolean;
}) {
  const [info, setInfo] = useState<PlantInfo | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hidden) return;
    const read = () => {
      const s = host.state();
      const t = s && findTarget(s, scene.avatar.pose());
      setInfo(s && t?.kind === "cell" ? plantInfo(s, t.key) : null);
    };
    const id = setInterval(read, REFRESH_MS);
    return () => clearInterval(id);
  }, [scene, host, hidden]);

  const center = info?.center;
  useEffect(() => {
    if (!center) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const at = scene.project(center);
      const el = ref.current;
      if (!el) return;
      // à droite de la case, sinon à gauche quand l'écran manque de place
      const { offsetWidth: w, offsetHeight: h } = el;
      const right = at.x + SIDE_PX;
      const x = right + w > innerWidth - MARGIN_PX ? at.x - SIDE_PX - w : right;
      const y = Math.min(Math.max(at.y - h / 2, MARGIN_PX), innerHeight - h - MARGIN_PX);
      el.style.transform = `translate(${Math.max(x, MARGIN_PX)}px, ${y}px)`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [scene, center]);

  if (!info || hidden) return null;
  const bloomed = info.stage === 4;
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-20 w-56 px-3 py-2 text-base"
      style={PANEL_STYLE}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-lg font-bold">{STAGE_LABEL[info.stage]}</span>
        <span className="text-sm font-semibold" style={{ color: RARITY_COLOR[info.rarity] }}>
          {RARITY_LABEL[info.rarity]}
        </span>
      </div>
      <div className="my-1 h-2 border border-[#5a4630] bg-[rgba(0,0,0,0.4)]">
        <div
          className="h-full bg-[#b8975a]"
          style={{ width: `${Math.round(info.progress * 100)}%` }}
        />
      </div>
      {!bloomed && (
        <p>
          {info.etaMs === null ? "Pousse à l'arrêt" : `Éclosion dans ${formatDuration(info.etaMs)}`}
        </p>
      )}
      {!bloomed && (
        <p>{info.wetMs > 0 ? `Humide : encore ${formatDuration(info.wetMs)}` : "À arroser"}</p>
      )}
      <p>Semis : {SOW_LABEL[info.sowGrade]}</p>
      <p className="mt-1 text-sm text-[#c8b890] italic">{info.tip}</p>
    </div>
  );
}
