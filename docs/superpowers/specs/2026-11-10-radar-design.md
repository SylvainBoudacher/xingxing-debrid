# Radar - alertes de sortie sur C411

Date : 2026-11-10

Les points marqués **[choix Claude]** n'ont pas été décidés explicitement par l'utilisateur. Le reste vient de lui ou a été proposé sans objection.

## Intention

Aujourd'hui, pour savoir si le nouvel épisode d'une série hebdomadaire ou un film attendu est arrivé sur C411, il faut aller le chercher à la main. Radar fait cette recherche à la place de l'utilisateur et le prévient, y compris quand le contenu est sorti dans une autre version que celle qu'il attendait.

Le succès : ouvrir l'app et voir immédiatement ce qui est sorti depuis la dernière fois, sans rechercher quoi que ce soit.

## Objectifs

- Une page dédiée, "Radar", séparée des autres fonctions de l'app.
- Une liste remplie par l'utilisateur, contenant des films et des saisons de séries.
- Une vérification à chaque lancement de l'app, et à la demande avec un bouton "Vérifier".
- Une notification dans l'app, et un état bien visible dans la liste.
- Un choix entre alerte stricte et mi-alerte.
- Des filtres et une manipulation facile de la liste, notamment la suppression.
- Un repère quand un film ou un épisode est déjà dans la bibliothèque.
- Un bouton de test de la notification, visible uniquement en mode dev.

## Hors périmètre

- Aucun téléchargement automatique, rien ne part seul vers AllDebrid.
- Aucune vérification quand l'app est fermée.
- Aucune notification macOS, seulement dans l'app.
- Pas de suivi de Nyaa ni des mangas : uniquement C411.

## À éviter absolument

- Une fausse alerte quand C411 ne répond pas.
- Être relancé à chaque démarrage pour la même chose.
- Une avalanche de notifications à l'ajout d'une saison déjà commencée.
- Ralentir le lancement de l'app.

## La page

Disposition retenue : une liste en deux blocs (maquette A).

- En-tête : titre "Radar", heure de la dernière vérification réussie, boutons "Vérifier" et "+ Ajouter".
- Bloc "Sorti" en haut, bloc "En attente" en dessous.
- Chaque ligne : affiche, titre (avec la saison pour une série), état, attente réglée, action.
- Une ligne en alerte complète est marquée en vert, une ligne en mi-alerte en orange, avec par exemple "Alternative disponible : VOSTFR 720p".
- Le bouton "Voir" ouvre les versions disponibles, comme la fiche Découvrir (`DiscoverReleasesModal`), sur la bonne saison.

Une entrée "Radar" s'ajoute au menu (`AppMenu`), à côté de Découvrir, avec une pastille tant qu'il reste des alertes non vues. **[choix Claude]** Radar ne s'ajoute pas aux choix de page de démarrage.

Une série est suivie par saison : une ligne par saison. La ligne résume ses épisodes, et le détail épisode par épisode n'est pas affiché dans la page.

## Ajouter un titre

- Depuis "+ Ajouter" sur la page, avec une recherche TMDB films et séries. Pour une série, on choisit la saison, la dernière étant présélectionnée **[choix Claude]**.
- Depuis la fiche d'un film ou d'une série dans Découvrir.
- À l'ajout, l'utilisateur choisit la langue attendue, la résolution attendue et le mode. Ces champs sont pré-remplis avec des valeurs par défaut réglables une fois pour toutes (dans Préférences **[choix Claude]**). Ils restent modifiables ensuite sur chaque ligne.
- Un titre et une saison ne peuvent être présents qu'une fois dans la liste **[choix Claude]**.

Radar dépend de TMDB pour identifier les titres et compter les épisodes. Sans clé TMDB ou sans clé C411, la page explique ce qui manque au lieu d'afficher une liste inutilisable **[choix Claude]**.

## Les deux modes

- **Strict** : seule la version attendue déclenche quelque chose. Les autres versions ne provoquent aucune notification et la ligne reste "En attente".
- **Souple** : la version attendue donne une alerte complète. Le même contenu dans une autre qualité ou d'autres réglages donne une mi-alerte, avec une notification plus discrète.

Règles :

- Une mi-alerte n'arrête pas le suivi. Si la version attendue arrive ensuite, l'alerte complète part pour ce même contenu.
- Une même alternative ne notifie qu'une seule fois. **[choix Claude]** Une alternative est identifiée par le contenu (film ou épisode), le groupe de langue et la résolution. Une seconde VOSTFR 720p d'une autre équipe ne notifie pas, une VOSTFR 1080p notifie.
- **[choix Claude]** "3 nouveautés" compte des contenus (films ou épisodes), pas des releases.

**[choix Claude]** Comparaison avec la version attendue :

- Langue au choix : "VF" (`VFF`, `VFQ`, `VF2`, `TRUEFRENCH`, `FRENCH`, `VF`, `MULTI`), "VOSTFR" ou "Peu importe".
- Résolution au choix : une valeur minimale, ou "Peu importe". Attendre du 1080p accepte aussi du 2160p, et refuse du 720p.
- Les tags sont lus avec `parseReleaseTags`. Une release dont la langue ou la résolution n'est pas lisible n'est jamais une correspondance exacte : en mode souple elle donne une mi-alerte.

## Détection

Au lancement, après le démarrage et sans le bloquer, puis à chaque clic sur "Vérifier" :

1. Pour chaque ligne active, chercher sur C411 avec `searchC411` et filtrer avec `filterMovieReleases` ou `filterTvReleases`.
2. Pour une série, lire l'étendue de chaque release avec `parseReleaseScope` : un épisode, ou une saison. **[choix Claude]** Un pack de saison couvre uniquement les épisodes déjà diffusés selon TMDB, pour qu'un pack publié en cours de saison n'éteigne pas les alertes hebdomadaires. Une plage comme `S02E01-E03` couvre seulement ses épisodes (`parseReleaseScope` la classe aujourd'hui comme une saison, à étendre). Une intégrale ne compte pas pour une saison suivie, `filterTvReleases` l'exclut déjà.
3. Comparer avec ce qui était connu lors de la vérification précédente, pour trouver les vraies nouveautés.
4. Si plusieurs choses sont sorties, envoyer une seule notification groupée, par exemple "3 nouveautés".

La notification est un toast (`sonner`). Un clic ouvre la page Radar **[choix Claude]**.

Le nombre d'épisodes d'une saison et leur date de diffusion viennent de TMDB (`tvSeason`). Ils servent à afficher le prochain épisode attendu et à détecter la fin de saison. Un épisode isolé détecté sur C411 compte même si TMDB ne le prévoit pas encore **[choix Claude]**.

Si C411 ne répond pas, ou qu'une ligne échoue, l'état de cette ligne ne change pas et l'heure de "dernière vérification réussie" n'avance pas. Aucune alerte n'est créée.

## Ajouter une saison déjà commencée

Ce qui existe déjà au moment de l'ajout ne déclenche aucune notification : ces versions sont le point de départ. Sont nouveaux les épisodes suivants, et aussi la version attendue d'un contenu déjà présent dans une autre version : si un film ou un épisode est là en VOSTFR 720p à l'ajout et que la VF 1080p attendue arrive ensuite, l'alerte complète part, en mode strict comme en mode souple. Ce qui est mémorisé à l'ajout, ce sont donc les versions vues, pas le contenu comme "réglé".

La ligne affiche "Déjà sur C411 : épisodes 1 à 5", avec un bouton qui ouvre ces versions. Le même principe s'applique à un film déjà présent ("Déjà sur C411"). **[choix Claude]** Cet affichage compte toutes les versions présentes, et le mode strict n'y change rien : il ne concerne que les notifications.

## Vie d'une ligne

- Ouvrir "Voir" sur une ligne marque ses alertes comme vues. La pastille du menu baisse et une saison retourne dans "En attente" jusqu'au prochain épisode.
- Un film sorti reste affiché jusqu'à ce que l'utilisateur le retire.
- **[choix Claude]** Une saison passe à "Saison terminée" quand tous ses épisodes selon TMDB sont disponibles dans la version attendue. Avec "Peu importe" en langue et en résolution, n'importe quelle version suffit. L'utilisateur la retire quand il veut.
- **[choix Claude]** La vérification s'arrête pour un film ou une saison dès que la version attendue est disponible partout. Elle continue tant qu'il manque la version attendue, en mode strict comme en mode souple, jusqu'au retrait de la ligne.
- **[choix Claude]** Modifier la langue, la résolution ou le mode d'une ligne la recalcule comme un nouvel ajout : aucune notification, et ce qui existe déjà s'affiche sur la ligne. Les versions vues (contenu, groupe de langue, résolution) sont donc conservées pour chaque ligne.

## Filtres et manipulation

- Filtres : recherche par titre, type (film ou série), état (sorti, mi-alerte, en attente, déjà en bibliothèque, terminé), mode (strict ou souple).
- Une corbeille sur chaque ligne.
- Une sélection multiple pour supprimer plusieurs lignes d'un coup, sur le modèle de `LibrarySelectionBar`.

## Déjà dans la bibliothèque

- Un film est reconnu par son identifiant TMDB dans la bibliothèque (`LibraryEntry.tmdb`).
- Un épisode est reconnu avec la saison et l'épisode lus dans les noms de fichiers des entrées de ce titre, comme le fait `missingEpisodes`. Un pack présent en bibliothèque couvre les épisodes qu'il contient.
- Une entrée sans identifiant TMDB est comparée par nom normalisé, donc avec un risque d'erreur.
- Un élément déjà en bibliothèque porte un badge et ne déclenche pas de notification.
- **[choix Claude]** Une correspondance incertaine (par nom seul) affiche le badge mais ne supprime pas la notification : mieux vaut une alerte en trop qu'une sortie manquée.

## Mode dev

Dans la section dev de `AppMenu` : une entrée qui déclenche la notification Radar avec des données fictives. Elle passe par le vrai affichage mais ne modifie ni la liste ni son état. **[choix Claude]** Deux variantes : alerte complète et mi-alerte.

## Contraintes

- Tout le texte affiché est en français correctement accentué.
- Stockage local non sensible avec `tauri-plugin-store`, jamais dans le trousseau.
- Suivre la règle du dépôt : un composant par fichier, logique pure dans des modules voisins.
- La comparaison de versions et le calcul des nouveautés sont des fonctions pures, testées.
- Le lancement n'attend jamais Radar.
- **[choix Claude]** Le travail part d'une nouvelle branche créée depuis `main`, et non de la branche Potager en cours.

## Laissé au constructeur

- Schéma exact des données stockées et emplacement (`settings.json` ou fichier dédié).
- Nombre de requêtes C411 simultanées et délai entre elles, tant que le lancement n'est pas gêné et que C411 n'est pas martelé.
- Découpage en composants et hooks.
- Forme exacte de la pastille, du toast et de la boîte d'ajout, dans le style de l'app.
