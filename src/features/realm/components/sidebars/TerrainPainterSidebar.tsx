/**
 * @file TerrainPainterSidebar.tsx
 * This component renders the sidebar for the Terrain Painter tool. It allows users
 * to select a terrain type to paint and customize terrain colors and primary icons.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { Icon } from '../Icon';
import {
  TERRAIN_TYPES,
  TILE_CHARACTERS,
  DEFAULT_TERRAIN_ICONS,
} from '@/features/realm/config/constants';
import { resolveColorToken, getTerrainBaseColor } from '@/app/theme/colors';
import type { TileSet, Tile, TerrainBrushCharacter } from '@/features/realm/types';
import { InfoPopup } from '../ui/InfoPopup';
import { useInfoPopup } from '@/shared/hooks/useInfoPopup';
import { TerrainColorSwatch } from '../ui/TerrainColorSwatch';

const describeTerrain = (terrain: Tile): string =>
  terrain.description ?? 'Custom terrain created by the user. Add details in settings.';

const buildSpraySummary = (terrain: Tile): string =>
  terrain.sprayIcons?.length
    ? `Signature icons: ${terrain.sprayIcons.map((icon) => icon.replace(/-/g, ' ')).join(', ')}`
    : 'No spray icons configured yet.';

const formatCharacterLabel = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

const BRUSH_CHARACTER_OPTIONS: { value: TerrainBrushCharacter; label: string }[] = [
  { value: 'preserve', label: 'Preserve existing' },
  { value: 'none', label: 'No character' },
  ...TILE_CHARACTERS.map((value) => ({
    value,
    label: formatCharacterLabel(value),
  })),
];

/**
 * Props for the TerrainPainterSidebar component.
 */
interface TerrainPainterSidebarProps {
  paintTerrain: string;
  paintCharacter: TerrainBrushCharacter;
  setPaintTerrain: (terrain: string) => void;
  setPaintCharacter: (character: TerrainBrushCharacter) => void;
  onClose: () => void;
  tileSets: TileSet;
  terrainColors: Record<string, string>;
  onUpdateTerrainColor: (id: string, color: string) => void;
  onResetTerrainColor: (id: string) => void;
  onUpdateTerrainIcon: (id: string, iconDataUrl: string) => void;
  onStartPicking: () => void;
  isPickingTile: boolean;
  onOpenSpraySettings: (id: string) => void;
  isIconSprayEnabled: boolean;
}

/**
 * The sidebar component for the terrain painting tool.
 */
export function TerrainPainterSidebar({
  paintTerrain,
  paintCharacter,
  setPaintTerrain,
  setPaintCharacter,
  onClose,
  tileSets,
  terrainColors,
  onUpdateTerrainColor,
  onResetTerrainColor,
  onUpdateTerrainIcon,
  onStartPicking,
  isPickingTile,
  onOpenSpraySettings,
  isIconSprayEnabled,
}: TerrainPainterSidebarProps) {
  const { activeInfo, handleInfoClick, scheduleHoverOpen, scheduleHoverClose, closeInfo } =
    useInfoPopup();
  const iconInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const handleIconButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, terrainId: string) => {
      event.stopPropagation();
      const input = iconInputsRef.current[terrainId];
      input?.click();
    },
    []
  );

  const handleIconInputChange = useCallback(
    (terrainId: string, event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateTerrainIcon(terrainId, reader.result);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    [onUpdateTerrainIcon]
  );

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

  return (
    <aside
      className="w-80 bg-realm-canvas-backdrop border-l border-border-panel-divider p-4 flex flex-col"
      data-tour-id="sidebar-terrain"
    >
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
        <div className="mb-4">
          <label
            htmlFor="terrain-brush-character"
            className="block text-sm font-medium text-text-muted mb-1"
          >
            Brush Character
          </label>
          <select
            id="terrain-brush-character"
            value={paintCharacter}
            onChange={(event) => setPaintCharacter(event.target.value as TerrainBrushCharacter)}
            className="w-full p-2 bg-realm-command-panel-surface border border-border-panel-divider rounded-md focus:outline-none focus:ring-2 focus:ring-actions-command-primary text-sm"
          >
            {BRUSH_CHARACTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
            const isCustomColor =
              isDefault && defaultColor ? defaultColor !== resolvedColor : false;
            const isInfoOpen = activeInfo?.id === terrain.id;
            const infoDescription = describeTerrain(terrain);
            const spraySummary = buildSpraySummary(terrain);
            const defaultIcon = DEFAULT_TERRAIN_ICONS[terrain.id];
            const terrainIconSrc = terrain.terrainIcon ?? defaultIcon ?? '';
            const hasCustomIcon =
              Boolean(terrain.terrainIcon) && terrain.terrainIcon !== defaultIcon;

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
                  <button
                    type="button"
                    onClick={(event) => handleIconButtonClick(event, terrain.id)}
                    className={`group relative flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border transition-colors ${
                      isSelected ? 'border-actions-command-primary' : 'border-border-panel-divider'
                    } ${hasCustomIcon ? 'ring-1 ring-actions-command-primary/60' : ''} bg-white hover:border-actions-command-primary`}
                    title={`Upload icon for ${terrain.label}`}
                    aria-label={`Upload icon for ${terrain.label}`}
                  >
                    {terrainIconSrc ? (
                      <img
                        src={terrainIconSrc}
                        alt={`${terrain.label} terrain icon`}
                        className="h-full w-full object-contain pointer-events-none"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                        Upload
                      </span>
                    )}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                      <Icon name="upload" className="w-4 h-4 text-white" />
                    </div>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    ref={(element) => {
                      if (element) {
                        iconInputsRef.current[terrain.id] = element;
                      } else {
                        delete iconInputsRef.current[terrain.id];
                      }
                    }}
                    onChange={(event) => handleIconInputChange(terrain.id, event)}
                  />
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
                        onMouseEnter={() => {
                          scheduleHoverOpen(terrain.id, activeInfo.anchor);
                        }}
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
                        <div
                          className="mt-1 h-2 rounded-full"
                          style={{ backgroundColor: resolvedColor }}
                        />
                        <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
                          {spraySummary}
                        </p>
                      </InfoPopup>
                    )}
                  </div>
                </div>

                {isIconSprayEnabled ? (
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
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
