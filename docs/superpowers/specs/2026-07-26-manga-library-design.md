# Bibliothèque manga et lecteur CBZ

Date : 2026-07-26
Branche : `feat/manga-library`

## Objectif

Ajouter à xingxing une bibliothèque manga distincte de la bibliothèque vidéo :
découvrir des oeuvres via MangaDex, récupérer les tomes correspondants sur C411
(scans FR au format CBZ), les télécharger via AllDebrid et les lire dans
l'application.

## Le problème central

Pour les films et séries, C411 pose un tag qui lie chaque torrent à un ID TMDB.
Côté manga, ce lien n'existe pas. L'appariement oeuvre <-> torrent doit donc se
faire sur le titre.

Deux constats issus de l'API C411 :

- `GET /api/torrents?subcategory=15` isole les mangas côté serveur (6794
  torrents). On n'a jamais à deviner si un torrent est un manga : la
  sous-catégorie 15 (`manga`, catégorie 2 `ebook`) le dit.
- Les noms de torrents commencent systématiquement par le titre de l'édition
  française, suivi du ou des tomes :
  ```
  One.Piece.[T01.T105].1997.2025.FR.[CBZ]-CHROMATIQUE
  One.Piece.Tome.[1 à 100].3.HS.Eichiro.Oda.FR.[CBZ]-[PRiNTER.PapriKa+]
  Jujutsu.Kaisen.T30.Akutami.FR.[CBZ]-thor1295
  Berserk.Tome.42.Kentaro.Miura.FR.[CBZ]-NOTAG
  L'Attaque.des.Titans.(et.series.derivees).[COLLECTION_INTEGRALE].FR.[CBZ]-NoTAG
  Naruto.[INTEGRALE].+Gaiden.[CBZ].FR-NOTAG
  ```

Côté MangaDex, `attributes.altTitles` contient le titre français quand il existe
(`"L'attaque des titans"` pour Attack on Titan), `description.fr` est souvent
renseigné, et `lastVolume` donne le nombre de tomes parus.

## Décisions

| Sujet                 | Décision                                                           |
| --------------------- | ------------------------------------------------------------------ |
| Contenu               | Tomes FR en CBZ, via C411 uniquement                               |
| Métadonnées           | MangaDex (API publique, sans clé)                                  |
| Sens du flux          | MangaDex d'abord : on part d'une oeuvre, on cherche ses releases   |
| Accès fichier         | Téléchargement complet du tome, puis lecture locale                |
| Unité de bibliothèque | Une entrée = une oeuvre, agrégeant les tomes de plusieurs torrents |
| Matching              | Multi-titres + alias mémorisé, arbitrage utilisateur en secours    |
| Lecteur               | Page simple / double, RTL, zoom, reprise et progression            |

L'index local du catalogue C411 (parcours des 6794 torrents, regroupement par
série) a été envisagé et écarté pour cette version. Il reste greffable plus tard
sans rien casser : il ne ferait qu'alimenter en candidats la même fonction de
filtrage.

## Architecture

```
src/pages/
  MangaDiscoverPage.tsx     catalogue MangaDex : populaires, recherche, filtres tags
  MangaLibraryPage.tsx      bibliothèque manga (grille d'oeuvres, détail = liste des tomes)
  ReaderPage.tsx            lecteur CBZ plein écran

src/components/
  MangaPosterCard.tsx       carte d'oeuvre (couverture, progression)
  MangaReleasesModal.tsx    releases C411 d'une oeuvre, groupées par tome
  MangaMatchModal.tsx       arbitrage manuel + enregistrement de l'alias
  MangaVolumeList.tsx       liste des tomes (absent / téléchargé / lu)
  reader/ReaderCanvas.tsx   rendu 1 ou 2 pages, zoom, déplacement
  reader/ReaderToolbar.tsx  barre haute
  reader/ReaderProgress.tsx barre basse (slider de pages)

src/lib/
  services/mangadex.ts      client API + queryKeys (calqué sur services/tmdb.ts)
  mangaItem.ts              MangaItem normalisé + mapManga (calqué sur tmdbItem.ts)
  parseVolume.ts            nom de torrent ou de fichier -> { titre série, tomes }
  mangaReleases.ts          recherche C411 multi-titres + filtrage
  mangaAliases.ts           mangaId -> titres C411 validés
  mangaLibrary.ts           bibliothèque agrégée par oeuvre (store séparé)
  cbz.ts                    wrapper des commandes Rust + cache de pages
  useCbzPages.ts            chargement, préchargement, révocation des blob URLs
  readerPrefs.ts            mode d'affichage, sens de lecture, ajustement

src-tauri/src/cbz.rs        cbz_list_pages / cbz_page (crate zip)
```

Une seule modification de l'existant : `subcategory?: number` ajouté à
`C411SearchParams` et à sa `queryKey` dans `src/lib/services/c411.ts`. Le type
`Page` gagne `"manga"`, `"mangalibrary"` et `"reader"`. `library.ts` et son
modèle vidéo ne sont pas touchés : la bibliothèque manga a son propre store.

Le lecteur ne connaît ni C411, ni AllDebrid, ni MangaDex. Il reçoit un chemin de
fichier local, un identifiant de tome et un callback de progression, donc il est
testable seul avec n'importe quel CBZ.

## Modèle de données

```ts
interface MangaVolume {
  number: number | null; // null = tome non identifié
  infoHash: string; // torrent source
  magnetId?: number;
  fileName: string; // fichier dans le magnet
  fileSize: number;
  localPath?: string; // renseigné une fois téléchargé
  pageCount?: number;
  lastPage?: number;
  read?: boolean;
}

interface MangaEntry {
  mangaId: string; // UUID MangaDex, identité de l'entrée
  meta: MangaMeta; // titre, titreFr, couverture, année, statut, lastVolume, tags
  volumes: MangaVolume[]; // triés par number
  readingDirection?: "rtl" | "ltr";
  addedAt: number;
  updatedAt?: number;
}
```

Fusion : `upsertVolumes(mangaId, volumes)` déduplique par `number`. En cas de
doublon, on garde le tome déjà téléchargé ; sinon celui du torrent le mieux
seedé.

Subtilité : un torrent « T01-105 » donne 105 fichiers dans le magnet. Le numéro
de tome est donc parsé depuis le **nom de fichier** retourné par
`get_magnet_files`, pas depuis le nom du torrent. `parseVolume` sert aux deux
usages.

## Flux

1. L'utilisateur parcourt MangaDex (populaires par `followedCount`, ou
   recherche) et ouvre une oeuvre.
2. `searchMangaReleases(item, key)` lance en parallèle une recherche C411
   `subcategory=15&name=<titre>` par titre candidat : titre FR des `altTitles`,
   titre EN, romaji, plus les alias déjà mémorisés. Déduplication par
   `infoHash`.
3. Filtrage : `normalize(nom du torrent)` doit commencer par un des titres
   normalisés. Chaque torrent retenu est parsé en `{ tomes, format }` ; les
   formats autres que CBZ sont signalés mais non lisibles.
4. Si rien ne sort, `MangaMatchModal` laisse l'utilisateur chercher lui-même sur
   C411 et choisir les torrents. Le titre retenu est enregistré comme alias de
   l'oeuvre et alimente les recherches suivantes.
5. L'ajout envoie le torrent à AllDebrid (`upload_magnet_to_debrid`), attend les
   fichiers (`get_magnet_files`), et enregistre un `MangaVolume` par fichier.
6. À la lecture d'un tome non téléchargé : `unlock_link` puis `download_to_dir`
   dans un sous-dossier `manga/` du dossier de téléchargement configuré, avec la
   barre de progression existante. Puis ouverture du lecteur.

## Lecteur

Côté Rust (`cbz.rs`, crate `zip`) :

- `cbz_list_pages(path) -> Vec<String>` : entrées image du ZIP (jpg, jpeg, png,
  webp, gif, avif), dossiers et `__MACOSX` exclus, triées en ordre naturel
  (`page2` avant `page10`).
- `cbz_page(path, index) -> Response` : octets bruts de l'image, renvoyés via
  `tauri::ipc::Response` pour éviter le coût du base64.

Côté React : `useCbzPages` charge la page courante, précharge les suivantes
(dans le sens de lecture) et révoque les blob URLs sorties du cache LRU.
`ReaderCanvas` affiche une ou deux pages ; une image dont le ratio est paysage
est affichée seule même en mode double page. Le sens RTL inverse l'ordre des
deux pages et les flèches. La page courante est écrite dans `lastPage` du tome
(débounce), le tome passe `read` à la dernière page.

## Erreurs

- MangaDex injoignable : `NetworkErrorState` existant, la bibliothèque locale
  reste consultable.
- Aucune release C411 : ouverture de `MangaMatchModal`, pas de toast d'erreur.
- CBZ corrompu ou entrée illisible : la page affiche un placeholder, la
  navigation continue.
- Fichier local disparu (`localPath` obsolète) : le tome repasse à l'état non
  téléchargé et propose un nouveau téléchargement.

## Tests

- `parseVolume.test.ts` : les six formats de noms observés, plus les noms de
  fichiers internes.
- `mangaReleases.test.ts` : filtrage par préfixe de titre, déduplication,
  candidats multi-titres.
- `mangaLibrary.test.ts` : fusion, dédoublonnage des tomes, préservation des
  tomes téléchargés.
- Rust : tri naturel et filtrage des entrées ZIP, dans `cbz.rs` comme le fait
  déjà `player.rs`.
