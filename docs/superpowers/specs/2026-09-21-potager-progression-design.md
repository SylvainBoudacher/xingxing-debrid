# Potager - Sous-projet 5 : arbre de progression et tâches

**Vision :** [docs/superpowers/specs/2026-09-16-potager-automne-vision-design.md](2026-09-16-potager-automne-vision-design.md), section 2.7.
**Maquette :** `docs/superpowers/mockups/potager-automne/progression.html` (validée le 2026-09-16).

## 1. Intention

Donner au Potager sa colonne vertébrale : un arbre de chemins sans choix, dont chaque nœud porte une tâche et une récompense. Réussir une tâche ouvre les nœuds suivants. Les récompenses agrandissent le champ, garnissent le décor et ajoutent des sachets, de sorte que le joueur voit son potager changer.

Le périmètre est le **noyau branchable** : on n'implémente que les récompenses qui se branchent sur des systèmes existants. Les outils améliorés, les bonus de pousse et l'épouvantail attendent le sous-projet des outils ; les hybrides attendent l'atelier.

## 2. Modèle de données

`progress.nodes` existe déjà et n'a jamais servi. Il devient `Record<NodeId, number>`, l'horodatage de récupération ; absent veut dire non récupéré. Un champ s'ajoute pour les paniers :

```ts
progress: {
  nodes: Record<NodeId, number>;
  counters: Record<CounterId, number>;
  baskets: Record<NodeId, Partial<Record<SpeciesId, number>>>;
}
```

`parseSave` tolère `baskets` absent et le remplace par `{}`, exactement comme il tolère déjà `leaves`. La sauvegarde reste en **`version: 1`** : une partie existante se charge sans rien perdre.

Types associés :

```ts
export type NodeId = string; // ASCII, ex. "j1", "c3"
export type BranchId = "jardin" | "collection" | "decor" | "champ";
export type NodeState = "verrouille" | "ouvert" | "pret" | "termine";

export interface TreeNode {
  id: NodeId;
  branch: BranchId;
  parent?: NodeId; // absent pour la racine
  x: number; // espace 1000 x 640, racine en bas
  y: number;
  title: string;
  icon: SpriteRef;
  task: Task;
  reward: Reward;
}

export type Task =
  | { kind: "counter"; id: CounterId; target: number }
  | { kind: "herbier"; measure: HerbierMeasure; target: number }
  | { kind: "panier"; items: { species: SpeciesId; count: number }[] };

export type HerbierMeasure = "entrees" | "raretes" | "familles" | "variantes";

export type Reward =
  | { kind: "sachet-quotidien" }
  | { kind: "sachet"; sachet: SachetType }
  | { kind: "parcelle"; plot: PlotId }
  | { kind: "decor"; decor: DecorId; count: number }
  | { kind: "graines"; rarity: Rarity; count: number };
```

`SachetType` passe de `"quotidien"` à `"quotidien" | "dore" | "famille"`. `DecorId` passe à `"lanterne" | "citrouille" | "paille" | "cloture" | "arbre"`. `PlotId` passe à `"p1" | "p2" | "p3" | "p4"`.

## 3. Moteur

### 3.1 `core/catalog/tree.ts`

Table de données seule, aucune logique. 17 nœuds, positions et liens repris de la maquette.

### 3.2 `core/progression.ts`

Fonctions pures, aucune source de hasard implicite.

```ts
stateOf(save: GardenSave, node: TreeNode): NodeState
progressOf(save: GardenSave, node: TreeNode): { value: number; target: number }
claim(save: GardenSave, id: NodeId, rng: Rng): GardenSave | null
deposit(save: GardenSave, id: NodeId, species: SpeciesId): GardenSave | null
readyCount(save: GardenSave): number
openNodes(save: GardenSave): TreeNode[]
```

- `stateOf` : `termine` si `progress.nodes[id]` existe ; sinon `verrouille` si le parent n'est pas `termine` ; sinon `pret` si `progressOf` atteint la cible, sinon `ouvert`. La racine n'a pas de parent, donc jamais `verrouille`.
- `progressOf` lit, selon la tâche, `progress.counters[id]`, une mesure de l'Herbier, ou la somme des dépôts du panier.
- `claim` renvoie `null` si l'état n'est pas `pret` ; sinon applique la récompense et écrit `progress.nodes[id] = now`. Le `rng` ne sert qu'à la récompense `graines`.
- `deposit` renvoie `null` si le nœud n'est pas un panier ouvert, si l'espèce n'est pas demandée, si sa case est déjà pleine, ou si aucune fleur de cette espèce n'est dans le panier. Sinon retire **une** fleur de `inventory.basket` (la première de cette espèce) et incrémente le dépôt.

### 3.3 Mesures de l'Herbier

Dérivées de `save.herbier`, jamais comptées :

- `entrees` : nombre d'entrées découvertes ;
- `raretes` : entrées dont la couleur est rare ou mieux ;
- `familles` : espèces dont toutes les couleurs du catalogue sont découvertes ;
- `variantes` : entrées ayant au moins une variante spéciale.

Elles restent justes même si un compteur a été raté ou si une sauvegarde ancienne est chargée.

### 3.4 Compteurs

`counters.ts` gagne `bloomed`, `nightBloom` et `pickedBeautiful`.

`pickedBeautiful` est posé dans `pickFlower`, où `beautiful` est déjà calculé.

`bloomed` et `nightBloom` demandent de savoir qu'une plante vient d'éclore. `collectDiscoveries` devient un scan de champ qui, pour toute plante atteignant l'étape 4 sans `bloomedAt`, écrit `bloomedAt: now` sur la case, incrémente `bloomed`, et incrémente `nightBloom` si l'heure locale de `now` est 18 h ou plus. `PlantTile` gagne donc `bloomedAt?: number`. Le marquage rend le comptage idempotent d'un tick à l'autre. Le fond passif appelle le même scan mais n'écrit jamais la sauvegarde, donc rien ne diverge.

### 3.5 `core/unlocks.ts`

Lit `progress.nodes` et répond aux questions des autres systèmes. Une seule aujourd'hui :

```ts
sachetsPerDay(save: GardenSave): number   // 1, ou 2 après le nœud "Main verte"
```

`creditDaily(save, now, perDay)` prend ce nombre en paramètre au lieu d'importer la progression : `sachets.ts` n'a alors aucune dépendance vers `progression.ts`, qui lui importe `MAX_PENDING`. Pas de cycle.

### 3.6 Application des récompenses

- `sachet-quotidien` : rien à écrire, `sachetsPerDay` le déduit du nœud récupéré.
- `sachet` : ajoute un sachet du type donné à `sachets.pending`, dans la limite de `MAX_PENDING`.
- `parcelle` : ajoute l'identifiant à `save.plots`.
- `decor` : `inventory.decor[id] += count`.
- `graines` : tire `count` graines de la rareté demandée avec `rng` et les ajoute à `inventory.seeds`. `rolls.ts` gagne pour cela `rollSeedOfRarity(rarity, rng)`, qui choisit une entrée du catalogue parmi celles de cette rareté. Ces graines **ne touchent pas les jauges de pity** : seuls les sachets les font bouger.

### 3.7 Sachets spéciaux

Le tirage reste dans `rolls.ts` et `sachets.ts`, avec le type de sachet en paramètre :

- `quotidien` : inchangé.
- `dore` : la première des trois graines est forcée à rare ou mieux, la répartition rare / épique / légendaire garde ses proportions habituelles ; les deux autres sont normales.
- `famille` : une espèce est tirée uniformément dans le catalogue, puis les trois graines tirent leur couleur dans cette espèce selon la rareté habituelle.

Dans les trois cas les deux jauges évoluent comme aujourd'hui, graine par graine.

## 4. L'arbre

17 nœuds, quatre branches, positions dans l'espace 1000 x 640 de la maquette (racine en bas).

| id     | branche    | parent | x, y     | titre                 | tâche                                         | récompense             | icône                 |
| ------ | ---------- | ------ | -------- | --------------------- | --------------------------------------------- | ---------------------- | --------------------- |
| `root` | champ      | -      | 500, 575 | Le potager s'éveille  | compteur `sown` >= 1                          | 3 graines communes     | `graine` cream        |
| `j1`   | jardin     | `root` | 330, 470 | Main verte            | compteur `bloomed` >= 5                       | 2e sachet du jour      | `pousse`              |
| `j2`   | jardin     | `j1`   | 190, 380 | Arrosoir bien rempli  | compteur `watered` >= 20                      | 1 sachet doré          | `arrosoir`            |
| `j3`   | jardin     | `j2`   | 110, 260 | Tas de compost        | compteur `raked` >= 30                        | 4 bottes de paille     | `rateau`              |
| `j4`   | jardin     | `j2`   | 250, 240 | Belles plantes        | compteur `pickedBeautiful` >= 5               | 3 graines rares        | `bouton` white        |
| `h1`   | collection | `root` | 420, 400 | Herbier ouvert        | herbier `entrees` >= 5                        | 1 sachet de famille    | `aster` violet        |
| `h2`   | collection | `h1`   | 380, 280 | Œil du collectionneur | herbier `raretes` >= 1                        | 1 sachet doré          | `dahlia` violet       |
| `h3`   | collection | `h2`   | 330, 150 | Première famille      | herbier `familles` >= 1                       | 1 graine légendaire    | `tournesol` yellow    |
| `h4`   | collection | `h2`   | 450, 170 | Fleur givrée          | herbier `variantes` >= 1                      | 1 sachet de famille    | `colchique` white     |
| `d1`   | decor      | `root` | 580, 400 | Clôture               | compteur `picked` >= 10                       | 12 segments de clôture | `cloture`             |
| `d2`   | decor      | `d1`   | 620, 280 | Lueurs du soir        | compteur `nightBloom` >= 3                    | 4 lanternes            | `lanterne`            |
| `d3`   | decor      | `d1`   | 520, 250 | Récolte d'automne     | compteur `picked` >= 25                       | 6 citrouilles          | `citrouille`          |
| `d4`   | decor      | `d2`   | 640, 150 | Panier des vendanges  | panier : 2 dahlias, 2 cosmos, 1 aster         | 2 arbres               | `tas`                 |
| `c1`   | champ      | `root` | 690, 470 | Deuxième parcelle     | herbier `entrees` >= 8                        | parcelle p2            | `jeune`               |
| `c2`   | champ      | `c1`   | 800, 370 | Panier du jardinier   | panier : 2 chrysanthèmes, 2 sedums, 1 bruyère | 3 graines rares        | `secateur`            |
| `c3`   | champ      | `c1`   | 900, 290 | Troisième parcelle    | herbier `entrees` >= 20                       | parcelle p3            | `rosetremiere` pink   |
| `c4`   | champ      | `c3`   | 860, 150 | Grand champ           | herbier `entrees` >= 35                       | parcelle p4            | `chrysantheme` bronze |

Couleurs des branches, reprises de la maquette : Jardinage `#8fcf5a`, Collection `#b58ae6`, Décor `#f0a050`, Champ `#d9b46a`.

## 5. Les parcelles et le champ

| Parcelle | Rectangle (x, y, l, h) | Cases | Champ après |
| -------- | ---------------------- | ----- | ----------- |
| p1       | 1, 1, 6, 4             | 24    | 9 x 5       |
| p2       | 8, 1, 4, 4             | 16    | 13 x 5      |
| p3       | 1, 5, 6, 4             | 24    | 13 x 9      |
| p4       | 8, 5, 4, 4             | 16    | 13 x 9      |

Les quatre parcelles forment un carré, séparées par une allée d'herbe en x = 7 et bordées par la rangée y = 0. 80 cases de terre au total contre 24 au départ. Le champ ne s'agrandit que deux fois : à p2 en largeur, à p3 en profondeur.

- `FIELD`, aujourd'hui une constante, devient `fieldRect(plots)`, lu dans une table indexée par le nombre de parcelles débloquées. Les appelants (`fieldTiles`, `isInField`, les corbeaux, les feuilles) prennent les parcelles en paramètre.
- Le cadrage de la caméra se déduit du rectangle du champ : `render/framing.ts`, fonction pure partagée par la fenêtre Potager et le fond passif, qui donne le centre du champ et le recul pour qu'il remplisse l'image.
- La rangée de clôture décorative suit la largeur du champ.
- La toile du sol ne bouge pas : `WORLD` couvre déjà x -5 à 13 et y -4 à 7, plus que le champ final.

## 6. L'outil Décor

Un septième outil, `decor` côté code, "Décor" à l'écran, icône `lanterne`. Il n'apparaît dans la barre que si `inventory.decor` contient au moins un objet : l'inventaire tient lieu de déblocage, aucun drapeau à stocker.

Le panneau latéral, qui liste déjà les graines par rareté pour l'outil Semer, liste les décors possédés et leur nombre pour l'outil Décor. Le clic sur une case pose l'objet sélectionné et décrémente l'inventaire.

Refus, affichés tels quels dans l'infobulle :

- "choisis un décor dans le panneau" ;
- "il y a déjà quelque chose ici" ;
- "pas sur la terre d'une parcelle" ;
- "un arbre ne se plante qu'en bordure du champ" (l'arbre mesure trois cases de large et masquerait le champ).

La main reprend un décor posé et le remet dans l'inventaire, y compris les cinq décors de la sauvegarde de départ, qui deviennent déplaçables.

## 7. La page Progression

Quatrième onglet, après Sachets, avec une pastille comptant les nœuds prêts (`readyCount`).

**Bandeau de résumé :** paliers récupérés sur 17 avec barre, Herbier sur 62, parcelles sur 4, sachets à ouvrir, et la liste des objectifs en cours (`openNodes`).

**Arbre :** espace 1000 x 640 mis à l'échelle de son conteneur. Lianes en courbes SVG calculées par `vines.ts`, module pur. Nœuds en boutons positionnés en pourcentage, quatre états :

- `verrouille` : graine grise, tâche masquée ;
- `ouvert` : icône du nœud entourée d'un arc de progression ;
- `pret` : même bouton, couleur de la branche, pulsation ;
- `termine` : fleur éclose.

**Détail à droite :** titre, tâche en clair, avancement chiffré, récompense, bouton "Récupérer" quand le nœud est prêt. Pour un panier, les cases à remplir espèce par espèce et un bouton "Déposer" actif seulement si la fleur demandée est dans le panier. La récupération fait éclore la fleur du nœud avec `motion/react` et annonce la récompense par un toast.

**Découpage**, un fichier par composant dans `src/garden/ui/progression/` : `ProgressionPage.tsx`, `SummaryBar.tsx`, `TreeView.tsx`, `TreeNode.tsx`, `NodeDetail.tsx`, `BasketDeposit.tsx`, plus `vines.ts` et `branch.ts` (couleurs et libellés des branches).

## 8. Erreurs

- `claim` et `deposit` renvoient `null` quand l'action est impossible ; le réducteur ignore, l'interface désactive déjà le bouton.
- Les refus de l'outil Décor passent par `planAction` comme tous les autres outils, avec leur raison en français.
- Sauvegarde : `baskets` absent devient `{}` ; une parcelle inconnue dans `plots` est ignorée par `fieldRect` et `soilTiles`.

## 9. Tests

- `progression.test.ts` : les quatre états, l'avancement, la récupération pour les cinq sortes de récompenses, les paniers (dépôt partiel, dépôt refusé, panier complet, récupération).
- `catalog/tree.test.ts` : identifiants uniques, parent existant, pas de cycle, chaque récompense pointe une parcelle ou un décor du catalogue, chaque panier une espèce du catalogue, positions dans 1000 x 640.
- `unlocks.test.ts` : `sachetsPerDay` avant et après `j1`, et le crédit quotidien qui en découle.
- `plots.test.ts` : `fieldRect` pour une à quatre parcelles, `isSoil`, `isInField`.
- Cadrage de caméra : fonction pure, les quatre tailles de champ.
- Scan de champ : `bloomed` et `nightBloom` comptés une seule fois par plante, `bloomedAt` idempotent sur plusieurs ticks.
- `rolls.test.ts` : sachet doré (au moins une graine rare ou mieux), sachet de famille (trois graines de la même espèce).
- `actions.test.ts` : poser un décor, les quatre refus, reprendre un décor à la main.
- `vines.test.ts` : chemins SVG sur des coordonnées connues.
- `accents.test.ts` : ajout de `decor`, `depose`, `deposer`, `eclose`, `ecloses`, `pret`, `recolte`, `termine`, `verrouille` à la liste `WRONG`.

Le reste (arbre, page, animations) se vérifie dans l'aperçu navigateur, comme aux sous-projets précédents.

## 10. Écarts par rapport à la vision et à la maquette

- Les seuils de découverte passent de 12 / 30 / 60 à 8 / 20 / 35 : le catalogue ne compte que 62 entrées, 60 revenait à exiger l'Herbier presque complet pour la dernière parcelle.
- Le nœud "Hybrideur" disparaît (les hybrides sont le sous-projet 6).
- "Après l'averse", "Allée de pierre", "Gardien du champ" disparaissent : la première demande un suivi de la pluie case par case, les deux autres un sprite et une mécanique absents. Trois nœuds les remplacent avec des récompenses branchables.
- Les récompenses de la branche Jardinage ne sont plus des outils améliorés (arrosoir de cuivre, compost, récupérateur d'eau) mais des sachets, des graines et du décor. Les outils reviendront se greffer sur cette branche.
- Les parcelles donnent +16, +24 et +16 cases au lieu de +16, +25 et +36 : le champ reste cadrable sans que les sprites deviennent minuscules.
- La maquette a trois états de nœud, la spec en a quatre : la récupération se fait à la main.

## 11. Hors périmètre

- Outils améliorés, bonus de pousse, épouvantail (sous-projet des outils).
- Atelier, recettes, hybrides (sous-projet 6).
- Sachets spéciaux périodiques et choix de l'espèce du sachet de famille.
- Nouveaux sprites de décor (allée de pierre, épouvantail).
