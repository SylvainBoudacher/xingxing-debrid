# Potager : économie (sous-projet 3)

Suite de la vision `2026-10-19-potager-idle-vision-design.md` (section 4, sous-projet 3) et de la spec des parcelles `2026-10-19-potager-parcelles-design.md`, toutes deux implémentées. Les passages marqués _(choix du rédacteur)_ n'ont pas été tranchés par l'utilisateur ; les valeurs chiffrées sont des points de départ à équilibrer en jeu.

## 1. Intention

### 1.1 Pourquoi

Le cycle d'une case est jouable, mais les fleurs cueillies ne servent à rien d'autre qu'à remplir l'Herbier. Ce sous-projet ferme la boucle : on cueille, on vend à l'étal, on gagne des pièces d'or (PO), on les dépense pour avoir plus de graines, plus de terre et de meilleurs outils. C'est la première marche de la boucle idle (vision 1) : il doit toujours y avoir une prochaine chose à acheter.

### 1.2 Objectifs, non-objectifs, anti-objectifs

- **Objectifs** : monnaie PO, réserve de l'étal, clients qui demandent une fleur précise, mini-jeu de vente, cabane à graines avec sachets et ouverture façon cartes, achat des parcelles voisines par panneau de prix, outils améliorés qui traitent plusieurs cases, réserve de l'étal et coffre de l'abri agrandissables.
- **Non-objectifs (étapes suivantes)** : employés (sous-projet 4), panneau de commandes et villageois à commande spéciale, serre (sous-projet 5), atelier et arbre de progression (sous-projet 6), sac plus grand, variantes spéciales, vente des champignons et glands.
- **Anti-objectifs** :
  - **Aucune fuite avant l'éclosion** : un client ne demande jamais une entrée de l'Herbier non découverte ; un sachet et ses cartes ne montrent que la rareté des graines.
  - Rien ne se perd : rater le mini-jeu de vente ne fait jamais perdre la vente ; un client n'a pas de délai et ne repart pas fâché.
  - Pas de vente forcée : aucune fleur ne quitte la réserve sans que le joueur l'ait choisie.

### 1.3 Écarts avec la vision

- La vision parlait de bâtiments qui apparaissent quand on les débloque. L'étal et la cabane sont présents dès la partie neuve (déjà le cas dans le code) ; l'atelier et la serre **restent absents** de ce sous-projet et arriveront avec leur usage (sous-projets 5 et 6). Pas de panneau « Bientôt » sur leur emplacement.
- La vision décrivait un client qui achète « des fleurs » ; ici il exprime une envie précise mais accepte autre chose.
- La spec des parcelles donnait un coffre d'abri illimité ; il devient limité et agrandissable (2.8), voulu par l'utilisateur.
- La vision supprimait les sachets quotidiens ; ici les sachets reviennent, mais **achetés en PO** à la cabane, sans pity ni gratuité.

## 2. Ce que le joueur vit

### 2.1 PO

- Monnaie unique, entière, stockée dans la sauvegarde. Partie neuve et sauvegardes existantes : **0 PO** _(choix du rédacteur)_.
- Compteur toujours visible dans le HUD du Potager, style bandeau HD-2D. Un gain s'affiche en chiffre flottant (« +18 PO ») au-dessus de l'étal.

### 2.2 Réserve de l'étal

- Interagir avec l'étal ouvre **toujours le même panneau** (voulu par l'utilisateur), sur le modèle de l'abri : sac d'un côté, réserve de l'étal de l'autre ; un clic déplace une pile de fleurs entre les deux. Le même panneau propose l'agrandissement de la réserve et, quand un client est présent, sa demande et le service (2.4). Seules les fleurs vont dans la réserve (ni graines, ni outils).
- Capacité de départ : **6 piles** (une pile = fleurs identiques espèce, couleur, qualité, par 5, comme le sac). Agrandissable (2.7).
- Les fleurs du coffre de l'abri passent par le sac pour aller à l'étal (pas de lien direct coffre vers étal).

### 2.3 Clients

- Un client (sprite villageois, plusieurs apparences) ne vient **que si la réserve contient au moins une fleur**. Un seul client à la fois devant l'étal ; le suivant arrive 5 à 15 s de jeu après le départ du précédent, s'il reste des fleurs _(choix du rédacteur)_.
- Un client présent attend sans limite de temps. Si la réserve se vide pendant qu'il attend, il repart tranquillement.
- **Demande** : une entrée précise espèce x couleur, tirée parmi les entrées **déjà découvertes** de l'Herbier, indépendamment du contenu de la réserve. Pondération vers les raretés communes : commune 60 %, rare 25 %, épique 12 %, légendaire 3 % parmi les raretés découvertes, renormalisé si une rareté n'a aucune entrée découverte _(choix du rédacteur)_. Elle s'affiche dans une bulle au-dessus du client (sprite de la fleur et son nom, par exemple « Une Rose rouge »).
- Herbier vide (aucune découverte) : impossible en pratique, puisqu'une fleur en réserve vient d'une éclosion qui l'a découverte.

### 2.4 Servir

1. L'avatar interagit avec l'étal (action ou clic) : le panneau de l'étal (2.2) affiche en plus la demande du client présent.
2. Le joueur choisit **n'importe quelle fleur de la réserve** et la sert (bouton « Servir » ou clic sur la fleur, au choix du builder) ; il peut aussi seulement réapprovisionner ou agrandir la réserve et refermer, le client continue d'attendre. Les fleurs qui correspondent à l'espèce, à la couleur ou aux deux sont signalées dans le panneau.
3. Mini-jeu **« Nouer le ruban »**, puis paiement, le client repart, la fleur sort de la réserve.

Prix d'une vente :

- **Prix de base selon la rareté** de la fleur vendue : commune 5 PO, rare 15 PO, épique 40 PO, légendaire 100 PO _(choix du rédacteur)_.
- Qualité « belle » : x1,5.
- **Bonus de demande** (voulu par l'utilisateur) : bonne espèce +30 %, bonne couleur +30 %, les deux cumulés (+60 %, le « double bonus »). La couleur se compare seule : une Tulipe rouge vendue à qui voulait une Rose rouge touche le bonus couleur. Pourcentages _(choix du rédacteur)_.
- **Ruban** : Parfait +20 %, Bien +10 %, Raté +0 %.
- Les bonus s'additionnent, puis s'appliquent au prix de base x qualité ; arrondi à l'entier supérieur.

Exemple : Rose rouge commune, belle, donnée à qui voulait une Rose rouge, ruban parfait : 5 x 1,5 x (1 + 0,6 + 0,2) = 13,5, soit 14 PO.

### 2.5 Mini-jeu « Nouer le ruban »

- Mécanique nouvelle (les autres gestes utilisent déjà rythme, précision, dosage, séquence, équilibre, tension) : une aiguille tourne autour d'un cadran circulaire, un nœud est marqué sur le cadran ; appuyer (action ou clic) quand l'aiguille passe sur le nœud. **Deux passages**, le second plus rapide, le nœud déplacé entre les deux.
- Résultat Parfait / Bien / Raté selon l'écart cumulé des deux appuis. Durée totale 3 s au plus, comme les autres mini-jeux (un tour manqué compte comme un appui raté).
- Même présentation que les mini-jeux existants : bandeau HD-2D au-dessus de l'étal, avatar immobile, pas d'annulation.

### 2.6 Cabane à graines

- Interagir avec la cabane ouvre un panneau boutique : trois gammes de **sachets de 3 graines**, à raretés tirées au hasard, achetables à volonté tant qu'on a les PO _(prix et taux : choix du rédacteur)_ :

| Sachet | Prix   | Commune | Rare | Épique | Légendaire |
| ------ | ------ | ------- | ---- | ------ | ---------- |
| Simple | 15 PO  | 80 %    | 17 % | 3 %    | 0 %        |
| Bon    | 50 PO  | 45 %    | 40 % | 13 %   | 2 %        |
| Luxe   | 150 PO | 0 %     | 55 % | 35 %   | 10 %       |

- Chaque graine est tirée à l'achat comme les autres sources (rareté, puis espèce et couleur parmi `entriesOfRarity`), cachée jusqu'à l'éclosion.
- **Ouverture façon cartes**, reprise de `2026-09-23-sachets-ouverture-tcg-design.md` (déchirure au glisser ou au clic, pile de cartes face cachée au dos teinté par la rareté, retournement carte par carte avec effets croissants, récapitulatif), adaptée au style HD-2D du Potager. Seules les sections Déroulé et effets s'appliquent : pas de pile de sachets en attente (le sachet acheté s'ouvre aussitôt), pas de pity, pas de sachet famille. La règle révisée de cette spec tient : la carte montre une graine et « Graine rare », jamais l'espèce, la couleur ni la nouveauté.
- Les graines vont dans le sac (piles par rareté) ; ce qui ne rentre pas va dans le coffre de l'abri, avec un message « Sac plein : graines rangées à l'abri ». Si le sac et le coffre ne peuvent pas tout accueillir, l'achat est refusé avant paiement (« Plus de place pour les graines ») _(choix du rédacteur)_.
- La cabane vend aussi les **outils améliorés** (2.8).

### 2.7 Parcelles voisines

- Chaque parcelle non possédée (`p1`, `p2`, `p3`) porte un **panneau de prix** planté sur place, comme dans le prototype HD-2D. Les trois sont achetables dès le départ, dans n'importe quel ordre.
- Prix : `p1` 80 PO, `p2` 250 PO, `p3` 600 PO _(choix du rédacteur ; `p1` vise environ 10 minutes de jeu actif, vision 2.12)_.
- Interagir avec le panneau ouvre une confirmation (« Acheter cette parcelle pour 80 PO ? »). Pas assez de PO : le panneau l'indique, pas d'achat.
- Après l'achat, le panneau disparaît et la parcelle devient une parcelle possédée comme `p0` (cases en herbe, gêneurs actifs).

### 2.8 Améliorations

- **Outils améliorés** (vendus à la cabane) : un niveau 2 par outil dans ce sous-projet _(choix du rédacteur)_. Un outil de niveau 2 traite **3 cases en ligne** (la case visée et ses deux voisines perpendiculaires à la direction de l'avatar) avec **un seul mini-jeu** dont le résultat s'applique aux cases traitées. **Seule la case visée décide de l'action** (règles actuelles de `prepareAction`) ; une voisine qui n'existe pas ou ne se prête pas à cette même action est simplement sautée _(choix du rédacteur)_.
  - Bêche niv. 2 : bêche 3 cases. 120 PO.
  - Arrosoir niv. 2 : arrose 3 cases pour 1 arrosage. 120 PO.
  - Serfouette niv. 2 : désherbe les mauvaises herbes présentes sur 3 cases. 120 PO.
  - L'achat améliore l'outil existant, où qu'il soit (sac ou râtelier) ; il garde sa case.
- **Réserve de l'étal** : 6 piles, puis 9 (60 PO), puis 12 (200 PO), achetées depuis le panneau de l'étal _(choix du rédacteur)_.
- **Coffre de l'abri** (voulu par l'utilisateur) : il devient **limité**, 12 piles, puis 18 (80 PO), puis 24 (250 PO), achetés depuis le panneau de l'abri _(capacités et prix : choix du rédacteur)_. Coffre plein : déposer une nouvelle pile est refusé avec un message ; compléter une pile existante reste possible. Une sauvegarde dont le coffre dépasse déjà la capacité garde tout son contenu, mais on ne peut plus y ajouter de pile tant qu'on n'est pas repassé sous la limite.

## 3. Contraintes techniques

- Mêmes règles que les sous-projets précédents : logique en TypeScript pur dans `src/potager/core/` (sans React ni three.js), testée sous Vitest avec hasard injecté : prix d'une vente, tirage des demandes (jamais une entrée non découverte), arrivée et départ des clients, réserve (capacité, piles, refus), tirage des sachets, achats (PO insuffisants, parcelle déjà possédée, niveau déjà acheté), outils de niveau 2 sur 3 cases, mini-jeu du ruban.
- La **simulation qui fait foi** reste celle du socle : arrivée des clients en temps de jeu, jamais app fermée. Le client présent est sauvegardé (demande comprise) pour qu'il ne change pas d'envie à la réouverture.
- Sauvegarde : nouveaux champs (PO, réserve de l'étal et sa capacité, client présent, niveaux des outils) lus de façon tolérante, sans changer `version` si le modèle existant le permet ; une sauvegarde actuelle se charge avec 0 PO, réserve vide, outils niveau 1.
- Sprites des clients, panneaux de prix, aiguille et cadran du ruban, sachets : générés par code (canvas), dans le style du rendu actuel.
- Le fond passif montre les clients à l'étal.
- Ouverture des sachets : reconstruite comme les autres panneaux du Potager (React, en surimpression de la scène), en s'appuyant sur l'ancien code supprimé au commit `cb54073` (`packFlow.ts`, `burst.ts`, `TearablePack`, `RevealCard`, `CardBack`, `BurstLayer`, faces de cartes) comme base à restaurer et réhabiller au style HD-2D, plutôt qu'en three.js _(choix du rédacteur)_.
- Textes affichés en français accentué (règle du projet, test `accents.test.ts`).

## 4. Laissé au builder

- Équilibrage fin de tous les chiffres ci-dessus, dans l'esprit de la vision 2.12.
- Apparences et déplacement des clients (d'où ils arrivent sur la carte, chemin jusqu'à l'étal).
- Tolérances et vitesses exactes du ruban, dans les limites de 2.5.
- Mise en page des panneaux étal, cabane et confirmation d'achat, dans le style des panneaux existants (`AbriPanel`, `hdPanel`).

## 5. Choix du rédacteur (à vérifier par l'utilisateur)

- Départ à 0 PO.
- Un client à la fois, sans délai d'attente, arrivée 5 à 15 s après le précédent.
- Pondération des demandes vers les raretés communes.
- Prix de base, qualité x1,5, bonus +30 % par critère, ruban +20 % / +10 %.
- Prix et taux des trois sachets ; sachet ouvert aussitôt acheté ; trop-plein vers le coffre.
- Prix des parcelles 80 / 250 / 600 PO.
- Un seul niveau d'amélioration par outil (3 cases en ligne, 120 PO) ; réserve 6 / 9 / 12.
- Outils et sachets à la cabane, agrandissement de la réserve à l'étal, du coffre à l'abri.
- Coffre 12 / 18 / 24 piles ; achat de sachet refusé si sac et coffre sont pleins.
- Outil de niveau 2 : seule la case visée décide de l'action, les voisines inadaptées sont sautées.
- Ouverture des sachets en React, à partir de l'ancien code restauré depuis `cb54073`.
