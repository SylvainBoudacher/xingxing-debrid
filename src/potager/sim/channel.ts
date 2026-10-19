import { emit, listen } from "@tauri-apps/api/event";
import { isBrowserPreview } from "@/lib/devTauriShim";
import type { PotagerSave } from "../core/types";

export type HostRole = "main" | "potager";

// `id` distingue deux fenêtres Potager successives (ou le double montage de React)
export interface HandoffMsg {
  type: "claim" | "released" | "closed";
  from: HostRole;
  id: string;
  // "closed" : état final du Potager, une page qui se ferme peut ne jamais finir d'écrire
  save?: PotagerSave;
}

export interface Channel {
  post(msg: HandoffMsg): void;
  on(cb: (msg: HandoffMsg) => void): () => void;
}

const EVENT = "potager:handoff";

export function createChannel(): Channel {
  if (isBrowserPreview) {
    // aperçu navigateur : la fenêtre Potager est un onglet
    const bc = new BroadcastChannel("potager");
    return {
      post: (msg) => bc.postMessage(msg),
      on: (cb) => {
        const handler = (e: MessageEvent<HandoffMsg>) => cb(e.data);
        bc.addEventListener("message", handler);
        return () => bc.removeEventListener("message", handler);
      },
    };
  }
  return {
    post: (msg) => void emit(EVENT, msg),
    on: (cb) => {
      let disposed = false;
      let unlisten: (() => void) | null = null;
      void listen<HandoffMsg>(EVENT, (e) => cb(e.payload)).then((u) => {
        if (disposed) u();
        else unlisten = u;
      });
      return () => {
        disposed = true;
        unlisten?.();
      };
    },
  };
}
