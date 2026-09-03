# Setup - refonte de l'etape "cles API"

Date : 2026-09-03
Branche : `feat/setup-keys-wizard`

## Objectif

Le step `keys` du setup affiche aujourd'hui les trois cles d'un seul bloc :
trois cartes ouvertes en meme temps, quinze lignes de tutoriel, trois champs
mot de passe, aucun retour avant le bouton "Continuer". C'est dense et
intimidant pour un utilisateur non technique.

Le step devient un sous-wizard : un ecran par cle, une seule action visible a
la fois, une verification apres chaque saisie.

## Decisions cadrees

| Sujet          | Choix                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Forme          | Sous-wizard, 1 cle = 1 ecran, meme transition que les autres steps du setup |
| Validation     | Appel reseau reel, jamais bloquant : on informe, on laisse passer           |
| TMDB           | Obligatoire, comme C411 et AllDebrid                                        |
| Perimetre      | Textes des tutoriels extraits en source unique, partagee avec `ApiKeysForm` |
| UI Preferences | Inchangee (formulaire compact), elle consomme juste la source unique        |
| Visuel         | Aucune capture d'ecran : le tutoriel reste textuel (trois etapes)           |
| Champ vide     | Seul cas qui desactive le bouton                                            |

## Architecture

### Fichiers

Nouveaux :

- `src/lib/keyServices.ts` - table des trois services. Pour chacun : `id`,
  `name`, `logo`, `url`, `urlLabel`, `badge` ("free" | "paid"), `tagline`,
  `steps` (exactement 3), `placeholder`, `keyName` (nom keyring) et
  `check(key)`. Pur, sans JSX.
- `src/components/setup/keys/KeyWizard.tsx` - orchestration : index courant,
  valeurs saisies, etat de verification par service, `AnimatePresence` entre
  les ecrans, sortie vers `display`.
- `src/components/setup/keys/KeyScreen.tsx` - un ecran. Presentation pure,
  recoit un service et des callbacks.

Modifies :

- `src/pages/SetupPage.tsx` - le bloc `step === "keys"` devient un rendu de
  `<KeyWizard />`. Suppression de `KeyCard`, de `C411_STEPS`,
  `ALLDEBRID_STEPS`, `TMDB_STEPS` et de l'etat `c411Key` / `allDebridKey` /
  `tmdbKey` (deplace dans le wizard). `handleKeysNext` devient le `onDone` du
  wizard : ecriture keyring des trois cles puis `setStep("display")`.
- `src/components/ApiKeysForm.tsx` - ses trois tableaux d'etapes sont
  supprimes au profit de `keyServices.ts`. Le rendu reste identique.
- `src/lib/services/c411.ts` - ajout de `validateKey`.
- `src/lib/services/allDebrid.ts` - ajout de `validateKey`.
- `src/components/setup/ServicesStep.tsx` - la description TMDB affirme que
  l'app fonctionne sans la cle. Elle devient obligatoire : le texte est
  corrige et le badge reste "Gratuit".

### Anatomie d'un ecran

```
<- Retour                          . o o     Etape 1 sur 3

        [logo]  Votre cle C411   .Gratuit.
        Le moteur de recherche. Deux minutes.

   1  Ouvrez c411.org et connectez-vous     [ Ouvrir ^ ]
   2  Profil, en haut a droite > Integration API
   3  Creer une cle, puis collez-la ici

   [ cle ............................. ]  (oeil)

   [             Verifier  ->              ]
```

Points qui changent par rapport a l'existant :

- "Ouvrir le site" est dans l'etape 1, la ou l'utilisateur en a besoin, et non
  en petit en haut a droite de la carte.
- Le champ de saisie a un bouton oeil : une cle collee de travers est
  aujourd'hui invisible, donc indebuggable.
- Trois etapes maximum, ecrites a l'imperatif.
- Aucun scroll a la resolution de la fenetre par defaut.

"Retour" depuis l'ecran 1 renvoie au step `network`. Depuis les ecrans 2 et 3,
il revient a l'ecran precedent, valeur saisie conservee.

### Validation

Signature commune :

```ts
type KeyCheck = "valid" | "invalid" | "unreachable";
```

- C411 : `searchTorrents` minimal (`perPage=1`) ; 401/403 -> `invalid`.
- AllDebrid : `GET /v4/user?agent=c411` (Bearer, comme `fetchMagnets`) ; reponse `status !== "success"` ou 401 ->
  `invalid`.
- TMDB : `validateKey` existe deja et renvoie un booleen en levant sur reseau ;
  on l'enveloppe pour rendre les trois signatures identiques.

Toute `NetworkError` autre qu'une authentification refusee donne
`unreachable`.

Le bouton porte "Verifier" tant qu'aucun test n'a eu lieu. Au clic : spinner,
puis

- `valid` : coche verte, glissement vers l'ecran suivant apres 400 ms ;
- `invalid` : bandeau ambre (pas rouge, ce n'est pas bloquant) - `Cette cle
semble incorrecte : C411 l'a refusee. Vous pouvez continuer, mais la
recherche ne fonctionnera pas tant qu'elle n'est pas corrigee.` Le bouton
  devient `Continuer quand meme ->` ;
- `unreachable` : meme bandeau, message different - `Impossible de joindre C411
pour verifier la cle. Elle sera peut-etre valide une fois votre connexion
retablie.`

Modifier le champ apres un echec efface le bandeau et remet le bouton sur
"Verifier". Un champ vide desactive le bouton, avec la mention `Collez votre
cle pour continuer.`

### Sortie du wizard

Les trois cles partent au keyring en une seule fois a la fin, comme le fait
`handleKeysNext` aujourd'hui. Si au moins une cle est ressortie `invalid` ou
`unreachable`, le dernier ecran affiche avant de sortir un rappel discret
listant les services concernes et indiquant qu'elles se corrigent dans les
Preferences. Ce rappel n'empeche pas de continuer.

## Hors perimetre

- L'UI des Preferences : elle consomme la source unique mais garde son
  formulaire compact. Un utilisateur deja installe ne repasse pas par un
  wizard pour changer une cle.
- Les autres steps du setup (`display`, `downloads`, `theme`).
- Toute illustration du parcours sur les sites tiers : ecarte pour ne pas
  diffuser de captures de comptes reels.

## Verification

- `bunx tsc --noEmit` passe.
- Parcours complet du setup en preview navigateur (`bun run dev`) : les trois
  ecrans s'enchainent, le retour conserve les valeurs, une cle bidon produit
  le bandeau ambre et laisse passer, les trois cles sont bien ecrites.
- Panneau Preferences > Cles API : les textes affiches sont identiques a ceux
  du wizard.
