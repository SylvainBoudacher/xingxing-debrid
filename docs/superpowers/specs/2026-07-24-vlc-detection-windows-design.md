# Détection de VLC sur Windows et erreurs lecteur explicites

Date : 2026-07-24

## Problème

Un utilisateur Windows avait VLC installé hors du disque `C:`. L'ouverture d'un
contenu échouait sans explication utile, jusqu'à ce qu'il réinstalle VLC sur
`C:`.

Deux causes distinctes :

1. `open_urls_with_vlc` (`src-tauri/src/lib.rs:411`) ne teste que deux chemins
   codés en dur sur Windows : `C:\Program Files\VideoLAN\VLC\vlc.exe` et son
   équivalent `(x86)`. Aucune lecture du registre, aucun parcours du `PATH`,
   aucune installation par utilisateur.
2. L'échec renvoie la chaîne `"VLC introuvable"`, qui remonte dans les `catch`
   du frontend jusqu'à `toastNetworkError`. L'utilisateur voit donc une erreur
   présentée comme réseau, assortie d'un bouton « Réessayer » qui ne peut jamais
   aboutir.

## Objectif

Trouver VLC quel que soit son emplacement d'installation, offrir un réglage
explicite quand la détection échoue, et ne plus jamais présenter une erreur
lecteur comme une erreur réseau.

Hors périmètre : le support d'autres lecteurs que VLC (mpv, MPC-HC, PotPlayer).
Le réglage introduit ici est un chemin vers VLC, pas un lecteur externe
générique.

## Périmètre par plateforme

Le réglage de chemin est **Windows uniquement** : c'est la seule plateforme où
le problème se pose. macOS résout VLC via `open -a VLC` quel que soit son
emplacement ; Linux le résout via le `PATH`.

macOS et Linux bénéficient tout de même des erreurs typées : sur Linux, un VLC
absent du `PATH` produit aujourd'hui un message système cryptique.

## Architecture

### 1. Module Rust `src-tauri/src/player.rs`

`lib.rs` approche les 500 lignes et mélange des responsabilités. Toute la
logique lecteur en est extraite. `lib.rs` conserve uniquement l'enregistrement
des commandes dans `generate_handler![]`.

Le module expose :

- `resolve_vlc(configured: Option<String>) -> Result<PathBuf, PlayerError>`
- `open_with_vlc(url: String, vlc_path: Option<String>) -> Result<(), PlayerError>`
- `open_many_with_vlc(urls: Vec<String>, vlc_path: Option<String>) -> Result<(), PlayerError>`
- `detect_vlc(vlc_path: Option<String>) -> Result<String, PlayerError>` (diagnostic
  pour le panneau de réglages ; renvoie le chemin résolu)

### 2. Ordre de résolution sur Windows

`resolve_vlc` teste, dans cet ordre, et retient le premier candidat dont
`Path::exists()` est vrai :

1. **Chemin configuré**, s'il est renseigné et non vide. S'il ne pointe sur
   rien, la résolution s'arrête avec `ConfiguredPathMissing` : elle ne retombe
   pas sur la détection automatique. L'utilisateur a désigné un exécutable
   précis ; en lancer un autre sans le dire serait un comportement surprenant.
2. **Registre**, dans l'ordre :
   - `HKLM\SOFTWARE\VideoLAN\VLC`, valeur `InstallDir`
   - `HKLM\SOFTWARE\WOW6432Node\VideoLAN\VLC`, valeur `InstallDir` (vue 32 bits)
   - `HKCU\SOFTWARE\VideoLAN\VLC`, valeur `InstallDir` (installation par
     utilisateur)
   - `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\vlc.exe`, valeur
     par défaut
     Pour les clés `InstallDir`, `vlc.exe` est concaténé au répertoire obtenu.
     C'est cette étape qui règle le cas rapporté : l'installeur VLC enregistre son
     répertoire réel, quel que soit le disque.
3. **`PATH`** : parcours des entrées de `%PATH%` à la recherche de `vlc.exe`.
4. **Emplacements connus**, en dernier recours :
   - `%ProgramFiles%\VideoLAN\VLC\vlc.exe`
   - `%ProgramFiles(x86)%\VideoLAN\VLC\vlc.exe`
   - `%LOCALAPPDATA%\Programs\VideoLAN\VLC\vlc.exe`

Le balayage des lettres de lecteur (A-Z) est écarté : le registre couvre déjà
l'installation sur un autre disque, et un balayage donnerait une fausse
impression d'exhaustivité tout en manquant les installations portables.

La lecture du registre passe par la crate `winreg`, déclarée sous
`[target.'cfg(windows)'.dependencies]`. L'alternative sans dépendance
(`reg query` via `Command`) est écartée : processus externe et parsing de texte
fragile.

### 3. Erreurs typées

Les commandes lecteur renvoient un enum sérialisé plutôt qu'une `String` :

```rust
#[derive(serde::Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PlayerError {
    NotFound,
    ConfiguredPathMissing { path: String },
    LaunchFailed { message: String },
}
```

Côté frontend, `invoke` rejette avec l'objet sérialisé. Un garde de type
`isPlayerError(err)` distingue ces erreurs des erreurs réseau.

### 4. Réglage `vlc_path`

Stocké dans `settings.json` (store existant, clé `vlc_path`). Le frontend le lit
et le passe en argument aux commandes, comme `alldebridKey` aujourd'hui : le
Rust reste sans état et ne dépend pas du store.

### 5. Panneau de réglages « Lecture »

Nouveau panneau `playback` dans `SETTINGS_GROUPS`, groupe _Contenu_, placé juste
avant « Téléchargement », icône `MonitorPlay`.

L'entrée de navigation n'est présente que sur Windows : `settingsNav.ts` filtre
`playback` hors Windows. La plateforme est déduite de `navigator.userAgent` (la
WebView2 annonce « Windows NT ») ; ajouter `plugin-os` pour ce seul besoin n'est
pas justifié.

Contenu :

- Une ligne d'état alimentée au montage par `detect_vlc` : soit « VLC détecté »
  suivi du chemin résolu, soit « VLC introuvable » accompagné d'un lien
  « Télécharger VLC » ouvert via `plugin-opener`. C'est le diagnostic qui
  manquait à l'utilisateur.
- Un bouton « Choisir » ouvrant un sélecteur de fichier filtré sur `.exe`, et un
  bouton « Réinitialiser » quand un chemin est enregistré. Même présentation que
  le sélecteur de dossier de `DownloadsPanel.tsx:52`.

L'état est rafraîchi après chaque modification du chemin.

### 6. Wrapper frontend `src/lib/player.ts`

Les trois appels actuels passent par ce module :

- `src/lib/useDebridActions.ts:66`
- `src/lib/useDebridActions.ts:153`
- `src/pages/MagnetsPage.tsx:234`

Le module expose :

- `openInVlc(urls: string[]): Promise<void>` — lit `vlc_path` dans le store et
  invoque `open_with_vlc` ou `open_many_with_vlc` selon le nombre d'URLs.
- `isPlayerError(err): err is PlayerError`
- `toastVlcOrNetworkError(err, retry?)` — route vers un message lecteur (avec
  action « Réglages ») ou vers le comportement réseau actuel (avec
  « Réessayer »).

Les trois `catch` remplacent `toastNetworkError` par
`toastVlcOrNetworkError`. Le bouton « Réessayer » disparaît donc uniquement pour
les erreurs lecteur.

### 7. Messages

| Erreur                  | Toast                                                                              | Action   |
| ----------------------- | ---------------------------------------------------------------------------------- | -------- |
| `notFound`              | « VLC introuvable. Installez VLC, ou indiquez son emplacement dans les Réglages. » | Réglages |
| `configuredPathMissing` | « Le VLC configuré est introuvable : {chemin}. »                                   | Réglages |
| `launchFailed`          | « Impossible de lancer VLC : {message}. »                                          | Réglages |

### 8. Navigation vers un panneau de réglages

Rien ne permet aujourd'hui d'ouvrir les Réglages sur un panneau précis.

Nouveau module `src/lib/settingsNavigation.ts` : `openSettingsPanel(id)` émet un
`CustomEvent`, sur le même modèle que `src/lib/shortcuts.ts:48`. `App.tsx`
l'écoute, appelle `setPage("preferences")` et transmet un prop `initialPanel` à
`PreferencesPage`, qui l'utilise comme état initial à la place de
`ALL_NAV_ITEMS[0].id`.

## Flux

Ouverture d'un contenu :

1. Le frontend débride le lien (`unlock_link`) — les erreurs restent des erreurs
   réseau.
2. `openInVlc` lit `vlc_path` et invoque la commande.
3. Rust résout VLC selon l'ordre ci-dessus, puis `spawn`.
4. En cas d'échec, `PlayerError` remonte ; le `catch` route vers le toast
   lecteur, dont l'action ouvre le panneau « Lecture ».

## Vérification

- `bunx tsc --noEmit`
- `cargo check` dans `src-tauri/`
- `rustup target add x86_64-pc-windows-msvc` puis
  `cargo check --target x86_64-pc-windows-msvc` : sur macOS, `cargo check` seul
  ne compile pas le bloc `#[cfg(windows)]`, donc tout le code registre passerait
  sans être vérifié. Le check ne nécessite pas d'éditeur de liens.

Limite assumée : la lecture effective du registre ne peut pas être validée
depuis macOS. L'étape 2 de la résolution restera non testée en conditions
réelles jusqu'à un essai sur une machine Windows.
