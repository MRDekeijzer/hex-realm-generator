/**
 * @file Component for the "Terrain" tab in the main settings modal.
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { TileSet, SpraySettings, Tile, Point } from '@/features/realm/types';
import {
  SPRAYABLE_ICONS,
  DEFAULT_SPRAY_SETTINGS,
  MASK_RESOLUTION,
  BORDER_PANEL_DIVIDER_COLOR,
  TEXT_HIGH_CONTRAST_COLOR,
} from '@/features/realm/config/constants';
import { resolvePaletteColor } from '@/app/theme/colors';
import { SettingsSection } from '../ui/SettingsSection';
import { SettingSlider } from '../ui/SettingSlider';
import { Icon } from '../Icon';
import { generateSprayIcons } from '@/features/realm/utils/sprayUtils';
import { getHexCorners } from '@/features/realm/utils/hexUtils';
import { InfoPopup } from '../ui/InfoPopup';
import { useTheme } from '@/app/providers/ThemeProvider';

const PREVIEW_HEX_SIZE: Point = { x: 50, y: 50 };

// =================================================================================
// --- Sub-component: IconGridSelector ---
// =================================================================================
interface IconGridSelectorProps {
  selectedIcons: string[];
  onToggleIcon: (iconName: string) => void;
}

const IconGridSelector = ({ selectedIcons, onToggleIcon }: IconGridSelectorProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-text-muted mb-1">Spray Icons</label>
      <div className="grid grid-cols-6 gap-1 p-2 bg-realm-map-viewport rounded-md max-h-48 overflow-y-auto">
        {SPRAYABLE_ICONS.sort().map((icon) => {
          const isSelected = selectedIcons.includes(icon);
          return (
            <button
              key={icon}
              onClick={() => onToggleIcon(icon)}
              className={`flex flex-col items-center justify-center gap-1 p-1 rounded-md transition-all duration-150 border-2 text-center h-16
                                ${isSelected ? 'bg-actions-command-primary/30 border-actions-command-primary text-text-high-contrast' : 'bg-realm-command-panel-surface border-transparent hover:border-text-muted text-text-muted'}`}
              title={icon}
            >
              <Icon name={icon} className="w-6 h-6" />
              <span className="text-[10px] truncate w-full">{icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =================================================================================
// --- Sub-component: PlacementMaskEditor ---
// =================================================================================
interface PlacementMaskEditorProps {
  mask: number[];
  onUpdateMask: (newMask: number[]) => void;
}

const PlacementMaskEditor = ({ mask, onUpdateMask }: PlacementMaskEditorProps) => {
  const [isPainting, setIsPainting] = useState(false);
  const paintValue = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePaint = useCallback(
    (index: number) => {
      const currentMask = mask[index];
      if (currentMask !== undefined && currentMask !== paintValue.current) {
        const newMask = [...mask];
        newMask[index] = paintValue.current;
        onUpdateMask(newMask);
      }
    },
    [mask, onUpdateMask]
  );

  const getIndexFromEvent = (e: React.MouseEvent<HTMLDivElement>): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellWidth = rect.width / MASK_RESOLUTION;
    const cellHeight = rect.height / MASK_RESOLUTION;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (col >= 0 && col < MASK_RESOLUTION && row >= 0 && row < MASK_RESOLUTION) {
      return row * MASK_RESOLUTION + col;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const index = getIndexFromEvent(e);
    if (index !== null) {
      setIsPainting(true);
      const currentMaskValue = mask[index];
      paintValue.current = currentMaskValue === 1 ? 0 : 1;
      handlePaint(index);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPainting) {
      const index = getIndexFromEvent(e);
      if (index !== null) {
        handlePaint(index);
      }
    }
  };

  const handleFill = () => onUpdateMask(new Array(MASK_RESOLUTION * MASK_RESOLUTION).fill(1));
  const handleEmpty = () => onUpdateMask(new Array(MASK_RESOLUTION * MASK_RESOLUTION).fill(0));

  return (
    <div className="col-span-2">
      <label className="block text-sm font-medium text-text-muted">Placement Mask</label>
      <p className="text-xs text-text-muted mt-1 mb-2">
        Click and drag to "paint" the green area where icons are allowed to appear. This defines the
        placement area within the hex.
      </p>
      <div
        ref={containerRef}
        className="grid bg-border-panel-divider rounded-md select-none cursor-pointer gap-px w-min"
        style={{ gridTemplateColumns: `repeat(${MASK_RESOLUTION}, 1fr)` }}
        onMouseDown={handleMouseDown}
        onMouseUp={() => setIsPainting(false)}
        onMouseLeave={() => setIsPainting(false)}
        onMouseMove={handleMouseMove}
      >
        {mask.map((value, index) => (
          <div
            key={index}
            className={`w-5 h-5 ${value ? 'bg-feedback-success-highlight' : 'bg-realm-command-panel-surface'}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleFill}
          className="px-2 py-0.5 text-xs bg-realm-command-panel-surface hover:bg-realm-command-panel-hover rounded-md text-text-muted hover:text-text-high-contrast transition-colors"
        >
          Fill
        </button>
        <button
          onClick={handleEmpty}
          className="px-2 py-0.5 text-xs bg-realm-command-panel-surface hover:bg-realm-command-panel-hover rounded-md text-text-muted hover:text-text-high-contrast transition-colors"
        >
          Empty
        </button>
      </div>
    </div>
  );
};

// =================================================================================
// --- Sub-component: HexSprayPreview ---
// =================================================================================
interface HexSprayPreviewProps {
  terrain: Tile;
}

const HexSprayPreview = ({ terrain }: HexSprayPreviewProps) => {
  const hexCorners = useMemo(() => getHexCorners('pointy', PREVIEW_HEX_SIZE), []);

  const iconsToRender = useMemo(() => {
    // We use a mock hex. Coordinates don't matter with the new seeding,
    // but the function requires a hex object.
    const mockHex = { q: 0, r: 0, s: 0, terrain: terrain.id, barrierEdges: [] };

    // Generate icons using the same function as the main map.
    // This guarantees the preview is an exact representation of a real hex.
    return generateSprayIcons(mockHex, terrain, PREVIEW_HEX_SIZE);
  }, [terrain]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="-55 -55 110 110">
        <g>
          <polygon
            points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={terrain.color || '#ccc'}
            stroke={BORDER_PANEL_DIVIDER_COLOR}
            strokeWidth="1"
          />
          <g>
            {iconsToRender.map((icon, i) => (
              <g key={i} transform={`translate(${icon.x}, ${icon.y}) rotate(${icon.rotation})`}>
                <Icon
                  name={icon.name}
                  style={{ opacity: icon.opacity, color: icon.color }}
                  width={icon.size}
                  height={icon.size}
                  x={-icon.size / 2}
                  y={-icon.size / 2}
                  strokeWidth={2.5}
                />
              </g>
            ))}
          </g>
        </g>
      </svg>
      <p className="text-xs text-center text-text-muted">
        This pattern is consistent for all '{terrain.label}' hexes.
      </p>
    </div>
  );
};

// =================================================================================
// --- Sub-component: RangeSlider ---
// =================================================================================
interface RangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}

const RangeSlider = ({ min, max, valueMin, valueMax, onChange, step = 1 }: RangeSliderProps) => {
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    if (maxRef.current) {
      const minPercent = getPercent(valueMin);
      const maxPercent = getPercent(+maxRef.current.value);
      if (rangeRef.current) {
        rangeRef.current.style.left = `${minPercent}%`;
        rangeRef.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [valueMin, getPercent]);

  useEffect(() => {
    if (minRef.current) {
      const minPercent = getPercent(+minRef.current.value);
      const maxPercent = getPercent(valueMax);
      if (rangeRef.current) {
        rangeRef.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [valueMax, getPercent]);

  return (
    <div className="relative flex items-center h-8">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        ref={minRef}
        onChange={(e) => {
          const value = Math.min(+e.target.value, valueMax - step);
          onChange(value, valueMax);
        }}
        className="absolute w-full h-2 bg-transparent pointer-events-none appearance-none z-20 thumb-slider"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        ref={maxRef}
        onChange={(e) => {
          const value = Math.max(+e.target.value, valueMin + step);
          onChange(valueMin, value);
        }}
        className="absolute w-full h-2 bg-transparent pointer-events-none appearance-none z-20 thumb-slider"
      />
      <div className="relative w-full">
        <div className="absolute w-full rounded-lg h-2 bg-realm-command-panel-surface z-0 top-1/2 -translate-y-1/2"></div>
        <div
          ref={rangeRef}
          className="absolute rounded-lg h-2 bg-actions-command-primary z-10 top-1/2 -translate-y-1/2"
        ></div>
      </div>
      <style>{`
                .thumb-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: ${TEXT_HIGH_CONTRAST_COLOR};
                    cursor: pointer;
                    pointer-events: auto;
                    margin-top: -7px;
                }
                 .thumb-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: ${TEXT_HIGH_CONTRAST_COLOR};
                    cursor: pointer;
                    pointer-events: auto;
                    border: none;
                }
            `}</style>
    </div>
  );
};

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
  const [activeInfo, setActiveInfo] = useState<{
    id: string;
    anchor: HTMLElement;
    locked: boolean;
  } | null>(null);
  const { colors } = useTheme();
  const hoverOpenTimeout = useRef<number | null>(null);
  const hoverCloseTimeout = useRef<number | null>(null);
  const infoPopupOptions = { autoOpenOnHover: true, openDelay: 250, closeDelay: 200 };

  const resolveColor = useCallback(
    (value: string | undefined) => {
      if (!value) {
        return '#CCCCCC';
      }
      const varMatch = /^var\((--[^)]+)\)$/i.exec(value);
      if (varMatch?.[1]) {
        const resolved = resolvePaletteColor(colors, varMatch[1]);
        if (resolved) {
          return resolved.toUpperCase();
        }
      }
      const paletteResolved = resolvePaletteColor(colors, value);
      if (paletteResolved) {
        return paletteResolved.toUpperCase();
      }
      return value.toUpperCase?.() ?? value;
    },
    [colors]
  );

  const cancelOpenTimeout = useCallback(() => {
    if (hoverOpenTimeout.current !== null) {
      window.clearTimeout(hoverOpenTimeout.current);
      hoverOpenTimeout.current = null;
    }
  }, []);

  const cancelCloseTimeout = useCallback(() => {
    if (hoverCloseTimeout.current !== null) {
      window.clearTimeout(hoverCloseTimeout.current);
      hoverCloseTimeout.current = null;
    }
  }, []);

  const closeInfo = useCallback(() => {
    cancelOpenTimeout();
    cancelCloseTimeout();
    setActiveInfo(null);
  }, [cancelCloseTimeout, cancelOpenTimeout]);

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

  useEffect(() => {
    return () => {
      cancelOpenTimeout();
      cancelCloseTimeout();
    };
  }, [cancelCloseTimeout, cancelOpenTimeout]);

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
                        const anchor = event.currentTarget as HTMLElement;
                        setActiveInfo((prev) => {
                          if (prev?.id === terrain.id) {
                            if (prev.locked) {
                              return { ...prev, anchor };
                            }
                            return { id: terrain.id, anchor, locked: true };
                          }
                          return { id: terrain.id, anchor, locked: true };
                        });
                      }}
                      onMouseEnter={(event) => {
                        if (!infoPopupOptions.autoOpenOnHover) {
                          return;
                        }
                        const anchor = event.currentTarget as HTMLElement;
                        cancelCloseTimeout();
                        cancelOpenTimeout();
                        hoverOpenTimeout.current = window.setTimeout(() => {
                          setActiveInfo((prev) => {
                            if (prev?.locked && prev.id !== terrain.id) {
                              return prev;
                            }
                            if (prev?.id === terrain.id && prev.locked) {
                              return { ...prev, anchor };
                            }
                            return { id: terrain.id, anchor, locked: false };
                          });
                          hoverOpenTimeout.current = null;
                        }, infoPopupOptions.openDelay);
                      }}
                      onMouseLeave={(event) => {
                        const nextTarget = event.relatedTarget as Node | null;
                        if (nextTarget && event.currentTarget.contains(nextTarget)) {
                          return;
                        }
                        if (!infoPopupOptions.autoOpenOnHover) {
                          return;
                        }
                        cancelOpenTimeout();
                        cancelCloseTimeout();
                        hoverCloseTimeout.current = window.setTimeout(() => {
                          setActiveInfo((prev) => {
                            if (!prev) {
                              return null;
                            }
                            if (prev.locked) {
                              return prev;
                            }
                            if (prev.id !== terrain.id) {
                              return prev;
                            }
                            return null;
                          });
                          hoverCloseTimeout.current = null;
                        }, infoPopupOptions.closeDelay);
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
                      cancelOpenTimeout();
                      cancelCloseTimeout();
                      hoverCloseTimeout.current = window.setTimeout(() => {
                        setActiveInfo((prev) => {
                          if (!prev) {
                            return null;
                          }
                          if (prev.locked) {
                            return prev;
                          }
                          if (prev.id !== terrain.id) {
                            return prev;
                          }
                          return null;
                        });
                        hoverCloseTimeout.current = null;
                      }, infoPopupOptions.closeDelay);
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
