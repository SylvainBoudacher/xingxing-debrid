# Potager - Parcelles, plan 2 : mauvaises herbes, corneilles, forêt, finitions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les gêneurs et l'exploration arrivent : des mauvaises herbes poussent sur les parcelles et s'arrachent à la serfouette (mini-jeu de tension), des corneilles se posent sur les semis et s'envolent quand l'avatar approche, des champignons et des glands apparaissent sous les arbres du plateau et donnent des graines. Les sept défauts mineurs relevés par la revue du plan 1 sont corrigés.

**Architecture:** Même découpage que le plan 1. Les gêneurs et la forêt vivent dans la sauvegarde et avancent dans la simulation (`stepSim`, qui reçoit désormais un `rng`), avec des apparitions probabilistes par pas de temps (probabilité = pas / intervalle moyen), testables par hasard injecté. Le départ des corneilles à l'approche de l'avatar est décidé côté fenêtre Potager (seule à connaître la position de l'avatar) par une fonction pure appliquée via `host.update`.

**Tech Stack:** React 19, TypeScript, three.js 0.186, Vitest (environnement `node`), Bun.

**Spec:** `docs/superpowers/specs/2026-10-19-potager-parcelles-design.md` (2.2 ligne Désherber, 2.3, 2.9, 2.10, 2.11, 2.12). Plan précédent : `docs/superpowers/plans/2026-10-19-potager-parcelles-plan1.md`. Maquette du mini-jeu de tension : `.superpowers/brainstorm/15239-1792439805/content/mini-jeux-v5.html` (carte « Désherber »).

## Global Constraints

- Texte affiché en français accentué ; identifiants ASCII ; `src/lib/accents.test.ts` vert. Pas de tirets cadratins, de guillemets typographiques ni de symboles décoratifs.
- Fini = `bunx tsc --noEmit`, `bun run lint`, `bun run test` verts et rendu vérifié dans l'aperçu (`http://localhost:4180/?window=potager` via la configuration `vite-alt` si le port 1420 est pris).
- `core/` n'importe ni React ni three.js ; tout tirage passe par un `rng` injecté.
- Sauvegarde `version: 1`, nouveaux champs facultatifs à la lecture (valeur de départ si absents ou abîmés).
- Rien ne meurt, rien ne se perd : une mauvaise herbe ou une corneille ralentit ou bloque la pousse, jamais ne détruit ; un désherbage raté arrache quand même.
- Objet en main obligatoire (spec 2.3) : la serfouette doit être en main pour désherber ; ramasser en forêt et chasser une corneille se font à mains nues.

## Review Focus

- Une mauvaise herbe sur une case épanouie : désherber passe avant cueillir, et la fleur reste en place (test en Task 3).
- La simulation de la fenêtre principale fait apparaître herbes, corneilles et objets de forêt Potager fermé ; à l'ouverture tout est là, rien n'est doublé (test en Task 2 sur `advanceNuisances` appelé par `stepSim`).
- Pas de veille : un pas plafonné à 10 minutes ne fait apparaître qu'un nombre borné de gêneurs (au plus 3 herbes par parcelle, au plus 4 objets en forêt, au plus 2 corneilles) (test en Task 2).
- Ancienne sauvegarde sans `weeds`, `crows`, `forest` : se charge, champs vides (test en Task 1).
- Sauvegarde abîmée qui perdrait ou doublerait un outil : chaque outil existe exactement une fois après lecture (test en Task 1).

---

## File Structure

```
src/potager/core/
  types.ts           + Weed, Crow, ForestItemKind ; PotagerSave.weeds, crows, forest
  catalog/map.ts     + MAP.forest (points sous les arbres)
  saveGarden.ts      lecture des nouveaux champs ; outils exactement une fois
  nuisances.ts       advanceNuisances, weedFactor, crowOn, scareCrows (nouveau)
  forest.ts          FOREST_ROLL, pickForest (nouveau)
  growth.ts          advanceGarden tient compte des herbes et corneilles
  clock.ts           stepSim(save, ms, rng)
  actions.ts         cibles herbe / forêt, gestes désherber et ramasser
  minigames/desherber.ts (nouveau)
src/potager/sim/simHost.ts      tick : stepSim(state, dt, Math.random)
src/potager/textures/pests.ts   weedTex, crowTex, mushroomTex, acornTex (nouveau)
src/potager/render/
  garden.ts           herbes et corneilles sur les cases
  forestView.ts       objets de forêt (nouveau)
  gardenKey.ts        clé visuelle étendue
  bloom.ts            animation qui survit à une reconstruction
  createPotagerScene.ts
src/potager/ui/
  useGardenActions.ts désherber, ramasser, corneilles, abri qui se ferme en s'éloignant, sélection de l'outil repris
  minigames/drawMinigames.ts + drawDesherber ; minigameKit.ts
  HerbierPanel.tsx    silhouettes ; flowers.ts cache des images
  PotagerApp.tsx PotagerHud.tsx  bouton Herbier inactif pendant un jeu ou l'abri
```

---

### Task 1: Modèle des gêneurs et de la forêt ; outils toujours uniques

**Files:**

- Modify: `src/potager/core/types.ts`, `src/potager/core/catalog/map.ts`, `src/potager/core/saveGarden.ts`
- Test: `src/potager/core/save.test.ts`, `src/potager/core/walk.test.ts`

**Interfaces:**

- Produces:
  - `interface Weed { at: number }` : la herbe est présente quand `playTimeMs >= at` (un `at` futur = repousse programmée après un désherbage raté).
  - `interface Crow { leaveAt: number }`
  - `type ForestItemKind = "champignon" | "gland"`
  - `PotagerSave` + `weeds: Record<string, Weed>` (clé de case), `crows: Record<string, Crow>` (clé de case), `forest: Record<number, ForestItemKind>` (indice dans `MAP.forest`) ; valeur de départ `{}` pour les trois.
  - `MAP.forest: Point[]` : 8 points, chacun 1,1 devant (+z) un arbre du plateau dont le point reste dans les bornes : arbres `(-15, -6.5)`, `(-10.5, -9.5)`, `(-1.5, -7.6)`, `(10.5, -6.8)`, `(19, -8)`, `(-20, -9)`, `(-12, -13)`, `(1.5, -14)`.
  - `parseGarden` : lecture tolérante des trois champs (clé de case inconnue ignorée, indice de forêt hors bornes ignoré). Puis **chaque outil existe exactement une fois** : un outil présent à la fois dans le sac et au râtelier est retiré du râtelier ; un outil absent des deux est ajouté au râtelier (arrosoir vide).
- [ ] **Step 1: Écrire les tests qui échouent**
  - `save.test.ts` : partie neuve, `weeds`, `crows`, `forest` valent `{}` ; sauvegarde sans ces champs : `{}` ; `forest: { 99: "gland", 0: "truffe" }` donne `{}`.
  - `save.test.ts` : inventaire illisible avec la bêche dans un râtelier lu à `[arrosoir, serfouette]` : après lecture, la bêche est au râtelier (jamais perdue) ; bêche dans le sac et au râtelier : une seule bêche, dans le sac.
  - `walk.test.ts` : chaque point de `MAP.forest` est praticable avec `["etal", "cabane"]` et dans les bornes.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): modèle des mauvaises herbes, corneilles et objets de forêt`

---

### Task 2: Gêneurs et forêt dans la simulation

**Files:**

- Create: `src/potager/core/nuisances.ts`, `src/potager/core/forest.ts`
- Modify: `src/potager/core/growth.ts`, `src/potager/core/clock.ts`, `src/potager/sim/simHost.ts`
- Test: `src/potager/core/nuisances.test.ts`, `src/potager/core/growth.test.ts`, `src/potager/core/clock.test.ts`

**Interfaces:**

- Consumes: Task 1, `parcelCells`, `stageOf`.
- Produces:
  - `WEED_EVERY_MS = 300_000`, `MAX_WEEDS = 3` (par parcelle), `CROW_EVERY_MS = 240_000`, `CROW_STAY_MS = 180_000`, `MAX_CROWS = 2`, `FOREST_EVERY_MS = 180_000`, `MAX_FOREST = 4`, `SCARE_DIST = 2`.
  - `advanceNuisances(save, stepMs, rng): PotagerSave` :
    - par parcelle possédée, avec probabilité `min(1, stepMs / WEED_EVERY_MS)` et moins de `MAX_WEEDS` herbes présentes ou programmées : herbe `{ at: playTimeMs }` sur une case sans herbe tirée au hasard ;
    - avec probabilité `min(1, stepMs / CROW_EVERY_MS)`, moins de `MAX_CROWS` corneilles et au moins une case `plante` non épanouie sans corneille : corneille sur l'une d'elles, `leaveAt = playTimeMs + CROW_STAY_MS` ;
    - corneilles dont `leaveAt <= playTimeMs` retirées ;
    - avec probabilité `min(1, stepMs / FOREST_EVERY_MS)` et moins de `MAX_FOREST` objets : objet sur un point libre, `gland` avec probabilité 0,35, sinon `champignon`.
  - `weedFactor(save, cellKey): number` : 0,5 si une herbe présente se trouve sur la case ou l'une des 8 voisines (même parcelle, colonnes et rangées adjacentes), sinon 1.
  - `scareCrows(save, p: Point): PotagerSave` : retire les corneilles dont la case est à moins de `SCARE_DIST` de `p` ; renvoie `save` inchangé (même référence) s'il n'y en a aucune.
  - `forest.ts` : `FOREST_ROLL: Record<ForestItemKind, Record<Rarity, number>>` = champignon `{ commune: 0.85, rare: 0.13, epique: 0.02, legendaire: 0 }`, gland `{ commune: 0.55, rare: 0.33, epique: 0.1, legendaire: 0.02 }`.
  - `advanceGarden` : vitesse multipliée par `weedFactor`, et nulle si une corneille est sur la case.
  - `stepSim(save, elapsedMs, rng)` : `advanceNuisances` puis `advanceGarden` puis `advancePlayTime`, même pas plafonné. `simHost` passe `Math.random`.
- [ ] **Step 1: Écrire les tests qui échouent**
  - `nuisances.test.ts` (rng forcé) :
    - `rng = () => 0` et pas de 300 000 : une herbe apparaît sur `p0` ; répété 10 fois : jamais plus de 3 herbes sur `p0`.
    - avec une case semée et `rng = () => 0` : une corneille s'y pose avec `leaveAt` à +180 000 ; sans case semée : aucune corneille ; jamais plus de 2.
    - corneille dont `leaveAt` est passé : retirée au pas suivant.
    - forêt : `rng = () => 0` répété 10 fois : au plus 4 objets, tous sur des indices distincts de `MAP.forest`.
    - `rng = () => 0.999` : rien n'apparaît.
    - `weedFactor` : 0,5 pour la case de l'herbe et une voisine diagonale, 1 pour une case à deux colonnes ; une herbe programmée dans le futur ne compte pas.
    - `scareCrows` : corneille à 1,5 de `p` retirée, à 3 conservée ; sans corneille proche, même référence.
  - `growth.test.ts` : plante voisine d'une herbe : moitié de la progression ; plante sous une corneille : progression inchangée.
  - `clock.test.ts` : `stepSim(s, 600_000, () => 0)` fait apparaître herbe et objet de forêt.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter et brancher `simHost`.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): mauvaises herbes, corneilles et forêt dans la simulation`

---

### Task 3: Désherber et ramasser

**Files:**

- Create: `src/potager/core/minigames/desherber.ts`
- Modify: `src/potager/core/actions.ts`
- Test: `src/potager/core/actions.test.ts`, `src/potager/core/minigames/minigames.test.ts`

**Interfaces:**

- Consumes: Tasks 1 et 2, `FOREST_ROLL`, `addSeed`, `rollRarity`, `rollSeed`.
- Produces:
  - `Target` + `{ kind: "foret"; spot: number }` ; `Gesture` + `"desherber" | "ramasser"`.
  - `findTarget` : après la case devant / sous l'avatar, un objet de forêt à moins de `REACH` ; `standPoint` d'un objet de forêt : le point lui-même + `{ x: 0, z: 0.6 }`.
  - `prepareAction` :
    - case portant une herbe **présente** : `desherber` si la serfouette est en main, sinon `"Prends la serfouette en main (touches 1 à 6)"` ou `"Il te faut la serfouette (elle est à l'abri)"`. Prioritaire sur tous les autres gestes de la case.
    - forêt : `ramasser` si une graine peut entrer dans le sac (case libre ou pile de graines non pleine), sinon `"Ton sac est plein"` ; objet disparu : `"Il n'y a plus rien ici"`.
  - `applyAction` :
    - `desherber` : herbe retirée ; si `grade === "rate"`, nouvelle herbe programmée sur la même case à `playTimeMs + 60_000`.
    - `ramasser` : graine tirée par `rollRarity(FOREST_ROLL[kind])` puis `rollSeed` ; si elle entre dans le sac, objet retiré et événement `graine` ; sinon rien ne change (message côté interface).
  - `createDesherber(): Minigame<DesherberView>` (valeurs de la maquette v5, unités normalisées 0..1) : `DesherberView = { cursor: number; zone: number; halfZone: number; progress: number }` ; demi-largeur de zone 0,11 ; zone `0.5 + sin(1.3 t) x 0.25 + sin(2.9 t) x 0.08` ; vitesse du curseur `+2.2 x dt` en appui, `-1.8 x dt` sinon, amortie `x 0.9` par image (rapporté à `dt`), position `+ vitesse x dt x 4`, bornée à 0..1 ; progression `+0.45 x dt` dans la zone, `-0.25 x dt` hors zone ; à 1 : « parfait » si le temps hors zone cumulé est < 0,6 s, sinon « bien » ; à 8 s sans finir : « raté ».
- [ ] **Step 1: Écrire les tests qui échouent**
  - `actions.test.ts` :
    - herbe sur une case épanouie, serfouette en main : `desherber` ; après application, la fleur est toujours là et l'herbe partie.
    - herbe, bêche en main, serfouette dans le sac : message « Prends la serfouette en main (touches 1 à 6) ».
    - désherbage raté : herbe reprogrammée à +60 000, absente de `weedFactor` jusque-là.
    - forêt : `findTarget` près d'un objet le vise ; `ramasser` avec `rng = () => 0` ajoute une graine commune et retire l'objet ; sac plein : message et objet conservé.
  - `minigames.test.ts` : en suivant toujours la zone (appui si le curseur est sous la zone, relâché sinon), « parfait » ou « bien » avant 8 s ; sans rien faire, « raté » à 8 s.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): désherber et ramasser en forêt`

---

### Task 4: Sprites et rendu des gêneurs et de la forêt

**Files:**

- Create: `src/potager/textures/pests.ts`, `src/potager/render/forestView.ts`
- Modify: `src/potager/render/garden.ts`, `src/potager/render/gardenKey.ts`, `src/potager/render/createPotagerScene.ts`
- Test: `src/potager/render/gardenKey.test.ts`

**Interfaces:**

- Produces:
  - `pests.ts` : `weedTex()`, `crowTex(frame: 0 | 1)` (posée, ailes repliées / légèrement ouvertes), `mushroomTex()`, `acornTex()`, générés par code dans le style des autres sprites (contour automatique `outlineCanvas`).
  - `gardenKey(save)` intègre l'herbe présente et la corneille de chaque case, et l'occupation de la forêt.
  - `buildGarden` : herbe en sprite (0,6 x 0,6) au coin arrière gauche de la case ; corneille en sprite (0,7 x 0,6) sur la case, qui alterne ses deux images toutes les 0,4 s (animation dans la boucle de la scène, sans reconstruction).
  - `forestView.ts` : `buildForest(save): THREE.Group` (sprite 0,45 x 0,45 sur chaque point occupé, posé à `groundHeight`).
  - Le lancer de rayon de `pick` inclut les objets de forêt.
- [ ] **Step 1: Écrire le test qui échoue** (`gardenKey.test.ts`) : la clé change quand une herbe devient présente (et pas tant qu'elle est programmée dans le futur), quand une corneille se pose, quand un objet de forêt apparaît.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/render` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS ; aperçu : herbes, corneille et objets de forêt visibles (état injecté par la page neutre `/src/potager/core/types.ts`).
- [ ] **Step 5: Commit** - `feat(potager): herbes, corneilles et objets de forêt dans la scène`

---

### Task 5: Gestes dans la fenêtre Potager

**Files:**

- Modify: `src/potager/ui/useGardenActions.ts`, `src/potager/ui/minigames/minigameKit.ts`, `src/potager/ui/minigames/drawMinigames.ts`

**Interfaces:**

- Consumes: Task 3 (`desherber`, `ramasser`, cible `foret`), `scareCrows` (Task 2), `scene.pick` (Task 4).
- Comportement :
  - `createGame("desherber")` et `drawDesherber` (tige d'herbe qui monte avec la progression, barre de tension, zone verte mobile, curseur doré, comme la maquette).
  - `ramasser` n'a pas de mini-jeu : appliqué tout de suite ; bulle « Graine <rareté> trouvée ! » ou « Ton sac est plein ».
  - Corneilles : à chaque image de la boucle existante, `host.update(s => scareCrows(s, pose))` **seulement** si `scareCrows` change l'état (comparer d'abord sur `host.state()`), pour ne pas notifier à chaque image. Un clic sur une case portant une corneille y mène l'avatar comme pour toute case (la corneille part à l'approche).
  - Clic sur un objet de forêt : `targetAt` reconnaît un point à moins de 0,6 d'un objet présent ; déplacement puis `ramasser`.
  - La surbrillance couvre aussi l'objet de forêt visé (anneau, comme le puits) : `setHighlight` accepte la cible `foret`.
- [ ] **Step 1: Implémenter.**
- [ ] **Step 2: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS.
- [ ] **Step 3: Vérifier dans l'aperçu**
  - Herbe injectée sur une case : serfouette en main, Espace, mini-jeu de tension, herbe arrachée ; raté : l'herbe revient environ une minute plus tard.
  - Corneille injectée sur un semis : elle part quand l'avatar s'approche à moins de 2.
  - Objet de forêt sur le plateau : clic dessus, l'avatar y va (par l'escalier), graine dans le sac, l'objet disparaît.
- [ ] **Step 4: Commit** - `feat(potager): désherber, chasser les corneilles et cueillir en forêt`

---

### Task 6: Finitions relevées par la revue du plan 1

**Files:**

- Modify: `src/potager/ui/useGardenActions.ts`, `src/potager/ui/PotagerApp.tsx`, `src/potager/ui/PotagerHud.tsx`, `src/potager/ui/HerbierPanel.tsx`, `src/potager/textures/flowers.ts`, `src/potager/render/bloom.ts`, `src/potager/render/createPotagerScene.ts`, `src/potager/textures/flowerShapes.ts`
- Test: `src/potager/textures/flowerShapes.test.ts`

**Interfaces et comportement** (un point par défaut différé) :

1. **Abri qui se ferme en s'éloignant** : le panneau de l'abri ne verrouille plus la marche (`locked` pour les déplacements = mini-jeu ou Herbier ; Espace et chiffres restent bloqués panneau ouvert) ; la fermeture à plus de `REACH + 1` de l'abri devient atteignable.
2. **Images de l'Herbier en cache** : `flowerDataUrl` garde l'URL par `species:color` dans une `Map`.
3. **Éclosion qui survit à une reconstruction** : `bloom.play(key, mesh)` ; après chaque `buildGarden`, `bloom.rebind(garden.flowers)` reporte l'échelle en cours sur la nouvelle fleur de même clé (les éclats ne dépendent pas du mesh).
4. **Bouton Herbier inactif** pendant un mini-jeu ou l'abri ouvert (`disabled`, apparence atténuée) ; H ne l'ouvre pas non plus quand l'abri est ouvert.
5. **Silhouettes dans l'Herbier** : `silhouetteDataUrl(species)` dessine la grille de l'espèce en une seule teinte sombre (`#3a2c20`) ; une entrée non découverte affiche cette silhouette avec « ? » en surimpression, sans nom ni couleur. `FLOWER_SHAPES` reste la source.
6. **Sélection qui suit l'outil repris** : après `withdrawTool` réussi, la case sélectionnée devient celle où l'outil est arrivé.
7. (Le défaut « outils perdus ou en double » est traité en Task 1.)

- [ ] **Step 1: Écrire le test qui échoue** (`flowerShapes.test.ts`) : `silhouetteGrid(species)` renvoie la grille de l'espèce où tout pixel non vide vaut `"x"` et les vides restent `"."` (fonction pure de `flowerShapes.ts`, utilisée par `silhouetteDataUrl`).
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/textures` - Expected: FAIL.
- [ ] **Step 3: Implémenter les 6 points.**
- [ ] **Step 4: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS. Dans l'aperçu : abri ouvert puis marcher, le panneau se ferme ; Herbier avec silhouettes ; bouton Herbier grisé pendant un mini-jeu ; reprendre la bêche à l'abri la met en main.
- [ ] **Step 5: Commit** - `fix(potager): finitions de l'abri, de l'Herbier et de l'éclosion`
