import "./lib/devTauriShim";
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { isGardenWindow } from "./garden/ui/gardenWindow";
import { queryClient } from "./lib/queryClient";
import { applyTheme, getTheme } from "./lib/theme";
import { initTextScale } from "./lib/textScale";
import "./lib/launchTime";
import "./index.css";

const GardenApp = lazy(() => import("./garden/ui/GardenApp"));
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

if (isGardenWindow()) {
  root.render(
    <React.StrictMode>
      <Suspense fallback={null}>
        <GardenApp />
      </Suspense>
    </React.StrictMode>,
  );
} else {
  getTheme()
    .then(applyTheme)
    .catch(() => {});
  initTextScale();
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}
