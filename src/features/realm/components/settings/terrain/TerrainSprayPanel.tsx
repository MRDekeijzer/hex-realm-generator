import React from 'react';
import type { SprayDeploymentMode, SpraySettings, Tile } from '@/features/realm/types';
import type { InfoPopupState } from '@/shared/hooks/useInfoPopup';
import { Icon } from '../../Icon';
import { InfoPopup } from '../../ui/InfoPopup';
import { HexSprayPreview } from './HexSprayPreview';
import { IconGridSelector } from './IconGridSelector';
import { PlacementMaskEditor } from './PlacementMaskEditor';
import { SettingSlider } from '../../ui/SettingSlider';
import { TerrainColorSwatch } from '../../ui/TerrainColorSwatch';

interface TerrainSprayPanelProps {
  terrain: Tile;
  settings: SpraySettings;
  resolvedTerrainColor: string;
  resolvedSprayColor: string;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  activeInfo: InfoPopupState | null;
  registerDetailsRef: (element: HTMLDetailsElement | null) => void;
  onInfoClick: (anchor: HTMLElement) => void;
  onInfoHoverStart: (anchor: HTMLElement) => void;
  onInfoHoverEnd: () => void;
  onCloseInfo: () => void;
  onToggleIcon: (iconName: string) => void;
  onSettingChange: (settingKey: keyof SpraySettings, value: any) => void;
}

const getSpraySummary = (terrain: Tile): string =>
  terrain.sprayIcons?.length
    ? `Signature icons: ${terrain.sprayIcons.map((icon) => icon.replace(/-/g, ' ')).join(', ')}`
    : 'No spray icons configured yet.';

export const TerrainSprayPanel: React.FC<TerrainSprayPanelProps> = ({
  terrain,
  settings,
  resolvedTerrainColor,
  resolvedSprayColor,
  hasUnsavedChanges,
  onSave,
  activeInfo,
  registerDetailsRef,
  onInfoClick,
  onInfoHoverStart,
  onInfoHoverEnd,
  onCloseInfo,
  onToggleIcon,
  onSettingChange,
}) => {
  const isInfoActive = activeInfo?.id === terrain.id;
  const infoAnchor = isInfoActive ? (activeInfo?.anchor ?? null) : null;
  const infoLocked = isInfoActive ? (activeInfo?.locked ?? false) : false;
  const spraySummary = getSpraySummary(terrain);
  const infoDescription =
    terrain.description ?? 'Custom terrain created by the user. Add details in settings.';
  const isGridMode = settings.mode === 'grid';
  const modeButtonClass = (mode: SprayDeploymentMode) =>
    `flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
      settings.mode === mode
        ? 'border-transparent bg-actions-command-primary text-text-high-contrast shadow-sm'
        : 'border-border-panel-divider text-text-muted hover:text-text-high-contrast hover:border-actions-command-primary/40'
    }`;
  const handleModeChange = (mode: SprayDeploymentMode) => {
    if (settings.mode !== mode) {
      onSettingChange('mode', mode);
    }
  };
  const handleReroll = () => {
    let nextSeed = Math.floor(Math.random() * 0xffffffff);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      nextSeed = buffer[0] ?? nextSeed;
    }
    onSettingChange('seedOffset', nextSeed);
  };
  const baseOpacityPercent = Math.round(((settings.opacityMin + settings.opacityMax) / 2) * 100);
  const opacityVariancePercent = Math.round(
    ((settings.opacityMax - settings.opacityMin) / 2) * 100
  );

  const updateOpacity = (basePercent: number, variancePercent: number) => {
    const clampedBase = Math.max(0, Math.min(100, basePercent));
    const maxAllowedVariance = Math.min(clampedBase, 100 - clampedBase);
    const clampedVariance = Math.max(0, Math.min(maxAllowedVariance, variancePercent));
    const base = clampedBase / 100;
    const variance = clampedVariance / 100;
    const newMin = Math.max(0, base - variance);
    const newMax = Math.min(1, base + variance);
    onSettingChange('opacityMin', parseFloat(newMin.toFixed(4)));
    onSettingChange('opacityMax', parseFloat(newMax.toFixed(4)));
  };

  const handleBaseOpacityChange = (value: number) => {
    updateOpacity(value, opacityVariancePercent);
  };

  const handleOpacityVarianceChange = (value: number) => {
    updateOpacity(baseOpacityPercent, value);
  };

  return (
    <details
      ref={registerDetailsRef}
      className="p-3 bg-realm-canvas-backdrop rounded-md border border-border-panel-divider/50 open:border-actions-command-primary/50 transition-colors group/details"
    >
      <summary className="font-semibold text-md text-text-muted list-none cursor-pointer flex items-center gap-2 hover:text-text-high-contrast">
        <Icon name={terrain.icon} className="w-5 h-5" />
        <span className="flex items-center gap-2">
          {terrain.label}
          {hasUnsavedChanges ? (
            <span className="text-[10px] uppercase tracking-wide bg-actions-command-primary/20 text-actions-command-primary border border-actions-command-primary/40 rounded-sm px-2 py-0.5">
              Unsaved
            </span>
          ) : null}
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onInfoClick(event.currentTarget as HTMLElement);
            }}
            onMouseEnter={(event) => {
              onInfoHoverStart(event.currentTarget as HTMLElement);
            }}
            onMouseLeave={(event) => {
              const nextTarget = event.relatedTarget as Node | null;
              if (nextTarget && event.currentTarget.contains(nextTarget)) {
                return;
              }
              onInfoHoverEnd();
            }}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
              isInfoActive
                ? 'bg-realm-map-viewport text-text-high-contrast'
                : 'text-text-subtle hover:text-text-muted hover:bg-realm-map-viewport'
            }`}
            title={`Learn more about ${terrain.label}`}
            aria-label={`Terrain information for ${terrain.label}`}
            aria-expanded={isInfoActive}
            aria-haspopup="dialog"
            type="button"
          >
            <Icon name="info" className="w-3.5 h-3.5" />
          </button>
        </span>
        <Icon
          name="chevron-down"
          className="w-4 h-4 ml-auto transition-transform duration-200 group-open/details:rotate-180"
        />
      </summary>
      {isInfoActive && infoAnchor && (
        <InfoPopup
          anchor={infoAnchor}
          onClose={onCloseInfo}
          onMouseEnter={() => onInfoHoverStart(infoAnchor)}
          onMouseLeave={() => {
            if (infoLocked) {
              return;
            }
            onInfoHoverEnd();
          }}
        >
          <p className="text-xs leading-relaxed text-text-muted">{infoDescription}</p>
          <div className="mt-2 flex items-center justify-between text-text-subtle text-[11px] uppercase tracking-wide">
            <span>Palette Swatch</span>
            <span>{resolvedTerrainColor}</span>
          </div>
          <div
            className="mt-1 h-2 rounded-full"
            style={{ backgroundColor: terrain.color || resolvedTerrainColor }}
          />
          <p className="mt-2 text-[11px] text-text-muted leading-relaxed">{spraySummary}</p>
        </InfoPopup>
      )}
      <div className="pl-7 mt-3 pt-3 border-t border-border-panel-divider/50">
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              hasUnsavedChanges
                ? 'bg-actions-command-primary text-text-high-contrast hover:bg-actions-command-primary/90'
                : 'bg-realm-command-panel-hover text-text-subtle cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 auto-rows-min">
          <div className="md:col-span-2">
            <HexSprayPreview terrain={terrain} onReroll={handleReroll} />
          </div>
          <div className="md:col-span-2">
            <IconGridSelector
              selectedIcons={terrain.sprayIcons || []}
              onToggleIcon={onToggleIcon}
            />
          </div>
          <div className="md:col-span-2">
            <p className="block text-sm font-medium text-text-muted mb-2">Deployment Mode</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={modeButtonClass('random')}
                onClick={() => handleModeChange('random')}
                aria-pressed={settings.mode === 'random'}
              >
                Random
              </button>
              <button
                type="button"
                className={modeButtonClass('grid')}
                onClick={() => handleModeChange('grid')}
                aria-pressed={settings.mode === 'grid'}
              >
                Grid
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              {isGridMode ? (
                <>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Grid Density"
                      tooltip="Controls how many grid points per side receive an icon."
                      value={settings.gridDensity}
                      onChange={(value) => onSettingChange('gridDensity', Math.round(value))}
                      min={1}
                      max={12}
                      step={1}
                      displayMultiplier={1}
                      displaySuffix=" cells"
                    />
                  </div>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Grid Size"
                      tooltip="Scales the grid span relative to the hex radius."
                      value={settings.gridSize}
                      onChange={(value) => onSettingChange('gridSize', value)}
                      min={0.2}
                      max={1}
                      step={0.05}
                    />
                  </div>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Grid Jitter"
                      tooltip="Adds a small random offset inside each grid cell to keep placements organic."
                      value={settings.gridJitter}
                      onChange={(value) => onSettingChange('gridJitter', value)}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Grid Rotation"
                      tooltip="Rotates the entire grid layout around the hex center."
                      value={settings.gridBaseRotation ?? 0}
                      onChange={(value) => onSettingChange('gridBaseRotation', value)}
                      min={-180}
                      max={180}
                      step={1}
                      displayMultiplier={1}
                      displaySuffix="°"
                    />
                  </div>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Rotation Variance"
                      tooltip="Defines how much each grid icon can randomly rotate around its base orientation."
                      value={settings.gridRotationRange}
                      onChange={(value) => onSettingChange('gridRotationRange', value)}
                      min={0}
                      max={180}
                      step={1}
                      displayMultiplier={1}
                      displaySuffix="°"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Density"
                      value={settings.density}
                      onChange={(value) => onSettingChange('density', value)}
                      min={0}
                      max={128}
                      step={1}
                      displayMultiplier={1}
                      displaySuffix=" icons"
                    />
                  </div>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Center Bias"
                      tooltip="Higher values pull random placements toward the center of the hex."
                      value={settings.centerBias}
                      onChange={(value) => onSettingChange('centerBias', value)}
                      min={0}
                      max={1}
                      step={0.05}
                    />
                  </div>
                  <div className="col-span-1">
                    <SettingSlider
                      label="Min Separation"
                      tooltip="Prevents new icons from spawning within this many pixels of another icon."
                      value={settings.minSeparation}
                      onChange={(value) => onSettingChange('minSeparation', value)}
                      min={0}
                      max={60}
                      step={1}
                      displayMultiplier={1}
                      displaySuffix="px"
                    />
                  </div>
                </>
              )}

              <div className="col-span-1">
                <SettingSlider
                  label="Base Size"
                  tooltip="Sets the central size for sprayed icons."
                  value={Math.max(10, settings.sizeMin)}
                  onChange={(value) => {
                    const clampedValue = Math.max(10, value);
                    onSettingChange('sizeMin', clampedValue);
                    onSettingChange('sizeMax', clampedValue);
                  }}
                  min={10}
                  max={64}
                  step={1}
                  displayMultiplier={1}
                  displaySuffix=" px"
                />
              </div>
              <div className="col-span-1">
                <SettingSlider
                  label="Scale Variance"
                  tooltip="Controls how much icon sizes vary around the base size."
                  value={settings.scaleVariance}
                  onChange={(value) => onSettingChange('scaleVariance', value)}
                  min={0}
                  max={1}
                  step={0.05}
                  displayMultiplier={100}
                  displaySuffix="%"
                />
              </div>
              <div className="col-span-1">
                <SettingSlider
                  label="Icon Rotation"
                  tooltip="Applies a consistent rotation to every sprayed icon."
                  value={settings.iconBaseRotation ?? 0}
                  onChange={(value) => onSettingChange('iconBaseRotation', value)}
                  min={-180}
                  max={180}
                  step={1}
                  displayMultiplier={1}
                  displaySuffix="°"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-text-muted mb-1">Icon Color</label>
                <div className="flex items-center gap-2">
                  <TerrainColorSwatch
                    color={resolvedSprayColor}
                    ariaLabel={`Select icon color for ${terrain.label}`}
                    tooltip="Edit color"
                    onChange={(value) => onSettingChange('color', value)}
                    className="w-10 h-10 rounded-md flex-shrink-0 border border-black/20"
                    iconClassName="w-5 h-5 text-white"
                  />
                  <span className="p-2 bg-realm-command-panel-surface rounded-md text-sm font-mono flex-grow text-center h-10 flex items-center justify-center">
                    {resolvedSprayColor}
                  </span>
                </div>
              </div>

              <div className="col-span-1">
                <SettingSlider
                  label="Base Opacity"
                  tooltip="Sets the core opacity for sprayed icons."
                  value={baseOpacityPercent}
                  onChange={handleBaseOpacityChange}
                  min={0}
                  max={100}
                  step={1}
                  displayMultiplier={1}
                  displaySuffix="%"
                />
              </div>

              <div className="col-span-1">
                <SettingSlider
                  label="Opacity Variance"
                  tooltip="Adds variation by increasing and decreasing opacity around the base value."
                  value={opacityVariancePercent}
                  onChange={handleOpacityVarianceChange}
                  min={0}
                  max={100}
                  step={1}
                  displayMultiplier={1}
                  displaySuffix="%"
                />
              </div>

              <div className="col-span-1 md:col-span-1">
                <PlacementMaskEditor
                  mask={settings.placementMask}
                  onUpdateMask={(mask) => onSettingChange('placementMask', mask)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
};
