# Export / import manuel de la bibliothèque

Date : 2026-07-26
Statut : validé, prêt pour le plan d'implémentation

## Problème

Des utilisateurs possèdent plusieurs PC et veulent retrouver la même
bibliothèque sur chacun. Aujourd'hui la seule solution est `export_profile`,
qui embarque le profil complet (clés API, session C411, ducks, likes) et
écrase tout à l'import. C'est un outil de restauration après réinstallation,
pas un outil de transfert entre machines.

## Contrainte structurante

Aucune donnée utilisateur ne doit transiter par une infrastructure au nom du
développeur. Ce choix est légal autant que technique : héberger la
bibliothèque de titres des utilisateurs ferait du développeur un responsable
de traitement au sens du RGPD et un intermédiaire identifiable. Toute solution
retenue doit donc écrire sur le disque de l'utilisateur, et rien d'autre.

Conséquence : pas de backend, pas de compte, pas d'OAuth. L'utilisateur qui
pointe l'export vers un dossier Google Drive, Dropbox ou Syncthing obtient de
fait une synchronisation, sans que l'application ait connaissance de ce
service.

## Périmètre

Un nouveau couple export / import, distinct de la sauvegarde de profil, qui ne
transporte que la bibliothèque.

Contenu du fichier :

- les entrées de bibliothèque (`LibraryEntry[]`, store `library`)
- les catégories (`CategoryConfig`, store `library_categories`) — sans elles
  les entrées importées arrivent toutes dans « Non classés » et le transfert
  paraît raté

Hors périmètre : clés API, session C411, préférences d'affichage, likes,
ducks. Ils restent du ressort de `export_profile`.

Hors périmètre pour cette version : toute automatisation (sondage réseau,
WebDAV, envoi automatique). Le format et la fusion définis ici sont conçus
pour la supporter plus tard sans réécriture.

## Format du fichier

Extension `.c411lib`. L'enveloppe est celle qui existe déjà dans
`src-tauri/src/profile.rs` : payload JSON chiffré en XChaCha20-Poly1305, clé
dérivée de la passphrase par Argon2id, enveloppe JSON versionnée en base64.

`seal` et `unseal` passent en `pub(crate)` et sont réutilisées telles quelles.

Un champ `kind` est ajouté à l'enveloppe pour distinguer les deux types de
fichier. Sans lui, `import_profile` accepterait un `.c411lib` et écraserait
les clés API avec du vide.

- `kind: "profile"` — absent des fichiers produits avant ce changement, donc
  une enveloppe sans `kind` est traitée comme un profil (rétrocompatibilité)
- `kind: "library"` — le nouveau format

`import_profile` refuse un `kind` autre que `"profile"` ou absent.
`import_library` exige `kind == "library"`.

Payload déchiffré :

```json
{
  "exportedAt": 1753500000000,
  "entries": [{ "infoHash": "...", "title": "...", "updatedAt": 1753499000000 }],
  "categories": { "categories": [], "assign": {} }
}
```

Un seul ajout par rapport au modèle actuel : **`updatedAt` par entrée**,
nécessaire à la fusion. Les entrées existantes n'en ont pas ; à la lecture,
une entrée sans `updatedAt` retombe sur son `addedAt`.

Le format n'enregistre pas les suppressions. Voir « Titres absents du
fichier » ci-dessous.

## Fusion

`merge.ts` est une fonction pure, sans I/O ni dépendance Tauri. Elle prend
l'état local et l'état importé, et rend l'état fusionné plus un résumé.

Règles, appliquées par `infoHash` :

1. Entrée présente uniquement dans le fichier → ajoutée.
2. Entrée présente des deux côtés → celle dont l'`updatedAt` est le plus
   récent l'emporte, sauf pour `watched`.
3. `watched` → union. Un fichier marqué vu d'un côté reste vu après fusion.
4. Entrée présente uniquement en local → voir la règle ci-dessous.

Le point 3 est un choix délibéré. La progression de visionnage est ce qui
diverge le plus souvent entre deux machines, et sa perte est à la fois
irritante et invisible. Sa contrepartie assumée : décocher un épisode ne se
propage pas — l'action est annulée à la fusion suivante. Décocher est rare et
l'utilisateur constate immédiatement que ça n'a pas pris.

Les catégories fusionnent selon la même logique : union des catégories par
`id`, la plus récente l'emportant sur le nom en cas de collision ; `assign`
suit l'entrée à laquelle il se rapporte.

### Titres absents du fichier

Un titre présent en local mais pas dans le fichier est ambigu : soit il vient
d'être ajouté ici, soit il a été supprimé sur l'autre machine. Le format ne
permet pas de trancher seul, et plutôt qu'un mécanisme de marqueurs de
suppression persistants, on utilise `exportedAt` comme ligne de partage puis
on laisse l'utilisateur arbitrer le reste.

- `addedAt` **postérieur** à `exportedAt` → le titre a été ajouté après la
  création du fichier, il ne pouvait pas y figurer. Conservé sans rien
  demander.
- `addedAt` **antérieur** → il existait au moment de l'export et n'y est pas.
  Il a donc été supprimé sur l'autre machine. Soumis à l'utilisateur.

Ces titres douteux sont listés dans la fenêtre d'import, cochés par défaut
(l'hypothèse la plus probable étant la suppression). L'utilisateur décoche
ceux qu'il veut conserver. En régime normal la liste est vide ou contient un
ou deux titres ; elle n'est longue qu'au tout premier import entre deux
machines ayant divergé, c'est-à-dire précisément quand l'utilisateur veut
regarder ce qui se passe.

Ce mécanisme suppose un humain devant l'écran. Une synchronisation
automatique ultérieure devra réintroduire des marqueurs de suppression dans
le format — ce sera un ajout, sans rupture de ce qui est défini ici.

La fonction rend un résumé, utilisé pour l'aperçu avant application :

```ts
interface MergeSummary {
  added: number;
  updated: number;
  unchanged: number;
  // Presents en local, absents du fichier, anterieurs a exportedAt.
  missing: LibraryEntry[];
}
```

`merge()` prend en paramètre l'ensemble des infoHash à supprimer (ceux cochés
par l'utilisateur). L'aperçu est un premier appel avec un ensemble vide, dont
on lit `missing` pour peupler la liste ; l'application est un second appel
avec la sélection. Le calcul de l'aperçu et l'application passent par la même
fonction, il n'existe pas de code de simulation distinct qui pourrait
diverger.

## Export

Déclenché depuis les réglages, section « Transfert de bibliothèque ».

L'emplacement est mémorisé dans le store après le premier export. Le bouton
« Exporter » réécrit ce fichier sans redemander le chemin ; un lien « changer
d'emplacement » ouvre la boîte de dialogue. Au tout premier export, la boîte
s'ouvre automatiquement.

La passphrase est demandée à chaque export. L'utilisateur choisit celle qu'il
veut, à chaque fois — elle n'est jamais mémorisée, ni dans le store ni dans le
trousseau. Minimum 8 caractères, contrainte déjà portée par
`PASSPHRASE_MIN_LEN` côté Rust.

Le chemin mémorisé garde tout son intérêt : il évite de renaviguer vers le
dossier, ce qui est la friction réelle quand la cible est un dossier de
synchronisation enfoui dans l'arborescence.

Si le fichier mémorisé a disparu (dossier déplacé, disque absent), l'export
rouvre la boîte de dialogue avec un message explicatif plutôt que d'échouer.

## Import

1. L'utilisateur choisit le fichier (`open` avec filtre `.c411lib`).
2. Saisie de la passphrase, déchiffrement, validation du `kind` et de la
   version.
3. La fusion est calculée en mémoire, sans rien écrire.
4. Une fenêtre annonce le résultat des deux options et laisse le choix :

```
Importer la bibliotheque
Fichier exporte le 26/07/2026 a 14:32

  12 nouveaux titres
   3 mis a jour
  45 inchanges

  2 titres absents du fichier
  Ils existaient lors de l'export : probablement supprimes
  sur l'autre machine.

    [x] Dune (2021)
    [x] Severance - Saison 2

  Cochez ceux que vous voulez supprimer ici aussi.

           [ Annuler ]  [ Fusionner ]  [ Ecraser ]
```

La liste des titres absents ne concerne que « Fusionner ». « Écraser »
remplace tout, la question ne se pose pas.

5. Le choix est appliqué, la bibliothèque et les catégories sont écrites, les
   caches mémoire de `library.ts` et `libraryCategories.ts` sont rafraîchis.

« Écraser » remplace intégralement entrées et catégories par le contenu du
fichier. C'est destructif et annoncé comme tel dans la fenêtre.

## Découpage

```
src/lib/librarySync/
  format.ts     types du payload, serialisation, parsing, validation
  merge.ts      fusion pure + MergeSummary, testable sans Tauri
  file.ts       dialogues, invoke des commandes, chemin memorise
src/components/settings/LibraryTransferSection.tsx
src/components/settings/ImportLibraryDialog.tsx
src-tauri/src/profile.rs   export_library, import_library
```

Le HTTP n'entre pas en jeu ici, mais le chiffrement reste côté Rust : la
passphrase ne traverse le JS que le temps de l'appel `invoke`, et le payload
en clair n'existe jamais dans le renderer.

`export_library` reçoit le payload JSON déjà assemblé par le frontend, le
chiffre et l'écrit. `import_library` lit, déchiffre, valide et rend le payload
au frontend, qui pilote la fusion. Ce partage garde `merge.ts` en TypeScript,
donc testable avec les outils existants, tout en laissant la cryptographie
dans le code Rust qui la porte déjà.

## Erreurs

- Passphrase incorrecte → message existant de `unseal`, réessai possible sans
  refermer la fenêtre.
- Fichier illisible, corrompu, ou d'un autre `kind` → message explicite, aucun
  écrit.
- Version de format supérieure à celle connue → invitation à mettre à jour
  l'application, aucun écrit.
- Échec d'écriture à l'export → toast d'erreur, le chemin mémorisé est
  conservé.

Aucune écriture partielle : la fusion est calculée entièrement en mémoire
avant le moindre appel à `saveLibrary`.

## Tests

`merge.test.ts`, sur le modèle de `library.test.ts` :

- entrée présente uniquement dans le fichier → ajoutée
- entrée des deux côtés, `updatedAt` local plus récent, puis distant plus
  récent
- union de `watched` : un épisode vu de chaque côté donne les deux vus
- entrée locale avec `addedAt` postérieur à `exportedAt` → conservée, absente
  de `missing`
- entrée locale avec `addedAt` antérieur à `exportedAt` → présente dans
  `missing`, conservée tant qu'elle n'est pas dans la sélection
- même entrée passée dans la sélection de suppression → retirée
- entrée sans `updatedAt` → retombe sur `addedAt`
- `MergeSummary` cohérent avec l'état rendu
- fusion des catégories, collision d'`id`

Côté Rust, les tests existants de `profile.rs` sont étendus au nouveau `kind`
et au refus croisé entre les deux formats.

## Suite

Le format et la fusion sont ceux dont aurait besoin une synchronisation WebDAV
automatique. L'ajouter plus tard consiste à écrire un backend qui appelle le
même `merge.ts` : `PROPFIND` pour comparer les ETag, `GET` et `PUT` avec
`If-Match` pour le compare-and-swap.

Une seule pièce manquerait : la propagation automatique des suppressions, qui
repose ici sur l'arbitrage de l'utilisateur. Il faudrait alors ajouter au
format un dictionnaire des suppressions horodatées, alimenté à la suppression
d'une entrée et purgé au-delà de quelques mois. C'est un ajout au format, pas
une rupture.
