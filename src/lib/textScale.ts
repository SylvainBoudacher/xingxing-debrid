import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LazyStore } from "@tauri-apps/plugin-store";

// Taille de l'interface : zoom de la webview, pour que les tailles en px
// (text-[11px] etc.) grossissent aussi. "system" suit le reglage Windows.
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

export type TextScale = number | "system";

export const MIN_SCALE = 1;
export const MAX_SCALE = 1.75;
export const SCALE_STEP = 0.05;

// Arrondit au cran de 5 % : evite les 1.1500000000000001 des additions flottantes.
function snap(scale: number): number {
  const snapped = Math.round(scale / SCALE_STEP) * SCALE_STEP;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(snapped.toFixed(2))));
}

const STORE_KEY = "text_scale";
export const TEXT_SCALE_EVENT = "text-scale-changed";

// Seul Windows expose un reglage systeme lisible (Accessibilite > Taille du texte).
export const hasSystemTextScale = navigator.userAgent.includes("Windows");
const DEFAULT_SCALE: TextScale = hasSystemTextScale ? "system" : 1;

let current: TextScale = DEFAULT_SCALE;
let appliedZoom = 1;

export function getTextScale(): TextScale {
  return current;
}

// Windows va jusqu'a 225 %, mais le zoom agrandit aussi les espacements :
// au-dela de MAX_SCALE la mise en page ne tient plus.
export async function getSystemTextScale(): Promise<number> {
  return snap(await invoke<number>("get_system_text_scale").catch(() => 1));
}

async function applyTextScale(scale: TextScale) {
  appliedZoom = scale === "system" ? await getSystemTextScale() : scale;
  await getCurrentWebview().setZoom(appliedZoom);
}

export async function setTextScale(scale: TextScale) {
  current = scale;
  window.dispatchEvent(new CustomEvent<TextScale>(TEXT_SCALE_EVENT, { detail: scale }));
  await applyTextScale(scale);
  await store.set(STORE_KEY, scale);
  await store.save();
}

function stepTextScale(dir: 1 | -1) {
  const next = snap(appliedZoom + dir * SCALE_STEP);
  if (next !== appliedZoom) setTextScale(next).catch(() => {});
}

// Cmd/Ctrl + / - / 0. Sur AZERTY le 0 demande Maj : on teste aussi e.code.
function onZoomKey(e: KeyboardEvent) {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  if (e.key === "+" || e.key === "=") stepTextScale(1);
  else if (e.key === "-") stepTextScale(-1);
  else if (e.key === "0" || e.code === "Digit0" || e.code === "Numpad0")
    setTextScale(DEFAULT_SCALE).catch(() => {});
  else return;
  e.preventDefault();
}

export function initTextScale() {
  store
    .get<TextScale>(STORE_KEY)
    .then((saved) => {
      if (typeof saved === "number") current = snap(saved);
      else if (saved === "system" && hasSystemTextScale) current = saved;
      return applyTextScale(current);
    })
    .catch(() => {});

  window.addEventListener("keydown", onZoomKey);

  // Pas d'evenement quand le reglage Windows change : on relit au retour sur la fenetre.
  if (hasSystemTextScale) {
    getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        if (focused && current === "system") applyTextScale("system").catch(() => {});
      })
      .catch(() => {});
  }
}
