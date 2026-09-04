export type StepId = "services" | "network" | "keys" | "downloads" | "theme";

export type StepKind = "read" | "check" | "action" | "config";

export interface SetupStep {
  id: StepId;
  /** Libelle court affiche dans la barre d'etapes. */
  label: string;
  kind: StepKind;
  /** Phrase de l'apercu du parcours, sur l'accueil. */
  blurb: string;
}

export const SETUP_STEPS: SetupStep[] = [
  {
    id: "services",
    label: "Services",
    kind: "read",
    blurb: "Comprendre les trois services sur lesquels s'appuie l'application.",
  },
  {
    id: "network",
    label: "Connexion",
    kind: "check",
    blurb: "Verifier que votre reseau peut joindre C411.",
  },
  {
    id: "keys",
    label: "Cles API",
    kind: "action",
    blurb: "Recuperer et coller vos trois cles, une par service.",
  },
  {
    id: "downloads",
    label: "Telechargement",
    kind: "config",
    blurb: "Choisir le dossier de destination et le nombre de fichiers simultanes.",
  },
  {
    id: "theme",
    label: "Apparence",
    kind: "config",
    blurb: "Choisir le theme de l'application.",
  },
];

export const STEP_KINDS: Record<StepKind, { label: string; className: string }> = {
  read: {
    label: "A lire",
    className: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-zinc-500/20",
  },
  check: {
    label: "Verification",
    className: "bg-violet-500/12 text-violet-700 dark:text-violet-300 ring-violet-500/25",
  },
  action: {
    label: "Action requise",
    className: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-indigo-500/25",
  },
  config: {
    label: "Reglage",
    className: "bg-sky-500/12 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  },
};

export function stepIndex(id: StepId): number {
  return SETUP_STEPS.findIndex((s) => s.id === id);
}
