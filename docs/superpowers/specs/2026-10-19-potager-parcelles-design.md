# Potager : parcelles, outils et mini-jeux (sous-projet 2, suite)

Suite du déplacement de l'avatar (`docs/superpowers/plans/2026-10-19-potager-avatar-deplacement.md`, livré). Ce document complète la vision `2026-10-19-potager-idle-vision-design.md` et **la remplace là où elles divergent** (voir 1.3).

## 1. Intention

### 1.1 Pourquoi

Le joueur doit avoir de quoi s'occuper. Au début, **tout se fait à la main** : bêcher, semer, arroser, cueillir, désherber, chasser les corneilles, aller au puits, ranger ses outils. Chaque geste est un petit mini-jeu, différent d'un geste à l'autre, et il faut **se déplacer** dans le village pour tout faire.

Plus tard (sous-projets suivants), le joueur automatise avec de meilleurs outils et des employés. **Un employé reste moins efficace que le joueur** tant qu'il n'est pas amélioré au maximum : jouer activement reste rentable longtemps. Après de nombreuses heures, le joueur devient gestionnaire de son potager. Cette étape pose donc les gestes manuels et leurs mini-jeux, base de toute la progression.

### 1.2 Objectifs, non-objectifs, anti-objectifs

- **Objectifs** : cycle complet d'une case (bêcher, semer, arroser, pousse, cueillir), un mini-jeu distinct par geste, outils qui occupent de la place, inventaire limité, abri de jardin (râtelier + coffre), puits, mauvaises herbes, corneilles, cueillette en forêt, révélation à l'éclosion, Herbier.
- **Non-objectifs (étapes suivantes)** : PO, vente, clients, cabane à graines, achat de parcelles et de bâtiments, outils améliorés, sac plus grand, employés, variantes spéciales (givrée / dorée / luminescente), feuilles mortes et compost.
- **Anti-objectifs** :
  - Rien ne meurt et rien ne se perd : rater un mini-jeu donne simplement moins qu'une réussite. Une plante négligée pousse plus lentement, jamais ne fane.
  - **Aucune fuite avant l'éclosion** : une graine ne montre que sa rareté, partout (inventaire, coffre, case semée, infobulles). Espèce et couleur se découvrent à l'éclosion seulement.
  - Mini-jeux longs ou punitifs : chacun dure quelques secondes (8 s au plus) et doit rester agréable après des dizaines de répétitions.

### 1.3 Écarts avec la vision

- La vision classait les « outils séparés » et les corneilles hors périmètre ; ils reviennent ici, voulus par l'utilisateur.
- La vision prévoyait des actions en un clic ; chaque geste devient un mini-jeu.
- La vision parlait d'un panier comme stock entre cueillette et vente ; il devient l'inventaire limité du joueur (6 cases), outils compris.

## 2. Ce que le joueur vit

### 2.1 Cycle d'une case

Les parcelles possédées (`p0` au départ) sont découpées en cases. État d'une case :

1. **Herbe** : non travaillée.
2. **Bêchée** (outil : bêche) : prête à recevoir une graine.
3. **Semée** (à la main, avec une graine de l'inventaire) : la case affiche la rareté de la graine et rien d'autre.
4. **Pousse** en temps de jeu : graine, pousse, bouton, fleur épanouie (4 étapes visibles). Jusqu'à l'épanouissement, aucun indice d'espèce ni de couleur.
5. **Épanouie** : espèce et couleur visibles ; l'entrée s'inscrit dans l'Herbier à ce moment (pas à la cueillette). L'éclosion est un **moment fort** : petite animation sur la case (éclat, pétales qui s'ouvrent) et, si l'entrée est nouvelle dans l'Herbier, un signal « Nouvelle découverte ! » avec le nom de la fleur. Si l'éclosion a lieu pendant que le Potager est fermé, la case garde l'état « épanouie, pas encore vue » et l'animation se joue quand le joueur la voit à la prochaine ouverture du Potager (pas de notification dans la fenêtre principale).
6. **Cueillie** (à la main) : la fleur va dans l'inventaire, la case redevient **herbe** (il faut rebêcher).

L'**arrosage** (outil : arrosoir) se fait sur une case semée ou en pousse. Une case arrosée est plus sombre, puis sèche.

### 2.2 Mini-jeux

Maquettes validées par l'utilisateur : `.superpowers/brainstorm/15239-1792439805/content/mini-jeux-v5.html` (jouables dans un navigateur ; valeurs de référence pour les durées et tolérances). Chaque mini-jeu donne **Parfait**, **Bien** ou **Raté**.

| Geste     | Mécanique                                                                                                                                                  | Commande         | Effet du résultat                                                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Bêcher    | Rythme : 3 coups, appuyer quand le cercle qui se resserre touche l'anneau                                                                                  | Action           | Parfait : terre meuble, la plante qui y poussera gagne +10 % de vitesse. Bien et raté : case bêchée normalement.                      |
| Semer     | Précision : la graine se balance au-dessus du sillon, la lâcher au-dessus du trou (zones larges : parfait +-18 px, bien +-42 px sur 320 px, période lente) | Action           | Parfait : la première étape (graine vers pousse) est 30 % plus courte. Bien : 15 %. Raté : normal.                                    |
| Arroser   | Dosage : maintenir pour verser, relâcher dans la zone verte                                                                                                | Action maintenue | Accélération de la pousse tant que la case est humide : parfait x1,5, bien x1,3, raté x1,15. Consomme 1 arrosage.                     |
| Cueillir  | Séquence : 3 flèches à taper dans l'ordre en 2,5 s                                                                                                         | Flèches          | Parfait : fleur « belle » (qualité gardée pour la vente future), chance de graine 30 %. Bien : 20 %. Raté : fleur ordinaire, 10 %.    |
| Puits     | Équilibre : le seau remonte en tanguant, le garder droit (gauche / droite)                                                                                 | Gauche / droite  | L'eau restante remplit l'arrosoir : 5 arrosages x part d'eau restante, arrondi, au moins 1.                                           |
| Désherber | Tension : maintenir pour tirer, garder le curseur dans une zone verte mobile jusqu'à ce que la racine sorte (outil : serfouette)                           | Action maintenue | Parfait et bien : herbe arrachée. Raté : herbe arrachée mais la racine casse, une herbe repousse sur la même case 1 minute plus tard. |

- Pendant un mini-jeu, l'avatar ne bouge pas ; il est affiché au-dessus de la case concernée, dans le style des bandeaux HD-2D (filet doré, fond sombre).
- Annulation : Échap ou s'éloigner n'est pas possible pendant un mini-jeu ; il finit toujours sur un résultat. Les durées et limites de la maquette font foi (bêcher environ 4 s, désherber au plus 8 s avant « Raté »).
- À la souris : maintenir le clic équivaut à maintenir l'action ; pour le puits, maintenir le clic sur la moitié gauche ou droite de l'écran.

### 2.3 Commandes

- **Action** : Espace. Elle agit sur la case devant l'avatar (dans sa direction de marche, à moins de 1 unité) ou sur l'objet interactif le plus proche à portée (abri, puits, champignon, corneille).
- **Clic** sur une case, un objet ou l'abri : l'avatar s'y rend (chemin existant), puis l'action se lance à l'arrivée.
- L'action est **contextuelle** : herbe vers bêcher, bêchée vers semer, semée ou en pousse vers arroser, épanouie vers cueillir, mauvaise herbe vers désherber.
- **L'objet en main** est la case sélectionnée de l'inventaire (touches 1 à 6 ou clic). Chaque geste exige le bon objet en main : bêche pour bêcher, une pile de graines pour semer, arrosoir pour arroser et pour le puits, serfouette pour désherber. Cueillir se fait à mains nues, quel que soit l'objet en main.
- **Objet manquant** : pas de mini-jeu, un message court s'affiche au-dessus de l'avatar : « Prends la bêche en main (touches 1 à 6) » si elle est dans le sac, « Il te faut la bêche (elle est à l'abri) » sinon. Même logique pour les graines et l'arrosoir, plus « Plus de graines », « L'arrosoir est vide », « Ton sac est plein ».
- **Surbrillance** : la case (ou l'abri, le puits) visée se met en surbrillance (cadre doré pulsant) quand l'action y est possible avec l'objet en main ; rien ne s'éclaire sinon. La cible est la case devant l'avatar, sinon celle où il se tient.

### 2.4 Inventaire et outils

- **6 cases.** Chaque outil occupe une case. Les objets identiques s'empilent par 5 : graines **par rareté** (5 graines rares = 1 case, quelle que soit leur espèce cachée), champignons, glands. Les fleurs s'empilent avec la même espèce, la même couleur et la même qualité.
- **Outils** : bêche, arrosoir, serfouette. Semer et cueillir se font à la main. L'arrosoir affiche son niveau (arrosages restants sur 5).
- Ramasser quand l'inventaire est plein : refusé, message, l'objet reste au sol ou sur la case.
- Barre d'inventaire en bas de l'écran du Potager, style HD-2D ; une graine n'y montre que sa rareté (couleur de rareté, aucun nom d'espèce).

### 2.5 Abri de jardin

- Nouvel élément fixe de la carte, près de la maison et de l'étal, à l'ouest de la parcelle `p0`.
- Il regroupe un **râtelier** (outils) et un **coffre** (graines, fleurs, cueillette ; capacité illimitée).
- Interagir avec l'abri ouvre un panneau : inventaire d'un côté, râtelier et coffre de l'autre ; un clic déplace un objet ou une pile entre les deux. Le panneau se ferme avec Échap ou en s'éloignant.
- Partie neuve : les 3 outils sont dans le râtelier, l'inventaire contient 5 graines communes (1 case).

### 2.6 Puits

- Nouvel élément fixe de la carte, sur la terrasse du milieu, à distance de l'abri et des parcelles (il doit coûter un petit trajet).
- Interagir avec le puits, arrosoir dans l'inventaire, lance le mini-jeu d'équilibre puis remplit l'arrosoir. Sans arrosoir : message.

### 2.7 Pousse

Durées en temps de jeu (app ouverte, comme la vision 2.5), de la graine à l'épanouissement, réparties en 4 étapes égales :

| Rareté     | Durée de base |
| ---------- | ------------- |
| Commune    | 10 min        |
| Rare       | 15 min        |
| Épique     | 20 min        |
| Légendaire | 30 min        |

- Modificateurs multiplicatifs sur la vitesse : arrosage (tant que la case est humide, **3 min de jeu** après l'arrosage), terre meuble (bêchage parfait), mauvaise herbe voisine (x0,5), corneille posée (x0).
- Une case arrosée de nouveau pendant qu'elle est humide repart pour 3 min avec le dernier résultat.

### 2.8 Graines et révélation

- Une graine est tirée **au moment où on l'obtient** (espèce et couleur parmi les entrées du catalogue de sa rareté, `entriesOfRarity`) mais reste cachée jusqu'à l'éclosion ; seule sa rareté est visible.
- Sources dans cette étape : stock de départ (5 communes), cueillette d'une fleur (chance selon 2.2), cueillette en forêt (2.10).
- Rareté d'une graine obtenue en cueillant : commune 70 %, rare 22 %, épique 7 %, légendaire 1 %.

### 2.9 Gêneurs

- **Mauvaises herbes** : en temps de jeu, environ une toutes les 5 min par parcelle possédée, sur une case au hasard (herbe, bêchée ou plantée), au plus 3 par parcelle. Elle ralentit de moitié les plantes de sa case et des 8 cases voisines. On l'arrache avec la serfouette (mini-jeu de tension). Elle peut apparaître même si le joueur n'est pas dans le Potager (la simulation tourne app ouverte).
- **Corneilles** : environ une toutes les 4 min de jeu, si au moins une case est semée ou en pousse. Elle se pose sur une telle case et bloque sa pousse tant qu'elle y reste. Elle s'envole quand l'avatar passe à moins de 2 unités ou quand on clique dessus (l'avatar s'en approche). Pas de mini-jeu. Une corneille qui n'est pas chassée part d'elle-même après 3 min de jeu.

### 2.10 Cueillette en forêt

- Points d'apparition sous les arbres du plateau (au moins 6 points). Au plus 4 objets présents à la fois ; un objet réapparaît sur un point libre toutes les 3 min de jeu.
- **Champignon** : donne 1 graine, commune 85 %, rare 13 %, épique 2 %.
- **Gland** : donne 1 graine, commune 55 %, rare 33 %, épique 10 %, légendaire 2 %.
- Ramassage par l'action ou le clic, sans mini-jeu : l'objet donne directement sa graine (qui va dans l'inventaire), il ne se garde pas lui-même. Inventaire plein : refusé, l'objet reste en place.

### 2.11 Herbier

- Ouvert depuis le HUD du Potager (bouton) ou la touche H.
- Une entrée par espèce x couleur du catalogue (14 espèces, 65 entrées). Entrée découverte : nom, couleur, rareté, note du jardinier, sprite. Entrée non découverte : silhouette et « ? », sans nom ni couleur.
- Compteur « découvertes / 65 ».

### 2.12 Rendu

- Cases, terre bêchée, humidité, étapes de pousse, mauvaises herbes, corneilles, champignons, glands, abri, puits : sprites générés par code (canvas), dans le style du rendu actuel.
- Fleurs épanouies : **chaque espèce est reconnaissable au premier coup d'oeil**, par une forme qui lui est propre (silhouette, pétales, taille, tige), déclinée par couleur. Les 14 espèces ont donc chacune leur dessin (ou une variante paramétrée nettement distincte), pas une silhouette partagée.
- Le fond passif de la fenêtre principale montre l'état du potager (cases, plantes, gêneurs).

## 3. Contraintes techniques

- Logique en TypeScript pur dans `src/potager/core/` (sans React ni three.js), testée sous Vitest : cycle d'une case, résultats des mini-jeux et leurs effets, pousse et modificateurs, inventaire (piles, capacité, refus), abri, gêneurs (apparition, effet, départ), forêt, tirages (hasard injecté), révélation et Herbier.
- La logique des mini-jeux (jauges, tolérances, résultat en fonction des entrées et du temps) est elle aussi pure et testée ; leur affichage est à part.
- La **simulation qui fait foi** reste celle du socle (fenêtre principale, ou fenêtre Potager quand elle est ouverte) : pousse, mauvaises herbes, corneilles et forêt avancent dans la simulation, en temps de jeu, jamais app fermée.
- Sauvegarde `potager.json`, toujours `version: 1` : chaque nouveau champ est facultatif à la lecture avec une valeur par défaut (partie neuve pour ce champ). Une sauvegarde actuelle doit se charger sans être traitée comme corrompue.
- Le catalogue garde son champ `tool` (`main` / `secateur`) mais **cette étape l'ignore** : toute fleur se cueille à la main.
- Textes affichés en français accentué ; règles de structure de `CLAUDE.md` (un composant par fichier, helpers à part).

## 4. Laissé au builder

- Taille des cases et découpage des parcelles en cases.
- Position exacte de l'abri, du puits et des points de forêt (respecter 2.5, 2.6, 2.10).
- Affichage des mini-jeux (overlay HTML ou dans la scène), tant que le style HD-2D est respecté et que les mécaniques et tolérances des maquettes sont reprises.
- Équilibrage fin des durées et taux à l'intérieur de l'esprit de 2.7 à 2.10.
- Découpage en plans : prévoir au moins deux plans jouables successifs, (1) cycle d'une case, inventaire, outils, abri, puits, Herbier, éclosion ; (2) mauvaises herbes, corneilles, forêt. Les sprites des 14 espèces peuvent faire l'objet de leur propre plan si le volume le demande.

## 5. Choix du rédacteur (à vérifier par l'utilisateur)

- Effets chiffrés des résultats de mini-jeux (2.2), durées de pousse (2.7), fréquences des gêneurs (2.9) et de la forêt (2.10).
- L'Herbier s'inscrit à l'épanouissement, pas à la cueillette.
- Graines empilées par rareté seule.
- Coffre de capacité illimitée.
- Variantes spéciales et outil sécateur reportés.
