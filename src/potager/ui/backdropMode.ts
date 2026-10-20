export type BackdropMode = "run" | "pause";

export function backdropMode(s: {
  active: boolean;
  focused: boolean;
  hidden: boolean;
}): BackdropMode {
  return s.active && s.focused && !s.hidden ? "run" : "pause";
}
