# Potager d'automne - Sous-projet 4 : sachets et pity visible

Date : 2026-09-20

Suite des espèces et de l'Herbier (sous-projet 3). Références : [vision](2026-09-16-potager-automne-vision-design.md), [spec Champ](2026-09-16-potager-champ-design.md), [spec Espèces et Herbier](2026-09-16-potager-especes-herbier-design.md). Maquettes du brainstorming : mise en page "établi" (option A) et ouverture "cartes retournées" (option B), copiées dans [docs/superpowers/mockups/potager-automne/](../mockups/potager-automne/README.md) (`sachets.html`, `sachets-ouverture.html`).

## 1. Objectif et périmètre

Donner au jeu sa source de graines : un sachet gratuit par jour, un tirage complet avec deux jauges de pity affichées et expliquées, et une page Sachets.

Dans le périmètre :

- Sachet quotidien : crédit par jour calendaire, cumul plafonné, ouverture.
- Tirage d'une graine de sachet : rareté, nouveauté, variante.
- Les deux jauges de pity : règles, persistance, affichage.
- Page Sachets : sachet du jour, animation d'ouverture, jauges.
- Première source de variantes en jeu (sachet, cueillette, pressage).
- Inventaire de graines détaillé par rareté et choix de la graine semée.

Hors périmètre :

- Sachets famille, doré, et deuxième sachet quotidien (sous-projet 5, distribués par l'arbre). Le modèle de données les prévoit, aucun n'est jouable.
- Poudres de l'atelier qui augmentent la chance de variante (sous-projet 6).
- Hybrides (sous-projet 6) : absents du tirage.
- Tâches de l'arbre : seuls les compteurs existants sont incrémentés.

## 2. Règles de jeu

### 2.1 Sachet du jour

- Un sachet par **date locale**. `sachets.lastDailyAt` retient minuit du dernier jour crédité.
- `creditDaily(save, now)` ajoute un sachet par jour écoulé depuis `lastDailyAt`, **plafond de 7 sachets en attente**. Le surplus est perdu sans message.
- Le crédit a lieu à l'ouverture de la fenêtre Potager et à chaque tick (une minute). La fenêtre principale n'écrit jamais : elle ne crédite pas.
- Première partie : la sauvegarde de départ porte déjà un sachet et `lastDailyAt: 0`. Dans ce cas on pose `lastDailyAt` à aujourd'hui sans rien créditer.
- Horloge qui recule : si minuit d'aujourd'hui est antérieur à `lastDailyAt`, on ramène `lastDailyAt` à aujourd'hui sans créditer. Sans ça, une horloge avancée par erreur bloquerait les sachets pendant des jours.
- Un sachet contient **3 graines**. Le tirage a lieu à l'ouverture.

### 2.2 Les deux jauges

Elles sont persistées en **nombre de graines sèches** (`pity.dryDiscovery`, `pity.dryRare`), pas en pourcentage : la règle reste lisible et se recalcule toujours pareil.

| Jauge                   | Base | Par graine sans | Plafond | Retour à la base                                 |
| ----------------------- | ---- | --------------- | ------- | ------------------------------------------------ |
| Chance de nouveauté     | 25 % | +2 points       | 75 %    | dès qu'une graine est une entrée inconnue        |
| Chance de rare ou mieux | 25 % | +2 points       | 70 %    | dès qu'une graine est rare, épique ou légendaire |

`chance = min(base + pas x sèches, plafond)`.

**Seules les graines de sachet** consultent et font avancer les jauges. Les graines de cueillette et de pressage gardent leurs taux fixes (cueillette 30 %, 45 % sur une belle plante ; pressage 35 %) et n'y touchent pas.

Le pas volontairement lent (+2) fait de la jauge de rareté un filet de sécurité plutôt qu'un métronome : elle vit en pratique entre 25 et 45 %, son plafond n'est presque jamais atteint. Le ralentissement se sent surtout en fin de collection, sur la jauge de nouveauté.

### 2.3 Tirage d'une graine de sachet

Le catalogue compte 65 entrées (26 communes, 18 rares, 11 épiques, 10 légendaires). Une entrée est **connue** si elle est dans l'Herbier, déjà tirée plus tôt dans le même sachet, présente en graine dans l'inventaire, ou en terre. Sans ça, on pourrait tenir deux graines de la même nouveauté sans le savoir et gaspiller une remise à zéro.

Dans l'ordre, avec une source de hasard injectée :

1. **Rareté.** Jet contre la jauge de rareté. Échec : commune. Succès : rare, épique ou légendaire, pondérés par les poids du catalogue (25 / 12 / 3, soit 62,5 % - 30 % - 7,5 %).
2. **Nouveauté.** Jet contre la jauge de découverte.
3. **Réserve.** Jet réussi et cette rareté a des inconnues : on pioche parmi elles. Jet manqué : on pioche parmi les connues de cette rareté. La pioche est uniforme.
4. **Fin de collection.** Jet réussi mais plus aucune inconnue dans cette rareté : la graine passe à une rareté qui en a encore (pondération habituelle parmi celles-là). C'est la seule entorse à "la rareté annoncée est celle tirée", et elle est en faveur du joueur. Si l'Herbier est complet, la graine reste dans sa rareté et on pioche parmi les connues.
5. **Réserve vide dans l'autre sens.** Jet manqué mais aucune connue dans cette rareté (début de partie) : on pioche parmi les inconnues. La graine est alors une nouveauté, la jauge le reconnaît.
6. **Variante.** 2 % de chance, givrée / dorée / luminescente à parts égales. Aucun pity.
7. **Mise à jour.** L'entrée tirée est inconnue -> `dryDiscovery = 0`, sinon `+1`. Rareté finale autre que commune -> `dryRare = 0`, sinon `+1`. L'entrée rejoint l'ensemble des connues pour les graines suivantes du même sachet.

Ordre d'appel du hasard, fixé pour les tests : rareté, poids de rareté, nouveauté, poids de promotion, index dans la réserve, variante, choix de la variante.

Ordre de grandeur : légendaire ~2 % par graine, soit une tous les 15 à 18 jours au rythme d'un sachet quotidien.

### 2.4 Variantes

Le sous-projet 3 a dessiné les variantes sans jamais les distribuer. Le même tirage à 2 % s'applique maintenant aux trois sources : sachet, cueillette, pressage. Les poudres de l'atelier l'augmenteront au sous-projet 6.

### 2.5 Inventaire et semis

- La rareté d'une graine est connue dès l'ouverture du sachet ; l'espèce, la couleur et la variante ne se révèlent qu'à l'éclosion. La rareté est de toute façon déductible de l'infobulle, qui annonce la durée de l'étape suivante.
- `inventory.seeds` reste une file. Le panneau du Champ remplace "Graine mystère xN" par une ligne par rareté présente, avec son compte et sa couleur de rareté, et on clique pour choisir celle qu'on sème.
- Semer prend la **plus ancienne graine de la rareté choisie**. Si cette rareté tombe à zéro, la sélection retombe sur la rareté de la plus ancienne graine restante. La sélection est un état d'interface, rien n'est persisté.
- L'infobulle du trou suit la sélection : "Prêt à recevoir une graine rare", "Plus de graines rares".

## 3. Page Sachets

Onglet "Sachets" à côté de Champ et Herbier, avec une pastille tant qu'un sachet est à ouvrir. La page s'affiche même sans WebGL.

Mise en page "établi" (maquette A) : panneaux sombres à liseré doré comme le Champ.

- **Centre** : le sachet sur un halo de lumière, le bouton "Ouvrir", puis la rangée des trois graines révélées et leur légende de rareté.
- **Colonne de droite** (240 px) : un panneau par jauge (titre, barre, pourcentage, règle en toutes lettres), puis un panneau "N en attente (7 au maximum) - prochain sachet à minuit".
- **Sans sachet** : sachet éteint, bouton désactivé, seule la ligne "Prochain sachet à minuit" reste.
- **Herbier complet** : la jauge de nouveauté cède la place à "Toutes les fleurs sont découvertes."

Ouverture (maquette B, cartes retournées) :

- Le sachet s'efface, trois cartes se posent face cachée et se retournent l'une après l'autre (environ 350 ms d'écart), révélant le halo et le nom de la rareté.
- Une légendaire ajoute une lueur dorée, des étincelles et une pause d'environ une seconde avant la carte suivante.
- Un clic pendant l'animation révèle tout immédiatement.
- Les jauges s'animent vers leur nouvelle valeur **après** la dernière carte.
- Les graines rejoignent l'inventaire dès l'ouverture, pas à la fin de l'animation. "Ouvrir" redevient actif aussitôt pour enchaîner les sachets en attente ; la rangée précédente est remplacée.

## 4. Architecture

### 4.1 Règles pures (`src/garden/core/`)

- `pity.ts` : les deux jauges (base, pas, plafond), `chanceOf(gauge, dry)`. Aucun lien avec `src/game/pity.ts`, celui des canards.
- `sachets.ts` : `creditDaily(save, now)`, `openSachet(save, now, rng)` qui rend `{ save, seeds }`.
- `rolls.ts` : `rollSachetSeed`, `rollVariant`, variante appliquée aussi à `rollPickSeed` et `rollPressSeed`. Le commentaire "provisoire, arrive au sous-projet 4" disparaît.
- `catalog/entries.ts` : liste à plat des 65 entrées (espèce, couleur, rareté) et index par rareté, dérivés de `SPECIES`.
- `discovery.ts` : `knownEntries(save)` (Herbier, graines en inventaire, plantes en terre).
- `actions.ts` : les paramètres optionnels de `planAction` passent en objet (`{ rng, rain, seedRarity }`) ; semer prend la plus ancienne graine de la rareté demandée. Trois appelants à ajuster.
- `target.ts` : infobulle du trou selon la rareté sélectionnée.

### 4.2 Modèle de données

`sachets.pending` passe de `number` à `SachetType[]`, avec `type SachetType = "quotidien"`. Les sachets famille et doré du sous-projet 5 s'ajouteront à cette union sans migration. `version` reste à 1.

`parseSave` convertit un `pending` numérique en autant de `"quotidien"` : le validateur ne regarde pas l'intérieur de `sachets`, et une sauvegarde de développement casserait en silence.

### 4.3 Interface (`src/garden/ui/`)

- `sachets/SachetsPage.tsx` : mise en page, état de l'ouverture en cours.
- `sachets/SachetPack.tsx` : sachet, bouton "Ouvrir", attente et prochain sachet.
- `sachets/SeedReveal.tsx` : les trois cartes retournées, saut de l'animation au clic, pause et étincelles sur une légendaire.
- `sachets/PityGauge.tsx` : barre, pourcentage, règle en clair.
- `GardenTabs.tsx` : onglet Sachets et pastille.
- `gardenReducer.ts` : action `{ type: "open-sachet"; now; rng }` ; le tick crédite le sachet quotidien.
- `SidePanel.tsx` : lignes par rareté et sélection ; `FieldView.tsx` transmet la rareté choisie.
- `GardenDevBar.tsx` : boutons de développement "+1 sachet" et "jour suivant".
- Animations en `motion/react`, déjà utilisé ailleurs.

## 5. Erreurs

- Ouverture sans sachet en attente : aucune action, le bouton est désactivé.
- `pending` numérique dans une sauvegarde existante : converti à la lecture.
- `pending` au-delà de 7 dans une sauvegarde : gardé tel quel, le crédit ne fait qu'attendre que ça redescende.
- Herbier complet : le tirage reste possible, la jauge de nouveauté est remplacée par un message.
- Rareté sélectionnée vide au moment de semer : repli sur la plus ancienne graine, quelle que soit sa rareté.
- Entrée hors catalogue dans l'ensemble des connues : ignorée, jamais supprimée.

## 6. Tests

Vitest sur `core/` :

- `pity` : pas, plafond, retour à la base, valeurs aux bornes, sources hors sachet sans effet.
- `sachets` : crédit par jour écoulé, plafond de 7, `lastDailyAt: 0` sans crédit, horloge qui recule, passage à l'heure d'hiver (jour de 25 h), ouverture qui retire un sachet et rend 3 graines, jauges mises à jour.
- `rolls` : branche rareté, branche nouveauté, promotion quand une rareté n'a plus d'inconnue, Herbier complet, réserve de connues vide, pas de doublon dans un même sachet, ensemble connu incluant inventaire et terre, variante à 2 % sur les trois sources, ordre d'appel du hasard.
- `catalog/entries` : 65 entrées, répartition 26/18/11/10, index cohérent avec `SPECIES`.
- `save` : conversion de `pending` numérique, `pending` déjà en tableau laissé intact.
- `actions` : semis par rareté choisie, repli quand la rareté est vide, refus inchangés.
- `target` : infobulle du trou selon la rareté.
- `gardenReducer` : `open-sachet`, crédit au tick.
- `accents.test.ts` complété si besoin.

Vérification manuelle dans l'aperçu navigateur (panneau visible) : ouverture d'un sachet et les trois retournements, légendaire forcée par le hasard injecté, saut de l'animation, enchaînement de deux sachets, jauges qui montent puis retombent, bouton désactivé sans sachet, sélection de rareté dans le Champ et infobulle du trou, jour suivant par le bouton de développement.
