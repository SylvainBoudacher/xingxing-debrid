import { AVATAR_SPEED } from "../avatarMotion";
import type { Hired } from "../types";
import { BIEN_SHARE, GESTURE_MS, WALK_SHARE } from "./catalog";

type Level = Hired["level"];

// un employé ne fait jamais mieux que Bien : le Parfait reste au joueur
export const rollStaffGrade = (level: Level, rng: () => number): "bien" | "rate" =>
  rng() < BIEN_SHARE[level - 1] ? "bien" : "rate";

export const staffSpeed = (level: Level) => AVATAR_SPEED * WALK_SHARE[level - 1];
export const gestureMs = (level: Level) => GESTURE_MS[level - 1];
