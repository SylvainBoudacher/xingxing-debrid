# Potager - Parcelles, plan 1 : cycle d'une case, outils, abri, puits, Herbier

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le joueur bêche, sème, arrose et cueille les cases de sa parcelle, chaque geste par un mini-jeu ; il porte ses outils dans un inventaire de 6 cases, les range à l'abri, remplit l'arrosoir au puits, voit éclore des fleurs reconnaissables et remplit l'Herbier.

**Architecture:** Toute la règle du jeu est en TS pur dans `src/potager/core/` : modèle des cases et de l'inventaire, pousse avancée par la simulation (`stepSim`), préparation et application des actions, logique des mini-jeux. La fenêtre Potager applique les actions par `host.update(fn)` sur la simulation qui fait foi. La scène three.js dessine cases, plantes, abri et puits et joue l'éclosion ; React affiche mini-jeux, inventaire, panneau de l'abri, bulles et Herbier. Les mauvaises herbes, corneilles et la forêt sont le plan 2.

**Tech Stack:** React 19, TypeScript, three.js 0.186, Vitest (environnement `node`), Bun.

**Spec:** `docs/superpowers/specs/2026-10-19-potager-parcelles-design.md`. Maquettes de référence des mini-jeux : `.superpowers/brainstorm/15239-1792439805/content/mini-jeux-v5.html` (valeurs reprises ci-dessous ; le fichier est local et non versionné).

## Global Constraints

- Texte affiché en français accentué ; identifiants ASCII ; `src/lib/accents.test.ts` vert. Pas de tirets cadratins ni de guillemets typographiques.
- Fini = `bunx tsc --noEmit`, `bun run lint`, `bun run test` verts, et rendu vérifié dans l'aperçu (`bun run dev`, `http://localhost:1420/?window=potager`).
- `core/` n'importe ni React ni three.js ; tout tirage passe par un `rng: () => number` injecté.
- **Aucune fuite avant l'éclosion** : une graine (inventaire, coffre, case semée, infobulle, données envoyées à l'UI pour affichage) ne montre que sa rareté.
- Sauvegarde `version: 1` ; chaque nouveau champ est facultatif à la lecture, valeur par défaut = celle de `createStarterSave()`. Une sauvegarde actuelle ne doit jamais être déclarée illisible.
- Rien ne meurt, rien ne se perd : un résultat « Raté » donne moins, jamais une perte.
- Règles de structure de `CLAUDE.md` : un composant par fichier, helpers et données dans des modules voisins.

## Review Focus

- Action lancée sur une case dont l'état change pendant le mini-jeu (éclosion par la simulation, panneau de l'abri, fenêtre qui se ferme) : l'application doit revalider et ne rien faire d'incohérent (test en Task 4).
- Inventaire plein au moment de cueillir ou de récupérer la graine bonus : la fleur reste sur la case, aucun objet perdu, message (test en Task 4).
- Éclosion pendant que le Potager est fermé : la case reste « non vue » et l'animation se joue à la prochaine ouverture, une seule fois (tests en Task 3 et Task 7).
- Ancienne sauvegarde (sans cases, inventaire, abri, Herbier) : se charge, partie neuve pour ces champs, avatar et caméra conservés (test en Task 1).
- Fuite de l'espèce par l'UI : l'inventaire, le coffre et la case semée ne reçoivent que la rareté (test en Task 2 sur `slotView`).

---

## File Structure

```
src/potager/core/
  types.ts              + Grade, ToolId, Seed, Cell, Slot, Tool, ChestStack, HerbierEntry, champs de PotagerSave
  save.ts               valeurs de départ et lecture tolérante des nouveaux champs
  catalog/map.ts        + MAP.abri, MAP.puits
  catalog/rarity.ts     ROLL_HARVEST, RARITY_COLOR, RARITY_LABEL (nouveau)
  cells.ts              parcelCells, cellKey, cellAt (nouveau)
  walk.ts               abri et puits bloquants
  seeds.ts              seededRng, rollRarity, rollSeed, entryKey (nouveau)
  inventory.ts          piles, capacité, abri, slotView (nouveau)
  growth.ts             stageOf, advanceGarden, markSeen (nouveau)
  clock.ts              stepSim (temps de jeu + jardin)
  actions.ts            Target, findTarget, prepareAction, applyAction (nouveau)
  avatarMotion.ts       + dir dans AvatarPose
  minigames/
    types.ts            Minigame, MinigameId
    becher.ts semer.ts arroser.ts cueillir.ts puits.ts
src/potager/sim/simHost.ts      tick : stepSim
src/potager/textures/
  flowerShapes.ts       14 formes de fleurs (données pures, nouveau)
  flowers.ts            flowerTex, stageTex, rarityMarkTex (nouveau)
  props.ts              abriTextures, puitsTextures (nouveau)
src/potager/render/
  garden.ts             buildGarden : cases, plantes, humidité (nouveau)
  bloom.ts              animation d'éclosion (nouveau)
  createPotagerScene.ts abri, puits, jardin, project(), onBloomSeen
src/potager/ui/
  useGardenActions.ts   action, clic, file du mini-jeu (nouveau)
  minigames/MinigameOverlay.tsx + un composant par jeu (nouveau)
  InventoryBar.tsx AbriPanel.tsx AvatarBubble.tsx HerbierPanel.tsx (nouveaux)
  PotagerHud.tsx PotagerApp.tsx useAvatarControls.ts
```

---

### Task 1: Modèle des cases, de l'inventaire et de l'abri ; abri et puits sur la carte

**Files:**

- Modify: `src/potager/core/types.ts`, `src/potager/core/save.ts`, `src/potager/core/catalog/map.ts`, `src/potager/core/walk.ts`
- Create: `src/potager/core/cells.ts`, `src/potager/core/seeds.ts`, `src/potager/core/catalog/rarity.ts`
- Test: `src/potager/core/save.test.ts`, `src/potager/core/cells.test.ts`, `src/potager/core/seeds.test.ts`, `src/potager/core/walk.test.ts`, `src/potager/core/catalog/map.test.ts`

**Interfaces:**

- Produces (dans `types.ts`) :
  - `type Grade = "parfait" | "bien" | "rate"`
  - `type ToolId = "beche" | "arrosoir" | "serfouette"`
  - `interface Tool { id: ToolId; water?: number }` (`water` 0..5, arrosoir seulement)
  - `interface Seed { rarity: Rarity; species: SpeciesId; color: ColorId }`
  - `type Quality = "belle" | "ordinaire"`
  - `type Cell = { kind: "herbe" } | { kind: "bechee"; loose: boolean } | { kind: "plante"; seed: Seed; progress: number; loose: boolean; sowGrade: Grade; wetUntil: number; wetGrade: Grade; seen: boolean }` (`progress` 0..1 ; `wetUntil` en temps de jeu ms ; `seen` faux tant que l'éclosion n'a pas été jouée)
  - `type Slot = { kind: "tool"; tool: Tool } | { kind: "seeds"; rarity: Rarity; seeds: Seed[] } | { kind: "flowers"; species: SpeciesId; color: ColorId; quality: Quality; count: number }`
  - `type ChestStack = { kind: "seeds"; rarity: Rarity; seeds: Seed[] } | { kind: "flowers"; species: SpeciesId; color: ColorId; quality: Quality; count: number }`
  - `interface HerbierEntry { discoveredAt: number; announced: boolean }`
  - `PotagerSave` + `cells: Record<string, Cell>`, `inventory: (Slot | null)[]` (longueur 6), `rack: Tool[]`, `chest: ChestStack[]`, `herbier: Record<string, HerbierEntry>`
- Produces (`cells.ts`) : `CELL = 1` ; `interface CellSlot { key: string; parcel: ParcelId; rect: Rect; center: Point }` ; `parcelCells(parcelId): CellSlot[]` (grille de cases de 1 x 1 centrée dans le rectangle de la parcelle, `floor` de la largeur et de la profondeur, clé `"<parcel>:<col>:<row>"`) ; `cellAt(p: Point, parcels: readonly ParcelId[]): CellSlot | null`.
- Produces (`rarity.ts`) : `ROLL_HARVEST: Record<Rarity, number>` = `{ commune: 0.7, rare: 0.22, epique: 0.07, legendaire: 0.01 }` ; `RARITY_COLOR: Record<Rarity, string>` ; `RARITY_LABEL: Record<Rarity, string>` (« Commune », « Rare », « Épique », « Légendaire »).
- Produces (`seeds.ts`) : `seededRng(seed: number): () => number` (même algorithme que `createRng` de `textures/pixel.ts`, que `core/` ne peut pas importer) ; `rollRarity(table, rng): Rarity` ; `rollSeed(rarity, rng): Seed` (entrée uniforme parmi `entriesOfRarity(rarity)`) ; `entryKey(species, color): string` (`"<species>:<color>"`).
- Produces (`map.ts`) : `MAP.abri = { x: -1.8, z: -2.7, w: 1.8, d: 1.6 }`, `MAP.puits = { x: 18.5, z: -0.5, r: 0.8 }`.
- `createStarterSave()` : toutes les cases des parcelles de départ en `herbe` ; `inventory` = `[seeds commune x5 (tirées par `rollSeed`avec`seededRng(1)`), null x5]` ; `rack` = `[beche, arrosoir { water: 5 }, serfouette]` ; `chest = []` ; `herbier = {}`.
- `parseSave` : chaque nouveau champ absent ou mal formé est remplacé par sa valeur de départ ; une case de clé inconnue est ignorée ; une case de parcelle possédée absente est ajoutée en `herbe`.
- `isWalkable` : emprise de l'abri (+0,3) et disque du puits (rayon `r + 0,3`) bloquants, toujours (pas liés aux bâtiments possédés).

- [ ] **Step 1: Écrire les tests qui échouent**
  - `seeds.test.ts` : `rollRarity(ROLL_HARVEST, () => 0)` vaut `commune`, `() => 0.999` vaut `legendaire` ; `rollSeed("rare", seededRng(3)).rarity` vaut `rare` et son entrée existe au catalogue avec cette rareté ; `seededRng(1)` rejoue la même suite.
  - `cells.test.ts` : `parcelCells("p0")` a 18 cases (6 x 3), toutes dans le rectangle de `p0`, clés uniques ; `cellAt(centre de la première case, ["p0"])` renvoie cette case ; `cellAt({ x: 0, z: 0 }, [])` vaut `null`.
  - `save.test.ts` : la partie neuve a 18 cases `herbe`, une pile de 5 graines communes en case 0, 5 cases vides, 3 outils au râtelier dont l'arrosoir plein ; `parseSave` d'une sauvegarde sans `cells`, `inventory`, `rack`, `chest`, `herbier` n'est pas `null` et reçoit ces valeurs de départ en gardant `avatar` et `camera` ; `parseSave({ ...s, inventory: "x" })` reçoit l'inventaire de départ.
  - `walk.test.ts` : centre de l'abri et centre du puits non praticables.
  - `map.test.ts` : abri et puits dans les bornes, sans chevauchement avec parcelles et bâtiments.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.** Pour la lecture tolérante, un validateur par champ ; une case invalide (graine d'espèce inconnue, `progress` hors 0..1) est remise en `herbe`.
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): modèle des cases, graines, abri et puits sur la carte`

---

### Task 2: Inventaire et abri

**Files:**

- Create: `src/potager/core/inventory.ts`
- Test: `src/potager/core/inventory.test.ts`

**Interfaces:**

- Consumes: types, `RARITY_LABEL` et `seeds.ts` de Task 1.
- Produces:
  - `inventory.ts` (toutes pures, renvoient un nouvel objet ou `null` si refusé) :
    - `STACK = 5`, `SLOTS = 6`
    - `addSeed(inv, seed): (Slot | null)[] | null` : complète une pile de même rareté non pleine, sinon première case vide, sinon `null`
    - `addFlower(inv, f: { species; color; quality }): ... | null` : même règle, pile de même espèce, couleur et qualité
    - `takeSeed(inv, slotIndex): { inv; seed } | null` : retire une graine de la pile désignée, ou de la première pile de graines si la case désignée n'en est pas une ; la pile vide devient `null`
    - `hasTool(inv, id): boolean` ; `toolSlot(inv, id): number` (-1 si absent)
    - `setWater(inv, amount): (Slot | null)[]` (arrosoir de l'inventaire)
    - `deposit(save, slotIndex): PotagerSave` : outil vers `rack`, graines et fleurs fusionnées dans `chest` (pile de coffre sans limite)
    - `withdrawTool(save, id): PotagerSave | null` ; `withdrawStack(save, chestIndex): PotagerSave | null` (prend jusqu'à 5 éléments dans une case vide, sinon `null`)
    - `slotView(slot): { kind; label; rarity?; count; water? }` : vue d'affichage ; pour des graines, `label` = nom de la rareté et **aucun champ d'espèce ni de couleur**

- [ ] **Step 1: Écrire les tests qui échouent**
  - `inventory.test.ts` :
    - 5 graines communes puis une sixième : deux cases ; une graine rare va dans une autre case que les communes.
    - Inventaire plein (6 cases occupées, aucune pile complétable) : `addSeed` et `addFlower` valent `null`.
    - `takeSeed` sur la dernière graine d'une pile laisse la case à `null`.
    - `deposit` d'un outil le met au râtelier et libère la case ; `deposit` de 3 graines communes fusionne avec une pile commune du coffre.
    - `withdrawStack` sur une pile de 12 graines du coffre en prend 5 et en laisse 7 ; refusé si aucune case libre.
    - `withdrawTool("arrosoir")` garde le niveau d'eau.
    - `JSON.stringify(slotView(pile de graines))` ne contient ni l'identifiant d'espèce ni celui de couleur des graines de la pile.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): inventaire et abri`

---

### Task 3: Pousse et éclosion dans la simulation

**Files:**

- Create: `src/potager/core/growth.ts`
- Modify: `src/potager/core/clock.ts`, `src/potager/sim/simHost.ts` (le tick appelle `stepSim` au lieu de `advancePlayTime`)
- Test: `src/potager/core/growth.test.ts`, `src/potager/core/clock.test.ts`

**Interfaces:**

- Consumes: types (Task 1), `entryKey` (Task 2).
- Produces:
  - `GROW_MS: Record<Rarity, number>` = commune 600 000, rare 900 000, epique 1 200 000, legendaire 1 800 000
  - `WET_MS = 180_000` ; `WET_SPEED: Record<Grade, number>` = parfait 1.5, bien 1.3, rate 1.15 ; `LOOSE_SPEED = 1.1` ; `SOW_FIRST_STAGE: Record<Grade, number>` (part de la durée de la première étape) = parfait 0.7, bien 0.85, rate 1
  - `stageOf(progress): 0 | 1 | 2 | 3 | 4` (quarts ; 4 = épanouie quand `progress >= 1`)
  - `advanceGarden(save, stepMs): PotagerSave` : pour chaque case `plante` non épanouie, `progress += stepMs / GROW_MS[rareté] x vitesse`, vitesse = produit de `WET_SPEED[wetGrade]` si `playTimeMs < wetUntil`, `LOOSE_SPEED` si `loose`, et `1 / SOW_FIRST_STAGE[sowGrade]` tant que `progress < 0.25` ; plafonné à 1. À l'atteinte de 1 : `seen = false` et, si `herbier[entryKey]` est absent, il est créé `{ discoveredAt: playTimeMs, announced: false }`.
  - `markSeen(save, cellKey): { save; announce: { species; color } | null }` : `seen = true` ; si l'entrée d'Herbier n'est pas annoncée, la passe à `announced: true` et renvoie l'espèce et la couleur à annoncer.
  - `stepSim(save, elapsedMs): PotagerSave` dans `clock.ts` : `advancePlayTime` puis `advanceGarden` avec le pas réellement appliqué (même plafond `MAX_STEP_MS`).

- [ ] **Step 1: Écrire les tests qui échouent** (`growth.test.ts`, case commune semée avec `sowGrade: "rate"`, `loose: false`, sèche)
  - `advanceGarden(s, 300_000)` donne `progress` 0.5 ; `stageOf(0.5)` vaut 2.
  - Même case humide (`wetUntil` dans le futur, `wetGrade: "parfait"`) : `progress` 0.75 après 300 000.
  - Humidité expirée (`wetUntil < playTimeMs`) : pas d'accélération.
  - `sowGrade: "parfait"` : après `0.25 x 600 000 x 0.7` ms, `progress` atteint 0.25.
  - Éclosion : après 600 000 ms, `progress` 1, `seen` faux, entrée d'Herbier créée non annoncée ; un second `advanceGarden` ne recrée ni ne modifie l'entrée.
  - Deux cases de même espèce et couleur qui éclosent : `markSeen` sur la première annonce, sur la seconde renvoie `announce: null`.
  - `clock.test.ts` : `stepSim(s, 3 * 3_600_000)` avance le temps de jeu et la pousse de 600 000 ms seulement.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter `growth.ts`, `stepSim`, et brancher le tick de `simHost.ts`.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager` - Expected: PASS (les tests de `simHost` passent sans changement).
- [ ] **Step 5: Commit** - `feat(potager): pousse et éclosion dans la simulation`

---

### Task 4: Cibles et actions

**Files:**

- Create: `src/potager/core/actions.ts`
- Modify: `src/potager/core/avatarMotion.ts` (`AvatarPose.dir: Point`, direction unitaire du dernier déplacement, `{ x: 0, z: 1 }` au départ)
- Test: `src/potager/core/actions.test.ts`, `src/potager/core/avatarMotion.test.ts`

**Interfaces:**

- Consumes: Tasks 1 à 3.
- Produces:
  - `type Target = { kind: "cell"; key: string } | { kind: "abri" } | { kind: "puits" }`
  - `REACH = 1.2`
  - `findTarget(save, pose: { x; z; dir }): Target | null` : case de parcelle possédée contenant le point `pose + dir x 0.8` ; sinon abri ou puits si l'avatar est à moins de `REACH` de leur bord ; sinon `null`.
  - `standPoint(target): Point` : point où l'avatar se place pour agir (case : centre + `{ x: 0, z: 0.9 }` ; abri et puits : devant, côté `+z`). Le contrôleur passe ce point à `nearestWalkable`.
  - `type Gesture = "becher" | "semer" | "arroser" | "cueillir" | "puits" | "abri"`
  - `prepareAction(save, target, selectedSlot): { gesture: Gesture } | { message: string }` ; messages exacts :
    - herbe sans bêche : `"Il te faut la bêche (elle est à l'abri)"` ; idem `"l'arrosoir"` pour arroser et le puits
    - bêchée sans graine : `"Plus de graines"`
    - arrosoir à 0 : `"L'arrosoir est vide"`
    - épanouie, aucune place pour la fleur : `"Ton sac est plein"`
    - plante non épanouie déjà humide : arroser reste permis (repart pour 3 min)
    - `abri` : toujours `{ gesture: "abri" }` (ouvre le panneau, sans mini-jeu)
  - `applyAction(save, target, gesture, result: { grade: Grade; water?: number }, selectedSlot, rng): { save; events: ActionEvent[] }` où `type ActionEvent = { kind: "graine"; rarity: Rarity } | { kind: "message"; text: string }` :
    - **revalide** : si `prepareAction` ne renvoie plus le même geste, renvoie `save` inchangé et aucun événement
    - bêcher : `bechee`, `loose = grade === "parfait"`
    - semer : `takeSeed` puis `plante` (`progress 0`, `sowGrade = grade`, `wetUntil 0`, `wetGrade "rate"`, `seen true`, `loose` repris)
    - arroser : `wetUntil = playTimeMs + WET_MS`, `wetGrade = grade`, arrosoir -1
    - cueillir : fleur (`quality "belle"` si parfait) ajoutée, case remise en `herbe` ; puis graine bonus avec probabilité parfait 0.3, bien 0.2, rate 0.1, rareté `rollRarity(ROLL_HARVEST)`, événement `graine`. S'il ne reste aucune place pour une graine après la fleur, aucun tirage n'a lieu (rien n'est tiré puis perdu).
    - puits : `setWater(max(1, round(5 x result.water)))`

- [ ] **Step 1: Écrire les tests qui échouent**
  - `avatarMotion.test.ts` : après `setInput(-1, 0); update(0.1)`, `pose().dir` vaut `{ x: -1, z: 0 }` ; à l'arrêt, `dir` est conservé.
  - `actions.test.ts` :
    - `findTarget` face à une case renvoie sa clé ; près de l'abri, `{ kind: "abri" }` ; en plein champ, `null`.
    - herbe sans bêche dans l'inventaire : message exact ; avec bêche : `becher`.
    - séquence complète sur une case : bêcher, semer (une graine de moins), arroser (arrosoir de 5 à 4), avancer la pousse jusqu'à l'éclosion, cueillir (fleur dans l'inventaire, case en `herbe`).
    - cueillette avec inventaire plein mais pile de même fleur non pleine : acceptée ; inventaire plein sans pile compatible : `prepareAction` renvoie `"Ton sac est plein"` et la fleur reste.
    - graine bonus (rng forcé à 0) sans place libre : pas de graine, aucune perte, fleur bien ajoutée.
    - revalidation : `applyAction(semer)` sur une case redevenue `herbe` renvoie la sauvegarde inchangée.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): cibles et actions du jardin`

---

### Task 5: Logique des mini-jeux

**Files:**

- Create: `src/potager/core/minigames/types.ts`, `becher.ts`, `semer.ts`, `arroser.ts`, `cueillir.ts`, `puits.ts`
- Test: `src/potager/core/minigames/minigames.test.ts`

**Interfaces:**

- Produces:
  - `type Input = "action" | "left" | "right" | "up" | "down"`
  - `interface Minigame<V> { press(input: Input, down: boolean): void; update(dtS: number): void; view(): V; result(): { grade: Grade; water?: number } | null }`
  - Une fabrique par jeu, `create<Jeu>(rng: () => number): Minigame<Vue>` ; chaque `view()` renvoie les nombres nécessaires au dessin (positions normalisées 0..1, jauges, séquence), sans état DOM.
- Valeurs (reprises de la maquette v5, en unités normalisées) :
  - **Bêcher** : 3 battements ; rayon de 70 à 18 en 0,9 s (unités de la maquette), pause 0,25 s entre battements ; écart au rayon cible < 5 : 2 points, < 12 : 1 point, rayon < 6 sans appui : 0 point ; total >= 5 parfait, >= 3 bien, sinon raté.
  - **Semer** : position `0.5 + 0.5 x sin(t / 0.52)` sur la largeur 240 ; trou tiré entre 90 et 230 sur 320 ; écart < 18 parfait, < 42 bien, sinon raté.
  - **Arroser** : niveau +1 en 1,7 s pendant l'appui ; au relâché, `|niveau - 0.7| < 0.035` parfait, `0.6 < niveau < 0.82` bien, sinon raté ; à 1, relâché forcé.
  - **Cueillir** : 3 flèches tirées ; 2,5 s ; les 3 justes sans erreur en moins de 1,6 s parfait, les 3 justes sinon bien, temps écoulé raté.
  - **Puits** : remontée en 3,5 s ; angle avec vent `sin(1,7t) x 1,1 + sin(3,1t + 1) x 0,7`, rappel `angle x 1,2`, poussée gauche / droite `x 2,4`, amortissement 0,97 par image (rapporté à `dt`) ; perte d'eau `(|angle| - 0.35) x 0.9 x dt` au-delà de 0,35 ; à l'arrivée, eau > 0.9 parfait, > 0.6 bien, sinon raté ; `water` = eau restante.
- Chaque jeu finit toujours sur un résultat (bêcher et semer par appui ou épuisement, arroser au plus à niveau 1, cueillir à 2,5 s, puits à 3,5 s).

- [ ] **Step 1: Écrire les tests qui échouent** (`dt` de 1/60 simulé, rng injecté)
  - Bêcher : appuyer exactement quand le rayon vaut 18 à chaque battement donne `parfait` ; ne jamais appuyer donne `rate` après au plus 4 s simulées.
  - Semer : appuyer quand la position est sur le trou donne `parfait`, à 30 du trou `bien`, à 60 `rate`.
  - Arroser : relâcher à niveau 0.7 donne `parfait`, à 0.65 `bien`, à 0.4 `rate` ; maintenir indéfiniment donne un résultat à 1,7 s.
  - Cueillir : bonne séquence immédiate `parfait` ; une erreur puis la bonne séquence `bien` ; rien `rate` à 2,5 s.
  - Puits : sans aucune entrée, un résultat existe à 3,5 s et `water` est entre 0 et 1 ; avec une poussée qui compense toujours le signe de l'angle, `parfait`.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core/minigames` - Expected: FAIL.
- [ ] **Step 3: Implémenter** en reprenant les formules de la maquette.
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): logique des mini-jeux du jardin`

---

### Task 6: Textures : 14 fleurs, étapes de pousse, abri, puits

**Files:**

- Create: `src/potager/textures/flowerShapes.ts`, `src/potager/textures/flowers.ts`, `src/potager/textures/props.ts`
- Test: `src/potager/textures/flowerShapes.test.ts`

**Interfaces:**

- Produces:
  - `flowerShapes.ts` (données pures) : `FLOWER_SHAPES: Record<SpeciesId, string[]>` grilles de pixels 16 x 24 au format de `textures/avatar.ts` (caractères = rôles : contour, pétale clair, pétale foncé, coeur, tige, feuille) ; `COLOR_HEX: Record<ColorId, [clair: string, foncé: string]>`.
  - `flowers.ts` : `flowerTex(species, color): THREE.Texture` (mise en cache par paire) ; `stageTex(stage: 0 | 1 | 2 | 3): THREE.Texture` (motte avec graine, pousse, plant, bouton fermé vert, **identiques pour toutes les espèces**) ; `rarityMarkTex(rarity)` (petite étiquette de couleur de rareté plantée devant une case semée).
  - `props.ts` : `abriTextures()` (petit abri en bois, râtelier visible), `puitsTextures()` (margelle de pierre, toit, seau).
- Forme propre à chaque espèce : silhouette, nombre et disposition des pétales, hauteur et tige différents ; s'inspirer du nom (tournesol grand à disque large, rose trémière en épi, etc.).

- [ ] **Step 1: Écrire le test qui échoue** (`flowerShapes.test.ts`) : une forme par espèce du catalogue ; chaque grille fait 24 lignes de 16 caractères ; les 14 grilles sont deux à deux différentes et diffèrent d'au moins 20 pixels non vides (silhouettes réellement distinctes) ; chaque `ColorId` du catalogue a une entrée dans `COLOR_HEX`.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/textures` - Expected: FAIL.
- [ ] **Step 3: Dessiner les 14 formes et implémenter `flowers.ts` et `props.ts`.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/textures && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): sprites des fleurs, des étapes de pousse, de l'abri et du puits`

---

### Task 7: Jardin dans la scène et éclosion

**Files:**

- Create: `src/potager/render/garden.ts`, `src/potager/render/bloom.ts`
- Modify: `src/potager/render/createPotagerScene.ts`, `src/potager/render/village.ts` (abri et puits dans le décor fixe)
- Test: `src/potager/render/gardenKey.test.ts`

**Interfaces:**

- Consumes: textures (Task 6), `parcelCells`, `stageOf` (Tasks 1, 3).
- Produces:
  - `garden.ts` : `gardenKey(save): string` (fonction pure : change seulement si un élément visible change : type de case, étape, humide ou non, espèce et couleur une fois épanouie, `loose`) ; `buildGarden(save): THREE.Group` (herbe en touffes sur les cases `herbe`, terre retournée sur `bechee`, assombrissement `wetTex` si humide, sprite d'étape ou de fleur, étiquette de rareté sur les cases semées non épanouies).
  - `bloom.ts` : `createBloom(scene): { play(at: Point, y: number): void; update(dt: number): void }` (éclat et pétales, environ 1 s).
  - `PotagerScene` + `project(p: Point): { x: number; y: number; visible: boolean }` (coordonnées écran CSS du point au sol) ; `onBloomSeen(cb: (cellKey: string) => void): void`.
- Comportement :
  - `sync(save)` reconstruit le jardin seulement si `gardenKey` change (`disposeTree` de l'ancien groupe).
  - En mode `potager`, à chaque image : pour une case épanouie avec `seen === false` dont le centre est visible à l'écran et pas déjà en cours d'animation, jouer l'éclosion puis appeler les abonnés `onBloomSeen` avec sa clé.
  - En mode `backdrop`, aucune animation, aucun appel.

- [ ] **Step 1: Écrire le test qui échoue** (`gardenKey.test.ts`) : `gardenKey` identique quand seul `progress` avance dans la même étape ; différent au changement d'étape, à l'humidité, à l'éclosion ; une case semée non épanouie ne fait pas entrer l'espèce dans la clé (deux graines d'espèces différentes de même rareté donnent la même clé).
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/render` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS ; dans l'aperçu, la parcelle montre 18 cases d'herbe, l'abri et le puits.
- [ ] **Step 5: Commit** - `feat(potager): jardin, abri et puits dans la scène, animation d'éclosion`

---

### Task 8: Actions dans la fenêtre Potager : mini-jeux, inventaire, abri, bulles

**Files:**

- Create: `src/potager/ui/useGardenActions.ts`, `src/potager/ui/minigames/MinigameOverlay.tsx`, `src/potager/ui/minigames/BecherView.tsx`, `SemerView.tsx`, `ArroserView.tsx`, `CueillirView.tsx`, `PuitsView.tsx`, `src/potager/ui/InventoryBar.tsx`, `src/potager/ui/AbriPanel.tsx`, `src/potager/ui/AvatarBubble.tsx`
- Modify: `src/potager/ui/useAvatarControls.ts`, `src/potager/ui/PotagerApp.tsx`, `src/potager/ui/usePotagerSession.ts` (exposer `host` pour `update`)

**Interfaces:**

- Consumes: `findTarget`, `standPoint`, `prepareAction`, `applyAction` (Task 4), fabriques de mini-jeux (Task 5), `scene.project`, `scene.avatar`, `scene.walkable` (Task 7), `findPath`, `nearestWalkable`, `deposit` / `withdrawTool` / `withdrawStack` / `slotView` (Task 2).
- Produces:
  - `useGardenActions({ scene, host, canvas }): { game: ActiveGame | null; bubble: { text: string; at: Point } | null; abriOpen: boolean; closeAbri(): void; selected: number; select(i: number): void; requestAction(target?: Target): void }`
  - Machine d'états : `libre` -> (Espace ou arrivée d'un clic) `prepareAction` -> message : bulle 2 s ; geste `abri` : panneau ; sinon mini-jeu -> résultat -> `host.update(s => applyAction(...).save)` (événements : graine obtenue = bulle « Graine rare trouvée ! » avec la seule rareté) -> `libre`.
  - Pendant un mini-jeu ou panneau ouvert : `scene.avatar.setInput(0, 0)` et les touches de marche sont ignorées (`useAvatarControls` reçoit un drapeau `locked`).
  - Clic sur une case, l'abri ou le puits (via `scene.pick` puis `cellAt` ou proximité) : chemin vers `nearestWalkable(standPoint(target))`, puis action à l'arrivée (quand le chemin est terminé et que l'avatar n'a pas été dirigé au clavier entre-temps).
  - Touches 1 à 6 : sélection de case d'inventaire ; Échap ferme le panneau de l'abri ; s'éloigner de plus de `REACH + 1` aussi.
  - `MinigameOverlay` : boucle `requestAnimationFrame` qui appelle `update(dt)` et dessine la vue sur un petit canvas 2D (320 x 180, `image-rendering: pixelated`), positionné au-dessus de la case via `project`, dans le style HD-2D (fond sombre, filet doré `#b8975a`) ; entrées clavier (Espace, flèches, Q/D) et souris (maintien = action ; puits : moitié gauche / droite) ; affiche « Parfait ! », « Bien » ou « Raté » 0,6 s avant de rendre la main.
  - `InventoryBar` : 6 cases en bas de l'écran, sélection surlignée, quantité, niveau d'eau de l'arrosoir ; les graines montrent la seule couleur de rareté et le mot (« Commune », « Rare », « Épique », « Légendaire »).
  - `AbriPanel` : inventaire d'un côté, râtelier et coffre de l'autre ; un clic dépose ou reprend (fonctions de Task 2 via `host.update`) ; titre « Abri de jardin ».
  - `AvatarBubble` : bandeau court au-dessus de l'avatar (`project`), 2 s.

- [ ] **Step 1: Implémenter.**
- [ ] **Step 2: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS.
- [ ] **Step 3: Vérifier dans l'aperçu** (`/?window=potager`, sauvegarde neuve : vider `localStorage` de l'aperçu)
  - Espace face à une case sans bêche : bulle « Il te faut la bêche (elle est à l'abri) ».
  - À l'abri : panneau, prendre la bêche et l'arrosoir ; l'inventaire les montre ; Échap ferme.
  - Bêcher (rythme), semer (précision, une graine de moins, étiquette de rareté sur la case), arroser (dosage, case sombre, arrosoir 4/5).
  - Clic sur une case lointaine : l'avatar y va puis lance le mini-jeu.
  - Puits : mini-jeu d'équilibre, arrosoir rempli selon l'eau restante.
  - Pendant un mini-jeu, les flèches ne déplacent pas l'avatar.
- [ ] **Step 4: Commit** - `feat(potager): mini-jeux, inventaire et abri dans la fenêtre Potager`

---

### Task 9: Éclosion jouée, Herbier

**Files:**

- Create: `src/potager/ui/HerbierPanel.tsx`, `src/potager/ui/herbierView.ts`
- Modify: `src/potager/ui/PotagerApp.tsx`, `src/potager/ui/PotagerHud.tsx`
- Test: `src/potager/ui/herbierView.test.ts`

**Interfaces:**

- Consumes: `scene.onBloomSeen`, `markSeen` (Task 3), `CATALOG_ENTRIES`, `speciesOf`, `colorName`, `flowerTex` (Tasks 6).
- Produces:
  - `herbierView(save): { total: number; found: number; entries: ({ found: true; species; color; name: string; rarity; note: string } | { found: false; rarity: Rarity })[] }` (pure ; une entrée non découverte ne porte ni nom, ni espèce, ni couleur ; elle garde sa rareté pour le cadre).
  - Branchement : `scene.onBloomSeen(key => host.update(s => { const r = markSeen(s, key); ... return r.save; }))` ; si `announce`, toast `« Nouvelle découverte ! <Nom> <couleur> »` (nom accordé avec `colorName(color, feminine)`).
  - `HerbierPanel` : grille des 65 entrées (miniature de `flowerTex` en image pour une entrée trouvée, silhouette grise et « ? » sinon), compteur « Herbier : n / 65 », note du jardinier au survol ou au clic d'une entrée trouvée ; ouvert par la touche H ou un bouton « Herbier » du HUD, fermé par Échap.

- [ ] **Step 1: Écrire le test qui échoue** (`herbierView.test.ts`) : partie neuve, `found 0`, `total` égal à `CATALOG_ENTRIES.length`, et `JSON.stringify` d'une entrée non découverte ne contient aucun identifiant d'espèce ni de couleur ; après une éclosion simulée (`advanceGarden`), l'entrée correspondante est `found` avec son nom.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/ui` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS. Dans l'aperçu : semer, accélérer la pousse pour le test (par exemple en éditant `playTimeMs` et `progress` dans le `localStorage` de l'aperçu, ou en arrosant parfaitement et en attendant), constater l'animation, le toast pour une première découverte, l'absence de toast pour une seconde fleur identique, l'entrée dans l'Herbier ; fermer l'onglet Potager avant l'éclosion, la laisser se produire dans la fenêtre principale, rouvrir : l'animation se joue à l'ouverture.
- [ ] **Step 5: Commit** - `feat(potager): éclosion annoncée et Herbier`
