# Potager idle - Déplacement de l'avatar (sous-projet 2, partie 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'avatar du Potager se déplace au clavier (ZQSD / flèches) et à la souris (clic sur le sol = y aller), avec collisions, escalier, animation de marche et position sauvegardée.

**Architecture:** Toute la logique de déplacement est en TS pur dans `src/potager/core/` (zones praticables, recherche de chemin sur grille, mouvement pas à pas), testée sans three.js. La scène three.js possède une instance de mouvement, l'avance à chaque image, anime le sprite et expose un `pick()` (lancer de rayon écran vers sol). Un hook React branche clavier et clic sur cette API. Le reste de l'étape 2 (semer, arroser, cueillir, touche d'action) fera l'objet d'un plan suivant.

**Tech Stack:** React 19, TypeScript, three.js 0.186, Vitest (environnement `node`), Bun.

**Spec:** `docs/superpowers/specs/2026-10-19-potager-idle-vision-design.md` (section 2.4). Socle déjà livré : `docs/superpowers/plans/2026-10-19-potager-idle-socle.md`.

## Global Constraints

- Tout texte affiché est en français correctement accentué ; identifiants, clés et noms de fichiers en ASCII. `src/lib/accents.test.ts` doit passer.
- Pas de tirets cadratins ni de guillemets typographiques.
- Fini = `bunx tsc --noEmit`, `bun run lint`, `bun run test` verts, rendu et contrôles vérifiés dans l'aperçu navigateur (`bun run dev`, `http://localhost:1420/?window=potager`).
- `core/` n'importe ni React ni three.js.
- Touches lues par `e.code` (positions physiques) : `KeyW`/`KeyA`/`KeyS`/`KeyD` = ZQSD sur AZERTY, plus `ArrowUp/Down/Left/Right`. Haut = `-z` (vers le fond de l'écran).
- Sauvegarde toujours `version: 1` : le nouveau champ `avatar` est facultatif à la lecture (défaut `MAP.spawn`), une ancienne sauvegarde ne doit jamais être traitée comme corrompue.

## Décisions (choix du rédacteur, la spec ne tranche pas)

- Vitesse de marche `AVATAR_SPEED = 4.5` unités/s ; la diagonale n'est pas plus rapide.
- Zones praticables : terrasse du milieu, plateau (atteint uniquement par l'escalier), escalier. Les parcelles se traversent. Bloqués : bâtiments possédés, tonneaux de l'étal, troncs d'arbres, bords de falaise, barrière.
- Grille de recherche de chemin : cellules de 0,5, 8 voisins sans couper les coins, puis lissage en ligne droite.
- Clic sur une zone non praticable (eau, falaise, bâtiment) : l'avatar va au point praticable le plus proche dans un rayon de 1,5 ; sinon rien.
- Le clavier bascule la caméra en mode suivi (en libre, l'avatar sortirait de l'écran) ; le clic garde le mode courant (on clique là où l'on regarde). Les flèches et ZQSD ne font plus défiler la caméra libre : glisser et bords d'écran restent.
- En caméra libre, un appui suivi d'un relâchement à moins de 5 px est un clic (déplacement de l'avatar), au-delà c'est un glisser (défilement).
- Position de l'avatar sauvegardée avec la caméra (toutes les 2 s si elle a bougé, et à la fermeture). Le fond passif de la fenêtre principale affiche l'avatar à sa position sauvegardée.

## Review Focus

- La fenêtre perd le focus touche enfoncée (Cmd+Tab) : l'avatar doit s'arrêter, pas marcher indéfiniment (test en Task 3, branchement vérifié en Task 5).
- Touches opposées tenues ensemble (Z + S) ou diagonale : pas de mouvement / vitesse identique, jamais de `NaN` (test en Task 3).
- Ancienne sauvegarde sans `avatar` : chargée normalement, avatar au point de départ, pas de "sauvegarde illisible" (test en Task 1).
- Position sauvegardée devenue non praticable (bâtiment acheté dessus, carte modifiée) : l'avatar réapparaît au plus proche praticable, jamais coincé dans un mur (test en Task 2).
- Clic sur le plateau depuis la terrasse du milieu : le chemin passe par l'escalier au lieu de traverser la falaise ; clic sur l'eau : rien ne fige (tests en Task 2).

---

## File Structure

```
src/potager/core/
  types.ts           + Point, PotagerSave.avatar
  save.ts            avatar dans createStarterSave / parseSave
  catalog/map.ts     + MAP.barrels, hauteur de l'escalier dans groundHeight
  walk.ts            isWalkable, nearestWalkable (nouveau)
  path.ts            findPath (nouveau)
  avatarMotion.ts    createAvatarMotion (nouveau)
src/potager/render/
  village.ts         tonneaux lus depuis MAP.barrels ; buildAvatar inchangé
  createPotagerScene.ts  mouvement, animation, pick ; setAvatar supprimé
src/potager/ui/
  useAvatarControls.ts  clavier + clic (nouveau)
  useFreeCamera.ts      retrait des touches
  PotagerApp.tsx        branchement, sauvegarde de l'avatar
```

---

### Task 1: Position de l'avatar dans la sauvegarde, escalier et tonneaux dans la carte

**Files:**

- Modify: `src/potager/core/types.ts`, `src/potager/core/save.ts`, `src/potager/core/catalog/map.ts`, `src/potager/render/village.ts:236-260` (tonneaux)
- Test: `src/potager/core/save.test.ts`, `src/potager/core/catalog/map.test.ts`

**Interfaces:**

- Produces:
  - `interface Point { x: number; z: number }` (dans `types.ts`)
  - `PotagerSave.avatar: Point`
  - `createStarterSave().avatar` = `{ ...MAP.spawn }`
  - `parseSave` : `avatar` absent ou mal typé => `{ ...MAP.spawn }` (le reste de la validation est inchangé)
  - `MAP.barrels: Point[]` = les deux positions absolues actuelles (`etal.x - 2.5, etal.z + 1.1` et `etal.x - 3.1, etal.z + 1.8`, soit `{ x: -7.8, z: -1.6 }` et `{ x: -8.4, z: -0.9 }`)
  - `groundHeight(x, z)` : dans l'emprise d'un escalier (`s.x0 <= x <= s.x1`, `-4 <= z <= s.zFoot`), interpolation linéaire de `s.from` (à `zFoot`) à `s.to` (à `z = -4`) ; ailleurs inchangé

- [ ] **Step 1: Écrire les tests qui échouent**

`save.test.ts` :

- `createStarterSave().avatar` vaut `MAP.spawn`.
- `parseSave({ ...starter, avatar: { x: 3, z: 1 } }).avatar` vaut `{ x: 3, z: 1 }`.
- `const { avatar, ...old } = starter; parseSave(old)` n'est pas `null` et son `avatar` vaut `MAP.spawn`.
- `parseSave({ ...starter, avatar: { x: "a", z: 0 } }).avatar` vaut `MAP.spawn`.

`map.test.ts` :

- `groundHeight(-10.2, -1.5)` vaut `0`, `groundHeight(-10.2, -4)` vaut `2.2`, `groundHeight(-10.2, -2.75)` est proche de `1.1`.
- `groundHeight(0, 0)` vaut `0` et `groundHeight(0, -8)` vaut `2.2` (inchangés).

- [ ] **Step 2: Lancer les tests, constater l'échec**

Run: `bun run test src/potager/core`
Expected: FAIL (`avatar` indéfini, hauteur d'escalier à 0).

- [ ] **Step 3: Implémenter `Point`, `avatar`, `MAP.barrels`, la hauteur d'escalier ; `village.ts` lit les tonneaux dans `MAP.barrels` (hauteur `0.42` inchangée)**

- [ ] **Step 4: Relancer les tests**

Run: `bun run test src/potager && bunx tsc --noEmit`
Expected: PASS (corriger les fixtures de `simHost.test.ts` / `potagerStore.test.ts` si `tsc` réclame `avatar`).

- [ ] **Step 5: Commit**

```bash
git add src/potager
git commit -m "feat(potager): position de l'avatar dans la sauvegarde, hauteur de l'escalier"
```

---

### Task 2: Zones praticables et recherche de chemin

**Files:**

- Create: `src/potager/core/walk.ts`, `src/potager/core/path.ts`
- Test: `src/potager/core/walk.test.ts`, `src/potager/core/path.test.ts`

**Interfaces:**

- Consumes: `Point`, `MAP` (Task 1), `BuildingId`.
- Produces:
  - `type Walkable = (x: number, z: number) => boolean`
  - `isWalkable(x: number, z: number, buildings: readonly BuildingId[]): boolean` ; vrai si l'un des cas suivants et aucun obstacle :
    - terrasse du milieu : `MAP.bounds.x0 + 0.5 <= x <= MAP.bounds.x1 - 0.5` et `-3.6 <= z <= 4.2`
    - plateau : même x, `MAP.bounds.z0 + 0.5 <= z <= -4.7`
    - escalier : `s.x0 + 0.2 <= x <= s.x1 - 0.2` et `-4.7 <= z <= s.zFoot + 0.3`
    - obstacles : emprise d'un bâtiment de `buildings` agrandie de 0,3 ; disque de rayon 0,45 autour de chaque `MAP.barrels` ; disque de rayon 0,5 autour de chaque `MAP.trees` (tronc)
  - `nearestWalkable(p: Point, walkable: Walkable, maxDist = 1.5): Point | null` : balaye des anneaux de pas 0,25 autour de `p`, renvoie le premier point praticable, `p` lui-même s'il l'est.
  - `findPath(from: Point, to: Point, walkable: Walkable): Point[] | null` : A* sur une grille de pas `0.5` couvrant `MAP.bounds`, 8 voisins, diagonale refusée si l'un des deux voisins orthogonaux est bloqué. Cible non praticable => `nearestWalkable(to)`. Renvoie les points de passage sans `from`, le dernier étant la cible exacte ; `[]` si `from` et la cible sont dans la même cellule ; `null` si cible introuvable ou injoignable. Lissage : retirer un point intermédiaire tant que le segment entre ses voisins est praticable (échantillonné tous les 0,25).

- [ ] **Step 1: Écrire les tests qui échouent**

`walk.test.ts` (avec `const b = ["etal", "cabane"] as const`) :

- `isWalkable(MAP.spawn.x, MAP.spawn.z, b)` vrai.
- centre de l'étal `(-5.3, -2.7)` faux avec `b`, vrai avec `[]`.
- `(0, 6)` (berge basse) faux, `(0, -4.3)` (barrière) faux, `(0, -8)` (plateau) vrai, `(-10.2, -3)` (escalier) vrai.
- `(-7.8, -1.6)` (tonneau) faux.
- `nearestWalkable({ x: 0, z: 5 }, w)` non nul avec `z <= 4.2` ; `nearestWalkable({ x: 0, z: 30 }, w)` vaut `null`.
- `nearestWalkable({ x: -5.3, z: -2.7 }, w)` (position dans l'étal) renvoie un point praticable.

`path.test.ts` (avec `const w: Walkable = (x, z) => isWalkable(x, z, ["etal", "cabane"])`) :

- `findPath(MAP.spawn, { x: 5, z: 0 }, w)` : non nul, dernier point `{ x: 5, z: 0 }`, chaque segment (depuis `MAP.spawn`) praticable tous les 0,25.
- `findPath(MAP.spawn, { x: 0, z: -8 }, w)` : non nul, passe par un point avec `-11 <= x <= -9.4` (escalier).
- `findPath(MAP.spawn, { x: 0, z: 30 }, w)` vaut `null`.
- `findPath(MAP.spawn, MAP.spawn, w)` vaut `[]`.
- `findPath(MAP.spawn, { x: -5.3, z: -2.7 }, w)` (clic sur l'étal) : non nul, dernier point praticable.

- [ ] **Step 2: Lancer les tests, constater l'échec**

Run: `bun run test src/potager/core`
Expected: FAIL (modules absents).

- [ ] **Step 3: Implémenter `walk.ts` et `path.ts`**

- [ ] **Step 4: Relancer les tests**

Run: `bun run test src/potager/core`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/potager/core
git commit -m "feat(potager): zones praticables et recherche de chemin"
```

---

### Task 3: Mouvement de l'avatar

**Files:**

- Create: `src/potager/core/avatarMotion.ts`
- Test: `src/potager/core/avatarMotion.test.ts`

**Interfaces:**

- Consumes: `Point`, `Walkable`, `nearestWalkable` (Tasks 1-2).
- Produces:
  - `AVATAR_SPEED = 4.5`
  - `interface AvatarPose { x: number; z: number; moving: boolean; facing: 1 | -1 }` (`facing` = -1 vers la gauche ; inchangé quand le mouvement est purement vertical)
  - `interface AvatarMotion { pose(): AvatarPose; setInput(dx: number, dz: number): void; walkTo(path: Point[]): void; teleport(p: Point): void; update(dt: number): AvatarPose }`
  - `createAvatarMotion(start: Point, walkable: Walkable, speed = AVATAR_SPEED): AvatarMotion`
  - Comportement :
    - départ et `teleport` : si le point n'est pas praticable, `nearestWalkable(p, walkable, 3)`, sinon `MAP.spawn`.
    - `setInput` : direction normalisée (diagonale à vitesse `speed`) ; une entrée non nulle annule le chemin en cours ; `(0, 0)` arrête.
    - `update` avec entrée : essaie x puis z séparément ; un axe dont la destination n'est pas praticable est ignoré (glissement le long des murs).
    - `update` avec chemin : avance de `speed * dt` vers le prochain point, enchaîne les points dans la même image si la distance le permet, s'arrête au dernier.
    - `moving` vrai si la position a changé pendant cet `update`.

- [ ] **Step 1: Écrire les tests qui échouent**

Avec `const open: Walkable = () => true` et `const wall: Walkable = (x) => x < 1` :

- `setInput(1, 0); update(1)` sur `open` depuis `(0, 0)` : `x` vaut `4.5`, `facing` vaut `1`, `moving` vrai.
- `setInput(1, 1); update(1)` : `Math.hypot(x, z)` proche de `4.5`.
- `setInput(0, 1); setInput(0, 0); update(1)` : position inchangée, `moving` faux.
- Touches opposées : `setInput(0, 0)` est ce que le hook envoie pour Z + S ; aucune autre valeur n'est attendue ici, le cas est couvert par le test précédent.
- `setInput(-1, 0); update(0.1)` : `facing` vaut `-1` ; puis `setInput(0, 1); update(0.1)` : `facing` reste `-1`.
- Sur `wall` depuis `(0, 0)`, `setInput(1, 1); update(1)` : `x` reste `0`, `z` proche de `3.18` (glissement).
- `walkTo([{ x: 1, z: 0 }, { x: 1, z: 2 }]); update(10)` : position `{ x: 1, z: 2 }`, puis `update(0.1).moving` faux.
- `walkTo([{ x: 10, z: 0 }]); update(0.5); setInput(0, 1); update(0.5)` : `x` vaut `2.25` (le chemin est annulé par le clavier).
- `createAvatarMotion({ x: 5, z: 0 }, wall).pose().x` est `< 1` (départ dans un mur => point praticable).
- Aucune valeur `NaN` après `update(0)`.

- [ ] **Step 2: Lancer les tests, constater l'échec**

Run: `bun run test src/potager/core/avatarMotion.test.ts`
Expected: FAIL (module absent).

- [ ] **Step 3: Implémenter `avatarMotion.ts`**

- [ ] **Step 4: Relancer les tests**

Run: `bun run test src/potager/core`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/potager/core
git commit -m "feat(potager): mouvement de l'avatar"
```

---

### Task 4: Avatar dans la scène (mouvement, animation, sélection au sol)

**Files:**

- Modify: `src/potager/render/createPotagerScene.ts`
- Modify: `src/potager/ui/PotagerBackdrop.tsx` (aucun appel à `setAvatar` n'existe ; rien à changer si `sync` gère l'avatar)

**Interfaces:**

- Consumes: `createAvatarMotion`, `isWalkable`, `Point` (Tasks 1-3), `buildAvatar()` (`{ mesh, frames }`, existant).
- Produces, sur `PotagerScene` (le membre `setAvatar` est supprimé) :
  - `avatar: AvatarMotion`
  - `walkable: Walkable` (lit les bâtiments de la dernière sauvegarde synchronisée)
  - `pick(clientX: number, clientY: number): Point | null` : `Raycaster` depuis la caméra vers `terrain.group` et le groupe des parcelles/bâtiments placés, premier point touché ; `null` si rien.
- Comportement :
  - création : `createAvatarMotion(init.avatar, walkable)`.
  - `sync(save)` : met à jour les bâtiments praticables ; en mode `backdrop` seulement, `avatar.teleport(save.avatar)` (dans la fenêtre Potager, la scène fait foi et `sync` est appelé à chaque tick de la simulation).
  - `frame(dt)` : `avatar.update(dt)` avant le suivi caméra ; mesh à `(x, groundHeight(x, z), z)` ; `mesh.scale.x = facing` ; texture `frames[1]` en alternance toutes les 0,18 s tant que `moving`, `frames[0]` à l'arrêt (changer `material.map`, sans `needsUpdate` sur la texture) ; le suivi caméra lit `avatar.pose()`.

- [ ] **Step 1: Implémenter**

- [ ] **Step 2: Vérifier**

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: PASS. Dans l'aperçu (`/?window=potager`), l'avatar est à sa place et la scène s'affiche comme avant.

- [ ] **Step 3: Commit**

```bash
git add src/potager/render src/potager/ui
git commit -m "feat(potager): avatar animé dans la scène et sélection au sol"
```

---

### Task 5: Contrôles clavier et souris, sauvegarde de l'avatar

**Files:**

- Create: `src/potager/ui/useAvatarControls.ts`
- Modify: `src/potager/ui/useFreeCamera.ts` (retirer `KEYS`, `held`, les écouteurs clavier et leur part de la boucle), `src/potager/ui/PotagerApp.tsx`
- Modify: `docs/superpowers/plans/2026-10-19-potager-idle-socle.md:76` (`useFreeCamera.ts  glisser, bords d'écran en mode libre`)

**Interfaces:**

- Consumes: `PotagerScene` (`avatar`, `walkable`, `pick`, `rig`) de Task 4, `findPath` de Task 2.
- Produces:
  - `useAvatarControls(scene: PotagerScene | null, canvas: HTMLCanvasElement | null, onFollow: () => void): void`
  - `PotagerApp` garde la scène dans un état (`scene` remplace `rig` + `canvas` pour les hooks) ; `withCamera` devient `withView(scene)` qui écrit `camera` et `avatar: { x, z }` de `scene.avatar.pose()`.
- Comportement :
  - clavier sur `window` : `e.code` dans les huit touches, sans `metaKey` / `ctrlKey` / `altKey` ; `keydown` ajoute, `keyup` retire, `e.preventDefault()` pour les flèches ; à chaque changement, `scene.avatar.setInput(dx, dz)` à partir des touches tenues ; à la première touche, si `rig.mode() === "free"`, appeler `onFollow()`.
  - `blur` de la fenêtre et `visibilitychange` vers caché : vider les touches, `setInput(0, 0)`.
  - souris sur le canvas : `pointerdown` bouton gauche mémorise la position ; `pointerup` à moins de 5 px => `pick` puis `findPath(avatar.pose(), point, scene.walkable)` puis `walkTo` si non nul.
  - `onFollow` dans `PotagerApp` : `rig.setMode("follow")`, `setMode("follow")`, sauvegarde via `withView` (même chose que `toggleMode` vers `follow`).
  - sauvegarde périodique : l'intervalle de 2 s écrit si la caméra **ou** l'avatar a bougé de plus de 0,01.

- [ ] **Step 1: Implémenter**

- [ ] **Step 2: Vérifier**

Run: `bunx tsc --noEmit && bun run lint && bun run test`
Expected: PASS.

- [ ] **Step 3: Vérifier dans l'aperçu navigateur** (`bun run dev`, `http://localhost:1420/?window=potager`)

- Flèches et ZQSD (touches tenues) : l'avatar marche, animé, tourné du bon côté, s'arrête au relâchement ; caméra qui suit.
- Collisions : bloqué par l'étal, les tonneaux, la falaise et la barrière ; glisse le long des murs ; monte l'escalier vers le plateau.
- Clic sur le sol : l'avatar s'y rend ; clic sur le plateau depuis le milieu : passage par l'escalier ; clic sur l'eau : rien d'anormal.
- Caméra libre : un glisser fait défiler sans déplacer l'avatar ; un clic déplace l'avatar et la caméra reste libre ; une touche repasse en « Caméra : suit l'avatar ».
- Recharger la page : l'avatar reprend sa position.
- Fenêtre principale (`http://localhost:1420/`) : le fond passif montre l'avatar à la position sauvegardée.

- [ ] **Step 4: Commit**

```bash
git add src/potager/ui docs/superpowers/plans/2026-10-19-potager-idle-socle.md
git commit -m "feat(potager): déplacement de l'avatar au clavier et à la souris"
```
