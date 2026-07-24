# Détection de VLC sur Windows — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trouver VLC sur Windows quel que soit son disque d'installation, offrir un réglage de chemin explicite, et cesser de présenter une erreur lecteur comme une erreur réseau.

**Architecture:** la logique lecteur quitte `lib.rs` pour un module `src-tauri/src/player.rs`. La résolution Windows suit un ordre chemin configuré → registre → `PATH` → emplacements connus, avec un cœur pur testable sur toutes les plateformes. Les commandes renvoient un `PlayerError` sérialisé ; le frontend le distingue des erreurs réseau via `src/lib/player.ts` et affiche un toast qui ouvre le nouveau panneau de réglages « Lecture ».

**Tech Stack:** Rust (Tauri 2, crate `winreg` sur Windows uniquement), React 19 + TypeScript, Vitest, `@tauri-apps/plugin-store`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-opener`.

**Spec:** `docs/superpowers/specs/2026-07-24-vlc-detection-windows-design.md`

## Global Constraints

- Branche de travail : `feat/vlc-detection-windows` (déjà créée, la spec y est commitée).
- Toute la copie utilisateur est en français, avec guillemets droits dans le code.
- Pas d'em dash, pas de guillemets typographiques, pas d'Unicode décoratif dans le code.
- Commentaires rares et uniquement là où la logique n'est pas évidente (voir `CLAUDE.md`).
- Un composant par fichier ; les helpers purs vivent dans des modules frères.
- Le hook pre-commit lance `bunx lint-staged && bunx tsc --noEmit` : tout commit échoue si TypeScript ne compile pas.
- Le réglage de chemin VLC est **Windows uniquement**. macOS (`open -a VLC`) et Linux (`vlc` via `PATH`) gardent leur comportement de lancement actuel.
- Clé de store : `vlc_path` dans `settings.json`.
- Le Rust ne lit pas le store : le chemin configuré est passé en argument de commande, comme `alldebridKey` aujourd'hui.
- Les commandes Rust concernées renvoient `Result<_, PlayerError>` et non `Result<_, String>`.

## File Structure

**Créés**

- `src-tauri/src/player.rs` — résolution de VLC, lancement, `PlayerError`, commandes Tauri lecteur, tests unitaires Rust.
- `src/lib/player.ts` — appel des commandes lecteur depuis le frontend, garde de type `isPlayerError`, messages et routage des toasts.
- `src/lib/player.test.ts` — tests Vitest des helpers purs de `player.ts`.
- `src/lib/settingsNavigation.ts` — évènement d'ouverture des Réglages sur un panneau donné.
- `src/components/settings/panels/PlaybackPanel.tsx` — panneau « Lecture ».

**Modifiés**

- `src-tauri/Cargo.toml` — dépendance `winreg` ciblée Windows.
- `src-tauri/src/lib.rs` — suppression de `open_with_vlc` / `open_many_with_vlc` / `open_urls_with_vlc`, déclaration `mod player;`, enregistrement des trois commandes lecteur.
- `src/lib/useDebridActions.ts` — deux appels passent par `openInVlc`, `catch` routés.
- `src/pages/MagnetsPage.tsx` — un appel passe par `openInVlc`, `catch` routé.
- `src/components/settings/settingsNav.ts` — entrée `playback`, filtrée hors Windows.
- `src/pages/PreferencesPage.tsx` — prop `initialPanel`, cas `playback`.
- `src/App.tsx` — écoute de l'évènement de navigation Réglages.

**Ordre des tâches**

1. Module Rust `player.rs` avec cœur de résolution testé.
2. Câblage des commandes Rust dans `lib.rs`.
3. Module frontend `src/lib/player.ts` testé.
4. Navigation vers un panneau de réglages.
5. Panneau « Lecture ».
6. Bascule des trois sites d'appel.
7. Vérification finale et notes de version.

---

### Task 1: Module Rust `player.rs` et cœur de résolution

**Files:**

- Create: `src-tauri/src/player.rs`
- Modify: `src-tauri/Cargo.toml`

**Interfaces:**

- Consumes: rien.
- Produces:
  - `pub enum PlayerError { NotFound, ConfiguredPathMissing { path: String }, LaunchFailed { message: String } }`, `Serialize`, `#[serde(tag = "kind", rename_all = "camelCase")]`
  - `fn pick_vlc(configured: Option<&str>, candidates: &[PathBuf], exists: &dyn Fn(&Path) -> bool) -> Result<PathBuf, PlayerError>`

`pick_vlc` est le cœur pur : il porte la règle de priorité et se teste sur macOS. La collecte des candidats (registre, `PATH`, dossiers connus) est spécifique à Windows et n'est pas testable ici.

- [ ] **Step 1: Ajouter la dépendance Windows**

Dans `src-tauri/Cargo.toml`, après le bloc `[dependencies]` existant :

```toml
[target.'cfg(windows)'.dependencies]
winreg = "0.52"
```

- [ ] **Step 2: Écrire le test qui échoue**

Créer `src-tauri/src/player.rs` avec uniquement le module de tests :

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::path::{Path, PathBuf};

    fn exists_only(known: &'static [&'static str]) -> impl Fn(&Path) -> bool {
        move |p: &Path| known.iter().any(|k| Path::new(k) == p)
    }

    #[test]
    fn configured_path_wins_over_candidates() {
        let candidates = vec![PathBuf::from("/auto/vlc")];
        let exists = exists_only(&["/perso/vlc", "/auto/vlc"]);
        let found = pick_vlc(Some("/perso/vlc"), &candidates, &exists).unwrap();
        assert_eq!(found, PathBuf::from("/perso/vlc"));
    }

    #[test]
    fn missing_configured_path_does_not_fall_back() {
        let candidates = vec![PathBuf::from("/auto/vlc")];
        let exists = exists_only(&["/auto/vlc"]);
        let err = pick_vlc(Some("/perso/vlc"), &candidates, &exists).unwrap_err();
        assert!(matches!(err, PlayerError::ConfiguredPathMissing { path } if path == "/perso/vlc"));
    }

    #[test]
    fn blank_configured_path_is_ignored() {
        let candidates = vec![PathBuf::from("/auto/vlc")];
        let exists = exists_only(&["/auto/vlc"]);
        let found = pick_vlc(Some("   "), &candidates, &exists).unwrap();
        assert_eq!(found, PathBuf::from("/auto/vlc"));
    }

    #[test]
    fn first_existing_candidate_wins() {
        let candidates = vec![
            PathBuf::from("/absent/vlc"),
            PathBuf::from("/present/vlc"),
            PathBuf::from("/autre/vlc"),
        ];
        let exists = exists_only(&["/present/vlc", "/autre/vlc"]);
        let found = pick_vlc(None, &candidates, &exists).unwrap();
        assert_eq!(found, PathBuf::from("/present/vlc"));
    }

    #[test]
    fn no_candidate_gives_not_found() {
        let exists = exists_only(&[]);
        let err = pick_vlc(None, &[], &exists).unwrap_err();
        assert!(matches!(err, PlayerError::NotFound));
    }
}
```

Ajouter `mod player;` dans `src-tauri/src/lib.rs`, juste sous `mod profile;` (ligne 10), pour que le module soit compilé.

- [ ] **Step 3: Lancer le test et vérifier qu'il échoue**

Run: `cd src-tauri && cargo test player`
Expected: FAIL, `cannot find function pick_vlc in this scope` et `cannot find type PlayerError in this scope`.

- [ ] **Step 4: Implémenter le cœur**

En tête de `src-tauri/src/player.rs`, avant le module de tests :

```rust
use std::path::{Path, PathBuf};

#[derive(Debug, serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PlayerError {
    NotFound,
    ConfiguredPathMissing { path: String },
    LaunchFailed { message: String },
}

// Priorite : le chemin configure par l'utilisateur prime et ne retombe jamais
// sur la detection automatique, sinon on lancerait un autre binaire sans le dire.
// Hors Windows, seuls les tests appellent cette fonction.
#[cfg_attr(not(target_os = "windows"), allow(dead_code))]
fn pick_vlc(
    configured: Option<&str>,
    candidates: &[PathBuf],
    exists: &dyn Fn(&Path) -> bool,
) -> Result<PathBuf, PlayerError> {
    if let Some(path) = configured.map(str::trim).filter(|p| !p.is_empty()) {
        let candidate = PathBuf::from(path);
        if exists(&candidate) {
            return Ok(candidate);
        }
        return Err(PlayerError::ConfiguredPathMissing { path: path.to_string() });
    }

    candidates
        .iter()
        .find(|p| exists(p))
        .cloned()
        .ok_or(PlayerError::NotFound)
}
```

- [ ] **Step 5: Lancer le test et vérifier qu'il passe**

Run: `cd src-tauri && cargo test player`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/player.rs src-tauri/src/lib.rs
git commit -m "feat(lecteur): coeur de resolution VLC teste"
```

---

### Task 2: Candidats Windows, lancement et commandes Tauri

**Files:**

- Modify: `src-tauri/src/player.rs`
- Modify: `src-tauri/src/lib.rs:397-443` (suppression de `open_with_vlc`, `open_many_with_vlc`, `open_urls_with_vlc`)
- Modify: `src-tauri/src/lib.rs:478-493` (`generate_handler![]`)

**Interfaces:**

- Consumes: `pick_vlc`, `PlayerError` (Task 1).
- Produces, exposées à `invoke` :
  - `open_with_vlc(url: String, vlcPath: Option<String>) -> Result<(), PlayerError>`
  - `open_many_with_vlc(urls: Vec<String>, vlcPath: Option<String>) -> Result<(), PlayerError>`
  - `detect_vlc(vlcPath: Option<String>) -> Result<String, PlayerError>` (renvoie le chemin résolu)

Les arguments Tauri sont nommés en camelCase côté frontend : le paramètre Rust `vlc_path` s'invoque avec `{ vlcPath }`.

- [ ] **Step 1: Collecter les candidats Windows**

Ajouter dans `src-tauri/src/player.rs` :

```rust
#[cfg(target_os = "windows")]
fn windows_candidates() -> Vec<PathBuf> {
    use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
    use winreg::RegKey;

    let mut out: Vec<PathBuf> = Vec::new();

    // 1. Registre : l'installeur VLC y ecrit son repertoire reel, quel que soit le disque.
    let install_dirs = [
        (HKEY_LOCAL_MACHINE, r"SOFTWARE\VideoLAN\VLC"),
        (HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\VideoLAN\VLC"),
        (HKEY_CURRENT_USER, r"SOFTWARE\VideoLAN\VLC"),
    ];
    for (hive, path) in install_dirs {
        if let Ok(key) = RegKey::predef(hive).open_subkey(path) {
            if let Ok(dir) = key.get_value::<String, _>("InstallDir") {
                out.push(PathBuf::from(dir).join("vlc.exe"));
            }
        }
    }
    if let Ok(key) = RegKey::predef(HKEY_LOCAL_MACHINE)
        .open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\vlc.exe")
    {
        if let Ok(exe) = key.get_value::<String, _>("") {
            out.push(PathBuf::from(exe));
        }
    }

    // 2. PATH.
    if let Some(paths) = std::env::var_os("PATH") {
        out.extend(std::env::split_paths(&paths).map(|p| p.join("vlc.exe")));
    }

    // 3. Emplacements connus.
    for var in ["ProgramFiles", "ProgramFiles(x86)"] {
        if let Some(dir) = std::env::var_os(var) {
            out.push(PathBuf::from(dir).join(r"VideoLAN\VLC\vlc.exe"));
        }
    }
    if let Some(dir) = std::env::var_os("LOCALAPPDATA") {
        out.push(PathBuf::from(dir).join(r"Programs\VideoLAN\VLC\vlc.exe"));
    }

    out
}
```

- [ ] **Step 2: Résolution par plateforme**

Toujours dans `player.rs` :

```rust
#[cfg(target_os = "windows")]
fn resolve_vlc(configured: Option<&str>) -> Result<PathBuf, PlayerError> {
    pick_vlc(configured, &windows_candidates(), &|p: &Path| p.exists())
}

// macOS delegue a `open -a VLC`, qui retrouve l'application ou qu'elle soit ;
// Linux passe par le PATH. Aucun chemin a resoudre en amont.
#[cfg(not(target_os = "windows"))]
fn resolve_vlc(_configured: Option<&str>) -> Result<PathBuf, PlayerError> {
    Ok(PathBuf::from("vlc"))
}
```

- [ ] **Step 3: Lancement**

```rust
fn spawn_vlc(urls: &[String], configured: Option<&str>) -> Result<(), PlayerError> {
    let launch = |mut cmd: std::process::Command| -> Result<(), PlayerError> {
        cmd.spawn()
            .map(|_| ())
            .map_err(|e| PlayerError::LaunchFailed { message: e.to_string() })
    };

    #[cfg(target_os = "macos")]
    {
        let _ = configured;
        let mut cmd = std::process::Command::new("open");
        cmd.arg("-a").arg("VLC").args(urls);
        return launch(cmd);
    }

    #[cfg(not(target_os = "macos"))]
    {
        let vlc = resolve_vlc(configured)?;
        let mut cmd = std::process::Command::new(vlc);
        cmd.args(urls);
        launch(cmd)
    }
}
```

- [ ] **Step 4: Commandes Tauri**

```rust
#[tauri::command]
pub fn open_with_vlc(url: String, vlc_path: Option<String>) -> Result<(), PlayerError> {
    spawn_vlc(&[url], vlc_path.as_deref())
}

#[tauri::command]
pub fn open_many_with_vlc(urls: Vec<String>, vlc_path: Option<String>) -> Result<(), PlayerError> {
    if urls.is_empty() {
        return Err(PlayerError::LaunchFailed { message: "Aucun lien a lire".into() });
    }
    spawn_vlc(&urls, vlc_path.as_deref())
}

#[tauri::command]
pub fn detect_vlc(vlc_path: Option<String>) -> Result<String, PlayerError> {
    Ok(resolve_vlc(vlc_path.as_deref())?.to_string_lossy().into_owned())
}
```

- [ ] **Step 5: Nettoyer `lib.rs`**

Supprimer les lignes 397 à 443 de `src-tauri/src/lib.rs` (`open_with_vlc`, `open_many_with_vlc`, `open_urls_with_vlc`). Dans `generate_handler![]`, remplacer :

```rust
            open_with_vlc,
            open_many_with_vlc,
```

par :

```rust
            player::open_with_vlc,
            player::open_many_with_vlc,
            player::detect_vlc,
```

- [ ] **Step 6: Vérifier la compilation, y compris la cible Windows**

Run: `cd src-tauri && cargo test player`
Expected: PASS, 5 tests, aucun avertissement de fonction inutilisée.

Run: `rustup target add x86_64-pc-windows-msvc && cd src-tauri && cargo check --target x86_64-pc-windows-msvc`
Expected: `Finished`. Sans ce second check, tout le bloc `#[cfg(target_os = "windows")]` (le code registre) ne serait jamais compilé sur macOS et une erreur n'apparaîtrait qu'en CI.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/player.rs src-tauri/src/lib.rs
git commit -m "feat(lecteur): detection VLC par registre, PATH et dossiers connus"
```

---

### Task 3: Module frontend `src/lib/player.ts`

**Files:**

- Create: `src/lib/player.ts`
- Create: `src/lib/player.test.ts`

**Interfaces:**

- Consumes: commandes `open_with_vlc`, `open_many_with_vlc`, `detect_vlc` (Task 2) ; `settingsStore` de `src/components/settings/store.ts` ; `toastNetworkError` de `src/lib/networkError.ts`.
- Produces:
  - `type PlayerError = { kind: "notFound" } | { kind: "configuredPathMissing"; path: string } | { kind: "launchFailed"; message: string }`
  - `isPlayerError(err: unknown): err is PlayerError`
  - `playerErrorMessage(err: PlayerError): string`
  - `openInVlc(urls: string[]): Promise<void>`
  - `detectVlc(): Promise<string | null>`
  - `toastVlcOrNetworkError(err: unknown, retry?: () => void): void`

`openSettingsPanel` (Task 4) est importé par ce module ; écrire Task 4 avant l'étape 4 si vous suivez le plan dans l'ordre inverse.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/lib/player.test.ts` :

```ts
import { describe, it, expect } from "vitest";
import { isPlayerError, playerErrorMessage } from "./player";

describe("isPlayerError", () => {
  it("reconnait une erreur lecteur serialisee par Rust", () => {
    expect(isPlayerError({ kind: "notFound" })).toBe(true);
    expect(isPlayerError({ kind: "configuredPathMissing", path: "D:\\vlc.exe" })).toBe(true);
  });

  it("rejette une erreur reseau ou une chaine", () => {
    expect(isPlayerError(new Error("timeout"))).toBe(false);
    expect(isPlayerError("VLC introuvable")).toBe(false);
    expect(isPlayerError(null)).toBe(false);
    expect(isPlayerError({ kind: "autre" })).toBe(false);
  });
});

describe("playerErrorMessage", () => {
  it("invite a installer VLC ou a le localiser", () => {
    expect(playerErrorMessage({ kind: "notFound" })).toBe(
      "VLC introuvable. Installez VLC, ou indiquez son emplacement dans les Réglages.",
    );
  });

  it("cite le chemin configure devenu invalide", () => {
    expect(playerErrorMessage({ kind: "configuredPathMissing", path: "D:\\vlc.exe" })).toBe(
      "Le VLC configuré est introuvable : D:\\vlc.exe.",
    );
  });

  it("cite la cause d'un lancement echoue", () => {
    expect(playerErrorMessage({ kind: "launchFailed", message: "Accès refusé" })).toBe(
      "Impossible de lancer VLC : Accès refusé.",
    );
  });
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `bun run test src/lib/player.test.ts`
Expected: FAIL, `Failed to resolve import "./player"`.

- [ ] **Step 3: Écrire le module**

Créer `src/lib/player.ts` :

```ts
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { settingsStore } from "@/components/settings/store";
import { toastNetworkError } from "@/lib/networkError";
import { openSettingsPanel } from "@/lib/settingsNavigation";

// Erreurs renvoyees par les commandes lecteur Rust (voir src-tauri/src/player.rs).
export type PlayerError =
  | { kind: "notFound" }
  | { kind: "configuredPathMissing"; path: string }
  | { kind: "launchFailed"; message: string };

const PLAYER_ERROR_KINDS = ["notFound", "configuredPathMissing", "launchFailed"];

export function isPlayerError(err: unknown): err is PlayerError {
  return (
    typeof err === "object" &&
    err !== null &&
    "kind" in err &&
    typeof (err as { kind: unknown }).kind === "string" &&
    PLAYER_ERROR_KINDS.includes((err as { kind: string }).kind)
  );
}

export function playerErrorMessage(err: PlayerError): string {
  switch (err.kind) {
    case "notFound":
      return "VLC introuvable. Installez VLC, ou indiquez son emplacement dans les Réglages.";
    case "configuredPathMissing":
      return `Le VLC configuré est introuvable : ${err.path}.`;
    case "launchFailed":
      return `Impossible de lancer VLC : ${err.message}.`;
  }
}

async function configuredVlcPath(): Promise<string | null> {
  return (await settingsStore.get<string>("vlc_path")) ?? null;
}

export async function openInVlc(urls: string[]): Promise<void> {
  const vlcPath = await configuredVlcPath();
  if (urls.length === 1) {
    await invoke("open_with_vlc", { url: urls[0], vlcPath });
    return;
  }
  await invoke("open_many_with_vlc", { urls, vlcPath });
}

// Chemin VLC resolu, ou null si aucun n'est trouve. Diagnostic du panneau Lecture.
export async function detectVlc(): Promise<string | null> {
  try {
    return await invoke<string>("detect_vlc", { vlcPath: await configuredVlcPath() });
  } catch {
    return null;
  }
}

// Les erreurs lecteur ne se retentent pas : on renvoie vers les Reglages au lieu
// du bouton Reessayer des erreurs reseau.
export function toastVlcOrNetworkError(err: unknown, retry?: () => void) {
  if (isPlayerError(err)) {
    toast.error(playerErrorMessage(err), {
      action: { label: "Réglages", onClick: () => openSettingsPanel("playback") },
    });
    return;
  }
  toastNetworkError(err, retry);
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `bun run test src/lib/player.test.ts`
Expected: PASS, 6 tests. Si l'import de `@/lib/settingsNavigation` échoue, faire la Task 4 d'abord.

- [ ] **Step 5: Commit**

```bash
git add src/lib/player.ts src/lib/player.test.ts
git commit -m "feat(lecteur): module frontend des erreurs et du lancement VLC"
```

---

### Task 4: Ouvrir les Réglages sur un panneau donné

**Files:**

- Create: `src/lib/settingsNavigation.ts`
- Modify: `src/pages/PreferencesPage.tsx:20-51`
- Modify: `src/App.tsx:72-104`, `src/App.tsx:440`

**Interfaces:**

- Consumes: `PanelId` de `src/components/settings/settingsNav.ts`.
- Produces:
  - `openSettingsPanel(panel: PanelId): void`
  - `onSettingsPanelRequest(handler: (panel: PanelId) => void): () => void` (renvoie la fonction de désabonnement)
  - Prop `initialPanel?: PanelId` sur `PreferencesPage`

- [ ] **Step 1: Écrire le module d'évènement**

Créer `src/lib/settingsNavigation.ts` :

```ts
import type { PanelId } from "@/components/settings/settingsNav";

// Meme pattern que src/lib/shortcuts.ts : un CustomEvent evite de faire
// descendre un callback de navigation jusqu'aux toasts.
const SETTINGS_PANEL_EVENT = "settings-panel-request";

export function openSettingsPanel(panel: PanelId) {
  window.dispatchEvent(new CustomEvent<PanelId>(SETTINGS_PANEL_EVENT, { detail: panel }));
}

export function onSettingsPanelRequest(handler: (panel: PanelId) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<PanelId>).detail);
  window.addEventListener(SETTINGS_PANEL_EVENT, listener);
  return () => window.removeEventListener(SETTINGS_PANEL_EVENT, listener);
}
```

- [ ] **Step 2: Accepter un panneau initial dans `PreferencesPage`**

Dans l'interface `PreferencesPageProps`, ajouter :

```ts
  initialPanel?: PanelId;
```

Dans la déstructuration des props, ajouter `initialPanel,`. Puis remplacer :

```ts
const [activePanel, setActivePanel] = useState<PanelId>(ALL_NAV_ITEMS[0].id);
```

par :

```ts
const [activePanel, setActivePanel] = useState<PanelId>(initialPanel ?? ALL_NAV_ITEMS[0].id);
```

- [ ] **Step 3: Écouter l'évènement dans `App.tsx`**

Ajouter l'import :

```ts
import { onSettingsPanelRequest } from "@/lib/settingsNavigation";
import type { PanelId } from "@/components/settings/settingsNav";
```

À côté des autres `useState` du composant (vers la ligne 90), ajouter :

```ts
const [settingsPanel, setSettingsPanel] = useState<PanelId | undefined>(undefined);
```

Après le `useNavShortcuts` (vers la ligne 103), ajouter :

```ts
useEffect(
  () =>
    onSettingsPanelRequest((panel) => {
      setSettingsPanel(panel);
      setPage("preferences");
    }),
  [],
);
```

Sur le rendu de `PreferencesPage` (ligne 440), ajouter la prop :

```tsx
initialPanel = { settingsPanel };
```

- [ ] **Step 4: Vérifier la compilation**

Run: `bunx tsc --noEmit`
Expected: aucune sortie.

- [ ] **Step 5: Commit**

```bash
git add src/lib/settingsNavigation.ts src/pages/PreferencesPage.tsx src/App.tsx
git commit -m "feat(reglages): ouvrir les reglages sur un panneau precis"
```

---

### Task 5: Panneau « Lecture »

**Files:**

- Create: `src/components/settings/panels/PlaybackPanel.tsx`
- Modify: `src/components/settings/settingsNav.ts`
- Modify: `src/pages/PreferencesPage.tsx` (import et `switch`)

**Interfaces:**

- Consumes: `detectVlc` (Task 3), `settingsStore`, `SettingsPanel`, `FieldTitle`, `PanelDivider` de `../controls`.
- Produces: `PanelId` gagne la valeur `"playback"` ; composant `PlaybackPanel`.

- [ ] **Step 1: Déclarer le panneau dans la navigation**

Dans `src/components/settings/settingsNav.ts` :

Ajouter `MonitorPlay` à l'import `lucide-react`. Ajouter `| "playback"` au type `PanelId`. Dans le groupe `contenu`, insérer avant l'entrée `downloads` :

```ts
      {
        id: "playback",
        label: "Lecture",
        subtitle: "Le lecteur utilisé pour ouvrir les vidéos.",
        icon: MonitorPlay,
      },
```

En bas du fichier, remplacer l'export de `SETTINGS_GROUPS` par une version filtrée. Renommer la constante littérale en `ALL_SETTINGS_GROUPS` (`const ALL_SETTINGS_GROUPS: SettingsNavGroup[] = [...]`), puis ajouter :

```ts
// Le chemin de VLC ne se regle que sur Windows : ailleurs, macOS passe par
// `open -a VLC` et Linux par le PATH.
const isWindows = navigator.userAgent.includes("Windows");

export const SETTINGS_GROUPS: SettingsNavGroup[] = ALL_SETTINGS_GROUPS.map((g) => ({
  ...g,
  items: g.items.filter((i) => i.id !== "playback" || isWindows),
}));

export const ALL_NAV_ITEMS: SettingsNavItem[] = SETTINGS_GROUPS.flatMap((g) => g.items);
```

- [ ] **Step 2: Écrire le panneau**

Créer `src/components/settings/panels/PlaybackPanel.tsx` :

```tsx
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AlertTriangle, Check, FolderOpen, MonitorPlay } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SettingsPanel } from "../SettingsPanel";
import { FieldTitle } from "../controls";
import { settingsStore as store } from "../store";
import { detectVlc } from "@/lib/player";

export function PlaybackPanel() {
  const [vlcPath, setVlcPath] = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    setChecking(true);
    setDetected(await detectVlc());
    setChecking(false);
  }, []);

  useEffect(() => {
    store.get<string>("vlc_path").then((v) => setVlcPath(v ?? ""));
    refresh();
  }, [refresh]);

  async function savePath(path: string) {
    setVlcPath(path);
    await store.set("vlc_path", path);
    await store.save();
    await refresh();
  }

  async function pickVlc() {
    const picked = await open({
      multiple: false,
      filters: [{ name: "Exécutable", extensions: ["exe"] }],
    });
    if (typeof picked === "string") await savePath(picked);
  }

  return (
    <SettingsPanel
      icon={MonitorPlay}
      title="Lecture"
      subtitle="Le lecteur utilisé pour ouvrir les vidéos."
    >
      <FieldTitle
        title="Emplacement de VLC"
        hint="L'application retrouve normalement VLC toute seule, y compris s'il est installé sur un autre disque. Indiquez son emplacement uniquement si la détection échoue."
      />

      <div className="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-zinc-900/80 ring-1 ring-black/8 dark:ring-white/8 px-4 py-3">
        <div className="min-w-0">
          {checking ? (
            <p className="text-sm text-zinc-500">Recherche de VLC...</p>
          ) : detected ? (
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{detected}</span>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              VLC introuvable
            </p>
          )}
          <p className="mt-0.5 text-xs text-zinc-500">
            {vlcPath ? "Chemin défini manuellement." : "Détection automatique."}
          </p>
          {vlcPath && (
            <button
              onClick={() => savePath("")}
              className="mt-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Réinitialiser
            </button>
          )}
          {!detected && !checking && (
            <button
              onClick={() => openUrl("https://www.videolan.org/vlc/")}
              className="mt-0.5 block text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Télécharger VLC
            </button>
          )}
        </div>
        <button
          onClick={pickVlc}
          className="flex shrink-0 items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/80 ring-1 ring-black/10 dark:ring-white/10 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Choisir
        </button>
      </div>
    </SettingsPanel>
  );
}
```

- [ ] **Step 3: Brancher le panneau**

Dans `src/pages/PreferencesPage.tsx`, ajouter l'import :

```ts
import { PlaybackPanel } from "@/components/settings/panels/PlaybackPanel";
```

et dans `renderPanel`, avant `case "downloads":` :

```tsx
      case "playback":
        return <PlaybackPanel />;
```

- [ ] **Step 4: Vérifier**

Run: `bunx tsc --noEmit && bun run lint`
Expected: aucune sortie de `tsc`, aucune erreur ESLint.

Vérifier que `openUrl` est bien exporté par la version installée de `@tauri-apps/plugin-opener` :

Run: `grep -rn "openUrl\|revealItemInDir" node_modules/@tauri-apps/plugin-opener/dist-js/index.d.ts`
Expected: une déclaration `openUrl` apparaît. Sinon, utiliser l'export équivalent listé par cette commande.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/panels/PlaybackPanel.tsx src/components/settings/settingsNav.ts src/pages/PreferencesPage.tsx
git commit -m "feat(reglages): panneau Lecture avec diagnostic et chemin VLC"
```

---

### Task 6: Bascule des trois sites d'appel

**Files:**

- Modify: `src/lib/useDebridActions.ts:59-73`, `src/lib/useDebridActions.ts:147-162`
- Modify: `src/pages/MagnetsPage.tsx:234`

**Interfaces:**

- Consumes: `openInVlc`, `toastVlcOrNetworkError` (Task 3).
- Produces: aucune nouvelle interface publique.

- [ ] **Step 1: `useDebridActions.openVlc`**

Ajouter les imports en tête de `src/lib/useDebridActions.ts` :

```ts
import { openInVlc, toastVlcOrNetworkError } from "@/lib/player";
```

Remplacer le corps de `openVlc` :

```ts
const openVlc = useCallback(async function openVlc(link: string) {
  setVlcLink(link);
  try {
    const url = await invoke<string>("unlock_link", {
      link,
      alldebridKey: getKeyRef.current(),
    });
    await openInVlc([url]);
    toast.success("Ouvert dans VLC");
  } catch (err) {
    toastVlcOrNetworkError(err, () => openVlc(link));
  } finally {
    setVlcLink(null);
  }
}, []);
```

- [ ] **Step 2: `useDebridActions.openVlcMany`**

```ts
const openVlcMany = useCallback(
  async function openVlcMany(links: string[], groupKey: string) {
    if (links.length === 0) return;
    setBulkVlc(groupKey);
    try {
      const urls = await unlockAll(links);
      await openInVlc(urls);
      toast.success("Playlist ouverte dans VLC");
    } catch (err) {
      toastVlcOrNetworkError(err, () => openVlcMany(links, groupKey));
    } finally {
      setBulkVlc(null);
    }
  },
  [unlockAll],
);
```

- [ ] **Step 3: `MagnetsPage`**

Ajouter l'import :

```ts
import { openInVlc, toastVlcOrNetworkError } from "@/lib/player";
```

Remplacer `handleOpenVlc` (lignes 230-240) par :

```ts
async function handleOpenVlc(link: string) {
  setVlcing(link);
  try {
    const url = await invoke<string>("unlock_link", { link, alldebridKey: apiKey });
    await openInVlc([url]);
    toast.success("Ouvert dans VLC");
  } catch (err) {
    toastVlcOrNetworkError(err, () => handleOpenVlc(link));
  } finally {
    setVlcing(null);
  }
}
```

Le fichier garde son import `toastNetworkError` : huit autres appels s'en servent (lignes 260, 306, 319, 332, 698, 717, 782, 841), tous sur des opérations purement réseau.

- [ ] **Step 4: Vérifier qu'aucun `invoke` lecteur ne subsiste**

Run: `grep -rn "open_with_vlc\|open_many_with_vlc" src/`
Expected: uniquement `src/lib/player.ts`.

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: aucune erreur, tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useDebridActions.ts src/pages/MagnetsPage.tsx
git commit -m "feat(lecteur): router les erreurs VLC hors du toast reseau"
```

---

### Task 7: Vérification finale et notes de version

**Files:**

- Modify: `RELEASE_NOTES.md`

**Interfaces:**

- Consumes: tout ce qui précède.
- Produces: rien.

- [ ] **Step 1: Suite complète**

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: aucune erreur.

Run: `cd src-tauri && cargo test && cargo check --target x86_64-pc-windows-msvc`
Expected: tests Rust au vert, `Finished` pour la cible Windows.

- [ ] **Step 2: Essai manuel sur la plateforme de développement**

Run: `bun run tauri dev`

Vérifier : ouvrir un contenu dans VLC fonctionne toujours sur macOS (le comportement `open -a VLC` est inchangé), et l'entrée « Lecture » **n'apparaît pas** dans les Réglages hors Windows.

- [ ] **Step 3: Notes de version**

Remplacer le contenu de `RELEASE_NOTES.md` par :

```markdown
- VLC est maintenant détecté où qu'il soit installé sur Windows, y compris hors du disque C:
- Nouveau réglage « Lecture » pour indiquer manuellement l'emplacement de VLC (Windows)
- Les erreurs de lancement de VLC affichent un message clair au lieu d'une erreur réseau
```

- [ ] **Step 4: Commit**

```bash
git add RELEASE_NOTES.md
git commit -m "docs: notes de version pour la detection VLC"
```

- [ ] **Step 5: Validation Windows**

La lecture du registre n'est pas vérifiable depuis macOS. Faire tester une build Windows (l'utilisateur qui a signalé le problème est le meilleur candidat) avant de publier, en vérifiant :

1. VLC installé hors `C:` : la lecture démarre sans réglage manuel.
2. VLC absent : le toast propose « Réglages » et le panneau affiche « VLC introuvable » avec le lien de téléchargement.
3. Chemin manuel vers un `vlc.exe` déplacé ensuite : le toast cite le chemin devenu invalide.
