import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useReducer, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { hasWebgl } from "../render/webgl";
import { createSaveScheduler, loadGarden } from "../storage/gardenStore";
import { DiscoveryToast } from "./DiscoveryToast";
import { FieldView } from "./FieldView";
import { gardenReducer, INITIAL_GARDEN } from "./gardenReducer";
import { announceGardenClosed, announceGardenOpened } from "./gardenWindow";

const TICK_MS = 60_000;

export default function GardenApp() {
  const [saver] = useState(() => createSaveScheduler());
  const [webglOk] = useState(hasWebgl);
  const [state, dispatch] = useReducer(gardenReducer, INITIAL_GARDEN);
  const [now, setNow] = useState(Date.now);
  const toastedSeq = useRef(0);

  useEffect(() => {
    let alive = true;
    loadGarden().then(({ save, recovered }) => {
      if (!alive) return;
      if (recovered)
        toast.error(
          "Sauvegarde du Potager illisible : une copie a été mise de côté et un nouveau champ a été créé.",
        );
      dispatch({ type: "load", save });
      dispatch({ type: "tick", now: Date.now() });
    });
    void announceGardenOpened();
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      dispatch({ type: "tick", now: t });
    }, TICK_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (state.save) saver.schedule(state.save);
  }, [state.save, saver]);

  useEffect(() => {
    const { seq, found } = state.discoveries;
    if (seq === toastedSeq.current) return;
    toastedSeq.current = seq;
    toast(<DiscoveryToast found={found} />, { duration: 6000 });
  }, [state.discoveries]);

  const toastedPress = useRef(0);
  useEffect(() => {
    const { seq, seed } = state.pressed;
    if (seq === toastedPress.current) return;
    toastedPress.current = seq;
    toast(
      seed
        ? "Fleur pressée dans l'Herbier. Une graine est tombée !"
        : "Fleur pressée dans l'Herbier",
    );
  }, [state.pressed]);

  useEffect(() => {
    if (isBrowserPreview) {
      const onHide = () => void saver.flush();
      window.addEventListener("pagehide", onHide);
      return () => window.removeEventListener("pagehide", onHide);
    }
    const pending = getCurrentWindow().onCloseRequested(async () => {
      await saver.flush();
      await announceGardenClosed();
    });
    return () => {
      pending.then((unlisten) => unlisten());
    };
  }, [saver]);

  return (
    <div className="flex h-screen flex-col bg-[#1a1216] text-[#f1e6d2]">
      <Toaster theme="dark" position="top-center" />
      <nav className="flex gap-1 border-b border-amber-300/25 px-4 pt-2">
        <span className="rounded-t-lg bg-amber-300/10 px-4 py-2 font-serif text-lg font-semibold text-[#f3dca0] shadow-[inset_0_-2px_0_#d9b46a]">
          Champ
        </span>
      </nav>
      {!webglOk ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm">
          Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
        </div>
      ) : (
        state.save && <FieldView save={state.save} now={now} dispatch={dispatch} />
      )}
    </div>
  );
}
