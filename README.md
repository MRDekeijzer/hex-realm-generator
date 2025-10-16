# Hex Realm Generator

![Main Image Header](https://github.com/MRDekeijzer/hex-realm-generator/blob/main/public/MainScreenshot.png?raw=true)

Hex Realm Generator is a browser-based tool to quickly create hex-based realms and encounter sites for TTRPGs, built specifically to support Mythic Bastionland-style play. Use it to procedurally generate terrain, paint points-of-interest (POIs), draw barriers, tweak generation settings, and export maps for use at the table.

Author: https://github.com/MRDekeijzer
View on: https://mrdekeijzer.github.io/hex-realm-generator/

## What this does

- Procedural hex-grid realm generation using Perlin/noise-based algorithms.
- Interactive painting tools for terrain, POIs, and barriers.
- Undo/redo history and pan/zoom support for smooth editing.
- Configurable generation and terrain settings via a settings modal.
- Export or save work locally (file service integration).

This project is optimized for fast creation of intriguing, compact realms suitable for Mythic Bastionland sessions, but it can be used in other hex-based TTRPGs as well.

## Features

- Hex grid rendering with configurable grid size and formatting.
- Procedural generation with tweakable controls (noise scale, jitter, seed, etc.).
- Manual painting tools: terrain painter, POI painter, barrier painter, and spray tools.
- History controls for undo/redo and version management.
- Lightweight UI: toolbar, palette, settings, and helpful shortcuts.

## Quickstart (development)

Prerequisites: Node.js (14+ recommended) and npm.

1. Install dependencies:

   npm install

2. Run the dev server:

   npm run dev

3. Open http://localhost:5173 (or the port Vite reports) in a browser.

## Build for production

1. Build:

   npm run build

2. Preview production build locally:

   npm run preview

## Project structure (high level)

- `src/components` — React components: painters, toolbar, settings modal, sidebar, hex grid and UI controls.
- `src/services` — core generation and utilities (Perlin noise, realm generator, file service).
- `src/hooks` — custom hooks for pan/zoom and history.
- `src/utils` — helper utilities for hex math and spray painting.

Open the code to find exact components such as `HexGrid.tsx`, `TerrainPainter.tsx`, `PoiPainter.tsx`, and `realmGenerator.ts`.

## Usage notes

- Use the Tools palette to select terrain, POIs, or barrier modes, then click or drag on the map to paint.
- Generation settings allow you to tweak how the procedural algorithm lays out biomes and features.
- Use History controls to undo/redo changes.
- The toolbar exposes common actions (new, save/load, export) — check the UI for available export formats.

## Configuration & Environment

- The project runs entirely client-side for generation and painting. No API keys are required to use the core features.

If you later integrate external services, keep any keys out of source control and add them to a `.env.local` if needed.

## Credits

- Author: https://github.com/MRDekeijzer
- Mythic Bastionland (design inspiration and intended playstyle): https://chrismcdee.itch.io/mythic-bastionland
- Google Gemini Pro 2.5, Github Copilot, OpenAI Codex
- Icons by Lucide

Readme written with the help of AI.
