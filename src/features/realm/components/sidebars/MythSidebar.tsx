/**
 * @file MythSidebar.tsx
 * This component renders the sidebar for the Myth tool. It lists all myths
 * present in the realm and provides controls for editing their names,
 * relocating them, or removing them.
 */

import React from 'react';
import type { Realm, Hex, Myth } from '@/features/realm/types';
import { Icon } from '../Icon';
import {
  DEFAULT_MYTH_MARKER_FILL_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_WIDTH,
} from '@/features/realm/config/constants';
import { TerrainColorSwatch } from '../ui/TerrainColorSwatch';

/**
 * Props for the MythSidebar component.
 */
interface MythSidebarProps {
  realm: Realm;
  selectedHex: Hex | null;
  onSelectHex: (hex: Hex | null) => void;
  onUpdateMyth: (myth: Myth) => void;
  onRemoveMyth: (hex: Hex) => void;
  relocatingMythId: number | null;
  onToggleRelocateMyth: (mythId: number) => void;
  onClose: () => void;
  mythMarkerFillColor: string;
  mythMarkerBorderColor: string;
  mythMarkerBorderWidth: number;
  onUpdateMythMarkerFillColor: (color: string) => void;
  onResetMythMarkerFillColor: () => void;
  onUpdateMythMarkerBorderColor: (color: string) => void;
  onResetMythMarkerBorderColor: () => void;
  onUpdateMythMarkerBorderWidth: (width: number) => void;
}

/**
 * The sidebar component for managing myths.
 */
export function MythSidebar({
  realm,
  selectedHex,
  onSelectHex,
  onUpdateMyth,
  onRemoveMyth,
  relocatingMythId,
  onToggleRelocateMyth,
  onClose,
  mythMarkerFillColor,
  mythMarkerBorderColor,
  mythMarkerBorderWidth,
  onUpdateMythMarkerFillColor,
  onResetMythMarkerFillColor,
  onUpdateMythMarkerBorderColor,
  onResetMythMarkerBorderColor,
  onUpdateMythMarkerBorderWidth,
}: MythSidebarProps) {
  const findHexForMyth = (myth: Myth): Hex | undefined => {
    return realm.hexes.find((h) => h.q === myth.q && h.r === myth.r);
  };

  const handleMythClick = (myth: Myth) => {
    if (relocatingMythId) return;
    const hex = findHexForMyth(myth);
    if (hex) onSelectHex(selectedHex?.myth === myth.id ? null : hex);
  };

  const handleRemoveClick = (myth: Myth) => {
    const hex = findHexForMyth(myth);
    if (hex) onRemoveMyth(hex);
  };

  const resolvedFillColor = mythMarkerFillColor.toUpperCase();
  const resolvedBorderColor = mythMarkerBorderColor.toUpperCase();
  const defaultFillColor = DEFAULT_MYTH_MARKER_FILL_COLOR.toUpperCase();
  const defaultBorderColor = DEFAULT_MYTH_MARKER_BORDER_COLOR.toUpperCase();
  const defaultBorderWidth = DEFAULT_MYTH_MARKER_BORDER_WIDTH;
  const formattedBorderWidth = mythMarkerBorderWidth.toFixed(2).replace(/\.?0+$/, '');

  return (
    <aside className="w-80 bg-realm-canvas-backdrop border-l border-border-panel-divider p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Myth Tool</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-realm-command-panel-hover"
          aria-label="Close Myth Tool"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        <div>
          <h3 className="text-lg font-semibold mb-2">All Myths</h3>
          {realm.myths.length > 0 ? (
            <ul className="space-y-2">
              {realm.myths
                .sort((a, b) => a.id - b.id)
                .map((myth) => {
                  const isExpanded = selectedHex?.myth === myth.id;
                  const isRelocating = relocatingMythId === myth.id;

                  return (
                    <li
                      key={myth.id}
                      className="bg-realm-map-viewport rounded-md overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => handleMythClick(myth)}
                        className="w-full text-left p-3 hover:bg-realm-command-panel-hover transition-colors flex justify-between items-center disabled:cursor-not-allowed"
                        aria-expanded={isExpanded || isRelocating}
                        disabled={!!relocatingMythId}
                      >
                        <div>
                          <p className="font-semibold text-text-accent-headline">
                            Myth #{myth.id}:{' '}
                            <span className="text-text-high-contrast">{myth.name}</span>
                          </p>
                          <p className="text-xs text-text-muted">
                            Location: ({myth.q}, {myth.r})
                          </p>
                        </div>
                        <Icon
                          name={isExpanded || isRelocating ? 'chevron-up' : 'chevron-down'}
                          className="w-5 h-5 text-text-muted flex-shrink-0"
                        />
                      </button>
                      {(isExpanded || isRelocating) && (
                        <div className="p-3 border-t border-border-panel-divider/50 bg-realm-map-viewport/50 space-y-3">
                          <div>
                            <label
                              htmlFor={`myth-name-${myth.id}`}
                              className="block text-sm font-medium text-text-muted mb-1"
                            >
                              Edit Name
                            </label>
                            <input
                              id={`myth-name-${myth.id}`}
                              type="text"
                              value={myth.name}
                              onChange={(e) => onUpdateMyth({ ...myth, name: e.target.value })}
                              className="w-full bg-realm-command-panel-surface p-2 text-sm font-medium text-text-muted focus:outline-none focus:ring-2 focus:ring-actions-command-primary rounded-md"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onToggleRelocateMyth(myth.id)}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isRelocating
                                  ? 'bg-realm-command-panel-hover/80 text-text-high-contrast hover:bg-realm-command-panel-hover'
                                  : 'bg-realm-command-panel-surface text-text-muted hover:bg-realm-command-panel-hover'
                              }`}
                            >
                              <Icon name="move" className="w-4 h-4" />
                              {isRelocating ? 'Cancel Relocate' : 'Relocate'}
                            </button>
                            <button
                              onClick={() => handleRemoveClick(myth)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-muted bg-actions-danger-base/50 rounded-md hover:bg-actions-danger-base/80 border border-actions-danger-base transition-colors"
                            >
                              <Icon name="trash-2" className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {isRelocating && (
                        <div className="p-3 bg-realm-command-panel-hover/50 text-center text-sm text-text-subtle">
                          Select a new hex on the map.
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-text-muted text-center py-4">
              No myths have been placed on the map.
            </p>
          )}
        </div>
        <section className="rounded-md border border-border-panel-divider/60 bg-realm-map-viewport/40 p-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Marker Styling
          </h3>
          <div className="mt-2 space-y-2 text-[11px]">
            <div className="flex items-center gap-2">
              <TerrainColorSwatch
                color={resolvedFillColor}
                ariaLabel="Choose myth marker fill color"
                tooltip="Choose myth marker fill color"
                onChange={onUpdateMythMarkerFillColor}
                onReset={onResetMythMarkerFillColor}
                canReset={resolvedFillColor !== defaultFillColor}
                className="w-8 h-8 rounded-sm"
                iconClassName="w-3.5 h-3.5"
              />
              <div className="flex-1 leading-tight">
                <span className="block font-medium text-text-high-contrast">Fill</span>
                <span className="font-mono text-[10px] text-text-muted">{resolvedFillColor}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TerrainColorSwatch
                color={resolvedBorderColor}
                ariaLabel="Choose myth marker border color"
                tooltip="Choose myth marker border color"
                onChange={onUpdateMythMarkerBorderColor}
                onReset={onResetMythMarkerBorderColor}
                canReset={resolvedBorderColor !== defaultBorderColor}
                className="w-8 h-8 rounded-sm"
                iconClassName="w-3.5 h-3.5"
              />
              <div className="flex-1 leading-tight">
                <span className="block font-medium text-text-high-contrast">Border</span>
                <span className="font-mono text-[10px] text-text-muted">{resolvedBorderColor}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-10 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                Width
              </span>
              <div className="flex flex-1 items-center gap-2 rounded-sm px-2 py-1">
                <input
                  type="range"
                  aria-label="Set myth marker border width"
                  min="0"
                  max="8"
                  step="0.25"
                  value={mythMarkerBorderWidth}
                  onChange={(event) => {
                    const parsed = parseFloat(event.target.value);
                    onUpdateMythMarkerBorderWidth(
                      Number.isFinite(parsed) ? parsed : defaultBorderWidth
                    );
                  }}
                  className="h-2 flex-1 cursor-pointer accent-actions-command-primary/80"
                />
                <span className="w-12 text-right font-mono text-[10px] text-text-high-contrast">
                  {formattedBorderWidth}px
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
