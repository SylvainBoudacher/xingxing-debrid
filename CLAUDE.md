# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Frontend**: React 19 + TypeScript, built with Vite (port 1420)
- **Backend**: Rust via Tauri 2
- **Package manager**: Bun (lockfile is `bun.lock`)
- **Plugins**: `tauri-plugin-http`, `tauri-plugin-store`, `tauri-plugin-opener`

## Commands

```bash
# Start full dev environment (Tauri + Vite with HMR)
bun run tauri dev

# Build for production
bun run tauri build

# Frontend only (no native shell)
bun run dev

# Type-check TypeScript
bunx tsc --noEmit
```

Rust compilation happens automatically inside `tauri dev` / `tauri build`. Run `cargo check` inside `src-tauri/` for a faster Rust-only type check.

## Architecture

The app follows standard Tauri 2 architecture:

- `src/` — React frontend. Communicates with Rust via `invoke()` from `@tauri-apps/api/core`.
- `src-tauri/src/lib.rs` — All Tauri commands are registered here via `tauri::generate_handler![]`. This is the primary entry point for backend logic.
- `src-tauri/src/main.rs` — Thin wrapper that calls `lib.rs::run()`.
- `src-tauri/capabilities/default.json` — Declares which Tauri plugin permissions the frontend window receives. Add new plugin permissions here.
- `src-tauri/tauri.conf.json` — App metadata, window config, and build hooks. `beforeDevCommand` runs `bun run dev`; Tauri then wraps it.

**Adding a Rust command**: define it with `#[tauri::command]` in `lib.rs`, then register it in `generate_handler![]`. Call it from the frontend with `invoke("command_name", { arg })`.

**HTTP requests**: use `@tauri-apps/plugin-http` (frontend) or `tauri-plugin-http` (Rust) — both are already enabled. Direct `fetch()` from the renderer is also permitted (CSP is `null`).

**Persistent storage**: `tauri-plugin-store` is initialized; use `@tauri-apps/plugin-store` on the frontend for key-value persistence.

## Output

- Return code first. Explanation after, only if non-obvious.
- No inline prose. Use comments sparingly - only where logic is unclear.
- No boilerplate unless explicitly requested.

## Code Rules

- Simplest working solution. No over-engineering.
- No abstractions for single-use operations.
- No speculative features or "you might also want..."
- Read the file before modifying it. Never edit blind.
- No docstrings or type annotations on code not being changed.
- No error handling for scenarios that cannot happen.
- Three similar lines is better than a premature abstraction.

## Review Rules

- State the bug. Show the fix. Stop.
- No suggestions beyond the scope of the review.
- No compliments on the code before or after the review.

## Debugging Rules

- Never speculate about a bug without reading the relevant code first.
- State what you found, where, and the fix. One pass.
- If cause is unclear: say so. Do not guess.

## Simple Formatting

- No em dashes, smart quotes, or decorative Unicode symbols.
- Plain hyphens and straight quotes only.
- Natural language characters (accented letters, CJK, etc.) are fine when the content requires them.
- Code output must be copy-paste safe.
