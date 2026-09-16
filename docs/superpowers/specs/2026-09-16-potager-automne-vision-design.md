# Potager d'automne - document de vision

Date : 2026-09-16

Successeur de l'événement d'été (la mare aux canards). Ce document fixe la vision, les règles de jeu, l'architecture et le découpage en sous-projets. Chaque sous-projet aura ensuite sa propre spec détaillée, son plan et son implémentation.

Maquettes de référence (validées, elles restent la base visuelle et technique) : [docs/superpowers/mockups/potager-automne/](../mockups/potager-automne/README.md).

## 1. Intention

Un jeu de jardinage apaisant, rétro et plus abouti que la mare : on sème des graines mystère dans un champ, elles poussent en temps réel, s'ouvrent en révélant leur espèce et leur couleur, et remplissent un Herbier. On décore son champ, on progresse par un arbre de paliers, on prépare des potions à l'atelier.

Principes :

- **Pas d'échec.** Rien ne meurt, rien ne régresse. Les actions accélèrent ou améliorent, elles ne sont jamais punitives.
- **Pas de minuteur agressif.** On découvre en revenant ce qui a poussé.
- **Indépendant de l'app.** Aucune récompense liée à l'usage de l'app (téléchargements, lectures).
- **Code totalement séparé du jeu des canards.** Rien n'est importé depuis `PixelPool`, `duck*`, `src/game/*` (y compris `src/game/pity.ts`).

## 2. Décisions de jeu

### 2.1 Emplacement et fenêtres

- Le champ vit **en fond passif** de la fenêtre principale (derrière l'interface, comme la mare).
- La gestion se fait dans une **deuxième fenêtre Tauri "Potager"**. Tant qu'elle est ouverte, la fenêtre principale affiche une image figée et floutée du champ avec le message "Ton champ est ouvert dans la fenêtre Potager". À sa fermeture, le fond reprend vie.
- Fermer la fenêtre principale ferme aussi le Potager.
- Les deux événements coexistent : réglage "Fond animé" = `potager` (défaut) / `mare` / `aucun`, un seul actif à la fois. Le jeu des canards reste maintenu. Le Potager est forcé une fois à la mise à jour (clé `garden_default_v1`), puis le choix de l'utilisateur est respecté.

### 2.2 Direction artistique

- **HD-2D façon Octopath Traveler** : sprites pixel art posés debout dans une scène 3D (three.js) avec caméra inclinée, ombres portées, lumières ponctuelles, bloom, tilt-shift, vignette, brouillard, brume, particules.
- Sprites **48x48** (tuile), 48x72 pour une plante, palette **"Chaleureux"** : 4 tons par gamme, contour coloré automatique (teinte sombre de l'objet).
- Sprites **générés par code** : formes rastérisées (ellipses, pétales, feuilles, tiges), une espèce décrite une fois, toutes ses couleurs et variantes en découlent.
- Lumière qui suit l'heure réelle : matin brumeux, midi, soir orangé, nuit (lanternes, lucioles). Pluie déterministe. Feuilles qui tombent, vent dans les plantes.
- **Automne uniquement**, pas d'abstraction de saisons pour l'instant.

### 2.3 Fond passif

- Rendu HD-2D complet, **bridé à 30 images/s**.
- **Pause** si la fenêtre perd le focus, si l'onglet est caché, sur une page opaque, ou quand le Potager est ouvert (image figée, zéro rendu).
- **Pas de parallaxe souris** (réservée au Potager). Légère dérive automatique de la caméra.

### 2.4 Champ et gestes

- **Grille de tuiles invisible**, seule la case visée est soulignée.
- **Outils séparés** (touches 1 à 7) : Main, Creuser (transplantoir), Semer, Arroser (arrosoir), Sécateur, Râteau, Préparer.
- Séquence de plantation : **creuser un trou -> semer la graine -> arroser**.
- Cueillette selon l'espèce : **à la main** (tiges fines : cosmos, aster, bruyère, colchique...) ou **au sécateur** (tiges épaisses : tournesol, dahlia, rose trémière, chrysanthème...). Le mauvais outil affiche la raison.
- **Main** : cueillir les fleurs délicates et déplacer une plante ou un décor (maintenir et glisser). Une plante ne va que sur de la terre.
- **Corbeaux** : chassés d'un simple clic, quel que soit l'outil. Aucune pénalité.
- **Tas de feuilles** : ramassés au râteau uniquement.
- Infobulle sur la case visée : nom, étape, temps restant, action du clic ou raison du refus.

### 2.5 Pousse et arrosage

- **Temps réel uniquement**, même app fermée. Aucun bonus d'usage.
- Étapes : graine, pousse, jeune plant, bouton, fleur. L'éclosion révèle espèce et couleur et inscrit l'entrée dans l'Herbier.
- **L'arrosage est un accélérateur** (jamais obligatoire) mais fortement incité :
  - écart de vitesse **modéré** (x1,5 pendant que la terre est mouillée) ;
  - **contraste visuel** : terre sèche claire et craquelée, plante qui penche ; terre arrosée foncée, plante redressée ;
  - **belle plante** : une plante mouillée à chaque étape a une **meilleure chance** de donner une graine (jamais garantie) ;
  - **tâches d'arrosage** dans l'arbre de progression ;
  - pas de bonus "rosée du matin".
- La pluie arrose tout le champ.

### 2.6 Économie

- **Pas de monnaie** pour l'instant, pas de marchand, pas de visiteurs.
- **Sachets gratuits quotidiens** : un par jour au départ, un deuxième débloqué par l'arbre. Les sachets non ouverts se cumulent.
- **Cueillir** : la fleur va dans le **panier**, chance de graine de la même espèce.
- **Presser** (depuis le panier) : spécimen pressé dans l'Herbier, chance de graine d'une autre couleur de la même espèce.
- Usages des fleurs cueillies : **l'atelier** et les **paniers de saison** (paliers de l'arbre qui demandent des fleurs précises).

### 2.7 Progression

- **Arbre de chemins sans choix** : chaque nœud a une tâche, la réussir ouvre les suivants. Plusieurs branches avancent en parallèle.
- Branches : **Jardinage**, **Collection**, **Décor**, **Champ**.
- Les nœuds débloquent le décor, les sachets spéciaux (famille, doré), les parcelles, les outils améliorés et les recettes de l'atelier.
- **Page Progression** dans le Potager : résumé en haut (paliers, Herbier, parcelles, sachets, objectifs en cours), arbre en forme de plante (terminé = fleur éclose, en cours = bouton avec arc de progression, verrouillé = graine), détail du nœud à droite. Validée "pour l'instant", à affiner.

### 2.8 Atelier

- Débloqué par un palier de l'arbre.
- **Chaudron** : une préparation prend du **temps réel**.
- **Recettes débloquées par paliers de l'arbre** (pas par expérimentation).
- Préparations envisagées : élixir de croissance, rosée du matin (arrose en 3x3), teintures (orientent la couleur), philtre de rareté, poudres de givre / d'or / de lune (chance de variante), pollen d'affinité (hybride), élixir de clairvoyance (révèle une graine), épouvante-corbeaux.

### 2.9 Hybrides

- **Uniquement par le pollen d'affinité**, appliqué à deux fleurs écloses voisines et compatibles. Pas de croisement naturel aléatoire.

### 2.10 Herbier et raretés

- Entrée = **espèce x couleur**.
- Rareté (commune, rare, épique, légendaire) **portée par la couleur**. Chaque espèce a son propre éventail. Certaines espèces n'existent qu'en légendaire.
- La rareté se voit **par les couleurs et par des animations** (halo, particules, lumière pour les légendaires).
- **Variante spéciale** (givrée, dorée, luminescente), à part : faible chance, augmentée par les poudres de l'atelier, pas de pity.
- **Contenu au lancement** : 12 à 14 espèces (tournesol, rose trémière, dahlia, cosmos, aster, chrysanthème, bruyère, colchique, anémone du Japon, sedum, amarante, verge d'or, héliopsis, une espèce fantastique légendaire), environ 70 entrées et 15 hybrides.

### 2.11 Sachets et pity

- Un sachet = 3 graines. **Le tirage a lieu à l'ouverture du sachet**, le résultat reste caché jusqu'à l'éclosion.
- **Pity doux et visible** (le pity des canards a posé beaucoup de problèmes) : deux jauges linéaires affichées sur la page Sachets, avec leur règle écrite en clair.
  - **Chance de découverte** : 25 %, +5 points par graine sans nouveauté, plafond 75 %, retour à 25 % à la première nouveauté.
  - **Chance de rare ou mieux** : taux de base (indicatif 25 %), +3 points par graine sans rare, plafond (indicatif 70 %), retour au taux de base. La répartition rare / épique / légendaire garde ses proportions.
- **Seuls les sachets** utilisent et font avancer le pity. Les graines de cueillette et de pressage ont des taux fixes.
- Pas de pity sur la variante spéciale.

## 3. Architecture

Approche retenue : moteur de jeu en TypeScript pur, rendu three.js impératif, interface React.

```
src/garden/
  core/        logique pure, testée (aucun import React ou three.js)
    catalog/   données : espèces, couleurs, raretés, arbre, recettes, décor
  sprites/     générateur pixel art (primitives, palette, espèces, décor, icônes)
  render/      scène HD-2D three.js
  ui/          composants React (fenêtre Potager, fond passif, pages)
```

### 3.1 Fenêtres et cycle de vie

- **Fenêtre principale** : `GardenBackdrop` remplace `PixelPool` quand le fond est `potager` (même montage : `fixed inset-0 -z-10`, `pointer-events-none`, chargement différé). Il lit `garden.json`, affiche le champ, et n'écrit jamais.
- **Fenêtre Potager** (`label: "garden"`) : créée par `WebviewWindow`, même bundle, un paramètre d'URL sélectionne `GardenApp`. Capability dédiée minimale (store, événements, fenêtre). Une seule instance, remise au premier plan si déjà ouverte.
- **Un seul écrivain** : le Potager, quand il est ouvert. À sa destruction, la fenêtre principale relit `garden.json` et relance le rendu.
- Fermeture de la fenêtre principale : ferme le Potager (gestionnaire d'événement de fenêtre dans `lib.rs`).
- Point d'entrée "Potager" dans la fenêtre principale : à préciser dans la spec du sous-projet 1 (a priori le menu de l'app).

### 3.2 Modèle de données

`garden.json` via tauri-plugin-store, versionné, séparé de `settings.json` et de la sauvegarde des canards. Export / import dans les paramètres.

```ts
interface GardenSave {
  version: 1;
  tiles: Record<TileKey, TileContent>; // "x,y"
  plots: PlotId[];
  inventory: {
    seeds: Seed[];
    basket: Flower[];
    potions: Record<PotionId, number>;
    decor: Record<DecorId, number>;
  };
  herbier: Record<EntryId, { discoveredAt: number; pressed: number; variants: VariantId[] }>;
  pity: { dryDiscovery: number; dryRare: number };
  sachets: { lastDailyAt: number; pending: number };
  progress: { nodes: Record<NodeId, number>; counters: Record<CounterId, number> };
  atelier: { brew: { recipe: RecipeId; startedAt: number } | null };
}

type TileContent =
  | { kind: "hole"; dugAt: number }
  | { kind: "plant"; seed: Seed; sownAt: number; watered: Interval[] }
  | { kind: "decor"; id: DecorId }
  | { kind: "leaves"; since: number };

interface Seed {
  species: SpeciesId;
  color: ColorId;
  rarity: Rarity;
  variant?: VariantId;
  hybrid?: boolean;
}
```

- Écriture regroupée par un court délai, et écriture immédiate à la fermeture du Potager.
- Tas de feuilles persistés (apparition selon le temps écoulé, avec un maximum). Corbeaux éphémères (Potager ouvert seulement), seul le compteur est persisté.

### 3.3 Calcul de la pousse

Fonction pure, rien n'est simulé :

```
temps efficace = (maintenant - sownAt) + 0,5 x durée mouillée(arrosages ∪ pluie, [sownAt, maintenant])
étape = seuils(temps efficace, durée totale de la rareté)
```

- Durées totales indicatives, à régler dans la spec : commune 8 h, rare 12 h, épique 18 h, légendaire 30 h, réparties sur 4 étapes.
- Un arrosage mouille la case pendant une durée fixe (indicatif : 6 h).
- **Pluie déterministe** : les créneaux d'un jour sont dérivés de la date, donc identiques dans les deux fenêtres et après une absence.
- **Belle plante** : au moins un moment mouillé à chaque étape.
- Horloge qui recule : durées négatives ramenées à zéro.

### 3.4 Moteur de jeu (`core/`)

Fonctions pures `(save, action, now) -> save`, un fichier par système :

- `growth.ts`, `weather.ts` : pousse, belle plante, pluie.
- `actions.ts` : creuser, semer, arroser, cueillir (main ou sécateur), ratisser, déplacer, chasser. Chaque refus porte sa raison en français, affichée telle quelle dans l'infobulle.
- `rolls.ts` : tirage d'une graine (source de hasard injectée).
- `pity.ts` : les deux jauges linéaires. Sans lien avec `src/game/pity.ts`.
- `sachets.ts` : sachet quotidien, ouverture.
- `drops.ts` : taux fixes à la cueillette et au pressage, bonus belle plante.
- `progression.ts` : arbre, tâches sur compteurs, paniers de saison, récompenses.
- `atelier.ts` : recettes débloquées, préparation en temps réel, effets.
- `catalog/` : tables de données seules.

### 3.5 Sprites (`sprites/`)

- `raster.ts` : primitives, choix du ton selon la lumière, contour automatique.
- `palette.ts` : gammes "Chaleureux".
- `species/<espèce>.ts` : formes, couleurs et raretés, outil de cueillette.
- Étapes de pousse, décor (clôture, lanternes, citrouilles, paille, arbre, trou, tas de feuilles, corbeau), icônes d'outils.
- Variantes : transformation de palette + effet de rendu. Plante assoiffée : inclinaison au rendu et tuile de terre craquelée.
- Canvas mis en cache par (espèce, couleur, étape, variante).

### 3.6 Rendu (`render/`)

- `scene.ts` : renderer, caméra, boucle bridée à 30 images/s, `start` / `stop` / `snapshot`.
- `ground.ts` : sol en canvas, tuiles herbe / terre / mouillée / sèche, mise à jour par case.
- `billboards.ts` : sprites debout, pied pivot, ombres découpées, balancement, soulèvement pendant le glisser.
- `lighting.ts` : ambiances selon l'heure, lanternes, lumière des légendaires.
- `weather.ts` : pluie, brume, feuilles, lucioles.
- `particles.ts` : eau, terre, feuilles, pétales, étincelles, plumes.
- `post.ts` : bloom, tilt-shift, vignette, sortie.
- `picking.ts` : raycast sol + test de transparence sur les sprites.
- `syncScene(scene, state, now)` : applique seulement les différences (ajout, retrait, remplacement). Appelée à chaque changement d'état et une fois par minute.
- Deux profils : **fond** (caméra éloignée, sans parallaxe, sans picking) et **Potager** (caméra proche, parallaxe légère, picking, surbrillance). Même qualité d'effets.
- Dépendance : `three`, chargé uniquement si le Potager est actif.

### 3.7 Interface (`ui/`)

Un composant par fichier, textes français accentués.

- `GardenApp.tsx` : onglets Champ, Herbier, Progression, Sachets, Atelier (une fois débloqué).
- Champ : `FieldView`, `ToolBar`, `TileTooltip`, `SidePanel` (graines, panier avec "Presser", préparations), `DiscoveryToast`.
- Herbier : grille espèce x couleur (découverte, pressée, variantes), fiche d'une fleur.
- Progression : arbre en forme de plante et panneau de détail (maquette).
- Sachets : sachet du jour, animation d'ouverture, jauges de pity visibles.
- Atelier : chaudron, recettes débloquées, temps restant.
- Fenêtre principale : `GardenBackdrop` (fond passif / figé), réglage "Fond animé" dans le panneau renommé "Fonds animés".
- Style des pages : panneaux sombres à liseré doré, titres en serif (esprit menus Octopath). Herbier, Sachets et Atelier seront maquettés dans leur sous-projet.

### 3.8 Erreurs

- `garden.json` absent : sauvegarde de départ (une parcelle, 3 graines, 1 sachet).
- `garden.json` illisible ou version inconnue : copie en `garden.corrupt-<date>.json`, sauvegarde neuve, toast.
- Import invalide : refus avec toast.
- WebGL indisponible : fond passé à "aucun" avec toast, message dans le Potager.
- Fermeture brutale du Potager : écriture à la fermeture, relecture par la fenêtre principale.

### 3.9 Tests

Vitest sur `core/` :

- `growth` : seuils par rareté, x1,5 sur l'union arrosages ∪ pluie sans double comptage, belle plante, horloge qui recule, absence d'une semaine.
- `weather` : même date, mêmes averses.
- `actions` : chaque geste et chaque refus (semer sans trou, sécateur sur tige fine, main sur tige épaisse, râteau hors feuilles).
- `pity` : progression linéaire, plafond, retour, sources hors sachet sans effet.
- `rolls`, `drops` : distributions avec hasard injecté.
- `sachets`, `progression`, `atelier` : report quotidien, déblocages en chaîne, paniers, temps de préparation, effets.
- `catalog` : cohérence des données (couleurs, récompenses et recettes existantes, arbre sans cycle).
- Textes : `accents.test.ts` (compléter `WRONG` au besoin).
- Rendu : vérification manuelle dans l'aperçu navigateur (`bun run dev` + `devTauriShim`, à compléter pour le multi-fenêtre).

## 4. Découpage en sous-projets

Dans cet ordre, chacun avec sa spec, son plan et son implémentation :

1. **Socle** : `garden.json`, moteur de pousse temps réel et pluie, scène HD-2D, fond passif, fenêtre Potager et cycle de vie, réglage "Fond animé".
2. **Onglet Champ** : outils séparés, parcelle sur grille, déplacement, corbeaux, feuilles, arrosage et ses incitations.
3. **Espèces et Herbier** : générateur de sprites complet, 12 à 14 espèces, raretés et animations, page Herbier, pressage.
4. **Sachets et pity visible** : sachet quotidien, tirages, jauges, page Sachets.
5. **Arbre de progression et tâches** : page Progression, paniers de saison, déblocages de décor et de parcelles.
6. **Atelier** : chaudron, préparations, recettes par l'arbre, hybrides par pollen.

## 5. Hors périmètre (pour l'instant)

- Monnaie, marchand, visiteurs, troc.
- Casino / roue de la récolte, boss.
- Saisons autres que l'automne.
- Croisement naturel aléatoire.
- Bonus liés à l'usage de l'app.
- Bonus de rosée du matin.
