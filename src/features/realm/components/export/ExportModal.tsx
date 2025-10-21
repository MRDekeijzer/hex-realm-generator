/**
 * @file ExportModal.tsx
 * Modal for configuring and previewing PNG exports of the realm map.
 */

import React, { useMemo } from 'react';
import type {
  ExportSettings,
  Realm,
  TerrainTextures,
  TileSet,
  ViewOptions,
} from '@/features/realm/types';
import { HexGrid } from '@/features/realm/components/HexGrid';
import type { ConfirmationState } from '@/app/App';
import { Icon } from '@/features/realm/components/Icon';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  settings: ExportSettings;
  onSettingsChange: (settings: ExportSettings) => void;
  realm: Realm | null;
  tileSets: TileSet;
  baseViewOptions: ViewOptions;
  terrainTextures: TerrainTextures | null;
  isLoadingTextures: boolean;
  barrierColor: string;
  previewSvgId: string;
  isExporting: boolean;
  previewPadding?: number;
}

const noop = () => {};
const noopConfirmationDispatch = (() => {}) as React.Dispatch<
  React.SetStateAction<ConfirmationState | null>
>;

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  settings,
  onSettingsChange,
  realm,
  tileSets,
  baseViewOptions,
  terrainTextures,
  isLoadingTextures,
  barrierColor,
  previewSvgId,
  isExporting,
  previewPadding = 40,
}: ExportModalProps) {
  const previewViewOptions = useMemo(() => {
    return {
      ...baseViewOptions,
      showGrid: settings.includeGrid,
      showIconSpray: settings.includeIconSpray,
      isGmView: settings.viewMode === 'referee',
    };
  }, [baseViewOptions, settings.includeGrid, settings.includeIconSpray, settings.viewMode]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-scrim p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="relative w-full max-w-5xl rounded-lg border border-border-panel-divider bg-realm-map-viewport shadow-xl">
        <div className="flex items-start justify-between border-b border-border-panel-divider px-6 py-4">
          <div>
            <h2 id="export-modal-title" className="text-xl font-semibold text-text-high-contrast">
              Export Map
            </h2>
            <p className="text-sm text-text-muted">
              Choose how the map should appear in the exported image and review it before saving.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-high-contrast transition-colors"
            aria-label="Close export modal"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[260px,1fr]">
          <section aria-label="Export settings" className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                View
              </h3>
              <div className="mt-2 flex gap-2">
                {(['referee', 'knight'] as const).map((mode) => {
                  const isActive = settings.viewMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSettingsChange({ ...settings, viewMode: mode })}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-actions-command-primary bg-actions-command-primary/20 text-text-high-contrast'
                          : 'border-border-panel-divider bg-realm-command-panel-surface text-text-muted hover:text-text-high-contrast'
                      }`}
                    >
                      {mode === 'referee' ? 'Referee View' : 'Knight View'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Appearance
              </h3>
              <div className="mt-2 flex flex-col gap-2 text-sm text-text-high-contrast">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.includeGrid}
                    onChange={(event) =>
                      onSettingsChange({ ...settings, includeGrid: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-border-panel-divider bg-realm-command-panel-surface text-actions-command-primary focus:ring-actions-command-primary"
                  />
                  <span>Include grid lines</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.includeIconSpray}
                    onChange={(event) =>
                      onSettingsChange({ ...settings, includeIconSpray: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-border-panel-divider bg-realm-command-panel-surface text-actions-command-primary focus:ring-actions-command-primary"
                  />
                  <span>Include icon spray</span>
                </label>
              </div>
            </div>

          </section>

          <section aria-label="Export preview" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                Preview
              </h3>
              <span className="text-xs text-text-subtle">
                Export uses the preview exactly as shown.
              </span>
            </div>
            <div className="relative h-80 overflow-hidden rounded-md border border-border-panel-divider bg-realm-map-viewport">
              {realm ? (
                <div className="pointer-events-none absolute inset-0">
                  <HexGrid
                    realm={realm}
                    onUpdateHex={noop}
                    viewOptions={previewViewOptions}
                    selectedHex={null}
                    onHexClick={noop}
                    activeTool="select"
                    setActiveTool={noop}
                    paintTerrain="plain"
                    paintPoi={null}
                    onAddMyth={noop}
                    onRemoveMyth={noop}
                    relocatingMythId={null}
                    onRelocateMyth={noop}
                    onSetSeatOfPower={noop}
                    tileSets={tileSets}
                    barrierColor={barrierColor}
                    isSettingsOpen={true}
                    isPickingTile={false}
                    onTilePick={noop}
                    setConfirmation={noopConfirmationDispatch}
                    terrainTextures={terrainTextures}
                    isLoadingTextures={isLoadingTextures}
                    svgId={previewSvgId}
                    isInteractive={false}
                    staticPadding={previewPadding}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-text-muted">
                  Generate a realm to preview the export.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-panel-divider px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-panel-divider px-4 py-2 text-sm font-medium text-text-muted hover:text-text-high-contrast"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onExport(settings)}
              disabled={!realm || isExporting}
              className="rounded-md bg-actions-command-primary px-4 py-2 text-sm font-semibold text-text-high-contrast transition-colors hover:bg-actions-command-primary/80 disabled:cursor-not-allowed disabled:bg-border-panel-divider disabled:text-text-muted"
            >
              {isExporting ? 'Exporting...' : 'Export PNG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
