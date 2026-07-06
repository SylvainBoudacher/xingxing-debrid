import { useEffect, useRef } from "react";
import {
  DEFAULT_NAV_SHORTCUTS,
  loadNavShortcuts,
  NAV_SHORTCUTS_EVENT,
  type NavShortcutAction,
  type NavShortcuts,
} from "./shortcuts";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

/** Navigation globale "Espace + touche" (Espace maintenue, puis la lettre). */
export function useNavShortcuts(onNavigate: (action: NavShortcutAction) => void) {
  const shortcutsRef = useRef<NavShortcuts>(DEFAULT_NAV_SHORTCUTS);
  const navigateRef = useRef(onNavigate);
  useEffect(() => {
    navigateRef.current = onNavigate;
  }, [onNavigate]);

  useEffect(() => {
    loadNavShortcuts()
      .then((s) => {
        shortcutsRef.current = s;
      })
      .catch(() => {});

    const onChanged = (e: Event) => {
      shortcutsRef.current = (e as CustomEvent<NavShortcuts>).detail;
    };

    let spaceDown = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if (e.code === "Space") {
        spaceDown = true;
        return;
      }
      if (!spaceDown || e.repeat) return;
      const key = e.key.toLowerCase();
      const entry = (Object.entries(shortcutsRef.current) as [NavShortcutAction, string][]).find(
        ([, k]) => k === key,
      );
      if (entry) {
        e.preventDefault();
        navigateRef.current(entry[0]);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceDown = false;
    };
    const onBlur = () => {
      spaceDown = false;
    };

    window.addEventListener(NAV_SHORTCUTS_EVENT, onChanged);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener(NAV_SHORTCUTS_EVENT, onChanged);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
}
