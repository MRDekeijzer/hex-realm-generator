# Project Structure

```
hex-realm-generator/
├─ index.html                 # Vite HTML entry, loads src/main.tsx
├─ vite.config.ts             # Vite configuration with @ → src alias
├─ tsconfig.json              # TypeScript config with @ alias mapping
├─ src/
│  ├─ main.tsx                # React entry point; mounts <App/>
│  ├─ app/
│  │  ├─ App.tsx              # Application root component and state orchestration
│  │  ├─ providers/
│  │  │  └─ ThemeProvider.tsx # Application-level theme context and hook
│  │  └─ styles/              # Global styles imported from main.tsx
│  ├─ assets/
│  │  └─ fonts/               # Font assets referenced by global styles
│  ├─ features/
│  │  └─ realm/
│  │     ├─ components/       # Realm-specific UI (hex grid, sidebars, toolbar, dialogs)
│  │     ├─ hooks/            # Realm domain hooks (e.g., panning & zooming)
│  │     ├─ services/         # Realm generation, file export, and noise utilities
│  │     ├─ utils/            # Hex math, textures, and spray helpers
│  │     ├─ config/           # Domain constants, settings, metadata
│  │     └─ types/            # Realm domain type definitions
│  └─ shared/
│     └─ hooks/               # Cross-cutting utilities (e.g., undo/redo history)
└─ PROJECT_STRUCTURE.md       # Current file
```

## Key Conventions
- Application code now lives under `src/`, with the `@` alias pointing to this directory.
- `src/app/` holds app-level concerns: entry component, styling, and providers.
- Domain-specific logic is grouped in `src/features/realm/`, keeping generation, UI, and helpers together.
- Shared utilities that can span features belong in `src/shared/`.
- Static assets that are bundled (fonts) sit under `src/assets/` and are referenced relatively from CSS.

## Updating or Extending
- Add new feature areas under `src/features/<feature-name>/` following the same internal structure.
- Reusable hooks/components should live in `src/shared/` to avoid feature coupling.
- Reference internal modules using the `@` alias (`@/features/realm/...`) to keep imports consistent.
