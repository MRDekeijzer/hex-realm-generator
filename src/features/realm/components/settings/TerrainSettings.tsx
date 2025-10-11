/**
 * @file Component for the "Terrain" tab in the main settings modal.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import type { TileSet, SpraySettings, Tile } from '@/features/realm/types';
import { DEFAULT_SPRAY_SETTINGS } from '@/features/realm/config/constants';
import { resolveColorToken } from '@/app/theme/colors';
import { SettingsSection } from '../ui/SettingsSection';
import { SettingSlider } from '../ui/SettingSlider';
import { Icon } from '../Icon';
import { InfoPopup } from '../ui/InfoPopup';
import { HexSprayPreview } from './terrain/HexSprayPreview';
import { IconGridSelector } from './terrain/IconGridSelector';
import { PlacementMaskEditor } from './terrain/PlacementMaskEditor';
import { RangeSlider } from './terrain/RangeSlider';
import { useInfoPopup } from '@/shared/hooks/useInfoPopup';

// =================================================================================
// --- Sub-component: IconGridSelector ---
// =================================================================================
// =================================================================================
// --- Sub-component: PlacementMaskEditor ---
// =================================================================================
// =================================================================================
// --- Sub-component: HexSprayPreview ---
// =================================================================================
// =================================================================================
// --- Sub-component: RangeSlider ---
// =================================================================================
/**
 * Props for the TerrainSettings component.
 */
interface TerrainSettingsProps {
  tileSets: TileSet;
  setTileSets: React.Dispatch<React.SetStateAction<TileSet>>;
  focusId: string | null;
}

/**
 * A component that renders settings for customizing terrain appearance,
 * including the procedural Icon Spray feature.
 */
export const TerrainSettings = ({ tileSets, setTileSets, focusId }: TerrainSettingsProps) => {
  const colorInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const detailsRefs = useRef<Map<string, HTMLDetailsElement | null>>(new Map());
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
    if (focusId) {
      const element = detailsRefs.current.get(focusId);
      if (element) {
        // Use a short timeout to ensure the DOM is ready after the tab switch
        setTimeout(() => {
          element.open = true;
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [focusId]);

  useEffect(() => {
    if (!activeInfo) {
      return;
    }
    const terrainStillExists = tileSets.terrain.some((terrain) => terrain.id === activeInfo.id);
    if (!terrainStillExists) {
      closeInfo();
    }
  }, [activeInfo, closeInfo, tileSets.terrain]);

  const handleSettingChange = (terrainId: string, settingKey: keyof SpraySettings, value: any) => {
    setTileSets((prev) => ({
      ...prev,
      terrain: prev.terrain.map((t) =>
        t.id === terrainId
          ? {
              ...t,
              spraySettings: {
                ...(t.spraySettings || DEFAULT_SPRAY_SETTINGS),
                [settingKey]: value,
              },
            }
          : t
      ),
    }));
  };

  const handleToggleSprayIcon = (terrainId: string, iconName: string) => {
    setTileSets((prev) => ({
      ...prev,
      terrain: prev.terrain.map((t) => {
        if (t.id === terrainId) {
          const currentIcons = t.sprayIcons || [];
          const newIcons = currentIcons.includes(iconName)
            ? currentIcons.filter((i) => i !== iconName)
            : [...currentIcons, iconName];
          return { ...t, sprayIcons: newIcons };
        }
        return t;
      }),
    }));
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Terrain Icon Spray">
        <p className="text-xs text-text-muted !mt-0">
          Configure the small, semi-transparent icons that are procedurally scattered on each
          terrain type to add visual texture.
        </p>
        <div className="space-y-4">
          {tileSets.terrain.map((terrain) => {
            const settings = terrain.spraySettings || DEFAULT_SPRAY_SETTINGS;
            const resolvedTerrainColor = resolveColor(terrain.color);
            const resolvedSprayColor = resolveColor(settings.color);
            return (
              <details
                ref={(el) => {
                  detailsRefs.current.set(terrain.id, el);
                }}
                key={terrain.id}
                className="p-3 bg-realm-canvas-backdrop rounded-md border border-border-panel-divider/50 open:border-actions-command-primary/50 transition-colors group/details"
              >
                <summary className="font-semibold text-md text-text-muted list-none cursor-pointer flex items-center gap-2 hover:text-text-high-contrast">
                  <Icon name={terrain.icon} className="w-5 h-5" />
                  <span className="flex items-center gap-2">
                    {terrain.label}
                    <button
                      onClick={(event) => {
                        cancelOpenTimeout();
                        cancelCloseTimeout();
                        event.preventDefault();
                        event.stopPropagation();
                        handleInfoClick(terrain.id, event.currentTarget as HTMLElement);
                      }}
                      onMouseEnter={(event) => {
                        scheduleHoverOpen(terrain.id, event.currentTarget as HTMLElement);
                      }}
                      onMouseLeave={(event) => {
                        const nextTarget = event.relatedTarget as Node | null;
                        if (nextTarget && event.currentTarget.contains(nextTarget)) {
                          return;
                        }
                        scheduleHoverClose(terrain.id);
                      }}
                      className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                        activeInfo?.id === terrain.id
                          ? 'bg-realm-map-viewport text-text-high-contrast'
                          : 'text-text-subtle hover:text-text-muted hover:bg-realm-map-viewport'
                      }`}
                      title={`Learn more about ${terrain.label}`}
                      aria-label={`Terrain information for ${terrain.label}`}
                      aria-expanded={activeInfo?.id === terrain.id}
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
                {activeInfo?.id === terrain.id && activeInfo.anchor && (
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
                    <p className="text-xs leading-relaxed text-text-muted">
                      {terrain.description ??
                        'Custom terrain created by the user. Add details in settings.'}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-text-subtle text-[11px] uppercase tracking-wide">
                      <span>Palette Swatch</span>
                      <span>{resolvedTerrainColor}</span>
                    </div>
                    <div
                      className="mt-1 h-2 rounded-full"
                      style={{ backgroundColor: terrain.color || resolvedTerrainColor }}
                    />
                    <p className="mt-2 text-[11px] text-text-muted leading-relaxed">
                      {terrain.sprayIcons?.length
                        ? `Signature icons: ${terrain.sprayIcons
                            .map((icon) => icon.replace(/-/g, ' '))
                            .join(', ')}`
                        : 'No spray icons configured yet.'}
                    </p>
                  </InfoPopup>
                )}
                <div className="pl-7 mt-3 pt-3 border-t border-border-panel-divider/50 space-y-4">
                  <HexSprayPreview terrain={terrain} />
                  <IconGridSelector
                    selectedIcons={terrain.sprayIcons || []}
                    onToggleIcon={(icon) => handleToggleSprayIcon(terrain.id, icon)}
                  />
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <SettingSlider
                      label="Density"
                      value={settings.density}
                      onChange={(v) => handleSettingChange(terrain.id, 'density', v)}
                      min={0}
                      max={128}
                      step={1}
                      displayMultiplier={1}
                      displaySuffix=" icons"
                    />
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => colorInputRefs.current[terrain.id]?.click()}
                          className="w-10 h-10 rounded-md flex-shrink-0 border border-black/20 relative group/pipette"
                          style={{ backgroundColor: settings.color }}
                          title="Edit color"
                        >
                          <input
                            ref={(el) => {
                              if (el) colorInputRefs.current[terrain.id] = el;
                            }}
                            type="color"
                            value={settings.color}
                            onChange={(e) =>
                              handleSettingChange(terrain.id, 'color', e.target.value)
                            }
                            className="opacity-0 w-0 h-0 absolute pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/pipette:opacity-100 transition-opacity flex items-center justify-center">
                            <Icon name="pipette" className="w-5 h-5 text-white" />
                          </div>
                        </button>
                        <span className="p-2 bg-realm-command-panel-surface rounded-md text-sm font-mono flex-grow text-center h-10 flex items-center justify-center">
                          {resolvedSprayColor}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-text-muted mb-1">
                        Size Range ({settings.sizeMin}px - {settings.sizeMax}px)
                      </label>
                      <RangeSlider
                        min={0}
                        max={100}
                        valueMin={settings.sizeMin}
                        valueMax={settings.sizeMax}
                        onChange={(min, max) => {
                          handleSettingChange(terrain.id, 'sizeMin', min);
                          handleSettingChange(terrain.id, 'sizeMax', max);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
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
                        onChange={(min, max) => {
                          handleSettingChange(terrain.id, 'opacityMin', min);
                          handleSettingChange(terrain.id, 'opacityMax', max);
                        }}
                      />
                    </div>

                    <PlacementMaskEditor
                      mask={settings.placementMask}
                      onUpdateMask={(mask) =>
                        handleSettingChange(terrain.id, 'placementMask', mask)
                      }
                    />
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
};
