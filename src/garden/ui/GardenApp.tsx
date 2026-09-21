import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useReducer, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { isBrowserPreview } from "@/lib/devTauriShim";
import { hasWebgl } from "../render/webgl";
import { createSaveScheduler, loadGarden } from "../storage/gardenStore";
import { DiscoveryToast } from "./DiscoveryToast";
import { FieldView } from "./FieldView";
import { gardenReducer, INITIAL_GARDEN } from "./gardenReducer";
import { GardenTabs, type GardenTab } from "./GardenTabs";
import { HerbierPage } from "./herbier/HerbierPage";
import { ProgressionPage } from "./progression/ProgressionPage";
import { nodeById } from "../core/catalog/tree";
import { readyCount } from "../core/progression";
import { withExtraSachet, withPreviousDay } from "./sachets/devSachets";
import { SachetsPage } from "./sachets/SachetsPage";
import { announceGardenClosed, announceGardenOpened } from "./gardenWindow";

const TICK_MS = 60_000;

export default function GardenApp() {
  const [saver] = useState(() => createSaveScheduler());
  const [webglOk] = useState(hasWebgl);
  const [state, dispatch] = useReducer(gardenReducer, INITIAL_GARDEN);
  const [now, setNow] = useState(Date.now);
  const [tab, setTab] = useState<GardenTab>("champ");
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

  const toastedClaim = useRef(0);
  useEffect(() => {
    const { seq, id } = state.claimed;
    if (seq === toastedClaim.current) return;
    toastedClaim.current = seq;
    const node = id ? nodeById(id) : undefined;
    if (node) toast(`${node.title} : ${node.rewardLabel}`);
  }, [state.claimed]);

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
      <GardenTabs
        tab={tab}
        onTab={setTab}
        sachets={state.save?.sachets.pending.length ?? 0}
        ready={state.save ? readyCount(state.save) : 0}
      />
      {!webglOk
        ? tab === "champ" && (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm">
              Le Potager a besoin de WebGL, qui n'est pas disponible sur cet appareil.
            </div>
          )
        : state.save && (
            <div className={tab === "champ" ? "flex flex-1" : "hidden"}>
              <FieldView save={state.save} now={now} dispatch={dispatch} active={tab === "champ"} />
            </div>
          )}
      {tab === "herbier" && state.save && <HerbierPage save={state.save} />}
      {tab === "progression" && state.save && (
        <ProgressionPage
          save={state.save}
          onClaim={(id) => dispatch({ type: "claim", id, now: Date.now(), rng: Math.random })}
          onDeposit={(id, species) => dispatch({ type: "deposit", id, species })}
        />
      )}
      {tab === "sachets" && state.save && (
        <SachetsPage
          save={state.save}
          opened={state.opened}
          onOpen={() => dispatch({ type: "open-sachet", now: Date.now(), rng: Math.random })}
          onDevSachet={() => dispatch({ type: "set", save: withExtraSachet(state.save!) })}
          onDevNextDay={() => {
            dispatch({ type: "set", save: withPreviousDay(state.save!) });
            dispatch({ type: "tick", now: Date.now() });
          }}
        />
      )}
    </div>
  );
}
