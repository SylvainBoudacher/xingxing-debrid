import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyAction,
  findTarget,
  prepareAction,
  standPoint,
  type ActionEvent,
  type Gesture,
  type Target,
} from "../core/actions";
import { RARITY_LABEL } from "../core/catalog/rarity";
import { deposit, withdrawStack, withdrawTool } from "../core/inventory";
import type { MinigameResult } from "../core/minigames/types";
import { scareCrows } from "../core/nuisances";
import { findPath } from "../core/path";
import type { Point, PotagerSave, Rarity, ToolId } from "../core/types";
import { toast } from "sonner";
import { flowerName } from "./herbierView";
import { nearestWalkable } from "../core/walk";
import type { PotagerScene } from "../render/createPotagerScene";
import type { SimHost } from "../sim/simHost";
import { anchorOf, createGame, type ActiveGame } from "./minigames/minigameKit";
import { near, targetAt } from "./clickTarget";
import { usePanel } from "./usePanel";

const BUBBLE_MS = 2000;
const ARRIVED = 0.2;

const seedText = (rarity: Rarity) => `Graine ${RARITY_LABEL[rarity].toLowerCase()} trouvée !`;

// Espace ou clic sur le jardin : préparer l'action, jouer le mini-jeu, appliquer le résultat.
export function useGardenActions(
  scene: PotagerScene | null,
  host: SimHost | null,
  // un autre panneau (Herbier) est ouvert
  paused: boolean,
) {
  const [game, setGame] = useState<ActiveGame | null>(null);
  const { panel, open, close } = usePanel(scene);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [selected, setSelected] = useState(0);
  const selectedRef = useRef(selected);
  const gameRef = useRef<ActiveGame | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
    gameRef.current = game;
  });
  const pending = useRef<{ target: Target; stand: Point } | null>(null);
  // un panneau ouvert bloque les actions mais pas la marche : s'éloigner le ferme
  const moveLocked = game !== null || paused;
  const locked = moveLocked || panel !== null;
  const lockedRef = useRef(locked);
  useEffect(() => {
    lockedRef.current = locked;
  });

  const say = useCallback((text: string) => setBubble({ text, id: Date.now() }), []);

  useEffect(() => {
    if (!bubble) return;
    const id = setTimeout(() => setBubble(null), BUBBLE_MS);
    return () => clearTimeout(id);
  }, [bubble]);

  // applique un geste sur l'état courant (revalidé) et annonce ce qu'il a donné
  const apply = useCallback(
    (target: Target, gesture: Gesture, r: MinigameResult, hand: number, dir: Point) => {
      if (!host) return;
      let events: ActionEvent[] = [];
      let changed = true;
      host.update((s) => {
        const out = applyAction(s, target, gesture, r, hand, Math.random, dir);
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

  const start = useCallback(
    (target: Target) => {
      const s = host?.state();
      if (!scene || !s) return;
      pending.current = null;
      const p = prepareAction(s, target, selectedRef.current);
      if ("message" in p) return say(p.message);
      scene.avatar.walkTo([]);
      const dir = scene.avatar.pose().dir;
      if (target.kind === "panneau" || target.kind === "piquet") return open(target);
      if (p.gesture === "chantier" || p.gesture === "maison") return open({ kind: p.gesture });
      if (p.gesture === "abri" || p.gesture === "etal" || p.gesture === "cabane")
        return open({ kind: p.gesture });
      // servir passe par le panneau de l'étal
      if (p.gesture === "servir" || p.gesture === "panneau" || p.gesture === "piquet") return;
      // ramasser en forêt se fait sans mini-jeu
      if (p.gesture === "ramasser")
        return apply(target, p.gesture, { grade: "bien" }, selectedRef.current, dir);
      const cell = target.kind === "cell" ? s.cells[target.key] : undefined;
      setGame({
        gesture: p.gesture,
        target,
        anchor: anchorOf(target),
        hand: selectedRef.current,
        dir,
        ...createGame(p.gesture, cell?.kind === "plante" ? cell.seed : undefined),
      });
    },
    [scene, host, say, apply, open],
  );

  // mini-jeu lancé depuis un panneau : son résultat revient à l'appelant
  const play = useCallback(
    (gesture: "servir", onDone: (r: MinigameResult) => void) => {
      if (!scene) return;
      scene.avatar.walkTo([]);
      const target: Target = { kind: "etal" };
      setGame({
        gesture,
        target,
        anchor: anchorOf(target),
        hand: selectedRef.current,
        dir: scene.avatar.pose().dir,
        onDone,
        ...createGame(gesture),
      });
    },
    [scene],
  );

  const finish = useCallback(
    (r: MinigameResult) => {
      const g = gameRef.current;
      gameRef.current = null;
      setGame(null);
      if (g?.onDone) g.onDone(r);
      else if (g) apply(g.target, g.gesture, r, g.hand, g.dir);
    },
    [apply],
  );

  const interceptClick = useCallback(
    (p: Point) => {
      const s = host?.state();
      if (lockedRef.current) return false;
      if (!scene || !s) return false;
      const target = targetAt(p, s);
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

  // arrivée d'un déplacement au clic ; surbrillance de ce qui est faisable devant soi
  useEffect(() => {
    if (!scene) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const pose = scene.avatar.pose();
      const s = host?.state();
      // une corneille s'envole quand l'avatar approche
      const scared = s && scareCrows(s, pose);
      if (scared && scared !== s) host?.update(() => scared);
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

  // Espace : agir devant soi ; 1 à 6 : choisir une case du sac
  useEffect(() => {
    if (!scene || !host) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
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
  }, [scene, host, start]);

  // déplacement entre le sac et l'abri ; refusé (sac plein) : message
  const transfer = useCallback(
    (fn: (s: PotagerSave) => PotagerSave | null, full = "Ton sac est plein") => {
      const s = host?.state();
      if (!host || !s) return;
      if (!fn(s)) return say(full);
      host.update((cur) => fn(cur) ?? cur);
    },
    [host, say],
  );

  return {
    game,
    finish,
    bubble: bubble?.text ?? null,
    say,
    play,
    panel,
    closePanel: close,
    deposit: (i: number) => transfer((s) => deposit(s, i), "Le coffre est plein"),
    withdrawTool: (id: ToolId) => {
      // l'outil repris arrive dans la première case libre : il passe en main
      const free = host?.state()?.inventory.indexOf(null) ?? -1;
      transfer((s) => withdrawTool(s, id));
      if (free >= 0 && host?.state()?.inventory[free]?.kind === "tool") setSelected(free);
    },
    withdrawStack: (i: number) => transfer((s) => withdrawStack(s, i)),
    selected,
    select: (i: number) => locked || setSelected(i),
    locked: moveLocked,
    interceptClick,
    cancelPending,
  };
}
