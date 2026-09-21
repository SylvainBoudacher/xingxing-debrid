import { useCallback, useEffect, useRef, type RefObject } from "react";
import { fieldTiles } from "../core/plots";
import type { GardenSave } from "../core/types";
import type { GardenScene } from "../render/createGardenScene";

const MIN_DELAY = 2 * 60_000;
const MAX_DELAY = 5 * 60_000;
const STAY_MS = 90_000;
const MAX_CROWS = 2;

// Corbeaux éphémères : ils ne vivent que dans la scène, rien n'est enregistré.
export function useCrows(
  sceneRef: RefObject<GardenScene | null>,
  saveRef: RefObject<GardenSave | null>,
  active: boolean,
) {
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  const spawn = useCallback(() => {
    const interaction = sceneRef.current?.interaction;
    const save = saveRef.current;
    if (!interaction || !save) return;
    const spots = fieldTiles(save.plots).filter((key) => {
      const tile = save.tiles[key];
      return !tile || tile.kind === "plant";
    });
    if (!spots.length) return;
    const id = crypto.randomUUID();
    interaction.addCrow(id, spots[Math.floor(Math.random() * spots.length)]);
    setTimeout(() => sceneRef.current?.interaction?.removeCrow(id), STAY_MS);
  }, [sceneRef, saveRef]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let alive = 0;
    const plan = () => {
      timer = setTimeout(
        () => {
          if (document.visibilityState === "visible" && activeRef.current && alive < MAX_CROWS) {
            spawn();
            alive++;
            setTimeout(() => alive--, STAY_MS);
          }
          plan();
        },
        MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY),
      );
    };
    plan();
    return () => clearTimeout(timer);
  }, [spawn]);

  return { spawn };
}
