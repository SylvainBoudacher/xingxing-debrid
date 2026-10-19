# Audit sécurité et performance - reste à corriger

Audit du 28/09/2026 (version 1.7.4). Ce fichier liste ce qui n'a pas encore été corrigé, avec
assez de contexte pour le faire plus tard sans refaire l'audit. Les numéros (#) sont ceux du
rapport d'origine. Les numéros de ligne correspondent à l'état du code au moment de l'audit :
revérifier avant de modifier.

## État

| #     | Sujet                                               | Statut                                                     |
| ----- | --------------------------------------------------- | ---------------------------------------------------------- |
| 1     | Ouverture d'exécutables téléchargés                 | Corrigé (`src-tauri/src/file_open.rs`)                     |
| 2     | CSP désactivée                                      | Corrigé (`tauri.conf.json`), **à vérifier dans une build** |
| 3     | Commandes Rust synchrones sur le thread principal   | **À faire** (priorité haute)                               |
| 4     | Chaîne de release (lockfile, actions non épinglées) | **À faire**                                                |
| 5     | CBZ piégé (allocation, zip bomb)                    | Corrigé (`read_capped`, plafond 64 Mo par page)            |
| 6     | Splash bloqué jusqu'à 41 s                          | Corrigé (attente plafonnée à 4 s, mesuré : 41 s -> 4 s)    |
| 7     | Rendus de progression des téléchargements           | Corrigé (regroupés toutes les 100 ms)                      |
| 8     | `cbz_page` rouvre et retrie l'archive à chaque page | **À faire** (avec le #3)                                   |
| 9     | Polling AllDebrid de la liste complète              | Corrigé, **à vérifier avec une vraie clé** (S5)            |
| 10    | Données SensCritique dans le bundle principal       | **À faire**                                                |
| 11    | Clé C411 visible dans la console, non encodée       | **À faire**                                                |
| 12    | Dossier `.superpowers/` versionné                   | **À faire**                                                |
| S1-S6 | Suites découvertes pendant les corrections          | **À faire**, voir plus bas                                 |

Ordre conseillé : #3 + #8 ensemble, puis S3, #4, #11, S1, S2, #10, #12, S6.

---

## #3 - Commandes Rust synchrones sur le thread principal (performance, haute)

**Problème.** Dans Tauri 2, une commande déclarée sans `async` s'exécute sur le thread
principal, celui de la fenêtre. Pendant son exécution, la fenêtre ne répond plus (roue arc-en-ciel
sur macOS, "Ne répond pas" sur Windows) et tous les autres `invoke` attendent. Les appels
s'enchaînent au lieu de tourner en parallèle.

**Commandes concernées** (toutes déclarées `#[tauri::command]` sans `async`) :

| Commande                                                               | Où                                                     | Coût                                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `cbz_list_pages`, `cbz_page`                                           | `src-tauri/src/cbz.rs:106`, `:162`                     | Lecture d'images de plusieurs Mo, jusqu'à ~7 pages demandées d'un coup par `src/lib/useCbzPages.ts` |
| `import_cbz`                                                           | `src-tauri/src/cbz.rs:221`                             | Copie de fichiers de centaines de Mo : le pire cas                                                  |
| `open_with_vlc`, `open_many_with_vlc`, `detect_vlc`                    | `src-tauri/src/player.rs:152`, `:157`, `:167`          | Lance `mdfind` (Spotlight) à chaque lecture sur macOS                                               |
| `export_profile`, `export_library`, `import_library`, `import_profile` | `src-tauri/src/profile.rs:107`, `:148`, `:162`, `:168` | Argon2 (lent par conception) + écriture disque                                                      |
| `export_json`                                                          | `src-tauri/src/lib.rs:324`                             | Écriture disque                                                                                     |
| `get_api_key`, `set_api_key`                                           | `src-tauri/src/lib.rs:163`, `:173`                     | Trousseau système, peut afficher une invite macOS                                                   |
| `open_file`, `can_open_file`                                           | `src-tauri/src/file_open.rs:39`, `:51`                 | Lance un processus (`open_file`)                                                                    |

À laisser synchrones : `cancel_download` (`lib.rs:567`, simple insertion dans un Mutex) et
`get_system_text_scale` (`text_scale.rs:4`).

**Correctif.**

1. Remplacer `#[tauri::command]` par `#[tauri::command(async)]` sur ces commandes. Vérifié
   dans le code de Tauri 2.11.6 (`src/ipc/mod.rs`, `respond_async_serialized_inner`) : le corps
   tourne alors dans `tauri::async_runtime::spawn`, sur un thread du runtime tokio et plus sur
   le thread principal. Les arguments sont déjà possédés (`String`, `Vec`), rien d'autre à
   changer. `move_files` (`lib.rs:552`) utilise déjà ce mécanisme.
2. Pour `import_cbz`, la copie peut durer des dizaines de secondes et bloquerait un thread
   tokio. Mieux : en faire une vraie commande `async` qui délègue la copie à
   `tauri::async_runtime::spawn_blocking(move || ...)` puis attend le résultat.
3. Sur macOS, ne lancer `mdfind` que si les emplacements fixes échouent. Aujourd'hui
   `macos_candidates()` (`player.rs:92`, `mdfind` à la ligne 98) construit toute la liste, Spotlight
   compris, avant de tester `/Applications/VLC.app`. Séparer en deux fonctions :

   ```rust
   #[cfg(target_os = "macos")]
   fn resolve_vlc(configured: Option<&str>) -> Result<PathBuf, PlayerError> {
       let exists = |p: &Path| p.exists();
       match pick_vlc(configured, &fixed_candidates(), &exists) {
           Err(PlayerError::NotFound) => pick_vlc(None, &spotlight_candidates(), &exists),
           other => other,
       }
   }
   ```

   `fixed_candidates()` = `/Applications/VLC.app` et `~/Applications/VLC.app`,
   `spotlight_candidates()` = le résultat de `mdfind`. Un chemin configuré mais introuvable
   renvoie toujours `ConfiguredPathMissing`, sans basculer sur la détection automatique
   (comportement voulu, voir le commentaire de `pick_vlc`).

**Pièges.** Une fois `cbz_page` asynchrone, les ~7 pages demandées par `useCbzPages` se
chargent réellement en parallèle, chacune ouvrant le fichier : c'est voulu. Faire le #8 en même
temps réduit le coût de chaque ouverture.

**Vérification.** Ouvrir un gros CBZ, idéalement sur un disque externe, et tourner les pages vite :
la fenêtre doit rester fluide. Importer une dizaine de tomes et déplacer la fenêtre pendant la
copie. Sur macOS, cliquer "Lire" doit lancer VLC sans délai. Exporter un profil : pas de gel.

---

## #8 - `cbz_page` rouvre et retrie l'archive à chaque page (performance, basse)

**Problème.** `read_page` (`src-tauri/src/cbz.rs:115`) rouvre le fichier, relit le répertoire
central du zip et retrie tous les noms (`sorted_pages`, `cbz.rs:80`) pour chaque page. Or le front
connaît déjà le nom de la page : `loadCbzPage(path, index, name)` dans `src/lib/cbz.ts`.

**Correctif.**

1. Changer la commande en `cbz_page(path: String, name: String)`. Côté Rust : refuser si
   `!is_image_entry(&name)`, ouvrir l'archive, `archive.by_name(&name)`, puis lire avec
   `read_capped(entry, declared, MAX_PAGE_BYTES)`. **Garder le plafond du #5.**
2. Front : `invoke("cbz_page", { path, name })` dans `src/lib/cbz.ts`.
3. Shim de preview : `src/lib/devTauriShim.ts` répond à `cbz_page` avec `args.index`. Le déduire
   du nom (`page01.svg` -> index 0).
4. Le variant `PageOutOfRange` devient inutile : le retirer de `CbzError` (Rust) et de
   `src/lib/cbz.ts` (type `CbzError`, `CBZ_ERROR_KINDS`, `cbzErrorMessage`). Un nom introuvable
   remonte en `ReadFailed`.
5. Adapter le test Rust `lists_and_reads_pages_in_order`, qui appelle `read_page(p, 0)`.

**Sécurité.** Le nom vient du front, mais `by_name` lit uniquement à l'intérieur de l'archive
(aucun accès au disque en dehors du fichier), et `is_image_entry` écarte dossiers, `__MACOSX` et
fichiers cachés. Pas de traversée de chemin possible.

**Vérification.** `cargo test cbz`, puis lecture d'un tome dans l'app.

---

## #4 - Chaîne de release (sécurité, moyenne)

**Problème.** Le job de release reçoit `TAURI_SIGNING_PRIVATE_KEY`, la clé qui signe les mises à
jour automatiques. Pourtant :

- `.github/workflows/release.yml:47` fait `bun install` sans `--frozen-lockfile`. La build publiée
  peut donc embarquer des versions de dépendances différentes de celles testées en CI
  (`ci.yml:28` utilise bien `--frozen-lockfile`).
- Les actions sont épinglées par tag modifiable : `release.yml:25` (`actions/checkout@v4`), `:29`
  (`actions/setup-node@v4`), `:34` (`oven-sh/setup-bun@v2`), `:37` (`dtolnay/rust-toolchain@stable`),
  `:42` (`swatinem/rust-cache@v2`), `:62` (`tauri-apps/tauri-action@v0`). Si un de ces tags est
  compromis, il peut voler la clé de signature ou injecter du code dans un binaire signé,
  distribué à tous les utilisateurs par la mise à jour automatique.

**Correctif.**

1. `release.yml:47` : `run: bun install --frozen-lockfile`.
2. Épingler chaque action par SHA de commit, avec le tag en commentaire :
   `uses: tauri-apps/tauri-action@<sha 40 caractères> # v0`. Pour obtenir le SHA (gère aussi
   les tags annotés) : `gh api repos/tauri-apps/tauri-action/commits/v0 --jq .sha`. Faire de même
   dans `ci.yml` (lignes 16, 20, 25), moins critique car sans secret.
3. **Piège `dtolnay/rust-toolchain`** : cette action déduit la toolchain du nom de la référence
   (`@stable`). Épinglée par SHA, il faut ajouter `toolchain: stable` dans son `with:`, à côté de
   `targets:`.
4. Pour garder les SHA à jour : `.github/dependabot.yml` avec `package-ecosystem: github-actions`.
   Dependabot met à jour les SHA et leur commentaire.

**Vérification.** À la release suivante, l'étape "Install frontend deps" doit passer. Si
`bun.lock` n'est pas à jour, elle échoue : c'est voulu, relancer `bun install` en local et
committer le lockfile avant de taguer.

---

## #11 - Clé C411 dans la console, non encodée (sécurité, basse)

**Problème.**

- La clé est insérée brute dans les URL, sans `encodeURIComponent` :
  `src/lib/services/c411.ts:45`, `src/lib/sendRelease.ts:46`, `src/lib/useAddMangaRelease.ts:69`.
- `classify()` (`src/lib/networkError.ts:60`) fait `console.error` de l'erreur brute. Une erreur
  du plugin HTTP contient l'URL complète, donc `apikey=...` (C411) ou `api_key=...` (TMDB).
  En dev, `networkErrorMessage` (`networkError.ts:103-104`) affiche aussi `String(err.rawCause)`
  dans le toast.
- Côté Rust, c'est déjà traité : `net_err` utilise `e.without_url()` (`src-tauri/src/lib.rs`).

**Correctif.**

1. `encodeURIComponent(apiKey)` aux 3 endroits.
2. Masquer les clés avant tout log :
   `const redact = (s: string) => s.replace(/(api_?key=)[^&\s)"]+/gi, "$1***");`
   puis `console.error(..., redact(String(err)))` dans `classify()`, et `redact(String(err.rawCause))`
   dans `networkErrorMessage`.
3. Ajouter un test unitaire de `redact` (aucun test n'existe encore pour `networkError.ts`).

**Vérification.** `bun run dev`, couper le réseau, lancer une recherche C411 : la console doit
afficher `apikey=***`.

---

## #10 - Données SensCritique dans le bundle principal (performance, basse)

**Problème.** `src/pages/DiscoverPage.tsx:3` importe `DiscoverMangaSection` de façon statique.
Il entraîne `useMangaFeed` -> `senscritiqueFeed` -> `src/lib/data/senscritiqueTop.ts` (245 Ko de
source) dans le chunk principal (`index-*.js`, 1,14 Mo au moment de l'audit). Tout est parsé au
démarrage, même si l'onglet Mangas n'est jamais ouvert.

**Correctif.** Charger la section en différé, comme `RouletteSection` l'est déjà
(`DiscoverPage.tsx:34-35`) :

```ts
const DiscoverMangaSection = lazy(() =>
  import("@/components/DiscoverMangaSection").then((m) => ({ default: m.DiscoverMangaSection })),
);
```

puis entourer l'usage (`DiscoverPage.tsx:345`) d'un `<Suspense>`, sur le modèle de
`RouletteSection`. Seuls `DiscoverMangaSection` et `useMangaFeed` importent `senscritiqueFeed` :
le split fonctionne sans autre changement.

**Hors correctif.** Les données Letterboxd (`letterboxdTop.ts`, 360 Ko) servent au démarrage
(`discoverPosterPreload.ts:18` précharge la page 1). Elles restent dans le bundle principal.

**Vérification.** `bunx vite build`, puis `grep -c Vagabond dist/assets/index-*.js` doit donner 0
("Vagabond" n'existe que dans les données SensCritique). Un nouveau chunk
`DiscoverMangaSection-*.js` apparaît, et `index-*.js` diminue.

---

## #12 - Dossier `.superpowers/` versionné (sécurité, basse)

**Problème.** L'état du serveur de brainstorming est committé : `.superpowers/brainstorm/.last-token`
(jeton), `server.pid`, `server-instance-id` et des maquettes HTML. Le dépôt est probablement public
(les mises à jour passent par ses releases GitHub). Effet de bord : `bun run format:check` (étape de
la CI) échoue déjà sur 4 fichiers `.js` de `.superpowers/brainstorm/`.

**Correctif.** `git rm -r --cached .superpowers`, ajouter `.superpowers/` au `.gitignore`, committer.
L'historique garde les fichiers, mais le jeton concerne un serveur local déjà arrêté
(`state/server-stopped`) : inutile de réécrire l'historique. Ne pas confondre avec
`docs/superpowers/` (plans et specs), à conserver.

**Vérification.** `git ls-files .superpowers` ne renvoie rien, et `bun run format:check` passe.

---

## Suites découvertes pendant les corrections

### S1 - Marquer les téléchargements "venu d'Internet" (suite du #1, sécurité, moyenne)

**Problème.** `download_to_dir` (`src-tauri/src/lib.rs:399`) écrit les fichiers sans la marque que
posent les navigateurs : Mark-of-the-Web sous Windows, `com.apple.quarantine` sous macOS. Depuis le
#1, l'app n'ouvre plus d'exécutable elle-même, mais un utilisateur qui lance un `.exe` depuis
"Ouvrir le dossier" n'aura ni SmartScreen ni Gatekeeper.

**Correctif.**

- **Windows**, après l'écriture réussie du fichier (avant l'émission finale de progression) :

  ```rust
  #[cfg(windows)]
  let _ = std::fs::write(format!("{}:Zone.Identifier", dest.display()), "[ZoneTransfer]\r\nZoneId=3\r\n");
  ```

  Erreur ignorée volontairement : FAT32 et exFAT ne gèrent pas les flux alternatifs.

- **macOS**, deux options :
  1. `LSFileQuarantineEnabled = true` dans un `src-tauri/Info.plist` (Tauri le fusionne dans le
     bundle). macOS met alors en quarantaine **tous** les fichiers créés par l'app, y compris les
     stores JSON, les exports et les CBZ importés. À tester : un `.mkv` ou un `.cbz` en quarantaine
     doit s'ouvrir sans invite.
  2. Poser l'attribut uniquement sur les téléchargements : `xattr -w com.apple.quarantine "<valeur>"`
     via `Command`, ou le crate `xattr`. Le format de la valeur n'est pas documenté officiellement :
     tester qu'un `.app` téléchargé déclenche bien l'avertissement Gatekeeper.

**Vérification.** Windows : propriétés d'un fichier téléchargé -> mention "provient d'un autre
ordinateur". macOS : `xattr -l <fichier>` affiche `com.apple.quarantine`.

### S2 - Le nom tronqué cache l'extension (suite du #1, sécurité, basse)

**Problème.** `src/components/DownloadsOverlay.tsx:51` tronque le nom complet (`truncate`) : sur
`Film.2024.1080p.MULTi.x265-GROUPE.mkv.exe`, le `.exe` final est justement ce qui disparaît.
Vérifié en preview.

**Correctif.** Séparer le nom en `stem` et `.ext`, puis rendre
`<span className="truncate">{stem}</span><span className="shrink-0">{ext}</span>` dans un conteneur
`flex min-w-0`. L'extension reste toujours visible.

**Vérification.** En preview, un nom long terminé par `.exe` affiche bien `.exe`.

### S3 - Commandes Rust encore trop permissives (suite du #2, sécurité, moyenne)

**Problème.** La CSP empêche désormais un script injecté de s'exécuter. Mais si ce verrou tombe
(dépendance npm compromise, qui fait partie du bundle et est donc autorisée), les commandes Rust
acceptent toujours n'importe quel chemin ou programme :

- `move_files` (`lib.rs:552`) : déplacer un fichier dans le dossier Démarrage de Windows ou dans
  `~/Library/LaunchAgents` donne une exécution à chaque session ;
- `open_with_vlc` (`player.rs:152`) : `vlcPath` est passé à `Command::new`, avec les URL en
  arguments : n'importe quel exécutable, avec n'importe quels arguments ;
- `import_cbz` (`cbz.rs:221`), `download_to_dir` (paramètre `dir`, `lib.rs:399`), `cbz_*` (`path`).

**Pourquoi pas une simple vérification du nom de `vlcPath`.** Elle est contournable : un script peut
télécharger avec `download_to_dir` un fichier nommé `vlc.exe`, puis le passer comme chemin.

**Correctif (chantier moyen).**

1. Faire choisir les chemins sensibles (VLC, dossier de téléchargement, dossier manga) par une
   boîte de dialogue ouverte **côté Rust** (`tauri_plugin_dialog` depuis Rust :
   `app.dialog().file().blocking_pick_file()` / `blocking_pick_folder()`).
2. Les stocker là où le webview ne peut pas écrire. **Pas dans `settings.json`** : la permission
   `store:default` permet au front de le modifier. Par exemple un fichier géré uniquement par Rust.
3. `open_with_vlc` ignore le chemin envoyé par le front et lit la valeur stockée côté Rust. Il
   n'accepte que des URL commençant par `http://` ou `https://`, ce qui empêche aussi d'injecter
   des options à VLC ou à `open` (`--extraintf`, etc.).
4. `move_files`, `import_cbz` et `download_to_dir` n'acceptent que des chemins situés sous ces
   racines (`canonicalize` puis `starts_with`).
5. Migration : reprendre la valeur `vlc_path` existante du store au premier lancement. Adapter
   l'étape VLC du setup (`src/components/setup/PlayerStep.tsx`) et le panneau Lecture des
   réglages (`src/components/settings/panels/PlaybackPanel.tsx`).

### S4 - CSP : points à connaître (suite du #2)

- **À vérifier dans une vraie build** (pas encore fait) : `bun run tauri build --debug`, lancer
  l'app de `src-tauri/target/debug/bundle/`, clic droit -> "Inspecter" -> Console. Parcourir
  Découverte, Mangas, Bibliothèque, lecteur et téléchargements : aucun message "Refused to...".
- **La CSP ne s'applique pas en `tauri dev`** sur ordinateur (Tauri 2.11.6 :
  `PROXY_DEV_SERVER = cfg!(all(dev, mobile))`, `src/manager/webview.rs:43`) : le webview charge
  directement le serveur Vite. Tout changement qui touche au chargement de ressources se teste
  dans une build.
- **Nouvel hôte d'images distant** : l'ajouter à `img-src` dans `src-tauri/tauri.conf.json`, sinon
  l'image apparaît cassée.
- **Piège** : si une balise `<style>` est un jour ajoutée à `index.html`, Tauri ajoute un nonce à
  `style-src`. Les navigateurs ignorent alors `'unsafe-inline'`, et les styles injectés par sonner
  et Radix (toasts, menus) sont bloqués. Parade : `"dangerousDisableAssetCspModification": ["style-src"]`
  dans `app.security`.

### S5 - Polling AllDebrid : à vérifier avec une vraie clé (suite du #9)

La clé de dev de `.env.local` est refusée par AllDebrid (`AUTH_BAD_APIKEY`) : deux points de l'API
n'ont pas pu être observés, et le code accepte les deux possibilités dans chaque cas.

- Forme de `data.magnets` quand on passe `id` : tableau selon la doc, objet seul dans l'ancienne API.
- Code HTTP d'un magnet supprimé (`MAGNET_INVALID_ID`) : 200 ou 4xx.

À vérifier : envoyer un torrent dans la bibliothèque, observer la progression, puis supprimer le
magnet sur le site AllDebrid. Les autres magnets suivis doivent continuer à se mettre à jour.

Limites connues : AllDebrid autorise 12 requêtes/s et 600/min. Au-delà de 10 magnets suivis,
`fetchMagnetStatuses` (`src/lib/services/allDebrid.ts`) repasse par la liste complète. Si le
volume devient un problème, le mode "live" de `magnet/status` (paramètres `session` et `counter`,
qui ne renvoie que les différences) est la solution prévue par AllDebrid
(https://docs.alldebrid.com/).

### S6 - Réécriture complète de `settings.json` à chaque sauvegarde (performance, non mesuré)

**Problème.** La bibliothèque (`library`, `src/lib/library.ts:45`) et la bibliothèque manga
(`manga_library`, `src/lib/mangaLibrary.ts:9`) sont stockées dans `settings.json`. Chaque `.save()`
(une centaine d'appels, plus de 30 instances `LazyStore` sur ce fichier) réécrit tout le fichier,
bibliothèques comprises, même pour un simple réglage.

**À mesurer d'abord** : taille de `settings.json`, dans
`~/Library/Application Support/com.sulyk.c411-debrid-app/` (macOS) ou
`%APPDATA%\com.sulyk.c411-debrid-app\` (Windows). Ne rien faire tant que le fichier reste petit
(moins de ~1 Mo).

**Correctif, si nécessaire.** Déplacer les deux bibliothèques dans leurs propres fichiers de store
(`library.json`, `manga-library.json`), avec une migration au démarrage : lire l'ancienne clé,
écrire dans le nouveau fichier, supprimer l'ancienne. **Piège** : ajouter les nouveaux fichiers à
`STORE_FILES` (`src-tauri/src/profile.rs:12`), sinon l'export et l'import de profil perdent la
bibliothèque.

---

## Hors périmètre sécurité et performance

- `src/components/PixelPool.tsx` fait 2263 lignes, bien au-delà de la règle "Code Structure" de
  `CLAUDE.md`.
