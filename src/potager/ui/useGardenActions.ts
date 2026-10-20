import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyAction,
  findTarget,
  prepareAction,
  REACH,
  standPoint,
  type ActionEvent,
  type Target,
} from "../core/actions";
import { MAP } from "../core/catalog/map";
import { RARITY_LABEL } from "../core/catalog/rarity";
import { cellAt } from "../core/cells";
import { deposit, withdrawStack, withdrawTool } from "../core/inventory";
import type { MinigameResult } from "../core/minigames/types";
import { findPath } from "../core/path";
import type { Point, PotagerSave, Rarity, ToolId } from "../core/types";
import { toast } from "sonner";
import { flowerName } from "./herbierView";
import { nearestWalkable } from "../core/walk";
import type { PotagerScene } from "../render/createPotagerScene";
import type { SimHost } from "../sim/simHost";
import { anchorOf, createGame, type ActiveGame } from "./minigames/minigameKit";

const BUBBLE_MS = 2000;
const ARRIVED = 0.2;

const near = (a: Point, b: Point, d: number) => Math.hypot(a.x - b.x, a.z - b.z) < d;

// élément du jardin sous un point cliqué au sol
function targetAt(p: Point, parcels: readonly string[]): Target | null {
  const c = cellAt(p, parcels);
  if (c) return { kind: "cell", key: c.key };
  const { abri, puits } = MAP;
  if (Math.abs(p.x - abri.x) < abri.w / 2 + 0.5 && Math.abs(p.z - abri.z) < abri.d / 2 + 0.5)
    return { kind: "abri" };
  if (near(p, puits, puits.r + 0.5)) return { kind: "puits" };
  return null;
}

const seedText = (rarity: Rarity) => `Graine ${RARITY_LABEL[rarity].toLowerCase()} trouvée !`;

// Espace ou clic sur le jardin : préparer l'action, jouer le mini-jeu, appliquer le résultat.
export function useGardenActions(
  scene: PotagerScene | null,
  host: SimHost | null,
  // un autre panneau (Herbier) est ouvert
  paused: boolean,
) {
  const [game, setGame] = useState<ActiveGame | null>(null);
  const [abriOpen, setAbriOpen] = useState(false);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef(selected);
  const gameRef = useRef<ActiveGame | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
    gameRef.current = game;
  });
  const pending = useRef<{ target: Target; stand: Point } | null>(null);
  const locked = game !== null || abriOpen || paused;

  const say = useCallback((text: string) => setBubble({ text, id: Date.now() }), []);

  useEffect(() => {
    if (!bubble) return;
    const id = setTimeout(() => setBubble(null), BUBBLE_MS);
    return () => clearTimeout(id);
  }, [bubble]);

  const start = useCallback(
    (target: Target) => {
      const s = host?.state();
      if (!scene || !s) return;
      pending.current = null;
      const p = prepareAction(s, target, selectedRef.current);
      if ("message" in p) return say(p.message);
      scene.avatar.walkTo([]);
      if (p.gesture === "abri") return setAbriOpen(true);
      setGame({
        gesture: p.gesture,
        target,
        anchor: anchorOf(target),
        hand: selectedRef.current,
        ...createGame(p.gesture),
      });
    },
    [scene, host, say],
  );

  const finish = useCallback(
    (r: MinigameResult) => {
      const g = gameRef.current;
      gameRef.current = null;
      setGame(null);
      if (!g || !host) return;
      let events: ActionEvent[] = [];
      let changed = true;
      host.update((s) => {
        const out = applyAction(s, g.target, g.gesture, r, g.hand, Math.random);
        events = out.events;
        changed = out.save !== s;
        return out.save;
      });
      if (!changed) return say("La case a changé entre-temps");
      for (const e of events)
        if (e.kind === "graine") say(seedText(e.rarity));
        else toast(`Nouvelle découverte ! ${flowerName(e.species, e.color)}`);
    },
    [host, say],
  );

  const interceptClick = useCallback(
    (p: Point) => {
      const s = host?.state();
      if (!scene || !s) return false;
      const target = targetAt(p, s.parcels);
      if (!target) return false;
      const stand = nearestWalkable(standPoint(target), scene.walkable) ?? standPoint(target);
      const path = findPath(scene.avatar.pose(), stand, scene.walkable);
      if (!path) return false;
      if (!path.length) start(target);
      else {
        scene.avatar.walkTo(path);
        pending.current = { target, stand };
      }
      return true;
    },
    [scene, host, start],
  );

  const cancelPending = useCallback(() => (pending.current = null), []);

  const lockedRef = useRef(locked);
  useEffect(() => {
    lockedRef.current = locked;
  });

  // arrivée d'un déplacement au clic ; surbrillance de ce qui est faisable devant soi
  useEffect(() => {
    if (!scene) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const pose = scene.avatar.pose();
      const s = host?.state();
      const target = !lockedRef.current && s ? findTarget(s, pose) : null;
      const usable = target && s && "gesture" in prepareAction(s, target, selectedRef.current);
      scene.setHighlight(usable ? target : null);
      const p = pending.current;
      // un panneau ou un mini-jeu ouvert entre-temps annule l'action prévue
      if (p && lockedRef.current) pending.current = null;
      else if (p && !pose.moving && near(pose, p.stand, ARRIVED)) {
        pending.current = null;
        start(p.target);
      }
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      scene.setHighlight(null);
    };
  }, [scene, host, start]);

  useEffect(() => {
    if (!scene || !abriOpen) return;
    const id = setInterval(() => {
      const pose = scene.avatar.pose();
      const gap = Math.hypot(
        Math.max(0, Math.abs(pose.x - MAP.abri.x) - MAP.abri.w / 2),
        Math.max(0, Math.abs(pose.z - MAP.abri.z) - MAP.abri.d / 2),
      );
      if (gap > REACH + 1) setAbriOpen(false);
    }, 250);
    return () => clearInterval(id);
  }, [scene, abriOpen]);

  // Espace : agir devant soi ; 1 à 6 : choisir une case du sac ; Échap : fermer l'abri
  useEffect(() => {
    if (!scene || !host) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.code === "Escape") return setAbriOpen(false);
      const digit = /^Digit([1-6])$/.exec(e.code);
      if (digit) return lockedRef.current || setSelected(Number(digit[1]) - 1);
      if (e.code !== "Space" || lockedRef.current) return;
      e.preventDefault();
      const s = host.state();
      const target = s && findTarget(s, scene.avatar.pose());
      if (target) start(target);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [scene, host, game, abriOpen, start]);

  // déplacement entre le sac et l'abri ; refusé (sac plein) : message
  const transfer = useCallback(
    (fn: (s: PotagerSave) => PotagerSave | null) => {
      const s = host?.state();
      if (!host || !s) return;
      if (!fn(s)) return say("Ton sac est plein");
      host.update((cur) => fn(cur) ?? cur);
    },
    [host, say],
  );

  return {
    game,
    finish,
    bubble: bubble?.text ?? null,
    abriOpen,
    closeAbri: () => setAbriOpen(false),
    deposit: (i: number) => transfer((s) => deposit(s, i)),
    withdrawTool: (id: ToolId) => transfer((s) => withdrawTool(s, id)),
    withdrawStack: (i: number) => transfer((s) => withdrawStack(s, i)),
    selected,
    select: (i: number) => locked || setSelected(i),
    locked,
    interceptClick,
    cancelPending,
  };
}
