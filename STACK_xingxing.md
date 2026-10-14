# Stack

Application desktop `xingxing-debrid` v1.7.5 (Tauri 2).

## Plateforme

| Domaine      | Technologie             |
| ------------ | ----------------------- |
| Shell natif  | Tauri 2                 |
| Backend      | Rust (edition 2021)     |
| Frontend     | React 19 + TypeScript 6 |
| Bundler      | Vite 8 (port 1420)      |
| Gestionnaire | Bun (`bun.lock`)        |

## Frontend

| Domaine         | Librairies                                                                           |
| --------------- | ------------------------------------------------------------------------------------ |
| UI              | shadcn/ui, Radix UI (alert-dialog, dropdown-menu, label, select, slot, tooltip)      |
| Style           | Tailwind CSS 4 (`@tailwindcss/vite`), class-variance-authority, clsx, tailwind-merge |
| Thème           | next-themes                                                                          |
| Icônes / police | lucide-react, @fontsource/jersey-10                                                  |
| Animations      | motion, animejs, border-beam, metal-fx, thinking-orbs                                |
| Notifications   | sonner                                                                               |
| Données         | TanStack Query 5 (services typés dans `src/lib/services/`)                           |
| Navigation      | Aucun routeur : union `Page` dans `App.tsx`                                          |

## Plugins Tauri

| Plugin  | Usage                                 |
| ------- | ------------------------------------- |
| http    | Requêtes réseau                       |
| store   | Stockage clé-valeur (`settings.json`) |
| opener  | Ouverture de liens / fichiers         |
| dialog  | Boîtes de dialogue natives            |
| updater | Mises à jour in-app                   |
| process | Redémarrage après mise à jour         |

## Backend Rust

| Crate                | Usage                                      |
| -------------------- | ------------------------------------------ |
| tauri                | Framework                                  |
| serde / serde_json   | Sérialisation                              |
| reqwest (rustls-tls) | Client HTTP (multipart, json, stream)      |
| futures-util         | Streams asynchrones                        |
| keyring              | Stockage des clés API dans le trousseau OS |
| argon2               | Dérivation de clé                          |
| chacha20poly1305     | Chiffrement                                |
| base64               | Encodage                                   |
| zip                  | Archives (deflate)                         |
| winreg (Windows)     | Accès au registre                          |

## Outillage

| Domaine   | Outils                                                             |
| --------- | ------------------------------------------------------------------ |
| Tests     | Vitest 5, @vitest/coverage-v8                                      |
| Lint      | ESLint 10, typescript-eslint, eslint-plugin-react-hooks            |
| Format    | Prettier                                                           |
| Git hooks | simple-git-hooks, lint-staged (pre-commit : lint + `tsc --noEmit`) |
| Devtools  | @tanstack/react-query-devtools                                     |

## Services externes

- C411 (recherche de torrents)
- AllDebrid (API de débridage)
- TMDB (métadonnées et jaquettes)
- MangaDex
