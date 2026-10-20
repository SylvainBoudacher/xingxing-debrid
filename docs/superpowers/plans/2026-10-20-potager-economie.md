# Potager - Économie (sous-projet 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les fleurs se vendent à l'étal à des clients qui demandent une fleur précise (mini-jeu « Nouer le ruban »), les PO s'achètent en sachets de graines ouverts façon cartes, en parcelles voisines, en outils de niveau 2 et en places de réserve et de coffre.

**Architecture:** Même découpage que les plans précédents. Toute la règle économique est en TypeScript pur sous `src/potager/core/economy/` (prix, clients, réserve, boutique), testée sous Vitest avec hasard injecté. L'arrivée des clients avance dans `stepSim` (simulation qui fait foi). Les achats et la vente sont des fonctions pures `save -> save | refus` appliquées via `host.update`. L'interface généralise le panneau de l'abri en un état `panel` unique (abri, étal, cabane, panneau de parcelle) et isole les transactions dans un hook `useEconomy`.

**Tech Stack:** React 19, TypeScript, three.js 0.186, motion/react, Vitest (environnement `node`), Bun.

**Spec:** `docs/superpowers/specs/2026-10-20-potager-economie-design.md`. Spec de l'ouverture des sachets : `docs/superpowers/specs/2026-09-23-sachets-ouverture-tcg-design.md` (sections Déroulé et effets seulement). Plan précédent : `docs/superpowers/plans/2026-10-20-potager-parcelles-plan2.md`.

## Global Constraints

- Texte affiché en français accentué ; identifiants ASCII ; `src/lib/accents.test.ts` vert. Pas de tirets cadratins, de guillemets typographiques ni de symboles décoratifs.
- Fini = `bunx tsc --noEmit`, `bun run lint`, `bun run test` verts, et toute tâche d'interface vérifiée dans l'aperçu navigateur (configuration `vite` ou `vite-alt` de `.claude/launch.json`, `.env.local` présent ; le Potager s'ouvre depuis le bouton Potager de l'accueil, il n'y a plus de deuxième fenêtre).
- `core/` n'importe ni React ni three.js ; tout tirage passe par un `rng` injecté.
- Sauvegarde `version: 1` inchangée ; nouveaux champs lus de façon tolérante (valeur de départ si absents ou abîmés). Une sauvegarde actuelle se charge avec 0 PO, réserve vide, outils niveau 1, aucun client.
- **Aucune fuite avant l'éclosion** : un client ne demande jamais une entrée absente de `save.herbier` ; sachets et cartes ne montrent que la rareté.
- Rien ne se perd : une vente ratée paie le prix de base ; aucun achat ne débite sans livrer ; aucun transfert ne détruit d'objet.
- Un fichier par responsabilité, un composant par fichier (règle « Code Structure » de `CLAUDE.md`) : `useGardenActions.ts` (249 lignes) ne grossit pas, les nouveautés vont dans de nouveaux modules.

## Review Focus

- Réserve vidée par le joueur pendant qu'un client attend : au pas de simulation suivant le client repart, aucun paiement, prochain client programmé (test en Task 2).
- Achat avec juste assez de PO (`po === prix`) : accepté, solde 0 ; un PO de moins : refusé, sauvegarde identique (tests en Task 3).
- Sachet acheté sac plein et coffre plein sans pile de cette rareté : refusé avant paiement, PO intacts (test en Task 3).
- Outil de niveau 2 sur une case au bord de la parcelle : seules les voisines existantes sont traitées, aucune clé inventée (test en Task 4).
- Sauvegarde dont le coffre dépasse déjà la capacité (ancienne partie au coffre illimité) : tout reste lisible et retirable, déposer une nouvelle pile est refusé, compléter une pile existante passe (test en Task 3).

---

## File Structure

```
src/potager/core/
  types.ts                 + Client, Demand ; Tool.level ; PotagerSave.po, stall, stallLevel, chestLevel, client, nextClientAt
  saveGarden.ts            starterGarden et parseGarden : nouveaux champs
  economy/
    catalog.ts             tables : prix de base, bonus, sachets, parcelles, outils, capacités (nouveau)
    price.ts               salePrice (nouveau)
    clients.ts             rollDemand, advanceClients, serve (nouveau)
    stall.ts               stallCapacity, stockStall, unstockStall (nouveau)
    shop.ts                buySachet, buyParcel, buyTool, buyStallUpgrade, buyChestUpgrade (nouveau)
  inventory.ts             deposit tient compte de la capacité du coffre ; slotView affiche le niveau
  clock.ts                 stepSim appelle advanceClients
  actions.ts               cibles etal, cabane, panneau ; outils de niveau 2 sur 3 cases
  minigames/ruban.ts       mini-jeu « Nouer le ruban » (nouveau)
  catalog/map.ts           parcelSign(id)
src/potager/textures/
  avatar.ts                avatarViews(palette)
  buildings.ts             priceSignTex
src/potager/render/
  village.ts               panneaux de prix sur les parcelles non possédées
  clients.ts               sprite du client qui arrive, attend et repart (nouveau)
  highlight.ts             cibles etal, cabane, panneau
  createPotagerScene.ts    branche clients.ts
src/potager/ui/
  usePanel.ts              état du panneau ouvert et fermeture en s'éloignant (nouveau, sorti de useGardenActions)
  useEconomy.ts            transactions et messages (nouveau)
  EtalPanel.tsx  CabanePanel.tsx  ParcelSignPanel.tsx  PoCounter.tsx  GainPop.tsx (nouveaux)
  minigames/drawRuban.ts   dessin du ruban (nouveau)
  sachets/                 ouverture façon cartes, restaurée depuis cb54073^ (nouveau)
  AbriPanel.tsx  PotagerGame.tsx  PotagerHud.tsx  useGardenActions.ts  minigames/minigameKit.ts
```

---

### Task 1: Modèle de l'économie et lecture de la sauvegarde

**Files:**

- Create: `src/potager/core/economy/catalog.ts`
- Modify: `src/potager/core/types.ts`, `src/potager/core/saveGarden.ts`
- Test: `src/potager/core/save.test.ts`

**Interfaces:**

- Produces (`types.ts`):
  - `interface Demand { species: SpeciesId; color: ColorId }`
  - `interface Client { demand: Demand; look: number }` (`look` : indice d'apparence, 0 à `CLIENT_LOOKS - 1`)
  - `Tool` + `level?: 2` (absent = niveau 1)
  - `PotagerSave` + `po: number`, `stall: FlowerStack[]`, `stallLevel: number`, `chestLevel: number`, `client: Client | null`, `nextClientAt: number`
- Produces (`economy/catalog.ts`), valeurs de la spec :
  - `BASE_PRICE: Record<Rarity, number> = { commune: 5, rare: 15, epique: 40, legendaire: 100 }`
  - `BELLE_FACTOR = 1.5`, `SPECIES_BONUS = 0.3`, `COLOR_BONUS = 0.3`, `RIBBON_BONUS: Record<Grade, number> = { parfait: 0.2, bien: 0.1, rate: 0 }`
  - `DEMAND_WEIGHT: Record<Rarity, number> = { commune: 0.6, rare: 0.25, epique: 0.12, legendaire: 0.03 }`
  - `CLIENT_GAP_MS: [number, number] = [5_000, 15_000]`, `CLIENT_LOOKS = 4`
  - `type SachetId = "simple" | "bon" | "luxe"` ; `SACHETS: Record<SachetId, { label: string; price: number; roll: Record<Rarity, number> }>` : simple 15 PO (0,80 / 0,17 / 0,03 / 0), bon 50 PO (0,45 / 0,40 / 0,13 / 0,02), luxe 150 PO (0 / 0,55 / 0,35 / 0,10) ; libellés « Sachet simple », « Bon sachet », « Sachet de luxe » ; `SACHET_SIZE = 3`
  - `PARCEL_PRICE: Record<ParcelId, number> = { p1: 80, p2: 250, p3: 600 }`
  - `TOOL_UPGRADE_PRICE = 120`
  - `STALL_SIZES = [6, 9, 12]`, `STALL_PRICES = [60, 200]` (prix pour passer au niveau suivant)
  - `CHEST_SIZES = [12, 18, 24]`, `CHEST_PRICES = [80, 250]`
- Départ (`starterGarden`) : `po: 0`, `stall: []`, `stallLevel: 0`, `chestLevel: 0`, `client: null`, `nextClientAt: 0`.

- [ ] **Step 1: Écrire les tests qui échouent** (`save.test.ts`)
  - partie neuve : `po 0`, `stall []`, `stallLevel 0`, `chestLevel 0`, `client null`, `nextClientAt 0`.
  - sauvegarde sans ces champs : mêmes valeurs.
  - `po: -3` ou `"12"` : 0 ; `po: 12.7` : 12.
  - `stallLevel: 5` : 2 (borné à `STALL_SIZES.length - 1`) ; `chestLevel: -1` : 0.
  - `stall` contenant une pile illisible : `[]` ; pile de graines : `[]` (seules les fleurs sont admises).
  - `client: { demand: { species: "rose", color: "red" }, look: 2 }` relu à l'identique (prendre une entrée existante du catalogue) ; `demand` hors catalogue : `null` ; `look` hors bornes : `null`.
  - outil `{ id: "beche", level: 2 }` relu avec `level: 2` ; `level: 3` ou `"2"` : outil sans `level`.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter** les types, `catalog.ts` et la lecture dans `parseGarden` (réutiliser `parseStack` pour la réserve et `isEntry` pour la demande).
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): modèle de l'économie (PO, réserve de l'étal, client, niveaux)`

---

### Task 2: Prix d'une vente et clients dans la simulation

**Files:**

- Create: `src/potager/core/economy/price.ts`, `src/potager/core/economy/clients.ts`
- Modify: `src/potager/core/clock.ts`
- Test: `src/potager/core/economy/price.test.ts`, `src/potager/core/economy/clients.test.ts`

**Interfaces:**

- Consumes: Task 1.
- Produces:
  - `salePrice(flower: { species: SpeciesId; color: ColorId; quality: Quality }, demand: Demand, ribbon: Grade): number` : `ceil(BASE_PRICE[rareté de la fleur] x (belle ? 1,5 : 1) x (1 + bonus espèce + bonus couleur + bonus ruban))`.
  - `rollDemand(save: PotagerSave, rng: () => number): Demand | null` : rareté tirée selon `DEMAND_WEIGHT` renormalisé sur les raretés qui ont au moins une entrée dans `save.herbier`, puis entrée uniforme parmi les découvertes de cette rareté ; `null` si l'Herbier est vide.
  - `advanceClients(save: PotagerSave, rng: () => number): PotagerSave` :
    - client présent et réserve vide : `client: null`, `nextClientAt: now + gap`.
    - pas de client, réserve non vide, `playTimeMs >= nextClientAt`, `rollDemand` non nul : nouveau client (`look` tiré dans `0..CLIENT_LOOKS-1`).
    - `gap` tiré uniformément dans `CLIENT_GAP_MS`.
  - `serve(save: PotagerSave, stallIndex: number, ribbon: Grade, rng: () => number): { save: PotagerSave; gain: number } | null` : `null` sans client ou sans pile à cet indice ; sinon une fleur retirée de la pile (pile supprimée à 0), `po += gain`, `client: null`, `nextClientAt: now + gap`.
  - `stepSim` : `advanceClients` appelé avec `advanceNuisances`, avant la pousse.

- [ ] **Step 1: Écrire les tests qui échouent**
  - `price.test.ts` : exemple de la spec, Rose rouge commune belle, demande Rose rouge, ruban parfait : 14. Commune ordinaire, demande sans rapport, raté : 5. Bonne couleur seule (Tulipe rouge contre Rose rouge), bien : `ceil(5 x 1,4)` = 7. Légendaire belle, double bonus, parfait : `ceil(100 x 1,5 x 1,8)` = 270. Prendre des espèces et couleurs réelles du catalogue pour chaque rareté.
  - `clients.test.ts` :
    - Herbier vide : `rollDemand` vaut `null` et aucun client n'arrive.
    - Sur 1000 tirages avec un rng pseudo-aléatoire (`seededRng`), chaque demande est une clé de `save.herbier` (jamais une entrée non découverte).
    - Herbier avec seulement des communes : toujours une commune (renormalisation).
    - Réserve vide : aucun client, même avec `nextClientAt` passé.
    - Réserve non vide, `nextClientAt` futur : pas de client ; passé : un client.
    - **Review Focus** : client présent, réserve vidée : après `advanceClients`, `client` null, `po` inchangé, `nextClientAt` entre `now + 5000` et `now + 15000`.
    - `serve` : pile de 2 fleurs, une vendue, il en reste 1 ; pile de 1 : supprimée ; `po` augmenté de `salePrice` ; `client` null.
    - `serve` sans client : `null`.
    - `stepSim` d'une partie avec réserve non vide et `nextClientAt: 0` : un client arrive.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): prix d'une vente et arrivée des clients`

---

### Task 3: Réserve de l'étal, coffre limité et achats

**Files:**

- Create: `src/potager/core/economy/stall.ts`, `src/potager/core/economy/shop.ts`
- Modify: `src/potager/core/inventory.ts`
- Test: `src/potager/core/economy/stall.test.ts`, `src/potager/core/economy/shop.test.ts`, `src/potager/core/inventory.test.ts`

**Interfaces:**

- Consumes: Task 1, `addSeed`, `rollRarity`, `rollSeed`, `parcelCells`, `STACK`.
- Produces:
  - `stallCapacity(save): number` = `STALL_SIZES[save.stallLevel]` ; `chestCapacity(save): number` = `CHEST_SIZES[save.chestLevel]`.
  - `stockStall(save, slotIndex: number): PotagerSave | null` : la pile de fleurs du sac complète d'abord les piles identiques de la réserve (5 au plus), le reste ouvre de nouvelles piles ; `null` si la case n'est pas une pile de fleurs ou s'il n'y a pas la place pour tout (rien ne bouge).
  - `unstockStall(save, stallIndex: number): PotagerSave | null` : la pile entière va dans une case libre du sac ; `null` si le sac est plein.
  - `deposit(save, slotIndex): PotagerSave | null` (signature changée) : `null` quand le dépôt créerait une nouvelle pile alors que `save.chest.length >= chestCapacity(save)` ; outils et piles fusionnées passent toujours. Mettre à jour les appels existants (`useGardenActions`).
  - `type Refusal = "po" | "place" | "deja"`
  - `buySachet(save, id: SachetId, rng): { save: PotagerSave; seeds: Seed[]; toChest: boolean } | { refused: Refusal }` : vérifie les PO, tire les 3 graines, les range dans le sac (`addSeed`) puis le surplus au coffre (fusion par rareté, nouvelle pile seulement si place) ; si tout ne rentre pas : `{ refused: "place" }` avant tout débit.
  - `buyParcel(save, id: ParcelId): PotagerSave | { refused: Refusal }` : ajoute la parcelle et ses cases en herbe (`parcelCells`), débite `PARCEL_PRICE[id]` ; parcelle déjà possédée : `"deja"`.
  - `buyTool(save, id: ToolId): PotagerSave | { refused: Refusal }` : passe l'outil à `level: 2` qu'il soit dans le sac ou au râtelier ; déjà niveau 2 : `"deja"`.
  - `buyStallUpgrade(save)`, `buyChestUpgrade(save)` : `PotagerSave | { refused: Refusal }` ; niveau maximal : `"deja"`.
  - `slotView` : un outil de niveau 2 a pour libellé `"Bêche niv. 2"` (idem arrosoir, serfouette).

- [ ] **Step 1: Écrire les tests qui échouent**
  - `stall.test.ts` : pile de 3 Roses rouges belles sur une réserve qui en a 4 identiques : 5 + 2 ; réserve pleine (6 piles complètes) : `null`, sauvegarde identique ; pile de graines : `null` ; `unstockStall` sac plein : `null`.
  - `shop.test.ts` :
    - **Review Focus** : `po === 15`, sachet simple : accepté, `po` 0, 3 graines ; `po === 14` : `{ refused: "po" }`.
    - **Review Focus** : sac plein sans pile de graines incomplète et coffre plein sans pile de graines de ces raretés : `{ refused: "place" }`, `po` intact.
    - sac plein, coffre avec place : graines au coffre, `toChest: true`.
    - sachet de luxe sur 200 tirages : jamais de commune.
    - `buyParcel("p1")` à 80 PO : `parcels` contient `p1`, toutes ses cases sont `{ kind: "herbe" }` ; deuxième achat : `"deja"`.
    - `buyTool("beche")` bêche au râtelier : niveau 2 au râtelier ; dans le sac : niveau 2 dans le sac, même case.
    - `buyStallUpgrade` : 6 puis 9 (60 PO) puis 12 (200 PO) puis `"deja"` ; idem coffre 12, 18 (80), 24 (250).
  - `inventory.test.ts` :
    - **Review Focus** : coffre de 14 piles (au-dessus de la capacité 12) : `withdrawStack` fonctionne, `deposit` d'une nouvelle pile : `null`, `deposit` qui complète une pile existante : passe.
    - `slotView` d'une bêche niveau 2 : libellé `"Bêche niv. 2"`.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): réserve de l'étal, coffre limité et achats`

---

### Task 4: Cibles étal, cabane et panneau ; outils de niveau 2

**Files:**

- Modify: `src/potager/core/actions.ts`, `src/potager/core/catalog/map.ts`
- Test: `src/potager/core/actions.test.ts`

**Interfaces:**

- Consumes: Task 1 (`Tool.level`), `MAP.buildings`, `parcelCells`.
- Produces:
  - `parcelSign(id: ParcelId): Point` dans `map.ts` : centre du rectangle de la parcelle.
  - `Target` + `{ kind: "etal" }`, `{ kind: "cabane" }`, `{ kind: "panneau"; parcel: ParcelId }`.
  - `Gesture` + `"etal" | "cabane" | "panneau" | "servir"` (`servir` n'est jamais rendu par `prepareAction` ; c'est le mini-jeu lancé depuis le panneau de l'étal).
  - `findTarget` : après les cases, l'abri et le puits, l'étal et la cabane à moins de `REACH` de leur rectangle (même calcul que `abriGap`), puis le panneau d'une parcelle non possédée à moins de `REACH` de `parcelSign`.
  - `standPoint` : devant l'étal et la cabane (`z + d/2 + 0.6`), devant le panneau (`z + 0.6`).
  - `prepareAction` : `etal`, `cabane`, `panneau` rendent le geste du même nom, sans condition.
  - `toolCells(save, key: string, dir: Point, hand: number): string[]` : la case visée, plus, si l'outil en main est de niveau 2 et que le geste de la case visée est `becher`, `arroser` ou `desherber`, ses deux voisines perpendiculaires à `dir` (`|dir.x| >= |dir.z|` : lignes `row ± 1`, sinon colonnes `col ± 1`) qui existent dans `save.cells` et pour lesquelles `prepareAction` rend le même geste.
  - `applyAction(save, target, gesture, result, selectedSlot, rng, dir: Point = { x: 0, z: -1 })` : pour `becher`, `arroser` et `desherber`, le résultat s'applique à chaque case de `toolCells` ; l'arrosage ne consomme qu'**un** arrosage pour toutes.

- [ ] **Step 1: Écrire les tests qui échouent** (`actions.test.ts`)
  - avatar devant l'étal : `findTarget` rend `{ kind: "etal" }`, `prepareAction` rend `{ gesture: "etal" }` ; idem cabane.
  - avatar sur `parcelSign("p1")` sans posséder `p1` : `{ kind: "panneau", parcel: "p1" }` ; avec `p1` possédée : une case de `p1`.
  - bêche niveau 2 en main, case herbe au milieu d'une ligne, `dir` vers le haut : `toolCells` rend 3 cases de la même ligne ; après `applyAction("becher")` les 3 sont bêchées.
  - bêche niveau 1 : une seule case.
  - **Review Focus** : case au bord gauche de la parcelle, `dir` vers le haut : 2 cases, toutes présentes dans `save.cells`.
  - voisine avec une mauvaise herbe pendant un bêchage niveau 2 : sautée (reste en herbe, herbe intacte).
  - arrosoir niveau 2 sur 3 plantes : 3 cases humides, un seul arrosage consommé ; voisine bêchée sans plante : sautée.
  - serfouette niveau 2, herbe sur la case visée et une voisine : les 2 herbes arrachées.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core` - Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager/core` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): étal, cabane et panneaux comme cibles ; outils de niveau 2`

---

### Task 5: Mini-jeu « Nouer le ruban »

**Files:**

- Create: `src/potager/core/minigames/ruban.ts`, `src/potager/ui/minigames/drawRuban.ts`
- Modify: `src/potager/ui/minigames/minigameKit.ts`
- Test: `src/potager/core/minigames/minigames.test.ts`

**Interfaces:**

- Consumes: `Minigame`, `Input` (`core/minigames/types.ts`), `MW` et `drawGrade` de `drawMinigames.ts`.
- Produces:
  - `interface RubanView { angle: number; knot: number; pass: 0 | 1; hits: number[] }` (angles en radians).
  - `createRuban(rng: () => number): Minigame<RubanView>` : l'aiguille fait un tour en `1.1` s au premier passage, `0.75` s au second ; pause de `0.25` s avant chaque passage ; le nœud est tiré par `rng` à chaque passage. Un appui pendant un passage note l'écart angulaire `d` : `d < 0.18` rad vaut 2, `d < 0.45` vaut 1, sinon 0, et clôt le passage ; un tour complet sans appui vaut 0. Somme des deux : `>= 4` parfait, `>= 2` bien, sinon raté. Durée totale au plus `0.25 + 1.1 + 0.25 + 0.75` = 2,35 s.
  - `drawRuban(c, v: RubanView)` : cadran circulaire, nœud doré, aiguille, style des autres dessins.
  - `GameGesture` + `"servir"` ; `createGame("servir")` rend `as(createRuban(Math.random), drawRuban)`.

- [ ] **Step 1: Écrire les tests qui échouent** (`minigames.test.ts`, `dt` de 1/60 simulé, rng fixe)
  - deux appuis pile sur le nœud : `parfait`.
  - aucun appui : `rate` en au plus 2,4 s simulées.
  - un appui parfait puis rien : `bien`.
  - appui pendant la pause : ignoré.
- [ ] **Step 2: Lancer, constater l'échec** - Run: `bun run test src/potager/core/minigames` - Expected: FAIL.
- [ ] **Step 3: Implémenter** `ruban.ts`, `drawRuban.ts` et le cas `servir` du kit.
- [ ] **Step 4: Relancer** - Run: `bun run test src/potager && bunx tsc --noEmit` - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(potager): mini-jeu Nouer le ruban`

---

### Task 6: Panneaux de prix, clients et surbrillance dans la scène

**Files:**

- Create: `src/potager/render/clients.ts`
- Modify: `src/potager/textures/avatar.ts`, `src/potager/textures/buildings.ts`, `src/potager/render/village.ts`, `src/potager/render/highlight.ts`, `src/potager/render/createPotagerScene.ts`

**Interfaces:**

- Consumes: Tasks 1, 4 (`parcelSign`, cibles), `PARCEL_PRICE`, `CLIENT_LOOKS`, `signTex`, `spriteMesh`.
- Produces:
  - `avatarViews(palette: Record<string, string> = PAL)` : mêmes vues, couleurs prises dans `palette`. `CLIENT_PALETTES: Record<string, string>[]` (longueur `CLIENT_LOOKS`) dans `textures/avatar.ts` : cheveux, tunique et pantalon différents de l'avatar.
  - `priceSignTex(price: number): THREE.Texture` dans `buildings.ts` : panneau de bois planté avec « 80 PO ».
  - `buildPlaced` : sur chaque parcelle non possédée, le panneau de prix debout à `parcelSign(id)`.
  - `createClients(scene: THREE.Scene)` dans `render/clients.ts` : `{ sync(client: Client | null): void; update(dt: number): void; waiting(): Point | null; dispose(): void }` (`waiting` : position du client arrivé devant l'étal, `null` en route ou absent). Un nouveau client marche depuis l'entrée ouest du chemin du milieu jusque devant l'étal (point fixe à gauche du point où se tient l'avatar), y attend en pose idle, et repart vers l'ouest quand `client` passe à `null` ; mêmes animations de course que l'avatar. Pas de recherche de chemin : trajet en ligne droite le long du chemin du milieu.
  - `createPotagerScene` : `clients.sync(save.client)` dans `sync`, `clients.update(dt)` dans `frame`, en mode jeu comme en fond passif ; `PotagerScene` + `clientSpot(): Point | null` (relais de `waiting`).
  - `highlight.set` : cadre pour `etal` et `cabane` (rectangle du bâtiment, comme l'abri) et anneau pour `panneau`.

- [ ] **Step 1: Implémenter.**
- [ ] **Step 2: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS.
- [ ] **Step 3: Vérifier dans l'aperçu** : partie neuve (vider `localStorage`), ouvrir le Potager. Les panneaux « 80 PO », « 250 PO », « 600 PO » sont plantés sur `p1`, `p2`, `p3` ; l'étal, la cabane et un panneau s'éclairent quand l'avatar s'en approche. Dans la console, donner des fleurs à la réserve et un Herbier non vide (via le shim du stockage) : un client arrive à l'étal, attend, repart quand la réserve est vidée. Capture d'écran.
- [ ] **Step 4: Commit** - `feat(potager): panneaux de prix et clients dans la scène`

---

### Task 7: Étal, cabane, parcelles et PO dans l'interface

**Files:**

- Create: `src/potager/ui/usePanel.ts`, `src/potager/ui/useEconomy.ts`, `src/potager/ui/demandLabel.ts` (« Une Rose rouge », accord par `colorName`), `src/potager/ui/EtalPanel.tsx`, `src/potager/ui/CabanePanel.tsx`, `src/potager/ui/ParcelSignPanel.tsx`, `src/potager/ui/PoCounter.tsx`, `src/potager/ui/GainPop.tsx`
- Modify: `src/potager/ui/useGardenActions.ts`, `src/potager/ui/minigames/minigameKit.ts`, `src/potager/ui/PotagerGame.tsx`, `src/potager/ui/PotagerHud.tsx`, `src/potager/ui/AbriPanel.tsx`

**Interfaces:**

- Consumes: Tasks 2 à 5.
- Produces:
  - `type Panel = { kind: "abri" } | { kind: "etal" } | { kind: "cabane" } | { kind: "panneau"; parcel: ParcelId }`.
  - `usePanel(scene)` : `{ panel: Panel | null; open(p: Panel): void; close(): void }` ; Échap ferme ; s'éloigner à plus de `REACH + 1` de l'élément ferme (logique actuelle de l'abri, généralisée). `useGardenActions` remplace `abriOpen` par ce hook : les gestes `abri`, `etal`, `cabane`, `panneau` ouvrent le panneau correspondant ; un panneau ouvert bloque les actions, pas la marche.
  - `useGardenActions` expose `play(gesture: "servir", onDone: (r: MinigameResult) => void)` : lance le mini-jeu ancré sur l'étal ; `ActiveGame` gagne `onDone?: (r) => void` appelé à la place de `apply` quand il est présent. `ActiveGame` mémorise aussi `dir` (direction de l'avatar au lancement) passée à `applyAction`.
  - `useEconomy(host, say)` : `stock(slot)`, `unstock(i)`, `serve(stallIndex, grade)` (retourne le gain), `buySachet(id)` (retourne les graines), `buyParcel(id)`, `buyTool(id)`, `upgradeStall()`, `upgradeChest()`. Chaque refus affiche son message dans la bulle de l'avatar : « Pas assez de PO », « Plus de place pour les graines », « La réserve est pleine », « Ton sac est plein », « Le coffre est plein », « Déjà acheté ». Un sachet rangé en partie au coffre : « Sac plein : graines rangées à l'abri ».
  - `EtalPanel` : sac (clic pour mettre en réserve), réserve (clic pour reprendre), compteur « 4 / 6 piles » et bouton « Agrandir la réserve (60 PO) » (masqué au niveau max). Avec un client : sa demande (sprite de la fleur et nom, par exemple « Une Rose rouge »), et sur chaque pile de la réserve un bouton « Servir » ; les piles qui partagent l'espèce, la couleur ou les deux portent la mention « Bonne espèce », « Bonne couleur » ou « Double bonus ». Servir ferme le panneau, joue le ruban, puis appelle `serve`.
  - `CabanePanel` : trois sachets (libellé, prix), bouton « Acheter » ; trois outils de niveau 2 (« Bêche niv. 2 : bêche 3 cases », « Arrosoir niv. 2 : arrose 3 cases », « Serfouette niv. 2 : désherbe 3 cases », 120 PO, « Acquis » une fois acheté). Acheter un sachet ferme le panneau et lance l'ouverture (Task 8 ; d'ici là, une bulle « 3 graines obtenues »).
  - `ParcelSignPanel` : « Acheter cette parcelle pour 80 PO ? », boutons « Acheter » et « Annuler » ; PO insuffisants : bouton inactif et « Il te manque 30 PO ».
  - `AbriPanel` : compteur « 9 / 12 piles » et bouton « Agrandir le coffre (80 PO) ».
  - `PoCounter` : bandeau HD-2D sous le bouton Herbier, « 125 PO ».
  - `GainPop` : « +14 PO » qui monte et s'efface au-dessus de l'étal (position via `scene.project`).
  - Bulle de demande (spec 2.3) : `AvatarBubble` réutilisé au-dessus du client (`where` = `scene.project(scene.clientSpot())`), « Une Rose rouge », affichée tant que le client attend et qu'aucun panneau ni mini-jeu n'est ouvert.
  - Tous les panneaux suivent `PANEL_STYLE` et la mise en page d'`AbriPanel`.

- [ ] **Step 1: Implémenter.**
- [ ] **Step 2: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS.
- [ ] **Step 3: Vérifier dans l'aperçu** (partie neuve, puis PO et fleurs donnés via le stockage du shim pour aller vite) :
  - mettre des fleurs en réserve ; un client arrive ; servir la bonne fleur avec un ruban parfait : le gain affiché suit `salePrice`, le compteur de PO monte ;
  - reprendre toute la réserve pendant qu'un client attend : il repart ;
  - acheter un sachet, la parcelle `p1`, la bêche niv. 2 (bêcher 3 cases d'un coup), un agrandissement de réserve et de coffre ; chaque refus affiche son message ;
  - s'éloigner d'un panneau ouvert le ferme. Capture d'écran de l'étal avec un client.
- [ ] **Step 4: Commit** - `feat(potager): vente à l'étal, cabane à graines et achat de parcelles`

---

### Task 8: Ouverture des sachets façon cartes

**Files:**

- Create: `src/potager/ui/sachets/` (fichiers restaurés et adaptés, voir ci-dessous)
- Modify: `src/potager/ui/PotagerGame.tsx`, `src/potager/ui/CabanePanel.tsx`

**Interfaces:**

- Consumes: `buySachet` (Task 3) via `useEconomy` (Task 7), `RARITY_COLOR`, `RARITY_LABEL`, `PANEL_STYLE`.
- Produces:
  - Restaurer depuis `git show cb54073^:<chemin>` : `src/garden/ui/sachets/{TearablePack,RevealStage,RevealCard,CardBack,BurstLayer,PackSummary,burst,packFlow}.ts(x)` et leurs tests `burst.test.ts`, `packFlow.test.ts`, `src/garden/ui/cards/{cardFx,useCardFx,LiveSprite}.ts(x)`, `src/garden/sprites/seed.ts` et `seed.test.ts`. Les placer sous `src/potager/ui/sachets/` (sprite de graine compris), imports et types rebranchés sur `src/potager/core` (`Rarity`, `RARITY_COLOR`). Ne pas restaurer `PackStack`, `EmptyPack`, le pity ni le sachet famille.
  - `SachetOpening({ sachet: SachetId; seeds: Seed[]; onClose: () => void })` : déchirure (glisser ou clic), pile de 3 cartes face cachée au dos teinté par la rareté, retournement carte par carte, récapitulatif avec « Continuer ». La face montre la graine de la rareté et « Graine rare », jamais l'espèce ni la couleur. Le sachet est déjà payé et les graines déjà rangées : fermer à tout moment ne perd rien. Visuel du sachet par gamme : kraft (simple), imprimé (bon), doré (luxe).
  - Style HD-2D : fond sombre à filet doré, police Cormorant Garamond, comme `PANEL_STYLE`.
  - `PotagerGame` : l'ouverture bloque les actions et la marche comme un mini-jeu.

- [ ] **Step 1: Restaurer les fichiers et leurs tests, adapter les imports** - Run: `bun run test src/potager/ui/sachets` - Expected: PASS (tests de `burst`, `packFlow`, `seed` restaurés).
- [ ] **Step 2: Écrire `SachetOpening` et le brancher sur l'achat à la cabane.**
- [ ] **Step 3: Vérifier** - Run: `bunx tsc --noEmit && bun run lint && bun run test` - Expected: PASS.
- [ ] **Step 4: Vérifier dans l'aperçu** : acheter un sachet de chaque gamme ; la déchirure, les dos teintés, le retournement et le récapitulatif s'enchaînent ; aucune carte ne montre d'espèce ni de couleur ; les 3 graines sont dans le sac (ou au coffre si le sac est plein). Capture d'écran d'une carte rare retournée.
- [ ] **Step 5: Commit** - `feat(potager): ouverture des sachets façon cartes`
