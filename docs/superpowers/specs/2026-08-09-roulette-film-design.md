# Roulette a films - page Decouverte

Date : 2026-08-09
Branche : `feat/discover-roulette`

## Objectif

Ajouter un onglet "Roulette" a la page Decouverte qui tire un film au hasard
parmi les genres coches, avec l'animation de ruban horizontal des ouvertures de
caisses CS:GO. Le film gagnant s'ouvre ensuite dans le pipeline existant
(releases C411 -> AllDebrid).

## Decisions cadrees

| Sujet       | Choix                                                                       |
| ----------- | --------------------------------------------------------------------------- |
| Emplacement | Onglet dedie dans `DiscoverTabs`, a cote de "Mangas" derriere le separateur |
| Vivier      | `/discover/movie` filtre qualite (`vote_count.gte=200`)                     |
| Genres      | Multi-selection, OU logique, aucun coche = tous                             |
| Raretes     | Reprises, derivees de la note TMDB, sans ponderation du tirage              |
| Resultat    | Carte resultat sous le ruban + acces a `DiscoverReleasesModal`              |
| Anti-redite | Aucune. Tirage pur, chaque lancer est independant                           |
| Media       | Films uniquement (pas de series)                                            |

## Architecture

### Fichiers

Nouveaux :

- `src/lib/rouletteGenres.ts` - liste des genres proposes (ids TMDB + libelles),
  derivee de la table existante `src/lib/tmdbGenres.ts`.
- `src/lib/rouletteRarity.ts` - `rarityOf(voteAverage)` et la table couleurs.
- `src/lib/rouletteStrip.ts` - `buildStrip()`, `stripOffset()`, constantes de
  geometrie. Pur, sans DOM.
- `src/lib/useMovieRoulette.ts` - machine a etats et chargement du vivier.
- `src/components/RouletteSection.tsx` - orchestration de l'onglet.
- `src/components/RouletteGenrePicker.tsx` - puces de genres multi-selection.
- `src/components/RouletteStrip.tsx` - ruban anime + curseur central.
- `src/components/RouletteCard.tsx` - une case du ruban.
- `src/components/RouletteResult.tsx` - carte du film gagnant.

Modifies :

- `src/lib/services/tmdb.ts` - ajout de `discoverByGenres()` et de la queryKey
  `tmdbKeys.roulette`.
- `src/lib/useDiscoverFeed.ts` - `"roulette"` ajoute a `DiscoverTab`, traite
  comme les onglets curatifs (pas de feed, pas de scroll infini, pas de
  recherche : meme traitement que `"manga"` dans `switchType` et l'observer).
- `src/components/DiscoverTabs.tsx` - le bouton d'onglet.
- `src/pages/DiscoverPage.tsx` - rendu de `RouletteSection` quand
  `mediaType === "roulette"`, avec `onOpen={openItem}`.

Aucun fichier ne depasse ~150 lignes. `useMovieRoulette` porte l'etat,
`RouletteSection` ne fait que cabler.

### Machine a etats

```
idle -> loading -> spinning -> revealed
                                  |
                                  +-- relancer --> loading
```

- `idle` : aucun tirage encore lance. Le ruban affiche 60 cases vides grisees
  (meme geometrie, sans affiche), pour que la zone ait sa hauteur definitive
  avant le premier lancer et que rien ne saute au demarrage de l'animation.
- `loading` : fetch du vivier. Bouton desactive, spinner sur le bouton.
- `spinning` : ~6 s d'animation. Les puces de genres et le bouton sont
  desactives ; changer de genre pendant cette phase est ignore.
- `revealed` : carte resultat visible, bouton "Relancer" actif.

## Flux de donnees

1. `discoverByGenres(genreIds, page, apiKey)` appelle
   `/discover/movie?with_genres=<ids joints par ",">&vote_count.gte=200&sort_by=popularity.desc&language=fr-FR&include_adult=false&page=<n>`.
   Le separateur `,` est le OU de TMDB. Aucun genre coche = parametre
   `with_genres` omis.
2. Premier appel page 1 pour lire `total_pages`. On tire ensuite une page au
   hasard dans `1..min(total_pages, 15)` et on charge cette page plus la
   suivante, en parallele.
3. Filtre : on ecarte les resultats sans `poster_path`.
4. `mapTmdb(r, "movie")` produit des `TmdbItem`, le type deja utilise par toute
   la page Decouverte.
5. Gagnant = tirage uniforme dans le pool filtre.
6. `buildStrip(pool, winner)` construit les 60 cases : le pool est melange puis
   repete autant de fois que necessaire pour atteindre 60 cases (le pool fait
   ~40 films apres filtrage), et la case 52 est ecrasee par le gagnant. Deux
   cases voisines identiques sont evitees en decalant le tirage d'un cran.
7. Au passage en `revealed`, le bouton "Voir les releases" appelle le `openItem`
   existant de `DiscoverPage`, qui ouvre `DiscoverReleasesModal` et son prefetch
   C411. Aucun code de telechargement neuf.

### Cache

Les deux pages passent par `cachedTmdb` avec la queryKey
`["tmdb", "roulette", genreIdsTries, page]`. Les relances rapprochees sur les
memes genres reutilisent le cache TanStack (`TMDB_STALE_MS` = 10 min) : c'est le
tirage qui change, pas forcement la requete. La cle API reste hors queryKey,
comme partout ailleurs.

## Animation

### Geometrie

- Case : 110 x 165 px (ratio affiche 2:3).
- Gouttiere : 10 px. Pas = 120 px.
- Longueur du ruban : 60 cases. Index du gagnant : 52.
- Conteneur `overflow-hidden`, curseur fixe au centre (trait vertical + deux
  chevrons, dans l'esprit de la ligne de paie de `SlotMachine`).
- `mask-image` lateral pour un fondu aux deux bords plutot qu'une coupe nette.

```
offset = PAS * INDEX_GAGNANT + LARGEUR_CASE / 2 - largeurConteneur / 2 + jitter
jitter = (random() * 0.7 - 0.35) * PAS
```

Le jitter (+/- 35 % d'une case) empeche l'arret pile au centre, comme dans les
vraies ouvertures de caisses. `stripOffset()` est pure : elle prend
`largeurConteneur` et une valeur aleatoire injectee, donc testable.

### Mouvement

Un seul `motion.div` anime de `x: 0` vers `x: -offset`.

- `duration: 6`
- `ease: [0.08, 0.82, 0.17, 1]` - depart tres rapide, longue trainee ; les 15
  dernieres cases occupent environ la moitie du temps.
- `onAnimationComplete` -> passage en `revealed`.

Un seul element anime, transforme composite GPU, rien par frame en JS.

Au `revealed` : la case gagnante prend un halo de sa couleur de rarete et la
carte resultat entre en dessous via `AnimatePresence`, avec la meme transition
que la grille existante (`duration: 0.45`, `ease: [0.22, 1, 0.36, 1]`).

### Mouvement reduit

`useReducedMotion` vrai : pas de defilement. Le ruban se positionne directement
sur l'offset final et le resultat apparait en fondu. Meme convention que le
reste de `DiscoverPage`.

## Raretes

Les seuils CS:GO litteraux (9+ pour l'or) ne fonctionnent pas ici : avec
`vote_count.gte=200`, une note TMDB au-dessus de 8,5 est deja exceptionnelle et
9+ n'existe quasiment pas. Le ruban serait entierement bleu et violet. Seuils
calibres sur la distribution reelle :

| Note      | Rarete       | Couleur   |
| --------- | ------------ | --------- |
| < 6,0     | Commun       | `#4b69ff` |
| 6,0 - 6,9 | Peu commun   | `#8847ff` |
| 7,0 - 7,6 | Rare         | `#d32ce6` |
| 7,7 - 8,3 | Tres rare    | `#eb4b4b` |
| >= 8,4    | Exceptionnel | `#ffd700` |

Chaque case porte un lisere bas de 3 px et un fond degrade de sa couleur. La
rarete est purement descriptive : le tirage reste uniforme.

## Carte resultat

Affiche, titre, annee, note, puces de genres (`TmdbGenres`, deja existant),
synopsis tronque (`ExpandableText`, deja existant). Actions :

- "Voir les releases" -> `openItem(winner)` de `DiscoverPage`.
- Coeur "Ajouter a ma liste" -> `toggleLike` de `useLikes`, deja cable dans la
  page.
- "Relancer" -> retour en `loading`.

## Gestion d'erreur

| Cas                              | Traitement                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Cle TMDB absente / invalide      | Ecran existant de `DiscoverPage`, l'onglet passe par la meme garde                                        |
| Erreur reseau                    | `NetworkErrorState` avec bouton Reessayer, comme ailleurs                                                 |
| Moins de 10 films apres filtrage | Repli sur la page 1 du meme jeu de genres                                                                 |
| Toujours insuffisant             | Message "Pas assez de films pour ce genre, essayez d'en cocher un autre" plutot qu'un ruban a moitie vide |

## Tests

Vitest, comme `duckRandom.test.ts` et `nyaa.test.ts`.

- `rarityOf()` : bornes exactes de chaque palier (5,9 / 6,0 / 6,9 / 7,0 / 7,6 /
  7,7 / 8,3 / 8,4).
- `buildStrip()` : longueur 60, gagnant a l'index 52, aucune case vide,
  fonctionne avec un pool de 3 films.
- `stripOffset()` : le centre du gagnant tombe sous le curseur au jitter pres ;
  jitter borne a +/- 35 % du pas.

Les composants ne sont pas testes unitairement (pas de React Testing Library
dans le repo). Verification visuelle dans le preview navigateur via
`devTauriShim` (`bun run dev`).

## Hors perimetre

- Series et animations : la roulette est films uniquement.
- Historique des tirages, cooldown, exclusion des titres deja possedes.
- Son.
- Ponderation du tirage par rarete.
