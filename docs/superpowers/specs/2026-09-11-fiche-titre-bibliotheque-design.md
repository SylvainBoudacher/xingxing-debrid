# Bibliothèque - fiche titre plein écran

Date : 2026-09-11
Branche : `feat/library-title-page`

## Objectif

La modale de détail d'une série (`SeriesGroupDetailModal`) sature sur les
grosses séries : 2xl de large, 85vh de haut, saisons empilées en accordéon,
chaque ligne portant case vu + VLC + téléchargement, plus deux modes
(sélection, organisation) greffés dessus. La fiche devient une page plein écran
façon Prime Video / Netflix, pour les séries comme pour les films.

## Décisions cadrées

| Sujet            | Choix                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Périmètre        | Séries + films (et entrées C411/Nyaa sans TMDB). Mangas hors périmètre          |
| Conteneur        | Page dédiée : calque plein écran rendu par `LibraryPage`, grille montée dessous |
| Données TMDB     | Backdrop + détail de la saison affichée (titre, vignette, résumé, durée)        |
| Épisodes absents | Mention en fin de saison (« N épisodes manquants ») + bouton Chercher           |
| Vue liste        | Le clic sur une carte ouvre la page ; les accordéons disparaissent              |

## Comportement

- Barre du haut collante : Retour (ou Échap), titre qui apparaît quand le
  bandeau sort de l'écran, menu « ... » (Choisir des épisodes, Gérer les
  dossiers, Changer les informations TMDB, Supprimer de la bibliothèque).
- Bandeau : backdrop TMDB, affiche, méta, genres, résumé repliable, progression.
  Action principale « Lancer / Reprendre SxEy » (série) ou « Lire » (film),
  puis Marquer comme vu, Télécharger, Chercher des épisodes.
- Sélecteur de saisons collant (dossiers personnalisés s'il y en a), saison du
  prochain épisode sélectionnée à l'ouverture.
- Barre de saison : tout vu, Reprendre dans la saison, VLC et téléchargement de
  la saison, sélecteur de plage « Épisodes 1-50 » au-delà de 100 épisodes.
- Ligne d'épisode : vignette cliquable (lecture VLC), numéro + titre TMDB,
  résumé 2 lignes, durée, taille, case vu, téléchargement. Sans correspondance
  TMDB (numérotation anime absolue), le nom du fichier.
- Épisodes manquants : épisodes diffusés de la saison TMDB absents des
  fichiers. Rien n'est signalé si la numérotation des fichiers dépasse celle de
  TMDB (faux manquants).
- Mode sélection : cases de sélection + barre flottante (Tout sélectionner,
  Supprimer, Télécharger / Copier). Mode organisation : `SeriesFolderOrganizer`
  inchangé à la place de la liste.
- La fiche se résout sur toute la bibliothèque, pas sur la liste filtrée :
  cocher le dernier épisode sous le filtre « À voir » ne la ferme plus.

## Architecture

Nouveaux :

- `src/lib/libraryTitle.ts` - helpers purs : sujet de la fiche, sections,
  prochain épisode, plages, épisodes manquants, nom affiché d'un fichier.
- `src/lib/useTitleTmdb.ts` - détail TMDB (même clé que les genres) et saisons
  via `useQueries`.
- `src/lib/useSeriesFolderConfig.ts`, `src/lib/useEpisodeSelection.ts`.
- `src/components/libraryTitle/` - `LibraryTitlePage` (orchestration),
  `TitleTopBar`, `TitleMoreMenu`, `TitleHero`, `TitleHeroActions`,
  `TitleSectionPicker`, `TitleSectionBar`, `TitleEpisodeList`,
  `TitleEpisodeRow`, `TitleMissingNote`, `TitleSelectionBar`.
- `src/components/ChipScroller.tsx` - piste de puces défilante extraite de
  `DiscoverSeasonTabs`, partagée avec le sélecteur de saisons.

Modifiés : `LibraryPage` (calque à la place des deux modales), `SeriesGroupCard`
et `LibraryEntryCard` (clic = ouverture), `libraryParts` (nettoyage, options
`vlc` / `label` de `DebridActions`), `library.ts` (`seasonsOf`), service TMDB
(`tvSeason`, backdrop et durée dans `TmdbDetail`).

Supprimés : `SeriesGroupDetailModal`, `LibraryDetailModal`.

## Hors périmètre

- Fiche manga.
- Préchargement des saisons non affichées.

## Vérification

- `bunx tsc --noEmit`, `bun run lint`, `bun run test` (dont `libraryTitle.test.ts`).
- Preview navigateur : série multi-saisons, film, entrée sans TMDB, sélection,
  organisation, retour à la grille à la même position.
