/**
 * @file TerrainPainterSidebar.tsx
 * This component renders the sidebar for the Terrain Painter tool. It allows users
 * to select a terrain type to paint, customize terrain colors, and add or remove
 * custom terrain types.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../Icon';
import { TERRAIN_TYPES } from '@/features/realm/config/constants';
import { resolveColorToken, getTerrainBaseColor } from '@/app/theme/colors';
import type { TileSet } from '@/features/realm/types';
import { InfoPopup } from '../ui/InfoPopup';
import { AddTerrainForm } from './terrain/AddTerrainForm';
import { useInfoPopup } from '@/shared/hooks/useInfoPopup';
import { TerrainColorSwatch } from '../ui/TerrainColorSwatch';

/**
 * Props for the TerrainPainterSidebar component.
 */
interface TerrainPainterSidebarProps {
  paintTerrain: string;
  setPaintTerrain: (terrain: string) => void;
  onClose: () => void;
  tileSets: TileSet;
  terrainColors: Record<string, string>;
  onAddTerrain: (name: string, color: string) => void;
  onRemoveTerrain: (id: string) => void;
  onUpdateTerrainColor: (id: string, color: string) => void;
  onResetTerrainColor: (id: string) => void;
  onStartPicking: () => void;
  isPickingTile: boolean;
  onOpenSpraySettings: (id: string) => void;
}

/**
 * The sidebar component for the terrain painting tool.
 */
export function TerrainPainterSidebar({
  paintTerrain,
  setPaintTerrain,
  onClose,
  tileSets,
  terrainColors,
  onAddTerrain,
  onRemoveTerrain,
  onUpdateTerrainColor,
  onResetTerrainColor,
  onStartPicking,
  isPickingTile,
  onOpenSpraySettings,
}: TerrainPainterSidebarProps) {
  const [newTerrainName, setNewTerrainName] = useState('');
  const [newTerrainColor, setNewTerrainColor] = useState('#CCCCCC');
  const {
    activeInfo,
    handleInfoClick,
    scheduleHoverOpen,
    scheduleHoverClose,
    cancelOpenTimeout,
    cancelCloseTimeout,
    closeInfo,
  } = useInfoPopup();

  const resolveColor = useCallback((value?: string) => {
    if (!value) {
      return '#CCCCCC';
    }
    return resolveColorToken(value);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        onStartPicking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartPicking]);

  useEffect(() => {
    if (!activeInfo) return;
    if (!tileSets.terrain.some((terrain) => terrain.id === activeInfo.id)) {
      closeInfo();
    }
  }, [activeInfo, closeInfo, tileSets.terrain]);

  const handleAddSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newTerrainName.trim();
    if (name) {
      onAddTerrain(name, newTerrainColor.toUpperCase());
      setNewTerrainName('');
      setNewTerrainColor('#CCCCCC');
    }
  };

  return (
    <aside className="w-80 bg-realm-canvas-backdrop border-l border-border-panel-divider p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Terrain Painter</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onStartPicking}
            className={`p-2 rounded-md transition-colors ${
              isPickingTile
                ? 'bg-actions-command-primary text-text-high-contrast'
                : 'text-text-muted hover:bg-realm-command-panel-hover'
            }`}
            title="Pick Terrain from Map (Ctrl+I)"
            aria-label="Pick Terrain from Map"
          >
            <Icon name="pipette" className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-realm-command-panel-hover"
            aria-label="Close Terrain Painter"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {isPickingTile && (
          <div className="bg-feedback-info-panel/50 text-center text-sm text-text-subtle p-2 rounded-md mb-4 animate-pulse">
            Click on the map to pick a terrain.
          </div>
        )}
        <p className="text-sm text-text-muted mb-4">
          Select a terrain to paint. Click a color swatch to customize.
        </p>
        <div className="space-y-2">
          {tileSets.terrain.map((terrain) => {
            const color = terrainColors[terrain.id] || '#CCCCCC';
            const resolvedColor = resolveColor(color);
            const isSelected = paintTerrain === terrain.id;
            const isDefault = TERRAIN_TYPES.includes(terrain.id);
            const defaultColor = isDefault ? getTerrainBaseColor(terrain.id) : undefined;
            const isCustomColor = isDefault && defaultColor ? defaultColor !== resolvedColor : false;
            const infoDescription =
              terrain.description ?? 'Custom terrain created by the user. Add details in settings.';
            const isInfoOpen = activeInfo?.id === terrain.id;
            const spraySummary = terrain.sprayIcons?.length
              ? `Signature icons: ${terrain.sprayIcons
                  .map((icon) => icon.replace(/-/g, ' '))
                  .join(', ')}`
              : 'No spray icons configured yet.';

            return (
              <div
                key={terrain.id}
                onClick={() => {
                  setPaintTerrain(terrain.id);
                  if (activeInfo) {
                    closeInfo();
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setPaintTerrain(terrain.id);
                    if (activeInfo) {
                      closeInfo();
                    }
                  }
                }}
                className={`relative group/item p-2 rounded-md transition-all duration-150 border-2 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-actions-command-primary/20 border-actions-command-primary'
                    : 'bg-realm-map-viewport border-border-panel-divider hover:border-text-muted'
                }`}
                title={`Paint ${terrain.label}`}
              >
                <div className="flex items-center gap-2 flex-grow min-w-0">
                  <TerrainColorSwatch
                    color={resolvedColor}
                    ariaLabel={
                      isCustomColor
                        ? `Reset ${terrain.label} color to default`
                        : `Select color for ${terrain.label}`
                    }
                    tooltip={isCustomColor ? 'Reset color to default' : 'Edit color'}
                    onChange={(value) => onUpdateTerrainColor(terrain.id, value)}
                    onReset={isCustomColor ? () => onResetTerrainColor(terrain.id) : undefined}
                    canReset={isCustomColor}
                    className="w-7 h-7 rounded-md flex-shrink-0 border border-white/80"
                    iconClassName="w-4 h-4 text-white"
                  />
                  <span
                    className={`font-medium text-sm truncate ${
                      isSelected ? 'text-text-high-contrast' : 'text-text-muted'
                    }`}
                  >
                    {terrain.label}
                  </span>
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        cancelOpenTimeout();
                        cancelCloseTimeout();
                        handleInfoClick(terrain.id, event.currentTarget as HTMLElement);
                      }}
                      onMouseEnter={(event) =>
                        scheduleHoverOpen(terrain.id, event.currentTarget as HTMLElement)
                      }
                      onMouseLeave={(event) => {
                        const nextTarget = event.relatedTarget as Node | null;
                        if (nextTarget && event.currentTarget.contains(nextTarget)) {
                          return;
                        }
                        scheduleHoverClose(terrain.id);
                      }}
                      className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                        isInfoOpen
                          ? 'bg-realm-map-viewport text-text-high-contrast'
                          : 'text-text-subtle hover:text-text-muted hover:bg-realm-map-viewport'
                      }`}
                      title={`Learn more about ${terrain.label}`}
                      aria-label={`Terrain information for ${terrain.label}`}
                      aria-expanded={isInfoOpen}
                      aria-haspopup="dialog"
                    >
                      <Icon name="info" className="w-3.5 h-3.5" />
                    </button>
                    {isInfoOpen && activeInfo?.anchor && (
                      <InfoPopup
                        anchor={activeInfo.anchor}
                        onClose={closeInfo}
                        onMouseEnter={cancelCloseTimeout}
                        onMouseLeave={() => {
                          if (activeInfo.locked) {
                            return;
                          }
                          scheduleHoverClose(terrain.id);
                        }}
                      >
                        <p className="text-xs leading-relaxed text-text-muted">{infoDescription}</p>
                        <div className="mt-2 flex items-center justify-between text-text-subtle text-[11px] uppercase tracking-wide">
                          <span>Palette Swatch</span>
                          <span>{resolvedColor}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full" style={{ backgroundColor: resolvedColor }} />
                        <p className="mt-2 text-[11px] text-text-muted leading-relaxed">{spraySummary}</p>
                      </InfoPopup>
                    )}
                  </div>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenSpraySettings(terrain.id);
                      if (activeInfo?.id === terrain.id) {
                        closeInfo();
                      }
                    }}
                    title={`Edit ${terrain.label} spray settings`}
                    aria-label={`Edit ${terrain.label} spray settings`}
                  >
                    <Icon name="settings" className="w-5 h-5 text-white" />
                  </button>
                </div>

                {!isDefault && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveTerrain(terrain.id);
                      if (activeInfo?.id === terrain.id) {
                        closeInfo();
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 p-1 text-text-high-contrast bg-actions-danger-base rounded-full hover:bg-actions-danger-hover opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                    title={`Remove ${terrain.label}`}
                    aria-label={`Remove ${terrain.label}`}
                  >
                    <Icon name="close" className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <AddTerrainForm
          name={newTerrainName}
          color={newTerrainColor}
          onNameChange={setNewTerrainName}
          onColorChange={(value) => setNewTerrainColor(value.toUpperCase())}
          onSubmit={handleAddSubmit}
        />
      </div>
    </aside>
  );
}
