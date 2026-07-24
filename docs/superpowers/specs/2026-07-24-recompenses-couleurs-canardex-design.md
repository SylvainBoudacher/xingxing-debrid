# Récompenses de couleurs du Canardex

Date : 2026-07-24

Trois nouvelles récompenses de canard, décernées pour la collection exhaustive des
couleurs de corps d'une espèce, de cinq espèces, puis de toutes.

## Contexte

Le Canardex compte 42 espèces. Chacune expose un `maxColors` :

- 27 espèces sont colorables, avec 16 ou 17 teintes de corps possibles
- 15 espèces ont une apparence fixe (`maxColors: 1`), par exemple Pirate, Robot,
  Zombie, Le Roi des Canards

Au total, 457 couleurs sont collectionnables sur les espèces colorables.

Deux récompenses existent déjà, toutes deux réclamées manuellement depuis le pied
de la modale du Canardex :

- Canard Supernova, pour les 42 espèces découvertes (effet `nova`)
- Zeus le Dieu Canard, pour les 42 versions shiny (effet `godly`)

Ces deux effets ne peuvent jamais sortir d'un tirage aléatoire et sont exclus du
dex, pour qu'une récompense re-sauvegardée ne pollue pas la progression.

## Règles de progression

Une famille est complète quand toutes les couleurs de corps d'une espèce sont
collectionnées. **Seules les 27 espèces colorables sont éligibles.** Les espèces à
apparence fixe seraient complètes dès leur découverte et videraient les deux
premiers paliers de leur sens ; elles sont donc ignorées par ce système.

| Palier | Condition             | Récompense                |
| ------ | --------------------- | ------------------------- |
| 1      | 1 famille complète    | Canard Caméléon           |
| 2      | 5 familles complètes  | Canard Paon               |
| 3      | 27 familles complètes | Canard Phénix Chromatique |

Les paliers sont cumulatifs et indépendants des deux récompenses existantes. Comme
elles, chaque récompense se réclame manuellement dans le Canardex : elle rejoint la
collection sauvegardée et est injectée dans la piscine.

## Les trois canards

### Canard Caméléon (1 famille)

Le corps parcourt lentement les 17 teintes de la palette du jeu, en boucle
continue : il est littéralement toutes les couleurs, l'une après l'autre. L'oeil
pivote de son côté, la langue sort de temps en temps. Taille normale (échelle 1.0),
nouvel effet `chameleon`, rareté affichée légendaire.

### Canard Paon (5 familles)

La silhouette de canard reste inchangée ; une roue de plumes se déploie derrière
lui. Les ocelles bleu, vert et doré scintillent en décalé, et la roue s'ouvre et se
referme lentement au repos. Échelle 1.2, nouvel effet `peacock`, rareté affichée
mythique.

### Canard Phénix Chromatique (27 familles)

Corps braise blanc doré, ailes de flammes qui cyclent en arc-en-ciel au lieu de
l'orange classique, cendres colorées montant en volutes. Toutes les vingt secondes
environ il se consume et se reforme. Échelle 1.7, nouvel effet `phoenix`, rareté
affichée mythique.

Zeus reste seul dans le rang `god`. L'effet `phoenix` doit se lire clairement
différemment du `fire` du Canard Infernal : flammes arc-en-ciel et cycle de
renaissance contre flammes orange statiques.

## Données

### Nouveau fichier `src/lib/duckRewards.ts`

`duckDex.ts` fait 205 lignes et empile deux paires `isXClaimed` / `markXClaimed`
écrites à la main. Cinq récompenses en feraient dix. Un catalogue les unifie :

```ts
export interface DuckReward {
  id: string;
  name: string;
  scale: number;
  storeKey: string;
  variant: () => Variant;
  goal: (p: DexProgress) => { done: number; total: number };
  lockedHint: string;
}
```

Supernova et Zeus entrent dans cette table et **conservent leurs clés de store
existantes** `reward_claimed` et `god_claimed`, pour que la progression des joueurs
actuels reste valide. Les fonctions `isRewardClaimed`, `markRewardClaimed`,
`isGodRewardClaimed` et `markGodRewardClaimed` sont remplacées par un couple
générique paramétré par la clé du catalogue.

Le fichier expose aussi `isRewardEffect(effect)`, dérivé des variantes du
catalogue, qui remplace le test
`v.effect === "nova" || v.effect === "godly"` aujourd'hui écrit en dur à trois
endroits de `duckDex.ts` (`dexStatusOf`, `merge`, `mergeShiny`).

### Ajouts dans `src/lib/duckDex.ts`

- `COLOR_SPECIES` : les 27 espèces avec `maxColors > 1`
- `completedFamilies(entries): number` : nombre d'espèces colorables dont toutes
  les couleurs sont collectionnées
- `DiscoveryResult` gagne `familyComplete: boolean` et `familiesComplete: number`

### Rareté

`getRarity()` dans `duckRandom.ts` doit reconnaître les trois nouveaux effets,
sinon ils retombent en commun : `chameleon` en légendaire, `peacock` et `phoenix`
en mythique.

## Rendu

Les trois effets sont ajoutés en ligne dans la boucle de rendu de `PixelPool.tsx`,
comme tous les effets existants. L'extraction des effets vers un module dédié a été
discutée puis écartée pour ce lot ; elle reste un chantier à part.

Le Caméléon demande un traitement particulier : les sprites sont cuits une fois
pour toutes dans `duckSprite.ts`, overlay shiny compris, donc la couleur du corps
ne peut pas venir du sprite. Le sprite est dessiné avec un
`ctx.filter = "hue-rotate(...)"` piloté par le temps. Effet de bord assumé : le bec
et les accessoires dérivent aussi en teinte, ce qui convient à un caméléon.

## Interface

Une section Récompenses est ajoutée en bas de la liste du Canardex, après la
section Mythique. Les cinq récompenses y sont affichées en grille, au format des
cartes d'espèces :

- verrouillée : silhouette noire, nom masqué, compteur de progression sous la carte
  (par exemple `3/27 familles`)
- débloquée non réclamée : anneau doré et bouton Réclamer
- réclamée : carte normale avec son nom

Le pied de modale actuel disparaît ; tout son contenu remonte dans cette section.
L'en-tête conserve ses deux barres de progression, espèces et shiny. Le compteur de
familles complètes vit dans le titre de la section Récompenses plutôt qu'en
troisième barre, pour éviter d'empiler trois jauges.

## Notifications

Dans `DuckShop.tsx`, la branche `newColor` se dédouble. Si la prise complète la
famille, le `toast.info` devient un `toast.success` :

- titre : `Famille complète : Canard Classique !`
- sous-titre : `3/27 familles complètes`, ou la mention d'une récompense à réclamer
  quand la prise franchit un palier

Sinon le toast actuel `Nouvelle couleur pour X` est conservé tel quel.

## Tests

Ajouts dans `src/lib/duckDex.test.ts` :

- une espèce à apparence fixe ne compte jamais comme famille complète
- une espèce colorable ne compte qu'une fois sa dernière couleur enregistrée
- les seuils 1, 5 et 27 se déclenchent au bon moment
- les effets `chameleon`, `peacock` et `phoenix` n'entrent pas dans le dex quand la
  récompense est re-sauvegardée
- les clés de store `reward_claimed` et `god_claimed` restent lues correctement
  après passage au catalogue

## Hors périmètre

- Aucun changement au tirage aléatoire ni aux taux de rareté : ces trois canards ne
  peuvent jamais apparaître dans la piscine, ils se réclament uniquement
- Aucun changement au système shiny
- Aucune animation de particules dans la piscine à la complétion d'une famille
- Extraction des effets hors de `PixelPool.tsx`, reportée
