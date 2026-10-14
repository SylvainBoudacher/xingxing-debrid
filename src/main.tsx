import "./lib/devTauriShim";
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import { applyThemePref, getThemePref } from "./lib/theme";
import { initTextScale } from "./lib/textScale";
import "./lib/launchTime";
import "./index.css";

getThemePref()
  .then(applyThemePref)
  .catch(() => {});
initTextScale();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
