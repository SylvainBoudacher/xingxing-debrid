# Potager : employés (sous-projet 4)

Suite de la vision `2026-10-19-potager-idle-vision-design.md` (sections 2.9 et 4, sous-projet 4) et de la spec économie `2026-10-20-potager-economie-design.md`, toutes deux implémentées. Les passages marqués _(choix du rédacteur)_ n'ont pas été tranchés par l'utilisateur ; les valeurs chiffrées sont des points de départ à équilibrer en jeu.

## 1. Intention

### 1.1 Pourquoi

Au bout du sous-projet 3, tout se fait encore à la main : bêcher, semer, arroser, cueillir, désherber, chasser les corneilles, vendre. C'est voulu au début (vision 2.12), mais le jeu doit ensuite basculer vers la gestion. Les employés sont cette bascule : on dépense ses PO pour confier une partie du travail, on voit le village vivre tout seul (fenêtre Potager et fond passif), et le joueur garde la main sur ce qui compte le plus pour lui.

### 1.2 Objectifs, non-objectifs, anti-objectifs

- **Objectifs** : bâtiment des employés acheté en PO ; quatre métiers embauchés dans l'ordre (arroseur, jardinier, cueilleur, fleuriste) ; niveaux achetés en PO ; parcelles confiées à chaque employé ; employés visibles qui marchent et travaillent réellement dans le village, y compris dans le fond passif.
- **Non-objectifs (étapes suivantes)** : alchimiste et atelier (sous-projet 6), commandes du panneau préparées par le fleuriste (sous-projet 5), serre, arbre de progression et conditions de déblocage autres que les PO (sous-projet 6), plusieurs employés du même métier.
- **Anti-objectifs** :
  - **Le joueur reste meilleur que ses employés** (voulu par l'utilisateur) : un employé n'obtient jamais Parfait. Faire soi-même garde un intérêt.
  - **Rien n'est touché hors de ce qu'on a confié** : un employé ne travaille que sur les parcelles cochées pour lui (le fleuriste, à l'étal seulement) ; il ne pioche jamais dans le sac du joueur.
  - Aucune fuite avant l'éclosion (règle des sous-projets précédents) : le jardinier sème sans que rien ne révèle l'espèce ni la couleur ; une découverte faite par le cueilleur s'annonce comme une cueillette du joueur.
  - Rien ne se perd : un employé bloqué (coffre plein, plus de graines) s'arrête et attend, il ne jette rien.

### 1.3 Écarts avec la vision

- La vision prévoyait un niveau qui rend l'employé « plus rapide et/ou couvre plus de parcelles ». L'utilisateur a choisi **plus rapide et meilleur travail** ; la zone couverte se règle par les parcelles confiées, sans limite de nombre.
- La vision faisait piocher le jardinier « dans l'inventaire ». Il pioche **au coffre de l'abri uniquement** (voulu par l'utilisateur).
- La vision ne parlait pas de bâtiment d'embauche : il y en a un, acheté en PO (voulu par l'utilisateur).
- Gêneurs : la vision ne les attribuait à personne ; le **jardinier désherbe et chasse les corneilles** (voulu par l'utilisateur).

## 2. Ce que le joueur vit

### 2.1 Maison des employés

- Nouveau bâtiment, **absent en partie neuve** : à son emplacement, un panneau de prix comme ceux des parcelles. Prix **150 PO** _(choix du rédacteur)_. Interagir avec le panneau ouvre la confirmation d'achat (même modèle que les parcelles) ; après l'achat, le bâtiment apparaît et le panneau disparaît.
- Nom affiché « Maison des employés » _(choix du rédacteur)_. Bâtiment 3D aux textures pixel, dans le style de l'étal et de la cabane.
- Emplacement sur la terrasse du milieu ou le plateau, accessible à pied, sans gêner l'étal, la cabane, l'abri, le puits ni les parcelles _(laissé au builder, voir 4)_.
- Interagir avec la maison ouvre le **panneau des employés** (2.6). C'est le seul endroit où l'on embauche et où l'on achète les niveaux (voulu par l'utilisateur).

### 2.2 Embauche et niveaux

- Quatre métiers, **un seul exemplaire chacun**, embauchés **dans l'ordre** : arroseur, jardinier, cueilleur, fleuriste. Un métier n'est proposé que si le précédent est embauché ; la seule condition est d'avoir les PO (voulu par l'utilisateur ; l'arbre du sous-projet 6 pourra en ajouter).
- Prix d'embauche : arroseur 100 PO, jardinier 250 PO, cueilleur 500 PO, fleuriste 900 PO _(choix du rédacteur)_.
- **Niveaux 1 à 5** _(choix du rédacteur)_. Niveau suivant : 1,5 fois le prix d'embauche du métier pour le niveau 2, puis x1,6 à chaque niveau (arroseur : 150, 240, 384, 614 PO) _(choix du rédacteur)_.
- Un niveau apporte **deux choses à la fois** (voulu par l'utilisateur) :
  - **Vitesse** : marche et durée de chaque geste. Niveau 1 : marche à 60 % de l'avatar, geste en 3 s ; niveau 5 : marche à 100 % de l'avatar, geste en 1,2 s ; interpolation linéaire entre les deux _(choix du rédacteur)_.
  - **Qualité** : chaque geste reçoit une note tirée au hasard, Raté ou Bien, **jamais Parfait** (voulu par l'utilisateur). Part de Bien : 40 % au niveau 1, puis 55, 70, 85 et **100 % au niveau 5** _(valeurs : choix du rédacteur)_.
- Les employés ne jouent pas de mini-jeu : la note est tirée, le geste dure le temps du niveau, son effet est celui du geste à la main avec cette note (règles actuelles de `applyAction` et `applyToCell`).

### 2.3 Parcelles confiées

- Un employé fraîchement embauché ne s'occupe **d'aucune parcelle** (voulu par l'utilisateur). On coche les parcelles possédées qu'on lui confie ; aucune limite de nombre.
- Plusieurs employés peuvent partager une parcelle (cas normal : arroseur, jardinier et cueilleur sur `p0`).
- Le réglage se fait à **deux endroits** (voulu par l'utilisateur) :
  - au **panneau des employés** : pour chaque employé, une case par parcelle possédée ;
  - **sur la parcelle** : chaque parcelle possédée porte un petit piquet à son bord _(choix du rédacteur pour le support)_ ; interagir avec ouvre un panneau qui liste les employés embauchés (arroseur, jardinier, cueilleur) avec une case chacun.
- Le fleuriste n'a pas de parcelles : il travaille à l'étal dès son embauche.
- Une parcelle achetée après l'embauche n'est confiée à personne.

### 2.4 Ce que fait chaque métier

Tous les employés travaillent en temps de jeu, l'application ouverte (comme le reste de la simulation). Un geste se fait debout devant la case, comme l'avatar.

- **Arroseur** : arrose les plantes **sèches** de ses parcelles (non encore en fleur). Il porte un arrosoir de 5 arrosages, comme celui du joueur au niveau 1 ; vide, il fait l'**aller-retour au puits** (voulu par l'utilisateur) et le remplit entièrement, sans note, le temps d'un geste. Il arrose une case à la fois.
- **Jardinier**, par ordre de priorité sur ses parcelles _(ordre : choix du rédacteur)_ :
  1. **chasse les corneilles** (voulu par l'utilisateur) : il va jusqu'à la case, la corneille s'envole, sans note ;
  2. **désherbe** les mauvaises herbes (note tirée : un désherbage raté programme la repousse comme à la main) ;
  3. **bêche** les cases en herbe puis **sème** les cases bêchées. Il prend ses graines **au coffre de l'abri** (voulu par l'utilisateur), en passant par l'abri, **les plus communes d'abord** (vision 2.9), jamais dans le sac. Il porte au plus une pile à la fois _(choix du rédacteur)_. Sans graine au coffre, il bêche quand même et s'arrête là.
- **Cueilleur** : cueille les fleurs épanouies de ses parcelles et les range **au coffre de l'abri** (voulu par l'utilisateur), jamais à l'étal ni dans le sac. Il porte jusqu'à 5 fleurs, puis va à l'abri vider ses mains _(choix du rédacteur)_.
  - Conséquence de la note plafonnée : la qualité « belle » ne s'obtient qu'avec un Parfait, donc **le cueilleur ne cueille que des fleurs ordinaires**. Les belles fleurs restent au joueur.
  - La graine bonus de cueillette est tirée avec la note obtenue (règle actuelle) et va au coffre.
  - Une fleur qui n'a pas encore été vue par le joueur est annoncée comme une découverte, exactement comme si le joueur l'avait cueillie (bandeau d'éclosion à la prochaine occasion dans la fenêtre Potager).
  - Coffre plein : il s'arrête, la fleur reste sur la plante, aucune perte.
- **Fleuriste** : sert les clients à l'étal, **uniquement avec la réserve de l'étal** (voulu par l'utilisateur) ; il ne la remplit pas, le coffre reste au joueur. Mettre une fleur dans la réserve vaut accord pour qu'elle soit vendue.
  - Choix de la fleur _(choix du rédacteur)_ : celle qui touche le plus de bonus de demande (espèce et couleur, puis l'un des deux) ; à égalité ou sans correspondance, **la moins rare**, puis l'ordinaire avant la belle. Le but : ne pas vendre au hasard une légendaire mise en réserve.
  - Le ruban est noté par tirage (Raté ou Bien selon le niveau), puis la vente se paie comme à la main (prix de l'économie 2.4).
  - **Interrupteur** dans le panneau des employés (voulu par l'utilisateur) : « Au travail » / « En pause ». En pause, il flâne près de la maison et le joueur sert à la main (seul moyen d'avoir un ruban Parfait). Actif par défaut à l'embauche _(choix du rédacteur)_.
  - Le joueur peut toujours servir lui-même ; si le fleuriste est déjà en train de servir, l'étal affiche qu'il est occupé.

### 2.5 Comportement commun

- **Rien à faire** (rien de confié, tout est en ordre, plus de graines, coffre plein) : l'employé revient près de la maison et y flâne _(choix du rédacteur)_.
- Choix de la tâche : la plus proche parmi celles de son métier, selon la priorité de 2.4 _(choix du rédacteur)_. Deux employés ne visent jamais la même case pour le même geste.
- **Le joueur passe avant** : un employé ne commence pas un geste sur une case où le joueur joue un mini-jeu ; si la case change pendant qu'il marche (le joueur l'a arrosée, cueillie...), il abandonne et choisit une autre tâche. Si le joueur lance un mini-jeu sur une case où un employé est en plein geste, **l'employé abandonne son geste** sans effet ; le résultat du joueur n'est jamais perdu. L'interface transmet donc à la simulation la case du mini-jeu en cours _(choix du rédacteur)_.
- Pas de collision entre employés, avatar et clients : ils peuvent se croiser _(choix du rédacteur)_.
- Un petit indicateur au-dessus de l'employé montre l'objet porté (arrosoir, graines, fleurs) ; c'est visuel, aucune information cachée (les graines portées ne montrent que leur rareté).

### 2.6 Panneau des employés

Ouvert à la maison, dans le style des panneaux existants (`hdPanel`). Pour chaque métier :

- non débloqué : grisé, « Embauchez d'abord l'arroseur » (etc.) ;
- débloqué : bouton « Embaucher (100 PO) » ;
- embauché : niveau actuel, ce que donne le suivant (vitesse, part de Bien), bouton « Niveau suivant (150 PO) » ou « Niveau max » ; les cases des parcelles possédées (sauf fleuriste) ; la rareté maximale semée (jardinier) ; l'interrupteur (fleuriste) ; une **ligne d'état** (« Arrose p0 », « Va au puits », « Attend : plus de graines au coffre », « Attend : coffre plein », « Rien à faire »).

PO insuffisants : bouton désactivé avec le prix manquant, comme à la cabane.

## 3. Contraintes techniques

- Mêmes règles que les sous-projets précédents : logique en TypeScript pur dans `src/potager/core/` (sans React ni three.js), testée sous Vitest avec hasard injecté : achats (maison, embauche dans l'ordre, niveaux, PO insuffisants, niveau max), tirage des notes par niveau (jamais Parfait), choix des tâches de chaque métier et leur priorité, respect des parcelles confiées, pioche au coffre (communes d'abord, jamais le sac), coffre plein, aller-retour au puits, choix de la fleur du fleuriste, annonce d'une découverte faite par le cueilleur, abandon d'une tâche devenue caduque, abandon du geste quand le joueur lance un mini-jeu sur la case, rareté maximale du jardinier, fleuriste en pause.
- La **simulation qui fait foi** (socle) fait avancer les employés : déplacements et gestes en temps de jeu, visibles dans le fond passif. Les effets des gestes réutilisent ceux du joueur (`applyToCell`, cueillette, vente) plutôt que de les dupliquer.
- Sauvegarde : nouveaux champs (maison achetée, employés embauchés avec niveau, parcelles confiées, rareté maximale du jardinier et interrupteur du fleuriste) lus de façon tolérante, sans changer `version` ; une sauvegarde actuelle se charge sans maison ni employé. La position et la tâche en cours ne sont pas sauvegardées : à la réouverture, chaque employé repart de la maison _(choix du rédacteur)_ ; ce qu'il portait (graines, fleurs) est compté au coffre dans chaque sauvegarde, même au-delà de sa capacité (règle de dépassement de l'économie 2.8), pour que rien ne se perde.
- Sprites des quatre employés (une apparence par métier, animations de marche dans les quatre directions comme l'avatar, geste), maison et piquets de parcelle : générés par code (canvas), dans le style du rendu actuel.
- Chemins : les employés se déplacent avec la même logique de marche que l'avatar (`walk.ts`, `path.ts`).
- Textes affichés en français accentué (règle du projet, test `accents.test.ts`).

## 4. Laissé au builder

- Équilibrage fin de tous les chiffres, dans l'esprit de la vision 2.12 (l'arroseur vers 10 à 15 minutes de jeu actif, chaque palier ensuite plus long).
- Emplacement exact de la maison sur la carte (`MAP`), dans l'esprit de la référence HD-2D.
- Apparences des employés, forme du piquet de parcelle, indicateur d'objet porté.
- Mise en page du panneau des employés et du panneau de parcelle.
- Algorithme exact de choix de la tâche la plus proche et de réservation des cases.

## 5. Choix du rédacteur (à vérifier par l'utilisateur)

- Maison à 150 PO, nommée « Maison des employés ».
- Embauches 100 / 250 / 500 / 900 PO ; niveaux 1 à 5, coûts x1,5 puis x1,6.
- Vitesse : 60 % à 100 % de l'avatar, geste de 3 s à 1,2 s.
- Part de Bien : 40 / 55 / 70 / 85 / 100 %.
- Piquet au bord de chaque parcelle possédée pour régler les employés sur place.
- Jardinier : corneilles, puis mauvaises herbes, puis bêcher et semer ; une pile de graines portée à la fois ; bêche même sans graines.
- Cueilleur : 5 fleurs portées avant de passer à l'abri.
- Fleuriste : la fleur qui touche le plus de bonus, sinon la moins rare.
- Fleuriste actif par défaut à l'embauche.
- Joueur qui lance un mini-jeu sur la case d'un employé en plein geste : l'employé abandonne.
- Employé sans travail : flâne près de la maison ; tâche la plus proche d'abord ; pas de collision.
- Position et tâche non sauvegardées ; objets portés remis au coffre à la sauvegarde.
