# Pity progressif concave sur les recompenses de canards

Date: 2026-07-24

## Probleme

`rollRewards()` ([src/game/rewards.ts](../../../src/game/rewards.ts)) tire les 3 cartes de
fin de run sans aucune memoire. Un joueur qui possede deja la moitie du Canardex
recoit majoritairement des doublons, et le taux shiny reste fige a 3% par carte
quel que soit son avancement. Les derniers shiny d'une collection deviennent un
mur statistique: ~33 mains en moyenne pour en decrocher un, sans que le fait
d'etre a un seul shiny de la fin n'y change quoi que ce soit.

## Objectif

Les doublons doivent nourrir un pity: plus un joueur enchaine les mains sans
nouveaute, plus la main suivante a de chances de cibler ce qui lui manque.
L'effet est plafonne, et le plafond shiny se releve a mesure que la chasse
avance, pour recompenser les collectionneurs avances.

## Perimetre

Uniquement les 3 cartes de fin de run. Les spawns de la piscine
([PixelPool.tsx](../../../src/components/PixelPool.tsx)) gardent leurs taux
actuels: ils produisent bien trop de tirages pour partager la meme courbe.

## Etat persiste

Deux compteurs independants, stockes dans `duckdex.json` a cote de `entries` et
`shiny`:

```ts
interface PityState {
  dryDex: number; // mains consecutives sans espece ni couleur neuve
  dryShiny: number; // mains consecutives sans shiny manquant
}
```

Deux compteurs et non un seul: un joueur au dex complet doit continuer a
beneficier du pity shiny.

`rollRewards()` est appele de facon synchrone depuis la boucle de jeu
([BoatGamePage.tsx:390](../../../src/pages/BoatGamePage.tsx)). On reprend donc le
pattern deja en place dans `duckDex.ts`: un miroir memoire lu en synchrone,
rafraichi a chaque lecture/ecriture du store, et une ecriture fire-and-forget.

## Courbes

`S` = `SPECIES.length` (42). `m` = nombre de shiny encore manquants.

```
mult(m)   = 1 + 2 * (1 - m/S)^4

pDex(n)   = 0.60 * (1 - 0.65^n)

baseShiny(m) = 0.03 * mult(m)
capShiny(m)  = 0.15 * mult(m)
pShiny(m, n) = baseShiny + (capShiny - baseShiny) * (1 - 0.70^n)
```

Les deux courbes sont concaves: montee rapide sur les premiers echecs, puis
plateau. Aucune garantie dure, jamais de saut a 100%.

`pDex` va de 21% (n=1) a 60% asymptotique, atteint ~51% des n=3.

`pShiny` en debut de collection (m=42) va de 3% a 15%. En fin de chasse le
multiplicateur releve base et cap ensemble:

| n   | m=42  | m=20  | m=10  | m=5   | m=1   |
| --- | ----- | ----- | ----- | ----- | ----- |
| 0   | 3.0%  | 3.5%  | 5.0%  | 6.6%  | 8.4%  |
| 1   | 6.6%  | 7.6%  | 11.0% | 14.6% | 18.6% |
| 3   | 10.9% | 12.5% | 18.2% | 24.0% | 30.7% |
| 5   | 13.0% | 14.9% | 21.7% | 28.6% | 36.6% |
| 8   | 14.3% | 16.5% | 24.0% | 31.5% | 40.3% |

Mains moyennes jusqu'a un shiny: 8.95 a m=42, 4.26 a m=1 (contre 33 et 12 sans
pity). Le debut de collection est a peine modifie, la fin est deux fois plus
rapide.

## Application

`applyPity()` intervient en toute fin de `rollRewards()`, apres les boosts de
rang et de difficulte existants, pour ne pas les ecraser.

1. **Passe dex.** Si aucune des 3 cartes n'apporte d'espece ni de couleur neuve,
   tirer `pDex(dryDex)`. En cas de succes, rejouer **une seule** carte, dans
   **son propre palier de rarete**: en priorite une espece jamais vue de ce
   palier, sinon une couleur manquante d'une famille incomplete de ce palier. Si
   ce palier n'a plus rien de manquant, essayer les paliers des deux autres
   cartes; si tout est complet, ne rien changer.
2. **Passe shiny.** Si aucune carte n'est un shiny manquant, tirer
   `pShiny(m, dryShiny)`. En cas de succes, poser `shiny = true` sur une carte
   dont l'espece n'a pas encore son shiny. Si les 3 especes ont deja leur shiny,
   rejouer d'abord une carte vers une espece sans shiny (meme ciblage qu'en 1),
   puis la marquer.
3. **Compteurs.** Chacun retombe a 0 si la main **proposee** contient la
   nouveaute correspondante, sinon +1. Base sur ce qui est propose et non sur ce
   que le joueur garde: sinon refuser systematiquement les cartes neuves
   maintiendrait le pity au maximum.

Une seule carte amelioree par main: le joueur conserve un vrai choix entre les
3, et le dex ne se remplit pas par paquets.

## Ciblage d'une espece

Le reroll a besoin de produire un variant d'une espece precise. Rejection
sampling sur `randomVariant()` echouerait trop souvent sur les especes rares.
Nouvelle fonction pure dans `duckSpecies.ts`:

```ts
variantForSpecies(sp: DuckSpecies, takenColors: string[]): Variant
```

Elle part de `sp.preview`, remplace le corps par une teinte de `BODY_COLORS`
absente de `takenColors` (si `sp.maxColors > 1`), et randomise `accColor` quand
l'accessoire en rend un. Toujours un succes, aucune boucle de tentatives.

Invariant a tester: `speciesOf(variantForSpecies(sp, ...)) === sp.id` et
`getRarity(...) === sp.rarity` pour les 42 especes.

## Fichiers

| Fichier                              | Role                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `src/game/pity.ts` (nouveau)         | pur: `PityState`, courbes, `applyPity(cards, snapshot, state) -> { cards, next }` |
| `src/game/pity.test.ts` (nouveau)    | courbes et caps, ciblage, priorite espece/couleur, reset des compteurs            |
| `src/components/duckSpecies.ts`      | `variantForSpecies()`                                                             |
| `src/components/duckSpecies.test.ts` | invariants de `variantForSpecies()`                                               |
| `src/lib/duckDex.ts`                 | `dexSnapshot()` synchrone, lecture/ecriture de `PityState`                        |
| `src/game/rewards.ts`                | `rollRewards()` appelle `applyPity()` en fin de chaine                            |

`applyPity` reste pure: elle recoit l'etat et le snapshot du dex en parametres et
retourne le nouvel etat. La persistance est du ressort de `rollRewards` /
`duckDex`, ce qui rend toute la logique testable sans store.

## Cas limites

- **Dex complet**: la passe dex ne trouve aucune cible et ne touche a rien,
  `dryDex` continue de monter sans effet. La passe shiny reste active.
- **Shiny complet**: `m = 0`, `mult = 3`, mais la passe shiny ne trouve aucune
  espece cible et n'agit pas.
- **Cache froid**: si le miroir memoire du dex n'a pas encore ete lu,
  `dexSnapshot()` retourne `null` et `applyPity` renvoie les cartes inchangees.
  Meme garde que `dexStatusOf()` aujourd'hui.
- **Recompenses du Canardex**: exclues par `isRewardEffect()`, comme partout
  ailleurs. Elles ne peuvent ni etre ciblees ni compter comme nouveaute.

## Hors perimetre

- Aucun affichage du compteur de pity dans l'UI.
- Aucun changement des taux de rarete de `randomVariant()`.
- Aucun changement sur la piscine.
