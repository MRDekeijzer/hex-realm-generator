import React, { useMemo, useRef } from 'react';
import type { TileSet, ViewOptions } from '@/features/realm/types';
import {
  DEFAULT_GRID_COLOR,
  DEFAULT_GRID_WIDTH,
  DEFAULT_POI_BACKDROP_COLOR,
  DEFAULT_POI_ICON_COLOR,
  BARRIER_COLOR,
  TERRAIN_BASE_COLORS,
} from '@/features/realm/config/constants';
import { SettingsSection } from '../ui/SettingsSection';
import { TerrainColorSwatch } from '../ui/TerrainColorSwatch';
import { Icon } from '../Icon';

const rgbaToHexOpacity = (rgba: string): { hex: string; opacity: number } => {
  if (rgba.startsWith('#')) return { hex: rgba, opacity: 1 };
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgba);
  if (!match) return { hex: '#eaebec', opacity: 0.2 };
  const toHex = (c: number) => (`0${c.toString(16)}`).slice(-2);
  const [, r, g, b, o] = match;
  if (r === undefined || g === undefined || b === undefined) {
    return { hex: '#eaebec', opacity: 0.2 };
  }
  return {
    hex: `#${toHex(parseInt(r, 10))}${toHex(parseInt(g, 10))}${toHex(parseInt(b, 10))}`,
    opacity: o !== undefined ? parseFloat(o) : 1,
  };
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const [, r, g, b] = result;
  if (r === undefined || g === undefined || b === undefined) return null;
  return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) };
};

export interface ColorSettingsHandlers {
  terrainColors: Record<string, string>;
  onUpdateTerrainColor: (terrainId: string, color: string) => void;
  onResetTerrainColor: (terrainId: string) => void;
  poiIconColor: string | null;
  poiBackdropColor: string | null;
  onUpdatePoiIconColor: (color: string) => void;
  onResetPoiIconColor: () => void;
  onUpdatePoiBackdropColor: (color: string) => void;
  onResetPoiBackdropColor: () => void;
  barrierColor: string;
  onUpdateBarrierColor: (color: string) => void;
  onResetBarrierColor: () => void;
}

interface ColorSettingsProps extends ColorSettingsHandlers {
  tileSets: TileSet;
  viewOptions: ViewOptions;
  setViewOptions: React.Dispatch<React.SetStateAction<ViewOptions>>;
}

export const ColorSettings: React.FC<ColorSettingsProps> = ({
  tileSets,
  terrainColors,
  onUpdateTerrainColor,
  onResetTerrainColor,
  viewOptions,
  setViewOptions,
  poiIconColor,
  poiBackdropColor,
  onUpdatePoiIconColor,
  onResetPoiIconColor,
  onUpdatePoiBackdropColor,
  onResetPoiBackdropColor,
  barrierColor,
  onUpdateBarrierColor,
  onResetBarrierColor,
}) => {
  const gridColorInputRef = useRef<HTMLInputElement>(null);
  const { hex: gridHexColor, opacity: gridOpacity } = useMemo(
    () => rgbaToHexOpacity(viewOptions.gridColor),
    [viewOptions.gridColor]
  );
  const isCustomGridColor = viewOptions.gridColor !== DEFAULT_GRID_COLOR;

  const handleGridColorChange = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    setViewOptions((prev) => ({
      ...prev,
      gridColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${gridOpacity})`,
    }));
  };

  const handleGridOpacityChange = (opacity: number) => {
    const rgb = hexToRgb(gridHexColor);
    if (!rgb) return;
    setViewOptions((prev) => ({
      ...prev,
      gridColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    }));
  };

  const handleResetGridColor = () => {
    setViewOptions((prev) => ({
      ...prev,
      gridColor: DEFAULT_GRID_COLOR,
      gridWidth: DEFAULT_GRID_WIDTH,
    }));
  };

  const resolvedPoiIconColor = (poiIconColor ?? DEFAULT_POI_ICON_COLOR).toUpperCase();
  const resolvedPoiBackdropColor = (poiBackdropColor ?? DEFAULT_POI_BACKDROP_COLOR).toUpperCase();
  const resolvedBarrierColor = barrierColor.toUpperCase();
  const defaultBarrierColor = BARRIER_COLOR.toUpperCase();

  const sortedTerrains = [...tileSets.terrain].sort((a, b) =>
    (a.label ?? a.id).localeCompare(b.label ?? b.id)
  );

  return (
    <div className="space-y-6 pb-8">
      <SettingsSection title="Grid & Overlay">
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-text-muted mb-1">Grid Color</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  isCustomGridColor
                    ? handleResetGridColor()
                    : gridColorInputRef.current?.click()
                }
                className="relative w-12 h-12 rounded-md border border-border-panel-divider flex-shrink-0 overflow-hidden group"
                style={{ backgroundColor: gridHexColor }}
                title={isCustomGridColor ? 'Reset to default' : 'Pick grid color'}
                aria-label={isCustomGridColor ? 'Reset grid color to default' : 'Pick grid color'}
              >
                <input
                  ref={gridColorInputRef}
                  type="color"
                  value={gridHexColor}
                  onChange={(event) => handleGridColorChange(event.target.value)}
                  className="opacity-0 w-0 h-0 absolute pointer-events-none"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Icon
                    name={isCustomGridColor ? 'reset' : 'pipette'}
                    className="w-5 h-5 text-white"
                    aria-hidden="true"
                  />
                </div>
              </button>
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-mono text-text-high-contrast">{gridHexColor.toUpperCase()}</span>
                <label className="flex items-center gap-2 text-text-muted">
                  <span>Opacity</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gridOpacity}
                    onChange={(event) => handleGridOpacityChange(parseFloat(event.target.value))}
                    className="w-36"
                  />
                  <span className="font-mono w-12 text-center">
                    {Math.round(gridOpacity * 100)}%
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Points of Interest & Barriers">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <span className="block text-sm font-medium text-text-muted">POI Icon Color</span>
            <TerrainColorSwatch
              color={resolvedPoiIconColor}
              ariaLabel="Pick POI icon color"
              tooltip="Pick POI icon color"
              onChange={onUpdatePoiIconColor}
              onReset={onResetPoiIconColor}
              canReset={
                poiIconColor !== null &&
                poiIconColor.toUpperCase() !== DEFAULT_POI_ICON_COLOR.toUpperCase()
              }
              className="w-full h-14 rounded-md"
            />
            <span className="block text-xs text-text-muted font-mono">
              {resolvedPoiIconColor}
            </span>
          </div>
          <div className="space-y-2">
            <span className="block text-sm font-medium text-text-muted">POI Backdrop Color</span>
            <TerrainColorSwatch
              color={resolvedPoiBackdropColor}
              ariaLabel="Pick POI backdrop color"
              tooltip="Pick POI backdrop color"
              onChange={onUpdatePoiBackdropColor}
              onReset={onResetPoiBackdropColor}
              canReset={
                poiBackdropColor !== null &&
                poiBackdropColor.toUpperCase() !== DEFAULT_POI_BACKDROP_COLOR.toUpperCase()
              }
              className="w-full h-14 rounded-md"
            />
            <span className="block text-xs text-text-muted font-mono">
              {resolvedPoiBackdropColor}
            </span>
          </div>
          <div className="space-y-2">
            <span className="block text-sm font-medium text-text-muted">Barrier Color</span>
            <TerrainColorSwatch
              color={resolvedBarrierColor}
              ariaLabel="Pick barrier color"
              tooltip="Pick barrier color"
              onChange={onUpdateBarrierColor}
              onReset={onResetBarrierColor}
              canReset={resolvedBarrierColor !== defaultBarrierColor}
              className="w-full h-14 rounded-md"
            />
            <span className="block text-xs text-text-muted font-mono">
              {resolvedBarrierColor}
            </span>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Terrain Palette">
        <p className="text-xs text-text-muted -mt-2">
          Customize the base color of each terrain. Reset a tile to return to the default palette.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTerrains.map((terrain) => {
            const terrainId = terrain.id;
            const terrainLabel = terrain.label ?? terrainId;
            const currentColor =
              terrainColors[terrainId]?.toUpperCase() ??
              terrain.color?.toUpperCase() ??
              TERRAIN_BASE_COLORS[terrainId]?.toUpperCase() ??
              '#888888';
            const baseColor = TERRAIN_BASE_COLORS[terrainId];
            const normalizedBaseColor =
              typeof baseColor === 'string' ? baseColor.toUpperCase() : null;
            const canReset =
              normalizedBaseColor !== null && currentColor !== normalizedBaseColor;
            return (
              <div
                key={terrainId}
                className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3"
              >
                <TerrainColorSwatch
                  color={currentColor}
                  ariaLabel={`Pick color for ${terrainLabel}`}
                  tooltip={`Pick color for ${terrainLabel}`}
                  onChange={(value) => onUpdateTerrainColor(terrainId, value)}
                  onReset={() => onResetTerrainColor(terrainId)}
                  canReset={!!canReset}
                  className="w-12 h-12 rounded-md flex-shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-text-high-contrast">
                    {terrainLabel}
                  </span>
                  <span className="text-xs font-mono text-text-muted">{currentColor}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
};


