import { useEffect } from "react";
import { captureDuck, toggleVacuum } from "@/components/duckShopBridge";
import {
  ACTION_SHORTCUTS_EVENT,
  DEFAULT_ACTION_SHORTCUTS,
  loadActionShortcuts,
  type ActionShortcuts,
} from "./shortcuts";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

/** Single-key pool actions (e.g. "C" pour capturer le canard survolé). */
export function useActionShortcuts() {
  useEffect(() => {
    let shortcuts: ActionShortcuts = DEFAULT_ACTION_SHORTCUTS;
    loadActionShortcuts()
      .then((s) => {
        shortcuts = s;
      })
      .catch(() => {});

    const onChanged = (e: Event) => {
      shortcuts = (e as CustomEvent<ActionShortcuts>).detail;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === shortcuts.capture) {
        if (captureDuck()) e.preventDefault();
      } else if (key === shortcuts.vacuum) {
        if (toggleVacuum()) e.preventDefault();
      }
    };

    window.addEventListener(ACTION_SHORTCUTS_EVENT, onChanged);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(ACTION_SHORTCUTS_EVENT, onChanged);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
