import { potagerStore } from "../storage/potagerStore";
import { createChannel } from "./channel";
import { createSimHost, type SimHost } from "./simHost";

let host: SimHost | null = null;

// Hôte de la fenêtre principale : démarré une fois, il vit tant que l'app est ouverte.
export function getMainHost(): SimHost {
  if (!host) {
    host = createSimHost({ role: "main", store: potagerStore, channel: createChannel() });
    void host.start();
  }
  return host;
}
