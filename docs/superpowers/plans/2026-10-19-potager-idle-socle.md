# Potager idle - Socle (sous-projet 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l'ancien Potager par le socle du nouveau : un village HD-2D façon Octopath rendu en three.js, visible dans la fenêtre Potager (caméra suivie / libre, carte qui défile) et en fond passif vivant de la fenêtre principale, avec une simulation qui fait foi et la sauvegarde `potager.json`.

**Architecture:** Nouveau dossier `src/potager/` découpé en `core/` (TS pur testé), `textures/` (générateurs pixel art canvas), `render/` (scène three.js impérative), `sim/` (hôte de simulation et passage de relais entre fenêtres), `storage/` et `ui/` (React). Une seule simulation tourne à la fois : celle de la fenêtre principale, sauf quand la fenêtre Potager est ouverte ; elle la "réclame" alors, la fenêtre principale sauvegarde, se met en pause et fige son fond, puis reprend à la fermeture. L'ancien `src/garden/` est supprimé.

**Tech Stack:** React 19, TypeScript, three.js 0.186, Tauri 2 (`WebviewWindow`, événements, tauri-plugin-store), Vitest (environnement `node`), Bun.

**Spec:** `docs/superpowers/specs/2026-10-19-potager-idle-vision-design.md` (sections 2.1, 2.2, 2.3, 2.4 pour la caméra, 2.5 pour le temps de jeu, 3.x). Référence visuelle et code source du rendu à porter : `docs/superpowers/mockups/potager-idle/prototype-hd2d.html` (validé par l'utilisateur, c'est le plancher de qualité) et `reference-octopath-0.webp`.

## Global Constraints

- Tout texte affiché est en français correctement accentué ; identifiants, clés et noms de fichiers en ASCII. `src/lib/accents.test.ts` doit passer.
- Pas de tirets cadratins ni de guillemets typographiques dans le code et les textes.
- Fini = `bunx tsc --noEmit`, `bun run lint`, `bun run test` verts, `cargo check` dans `src-tauri/` (Rust modifié), rendu vérifié dans l'aperçu navigateur (`bun run dev`, shim `devTauriShim`).
- `src/potager/` n'importe rien de `src/garden/` (supprimé) ni du code des canards (`PixelPool`, `duck*`, `src/game/*`).
- `core/` n'importe ni React ni three.js.
- three 0.186 : `PCFSoftShadowMap` est retiré, utiliser `PCFShadowMap`.
- Textures : 16 pixels par unité de monde (`PPU = 16`), `NearestFilter`, pas de mipmaps, `SRGBColorSpace`, générées par code (aucun fichier image).
- Caméra : perspective fov 24 (34 si ratio < 1,3), inclinaison 33°, distance 27, comme le prototype.
- Fond passif bridé à 30 images/s ; pause si focus perdu, onglet caché ou fond inactif ; figé (image floutée) quand la fenêtre Potager est ouverte.
- Temps de jeu : uniquement app ouverte, calculé depuis le temps réel écoulé (pas le nombre de ticks), un pas plafonné à 10 minutes, aucun rattrapage app fermée.
- Sauvegarde : `potager.json` (tauri-plugin-store), clé `save`, versionnée (`version: 1`).
- Label de fenêtre Tauri : `potager` ; paramètre d'URL `window=potager`.

## Review Focus

- La fenêtre Potager s'ouvre alors que la fenêtre principale ne répond pas à la réclamation : elle doit charger quand même après 2 s, sans bloquer (test en Task 4).
- Fermeture de la fenêtre principale pendant que le Potager est ouvert : Rust ferme le Potager, qui doit sauvegarder avant de disparaître (vérification manuelle en Task 8 : `tauri dev`).
- `potager.json` corrompu ou d'une version inconnue : copie de côté, partie neuve, toast, jamais d'écran vide (test en Task 3).
- Horloge système qui recule ou veille de plusieurs heures app ouverte : aucun temps négatif, aucun saut supérieur à 10 minutes par pas (test en Task 1).
- Import d'une sauvegarde pendant que le Potager est ouvert : refusé avec toast, sinon la fenêtre Potager écraserait l'import à sa fermeture (vérification en Task 8).

---

## File Structure

```
src/potager/
  core/
    types.ts            PotagerSave, CameraState, BuildingId, ParcelId, Rarity
    save.ts             createStarterSave, parseSave
    clock.ts            advancePlayTime, MAX_STEP_MS
    catalog/
      species.ts        copie de src/garden/core/catalog/species.ts
      colors.ts         copie de src/garden/core/catalog/colors.ts
      map.ts            MAP : disposition du village (données)
  storage/
    potagerStore.ts     loadPotager, savePotager (relecture, copie des corrompus)
  sim/
    channel.ts          canal de relais (événements Tauri ou BroadcastChannel)
    simHost.ts          createSimHost : tick, sauvegarde, relais entre fenêtres
    mainHost.ts         hôte unique de la fenêtre principale
  textures/
    pixel.ts            canvasTex, outlinePixels, rng
    terrain.ts          herbe, falaise, pierre, chemin, terre, eau
    nature.ts           arbres, buissons, touffes, feuilles
    buildings.ts        étal, cabane à graines
    avatar.ts           sprite de l'avatar (2 images)
  render/
    tod.ts              lightingAt(hour)
    cameraRig.ts        createCameraRig : suivi / libre, bornes
    post.ts             flou de bascule, bloom, vignette, étalonnage
    terrain.ts          terrasses, escaliers, chemins, eau, barrière
    village.ts          bâtiments, parcelles, décor, avatar
    particles.ts        poussières lumineuses, feuilles qui tombent
    createPotagerScene.ts  API de scène
    webgl.ts            hasWebgl
  ui/
    potagerWindow.ts    ouverture de la fenêtre, isPotagerWindow, onPotagerOpenChange
    backdropMode.ts     run / pause / frozen
    PotagerApp.tsx      fenêtre Potager
    PotagerHud.tsx      bandeau "Le Potager" + bascule de caméra
    useFreeCamera.ts    glisser, bords d'écran, flèches / ZQSD en mode libre
    PotagerBackdrop.tsx fond passif
    PotagerFrozen.tsx   message du fond figé
```

Modifiés : `src/main.tsx`, `src/App.tsx`, `src/components/AppMenu.tsx`, `src/components/GardenButton.tsx`, `src/components/settings/panels/BackdropPanel.tsx`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/garden.json` (renommé `potager.json`), `vite.config.ts` (couverture). Supprimé : `src/garden/`.

---

### Task 1: Modèle de sauvegarde, temps de jeu et catalogue

**Files:**

- Create: `src/potager/core/types.ts`, `src/potager/core/save.ts`, `src/potager/core/clock.ts`, `src/potager/core/catalog/species.ts`, `src/potager/core/catalog/colors.ts`
- Test: `src/potager/core/save.test.ts`, `src/potager/core/clock.test.ts`, `src/potager/core/catalog/catalog.test.ts`

**Interfaces:**

- Produces:
  - `type BuildingId = "etal" | "cabane" | "atelier" | "serre"`
  - `type ParcelId = string`
  - `type Rarity = "commune" | "rare" | "epique" | "legendaire"` (même valeurs que l'ancien `src/garden/core/types.ts`)
  - `type CameraMode = "follow" | "free"`
  - `interface CameraState { x: number; z: number; mode: CameraMode }` (x, z = point visé au sol)
  - `interface PotagerSave { version: 1; playTimeMs: number; camera: CameraState; buildings: BuildingId[]; parcels: ParcelId[] }`
  - `createStarterSave(): PotagerSave` : `playTimeMs: 0`, `buildings: ["etal", "cabane"]`, `parcels: ["p0"]`, `camera: { ...MAP.spawnView, mode: "follow" }` (MAP en Task 2 ; en attendant, `{ x: 0, z: -0.6 }` puis brancher sur MAP en Task 2)
  - `parseSave(raw: unknown): PotagerSave | null` : null si pas un objet, `version !== 1`, ou champ manquant / mal typé ; ignore les champs inconnus
  - `MAX_STEP_MS = 600_000`
  - `advancePlayTime(save: PotagerSave, elapsedMs: number): PotagerSave` : ajoute `clamp(elapsedMs, 0, MAX_STEP_MS)`, retourne un nouvel objet
  - Catalogue : `SPECIES`, `CATALOG_ENTRIES`, `COLORS` et leurs helpers, copiés tels quels (seul l'import de `Rarity` change de chemin)

- [ ] **Step 1: Écrire les tests qui échouent**

`save.test.ts` :

- `createStarterSave()` a `version 1`, `playTimeMs 0`, `buildings ["etal","cabane"]`, `parcels ["p0"]`, `camera.mode "follow"`.
- `parseSave(createStarterSave())` est égal (toEqual) à la sauvegarde.
- `parseSave(null)`, `parseSave("x")`, `parseSave({ ...starter, version: 2 })`, `parseSave({ ...starter, playTimeMs: "1" })`, `parseSave({ ...starter, buildings: ["chateau"] })`, `parseSave({ ...starter, camera: { x: 0, z: 0, mode: "orbite" } })` valent `null`.
- `parseSave({ ...starter, extra: 1 })` n'a pas de clé `extra`.

`clock.test.ts` :

- `advancePlayTime(s, 1000).playTimeMs === 1000`.
- `advancePlayTime(s, -5000).playTimeMs === 0` (horloge qui recule).
- `advancePlayTime(s, 3 * 3_600_000).playTimeMs === 600_000` (veille).
- la sauvegarde d'origine n'est pas modifiée.

`catalog.test.ts` (sans les assertions de sprites de l'ancien test) : 14 espèces, `CATALOG_ENTRIES.length === 65`, identifiants d'espèces uniques, chaque couleur d'espèce existe dans `COLORS`, 4 raretés représentées, la Lanterne-de-lune (`lanternelune`) n'a que des entrées `legendaire`.

- [ ] **Step 2: Lancer `bunx vitest run src/potager/core` : échec (modules absents)**

- [ ] **Step 3: Implémenter `types.ts`, `save.ts`, `clock.ts` ; copier `species.ts` et `colors.ts` depuis `src/garden/core/catalog/` en changeant l'import de `Rarity` vers `../types`**

- [ ] **Step 4: Lancer `bunx vitest run src/potager/core` : vert**

- [ ] **Step 5: Commit** `feat(potager): modèle de sauvegarde, temps de jeu et catalogue`

---

### Task 2: Disposition du village (données)

**Files:**

- Create: `src/potager/core/catalog/map.ts`
- Modify: `src/potager/core/save.ts` (vue de départ depuis `MAP.spawnView`)
- Test: `src/potager/core/catalog/map.test.ts`

**Interfaces:**

- Produces:
  - `interface Rect { x0: number; x1: number; z0: number; z1: number }`
  - `interface Terrace { rect: Rect; top: number; bottom: number }` (bloc de terrain plein, `top` = hauteur du sol)
  - `interface Stair { x0: number; x1: number; zFoot: number; from: number; to: number; steps: number }`
  - `interface PathStrip { rect: Rect; y: number }`
  - `interface BuildingSlot { id: BuildingId; x: number; z: number; y: number; w: number; d: number }`
  - `interface ParcelSlot { id: ParcelId; rect: Rect; y: number }`
  - `const MAP: { bounds: Rect; terraces: Terrace[]; stairs: Stair[]; paths: PathStrip[]; water: { y: number; zFrom: number }; buildings: BuildingSlot[]; parcels: ParcelSlot[]; spawn: { x: number; z: number }; spawnView: { x: number; z: number }; trees: { x: number; z: number; y: number; palette: number; size: number }[] }`
  - `groundHeight(x: number, z: number): number` : `top` de la terrasse la plus haute contenant le point, sinon `MAP.water.y`

Disposition _(à affiner à l'œil dans l'aperçu, en gardant ces relations)_ : on étend le prototype vers la gauche et la droite. `bounds` x -24..24, z -14..8. Terrasse du milieu (sol y 0) z -4..4,6 ; plateau (y 2,2) z -24..-4 ; rive basse (y -3) z 4,6..8,5 ; eau y -3,4 au-delà. Escalier de pierre de 5 marches du milieu au plateau vers x -11..-9,4. Parcelles : `p0` = parcelle du prototype (x 0,6..7,4, z -1,9..1,7, y 0), `p1` à sa droite (x 9..15,8), `p2` à gauche de l'étal (x -20..-14), `p3` sur le plateau (x 2..9, z -10..-6,5, y 2,2). Bâtiments : `etal` à l'emplacement de la boutique du prototype (x -5,3, z -2,7, w 3,6, d 2,6), `cabane` vers x -12, z -2,7 (plus petite, w 2,6, d 2,2), `atelier` sur le plateau vers x -6, z -8, `serre` sur le plateau vers x 14, z -9. `spawn` x -2, z 1,2. `spawnView` x 0, z -0,6.

- [ ] **Step 1: Écrire les tests qui échouent** (`map.test.ts`)
- chaque parcelle et chaque bâtiment est dans `bounds` ;
- parcelles et bâtiments ne se chevauchent pas deux à deux (rectangles des bâtiments = centre +/- w/2, d/2) ;
- `groundHeight` au centre de chaque parcelle vaut son `y`, idem pour chaque bâtiment ;
- `groundHeight(MAP.spawn.x, MAP.spawn.z) === 0` ;
- identifiants de parcelles uniques, les 4 `BuildingId` présents une fois ;
- `createStarterSave().camera` vaut `{ ...MAP.spawnView, mode: "follow" }`.

- [ ] **Step 2: `bunx vitest run src/potager/core/catalog/map.test.ts` : échec**
- [ ] **Step 3: Écrire `map.ts` et brancher `createStarterSave` sur `MAP.spawnView`**
- [ ] **Step 4: `bunx vitest run src/potager/core` : vert**
- [ ] **Step 5: Commit** `feat(potager): disposition du village`

---

### Task 3: Stockage `potager.json`

**Files:**

- Create: `src/potager/storage/potagerStore.ts`
- Test: `src/potager/storage/potagerStore.test.ts` (reprendre le mock `LazyStore` en mémoire de `src/garden/storage/gardenStore.test.ts`)

**Interfaces:**

- Consumes: `createStarterSave`, `parseSave` (Task 1)
- Produces:
  - `loadPotager(): Promise<{ save: PotagerSave; recovered: boolean }>` : `store.reload()` puis lecture de la clé `save` ; absente = sauvegarde de départ écrite ; illisible = copie brute dans `potager.corrupt-<AAAAMMJJ-HHMMSS>.json`, sauvegarde de départ écrite, `recovered: true`
  - `savePotager(save: PotagerSave): Promise<void>` : `set` + `save` sur `potager.json`
  - `interface SaveStore { load(): Promise<{ save: PotagerSave; recovered: boolean }>; write(save: PotagerSave): Promise<void> }` et `const potagerStore: SaveStore` (pour l'injection dans l'hôte)

- [ ] **Step 1: Tests qui échouent** : fichier vide -> départ + écrit ; aller-retour `savePotager` puis `loadPotager` ; `{ version: 9 }` -> `recovered: true`, un store `potager.corrupt-*` contient la donnée brute, `potager.json` contient la sauvegarde de départ.
- [ ] **Step 2: `bunx vitest run src/potager/storage` : échec**
- [ ] **Step 3: Implémenter** (même forme que `src/garden/storage/gardenStore.ts`, sans `createSaveScheduler` : l'hôte gère le rythme d'écriture)
- [ ] **Step 4: `bunx vitest run src/potager/storage` : vert**
- [ ] **Step 5: Commit** `feat(potager): stockage potager.json`

---

### Task 4: Hôte de simulation et relais entre fenêtres

**Files:**

- Create: `src/potager/sim/channel.ts`, `src/potager/sim/simHost.ts`, `src/potager/sim/mainHost.ts`
- Test: `src/potager/sim/simHost.test.ts`

**Interfaces:**

- Consumes: `SaveStore` (Task 3), `advancePlayTime` (Task 1)
- Produces:
  - `type HostRole = "main" | "potager"`
  - `type HandoffMsg = { type: "claim" | "released" | "closed"; from: HostRole }`
  - `interface Channel { post(msg: HandoffMsg): void; on(cb: (msg: HandoffMsg) => void): () => void }`
  - `createChannel(): Channel` : événement Tauri `potager:handoff` (`emit` / `listen`) ; en aperçu navigateur (`isBrowserPreview`), `BroadcastChannel("potager")`. Les messages dont `from` est le rôle local sont ignorés par l'hôte (un `emit` Tauri revient aussi à l'émetteur).
  - `interface SimHost { start(): Promise<void>; stop(): Promise<void>; state(): PotagerSave | null; subscribe(cb: (s: PotagerSave) => void): () => void; update(fn: (s: PotagerSave) => PotagerSave): void; replace(save: PotagerSave): Promise<void>; readonly running: boolean; readonly recovered: boolean }`
  - `createSimHost(opts: { role: HostRole; store: SaveStore; channel: Channel; now?: () => number; tickMs?: number; saveEveryMs?: number; claimTimeoutMs?: number }): SimHost` ; défauts `now = Date.now`, `tickMs = 1000`, `saveEveryMs = 10_000`, `claimTimeoutMs = 2000`
  - `getMainHost(): SimHost` : singleton de la fenêtre principale (`role: "main"`, `potagerStore`, `createChannel()`), démarré au premier appel

Comportement :

- tick : `advancePlayTime(state, now() - lastTick)`, notifie les abonnés, écrit si la dernière écriture date de plus de `saveEveryMs` ;
- `update(fn)` : applique, notifie, écriture différée à la prochaine échéance ;
- `stop()` : arrête le tick, écrit immédiatement l'état, **sauf si l'hôte `main` est en pause** (Potager ouvert : son état est périmé, c'est le Potager qui écrit en dernier) ;
- rôle `main` : `start` charge et tourne ; sur `claim` venant de `potager` : pause, écriture immédiate, `post({ type: "released", from: "main" })` ; sur `closed` venant de `potager` : recharge depuis le store, reprend (le temps passé en pause n'est pas compté : `lastTick = now()` à la reprise) ;
- rôle `potager` : `start` poste `claim`, attend `released` ou `claimTimeoutMs`, puis charge et tourne ; `stop` écrit puis poste `closed` ;
- `replace(save)` : remplace l'état, écrit immédiatement, notifie (sert à l'import).

- [ ] **Step 1: Tests qui échouent** (`vi.useFakeTimers()`, `now` piloté par le test, store en mémoire, canal en mémoire qui relie deux hôtes) :
- `main` seul : après 3 ticks de 1000 ms, `state().playTimeMs === 3000` ;
- écriture au plus toutes les 10 s : 5 ticks -> 0 écriture, 11 ticks -> 1 écriture ;
- relais : `potager.start()` -> `main` reçoit `claim`, écrit, poste `released`, `main.running === false` ; `potager` charge l'état écrit par `main` (même `playTimeMs`) ;
- pas de temps compté pendant la pause : `now` avance de 60 000 pendant que `potager` tourne 0 tick, puis `potager.stop()` -> `main` recharge et `playTimeMs` est celui écrit par `potager` ;
- `potager.start()` sans hôte `main` sur le canal : charge après 2000 ms ;
- un message `claim` avec `from: "main"` est ignoré par l'hôte `main` ;
- `replace(x)` : `state()` égal à `x` et une écriture immédiate.
- `main.stop()` pendant que `potager` tourne n'écrit rien ; `potager.stop()` ensuite écrit son état (dernier écrivain).
- [ ] **Step 2: `bunx vitest run src/potager/sim` : échec**
- [ ] **Step 3: Implémenter `channel.ts`, `simHost.ts`, `mainHost.ts`**
- [ ] **Step 4: `bunx vitest run src/potager/sim` : vert**
- [ ] **Step 5: Commit** `feat(potager): hôte de simulation et relais entre fenêtres`

---

### Task 5: Textures pixel art

**Files:**

- Create: `src/potager/textures/pixel.ts`, `terrain.ts`, `nature.ts`, `buildings.ts`, `avatar.ts`
- Test: `src/potager/textures/pixel.test.ts`

**Interfaces:**

- Produces:
  - `PPU = 16`
  - `createRng(seed: number): () => number` (Park-Miller du prototype : `seed = seed * 16807 % 2147483647`)
  - `outlinePixels(data: Uint8ClampedArray, w: number, h: number, dark?: [number, number, number]): Uint8ClampedArray` : version pure du `outline` du prototype (pixel transparent voisin d'un opaque -> teinte sombre de ce voisin, opaque)
  - `canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, rng: () => number) => void, opts?: { repeat?: boolean; seed?: number }): THREE.CanvasTexture`
  - `terrain.ts` : `grassTop(w, h)`, `cliffFace(w, h)`, `stoneTex(w, h)`, `pathTex(w, h, palette?, edge?)`, `soilTex(w, h)`, `shimmerTex()` (tailles en pixels)
  - `nature.ts` : `treeTex(palette: number)` (48x64), `bushTex(palette: number)` (32x20), `tuftTex(dry: boolean)` (8x8), `leafTex(i: number)` (4x3), `glowTex()` (32x32, filtrage linéaire), `TREE_PALETTES` (les 4 palettes du prototype)
  - `buildings.ts` : `etalTextures(): { front; side; roof }`, `cabaneTextures(): { front; side; roof }`, `signTex(text: string)`
  - `avatar.ts` : `avatarFrames(): [THREE.CanvasTexture, THREE.CanvasTexture]` (16x24, matrice `BODY` + `LEGS_A` / `LEGS_B` et palette `PAL` du prototype)

Port direct des fonctions du prototype du même nom, avec deux changements : le hasard vient du `rng` passé (graine fixe par texture, pour un village identique à chaque lancement) et le contour passe par `outlinePixels`. La cabane à graines a sa propre façade : murs de planches, toit de chaume ou de bardeaux, sachets de graines en vitrine, enseigne "Graines" _(dessin libre, au niveau de l'étal)_. L'enseigne de l'étal : "Fleurs".

- [ ] **Step 1: Tests qui échouent** (`pixel.test.ts`, sans canvas) : `createRng(1)` produit la même suite deux fois et des valeurs dans [0, 1[ ; `outlinePixels` sur une image 3x3 avec un seul pixel opaque central rend opaques ses 4 voisins orthogonaux et laisse transparents les 4 coins ; un pixel déjà opaque n'est jamais modifié.
- [ ] **Step 2: `bunx vitest run src/potager/textures` : échec**
- [ ] **Step 3: Implémenter `pixel.ts`, puis porter les générateurs**
- [ ] **Step 4: `bunx vitest run src/potager/textures` et `bunx tsc --noEmit` : verts**
- [ ] **Step 5: Commit** `feat(potager): générateurs de textures pixel art`

---

### Task 6: Lumière horaire et caméra

**Files:**

- Create: `src/potager/render/tod.ts`, `src/potager/render/cameraRig.ts`
- Test: `src/potager/render/tod.test.ts`, `src/potager/render/cameraRig.test.ts`

**Interfaces:**

- Produces:
  - `type DayPhase = "matin" | "jour" | "soir" | "nuit"`
  - `interface Lighting { phase: DayPhase; sun: string; sunIntensity: number; sky: string; ground: string; hemi: number; fog: string; lanterns: boolean }`
  - `lightingAt(hour: number): Lighting` : matin [6, 10[, jour [10, 17[, soir [17, 20[, nuit sinon. Valeurs : matin sun `#ffe6c8` 1,8, hemi 1,0, fog `#d8d0c0` ; jour `#fff2dc` 2,6, hemi 1,2, fog `#d0c8a8` ; soir `#ffd8a0` 2,6, hemi 1,1, fog `#c9b892` (valeurs du prototype) ; nuit `#8aa0d8` 0,6, hemi 0,45, fog `#2a3048`, `lanterns: true` (seulement la nuit) ; sky / ground : `#b8c8e8` / `#5a4430` sauf nuit `#4a5a88` / `#1a1420`.
  - `TILT_DEG = 33`, `DISTANCE = 27`, `FOV = 24`, `FOV_NARROW = 34`
  - `interface CameraRig { target(): { x: number; z: number }; mode(): CameraMode; setMode(m: CameraMode): void; follow(p: { x: number; z: number }): void; pan(dx: number, dz: number): void; update(dt: number): void; pose(): { position: [number, number, number]; look: [number, number, number] } }`
  - `createCameraRig(init: CameraState, bounds: Rect, groundAt: (x: number, z: number) => number): CameraRig`
- Comportement : `pan` n'agit qu'en mode `free` et borne la cible à `bounds` réduit de 6 unités en x et 4 en z (on ne voit jamais le vide au-delà de la carte) ; en `follow`, `update(dt)` rapproche la cible du point suivi (lissage exponentiel, demi-vie 0,15 s) et `pan` est ignoré ; `pose()` : `look = [x, groundAt(x, z) + 0.4, z]`, position = look + (0, sin 33° x 27, cos 33° x 27).

- [ ] **Step 1: Tests qui échouent**
  - `lightingAt(5.99).phase === "nuit"`, `lightingAt(6).phase === "matin"`, `lightingAt(10)` jour, `lightingAt(17)` soir, `lightingAt(20)` nuit ; `lanterns` vrai seulement la nuit.
  - rig `free` : `pan(1000, 0)` borne `target().x` à `bounds.x1 - 6` ; `pan(0, -1000)` borne z à `bounds.z0 + 4`.
  - rig `follow` : `pan` ne bouge rien ; `follow({ x: 10, z: 0 })` puis `update(5)` amène la cible à moins de 0,01 de x = 10.
  - `pose()` : `position[1] - look[1]` vaut `27 * sin(33°)` à 1e-6 près.
- [ ] **Step 2: `bunx vitest run src/potager/render` : échec**
- [ ] **Step 3: Implémenter**
- [ ] **Step 4: `bunx vitest run src/potager/render` : vert**
- [ ] **Step 5: Commit** `feat(potager): lumière horaire et caméra`

---

### Task 7: Scène HD-2D

**Files:**

- Create: `src/potager/render/post.ts`, `terrain.ts`, `village.ts`, `particles.ts`, `createPotagerScene.ts`, `webgl.ts`

**Interfaces:**

- Consumes: `MAP`, `groundHeight` (Task 2), textures (Task 5), `lightingAt`, `createCameraRig` (Task 6)
- Produces:
  - `type SceneMode = "potager" | "backdrop"`
  - `interface PotagerScene { sync(save: PotagerSave): void; rig: CameraRig; setAvatar(p: { x: number; z: number }): void; start(): void; stop(): void; renderOnce(): void; resize(): void; dispose(): void }`
  - `createPotagerScene(canvas: HTMLCanvasElement, mode: SceneMode, init: PotagerSave): PotagerScene`
  - `hasWebgl(): boolean` (copie de `src/garden/render/webgl.ts`)
  - `post.ts` : `createPost(renderer: THREE.WebGLRenderer): { render(scene: THREE.Scene, camera: THREE.Camera): void; setSize(w: number, h: number): void; dispose(): void }` : chaîne du prototype (cible principale HalfFloat MSAA 4, flou séparable sur 1/4 de résolution, passe finale : flou de bascule `smoothstep(0.1, 0.42, abs(uv.y - 0.44))`, bloom au-dessus de 0,5, étalonnage chaud, vignette, `colorspace_fragment`)

Contenu (porté du prototype, piloté par `MAP`) :

- `terrain.ts` : blocs des terrasses (textures herbe dessus, falaise sur les côtés), escalier de pierre, bandes de chemin en décalques, eau + reflets animés, barrière en bord de plateau.
- `village.ts` : bâtiments présents dans `save.buildings` (étal et cabane ; atelier et serre ne sont pas dessinés dans ce sous-projet), parcelles possédées (bloc de terre labourée + bordure de planches) et non possédées (décalque fantôme semi-transparent, sans panneau de prix), arbres de `MAP.trees`, buissons et touffes semées par `createRng` en évitant parcelles, bâtiments et chemins, lanterne de l'étal (lumière ponctuelle + halo, intensité selon `lightingAt().lanterns`), avatar debout au `spawn` (sprite image 0).
- `particles.ts` : poussières lumineuses et feuilles qui tombent (porter le prototype).
- `createPotagerScene` : `sync` reconstruit ce qui dépend de `save.buildings` / `save.parcels` seulement si ces listes ont changé ; lumière réévaluée chaque minute avec l'heure locale ; boucle `requestAnimationFrame` limitée à 30 images/s en mode `backdrop` (60 sinon) ; carte d'ombres 4096 en `potager`, 2048 en `backdrop` ; pixel ratio max 1,5 ; fov selon le ratio (Global Constraints).

- [ ] **Step 1: Implémenter les modules ci-dessus**
- [ ] **Step 2: `bunx tsc --noEmit` et `bun run lint` : verts**
- [ ] **Step 3: Vérifier le rendu** dans l'aperçu une fois la Task 8 branchée (cette tâche n'a pas d'écran propre) ; ici, seulement compilation et lint.
- [ ] **Step 4: Commit** `feat(potager): scène HD-2D du village`

---

### Task 8: Fenêtres, fond passif et remplacement de l'ancien Potager

**Files:**

- Create: `src/potager/ui/potagerWindow.ts`, `backdropMode.ts` (copie de `src/garden/ui/backdropMode.ts`, avec son test), `PotagerApp.tsx`, `PotagerHud.tsx`, `useFreeCamera.ts`, `PotagerBackdrop.tsx`, `PotagerFrozen.tsx`
- Modify: `src/main.tsx`, `src/App.tsx:66-67,423`, `src/components/AppMenu.tsx:35,162`, `src/components/GardenButton.tsx:3`, `src/components/settings/panels/BackdropPanel.tsx`, `src-tauri/src/lib.rs:581-590`, `vite.config.ts` (couverture `src/potager/core/**`)
- Rename: `src-tauri/capabilities/garden.json` -> `potager.json` (`identifier` et `windows` = `potager`, mêmes permissions)
- Delete: `src/garden/`
- Test: `src/potager/ui/backdropMode.test.ts` (copié)

**Interfaces:**

- Consumes: `getMainHost`, `createSimHost`, `createChannel`, `potagerStore` (Task 4), `createPotagerScene`, `hasWebgl` (Task 7)
- Produces:
  - `potagerWindow.ts` : `POTAGER_LABEL = "potager"`, `isPotagerWindow()`, `openPotagerWindow()`, `onPotagerOpenChange(cb)` ; même logique que `src/garden/ui/gardenWindow.ts` (titre "Potager", 1280x800, min 960x600, `dragDropEnabled: false`, onglet en aperçu), mais l'état ouvert / fermé se déduit des messages du canal (`claim` = ouvert, `closed` = fermé) plus `WebviewWindow.getByLabel` au montage ; les anciens événements `garden:opened` / `garden:closed` disparaissent.

Comportement :

- `PotagerApp` : crée un hôte `role: "potager"`, l'attend (`start`), crée la scène `potager` avec `state()`. Abonnement : `scene.sync(save)`. La caméra part de `save.camera` ; à chaque changement de mode ou toutes les 2 s si la cible a bougé, `host.update(s => ({ ...s, camera: { x, z, mode } }))`. Fermeture : `getCurrentWindow().onCloseRequested` -> `host.stop()` ; en aperçu, `pagehide` -> `host.stop()`. Toast si `host.recovered` ("Sauvegarde du Potager illisible : une nouvelle partie a commencé.").
- `PotagerHud` : bandeau "Le Potager" façon Octopath du prototype (police Cormorant Garamond chargée par Google Fonts dans la fenêtre Potager) et un bouton de bascule de caméra "Suivre" / "Libre" (icône lucide, `aria-label` français).
- `useFreeCamera(rig, enabled)` : en mode `free`, glisser à la souris (bouton gauche) déplace la cible au sol, curseur à moins de 24 px d'un bord fait défiler à 8 unités/s, flèches et ZQSD aussi (8 unités/s). En mode `follow`, la caméra suit l'avatar (immobile au `spawn` dans ce sous-projet).
- `PotagerBackdrop` : remplace `GardenBackdrop` dans `App.tsx` (mêmes props `active`, `onWebglError`, même chargement différé). Lit `getMainHost()`, crée la scène `backdrop` avec la caméra de la sauvegarde (cible fixe, pas de contrôle), `sync` à chaque notification. Modes via `backdropMode` : `run` / `pause` / `frozen` (rendu figé flouté + `PotagerFrozen` : "Ton village est ouvert dans la fenêtre Potager" / "Il reprendra vie à sa fermeture."). À la reprise après `closed`, la caméra du fond reprend `save.camera` (dernière vue du Potager).
- `main.tsx` : `isPotagerWindow()` -> `PotagerApp`. Fenêtre principale : `getMainHost()` est appelé au démarrage de l'app, quel que soit le fond choisi (le temps de jeu avance app ouverte, spec 2.5), et `host.stop()` sur `getCurrentWindow().onCloseRequested` (aperçu : `pagehide`).
- `BackdropPanel` : export = `getMainHost().state()` ; import = `parseSave` puis `getMainHost().replace(save)`, refusé si le Potager est ouvert (message inchangé), toast "Potager importé".
- `lib.rs` : `get_webview_window("potager")` à la place de `"garden"`.

- [ ] **Step 1: Copier `backdropMode.ts` et son test, `bunx vitest run src/potager/ui` : vert**
- [ ] **Step 2: Implémenter `potagerWindow.ts`, `PotagerApp`, `PotagerHud`, `useFreeCamera`, `PotagerBackdrop`, `PotagerFrozen`**
- [ ] **Step 3: Rebrancher `main.tsx`, `App.tsx`, `AppMenu.tsx`, `GardenButton.tsx`, `BackdropPanel.tsx`, `lib.rs`, la capability et `vite.config.ts` ; supprimer `src/garden/`**
- [ ] **Step 4: Vérifications automatiques** : `bunx tsc --noEmit`, `bun run lint`, `bun run test`, `cd src-tauri && cargo check`, tous verts ; `grep -rn "src/garden\|@/garden\|garden/" src` ne trouve plus rien.
- [ ] **Step 5: Vérifier dans l'aperçu navigateur** (`bun run dev`, `.env.local`) :
  - fond passif : village HD-2D au niveau du prototype (terrasses, falaises, étal "Fleurs", cabane "Graines", parcelle `p0`, parcelles fantômes, arbres, poussières, flou haut / bas) ; pas d'erreur console ;
  - `localStorage["devstore:potager.json"]` : `playTimeMs` augmente (relire après plus de 10 s) ;
  - ouvrir le Potager (bouton "Potager") : le fond se fige avec le message ; dans le Potager, bascule "Libre", défilement par glisser, bords et ZQSD, bornes respectées ; "Suivre" recentre sur l'avatar ;
  - fermer l'onglet Potager : le fond reprend vie, cadré sur la dernière vue du Potager ;
  - mettre une valeur invalide dans `devstore:potager.json`, recharger : nouvelle partie + toast ;
  - import pendant que le Potager est ouvert : refusé.
- [ ] **Step 6: Vérifier dans `bun run tauri dev`** : ouverture / fermeture de la fenêtre Potager, fermeture de la fenêtre principale avec le Potager ouvert (le Potager se ferme, la sauvegarde contient sa dernière caméra au relancement).
- [ ] **Step 7: Commit** `feat(potager): fenêtres, fond passif vivant et retrait de l'ancien Potager`
