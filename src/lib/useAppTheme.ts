import { useSyncExternalStore } from "react";
import type { Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Thème de l'app (classe .dark sur <html>), pas celui de l'OS.
export function useAppTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot);
}
