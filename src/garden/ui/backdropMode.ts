export type BackdropMode = "run" | "pause" | "frozen";

export function backdropMode(s: {
  active: boolean;
  focused: boolean;
  hidden: boolean;
  gardenOpen: boolean;
}): BackdropMode {
  if (s.gardenOpen) return "frozen";
  if (!s.active || !s.focused || s.hidden) return "pause";
  return "run";
}
