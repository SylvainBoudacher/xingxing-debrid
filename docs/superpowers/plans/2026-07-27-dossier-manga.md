# Dossier de destination des mangas - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre de choisir un dossier dedie aux mangas, ranger les tomes par serie, et proposer le deplacement des tomes deja telecharges lors d'un changement de dossier.

**Architecture:** Une cle de store `manga_dir` (chemin absolu, vide = comportement actuel). Deux modules purs testes cote frontend (`mangaPaths.ts` pour l'assainissement et la resolution du dossier cible, `mangaMove.ts` pour le plan de deplacement), une commande Rust `move_files` tolerante aux echecs, et une modale de migration declenchee au changement de dossier dans les reglages.

**Tech Stack:** React 19 + TypeScript, Vite, vitest, Tauri 2 (Rust), tauri-plugin-store, tauri-plugin-dialog, sonner (toasts), motion/react.

## Global Constraints

- Spec de reference : `docs/superpowers/specs/2026-07-27-dossier-manga-design.md`.
- Commandes : tests `bun run test`, type-check `bunx tsc --noEmit`, Rust `cd src-tauri && cargo check`.
- Les tests sont co-localises : `src/lib/foo.ts` -> `src/lib/foo.test.ts`, importe `{ describe, expect, it } from "vitest"` et utilise les alias `@/`.
- Pas d'em dash, pas de guillemets typographiques, pas d'Unicode decoratif dans le code ni les messages.
- Les commentaires de code sont en francais sans accents (convention du depot cote `src/lib/manga*.ts` et Rust).
- Les textes affiches a l'utilisateur sont en francais et peuvent porter des accents (convention des composants existants).
- Le reglage `manga_dir` n'est jamais annule automatiquement : un echec de deplacement ne revient pas en arriere.
- Les `localPath` des fichiers non deplaces restent inchanges.

---

## File Structure

- `src/lib/mangaPaths.ts` (creer) : `sanitizeFolderName`, `MANGA_SUBDIR`, `resolveMangaTarget`.
- `src/lib/mangaPaths.test.ts` (creer) : tests de `sanitizeFolderName`.
- `src/lib/mangaMove.ts` (creer) : `planMangaMoves` (pure) et `applyMangaMoves` (invoke + mise a jour de la bibliotheque).
- `src/lib/mangaMove.test.ts` (creer) : tests de `planMangaMoves`.
- `src/lib/downloads.ts` (modifier) : `startDownload` accepte un `dir` explicite.
- `src/lib/mangaDownload.ts` (modifier) : utilise `resolveMangaTarget`.
- `src-tauri/src/lib.rs` (modifier) : `subdir` multi-segments, commande `move_files`.
- `src/components/settings/MangaMoveDialog.tsx` (creer) : modale de migration.
- `src/components/settings/panels/DownloadsPanel.tsx` (modifier) : bloc "Dossier des mangas" + branchement de la modale.

---

### Task 1: Assainissement et resolution du dossier manga

**Files:**

- Create: `src/lib/mangaPaths.ts`
- Test: `src/lib/mangaPaths.test.ts`

**Interfaces:**

- Consumes: rien.
- Produces:
  - `sanitizeFolderName(title: string): string`
  - `MANGA_SUBDIR: "manga"`
  - `resolveMangaTarget(seriesTitle: string): Promise<{ dir: string; subdir: string }>`

- [ ] **Step 1: Write the failing test**

Creer `src/lib/mangaPaths.test.ts` :

```ts
import { sanitizeFolderName } from "@/lib/mangaPaths";
import { describe, expect, it } from "vitest";

describe("sanitizeFolderName", () => {
  it("garde un titre simple", () => {
    expect(sanitizeFolderName("One Piece")).toBe("One Piece");
  });

  it("remplace les caracteres interdits par un tiret", () => {
    expect(sanitizeFolderName('Re:Zero / "Life" <2>')).toBe("Re-Zero - -Life- -2-");
  });

  it("supprime les caracteres de controle", () => {
    expect(sanitizeFolderName("Nar\u0000uto")).toBe("Nar-uto");
  });

  it("retire espaces et points en debut et fin", () => {
    expect(sanitizeFolderName("  .Bleach.  ")).toBe("Bleach");
  });

  it("tronque a 100 caracteres", () => {
    expect(sanitizeFolderName("a".repeat(150))).toHaveLength(100);
  });

  it("renvoie Manga si le resultat est vide", () => {
    expect(sanitizeFolderName("   ...  ")).toBe("Manga");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/lib/mangaPaths.test.ts`
Expected: FAIL, "Failed to resolve import" ou "sanitizeFolderName is not a function".

- [ ] **Step 3: Write the implementation**

Creer `src/lib/mangaPaths.ts` :

```ts
import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });

/** Sous-dossier des tomes quand aucun dossier manga dedie n'est configure. */
export const MANGA_SUBDIR = "manga";

// eslint-disable-next-line no-control-regex
const FORBIDDEN = /[/\\:*?"<>|\u0000-\u001f]/g;

/**
 * Transforme un titre de serie en nom de dossier utilisable sur tous les OS.
 * Les caracteres interdits deviennent des tirets, les espaces et points de
 * bordure sont retires (Windows les refuse en fin de nom).
 */
export function sanitizeFolderName(title: string): string {
  const cleaned = title
    .replace(FORBIDDEN, "-")
    .replace(/^[\s.]+/, "")
    .replace(/[\s.]+$/, "")
    .slice(0, 100)
    .replace(/[\s.]+$/, "");
  return cleaned === "" ? "Manga" : cleaned;
}

/**
 * Dossier de destination d'un tome : le dossier manga dedie s'il est
 * configure, sinon le sous-dossier "manga" du dossier de telechargement.
 * Le nom de la serie forme toujours le dernier segment.
 */
export async function resolveMangaTarget(
  seriesTitle: string,
): Promise<{ dir: string; subdir: string }> {
  const folder = sanitizeFolderName(seriesTitle);
  const mangaDir = (await store.get<string>("manga_dir")) ?? "";
  if (mangaDir.trim() !== "") return { dir: mangaDir, subdir: folder };
  const downloadDir = (await store.get<string>("download_dir")) ?? "";
  return { dir: downloadDir, subdir: `${MANGA_SUBDIR}/${folder}` };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/lib/mangaPaths.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Type-check**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mangaPaths.ts src/lib/mangaPaths.test.ts
git commit -m "feat(manga): resolution du dossier de destination des tomes"
```

---

### Task 2: Sous-dossiers multi-segments cote Rust

**Files:**

- Modify: `src-tauri/src/lib.rs:297-320` (parametre `subdir` de `download_to_dir`)

**Interfaces:**

- Consumes: rien.
- Produces: `download_to_dir` accepte un `subdir` de plusieurs segments separes par `/` (ex. `"manga/One Piece"`).

- [ ] **Step 1: Remplacer la validation du subdir**

Dans `download_to_dir`, remplacer le bloc actuel :

```rust
    // Sous-dossier optionnel (les tomes de manga vont dans "manga/") : cree a
    // la volee, un seul niveau, sans separateur de chemin.
    let target_dir = match subdir.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        Some(sub) if !sub.contains(['/', '\\']) && sub != ".." => {
            let path = base_dir.join(sub);
            std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
            path
        }
        _ => base_dir,
    };
```

par :

```rust
    // Sous-dossier optionnel, un ou plusieurs segments separes par "/" (ex.
    // "manga/One Piece") : cree a la volee, toujours sous base_dir.
    let target_dir = match subdir.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        Some(sub) if is_safe_subdir(sub) => {
            let mut path = base_dir;
            for segment in sub.split('/') {
                path = path.join(segment);
            }
            std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
            path
        }
        _ => base_dir,
    };
```

- [ ] **Step 2: Ajouter le helper de validation**

Juste au-dessus de `#[tauri::command] async fn download_to_dir`, ajouter :

```rust
// Un sous-dossier est sur si chacun de ses segments est non vide, different de
// "." et "..", et ne contient ni antislash ni racine absolue.
fn is_safe_subdir(sub: &str) -> bool {
    !sub.contains('\\')
        && !sub.starts_with('/')
        && sub
            .split('/')
            .all(|s| !s.is_empty() && s != "." && s != ".." && !s.contains(':'))
}
```

- [ ] **Step 3: Verifier la compilation**

Run: `cd src-tauri && cargo check`
Expected: `Finished` sans erreur (les warnings existants sont acceptables).

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(manga): sous-dossiers imbriques pour les telechargements"
```

---

### Task 3: Telechargement d'un tome dans le dossier manga

**Files:**

- Modify: `src/lib/downloads.ts:159-168` (`startDownload`)
- Modify: `src/lib/mangaDownload.ts`

**Interfaces:**

- Consumes: `resolveMangaTarget` (Task 1), `subdir` multi-segments (Task 2).
- Produces: `startDownload(url: string, subdir?: string, dir?: string): Promise<string | null>`.

- [ ] **Step 1: Ajouter le parametre `dir` a `startDownload`**

Dans `src/lib/downloads.ts`, remplacer la signature et la lecture du dossier :

```ts
export async function startDownload(url: string, subdir?: string): Promise<string | null> {
  ensureProgressListener();
  const id = crypto.randomUUID();
  const dir = (await store.get<string>("download_dir")) ?? "";
```

par :

```ts
export async function startDownload(
  url: string,
  subdir?: string,
  dir?: string,
): Promise<string | null> {
  ensureProgressListener();
  const id = crypto.randomUUID();
  const baseDir = dir ?? (await store.get<string>("download_dir")) ?? "";
```

puis, plus bas, remplacer l'appel :

```ts
const path = await invoke<string>("download_to_dir", { id, url, dir, subdir });
```

par :

```ts
const path = await invoke<string>("download_to_dir", { id, url, dir: baseDir, subdir });
```

Mettre a jour le commentaire de doc au-dessus : ajouter la ligne
`* `dir` force le dossier racine (par defaut : le dossier de telechargement).`

- [ ] **Step 2: Utiliser la cible manga dans `downloadVolume`**

Remplacer entierement `src/lib/mangaDownload.ts` par :

```ts
import { startDownload } from "@/lib/downloads";
import { updateVolume, type MangaVolume } from "@/lib/mangaLibrary";
import { resolveMangaTarget } from "@/lib/mangaPaths";
import { invoke } from "@tauri-apps/api/core";

/**
 * Debloque le lien AllDebrid du tome, le telecharge dans le dossier de la
 * serie, et memorise son chemin local. Retourne le chemin ecrit, ou null si le
 * telechargement a echoue ou a ete annule.
 */
export async function downloadVolume(
  mangaId: string,
  volume: MangaVolume,
  allDebridKey: string,
  seriesTitle: string,
): Promise<string | null> {
  const url = await invoke<string>("unlock_link", {
    link: volume.link,
    alldebridKey: allDebridKey,
  });
  const { dir, subdir } = await resolveMangaTarget(seriesTitle);
  const path = await startDownload(url, subdir, dir);
  if (path) {
    await updateVolume(mangaId, volume.fileName, volume.infoHash, { localPath: path });
  }
  return path;
}

/** Le fichier local a disparu : le tome redevient telechargeable. */
export function forgetLocalFile(mangaId: string, volume: MangaVolume): Promise<void> {
  return updateVolume(mangaId, volume.fileName, volume.infoHash, { localPath: undefined });
}
```

- [ ] **Step 3: Passer le titre depuis l'appelant**

Dans `src/components/LibraryMangaSection.tsx`, la callback `download` (vers la
ligne 203) recoit `mangaId` et `volume`. Le titre vient de l'etat `entries`
(`const [entries, setEntries] = useState<MangaEntry[]>(...)`, ligne 79).
Remplacer :

```tsx
const path = await downloadVolume(mangaId, volume, key);
```

par :

```tsx
const title = entries.find((e) => e.mangaId === mangaId)?.meta.title ?? "Manga";
const path = await downloadVolume(mangaId, volume, key, title);
```

et ajouter `entries` au tableau de dependances du `useCallback` (`[getAllDebridKey, refresh, entries]`).

- [ ] **Step 4: Type-check**

Run: `bunx tsc --noEmit`
Expected: aucune sortie. Si une erreur signale un appelant de `startDownload`,
verifier qu'il n'a pas ete modifie : les appels a deux arguments restent valides.

- [ ] **Step 5: Verifier la non-regression des tests**

Run: `bun run test`
Expected: tous les tests passent.

- [ ] **Step 6: Commit**

```bash
git add src/lib/downloads.ts src/lib/mangaDownload.ts src/components/LibraryMangaSection.tsx
git commit -m "feat(manga): telecharger les tomes dans un dossier par serie"
```

---

### Task 4: Commande Rust `move_files`

**Files:**

- Modify: `src-tauri/src/lib.rs` (nouvelle commande + `generate_handler!`)

**Interfaces:**

- Consumes: rien.
- Produces: commande `move_files` prenant `{ moves: [{ from, to }] }` et
  renvoyant `[{ from, to, error: string | null }]`.

- [ ] **Step 1: Ajouter les types et la commande**

Dans `src-tauri/src/lib.rs`, juste apres la commande `download_to_dir` et avant
`cancel_download`, ajouter :

```rust
#[derive(serde::Deserialize)]
struct FileMove {
    from: String,
    to: String,
}

#[derive(serde::Serialize)]
struct MoveResult {
    from: String,
    to: String,
    error: Option<String>,
}

// Deplace un fichier : rename d'abord (instantane), puis copie + suppression
// si la source et la destination sont sur des volumes differents. Si la copie
// reussit mais la suppression echoue, le deplacement est considere reussi :
// la destination est valide, seul un doublon subsiste.
fn move_one(from: &str, to: &str) -> Result<(), String> {
    let src = std::path::Path::new(from);
    let dst = std::path::Path::new(to);

    if !src.exists() {
        return Err("fichier introuvable".to_string());
    }
    if let Some(parent) = dst.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    if std::fs::rename(src, dst).is_ok() {
        return Ok(());
    }
    std::fs::copy(src, dst).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(src);
    Ok(())
}

// Deplace une liste de fichiers sans jamais s'arreter au premier echec :
// chaque entree porte son propre resultat pour que l'appelant sache quels
// fichiers restent a deplacer manuellement.
#[tauri::command]
fn move_files(moves: Vec<FileMove>) -> Vec<MoveResult> {
    moves
        .into_iter()
        .map(|m| {
            let error = move_one(&m.from, &m.to).err();
            MoveResult {
                from: m.from,
                to: m.to,
                error,
            }
        })
        .collect()
}
```

- [ ] **Step 2: Enregistrer la commande**

Dans `tauri::generate_handler![...]`, ajouter `move_files,` juste apres
`cancel_download,`.

- [ ] **Step 3: Verifier la compilation**

Run: `cd src-tauri && cargo check`
Expected: `Finished` sans erreur.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(manga): commande move_files tolerante aux echecs"
```

---

### Task 5: Plan de deplacement des tomes

**Files:**

- Create: `src/lib/mangaMove.ts`
- Test: `src/lib/mangaMove.test.ts`

**Interfaces:**

- Consumes: `sanitizeFolderName` (Task 1), commande `move_files` (Task 4),
  `updateVolume` de `@/lib/mangaLibrary`.
- Produces:
  - `interface PlannedMove { mangaId: string; fileName: string; infoHash: string; from: string; to: string }`
  - `planMangaMoves(entries: MangaEntry[], targetDir: string): PlannedMove[]`
  - `applyMangaMoves(moves: PlannedMove[]): Promise<{ moved: number; failed: PlannedMove[] }>`

- [ ] **Step 1: Write the failing test**

Creer `src/lib/mangaMove.test.ts` :

```ts
import type { MangaEntry, MangaVolume } from "@/lib/mangaLibrary";
import { planMangaMoves } from "@/lib/mangaMove";
import { describe, expect, it } from "vitest";

function volume(v: Partial<MangaVolume> = {}): MangaVolume {
  return {
    number: 1,
    infoHash: "hash",
    fileName: "T01.cbz",
    fileSize: 1,
    link: "link",
    ...v,
  };
}

function entry(title: string, volumes: MangaVolume[]): MangaEntry {
  return {
    mangaId: title,
    meta: {
      title,
      coverFileName: null,
      year: "",
      status: "ongoing",
      lastVolume: null,
      description: "",
      tags: [],
    },
    volumes,
    addedAt: 0,
  };
}

describe("planMangaMoves", () => {
  it("cible un sous-dossier par serie", () => {
    const entries = [entry("One Piece", [volume({ localPath: "/old/manga/T01.cbz" })])];
    expect(planMangaMoves(entries, "/new")).toEqual([
      {
        mangaId: "One Piece",
        fileName: "T01.cbz",
        infoHash: "hash",
        from: "/old/manga/T01.cbz",
        to: "/new/One Piece/T01.cbz",
      },
    ]);
  });

  it("ignore les tomes sans fichier local", () => {
    const entries = [entry("Bleach", [volume(), volume({ fileName: "T02.cbz" })])];
    expect(planMangaMoves(entries, "/new")).toEqual([]);
  });

  it("ignore les tomes deja au bon endroit", () => {
    const entries = [entry("Bleach", [volume({ localPath: "/new/Bleach/T01.cbz" })])];
    expect(planMangaMoves(entries, "/new")).toEqual([]);
  });

  it("assainit le titre de la serie", () => {
    const entries = [entry("Re:Zero", [volume({ localPath: "/old/T01.cbz" })])];
    expect(planMangaMoves(entries, "/new")[0].to).toBe("/new/Re-Zero/T01.cbz");
  });

  it("gere les chemins Windows", () => {
    const entries = [entry("Bleach", [volume({ localPath: "C:\\dl\\manga\\T01.cbz" })])];
    expect(planMangaMoves(entries, "D:\\Mangas")[0]).toMatchObject({
      from: "C:\\dl\\manga\\T01.cbz",
      to: "D:\\Mangas\\Bleach\\T01.cbz",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test src/lib/mangaMove.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/mangaMove"".

- [ ] **Step 3: Write the implementation**

Creer `src/lib/mangaMove.ts` :

```ts
import { type MangaEntry, updateVolume } from "@/lib/mangaLibrary";
import { sanitizeFolderName } from "@/lib/mangaPaths";
import { invoke } from "@tauri-apps/api/core";

export interface PlannedMove {
  mangaId: string;
  fileName: string;
  infoHash: string;
  from: string;
  to: string;
}

interface MoveResult {
  from: string;
  to: string;
  error: string | null;
}

// Separateur du chemin : antislash si le chemin en contient un, slash sinon.
// Evite de melanger les deux styles sur Windows.
function separator(path: string): string {
  return path.includes("\\") ? "\\" : "/";
}

function basename(path: string): string {
  const cut = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return cut === -1 ? path : path.slice(cut + 1);
}

/**
 * Liste les deplacements a effectuer pour ranger tous les tomes telecharges
 * sous `targetDir`, un sous-dossier par serie. Les tomes sans fichier local et
 * ceux deja a leur place sont ignores.
 */
export function planMangaMoves(entries: MangaEntry[], targetDir: string): PlannedMove[] {
  const sep = separator(targetDir);
  const moves: PlannedMove[] = [];

  for (const entry of entries) {
    const folder = sanitizeFolderName(entry.meta.title);
    for (const volume of entry.volumes) {
      const from = volume.localPath;
      if (!from) continue;
      const to = `${targetDir}${sep}${folder}${sep}${basename(from)}`;
      if (to === from) continue;
      moves.push({
        mangaId: entry.mangaId,
        fileName: volume.fileName,
        infoHash: volume.infoHash,
        from,
        to,
      });
    }
  }
  return moves;
}

/**
 * Execute les deplacements et met a jour le chemin local des tomes deplaces.
 * Les tomes en echec gardent leur ancien chemin et restent lisibles.
 */
export async function applyMangaMoves(
  moves: PlannedMove[],
): Promise<{ moved: number; failed: PlannedMove[] }> {
  const results = await invoke<MoveResult[]>("move_files", {
    moves: moves.map(({ from, to }) => ({ from, to })),
  });

  const failed: PlannedMove[] = [];
  let moved = 0;

  for (const [i, result] of results.entries()) {
    const move = moves[i];
    if (result.error) {
      failed.push(move);
      continue;
    }
    await updateVolume(move.mangaId, move.fileName, move.infoHash, { localPath: move.to });
    moved += 1;
  }
  return { moved, failed };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test src/lib/mangaMove.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Type-check**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mangaMove.ts src/lib/mangaMove.test.ts
git commit -m "feat(manga): plan de deplacement des tomes vers un nouveau dossier"
```

---

### Task 6: Modale de migration

**Files:**

- Create: `src/components/settings/MangaMoveDialog.tsx`

**Interfaces:**

- Consumes: `PlannedMove`, `applyMangaMoves` (Task 5).
- Produces: composant `MangaMoveDialog` avec les props
  `{ moves: PlannedMove[]; targetDir: string; onClose: () => void }`.

- [ ] **Step 1: Ecrire le composant**

Creer `src/components/settings/MangaMoveDialog.tsx` :

```tsx
import { applyMangaMoves, type PlannedMove } from "@/lib/mangaMove";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MangaMoveDialogProps {
  moves: PlannedMove[];
  targetDir: string;
  onClose: () => void;
}

/**
 * Propose de deplacer les tomes deja telecharges vers le nouveau dossier
 * manga. En cas d'echec, liste les fichiers restes en place pour que
 * l'utilisateur les deplace lui-meme.
 */
export function MangaMoveDialog({ moves, targetDir, onClose }: MangaMoveDialogProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<PlannedMove[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function move() {
    setBusy(true);
    try {
      const result = await applyMangaMoves(moves);
      if (result.failed.length === 0) {
        toast.success(`${result.moved} tome(s) déplacé(s).`);
        onClose();
        return;
      }
      toast.error(`${result.failed.length} fichier(s) n'ont pas pu être déplacés.`);
      setFailed(result.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white/95 p-5 shadow-2xl ring-1 ring-black/10 backdrop-blur-xl dark:bg-zinc-900/95 dark:ring-white/10"
      >
        {failed === null ? (
          <>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              Déplacer les mangas déjà téléchargés ?
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {moves.length} tome(s) sont enregistrés dans l&apos;ancien dossier. Ils peuvent être
              déplacés vers {targetDir}, rangés par série.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="rounded-full px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Laisser sur place
              </button>
              <button
                onClick={move}
                disabled={busy}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {busy ? "Déplacement..." : "Déplacer"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              {failed.length} fichier(s) à déplacer manuellement
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Ces fichiers n&apos;ont pas pu être déplacés vers {targetDir}. Ils restent lisibles
              depuis leur emplacement actuel.
            </p>
            <ul className="mt-3 space-y-1">
              {failed.slice(0, 5).map((m) => (
                <li key={m.from} className="truncate text-xs text-zinc-600 dark:text-zinc-300">
                  {m.from}
                </li>
              ))}
            </ul>
            {failed.length > 5 && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                et {failed.length - 5} autre(s).
              </p>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/MangaMoveDialog.tsx
git commit -m "feat(manga): modale de deplacement des tomes"
```

---

### Task 7: Reglage du dossier manga dans les parametres

**Files:**

- Modify: `src/components/settings/panels/DownloadsPanel.tsx`

**Interfaces:**

- Consumes: `MangaMoveDialog` (Task 6), `planMangaMoves` (Task 5),
  `loadMangaLibrary` de `@/lib/mangaLibrary`.
- Produces: rien (feuille de l'arbre).

- [ ] **Step 1: Ajouter les imports**

En haut de `DownloadsPanel.tsx`, ajouter :

```tsx
import { MangaMoveDialog } from "../MangaMoveDialog";
import { loadMangaLibrary } from "@/lib/mangaLibrary";
import { planMangaMoves, type PlannedMove } from "@/lib/mangaMove";
import { AnimatePresence } from "motion/react";
```

et completer l'import lucide existant : `import { BookOpen, Download, FolderOpen } from "lucide-react";`

- [ ] **Step 2: Ajouter l'etat et les handlers**

Dans le composant, apres `const [batchSize, setBatchSize] = useState("1");`, ajouter :

```tsx
const [mangaDir, setMangaDir] = useState("");
const [pendingMoves, setPendingMoves] = useState<PlannedMove[] | null>(null);
```

Dans le `useEffect` existant, ajouter :

```tsx
store.get<string>("manga_dir").then((v) => setMangaDir(v ?? ""));
```

Puis, apres `pickDownloadDir`, ajouter :

```tsx
async function saveMangaDir(dir: string) {
  setMangaDir(dir);
  await store.set("manga_dir", dir);
  await store.save();
}

// Le reglage est enregistre d'abord : meme si le deplacement echoue ou est
// refuse, les prochains telechargements vont dans le nouveau dossier.
async function pickMangaDir() {
  const picked = await open({ directory: true, multiple: false });
  if (typeof picked !== "string") return;
  await saveMangaDir(picked);
  const moves = planMangaMoves(await loadMangaLibrary(), picked);
  if (moves.length > 0) setPendingMoves(moves);
}
```

- [ ] **Step 3: Ajouter le bloc d'interface**

Juste apres le bloc du dossier de telechargement (avant le premier
`<PanelDivider />`), inserer :

```tsx
      <PanelDivider />

      <FieldTitle
        title="Dossier des mangas"
        hint="Où les tomes téléchargés sont rangés, un sous-dossier par série. Par défaut, un dossier « manga » dans le dossier de téléchargement."
      />

      <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
            {mangaDir || "Dossier de téléchargement / manga (par défaut)"}
          </p>
          {mangaDir && (
            <button
              onClick={() => saveMangaDir("")}
              className="mt-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <button
          onClick={pickMangaDir}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Choisir
        </button>
      </div>
```

Puis, juste avant la balise fermante `</SettingsPanel>`, ajouter :

```tsx
<AnimatePresence>
  {pendingMoves && (
    <MangaMoveDialog
      moves={pendingMoves}
      targetDir={mangaDir}
      onClose={() => setPendingMoves(null)}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 4: Type-check**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 5: Verifier la suite de tests**

Run: `bun run test`
Expected: tous les tests passent.

- [ ] **Step 6: Verification manuelle**

Lancer `bun run tauri dev`, ouvrir les parametres, onglet Telechargement :

1. Choisir un dossier manga vide -> la modale apparait si des tomes sont deja telecharges.
2. Cliquer "Déplacer" -> les fichiers apparaissent dans `<dossier>/<Titre>/`, le lecteur ouvre toujours les tomes.
3. Cliquer "Laisser sur place" -> rien ne bouge, le nouveau dossier reste enregistre.
4. Telecharger un nouveau tome -> il atterrit dans `<dossier>/<Titre>/`.
5. Cliquer "Réinitialiser" -> le libelle par defaut revient, un nouveau tome atterrit dans `<download_dir>/manga/<Titre>/`.

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/panels/DownloadsPanel.tsx
git commit -m "feat(manga): reglage du dossier de destination des mangas"
```
