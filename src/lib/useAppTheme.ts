import { useSyncExternalStore } from "react";
import { getCurrentThemePref, subscribeThemePref, type Theme, type ThemePref } from "@/lib/theme";

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

// Réglage choisi (clair, sombre ou suivre l'OS), partagé entre le menu et les Paramètres.
export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribeThemePref, getCurrentThemePref);
}
