# Potager idle - document de vision

Date : 2026-10-19. Branche : `feat/potager-automne-vision`.

Ce document remplace la vision du 2026-09-16 (`2026-09-16-potager-automne-vision-design.md`) et les specs de sous-projets qui en découlent. Le Potager garde son thème (potager d'automne, collection de fleurs) mais devient un **soft idle game** avec une nouvelle direction visuelle. Le code actuel de `src/garden/` n'est pas repris : on repart d'un dossier neuf, et l'ancien est supprimé au sous-projet 1 (voir 3.1).

Les passages marqués _(choix du rédacteur)_ n'ont pas été tranchés par l'utilisateur ; ils peuvent être revus pendant la spec du sous-projet concerné.

## 1. Intention

Un petit jeu chill qui vit dans l'app C411 : on commence en faisant tout à la main dans un village-potager, puis on gagne des pièces d'or (PO) pour embaucher des personnages qui travaillent à notre place. Le plaisir vient de voir le village s'animer et s'agrandir, et de compléter l'Herbier en découvrant les fleurs à l'éclosion.

Pourquoi la refonte : la version précédente (vue fixe sur un champ en grille, sprites seuls, outils séparés) ne convenait plus à l'utilisateur. Il veut une boucle de progression idle et un rendu plus riche.

### Objectifs

- Une boucle idle claire : à la main, puis automatisé, avec toujours une prochaine chose à acheter.
- Un rendu HD-2D façon **Octopath Traveler 0** (construction de village), qui donne envie d'ouvrir la fenêtre.
- Un fond passif vivant : le vrai village, avec les employés qui travaillent, derrière l'interface de l'app.
- L'Herbier comme objectif à long terme, avec la surprise à l'éclosion.

### Non-objectifs

- Pas de progression quand l'app est fermée.
- Pas de prestige au lancement.
- Pas de son.
- Pas de saisons autres que l'automne.
- Pas de lien avec l'usage de l'app C411 (aucune récompense liée aux recherches ou téléchargements).

### Anti-objectifs (échec même si "ça marche")

- Un rendu plat ou "jeu mobile générique" : les essais en 2D vue de côté et en 3D toon ont été jugés "extrêmement moches". Le prototype HD-2D validé est le plancher de qualité.
- Révéler la fleur avant l'éclosion (espèce, couleur, variante, nouveauté). Une graine ne montre que sa rareté, partout.
- Un jeu qui exige de l'attention : rien ne meurt, rien ne se perd, aucune pénalité d'absence.

## 2. Décisions de jeu

### 2.1 Fenêtres et fond passif

- Comme avant : le village est rendu **en fond passif** de la fenêtre principale, et la gestion se fait dans une **deuxième fenêtre Tauri "Potager"**. Fermer la fenêtre principale ferme le Potager.
- Le fond passif montre **le vrai village en direct** : les plantes poussent, les employés font leur tournée. Sans interaction.
- Cadrage du fond : **la dernière vue de la caméra du Potager** au moment de sa fermeture (position mémorisée dans la sauvegarde). Avant la toute première ouverture, vue de départ sur les premières parcelles et l'étal _(choix du rédacteur pour ce cas)_.
- Budget du fond : **bridé à 30 images/s** et réglages allégés par rapport au Potager si besoin (ombres, passes de post-process), cible un MacBook à GPU intégré _(choix du rédacteur, repris de l'ancienne vision)_.
- Coexistence avec la mare aux canards inchangée : réglage "Fond animé" = `potager` (défaut) / `mare` / `aucun`.
- Quand le Potager est ouvert, la fenêtre principale fige son fond (image floutée, zéro rendu), comme avant.

### 2.2 Direction artistique

Référence : `docs/superpowers/mockups/potager-idle/reference-octopath-0.webp` (Octopath Traveler 0, construction de village). Prototype validé : `docs/superpowers/mockups/potager-idle/prototype-hd2d.html` (jetable, à ouvrir dans un navigateur ; three.js 0.170 depuis un CDN).

- **Terrain en vraie 3D** : terrasses à plusieurs niveaux, falaises, escaliers, chemins de terre, bord de l'eau. Tout est texturé en **pixel art** (16 pixels par unité de monde, filtrage au plus proche) : herbe, falaises striées avec frange d'herbe, pierre, terre labourée.
- **Bâtiments en 3D** (volumes simples : murs, toit à deux pans, cheminée) avec textures pixel art (briques, tuiles, porte, fenêtre, auvent).
- **Personnages, fleurs, arbres, buissons, touffes d'herbe en sprites** pixel art, debout dans la scène, qui projettent des ombres.
- **Caméra** : perspective en longue focale (fov environ 24°), inclinaison environ 33°, comme dans le prototype.
- **Post-process** : flou de bascule en haut et en bas de l'écran, bloom, vignette, étalonnage chaud, brouillard sur le lointain, poussières lumineuses, feuilles qui tombent.
- **Interface** façon Octopath : bandeaux sombres à filet doré, police à empattements (Cormorant Garamond dans le prototype), objectif courant en haut à droite.
- Toutes les textures et tous les sprites sont **générés par code** (canvas), comme dans le prototype. Pas de fichiers d'images externes.
- Lumière selon l'heure réelle (matin, journée, soir orangé, nuit avec lanternes) _(choix du rédacteur, repris de l'ancienne vision ; le prototype ne montre qu'une fin d'après-midi)_.

### 2.3 Le monde

- Une carte de village-potager **plus grande que l'écran**, qu'on fait défiler.
- La carte s'agrandit en **achetant des parcelles voisines** (emplacements prévus, avec un panneau de prix en jeu comme dans le prototype).
- Quatre **bâtiments à emplacement fixe**, qui apparaissent quand on les débloque :
  - **Étal / boutique** : les clients y achètent des fleurs, le fleuriste y travaille.
  - **Atelier** : le chaudron, l'alchimiste y travaille.
  - **Cabane à graines** : boutique de graines en PO.
  - **Serre** : parcelles abritées où la pousse est plus rapide et la chance de variante spéciale meilleure. Aucune espèce n'y est réservée, pour ne pas trahir l'espèce avant l'éclosion _(choix du rédacteur ; détails dans le sous-projet 5)_.
- Un **panneau d'affichage** pour les commandes courantes (voir 2.7).

### 2.4 Avatar et caméra

- Le joueur incarne un **avatar** (sprite) qui se déplace au clavier (**ZQSD ou flèches**) ou à la **souris** (clic sur le sol = y aller ; clic sur une plante, un client ou un bâtiment = y aller puis agir).
- Actions à la main : **semer** (sur une case vide d'une parcelle, en choisissant une graine), **arroser**, **cueillir**, **servir un client** à l'étal. Au clavier, une touche d'action agit sur la cible devant l'avatar _(choix du rédacteur pour la touche et le ciblage)_.
- **Caméra à deux modes**, avec une bascule : **suit l'avatar**, ou **libre** (glisser à la souris ou bords d'écran pour parcourir la carte).

### 2.5 Pousse et arrosage

- La pousse avance **uniquement quand l'app est ouverte** (fenêtre principale ouverte, que le Potager le soit ou non ; fenêtre réduite ou masquée compte comme ouverte _(choix du rédacteur)_). Le temps de jeu s'accumule ; une absence ne fait rien pousser et ne fait rien perdre.
- Étapes visibles : graine, pousse, bouton, fleur épanouie.
- L'arrosage **accélère** la pousse (jamais obligatoire, rien ne meurt). La terre fonce quand elle est mouillée, puis sèche.

### 2.6 Économie : les PO

- Monnaie unique : les **pièces d'or (PO)**.
- Sources : **vendre des fleurs** aux clients de l'étal (prix selon la rareté), **commandes de bouquets** (mieux payées), **produits de l'atelier**.
- Dépenses : graines, parcelles voisines, bâtiments, embauches, niveaux des employés, nœuds de l'arbre.
- **Vente à la main** : des clients (sprites villageois) arrivent à l'étal ; l'avatar va les servir un par un. Une fleur cueillie va dans un panier, puis est vendue au client _(choix du rédacteur : le panier comme stock entre cueillette et vente)_.

### 2.7 Commandes de bouquets

- **Panneau d'affichage** : commandes courantes (quelques fleurs précises, par espèce, couleur ou rareté), renouvelées régulièrement.
- Une commande ne demande **que des entrées déjà découvertes**, ou une quantité par rareté ("3 fleurs rares"), pour ne rien révéler de l'Herbier _(choix du rédacteur)_.
- **Villageois à commande spéciale** : un personnage passe avec une bulle, demande un bouquet plus exigeant, mieux payé _(choix du rédacteur pour le gain)_, puis repart s'il n'est pas servi après un délai, sans pénalité.

### 2.8 Graines

- La **cabane à graines** vend des graines en PO. **Seule la rareté est visible** ; l'espèce, la couleur et la variante se découvrent à l'éclosion.
- La **cueillette** donne parfois une graine (dont des rares), à taux fixe.
- Les sachets quotidiens et le pity de l'ancienne version sont **supprimés**.

### 2.9 Employés

Embauchés avec des PO, dans cet ordre de déblocage :

1. **Arroseur** : arrose les plantes sèches.
2. **Jardinier** : sème dans les cases vides.
3. **Cueilleur** : cueille les fleurs épanouies.
4. **Fleuriste** : sert les clients et prépare les commandes du panneau.
5. **Alchimiste** : fait tourner l'atelier.

- Chaque employé est un sprite qui marche et travaille réellement dans le village (comme l'arroseur du prototype), visible aussi dans le fond passif.
- Chaque employé **monte en niveau contre des PO** : plus rapide et/ou couvre plus de parcelles _(choix du rédacteur pour l'effet exact d'un niveau)_. Un seul exemplaire par métier.
- Le jardinier choisit ses graines dans l'inventaire _(choix du rédacteur : par rareté la plus commune d'abord, pour garder les rares au joueur)_.

### 2.10 Herbier

- Repris de l'ancienne version : une entrée = espèce x couleur ; la rareté (commune / rare / épique / légendaire) est portée par la couleur ; variantes spéciales (givrée / dorée / luminescente) rares et orthogonales.
- **Catalogue repris tel quel** : 14 espèces, 65 entrées (`src/garden/core/catalog/species.ts` et `colors.ts`, y compris les notes du jardinier et la Lanterne-de-lune légendaire). Les sprites sont redessinés pour le nouveau style.
- La découverte à l'éclosion inscrit l'entrée dans l'Herbier.

### 2.11 Atelier et arbre de progression

- **Atelier** : chaudron, préparations en temps de jeu, recettes ; ses produits se vendent ou servent (accélérateurs, teintures, chance de variante...). Le contenu exact des recettes sera revu dans le sous-projet 6 ; l'ancienne spec atelier (`2026-09-22-potager-atelier-design.md`) sert de réservoir d'idées.
- **Arbre de progression mixte** : une tâche réussie déverrouille un nœud, puis on l'**achète en PO**. Les nœuds débloquent bâtiments, parcelles, recettes, niveaux maximum des employés. L'objectif affiché en haut à droite (comme "Récolter 10 fleurs. 3/10" dans le prototype) est la tâche en cours.

### 2.12 Rythme visé _(choix du rédacteur, à équilibrer en jeu)_

- Début : beaucoup de clics, première embauche (arroseur) après environ 10 à 15 minutes de jeu actif.
- Ensuite : chaque palier plus long ; le jeu devient surtout de la gestion (que débloquer, qui monter en niveau).
- Herbier complet : objectif de plusieurs semaines.

## 3. Architecture

Contraintes et orientations pour le builder ; le détail se tranche dans la spec de chaque sous-projet.

### 3.1 Code

- **Nouveau dossier**, sans import de l'ancien `src/garden/` ni du code des canards. Nom proposé : `src/potager/` _(choix du rédacteur)_. Le catalogue d'espèces et de couleurs est **copié** dans le nouveau dossier.
- **L'ancien `src/garden/` est supprimé au sous-projet 1** : le nouveau Potager prend sa place (fenêtre "Potager", capability, réglage "Fond animé"). L'ancien n'a jamais été publié, aucune sauvegarde à migrer.
- Même découpage que l'ancienne version, qui a bien fonctionné : `core/` (logique pure TypeScript, testée sous Vitest, sans React ni three.js), `textures/` (générateurs pixel art canvas), `render/` (scène three.js impérative), `ui/` (React).
- three.js reste la dépendance de rendu (déjà dans le projet, attention : `PCFSoftShadowMap` est retiré en 0.186, utiliser `PCFShadowMap`).

### 3.2 Simulation et fenêtres

- Le fond passif montre le village vivant même Potager fermé : la **simulation doit tourner tant que la fenêtre principale est ouverte**, pas seulement dans la fenêtre Potager. Il faut **une seule simulation qui fait foi** et **un seul écrivain** de la sauvegarde à la fois. Le builder choisit le mécanisme (par exemple : simulation dans la fenêtre principale, Potager qui envoie des actions et reçoit l'état par événements Tauri).
- Le **rendu** du fond se met en pause (focus perdu, onglet caché, page opaque, Potager ouvert) ; la **simulation**, elle, continue tant que l'app est ouverte.
- Temps de jeu : accumulé en temps réel app ouverte, calculé à partir du temps écoulé réel et non du nombre de ticks (WebKit ralentit les minuteries des fenêtres masquées) ; à la relecture d'une sauvegarde, aucun rattrapage du temps passé app fermée.

### 3.3 Sauvegarde

- Fichier dédié via tauri-plugin-store, versionné, séparé de `settings.json` et de la sauvegarde des canards. Nom : `potager.json` _(choix du rédacteur, pour ne pas lire par erreur l'ancien `garden.json`)_.
- Export / import dans les paramètres, comme avant.
- Sauvegarde illisible : copie de côté, partie neuve, toast.

### 3.4 Aperçu navigateur

- Le shim `devTauriShim` doit permettre de jouer dans le navigateur (`bun run dev`) : simulation, Potager et fond passif, au moins séparément.

### 3.5 Tests

- Vitest sur `core/` : pousse en temps de jeu, arrosage, actions de l'avatar et leurs refus, tirages de graines et révélation à l'éclosion (hasard injecté), économie (prix, achats, refus faute de PO), décisions des employés, commandes, arbre (déblocages, sans cycle), cohérence du catalogue.
- Textes : `accents.test.ts`.
- Rendu et interactions : vérification dans l'aperçu navigateur.

## 4. Découpage en sous-projets

Dans cet ordre, chacun avec sa spec, son plan et son implémentation ; chaque étape donne quelque chose de jouable. Ce document ne se planifie pas d'un bloc : la prochaine étape est la spec puis le plan du sous-projet 1.

1. **Socle** : nouveau dossier, scène HD-2D (terrasses, falaises, textures, post-process), caméra suivie / libre, défilement de la carte, fenêtre Potager et fond passif en direct, simulation qui fait foi, sauvegarde.
2. **Avatar et parcelles** : déplacement ZQSD / flèches / clic, semer, arroser, cueillir, pousse, catalogue d'espèces et Herbier.
3. **Économie** : PO, clients à servir à l'étal, cabane à graines, achat de parcelles voisines, déblocage des bâtiments.
4. **Employés** : arroseur, jardinier, cueilleur, fleuriste, niveaux.
5. **Commandes et serre** : panneau d'affichage, villageois à commande spéciale, serre.
6. **Atelier et arbre** : chaudron, alchimiste, arbre mixte (tâche puis PO).

## 5. Laissé au builder

- Valeurs d'équilibrage (prix, durées, gains, coûts de niveaux), dans l'esprit de 2.12.
- Disposition précise de la carte (terrasses, emplacements des bâtiments et des parcelles), dans l'esprit de la référence et du prototype.
- Détail des sprites (tailles, animations), tant que le rendu reste au niveau du prototype.
- Mécanisme technique de la simulation unique (3.2).

## 6. Hors périmètre

- Progression app fermée, prestige, son.
- Sachets quotidiens et pity.
- Hybrides (à rediscuter avec l'atelier, sous-projet 6).
- Corbeaux, tas de feuilles, outils séparés de l'ancienne version.
- Saisons autres que l'automne.
