# Potager d'automne - Ouverture des sachets façon TCG

Date : 2026-09-23

Refonte de la mise en scène de la page Sachets. Référence : [spec Sachets](2026-09-20-potager-sachets-design.md).

**Révision (même jour) :** la première version révélait la fleur (sprite, nom, variante, tampon "Nouveau !"), ce qui contredit la règle de la spec Sachets : "La rareté d'une graine est connue dès l'ouverture du sachet ; l'espèce, la couleur et la variante ne se révèlent qu'à l'éclosion". Les cartes montrent désormais une **graine** (sprite par rareté, titre "Graine rare"), sans nouveauté ni variante, et le sachet famille ne montre pas d'espèce. La révélation se fait sur une pile en grand au centre : un clic retourne la carte du dessus, le suivant la range dans l'une des trois cases fixes du bas. Les sections ci-dessous sont corrigées en conséquence.

## 1. Objectif et périmètre

L'ouverture actuelle est trop pauvre : un bouton "Ouvrir", puis trois cartes qui se retournent sur un simple point coloré, sans nom de fleur ni indication de nouveauté. Les trois types de sachet (quotidien, doré, famille) ont le même visuel. On veut une ouverture qui donne envie d'ouvrir et récompense le joueur, comme un booster de jeu de cartes à collectionner.

Dans le périmètre :

- Pile des sachets en attente, un visuel pixel-art par type de sachet.
- Déchirure du sachet au glisser (ou au clic).
- Révélation carte par carte, avec indice de rareté sur le dos et effets croissants selon la rareté.
- Récapitulatif, enchaînement vers le sachet suivant, raccourci vers le champ.
- Cartes de graine : rareté seule, jamais l'espèce, la couleur, la variante ni la nouveauté.

Hors périmètre :

- Tirage, probabilités, pity, contenu des sachets : inchangés.
- Son : aucun effet sonore.
- Ouverture groupée de plusieurs sachets ("Tout ouvrir").

## 2. Déroulé

La page suit quatre phases.

### 2.1 Repos

- Au centre, la pile des sachets en attente : jusqu'à 7 sachets légèrement décalés et tournés. Le sachet du dessus flotte doucement ; sa bande du haut porte une ligne pointillée et le texte "Tirer pour ouvrir".
- Visuel par type :
  - `quotidien` : papier kraft.
  - `dore` : feuille d'or, reflet qui balaye le sachet.
  - `famille` : papier imprimé à motif floral générique. L'espèce n'est jamais montrée : elle se découvre à l'éclosion.
- Aucun sachet : un sachet grisé, immobile, et "Prochain sachet à minuit".
- Les jauges de pity restent dans la colonne de droite.

### 2.2 Déchirure

- Le joueur tire la bande du haut vers la droite. La bande suit le pointeur ; le sachet tremble de plus en plus fort à l'approche du seuil (70 % de la largeur).
- Au premier mouvement du glisser, l'action `open-sachet` est envoyée : la sauvegarde est écrite à ce moment, le contenu est connu. Si le sachet contient une rare ou mieux, une lueur de la couleur de la meilleure rareté filtre par la fente et s'intensifie avec la progression.
- Relâché avant le seuil : la bande revient en place, la phase reste `tearing` (le sachet est déjà consommé, la pile affiche toujours ce sachet au-dessus). Le joueur reprend le glisser quand il veut.
- Seuil atteint : la bande s'envole en tournoyant, des confettis de papier jaillissent, on passe à la révélation.
- Un clic simple sur le sachet (sans glisser) envoie `open-sachet` et joue la même déchirure automatiquement, en 600 ms.
- Pendant la phase `tearing`, le compteur de la pile vaut `pending + 1`, pour que le sachet en cours reste visible.

### 2.3 Révélation

- Les 3 cartes sortent du sachet et forment une pile en grand au centre, face cachée. Le dos de chaque carte est teinté par sa rareté (commune neutre, rare bleu, épique violet, légendaire or), avec une lueur qui pulse pour rare et au-dessus.
- Un clic retourne la carte du dessus sur place ; le clic suivant l'envoie dans sa case en bas (trois cases fixes en pointillés), et la carte suivante de la pile devient celle du dessus.
- Face de carte : une graine animée par `cardFx` (sprite `sprites/seed.ts`, un aspect par rareté ; halo légendaire, lueur épique, étincelles rares) et le titre "Graine commune", "Graine rare", etc. Ni espèce, ni couleur, ni variante, ni nouveauté.
- Effets au retournement :

| Rareté     | Avant le retournement                              | Au retournement                                                               |
| ---------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Commune    | rien                                               | retournement simple                                                           |
| Rare       | rien                                               | étincelles bleues                                                             |
| Épique     | carte qui vibre 300 ms                             | rayons violets, secousse légère                                               |
| Légendaire | pause de 900 ms, carte qui tremble de plus en plus | flash doré plein écran, rayons tournants, pluie de paillettes, secousse forte |

- Un bouton "Tout révéler" passe directement au récapitulatif.

### 2.4 Récapitulatif

- Les 3 cartes côte à côte, en taille réduite, face visible avec leurs effets.
- Les jauges de pity s'animent à ce moment seulement.
- Boutons : "Sachet suivant (n)" si des sachets restent, "Aller au champ".
- "Sachet suivant" ramène à la phase repos avec le sachet suivant au-dessus de la pile.

### 2.5 Changement d'onglet

La page est démontée quand on change d'onglet. Au retour, si le dernier lot ouvert n'a pas été vu jusqu'au bout, la page affiche directement son récapitulatif. Rien n'est perdu : la sauvegarde est déjà écrite. La page retient le dernier `opened.seq` affiché dans un `useRef` de `GardenApp` passé en prop, pour distinguer un lot neuf d'un lot déjà vu.

### 2.6 Mouvement réduit

Avec `prefers-reduced-motion` : pas de secousse, pas de flash, pas de tremblement. La déchirure et les retournements restent, en fondu.

## 3. Données

`GardenState.opened` devient :

```ts
opened: { seq: number; seeds: Seed[]; type: SachetType };
```

- `type` est le type du sachet ouvert (`pending[0]` avant ouverture).
- Valeur initiale : `{ seq: 0, seeds: [], type: "quotidien" }`.

Aucun changement de sauvegarde, de tirage ni de pity.

## 4. Code

### 4.1 Logique pure

- `core/labels.ts` : ajout de `seedLabel`.
- `ui/sachets/packFlow.ts` : phases `idle | tearing | revealing | summary` (index de carte dans `revealing`), transitions `startTear`, `tear`, `next`, `revealAll`, `reset`. Timings et intensités par rareté (pause, durée de vibration, force de secousse, flash). `bestRarity(seeds)` pour la lueur de la fente. Remplace `reveal.ts`.
- `ui/sachets/burst.ts` : particules du canvas superposé (confettis, étincelles, rayons, paillettes) : émission, mise à jour, durée de vie. Sans DOM.

### 4.2 Composants (`ui/sachets/`)

| Fichier             | Rôle                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------- |
| `SachetsPage.tsx`   | tient la phase, orchestre, garde les jauges à droite                                      |
| `PackStack.tsx`     | pile des sachets en attente, sachet grisé si vide                                         |
| `TearablePack.tsx`  | sachet du dessus : glisser de la bande, tremblement, lueur par la fente, clic pour ouvrir |
| `CardBack.tsx`      | dos teinté par la rareté, lueur pulsée                                                    |
| `RevealCard.tsx`    | carte de graine, en grand (se retourne) ou en petit                                       |
| `BurstLayer.tsx`    | canvas superposé piloté par `burst.ts`                                                    |
| `useScreenShake.ts` | secousse du conteneur, dosée par la rareté                                                |
| `PackSummary.tsx`   | rangée des 3 cartes, boutons de fin                                                       |

Supprimés : `SachetPack.tsx`, `SeedReveal.tsx`, `reveal.ts`, `reveal.test.ts`.

Les animations DOM passent par `motion/react` (drag de la bande avec `drag="x"`, `dragConstraints`, `onDrag`). Le drag natif de Tauri est déjà désactivé (`dragDropEnabled: false`).

### 4.3 Réutilisation

- `useCardFx` et `cardFx.ts` passent de `ui/herbier/` à `ui/cards/`, partagés entre l'Herbier et les sachets.
- Nouveau sprite `sprites/sachet.ts` : un dessin par type, rendu en deux morceaux (bande et corps) pour la déchirure. Enregistré dans `renderSpriteBuf` comme les autres familles de sprites.

### 4.4 Branchements

- `SachetsPage` reçoit `onGoToField`, branché sur `setTab("champ")` dans `GardenApp`.
- Outil de développement : bouton "Dev : sachet légendaire". Il envoie une action `dev-reveal` qui ajoute 3 graines imposées (une commune, une épique, une légendaire, tirées avec `rollSeedOfRarity`) à l'inventaire et remplit `opened` comme une vraie ouverture (type `dore`). Disponible seulement avec `import.meta.env.DEV`.

## 5. Tests et vérification

- Vitest :
  - `seedLabel` : "Graine commune", "Graine épique", "Graine légendaire".
  - `packFlow` : transitions valides et ignorées, "Tout révéler", timings par rareté, `bestRarity`.
  - `burst` : émission bornée, particules retirées en fin de vie.
  - `gardenReducer` : `opened.type` renseigné à l'ouverture.
- `src/lib/accents.test.ts` couvre les nouveaux textes.
- Vérification visuelle dans l'aperçu navigateur (`bun run dev` et le shim Tauri) : déchirure au glisser et au clic, relâché avant le seuil, les quatre raretés, sachet famille et doré, "Tout révéler", "Sachet suivant", changement d'onglet en pleine révélation, pile vide. Le panneau doit être visible : les animations `requestAnimationFrame` sont gelées quand il est caché.
