<div align="center">

# XingXing Debrid

**Recherche de torrents, debrid et streaming dans une seule application de bureau.**

De la recherche C411 au lien debride AllDebrid, sans quitter l'app.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-backend-DEA584?logo=rust&logoColor=white)

<!-- Capture d'ecran principale ici -->
<!-- ![Apercu de XingXing Debrid](docs/screenshot-main.png) -->

</div>

---

## Presentation

XingXing Debrid connecte trois services en un seul flux : vous cherchez un contenu sur **C411**, l'app recupere le lien magnet et l'envoie a **AllDebrid**, qui vous fournit un lien de telechargement direct ou un flux a lire dans VLC. Plus besoin de jongler entre un tracker, un client torrent et un debrideur.

## Fonctionnalites

### Recherche

Recherchez directement dans le catalogue C411 et envoyez un magnet vers AllDebrid en un clic.

<!-- ![Page de recherche](docs/screenshot-search.png) -->

### Decouverte

Parcourez les films et series populaires via **TMDB**, avec correspondance automatique vers les releases disponibles (qualite, langues, saisons detectees depuis le nom de la release).

<!-- ![Page Decouverte](docs/screenshot-discover.png) -->

### Magnets

Suivez vos magnets AllDebrid en temps reel : statut, progression, vitesse, seeders. Telechargez les fichiers, copiez les liens debrides ou lancez la lecture directement dans **VLC**.

<!-- ![Page Magnets](docs/screenshot-magnets.png) -->

### Et aussi

- **Configuration guidee** : un assistant de premier lancement pour renseigner vos cles API (C411, AllDebrid, TMDB)
- **Stockage securise** : les cles sont gerees cote Rust, jamais exposees au front
- **Theme clair / sombre** avec animations fluides
- **Preferences** : personnalisez l'affichage selon vos habitudes
- **Notes de version** integrees a l'app

## Stack technique

| Couche      | Technologie                                            |
| ----------- | ------------------------------------------------------ |
| Interface   | React 19, TypeScript, Tailwind CSS 4, Motion, Radix UI |
| Shell natif | Tauri 2 (Rust)                                         |
| Build       | Vite 7, Bun                                            |
| Persistance | tauri-plugin-store                                     |

## Prerequis

- [Bun](https://bun.sh)
- [Rust](https://rustup.rs) (toolchain stable)
- Une cle API [AllDebrid](https://alldebrid.com)
- Un compte C411 et sa cle API
- Une cle API [TMDB](https://www.themoviedb.org/settings/api) (pour la page Decouverte)

## Installation

```bash
# Cloner le depot
git clone <repo-url>
cd c411-debrid-app

# Installer les dependances
bun install

# Lancer en developpement (Tauri + Vite avec HMR)
bun run tauri dev
```

Au premier lancement, l'assistant de configuration vous demande vos cles API. Elles sont stockees localement et ne quittent jamais votre machine (hors appels aux APIs concernees).

## Build de production

```bash
bun run tauri build
```

Les binaires sont generes dans `src-tauri/target/release/bundle/`.

## Structure du projet

```
src/                  # Frontend React
  pages/              # Recherche, Decouverte, Magnets, Preferences, Setup
  components/         # Composants partages (UI, formulaires)
  lib/                # Cles API, parsing de releases, themes
src-tauri/
  src/lib.rs          # Commandes Tauri (backend Rust)
  tauri.conf.json     # Configuration de l'app
```

## Avertissement

Cette application est un client pour des services tiers. Vous etes responsable de l'usage que vous en faites et du respect de la legislation en vigueur dans votre pays.
