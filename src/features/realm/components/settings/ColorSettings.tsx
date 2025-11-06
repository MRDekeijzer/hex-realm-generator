import React, { useMemo } from 'react';
import type { TileSet, ViewOptions } from '@/features/realm/types';
import {
  DEFAULT_GRID_COLOR,
  DEFAULT_GRID_WIDTH,
  DEFAULT_POI_BACKDROP_COLOR,
  DEFAULT_POI_ICON_COLOR,
  DEFAULT_MYTH_MARKER_FILL_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_WIDTH,
  DEFAULT_SEAT_OF_POWER_ICON_COLOR,
  DEFAULT_SEAT_OF_POWER_BACKDROP_COLOR,
  BARRIER_COLOR,
  TERRAIN_BASE_COLORS,
} from '@/features/realm/config/constants';
import { SettingsSection } from '../ui/SettingsSection';
import { TerrainColorSwatch } from '../ui/TerrainColorSwatch';
import { SettingSlider } from '../ui/SettingSlider';

const rgbaToHexOpacity = (rgba: string): { hex: string; opacity: number } => {
  if (rgba.startsWith('#')) return { hex: rgba, opacity: 1 };
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgba);
  if (!match) return { hex: '#eaebec', opacity: 0.2 };
  const toHex = (c: number) => `0${c.toString(16)}`.slice(-2);
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
  mythMarkerFillColor: string;
  mythMarkerBorderColor: string;
  mythMarkerBorderWidth: number;
  onUpdateMythMarkerFillColor: (color: string) => void;
  onResetMythMarkerFillColor: () => void;
  onUpdateMythMarkerBorderColor: (color: string) => void;
  onResetMythMarkerBorderColor: () => void;
  onUpdateMythMarkerBorderWidth: (width: number) => void;
  onResetMythMarkerBorderWidth: () => void;
  seatOfPowerIconColor: string;
  seatOfPowerBackdropColor: string;
  onUpdateSeatOfPowerIconColor: (color: string) => void;
  onResetSeatOfPowerIconColor: () => void;
  onUpdateSeatOfPowerBackdropColor: (color: string) => void;
  onResetSeatOfPowerBackdropColor: () => void;
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
  mythMarkerFillColor,
  mythMarkerBorderColor,
  mythMarkerBorderWidth,
  onUpdateMythMarkerFillColor,
  onResetMythMarkerFillColor,
  onUpdateMythMarkerBorderColor,
  onResetMythMarkerBorderColor,
  onUpdateMythMarkerBorderWidth,
  onResetMythMarkerBorderWidth,
  seatOfPowerIconColor,
  seatOfPowerBackdropColor,
  onUpdateSeatOfPowerIconColor,
  onResetSeatOfPowerIconColor,
  onUpdateSeatOfPowerBackdropColor,
  onResetSeatOfPowerBackdropColor,
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
  const resolvedBarrierColor = barrierColor?.toUpperCase?.() ?? '#000000';
  const defaultBarrierColor = BARRIER_COLOR?.toUpperCase?.() ?? '#000000';
  const resolvedMythMarkerFillColor = mythMarkerFillColor?.toUpperCase?.() ?? '#000000';
  const resolvedMythMarkerBorderColor = mythMarkerBorderColor?.toUpperCase?.() ?? '#000000';
  const defaultMythMarkerFillColor = DEFAULT_MYTH_MARKER_FILL_COLOR?.toUpperCase?.() ?? '#000000';
  const defaultMythMarkerBorderColor =
    DEFAULT_MYTH_MARKER_BORDER_COLOR?.toUpperCase?.() ?? '#000000';
  const defaultMythMarkerBorderWidth = DEFAULT_MYTH_MARKER_BORDER_WIDTH;
  const hasCustomMythMarkerBorderWidth =
    Math.abs(mythMarkerBorderWidth - defaultMythMarkerBorderWidth) > 0.0001;
  const handleResetMythMarkerBorderWidth = () => {
    if (hasCustomMythMarkerBorderWidth) {
      onResetMythMarkerBorderWidth();
    }
  };
  const resolvedSeatOfPowerIconColor = seatOfPowerIconColor?.toUpperCase?.() ?? '#000000';
  const resolvedSeatOfPowerBackdropColor = seatOfPowerBackdropColor?.toUpperCase?.() ?? '#000000';
  const defaultSeatOfPowerIconColor =
    DEFAULT_SEAT_OF_POWER_ICON_COLOR?.toUpperCase?.() ?? '#000000';
  const defaultSeatOfPowerBackdropColor =
    DEFAULT_SEAT_OF_POWER_BACKDROP_COLOR?.toUpperCase?.() ?? '#000000';

  const sortedTerrains = [...tileSets.terrain].sort((a, b) =>
    (a.label ?? a.id).localeCompare(b.label ?? b.id)
  );

  return (
    <div className="space-y-6 pb-8">
      <SettingsSection title="Grid & Overlay">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {/* Grid Color */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <TerrainColorSwatch
              color={gridHexColor}
              ariaLabel="Pick Grid color"
              tooltip="Pick Grid color"
              onChange={handleGridColorChange}
              onReset={handleResetGridColor}
              canReset={isCustomGridColor}
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">Grid Color</span>
              <span className="text-xs font-mono text-text-muted">{gridHexColor}</span>
            </div>
          </div>
          {/* Grid Opacity */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <div className="flex flex-col w-full">
              <SettingSlider
                label="Grid Opacity"
                value={gridOpacity}
                onChange={handleGridOpacityChange}
                min={0}
                max={1}
                step={0.01}
                displayMultiplier={100}
                displaySuffix="%"
                tooltip="Sets the opacity of the grid."
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Points of Interest & Barriers">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* POI Icon Color */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
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
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">POI Icon Color</span>
              <span className="text-xs font-mono text-text-muted">{resolvedPoiIconColor}</span>
            </div>
          </div>
          {/* POI Backdrop Color */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
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
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">
                POI Backdrop Color
              </span>
              <span className="text-xs font-mono text-text-muted">{resolvedPoiBackdropColor}</span>
            </div>
          </div>
          {/* Barrier Color */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <TerrainColorSwatch
              color={resolvedBarrierColor}
              ariaLabel="Pick barrier color"
              tooltip="Pick barrier color"
              onChange={onUpdateBarrierColor}
              onReset={onResetBarrierColor}
              canReset={resolvedBarrierColor !== defaultBarrierColor}
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">Barrier Color</span>
              <span className="text-xs font-mono text-text-muted">{resolvedBarrierColor}</span>
            </div>
          </div>
          {/* Seat of Power Icon */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <TerrainColorSwatch
              color={resolvedSeatOfPowerIconColor}
              ariaLabel="Pick seat of power icon color"
              tooltip="Pick seat of power icon color"
              onChange={onUpdateSeatOfPowerIconColor}
              onReset={onResetSeatOfPowerIconColor}
              canReset={resolvedSeatOfPowerIconColor !== defaultSeatOfPowerIconColor}
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">
                Seat of Power Icon
              </span>
              <span className="text-xs font-mono text-text-muted">
                {resolvedSeatOfPowerIconColor}
              </span>
            </div>
          </div>
          {/* Seat of Power Backdrop */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <TerrainColorSwatch
              color={resolvedSeatOfPowerBackdropColor}
              ariaLabel="Pick seat of power backdrop color"
              tooltip="Pick seat of power backdrop color"
              onChange={onUpdateSeatOfPowerBackdropColor}
              onReset={onResetSeatOfPowerBackdropColor}
              canReset={resolvedSeatOfPowerBackdropColor !== defaultSeatOfPowerBackdropColor}
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">
                Seat of Power Backdrop
              </span>
              <span className="text-xs font-mono text-text-muted">
                {resolvedSeatOfPowerBackdropColor}
              </span>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Myth Markers">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Marker Fill Color */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <TerrainColorSwatch
              color={resolvedMythMarkerFillColor}
              ariaLabel="Pick myth marker fill color"
              tooltip="Pick myth marker fill color"
              onChange={onUpdateMythMarkerFillColor}
              onReset={onResetMythMarkerFillColor}
              canReset={resolvedMythMarkerFillColor !== defaultMythMarkerFillColor}
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">
                Marker Fill Color
              </span>
              <span className="text-xs font-mono text-text-muted">
                {resolvedMythMarkerFillColor}
              </span>
            </div>
          </div>
          {/* Marker Border Color */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <TerrainColorSwatch
              color={resolvedMythMarkerBorderColor}
              ariaLabel="Pick myth marker border color"
              tooltip="Pick myth marker border color"
              onChange={onUpdateMythMarkerBorderColor}
              onReset={onResetMythMarkerBorderColor}
              canReset={resolvedMythMarkerBorderColor !== defaultMythMarkerBorderColor}
              className="w-12 h-12 rounded-md flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-high-contrast">
                Marker Border Color
              </span>
              <span className="text-xs font-mono text-text-muted">
                {resolvedMythMarkerBorderColor}
              </span>
            </div>
          </div>
          {/* Marker Border Width */}
          <div className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16">
            <div className="flex flex-col w-full">
              <SettingSlider
                label="Border Width"
                value={mythMarkerBorderWidth}
                onChange={(v) => onUpdateMythMarkerBorderWidth(v)}
                min={0}
                max={8}
                step={0.25}
                displayMultiplier={1}
                displaySuffix="px"
                round={false}
                tooltip="Sets the width of the myth marker outline."
              />
            </div>
            {hasCustomMythMarkerBorderWidth ? (
              <button
                type="button"
                onClick={handleResetMythMarkerBorderWidth}
                className="px-2 py-1 text-xs font-medium text-actions-command-primary border border-actions-command-primary/60 rounded-md hover:bg-actions-command-primary/10 transition-colors"
              >
                Reset
              </button>
            ) : null}
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
            const canReset = normalizedBaseColor !== null && currentColor !== normalizedBaseColor;
            return (
              <div
                key={terrainId}
                className="flex items-center gap-3 rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 p-3 h-16"
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
