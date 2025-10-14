import React from 'react';
import type { SprayDeploymentMode, SpraySettings, Tile } from '@/features/realm/types';
import type { InfoPopupState } from '@/shared/hooks/useInfoPopup';
import { Icon } from '../../Icon';
import { InfoPopup } from '../../ui/InfoPopup';
import { HexSprayPreview } from './HexSprayPreview';
import { IconGridSelector } from './IconGridSelector';
import { PlacementMaskEditor } from './PlacementMaskEditor';
import { RangeSlider } from './RangeSlider';
import { SettingSlider } from '../../ui/SettingSlider';
import { TerrainColorSwatch } from '../../ui/TerrainColorSwatch';

interface TerrainSprayPanelProps {
  terrain: Tile;
  settings: SpraySettings;
  resolvedTerrainColor: string;
  resolvedSprayColor: string;
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
  const infoAnchor = isInfoActive ? activeInfo?.anchor ?? null : null;
  const infoLocked = isInfoActive ? activeInfo?.locked ?? false : false;
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

  return (
    <details
      ref={registerDetailsRef}
      className="p-3 bg-realm-canvas-backdrop rounded-md border border-border-panel-divider/50 open:border-actions-command-primary/50 transition-colors group/details"
    >
      <summary className="font-semibold text-md text-text-muted list-none cursor-pointer flex items-center gap-2 hover:text-text-high-contrast">
        <Icon name={terrain.icon} className="w-5 h-5" />
        <span className="flex items-center gap-2">
          {terrain.label}
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
        <div className="grid gap-4 md:grid-cols-2 auto-rows-min">
          <div className="md:col-span-2">
            <HexSprayPreview terrain={terrain} />
          </div>
          <div className="md:col-span-2">
            <IconGridSelector selectedIcons={terrain.sprayIcons || []} onToggleIcon={onToggleIcon} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-2">Deployment Mode</label>
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
                      label="Rotation Range"
                      tooltip="Defines the maximum random rotation applied to grid icons."
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
                  value={settings.sizeMin}
                  onChange={(value) => {
                    onSettingChange('sizeMin', value);
                    onSettingChange('sizeMax', value);
                  }}
                  min={2}
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
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Opacity Range ({Math.round(settings.opacityMin * 100)}% -{' '}
                  {Math.round(settings.opacityMax * 100)}%)
                </label>
                <RangeSlider
                  min={0.1}
                  max={1.0}
                  step={0.01}
                  valueMin={settings.opacityMin}
                  valueMax={settings.opacityMax}
                  ariaLabelMin="Minimum opacity"
                  ariaLabelMax="Maximum opacity"
                  onChange={(min, max) => {
                    onSettingChange('opacityMin', min);
                    onSettingChange('opacityMax', max);
                  }}
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
