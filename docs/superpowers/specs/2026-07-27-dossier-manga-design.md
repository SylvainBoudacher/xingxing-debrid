# Dossier de destination des mangas

## Objectif

Permettre a l'utilisateur de choisir un dossier dedie pour les tomes de manga
telecharges, independant du dossier de telechargement general, et de deplacer
les tomes deja telecharges vers ce nouveau dossier.

## Etat actuel

- `download_to_dir` (Rust) ecrit dans `dir` + un sous-dossier optionnel d'un
  seul segment (`subdir`), sans separateur de chemin.
- `mangaDownload.ts` appelle `startDownload(url, "manga")` : tous les tomes
  atterrissent a plat dans `<download_dir>/manga/`.
- Chaque tome memorise son chemin dans `MangaVolume.localPath`, utilise par le
  lecteur et par le compteur "telecharges" de la bibliotheque.

## Decisions

| Sujet                    | Choix                                              |
| ------------------------ | -------------------------------------------------- |
| Reglage                  | Chemin absolu dedie, vide = comportement actuel    |
| Perimetre du deplacement | Uniquement les tomes references par un `localPath` |
| Arborescence             | Un sous-dossier par serie                          |
| Nom du sous-dossier      | Titre de la serie, assaini                         |
| Declencheur de migration | Au changement de dossier uniquement                |
| Echec de deplacement     | Copier puis supprimer, sinon notifier              |

## Conception

### 1. Reglage `manga_dir`

Nouveau bloc "Dossier des mangas" dans `DownloadsPanel`, sous le dossier de
telechargement, avec la meme UI : chemin affiche, bouton "Choisir"
(`plugin-dialog` en mode `directory`), lien "Reinitialiser".

Cle du store : `manga_dir`, chemin absolu. Vide = valeur par defaut, affichee
comme "Dossier de telechargement / manga".

### 2. Resolution du chemin - `src/lib/mangaPaths.ts`

```
resolveMangaTarget(seriesTitle) -> { dir, subdir }
  manga_dir defini -> { dir: manga_dir,    subdir: sanitize(title) }
  sinon            -> { dir: download_dir, subdir: "manga/" + sanitize(title) }
```

`sanitizeFolderName(title)` : remplace `/ \ : * ? " < > |` et les caracteres de
controle par `-`, supprime les espaces et points en debut/fin, tronque a 100
caracteres, renvoie `"Manga"` si le resultat est vide. Fonction pure, testee.

Cote Rust, `download_to_dir` accepte desormais un `subdir` multi-segments. La
validation devient : chaque segment non vide, aucun segment egal a `..`, chemin
non absolu. `create_dir_all` cree l'arborescence.

### 3. Telechargement d'un tome

`downloadVolume(mangaId, volume, key)` lit le titre de l'entree de bibliotheque
via `mangaId`, calcule la cible avec `resolveMangaTarget`, et passe `dir` et
`subdir` a `startDownload`. `startDownload` prend donc un `dir` explicite
optionnel en plus du `subdir` (par defaut : `download_dir`, comportement
inchange pour les autres appelants).

Les nouveaux tomes atterrissent dans `<dossier manga>/<Titre assaini>/<fichier>`.

### 4. Deplacement au changement de dossier

Commande Rust `move_files(moves: Vec<FileMove>) -> Vec<MoveResult>` :

- `FileMove { from, to }`, `MoveResult { from, to, error: Option<String> }`.
- Pour chaque entree : `create_dir_all` du parent de `to`, puis `rename`. Si
  `rename` echoue (volumes differents), `copy` puis `remove_file`. Si la copie
  reussit mais la suppression echoue, le deplacement est considere reussi.
- Ne s'arrete jamais au premier echec : chaque entree a son propre resultat.
- Si `from` n'existe pas, l'entree renvoie une erreur explicite.

Cote frontend, `src/lib/mangaMove.ts` expose la fonction pure
`planMangaMoves(entries, targetDir)` : pour chaque tome ayant un `localPath`,
produit `{ mangaId, fileName, infoHash, from, to }` ou `to` vaut
`<targetDir>/<Titre assaini>/<basename(localPath)>`. Les tomes deja au bon
endroit sont exclus du plan. Fonction testee.

### 5. Flux utilisateur

1. L'utilisateur choisit un nouveau dossier dans les reglages.
2. `manga_dir` est enregistre immediatement.
3. Si `planMangaMoves` renvoie au moins un deplacement, la modale
   `MangaMoveDialog` s'ouvre : "N tomes telecharges. Les deplacer vers
   `<nouveau dossier>` ?" avec deux actions : **Deplacer** et **Laisser sur
   place**.
4. "Laisser sur place" ferme la modale, rien n'est touche : les tomes restent
   lisibles depuis leur ancien emplacement.
5. "Deplacer" appelle `move_files`, puis pour chaque succes met a jour
   `localPath` via `updateVolume`.

### 6. Resultat et gestion d'erreur

- Tout reussi : toast "N tomes deplaces", modale fermee.
- Echecs partiels ou total : les `localPath` des fichiers non deplaces restent
  inchanges (les tomes restent lisibles). La modale passe en etat "resultat" et
  affiche le nombre de fichiers restants, les cinq premiers chemins concernes,
  et le message "A deplacer manuellement vers `<nouveau dossier>`". Un toast
  d'erreur resume la situation.
- Le reglage `manga_dir` n'est jamais annule : les prochains telechargements
  vont dans le nouveau dossier quoi qu'il arrive.

## Fichiers touches

- `src-tauri/src/lib.rs` : `subdir` multi-segments, commande `move_files`,
  enregistrement dans `generate_handler!`.
- `src/lib/mangaPaths.ts` + `mangaPaths.test.ts` : assainissement et resolution.
- `src/lib/mangaMove.ts` + `mangaMove.test.ts` : plan de deplacement.
- `src/lib/mangaDownload.ts` : utilise `resolveMangaTarget`.
- `src/lib/downloads.ts` : `startDownload` accepte un `dir` explicite.
- `src/components/settings/panels/DownloadsPanel.tsx` : bloc dossier manga.
- `src/components/settings/MangaMoveDialog.tsx` : modale de migration.

## Hors scope

- Reorganisation a la demande des tomes deja a plat sans changement de dossier.
- Deplacement de fichiers non references par la bibliotheque.
- Suppression des anciens dossiers vides apres deplacement.
