# Bandit manchot (machine à sous du bassin)

Une machine à sous posée au sol du bassin, à droite du Canardex. Un tirage
toutes les 10h. Elle paie en canards, et son jackpot débloque une récompense
exclusive à réclamer dans le Canardex.

## Mécanique

Trois rouleaux, cinq symboles. Règle unique affichée au joueur:
**2 symboles identiques = un canard de la rareté du symbole ; 3 identiques =
shiny garanti.** Le 777 fait exception: il exige les trois rouleaux.

| Symbole              | Lot                                          | Cote  |
| -------------------- | -------------------------------------------- | ----- |
| 777 (x3 obligatoire) | Canard Croupier, à réclamer dans le Canardex | 0,5 % |
| Couronne             | Le Roi des canards                           | 1 %   |
| Canard doré          | Légendaire                                   | 5 %   |
| Chapeau de sorcier   | Rare                                         | 26 %  |
| Canard à lunettes    | Peu commun                                   | 33 %  |
| Caneton              | jamais payant, symbole de remplissage        | -     |

Perdu: 34,5 %.

Le résultat est tiré d'abord, puis les rouleaux sont construits pour l'afficher.
Jamais l'inverse: un bug d'animation ne peut pas changer le lot, et la logique
se teste sans DOM.

La rareté tirée est convertie en `Variant` par le catalogue existant:
`randomVariant()` re-tiré jusqu'à tomber sur la rareté voulue pour les paliers
communs à légendaires, `kingVariant()` pour la couronne.

## Le Canard Croupier

Récompense mythique exclusive au casino, dans une nouvelle section "Casino" du
Canardex.

- corps velours rouge sombre, bec orange
- motif `neon`: tubes lumineux qui pulsent le long du flanc
- accessoire: nœud papillon noir
- effet `croupier`: enseigne clignotante au-dessus de la tête, jetons en orbite

Décrocher le 777 ne donne pas le canard: il débloque sa carte dans le Canardex,
à réclamer comme les autres récompenses. Si le 777 retombe alors que le Croupier
est déjà débloqué, l'animation de jackpot se joue quand même et le lot devient
un légendaire shiny garanti.

## Perte

Une combinaison perdante ne donne aucun canard. Les compteurs `dryDex` et
`dryShiny` du scope `pool` avancent de l'équivalent de 15 canards secs: la
malchance au casino accélère le pity du bassin.

## Remise du lot

`spawnVariant(v)`, comme la carte de fin de run: le canard tombe dans le bassin,
au joueur de le glisser dans la boutique pour le garder.

## Cooldown

10h depuis le dernier tirage, sans cumul: un seul tirage en attente au maximum.

- la machine dessinée au sol est terne tant que le tirage n'est pas prêt,
  allumée et clignotante quand il l'est
- le panneau ouvert affiche `Prochain tirage dans 7h 12m`
- si l'horloge système recule (timestamp du dernier tirage dans le futur), le
  tirage est rendu disponible plutôt que bloqué pour des heures

## Architecture

Logique pure, testable (`src/game/`)

- `slots.ts` — table des lots, `rollSlot()` qui renvoie `{ prize, reels }`,
  construction des rouleaux à partir du lot, conversion lot → `Variant`
- `slots.test.ts` — cotes sur un gros échantillon, cohérence rouleaux/lot,
  jackpot déjà gagné → légendaire shiny

Persistance (`src/lib/`)

- `slotMachine.ts` — store `slots.json` (`lastPull`, `jackpotWon`),
  `COOLDOWN_MS`, `msUntilNext()`, garde anti-recul d'horloge

Canvas (`src/components/`)

- `slotIcon.ts` — `slotBox()` / `overSlot()` / `drawSlot()`, calqué sur
  `dexIcon.ts`, posé à droite du Canardex, avec un état allumé/éteint

UI (`src/components/`)

- `SlotMachine.tsx` — overlay plein écran, ouvert par `emitSlotOpen()`
- `SlotReel.tsx` — un rouleau, animation motion/react
- `slotSymbols.tsx` — les cinq symboles en SVG pixel-art
- `SlotDevMenu.tsx` — reset du cooldown et forçage de lot, `import.meta.env.DEV`

Modifications ciblées

- `duckTypes.ts`: pattern `neon`, effet `croupier`
- `duckPatterns.ts` et `duckRewardEffects.ts`: leur rendu
- `duckRandom.ts`: `croupier` classé mythique
- `duckRewards.ts`: groupe `casino`, champ `casinoJackpot` dans `DexProgress`,
  récompense Croupier au seuil 1
- `duckRewardStatus.ts`: alimente `casinoJackpot` depuis `slots.json` pour que
  la pastille du Canardex s'allume
- `DuckDex.tsx`: section Casino via `DuckRewardSection`
- `PixelPool.tsx`: hit-test, curseur, clic, appel de dessin, et la branche
  d'effet `croupier` (même branche que `chameleon` / `peacock` / `phoenix`),
  dupliquée dans `DuckRewardPreview.tsx`
- `App.tsx`: monte `<SlotMachine />` en lazy à côté de `<DuckDex />`
