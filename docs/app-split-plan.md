# App.tsx Decomposition Plan

## Objectives
- Reduce the size and cognitive load of `src/app/App.tsx` (~1.3k LOC) without moving business logic out of React land.
- Group related state, side effects, and callbacks behind focused modules so the root component mostly orchestrates composition.
- Preserve existing behaviour (keyboard shortcuts, undo/redo history, export, imports, painting tools) while preparing for incremental refactors.

## Current Responsibilities Observed in `App.tsx`
- **Global state orchestration**: owns the realm history (`useHistory`), tool state, generation options, feature flags, colors, export settings, etc.
- **Cross-cutting effects**: theme bootstrapping, credits popover cookie, terrain texture generation, keyboard shortcuts, terrain roughness mirroring.
- **Domain operations**: myth add/remove/relocate, terrain & POI painting, realm import/export, barrier removal, seat of power updates.
- **UI composition**: decides which sidebar to render, wires props into `Toolbar`, `HexGrid`, modals, `PresetControls`, `HistoryControls`.

## Target Architecture Overview
```
src/app/
  App.tsx                    // thin orchestrator (providers + high-level layout)
  components/
    AppShell.tsx             // layout wrapper (toolbar, workspace, overlays)
    ToolbarContainer.tsx     // connects context to <Toolbar />
    Workspace.tsx            // owns HexGrid + Sidebar switch
    SidebarSwitcher.tsx      // renders right sidebar based on tool
    ModalLayer.tsx           // ExportModal + Credits + Confirmation
    FooterLayer.tsx          // PresetControls + HistoryControls visibility
  state/
    AppStateProvider.tsx     // aggregates domain + UI state via hooks
    useRealmState.ts         // realm data, history, myth helpers
    useToolState.ts          // active tool, painting, picking
    useUiState.ts            // settings panels, confirmation dialogs
    useExportState.ts        // export modal + settings
    useEffects.ts            // reusable effects (theme, credits, shortcuts, textures)
```

## Extraction Checklist
1. **Create state provider scaffolding**
   - Build `AppStateProvider` that instantiates all current `useState`/`useHistory` hooks and memoises a context value grouped by responsibility (realm, tools, ui, export).
   - Migrate setter functions and handlers (e.g. `handleGenerateRealm`, `handleAddMyth`) into dedicated hook files under `state/` so they remain testable outside JSX.
   - Expose strongly typed selectors (e.g. `useRealmState`, `useToolState`) to avoid prop drilling to new components.

2. **Move side effects into custom hooks**
   - Convert top-level `useEffect` blocks to named hooks (`useThemeBootstrap`, `useCreditsNotice`, `useSyncKnightVisibility`, `useTerrainTextures`, `useKeyboardShortcuts`, `useRoughnessAutoClustering`).
   - Ensure hooks receive dependencies from the provider to keep side effects near the logic they affect.

3. **Extract container components**
   - `ToolbarContainer`: consumes context slices, passes callbacks (`handleGenerateRealm`, export handlers, settings toggles) to `Toolbar`.
   - `Workspace`: renders `HexGridContainer` and `SidebarSwitcher`. The hex grid container owns grid-specific callbacks (selection, painting, myth relocation) via context.
   - `SidebarSwitcher`: switches between `TerrainPainterSidebar`, `PoiPainterSidebar`, `BarrierPainterSidebar`, `MythSidebar`, `SelectionSidebar`.
   - `ModalLayer`: handles `ExportModal`, `CreditsModal`, and `ConfirmationDialog`, using context flags/state.
   - `FooterLayer`: wraps `PresetControls` and `HistoryControls` and enforces visibility logic (`!isSettingsOpen`).

4. **Slim down `App.tsx`**
   - Import the provider and layout components, render them in <App> with minimal local logic (ideally: const `App` returns `<AppStateProvider><AppShell /></AppStateProvider>`).
   - Move all inline helper functions out (either into provider hooks or the new containers).

5. **Validation & cleanup**
   - Ensure all components & hooks have colocated unit tests where practical (especially around helper logic such as myth relocation or export payload building).
   - Confirm existing behaviour through manual smoke tests (realm generation, painting, import/export, keyboard shortcuts).
   - Delete dead code paths in `App.tsx` after migration and update relative imports to the new provider structure.

## Incremental Migration Strategy
1. Land the provider + hook modules while keeping `App.tsx` as the sole consumer to prove parity.
2. Move `Toolbar` wiring into `ToolbarContainer`, update `App.tsx` to use it.
3. Extract `HexGrid` wiring into `Workspace`/`HexGridContainer`, keep sidebars temporarily inline to reduce churn.
4. Move sidebar switch & modals into dedicated components.
5. Final pass to ensure `App.tsx` only composes `AppStateProvider`, `AppShell`, and any global CSS or theme helpers.

## Risks & Mitigations
- **Context value thrashing**: memoise provider slices and split contexts if necessary to avoid re-renders.
- **Tight coupling in handlers**: where callbacks share many dependencies, consider colocated hooks returning grouped operations to keep signatures stable.
- **Async texture generation**: preserve loading flags and error handling when relocating to hooks; add tests/mocks for `generateTerrainTextures`.
- **Keyboard shortcuts & picking**: ensure listeners clean up correctly after moving to `useKeyboardShortcuts`.

## Definition of Done
- `src/app/App.tsx` reduced to high-level composition (≤200 LOC target).
- All extracted modules covered by basic unit tests or story-level smoke tests.
- Feature parity confirmed for toolbar actions, grid interaction, export/import, settings modals, and shortcuts.
