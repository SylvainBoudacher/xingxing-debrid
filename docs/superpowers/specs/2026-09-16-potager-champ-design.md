# Potager d'automne - Sous-projet 2 : onglet Champ

Date : 2026-09-16

Suite du socle (sous-projet 1). Référence : [vision](2026-09-16-potager-automne-vision-design.md), maquette [champ.html](../mockups/potager-automne/champ.html) (base visuelle : hotbar en bas, panneau à droite, infobulle).

## 1. Objectif et périmètre

Rendre le champ jouable dans la fenêtre Potager : six outils séparés, gestes en séquence (creuser, semer, arroser), cueillette, déplacement, corbeaux, tas de feuilles, incitations à l'arrosage et inscription des découvertes dans l'Herbier.

Dans le périmètre :

- Outils **Main, Creuser, Semer, Arroser, Sécateur, Râteau** (touches 1 à 6, Échap = Main).
- Cueillette vers le panier, avec chance fixe de graine de la même espèce.
- Déplacement des plantes et du décor (Main, maintenir et glisser).
- Corbeaux éphémères, tas de feuilles persistés.
- Incitation visuelle à l'arrosage : terre sèche craquelée, plante qui penche.
- Éclosion : inscription dans l'Herbier (données seulement) et toast de découverte.
- Compteurs de gestes pour les tâches futures.

Hors périmètre :

- Pressage et page Herbier (sous-projet 3). Le panier s'affiche sans bouton "Presser".
- Tirage complet des graines et pity (sous-projet 4).
- Tâches de l'arbre (sous-projet 5) : seuls les compteurs sont enregistrés.
- Outil Préparer (sous-projet 6) : il n'apparaît pas dans la hotbar.
- Nouvelles parcelles.

## 2. Règles de jeu

### 2.1 Graines

- Une seule pile "Graines xN" dans le panneau latéral. Semer prend la plus ancienne (`inventory.seeds[0]`).
- Espèce et couleur restent cachées jusqu'à l'éclosion.

### 2.2 Gestes

| Outil    | Cible valide                 | Effet                                          | Refus (texte affiché)                                                                   |
| -------- | ---------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Creuser  | terre libre                  | pose un trou (`hole`)                          | "la case est occupée" (terre), "seulement dans la terre" (herbe)                        |
| Semer    | trou, graine disponible      | plante `sownAt = now`, `watered = []`          | "creuse d'abord un trou" (terre libre), "il faut un trou" (ailleurs), "plus de graines" |
| Arroser  | case portant une plante      | ajoute `[now, now + 6 h]` à `watered` (fusion) | "rien à arroser, sème d'abord"                                                          |
| Sécateur | plante éclose à tige épaisse | cueillette                                     | "rien à couper ici", "tige fragile, cueille-la à la main"                               |
| Main     | plante éclose à tige fine    | cueillette                                     | "tige trop épaisse, prends le sécateur" ; sur un tas : "prends le râteau"               |
| Râteau   | tas de feuilles              | retire le tas                                  | "pas de feuilles ici"                                                                   |
| Tous     | corbeau                      | chasse le corbeau                              | -                                                                                       |

- Tiges épaisses (sécateur) : tournesol, rose trémière, dahlia, chrysanthème. Tiges fines (main) : les autres.
- Arroser une plante déjà mouillée prolonge l'effet jusqu'à `now + 6 h`.
- Avec la Main sur une plante non éclose ou un décor : pas de clic, l'infobulle indique "Maintenir et glisser pour déplacer".

### 2.3 Cueillette

- La plante quitte la case (la terre redevient libre), la fleur (`species`, `color`, `rarity`, `variant`) rejoint `inventory.basket`.
- Chance de graine : **30 %**, **45 %** si la plante est belle (au moins un moment mouillé à chaque étape). La graine a la même espèce, la même couleur et la même rareté que la fleur (provisoire, remplacé par le tirage au sous-projet 4).
- Toast : "Cosmos rose cueilli" et, le cas échéant, "+1 graine".

### 2.4 Déplacement

- Main, maintenir et glisser, sur une plante (à tout stade) ou un décor.
- Plante : uniquement vers une **terre libre**. Elle garde `sownAt` et `watered`.
- Décor : vers n'importe quelle case libre (herbe ou terre) de la grille du champ (`FIELD`, 9 x 5 cases).
- Trous et tas ne se déplacent pas.
- Relâcher sur une case refusée : l'objet revient à sa place, la raison s'affiche brièvement ("une plante ne va que sur de la terre", "la case est occupée").

### 2.5 Tas de feuilles

- Un créneau toutes les **3 h** de temps réel, même app fermée.
- Pour chaque créneau écoulé depuis `leaves.checkedAt` : s'il y a moins de **4** tas, un tas apparaît sur une case libre (herbe ou terre, jamais trou, plante ni décor), choisie par `hash(index du créneau)` parmi les cases libres triées.
- Un tas sur la terre bloque creuser et semer jusqu'au râteau.
- Calcul déterministe : les deux fenêtres voient les mêmes tas.

### 2.6 Corbeaux

- Présents seulement quand le Potager est ouvert et visible. Non enregistrés.
- Un corbeau se pose toutes les **2 à 5 minutes** (au hasard), **2** au maximum, sur une case libre ou une plante. Il repart seul au bout d'environ **90 s**.
- Aucun dégât. Le chasser incrémente `crowsChased`.

### 2.7 Éclosion

- À l'ouverture du Potager puis chaque minute : chaque plante éclose dont l'entrée `espece:couleur` n'existe pas dans `herbier` y est inscrite (`discoveredAt = now`, `pressed = 0`, `variants = []`, plus la variante si la graine en a une).
- Un toast par passage : "Nouvelle découverte : Cosmos rose (commune)", couleur de la rareté ; plusieurs découvertes sont regroupées dans le même toast.

### 2.8 Compteurs

`progress.counters` : `dug`, `sown`, `watered`, `picked`, `raked`, `crowsChased`, incrémentés à chaque geste réussi.

## 3. Architecture

### 3.1 Règles pures (`src/garden/core/`)

Aucun import React ni three.js.

- `species.ts` : `CUT_SPECIES` et `harvestTool(species): "main" | "secateur"`. Remplacé par le catalogue au sous-projet 3.
- `target.ts` : `describeTile(save, key, now)` renvoie `{ kind, title, lines, progress? }` avec `kind` parmi `grass | soil | hole | plant | decor | leaves`. Lignes : étape, "Prochaine étape dans ~1 h 20", "Mouillée encore 4 h" ou "Terre sèche", "Espèce et couleur inconnues", rareté et outil de cueillette une fois éclose.
- `actions.ts` :
  - `type Tool = "main" | "creuser" | "semer" | "arroser" | "secateur" | "rateau"`.
  - `type Target = { kind: "tile"; key: TileKey } | { kind: "crow"; id: string }`.
  - `planAction(save, target, tool, now, rng)` renvoie `{ ok: true; label; apply(): Outcome } | { ok: false; label; reason } | null` (`null` : aucune action, pas de ligne d'action dans l'infobulle).
  - `Outcome = { save: GardenSave; effects: Effect[] }` avec `Effect` = particules (`{ kind: "burst"; key; particle: "dirt" | "water" | "leaves" | "petals" | "feathers" }`), corbeau chassé (`{ kind: "chase"; id }`) ou toast (`{ kind: "toast"; text }`).
  - `planMove(save, from, to)` renvoie `{ ok: true; save } | { ok: false; reason }`.
  - Un refus ne modifie jamais la sauvegarde. La même fonction sert à l'infobulle et au clic.
- `rolls.ts` : `pickSeedChance(beautiful)` (0,30 ou 0,45) et `rollPickSeed(flower, beautiful, rng)`.
- `leaves.ts` : `LEAF_SLOT_MS`, `MAX_LEAVES`, `spawnLeaves(save, now)`. Seuls les `MAX_LEAVES` derniers créneaux sont examinés (le départ est ramené à `max(checkedAt, now - MAX_LEAVES x LEAF_SLOT_MS)`), puis `checkedAt` passe au début du créneau courant.
- `discovery.ts` : `entryId(species, color)`, `collectDiscoveries(save, now)` renvoie `{ save, found: Flower[] }`.
- `counters.ts` : `bump(save, counter)`.
- `types.ts` : ajout de `leaves: { checkedAt: number }` à `GardenSave`. `parseSave` le complète s'il manque (`checkedAt = 0`), `version` reste `1`. La sauvegarde de départ l'initialise à l'instant de création.
- `plots.ts` : ajout de `FIELD = { x: 0, y: 0, w: 9, h: 5 }`, la grille interactive (cases hors grille : aucune action, aucun tas, aucun corbeau) et `isInField(key)`.

### 3.2 Rendu (`src/garden/render/`)

- `picking.ts` : `pickAt(clientX, clientY)` renvoie un `Target` ou `null`. Raycast sur les billboards avec test de transparence du pixel (alpha du canvas source), puis corbeaux, puis plan du sol arrondi à la case. Hors grille : `null`.
- `particles.ts` : éclats courts portés depuis `hd2dfield.js` (terre, eau, feuilles, pétales, plumes), mis à jour dans la boucle de rendu.
- `crows.ts` : billboards éphémères hors `sceneModel`, `add(id, key)`, `chase(id)` (envol et plumes), `remove(id)`.
- `interaction.ts` : branché uniquement sur le profil `garden`. Regroupe picking, surbrillance (cadre pixel au sol, vert si possible, ocre si refusé), soulèvement (`lift`, `moveLifted`, `drop`, `cancel`), particules et corbeaux.
- `GardenScene` expose en plus `interaction?: GardenInteraction` (absent pour le profil `backdrop`).
- `sceneModel.ts` : `SceneItem.thirsty` pour une plante non éclose et non mouillée ; `SceneModel.dry` (cases de ces plantes). `billboards` incline les plantes assoiffées d'environ 8° avec un balancement plus mou. `ground.setDry(keys)` pose la tuile de terre sèche craquelée (nouvelle tuile dans `sprites/ground.ts`).
- Le fond passif applique `spawnLeaves` en mémoire avant `sync`, sans écrire.

### 3.3 Interface (`src/garden/ui/`)

Un composant par fichier, textes français accentués.

- `gardenReducer.ts` (pur) : actions `load`, `apply(outcome)`, `move(from, to)`, `tick(now)` (découvertes puis feuilles). Remplace le `useState` de la sauvegarde dans `GardenApp`, qui garde chargement, planificateur d'écriture et fermeture.
- `FieldView.tsx` : toile, pointeur, mise en page (scène, hotbar en bas, panneau à droite). Survol : `pickAt` puis `describeTile` et `planAction`. Clic : `apply` puis effets. Maintien avec la Main sur un objet déplaçable : glisser, `planMove` sur l'état courant au relâchement.
- `ToolBar.tsx` : 6 outils, numéro, icône générée, libellé ; touches 1 à 6 et Échap.
- `TileTooltip.tsx` : titre, lignes, barre, ligne d'action ("Clic : Arroser" en vert, "Semer : creuse d'abord un trou" en rouge), indication de glisser.
- `SidePanel.tsx` : pile de graines, panier (espèce, couleur, rareté colorée), compteurs corbeaux et tas, météo ("La pluie arrose tout le champ").
- `useCrows.ts` : apparition et départ des corbeaux, pause quand la fenêtre est cachée.
- `DiscoveryToast.tsx` : contenu du toast de découverte.
- `labels.ts` : noms français des espèces, couleurs, raretés et outils ("Rose trémière", "Chrysanthème", "Bruyère", "Épique").
- `sprites/tools.ts` : icônes `main`, `transplantoir`, `arrosoir`, `secateur`, `rateau`.
- `GardenDevBar` : ajout de "Faire tomber des feuilles" (recule `leaves.checkedAt` de 12 h).
- Style : panneaux sombres à liseré doré, titres en serif, comme la maquette.

### 3.4 Flux de données

- La fenêtre Potager est le seul écrivain : chaque `apply` produit une nouvelle sauvegarde, écrite par le planificateur existant (court délai, écriture immédiate à la fermeture).
- La fenêtre principale lit sans écrire.
- Tick d'une minute : `tick(now)` puis `sync`.

## 4. Erreurs

- Action refusée : sauvegarde inchangée, raison dans l'infobulle, pas de toast.
- Pointeur hors du champ : ni surbrillance ni infobulle.
- WebGL indisponible : message existant, hotbar et panneau masqués.
- Sauvegarde modifiée pendant un glisser : `planMove` est évalué sur l'état courant au relâchement.

## 5. Tests

Vitest :

- `actions` : chaque geste réussi et chaque refus du tableau 2.2, prolongation de l'arrosage, compteurs, corbeau avec tous les outils.
- `planMove` : plante vers terre libre, plante vers herbe (refus), décor vers herbe, trou et tas non déplaçables, conservation de `sownAt` et `watered`.
- `rolls` : 30 % / 45 % avec hasard injecté, graine identique à la fleur.
- `leaves` : un tas par créneau, plafond de 4, absence d'une semaine, cases occupées exclues, résultat identique pour la même sauvegarde.
- `discovery` : inscription unique, regroupement, variante.
- `target` : lignes de l'infobulle (étape, temps restant, mouillée ou sèche, outil de cueillette).
- `gardenReducer` : `apply`, `move`, `tick`.
- `sceneModel` : `thirsty` et `dry`.
- `accents.test.ts` complété si besoin.

Vérification manuelle dans l'aperçu navigateur (`bun run dev`) : chaque outil et chaque refus, glisser, corbeaux, tas, toast de découverte, terre sèche et plante qui penche.
