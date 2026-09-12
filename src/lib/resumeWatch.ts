import { isSeries, type LibraryEntry } from "@/lib/library";
import {
  nextTitleItem,
  resolveTitleSubject,
  titleSections,
  type TitleItem,
  type TitleSubject,
} from "@/lib/libraryTitle";
import type { ConfigMap } from "@/lib/seriesFolders";
import { LazyStore } from "@tauri-apps/plugin-store";

// Séries en cours, reprises par le bandeau de la bibliothèque. Seule leur
// identité est conservée : le prochain épisode est recalculé à l'affichage
// depuis la bibliothèque courante, pour qu'un épisode coché ailleurs, un
// fichier supprimé ou une saison ajoutée restent cohérents.
export interface ResumeRef {
  // Série TMDB regroupée. Null pour un pack sans métadonnées.
  tmdbId: number | null;
  infoHash: string | null;
  at: number;
}

export interface ResumeTarget {
  subject: TitleSubject;
  next: TitleItem;
}

// Séries montrées d'un coup. Au-delà, ce n'est plus une reprise mais une
// deuxième bibliothèque.
export const MAX_RESUMED = 3;

// L'historique conservé va plus loin que ce qui est montré : une série qui
// quitte la bibliothèque ou qu'on vient de terminer n'occupe alors pas un
// emplacement pour rien, la suivante prend sa place.
export const RESUME_HISTORY = 8;

const KEY = "library_resume";
const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

let cache: ResumeRef[] = [];
const listeners = new Set<() => void>();

/** Lecture synchrone : vide tant que loadResume n'a pas résolu. */
export function getCachedResume(): ResumeRef[] {
  return cache;
}

// Le bandeau s'abonne : la reprise s'enregistre depuis les cartes et la fiche,
// loin de lui dans l'arbre, sans faire descendre un rappel jusqu'à chaque ligne
// d'épisode.
export function subscribeResume(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export async function loadResume(): Promise<ResumeRef[]> {
  const stored = await store.get<ResumeRef[]>(KEY);
  cache = Array.isArray(stored) ? stored.slice(0, RESUME_HISTORY) : [];
  emit();
  return cache;
}

function sameSeries(a: ResumeRef, b: ResumeRef): boolean {
  return a.tmdbId !== null || b.tmdbId !== null ? a.tmdbId === b.tmdbId : a.infoHash === b.infoHash;
}

/** Liste remise à jour : la série reprise passe en tête, sans doublon. */
export function pushResume(refs: ResumeRef[], ref: ResumeRef): ResumeRef[] {
  return [ref, ...refs.filter((r) => !sameSeries(r, ref))].slice(0, RESUME_HISTORY);
}

// Seules les séries alimentent le bandeau : un film lancé n'y a pas sa place.
export function resumeRefOf(subject: TitleSubject): ResumeRef | null {
  const at = Date.now();
  if (subject.kind === "group") return { tmdbId: subject.group.tmdbId, infoHash: null, at };
  if (!isSeries(subject.entry)) return null;
  return { tmdbId: null, infoHash: subject.entry.infoHash, at };
}

/** Enregistre la série reprise. Sans effet pour un film. */
export function setResume(subject: TitleSubject): void {
  const ref = resumeRefOf(subject);
  if (!ref) return;
  cache = pushResume(cache, ref);
  emit();
  void store.set(KEY, cache).then(() => store.save());
}

// Séries à reprendre, dans l'ordre des références (la dernière lancée
// d'abord), limitées aux emplacements affichés. Une série est écartée si elle a
// quitté la bibliothèque ou si tout est vu (dernier épisode, série terminée) :
// elle ne prend pas la place d'une série encore en cours.
export function resumeTargets(
  entries: LibraryEntry[],
  refs: ResumeRef[],
  folders: ConfigMap,
): ResumeTarget[] {
  const targets: ResumeTarget[] = [];
  for (const ref of refs) {
    const subject = resolveTitleSubject(entries, ref.infoHash, ref.tmdbId);
    if (!subject) continue;
    const next = nextTitleItem(titleSections(subject, folders[String(ref.tmdbId)] ?? null));
    if (next) targets.push({ subject, next });
    if (targets.length === MAX_RESUMED) break;
  }
  return targets;
}
