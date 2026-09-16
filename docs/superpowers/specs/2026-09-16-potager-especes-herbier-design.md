# Potager d'automne - Sous-projet 3 : espèces et Herbier

Date : 2026-09-16

Suite de l'onglet Champ (sous-projet 2). Référence : [vision](2026-09-16-potager-automne-vision-design.md), [spec Champ](2026-09-16-potager-champ-design.md). Maquettes du brainstorming : mise en page "carnet d'herbier ouvert" (option B) et effets de rareté "marqués" (option B), copiées dans [docs/superpowers/mockups/potager-automne/](../mockups/potager-automne/README.md) (`herbier.html`, `rarete-effets.html`).

## 1. Objectif et périmètre

Remplacer les listes provisoires par un catalogue complet, dessiner les nouvelles espèces, rendre la rareté et les variantes visibles dans le champ, ajouter le pressage et la page Herbier.

Dans le périmètre :

- Catalogue : 14 espèces, 65 entrées espèce x couleur, 5 nouvelles couleurs.
- 6 nouveaux dessins d'espèces (dont la Lanterne-de-lune, fantastique et uniquement légendaire).
- Variantes givrée, dorée, lumineuse : sprites et effets.
- Effets de rareté marqués dans la scène (Potager et fond passif).
- Pressage instantané depuis le panier, avec chance de graine d'une autre couleur.
- Onglets de la fenêtre Potager (Champ, Herbier) et page Herbier en carnet.

Hors périmètre :

- Hybrides (sous-projet 6, avec le pollen d'affinité) : ni dans le catalogue ni dans l'Herbier.
- Tirage des sachets et pity (sous-projet 4). Aucune source de variante n'existe encore en jeu : les variantes sont rendues et affichées, mais seules les graines de développement en portent.
- Tâches de l'arbre (sous-projet 5) : seul le compteur `pressed` est ajouté.

## 2. Règles de jeu

### 2.1 Catalogue

C = commune, R = rare, E = épique, L = légendaire.

| Espèce           | Id             | Genre | Cueillette | Couleurs                                                 |
| ---------------- | -------------- | ----- | ---------- | -------------------------------------------------------- |
| Tournesol        | `tournesol`    | m     | sécateur   | jaune C, orange C, bronze R, bordeaux E, blanc L         |
| Rose trémière    | `rosetremiere` | f     | sécateur   | rose C, blanc C, jaune R, rouge R, noir L                |
| Dahlia           | `dahlia`       | m     | sécateur   | rouge C, orange C, rose R, abricot R, bordeaux E, bleu L |
| Cosmos           | `cosmos`       | m     | main       | rose C, blanc C, rouge R, orange R, jaune E, noir L      |
| Aster            | `aster`        | m     | main       | violet C, lilas C, bleu R, rose R, blanc E               |
| Chrysanthème     | `chrysantheme` | m     | sécateur   | bronze C, jaune C, blanc C, rouge R, rose R, vert L      |
| Bruyère          | `bruyere`      | f     | main       | pourpre C, rose C, blanc R, lilas E                      |
| Colchique        | `colchique`    | m     | main       | lilas C, rose C, violet R, blanc E                       |
| Anémone du Japon | `anemone`      | f     | main       | rose C, blanc C, lilas R, bordeaux E                     |
| Sedum            | `sedum`        | m     | sécateur   | rose C, bordeaux C, blanc R, vert E                      |
| Amarante         | `amarante`     | f     | sécateur   | rouge C, bordeaux C, vert R, orange E, jaune L           |
| Verge d'or       | `vergedor`     | f     | main       | jaune C, orange R, abricot E, blanc L                    |
| Héliopsis        | `heliopsis`    | m     | sécateur   | jaune C, orange C, bronze R, rouge E                     |
| Lanterne-de-lune | `lanternelune` | f     | main       | bleu L, blanc L, violet L                                |

Total : 65 entrées (27 C, 17 R, 11 E, 10 L).

Nouvelles couleurs (`ColorId`, nom masculin / féminin) : `blue` bleu / bleue, `burgundy` bordeaux, `apricot` abricot, `black` noir / noire, `lime` vert / verte. Les couleurs existantes gardent leurs identifiants (`heather` = pourpre).

- Les durées de pousse restent fonction de la seule rareté (inchangées).
- Chaque espèce porte une **note du jardinier** (2 ou 3 lignes d'ambiance, en français accentué).

### 2.2 Pressage

- Bouton "Presser" sur chaque fleur du panier. Instantané.
- La fleur quitte le panier, `herbier["espece:couleur"].pressed` augmente de 1, le compteur `pressed` augmente de 1.
- Si l'entrée n'existe pas encore dans l'Herbier (cas limite), elle est créée avec `discoveredAt = now`.
- **Graine** : 35 % de chance. Couleur tirée parmi les **autres** couleurs de l'espèce, pondérée par rareté (commune 60, rare 25, épique 12, légendaire 3, renormalisé sur les couleurs de l'espèce). La rareté de la graine est celle de la couleur tirée. Pas de variante.
- Toast : "Fleur pressée dans l'Herbier", suivi de "Une graine est tombée !" si le tirage réussit. La couleur reste cachée jusqu'à l'éclosion.
- Les graines de cueillette gardent leurs taux (30 %, 45 % si belle plante), même espèce et même couleur.

### 2.3 Rareté et variantes à l'écran (intensité "marquée")

La rareté se lit d'abord par la couleur ; les effets la renforcent.

- **Commune** : balancement seul.
- **Rare** : étincelles en croix qui apparaissent et s'éteignent autour de la fleur.
- **Épique** : aura violette pulsée autour de la silhouette, particules qui montent.
- **Légendaire** : halo doré pulsé, rayons tournants, flaque de lumière au sol (lumière ponctuelle), paillettes qui dérivent vers le haut.
- **Givrée** : palette glacée, pixels du haut de chaque forme blanchis (givre), flocons qui tombent.
- **Dorée** : pétales en palette or (tiges et feuilles conservées), reflet qui balaie la fleur, paillettes.
- **Lumineuse** : palette claire bleu-vert, lueur qui respire, plus forte la nuit.
- **Lanterne-de-lune** : effets légendaires plus une lumière ponctuelle bleutée par clochette, plus forte la nuit.

Plafonds : 12 particules par plante, 150 pour la scène. Mêmes effets dans le fond passif (toujours bridé à 30 images/s et en pause selon les règles du socle).

## 3. Page Herbier

Onglets de la fenêtre Potager : **Champ** et **Herbier** (style d'onglet actuel). L'onglet Champ garde la scène montée quand on passe à l'Herbier (rendu mis en pause pendant que l'Herbier est affiché).

Mise en page "carnet ouvert" (papier crème, reliure bois, fond de fenêtre sombre inchangé) :

- **Page gauche** : avancement global ("23 / 65" et barre), puis les 14 espèces dans l'ordre du catalogue avec "découvertes / total". Une espèce sans découverte s'affiche normalement (son nom est connu). Espèce ouverte au départ : celle de la découverte la plus récente, sinon le Tournesol.
- **Page droite, planche de l'espèce** :
  - Titre (serif) et sous-titre "3 couleurs sur 5".
  - Spécimens triés par rareté croissante puis ordre du catalogue, légèrement inclinés, posés comme des fleurs séchées. Chaque carte : sprite, nom de la couleur, rareté colorée, "2 pressées" si > 0, trois emplacements de variantes (givrée, dorée, lumineuse), remplis si vus. Cliquer un emplacement rempli affiche le sprite de la variante sur la carte (nouveau clic : retour au normal).
  - Couleur non découverte : silhouette, "?", rareté visible.
  - Effets marqués sur les cartes découvertes (canvas 2D léger par carte, pas de three.js) : étincelles, aura, halo, selon la rareté ; flocons, reflet, lueur selon la variante affichée.
  - Pied de planche : **note du jardinier** (italique, esprit manuscrit) et **fiche pratique** : cueillette ("À la main" / "Au sécateur"), raretés possibles, durée de pousse de chacune.
- Textes : "Herbier", "couleurs sur", "pressée(s)" accordé ("1 pressée", "2 pressées"), "Givrée", "Dorée", "Lumineuse", "Note du jardinier", "Cueillette", "Pousse".

## 4. Architecture

### 4.1 Règles pures (`src/garden/core/`)

- `catalog/colors.ts` : `COLORS` (id, nom masculin, nom féminin), `ColorId` dérivé.
- `catalog/species.ts` : `SPECIES` (tableau `as const` : id, nom, genre, outil, note, couleurs `{ color, rarity }[]`), `SpeciesId` dérivé, `speciesOf(id)`, `rarityOf(species, color)`, `CATALOG_ENTRIES` (liste des 65 `{ species, color, rarity }`).
- `types.ts` : `SpeciesId` et `ColorId` importés du catalogue (plus de listes en dur).
- `species.ts` : supprimé ; `harvestTool` passe dans `catalog/species.ts` (lecture de l'outil de l'espèce). Les imports existants sont mis à jour.
- `labels.ts` : `SPECIES_FR`, `COLOR_FR` et `FEMININE` remplacés par des lectures du catalogue ; `flowerName`, `pickedWord` inchangés côté appelants. Ajout de `VARIANT_FR` et `pressedLabel(n)`.
- `rolls.ts` : `pressSeedChance = 0.35`, `RARITY_WEIGHT`, `rollPressSeed(flower, rng): Seed | null`.
- `herbier.ts` : `pressFlower(save, index, now, rng): { save; seed: Seed | null } | null` (`null` si l'index est invalide) ; `speciesProgress(save, species)` ; `herbierProgress(save)` (découvertes / 65, entrées hors catalogue ignorées) ; `latestSpecies(save)`.
- `counters.ts` : `CounterId` gagne `pressed`.

### 4.2 Sprites (`src/garden/sprites/`)

- `species/<id>.ts` : un dessin par espèce (déplacement des 8 existants depuis `species.ts`, 6 nouveaux). `species/index.ts` : `SPECIES_DRAW: Record<SpeciesId, DrawFn>`.
- `palette.ts` : gammes `blue`, `burgundy`, `apricot`, `black` (violet très sombre, reflets lisibles), `lime` (chartreuse, distincte de `green`) ; `SPECIES_COLOR` complété et déplacé dans `colorRamps.ts`.
- `variants.ts` : transformations de tampon `frost`, `gold`, `glow` (portées de la maquette `rarete-effets.html`), appliquées après le dessin et avant le contour.
- `sprite.ts` : `SpriteRef.variant?: VariantId`, incluse dans `spriteKey`.

### 4.3 Rendu (`src/garden/render/`)

- `sceneModel.ts` : `SceneItem.legendary` remplacé par `rarity: Rarity | null` et `variant: VariantId | null` (plante éclose seulement) ; `itemKey` les inclut ; le sprite de la plante porte la variante.
- `rarityFx.ts` : effets par élément (création, mise à jour à chaque image, destruction) : étincelles, aura (billboard de silhouette teinté additif), halo et rayons (billboard additif), flaque de lumière (point light, remplace l'éclairage légendaire actuel de `billboards.ts`), paillettes, flocons, reflet (uniforme du matériau), lueur. Plafonds du 2.3.
- `lanternFx` dans `rarityFx.ts` : lumières des clochettes de la Lanterne-de-lune.
- `billboards.ts` : délègue à `rarityFx` au lieu du traitement légendaire actuel.

### 4.4 Interface (`src/garden/ui/`)

- `GardenApp.tsx` : état d'onglet (`"champ" | "herbier"`), barre d'onglets extraite dans `GardenTabs.tsx`.
- `FieldView` : prop `active` ; la scène s'arrête quand l'onglet n'est pas affiché.
- `herbier/HerbierPage.tsx` (carnet et espèce sélectionnée), `herbier/SpeciesList.tsx`, `herbier/SpeciesPlate.tsx`, `herbier/SpecimenCard.tsx`, `herbier/VariantSlots.tsx`, `herbier/SpeciesNotes.tsx`, `herbier/cardFx.ts` (animation canvas des cartes, pure fonction de dessin + boucle rAF en pause si la fenêtre est cachée).
- `gardenReducer.ts` : action `{ type: "press"; index; now; rng }` ; le résultat (graine ou non) est exposé pour le toast comme les découvertes.
- `SidePanel.tsx` : bouton "Presser" par fleur du panier.
- `SpriteIcon.tsx` : accepte la variante.
- `GardenDevBar.tsx` : bouton de dev "Graine à variante" (ajoute une graine aléatoire avec variante) pour vérifier le rendu.

## 5. Erreurs

- Index de panier invalide au pressage : aucune action.
- Espèce ou couleur absente du catalogue dans une sauvegarde : la plante s'affiche avec le sprite de graine générique, l'entrée d'Herbier est ignorée à l'affichage (jamais supprimée).
- Espèce à une seule couleur hors celle pressée : cette couleur est tirée. Le tirage ne renvoie jamais la couleur pressée.
- Pas de migration : `version` reste à 1, les identifiants existants restent valides.

## 6. Tests

Vitest :

- `catalog` : au moins une couleur par espèce, pas de doublon de couleur, chaque couleur a nom et gamme, chaque espèce a un dessin, Lanterne-de-lune entièrement légendaire, 65 entrées et répartition 27/17/11/10.
- `herbier` : pressage (panier, `pressed`, compteur, entrée créée si absente, index invalide), avancement par espèce et global, entrées hors catalogue ignorées, `latestSpecies`.
- `rolls` : seuil 35 %, jamais la couleur pressée, pondération avec hasard injecté, rareté de la graine cohérente avec le catalogue.
- `labels` : accords ("Anémone du Japon blanche", "Verge d'or orange", "Lanterne-de-lune bleue", "Sedum vert"), `pressedLabel`.
- `sprite` : les 65 combinaisons se génèrent ; `spriteKey` distingue les variantes ; `frost`/`gold`/`glow` conservent la transparence et laissent les feuilles vertes pour `gold`.
- `sceneModel` : `rarity` et `variant` transmis, `itemKey` change avec la variante.
- `gardenReducer` : `press`.
- `accents.test.ts` complété si besoin.

Point de contrôle : planche des 6 nouveaux dessins (toutes couleurs) montrée à l'utilisateur avant de les brancher au jeu.

Vérification manuelle dans l'aperçu navigateur (panneau visible) : onglets, carnet (sélection, silhouettes, variantes, notes), pressage et toast, effets de chaque rareté et variante dans le champ, fond passif.
