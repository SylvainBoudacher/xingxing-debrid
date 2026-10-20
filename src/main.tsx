import "./lib/devTauriShim";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isBrowserPreview } from "./lib/devTauriShim";
import { getMainHost } from "./potager/sim/mainHost";
import { queryClient } from "./lib/queryClient";
import { applyThemePref, getThemePref } from "./lib/theme";
import { initTextScale } from "./lib/textScale";
import "./lib/launchTime";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

getThemePref()
  .then(applyThemePref)
  .catch(() => {});
initTextScale();
// le temps de jeu du Potager avance tant que l'app est ouverte, quel que soit le fond
const host = getMainHost();
if (isBrowserPreview) window.addEventListener("pagehide", () => void host.stop());
// onCloseRequested détruit la fenêtre après le gestionnaire : une sauvegarde ratée ne doit pas la bloquer
else void getCurrentWindow().onCloseRequested(() => host.stop().catch(() => {}));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
