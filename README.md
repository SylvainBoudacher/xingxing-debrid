<div align="center">

# XingXing Debrid

**Torrent search, debrid, and streaming in a single desktop app.**

From C411 search to AllDebrid link, without leaving the app.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-backend-DEA584?logo=rust&logoColor=white)

<!-- Main screenshot here -->
<!-- ![XingXing Debrid preview](docs/screenshot-main.png) -->

</div>

---

## Overview

XingXing Debrid connects three services in a single flow: search for content on **C411**, the app fetches the magnet link and sends it to **AllDebrid**, which gives you a direct download link or a stream you can open in VLC. No more juggling between a tracker, a torrent client, and a debrid service.

## Features

### Search

Search the C411 catalogue directly and send a magnet to AllDebrid in one click.

<!-- ![Search page](docs/screenshot-search.png) -->

### Discover

Browse popular movies and series via **TMDB**, with automatic matching to available releases (quality, languages, seasons detected from the release name).

<!-- ![Discover page](docs/screenshot-discover.png) -->

### Magnets

Track your AllDebrid magnets in real time: status, progress, speed, seeders. Download files, copy debrid links, or open playback directly in **VLC**.

<!-- ![Magnets page](docs/screenshot-magnets.png) -->

### Also

- **Guided setup**: a first-launch wizard to enter your API keys (C411, AllDebrid, TMDB)
- **Secure storage**: keys are managed on the Rust side, never exposed to the frontend
- **Light / dark theme** with smooth animations
- **Preferences**: customize the display to your habits
- **Release notes** built into the app

## Tech stack

| Layer        | Technology                                             |
| ------------ | ------------------------------------------------------ |
| UI           | React 19, TypeScript, Tailwind CSS 4, Motion, Radix UI |
| Native shell | Tauri 2 (Rust)                                         |
| Build        | Vite 7, Bun                                            |
| Persistence  | tauri-plugin-store                                     |

## Prerequisites

- [Bun](https://bun.sh)
- [Rust](https://rustup.rs) (stable toolchain)
- An [AllDebrid](https://alldebrid.com) API key
- A C411 account and its API key
- A [TMDB](https://www.themoviedb.org/settings/api) API key (for the Discover page)

## Installation

```bash
# Clone the repo
git clone <repo-url>
cd c411-debrid-app

# Install dependencies
bun install

# Run in development (Tauri + Vite with HMR)
bun run tauri dev
```

On first launch, the setup wizard will ask for your API keys. They are stored locally and never leave your machine (outside of calls to the relevant APIs).

## Production build

```bash
bun run tauri build
```

Binaries are generated in `src-tauri/target/release/bundle/`.

## Project structure

```
src/                  # React frontend
  pages/              # Search, Discover, Magnets, Preferences, Setup
  components/         # Shared components (UI, forms)
  lib/                # API keys, release parsing, themes
src-tauri/
  src/lib.rs          # Tauri commands (Rust backend)
  tauri.conf.json     # App configuration
```

## Disclaimer

This application is a client for third-party services. You are responsible for how you use it and for complying with the laws in your country.
