import { toast } from "sonner";
import { potagerStore } from "../storage/potagerStore";
import { createSimHost, type SimHost } from "./simHost";

let host: SimHost | null = null;

// Hôte de la fenêtre principale : démarré une fois, il vit tant que l'app est ouverte.
export function getMainHost(): SimHost {
  if (!host) {
    host = createSimHost({ store: potagerStore });
    const h = host;
    h.start().then(
      () => {
        if (h.recovered)
          toast.error(
            "Sauvegarde du Potager illisible : une copie a été mise de côté et une nouvelle partie a commencé.",
          );
      },
      () => toast.error("Le Potager n'a pas pu être chargé."),
    );
  }
  return host;
}
