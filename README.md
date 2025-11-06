<h1 align="center">
  <br>
  <a href="https://mrdekeijzer.github.io/hex-realm-generator/"><img src="https://github.com/MRDekeijzer/hex-realm-generator/blob/main/public/MainScreenshot.png?raw=true" alt="Hex Realm Generator - MRDekeijzer" width="800"></a>
  <br>
  Hex Realm Generator
  <br>
</h1>

<h4 align="center">A browser-based hex realm builder for the Mythic Bastionland TTRPG</h4>

<p align="center">
  <a href="https://github.com/MRDekeijzer/hex-realm-generator/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg"
         alt="License">
  </a>
  <a href="https://github.com/MRDekeijzer/hex-realm-generator/releases">
    <img src="https://img.shields.io/badge/version-1.0-brightgreen.svg"
         alt="Version">
  </a>
  <a href="https://github.com/MRDekeijzer/hex-realm-generator/stargazers">
    <img src="https://img.shields.io/github/stars/MRDekeijzer/hex-realm-generator.svg?style=social&label=Star"
         alt="GitHub stars">
  </a>
  <a href="https://mrdekeijzer.github.io/hex-realm-generator/">
    <img src="https://img.shields.io/badge/demo-live-success.svg"
         alt="Live Demo">
  </a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#build--run-locally">Build & Run Locally</a> •
  <a href="#credits">Credits</a> •
  <a href="#support">Support</a> •
  <a href="#future-plans">Future Plans</a> •
  <a href="#license">License</a>
</p>

<!-- Screenshot/GIF section -->

<!-- ![screenshot](https://github.com/MRDekeijzer/hex-realm-generator/blob/main/public/MainScreenshot.png?raw=true) -->

<!--
  TODO: Replace with animated GIF showing the tool in action
  Suggested demo flow: Generate realm → Paint terrain → Add myth → Export PNG
  ![demo](path/to/demo.gif)
-->

## Introduction

Hex Realm Generator is a modern, browser-based tool designed to streamline realm creation for **Mythic Bastionland** referees. With this tool I tried to create a modern and easy to use realm creator webpage that follows the rules detailed in the Mythic Bastionland book. I have focussed on a good out of the box experience, but you can also add your own art and images to really make this realm yours.

**[Launch Hex Realm Generator →](https://mrdekeijzer.github.io/hex-realm-generator/)**

### Inspiration

Shout out to the following pages for inspiration and guidance:

- **[Hex Friend](https://hexfriend.net/)**
- **[Mythic Bastionland Tools](https://mythic.bastionland.tools/map)**

## Key Features

### Procedural Generation

- **Perlin Noise-Based Terrain** - Generate natural-looking hex realms with customizable noise parameters
- **Configurable Grid Sizes** - Build compact encounter sites or sprawling campaign maps
- **Smart Myth Placement** - Automatically distributes myths according to Mythic Bastionland rules
- **Terrain Clustering** - Fine-tune biome distribution with roughness controls and clustering matrices

### Interactive Editing Tools

- **Terrain Painter** - Click or drag to paint terrain types, sample colors with the pipette tool
- **POI Painter** - Place holdings, landmarks, and travel icons with custom backdrops
- **Barrier Painter** - Draw realm boundaries with automatic edge mirroring
- **Myth Manager** - Add, configure, and relocate myths with drag-and-drop
- **Selection Tool** - Inspect and edit individual hex properties

### Referee & Knight Views

- **Dual Visibility Modes** - Toggle between referee (full info) and knight (player-facing) views
- **Granular Layer Control** - Show/hide grid, icons, terrain spray, barriers, and more
- **Export Preview** - See exactly what your players will see before exporting

### History & Workflow

- **Undo/Redo Support** - Full history tracking for all edits (Ctrl+Z / Ctrl+Y)
- **Quick Save Slots** - Snapshot entire realm states for fast iteration
- **Import/Export** - Save and load realms with all settings, colors, and myths intact
- **PNG Export** - Download publication-ready maps with customizable overlays

### Further Customization

- **Custom Icons & Colors** - Upload your own artwork for holdings, landmarks, and terrain
- **Realm Presets** - Jump-start creation with curated themes and color palettes
- **Built-in Tutorial** - Interactive onboarding walks you through the tool

### Performance & Accessibility

- **Client-Side Only** - No server required, runs entirely in your browser
- **Keyboard Shortcuts** - Tools 1–5, arrow keys for tutorial navigation
- **Cross-Platform** - Works on Windows, macOS, and Linux
- **Cross-browser** - Mainly tested on Firefox, further testing on chrome and other browsers but some issues may remain

## How To Use

### Live Demo (Recommended)

The fastest way to start building realms is the **[live demo on GitHub Pages](https://mrdekeijzer.github.io/hex-realm-generator/)**.

No installation required—just open the link and start creating!

### First Steps

1. **Generate a Realm** - Click the ✨ Generate button or explore the Realm Presets for themed starting points
2. **Learn the Tools** - Follow the interactive tutorial (appears on first visit) or reopen it from the settings
3. **Edit Your Realm** - Use the Tools Palette (shortcuts 1–5) to paint terrain, add myths, and place holdings
4. **Export Your Map** - Click the PNG export button to download your realm for play

> **Tip:** Check out the built-in tutorial by opening the app—it covers all core features in a guided walkthrough.

## Build & Run Locally

Want to run your own instance or contribute? Follow these steps:

### Prerequisites

- **[Node.js](https://nodejs.org/)** (v14+ recommended)
- **[Git](https://git-scm.com/)**

### Installation

```bash
# Clone the repository
git clone https://github.com/MRDekeijzer/hex-realm-generator.git

# Navigate into the directory
cd hex-realm-generator

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev

# Open http://localhost:5173 in your browser
# (Vite will display the exact port in the terminal)
```

The dev server includes hot module replacement—changes appear instantly as you edit.

### Production Build

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

Build output goes to the `dist/` directory.

### Code Quality

```bash
# Run linter and formatter checks
npm run check

# Auto-fix linting issues
npm run lint:fix

# Auto-format code
npm run format:fix
```

## Project Structure

```
src/
├── main.tsx                    # Application entry point
├── app/
│   ├── App.tsx                 # Main app component with realm state
│   ├── theme/                  # Color tokens and palette
│   └── styles/                 # Global CSS
├── features/
│   ├── realm/
│   │   ├── components/         # UI components (HexGrid, Toolbar, Sidebars, etc.)
│   │   ├── services/           # Generation logic (Perlin noise, realm generator)
│   │   ├── utils/              # Hex math, spray, texture, visibility helpers
│   │   ├── hooks/              # Pan/zoom and other custom hooks
│   │   ├── types/              # TypeScript definitions
│   │   └── config/             # Constants, presets, metadata
│   └── onboarding/             # Interactive tutorial system
└── shared/
    ├── hooks/                  # useHistory, useInfoPopup
    └── utils/                  # Shared utilities
```

## Configuration

### Environment Variables

Hex Realm Generator runs entirely client-side and requires no API keys for core functionality.

### Customization

- **Terrain Settings** - Adjust noise scale, roughness, clustering via the Settings modal
- **Color Palettes** - Modify `src/app/theme/colors.ts` or use the in-app color pickers
- **Icon Sets** - Upload custom SVG icons through the Terrain and POI painter sidebars
- **Presets** - Add your own in `src/features/realm/config/realmPresets.ts`

## Credits

### Inspiration & Game System

- **[Mythic Bastionland](https://chrismcdee.itch.io/mythic-bastionland)** by Chris McDowall - The TTRPG this tool is built for
  - Hex Realm Generator is an independent fan project built from the free Quickstart and Realm Sheet PDF
  - Not endorsed by or affiliated with Mythic Bastionland or Bastionland Press

### Development Tools & AI Assistance

- **[Google AI Studio](https://aistudio.google.com/)** - Project originally started as a proof-of-concept here
- **[GitHub Copilot](https://github.com/features/copilot)** - AI pair programming assistance
- **[OpenAI Codex](https://openai.com/blog/openai-codex)** - Code generation support

### Open Source Technologies

This project is built with these libraries and tools:

- **[React](https://react.dev/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite](https://vitejs.dev/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[Lucide](https://lucide.dev/)**
- **[Inkscape](https://inkscape.org/)**

### Asset Attribution

- **Holding & Landmark Art** - Extracted from [Mythic Bastionland Realm Sheets](https://chrismcdee.itch.io/mythic-bastionland) (available on itch.io)
- All third-party assets remain the property of their respective creators

### Special Thanks

README template inspired by [Electron Markdownify](https://github.com/amitmerchant1990/electron-markdownify).

## Support

If Hex Realm Generator saves you prep time or helps bring your Mythic Bastionland campaigns to life, consider supporting ongoing development:

<a href="https://buymeacoffee.com/mrdekeijzer" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Future Plans

This project is semi-actively maintained with several features in the pipeline:

- **Split-Screen Mode** - Allow splitting the screen into two pages for simultaneous referee and player views
- **Granular Visibility Controls** - Show/hide individual elements (landmarks, holdings, etc.) to players
- **River support** - Support for adding a river in your realm.
- **Better myth control & Exporting** - Add information to myths and export myth details for printing
- **Barrier generation& Feature Improvements** - Realistic (not random) barrier generation

> **Note:** These are planned features and may not be implemented soon. The roadmap evolves based on community feedback and development time.

## License

Apache License 2.0

See the [LICENSE](LICENSE) file for full details.

---

> GitHub [@MRDekeijzer](https://github.com/MRDekeijzer) &nbsp;&middot;&nbsp;
> Project [hex-realm-generator](https://github.com/MRDekeijzer/hex-realm-generator)
