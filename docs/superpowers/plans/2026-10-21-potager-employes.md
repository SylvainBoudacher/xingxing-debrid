# Potager - Employés (sous-projet 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une maison des employés achetée en PO permet d'embaucher dans l'ordre un arroseur, un jardinier, un cueilleur et un fleuriste, de leur faire monter des niveaux et de leur confier des parcelles ; ils marchent et travaillent réellement dans le village, moins bien que le joueur.

**Architecture:** Même découpage que les plans précédents. La règle est en TypeScript pur sous `src/potager/core/staff/` (catalogue, achats et réglages, simulation de l'équipe), testée sous Vitest avec hasard injecté. L'équipe avance dans `stepSim` : son état d'exécution (`crew` : position, chemin, tâche, objets portés) vit dans `PotagerSave` mais n'est jamais écrit sur disque (`storedSave` le retire et range au coffre ce qui était porté). Les effets des gestes réutilisent ceux du joueur (`applyToCell`, `harvestCell`, `serve`). La scène affiche les employés en lissant les positions de la simulation (pas d'une seconde) ; l'interface ajoute le panneau de la maison, le panneau de chantier et le piquet de parcelle.

**Tech Stack:** React 19, TypeScript, three.js 0.186, Vitest (environnement `node`), Bun.

**Spec:** `docs/superpowers/specs/2026-10-21-potager-employes-design.md`. Spec précédente : `docs/superpowers/specs/2026-10-20-potager-economie-design.md`. Plan précédent : `docs/superpowers/plans/2026-10-20-potager-economie.md`.

## Global Constraints

- Texte affiché en français accentué ; identifiants ASCII ; `src/lib/accents.test.ts` vert. Pas de tirets cadratins, de guillemets typographiques ni de symboles décoratifs.
- Fini = `bunx tsc --noEmit`, `bun run lint`, `bun run test` verts, et toute tâche d'interface vérifiée dans l'aperçu navigateur (configuration `vite` ou `vite-alt` de `.claude/launch.json`, `.env.local` présent ; le Potager s'ouvre depuis le bouton Potager de l'accueil).
- `core/` n'importe ni React ni three.js ; tout tirage passe par un `rng` injecté.
- Sauvegarde `version: 1` inchangée ; nouveaux champs lus de façon tolérante. Une sauvegarde actuelle se charge sans maison ni employé.
- **Un employé n'obtient jamais Parfait** ; il ne touche jamais au sac du joueur ; il ne travaille que sur les parcelles qui lui sont confiées (le fleuriste : à l'étal, s'il est actif).
- **Aucune fuite avant l'éclosion** : les graines portées et semées ne montrent que leur rareté ; une découverte cueillie par le cueilleur s'annonce comme celle du joueur.
- Rien ne se perd : ce qu'un employé porte finit au coffre (même au-delà de sa capacité à la sauvegarde) ; coffre plein ou plus de graines : il s'arrête, rien n'est détruit.
- Un fichier par responsabilité, un composant par fichier (`CLAUDE.md`, « Code Structure ») : `useGardenActions.ts` (246 lignes), `createPotagerScene.ts` (361), `actions.ts` (296) et `village.ts` (321) ne reçoivent que le branchement ; la nouveauté va dans de nouveaux modules.

## Review Focus

- Grand pas de simulation (retour de veille, `MAX_STEP_MS` = 600 s) : un employé enchaîne plusieurs tâches dans le même pas sans boucle infinie ni geste fait deux fois sur la même case (test en Task 4).
- Le joueur vend ou cueille lui-même la case visée pendant que l'employé marche : l'employé abandonne sans effet, aucun geste appliqué sur l'état périmé (test en Task 4).
- Parcelle décochée pendant qu'un employé y travaille : il lâche la tâche au pas suivant ; ce qu'il porte reste porté (test en Task 4).
- Fermeture de l'app pendant que le cueilleur porte 4 fleurs et que le coffre est plein : la sauvegarde écrite contient les 4 fleurs au coffre (test en Task 1).
- Jardinier réglé sur « commune » avec seulement des graines rares au coffre : il bêche, ne sème pas, état « Attend : plus de graines au coffre » (test en Task 5).

---

## File Structure

```
src/potager/core/
  types.ts                 + StaffId, Hired, Worker, Carry, StaffStatus ; BuildingId + "maison" ;
                             PotagerSave.staff, crew, playerBusy
  staff/
    catalog.ts             prix, vitesses, parts de Bien, capacités portées (nouveau)
    shop.ts                buyMaison, hire, levelUp, setStaffParcel, setMaxRarity, setFloristActive (nouveau)
    grade.ts               rollStaffGrade, staffSpeed, gestureMs (nouveau)
    crew.ts                advanceStaff : moteur commun (chemin, geste, abandon) (nouveau)
    arroseur.ts  jardinier.ts  cueilleur.ts  fleuriste.ts   choix de la tâche de chaque métier (nouveaux)
    carry.ts               dépôt au coffre de ce qui est porté, pioche de graines (nouveau)
    announce.ts            découvertes du cueilleur restées sans annonce (nouveau)
  saveGarden.ts  save.ts   lecture des nouveaux champs ; storedSave
  actions.ts               harvestCell et applyToCell exportés ; cibles chantier, maison, piquet
  catalog/map.ts           emplacement de la maison, maisonSign(), parcelStake(id)
  clock.ts                 stepSim appelle advanceStaff
src/potager/storage/potagerStore.ts   écrit storedSave(save)
src/potager/textures/  avatar.ts (STAFF_PALETTES), buildings.ts (maisonTextures, stakeTex)
src/potager/render/
  staff.ts                 sprites des employés et objet porté (nouveau)
  village.ts  highlight.ts  createPotagerScene.ts   maison, panneau de chantier, piquets, branchement
src/potager/ui/
  useStaff.ts              achats et réglages avec messages (nouveau)
  usePlayerBusy.ts         case du mini-jeu en cours transmise à la simulation (nouveau)
  useStaffAnnounce.ts      annonce des découvertes du cueilleur (nouveau)
  staffView.ts             libellés d'état et de niveau (nouveau)
  MaisonPanel.tsx  maison/StaffCard.tsx  StakePanel.tsx  PriceSignPanel.tsx (nouveaux)
  usePanel.ts  clickTarget.ts  GardenPanels.tsx  EtalPanel.tsx  PotagerGame.tsx  ParcelSignPanel.tsx
```

---

### Task 1: Modèle des employés et sauvegarde

**Files:**

- Create: `src/potager/core/staff/catalog.ts`
- Modify: `src/potager/core/types.ts`, `src/potager/core/saveGarden.ts`, `src/potager/core/save.ts`, `src/potager/storage/potagerStore.ts`
- Test: `src/potager/core/save.test.ts`

**Interfaces:**

- Produces (`types.ts`):
  - `STAFF_IDS = ["arroseur", "jardinier", "cueilleur", "fleuriste"] as const` (ordre d'embauche) ; `type StaffId`.
  - `interface Hired { level: 1 | 2 | 3 | 4 | 5; parcels: ParcelId[]; maxRarity: Rarity; active: boolean }` (`maxRarity` ne sert qu'au jardinier, `active` qu'au fleuriste ; valeurs de départ `"commune"` et `true`).
  - `interface Carry { seeds: Seed[]; flowers: FlowerStack[] }` (vide : deux tableaux vides ; le cueilleur porte ses fleurs et ses graines bonus).
  - `type StaffStatus = { kind: "idle" } | { kind: "pause" } | { kind: "work"; gesture: StaffGesture; cell: string } | { kind: "puits" } | { kind: "abri" } | { kind: "etal" } | { kind: "noSeeds" } | { kind: "chestFull" }`, avec `type StaffGesture = "arroser" | "chasser" | "desherber" | "becher" | "semer" | "cueillir" | "servir" | "remplir" | "deposer" | "prendre"`.
  - `interface Worker { pos: Point; path: Point[]; task: StaffTask | null; doneAt: number | null; carry: Carry; water: number; status: StaffStatus }` et `type StaffTask = { gesture: StaffGesture; cell?: string; stand: Point }` (`doneAt` : temps de jeu de fin du geste en cours, `null` en marche ou au repos).
  - `BUILDING_IDS` + `"maison"`.
  - `PotagerSave` + `staff: Partial<Record<StaffId, Hired>>`, `crew: Partial<Record<StaffId, Worker>>`, `playerBusy: string | null` (clé de case ou `"etal"` pendant un mini-jeu du joueur).
- Produces (`staff/catalog.ts`), valeurs de la spec :
  - `MAISON_PRICE = 150`, `HIRE_PRICE: Record<StaffId, number> = { arroseur: 100, jardinier: 250, cueilleur: 500, fleuriste: 900 }`
  - `MAX_LEVEL = 5`, `levelPrice(id: StaffId, level: number): number` = `Math.round(HIRE_PRICE[id] * 1.5 * 1.6 ** (level - 1))` (prix pour passer de `level` à `level + 1` ; arroseur 150, 240, 384, 614)
  - `BIEN_SHARE = [0.4, 0.55, 0.7, 0.85, 1]` (indice `level - 1`)
  - `WALK_SHARE = [0.6, 0.7, 0.8, 0.9, 1]` (part de `AVATAR_SPEED`), `GESTURE_MS = [3000, 2550, 2100, 1650, 1200]`
  - `CAN_SIZE = 5` (arrosages), `CARRY_FLOWERS = 5`
  - `STAFF_LABEL: Record<StaffId, string> = { arroseur: "Arroseur", jardinier: "Jardinier", cueilleur: "Cueilleur", fleuriste: "Fleuriste" }`
- Produces (`save.ts`): `storedSave(save: PotagerSave): Omit<PotagerSave, "crew" | "playerBusy">`. Ce que porte chaque `crew[id].carry` est ajouté au coffre (fusion par rareté ou par fleur identique ; nouvelle pile même au-delà de `chestCapacity`), puis `crew` et `playerBusy` sont retirés. `savePotager` écrit `storedSave(save)`.
- Départ et lecture : `staff: {}`, `crew: {}`, `playerBusy: null`. `parseGarden` lit `staff` ; `crew` et `playerBusy` ne sont jamais lus (toujours `{}` et `null`). `createStarterSave` : `buildings` inchangé (`["etal", "cabane"]`, sans maison).

- [ ] **Step 1: Écrire les tests qui échouent** (`save.test.ts`)
  - partie neuve et sauvegarde sans ces champs : `staff {}`, `crew {}`, `playerBusy null`, pas de `"maison"` dans `buildings`.
  - `staff: { arroseur: { level: 3, parcels: ["p0"], maxRarity: "rare", active: false } }` relu à l'identique.
  - `level: 0`, `6` ou `"2"` : employé ignoré ; parcelle non possédée ou inconnue : retirée de `parcels` ; `maxRarity` inconnue : `"commune"` ; `active` absent : `true`.
  - `staff.jardinier` présent sans `staff.arroseur` : relu tel quel (l'ordre ne s'impose qu'à l'embauche).
  - `crew` et `playerBusy` présents dans le JSON brut : ignorés.
  - `storedSave` : cueilleur qui porte 4 roses rouges ordinaires, coffre plein sans pile identique : le coffre gagne une 13e pile de 4 roses ; aucune clé `crew` ni `playerBusy` dans le résultat ; jardinier qui porte 3 graines rares, coffre avec une pile rare : fusionnées.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter** les types, `staff/catalog.ts`, la lecture dans `parseGarden`, `storedSave` et son appel dans `savePotager`.
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): modèle des employés et sauvegarde`

---

### Task 2: Maison, embauches, niveaux et réglages

**Files:**

- Create: `src/potager/core/staff/shop.ts`
- Modify: `src/potager/core/catalog/map.ts`
- Test: `src/potager/core/staff/shop.test.ts`, `src/potager/core/catalog/map.test.ts` (nouveau)

**Interfaces:**

- Consumes: Task 1 ; `Refusal` et le style `Bought` de `economy/shop.ts`.
- Produces (`map.ts`):
  - `MAP.buildings` + `{ id: "maison", ... }` (emplacement au choix du builder, terrasse du milieu ou plateau) ; `maisonSign(): Point` (centre de l'emplacement, où se plante le panneau de chantier).
  - `parcelStake(id: ParcelId): Point` : point au bord de la parcelle, hors des cases, praticable.
- Produces (`staff/shop.ts`), tous de type `(save, ...) => PotagerSave | { refused: StaffRefusal }` avec `type StaffRefusal = Refusal | "ordre" | "max" | "maison"` :
  - `buyMaison(save)` : `"deja"` si `buildings` contient `"maison"` ; sinon paie `MAISON_PRICE` et ajoute `"maison"`.
  - `hire(save, id)` : `"maison"` sans maison ; `"deja"` si embauché ; `"ordre"` si le métier précédent de `STAFF_IDS` n'est pas embauché ; sinon paie `HIRE_PRICE[id]`, `staff[id] = { level: 1, parcels: [], maxRarity: "commune", active: true }`.
  - `levelUp(save, id)` : `"max"` au niveau 5 ; paie `levelPrice(id, level)`.
  - `setStaffParcel(save, id, parcel, on: boolean)`, `setMaxRarity(save, rarity)` (jardinier), `setFloristActive(save, active)` : retournent `PotagerSave` (sans refus ; employé absent ou parcelle non possédée : sauvegarde inchangée ; le fleuriste n'a jamais de parcelle).

- [ ] **Step 1: Écrire les tests qui échouent**
  - `map.test.ts` : le rectangle de la maison ne chevauche ni un autre bâtiment, ni une parcelle, ni l'abri, le puits, les tonneaux, les troncs, l'escalier ; `findPath(MAP.spawn, standPoint({ kind: "maison" }), walkable)` existe avec la maison construite ; chaque `parcelStake` est praticable, hors de toute case, et joignable depuis le départ.
  - maison : 149 PO refusé `"po"` et sauvegarde identique ; 150 PO accepté, solde 0 ; deuxième achat `"deja"`.
  - `hire("jardinier")` avant l'arroseur : `"ordre"` ; sans maison : `"maison"` ; arroseur à 100 PO : niveau 1, aucune parcelle.
  - `levelUp("arroseur")` : coûts successifs 150, 240, 384, 614 ; au niveau 5 : `"max"`.
  - `setStaffParcel("arroseur", "p0", true)` puis `false` ; `"p1"` non possédée : inchangé ; `setStaffParcel("fleuriste", ...)` : inchangé.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter** l'emplacement de la maison, `maisonSign`, `parcelStake` et `staff/shop.ts`.
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): maison des employés, embauches, niveaux et réglages`

---

### Task 3: Gestes partagés et note des employés

**Files:**

- Create: `src/potager/core/staff/grade.ts`, `src/potager/core/staff/carry.ts`, `src/potager/core/staff/announce.ts`
- Modify: `src/potager/core/actions.ts`
- Test: `src/potager/core/staff/grade.test.ts`, `src/potager/core/staff/carry.test.ts`, `src/potager/core/staff/announce.test.ts`, `src/potager/core/actions.test.ts` (existants verts)

**Interfaces:**

- Produces (`actions.ts`), refactor sans changement de comportement pour le joueur :
  - `applyToCell` exporté tel quel.
  - `harvestCell(save, key, grade, rng, room: (f: FlowerStack) => boolean, announce: boolean): { save; flower: FlowerStack; seed: Seed | null; announce: Demand | null } | null` : retire la plante (case en herbe), qualité `belle` si `parfait`, graine bonus tirée avec `BONUS_SEED[grade]` et `ROLL_HARVEST`. `announce: true` passe par `markSeen` (cas du joueur) ; `false` laisse `seen` et l'entrée de l'Herbier telles quelles. La branche `cueillir` d'`applyAction` l'utilise ; le rangement dans le sac reste dans `applyAction`.
- Produces (`grade.ts`): `rollStaffGrade(level, rng): "bien" | "rate"` (`rng() < BIEN_SHARE[level - 1]` donne `"bien"`), `staffSpeed(level): number` (`AVATAR_SPEED * WALK_SHARE[level - 1]`), `gestureMs(level): number`.
- Produces (`carry.ts`):
  - `dropCarry(save, carry: Carry): { save; left: Carry }` : range au coffre en respectant `chestCapacity` (comme `deposit` : graines fusionnées par rareté, fleurs par pile identique) ; `left` : ce qui n'a pas trouvé de place (vide si tout est rangé).
  - `takeSeeds(save, maxRarity: Rarity): { save; carry: Carry } | null` : prend au coffre au plus `STACK` graines de la pile de rareté la plus basse autorisée (`commune` avant `rare`...) ; `null` s'il n'y en a aucune.
- Produces (`announce.ts`): `orphanDiscoveries(save): string[]` (clés d'Herbier non annoncées dont aucune case ne porte encore une plante de cette entrée non vue) et `announceEntries(save, keys): PotagerSave` (passe `announced` à `true`).

- [ ] **Step 1: Écrire les tests qui échouent**
  - `rollStaffGrade` : jamais `"parfait"` sur 1 000 tirages à chaque niveau ; niveau 5 toujours `"bien"` ; niveau 1 avec `rng` = 0,39 : `"bien"`, 0,41 : `"rate"`.
  - `staffSpeed(1)` = 0,6 x `AVATAR_SPEED`, `gestureMs(5)` = 1200.
  - `dropCarry` : 5 fleurs, pile identique au coffre plein : fusionnées, `left` vide ; pile nouvelle et coffre plein : `left` = les 5 fleurs, coffre inchangé.
  - `takeSeeds(save, "commune")` avec seulement une pile rare : `null` ; avec `"rare"` : prend la pile rare ; coffre avec 7 communes : en prend 5, en laisse 2.
  - `harvestCell(..., announce: false)` sur une plante non vue : `seen` reste `false`, l'entrée reste `announced: false`, la case passe en herbe ; `orphanDiscoveries` renvoie alors sa clé ; une deuxième plante de la même entrée encore non vue sur une autre case : clé absente.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter**, puis vérifier que `actions.test.ts` passe sans modification.
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `refactor(potager): gestes partagés avec les employés, note et objets portés`

---

### Task 4: Moteur de l'équipe et arroseur

**Files:**

- Create: `src/potager/core/staff/crew.ts`, `src/potager/core/staff/arroseur.ts`
- Modify: `src/potager/core/clock.ts`
- Test: `src/potager/core/staff/crew.test.ts`

**Interfaces:**

- Consumes: Tasks 1 à 3, `findPath`, `isWalkable`, `standPoint`.
- Produces (`crew.ts`):
  - `type Planner = (save: PotagerSave, id: StaffId, w: Worker) => StaffTask | StaffStatus` : la prochaine tâche du métier, ou l'état de repos à afficher.
  - `type Doer = (save: PotagerSave, id: StaffId, w: Worker, grade: Grade, rng: () => number) => { save: PotagerSave; worker: Worker } | null` : applique le geste terminé ; `null` si la case ne s'y prête plus (abandon sans effet).
  - `advanceStaff(save, stepMs, rng): PotagerSave` : pour chaque employé embauché (crée son `Worker` devant la maison s'il manque, `water: CAN_SIZE`), consomme `stepMs` : marcher le long de `path` à `staffSpeed`, puis lancer le geste (`doneAt = now + gestureMs`), puis à `doneAt` appeler le `Doer` avec `rollStaffGrade` (sauf `remplir`, `chasser`, `deposer`, `prendre` : sans note). Sans tâche : appelle le `Planner`, calcule le chemin vers `task.stand` ; pas de chemin : la tâche est écartée pour ce pas. Repos : marche vers la maison, `status` = l'état rendu par le `Planner`. Au plus 20 tâches par employé et par pas.
  - `type Check = (save: PotagerSave, id: StaffId, w: Worker, task: StaffTask) => boolean` : la tâche est-elle encore faisable (case encore confiée et encore dans l'état visé) ; `CHECKS: Record<StaffId, Check>`.
  - **Abandon** : avant de lancer le geste et à son terme, la tâche passe par le `Check` du métier ; `playerBusy === task.cell` (ou `"etal"` pour le fleuriste) annule aussi un geste en cours, sans effet.
  - `PLANNERS`, `DOERS` et `CHECKS` : `Record<StaffId, ...>`, remplis par `arroseur.ts` puis Tasks 5 et 6 (un métier sans module ne fait rien).
  - `stepSim` : `advanceStaff` après `advanceClients`, avant `advanceGarden`.
- Produces (`arroseur.ts`): planner : eau à 0 : `{ gesture: "remplir", stand: standPoint({ kind: "puits" }) }` ; sinon la plante confiée la plus proche avec `progress < 1` et `wetUntil <= now` : `{ gesture: "arroser", cell }` ; sinon `{ kind: "idle" }`. Doer : `remplir` remet `water = CAN_SIZE` ; `arroser` applique `applyToCell(save, cell, "arroser", grade)` et retire 1 arrosage.

- [ ] **Step 1: Écrire les tests qui échouent** (`rng` fixe, pas de 1 s simulés)
  - arroseur sans parcelle : ne touche à rien, `status idle`, revient vers la maison.
  - arroseur sur `p0` avec 2 plantes sèches : après assez de pas, les deux ont `wetUntil > now` et `wetGrade` vaut `"bien"` ou `"rate"`, jamais `"parfait"` ; une plante en fleur n'est pas arrosée.
  - 5 arrosages faits : la tâche suivante est `remplir`, le `Worker` passe par le puits, `water` revient à 5.
  - niveau 5 plus rapide que niveau 1 sur le même trajet (moins de pas pour arroser la même plante).
  - `playerBusy` = la case visée pendant le geste : aucun effet sur la case, l'arrosoir garde son eau.
  - la case visée arrosée par le joueur pendant la marche : abandon, l'employé passe à la suivante.
  - `p0` décochée en pleine tâche : tâche lâchée au pas suivant.
  - un seul pas de 600 s avec 4 plantes sèches : les 4 arrosées, aucune deux fois, le pas se termine.
  - le sac du joueur est identique avant et après chaque test.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core/staff` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): l'arroseur travaille dans la simulation`

---

### Task 5: Jardinier

**Files:**

- Create: `src/potager/core/staff/jardinier.ts`
- Test: `src/potager/core/staff/jardinier.test.ts`

**Interfaces:**

- Consumes: Tasks 3 et 4.
- Produces (`jardinier.ts`), priorité de la spec sur ses parcelles, case la plus proche d'abord dans chaque niveau :
  1. corneille présente : `chasser` (le doer retire la corneille de `save.crows`) ;
  2. mauvaise herbe présente (`hasWeed`) : `desherber` (`applyToCell`, repousse programmée si raté) ;
  3. case `herbe` : `becher` (`applyToCell` ; raté : la case reste en herbe) ;
  4. case `bechee` : avec des graines portées, `semer` (plante `seen: true`, `sowGrade` = la note, graine prise dans `carry`) ; sans graines portées, `prendre` à l'abri (`takeSeeds(save, staff.jardinier.maxRarity)`) ; rien d'autorisé au coffre : état `noSeeds` (seulement si plus rien à bêcher ni à désherber).
- Rien à faire : `idle`. Les graines portées restent portées au repos.

- [ ] **Step 1: Écrire les tests qui échouent**
  - corneille et mauvaise herbe sur `p0` : la corneille part avant que la mauvaise herbe soit traitée.
  - `p0` en herbe, coffre avec 3 communes : après assez de pas, 3 plantes semées, les autres cases bêchées ; aucune graine prise au sac (sac identique).
  - `maxRarity` `"commune"`, coffre avec seulement des rares : bêche tout, ne sème rien, `status noSeeds`.
  - `maxRarity` `"rare"` avec communes et rares au coffre : les communes d'abord.
  - semis : `sowGrade` jamais `"parfait"`, plante `seen: true`, rien dans l'Herbier ne change.
  - parcelle `p1` possédée mais non confiée : jamais touchée.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core/staff` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): le jardinier chasse, désherbe, bêche et sème`

---

### Task 6: Cueilleur et fleuriste

**Files:**

- Create: `src/potager/core/staff/cueilleur.ts`, `src/potager/core/staff/fleuriste.ts`
- Test: `src/potager/core/staff/cueilleur.test.ts`, `src/potager/core/staff/fleuriste.test.ts`

**Interfaces:**

- Consumes: Tasks 3 et 4, `serve`, `salePrice`.
- Produces (`cueilleur.ts`):
  - planner : `CARRY_FLOWERS` fleurs portées, ou des fleurs portées et plus rien à cueillir : `deposer` à l'abri ; sinon la fleur épanouie confiée la plus proche : `cueillir` ; sinon `idle`. Après un dépôt incomplet (`dropCarry` rend un reste), état `chestFull` et plus de cueillette tant que le reste n'est pas rangé (nouvel essai à chaque passage du planner).
  - doer `cueillir` : `harvestCell(save, cell, grade, rng, room, false)` ; fleur et graine bonus vont dans `carry` (la graine bonus est rangée au coffre avec le prochain dépôt).
- Produces (`fleuriste.ts`):
  - `pickStallFlower(stall: FlowerStack[], demand: Demand): number` : indice de la pile qui touche le plus de bonus (espèce et couleur, puis espèce ou couleur) ; à égalité ou sans bonus, la moins rare (`rarityOf`), puis `ordinaire` avant `belle`.
  - planner : `active` faux : `pause` ; client présent et réserve non vide : `servir`, `stand` = point du fleuriste devant l'étal (à côté de celui de l'avatar) ; sinon `etal` (il attend à l'étal).
  - doer `servir` : `serve(save, pickStallFlower(...), grade, rng)` ; la vente est payée comme celle du joueur.

- [ ] **Step 1: Écrire les tests qui échouent**
  - cueilleur sur `p0` avec 7 fleurs épanouies : deux allers à l'abri (5 puis 2), coffre augmenté de 7 fleurs, toutes `ordinaire`, sac identique.
  - coffre plein sans pile identique : 5 fleurs portées, `status chestFull`, les 2 autres restent sur leurs plantes ; agrandir le coffre (`chestLevel` + 1) : il les range au passage suivant.
  - plante en fleur non vue cueillie : `orphanDiscoveries` contient son entrée, aucune entrée passée à `announced`.
  - `pickStallFlower` : demande Rose rouge, réserve [Tulipe rouge légendaire, Rose rouge commune, Dahlia blanc commun] : la Rose rouge ; demande sans correspondance, réserve [légendaire, commune belle, commune ordinaire] : la commune ordinaire.
  - fleuriste actif, client présent : après le geste, `client null`, `po` augmenté de `salePrice(..., grade)` avec `grade` `"bien"` ou `"rate"` ; en pause : client toujours là, PO inchangés.
  - `playerBusy = "etal"` : le fleuriste ne sert pas.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core/staff` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): le cueilleur range au coffre, le fleuriste sert à l'étal`

---

### Task 7: Cibles de la maison, du chantier et des piquets

**Files:**

- Modify: `src/potager/core/actions.ts` (branchement seulement), `src/potager/ui/clickTarget.ts`, `src/potager/ui/usePanel.ts`
- Test: `src/potager/core/actions.test.ts`

**Interfaces:**

- Produces:
  - `Target` + `{ kind: "chantier" }` (panneau de la maison non construite), `{ kind: "maison" }`, `{ kind: "piquet"; parcel: ParcelId }` (parcelle possédée) ; `Gesture` + `"chantier" | "maison" | "piquet"`.
  - `findTarget` : maison construite à portée (`REACH`) : `maison` ; sinon `maisonSign()` à portée : `chantier` ; `parcelStake(id)` d'une parcelle possédée à portée : `piquet`. Les cases restent prioritaires (ordre actuel). `standPoint` et `targetAt` (clic) traitent les trois.
  - `prepareAction` : les trois donnent leur geste du même nom, sans condition.
  - `Panel` + `{ kind: "chantier" } | { kind: "maison" } | { kind: "piquet"; parcel: ParcelId }` ; `panelGap` les mesure (rectangle de la maison, point du panneau, point du piquet).

- [ ] **Step 1: Écrire les tests qui échouent** : avatar devant le panneau de chantier, sans maison : `chantier` ; maison construite : `maison`, plus de `chantier` ; devant le piquet de `p0` : `piquet` ; devant celui d'une parcelle non possédée : pas de `piquet` ; les trois `standPoint` sont praticables.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): maison, panneau de chantier et piquets comme cibles`

---

### Task 8: Maison, piquets et employés dans la scène

**Files:**

- Create: `src/potager/render/staff.ts`
- Modify: `src/potager/textures/avatar.ts`, `src/potager/textures/buildings.ts`, `src/potager/render/village.ts`, `src/potager/render/highlight.ts`, `src/potager/render/createPotagerScene.ts`

**Interfaces:**

- Consumes: Tasks 1, 2, 7 ; `avatarViews`, `spriteMesh`, `priceSignTex`.
- Produces:
  - `STAFF_PALETTES: Record<StaffId, Record<string, string>>` dans `textures/avatar.ts` : une apparence par métier, distincte de l'avatar et des clients.
  - `maisonTextures()` dans `buildings.ts` (style de l'étal et de la cabane, enseigne « Employés ») et `stakeTex()` (petit piquet de bois).
  - `buildPlaced` : la maison si `buildings` contient `"maison"`, sinon `priceSignTex(MAISON_PRICE)` à `maisonSign()` ; un piquet à `parcelStake(id)` pour chaque parcelle possédée.
  - `createStaff(scene: THREE.Scene)` dans `render/staff.ts` : `{ sync(save: PotagerSave): void; update(dt: number): void; dispose(): void }`. Un sprite par employé embauché ; la position affichée rejoint `crew[id].pos` à 1,3 x sa vitesse (lissage du pas d'une seconde de la simulation) ; animations de marche dans les quatre vues comme les clients ; pose de geste pendant `doneAt` ; petit objet au-dessus de la tête selon `carry` et `task` (arrosoir, sachet teinté par la rareté seule, fleur).
  - `createPotagerScene` : `staff.sync(save)` dans `sync`, `staff.update(dt)` dans `frame`, en jeu comme en fond passif. `placedKey` tient compte de la maison.
  - `highlight.set` : cadre pour `maison`, anneau pour `chantier` et `piquet`.

- [ ] **Step 1: Implémenter.**
- [ ] **Step 2: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS.
- [ ] **Step 3: Vérifier dans l'aperçu** : partie neuve, le panneau « 150 PO » est planté à l'emplacement de la maison, un piquet au bord de `p0`. Via le stockage du shim (passer par la fenêtre principale), donner la maison, un arroseur niveau 1 et un jardinier niveau 5 confiés à `p0`, des graines communes au coffre : ils sortent de la maison, le jardinier bêche et sème, l'arroseur arrose et va au puits ; le jardinier va visiblement plus vite. Le fond passif les montre aussi. Capture d'écran.
- [ ] **Step 4: Commit** - `feat(potager): maison, piquets et employés dans la scène`

---

### Task 9: Panneaux de la maison, du chantier et des piquets

**Files:**

- Create: `src/potager/ui/useStaff.ts`, `src/potager/ui/usePlayerBusy.ts`, `src/potager/ui/useStaffAnnounce.ts`, `src/potager/ui/staffView.ts`, `src/potager/ui/MaisonPanel.tsx`, `src/potager/ui/maison/StaffCard.tsx`, `src/potager/ui/StakePanel.tsx`, `src/potager/ui/PriceSignPanel.tsx`
- Modify: `src/potager/ui/ParcelSignPanel.tsx`, `src/potager/ui/GardenPanels.tsx`, `src/potager/ui/EtalPanel.tsx`, `src/potager/ui/PotagerGame.tsx`, `src/potager/ui/useGardenActions.ts` (ouverture des trois panneaux)
- Test: `src/potager/ui/staffView.test.ts`

**Interfaces:**

- Consumes: Tasks 2, 6, 7.
- Produces:
  - `staffView.ts` : `statusLabel(s: StaffStatus): string` : « Rien à faire », « En pause », « Va au puits », « Passe à l'abri », « Attend à l'étal », « Attend : plus de graines au coffre », « Attend : coffre plein » ; `work` : « Arrose la parcelle 1 », « Chasse une corneille sur la parcelle 1 », « Désherbe la parcelle 1 », « Bêche la parcelle 1 », « Sème la parcelle 1 », « Cueille la parcelle 1 », « Sert un client » (numéro = indice de la parcelle dans `MAP.parcels` + 1, comme le titre du piquet ; écart voulu avec l'exemple « Arrose p0 » de la spec, qui montrait un identifiant). `levelLine(level)` : « Niveau 2 : 70 % de vitesse, 55 % de Bien ».
  - `useStaff(host, say)` : `buyMaison()`, `hire(id)`, `levelUp(id)`, `setParcel(id, parcel, on)`, `setMaxRarity(r)`, `setFloristActive(on)` ; refus affichés : « Pas assez de PO », « Déjà acheté », « Embauche d'abord le métier précédent », « Niveau maximum », « Construis d'abord la maison ».
  - `PriceSignPanel({ question, price, po, onBuy, onClose })` : le corps actuel de `ParcelSignPanel`, qui devient un appel (« Acheter cette parcelle pour 80 PO ? ») ; le chantier l'utilise avec « Construire la maison des employés pour 150 PO ? ».
  - `MaisonPanel` : une `StaffCard` par métier, dans l'ordre (spec 2.6) : grisée « Embauche d'abord l'arroseur » ; « Embaucher (100 PO) » ; embauché : `levelLine`, « Niveau suivant (150 PO) » ou « Niveau max », cases des parcelles possédées (pas pour le fleuriste), choix de la rareté maximale (jardinier : Commune, Rare, Épique, Légendaire), interrupteur « Au travail » / « En pause » (fleuriste), ligne `statusLabel`. PO insuffisants : bouton inactif et « Il te manque 30 PO ».
  - `StakePanel({ parcel })` : titre « Parcelle 1 », une case par employé embauché parmi arroseur, jardinier, cueilleur ; aucun embauché : « Aucun employé à qui la confier ».
  - `usePlayerBusy(host, game)` : `host.update` met `playerBusy` à la clé de la case (cible `cell`) ou `"etal"` (geste `servir`) au début d'un mini-jeu, `null` à la fin ou au démontage.
  - `useStaffAnnounce(host, mode)` : en mode `potager`, toutes les 2 s, `orphanDiscoveries` puis `announceEntries` et le toast actuel « Nouvelle découverte ! Rose rouge » pour chacune.
  - `EtalPanel` : fleuriste actif et en geste `servir` : la note « Le fleuriste sert ce client » remplace les boutons « Servir ».
  - Tous les panneaux suivent `PANEL_STYLE` et la mise en page des panneaux existants.

- [ ] **Step 1: Écrire les tests qui échouent** (`staffView.test.ts`) : chaque libellé ci-dessus pour son état ; `levelLine(1)` = « Niveau 1 : 60 % de vitesse, 40 % de Bien ».
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/ui` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS.
- [ ] **Step 5: Vérifier dans l'aperçu** (partie neuve, PO donnés via le stockage du shim) :
  - construire la maison au panneau de chantier ; embaucher l'arroseur, refus du jardinier avant lui, puis le jardinier, le cueilleur, le fleuriste ; un niveau ; chaque refus affiche son message ;
  - confier `p0` depuis la maison, puis la retirer depuis le piquet de `p0` : les deux panneaux restent d'accord ;
  - lancer un mini-jeu d'arrosage sur la case que vise l'arroseur : le résultat du joueur s'applique, l'arroseur passe à autre chose ;
  - fleuriste actif avec des fleurs en réserve : il sert ; en pause : le joueur sert ;
  - une fleur non vue cueillie par le cueilleur pendant que le Potager est fermé : le toast de découverte apparaît à l'ouverture, l'entrée apparaît dans l'Herbier. Capture d'écran du panneau de la maison.
- [ ] **Step 6: Commit** - `feat(potager): panneaux de la maison, du chantier et des piquets`
