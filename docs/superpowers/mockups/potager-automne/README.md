# Maquettes - Potager d'automne

Maquettes validées pendant le brainstorming du 2026-09-16. Elles servent de base visuelle et technique au jeu (voir la spec de vision dans `docs/superpowers/specs/`).

- `hd2d.html` : comparaison pixel art 2D / HD-2D (style retenu : HD-2D).
- `styles-48.html` : 5 palettes en 48x48 (retenue : Chaleureux).
- `fond-passif.html` : champ en fond de la fenêtre principale (30 fps, pauses, Potager ouvert, pas de parallaxe).
- `progression.html` : page Progression (arbre de chemins sans choix).
- `champ.html` : onglet Champ jouable (outils séparés, dernière version validée).
- `herbier.html` : page Herbier, 3 mises en page (retenue : B, carnet ouvert). Fragment pour le compagnon de brainstorming.
- `rarete-effets.html` : effets de rareté et variantes animés (retenue : B, marqué), esquisse de la Lanterne-de-lune.
- `sachets.html` : page Sachets, 3 mises en page (retenue : A, établi). Fragment pour le compagnon de brainstorming.
- `sachets-ouverture.html` : animations d'ouverture d'un sachet (retenue : B, cartes retournées). Fragment pour le compagnon de brainstorming.
- `gs.js` : générateur de sprites du jeu compilé pour ces deux maquettes (`bun build`).
- `pixelgen.js` : générateur de sprites pixel art (formes rastérisées, 4 tons, contour coloré automatique).
- `hd2dfield.js` : scène three.js (billboards, ombres, lumières, bloom, tilt-shift, particules, raycast).

Les modules ES et three.js (CDN) exigent un serveur HTTP :

```bash
bunx serve docs/superpowers/mockups/potager-automne
```
