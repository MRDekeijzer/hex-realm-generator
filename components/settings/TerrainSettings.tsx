/**
 * @file Component for the "Terrain" tab in the main settings modal.
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { TileSet, SpraySettings, Tile } from '../../types';
import { SPRAYABLE_ICONS, DEFAULT_SPRAY_SETTINGS, MASK_RESOLUTION } from '../../constants';
import { SettingsSection } from '../ui/SettingsSection';
import { SettingSlider } from '../ui/SettingSlider';
import { Icon } from '../Icon';
import { generateSprayIcons } from '../../utils/sprayUtils';
import { getHexCorners } from '../../utils/hexUtils';

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
            <label className="block text-sm font-medium text-[#a7a984] mb-1">Spray Icons</label>
            <div className="grid grid-cols-6 gap-1 p-2 bg-[#18272e] rounded-md max-h-48 overflow-y-auto">
                {SPRAYABLE_ICONS.sort().map(icon => {
                    const isSelected = selectedIcons.includes(icon);
                    return (
                        <button
                            key={icon}
                            onClick={() => onToggleIcon(icon)}
                            className={`flex flex-col items-center justify-center gap-1 p-1 rounded-md transition-all duration-150 border-2 text-center h-16
                                ${isSelected ? 'bg-[#736b23]/30 border-[#736b23] text-[#eaebec]' : 'bg-[#324446] border-transparent hover:border-[#a7a984] text-[#a7a984]'}`}
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

    const handlePaint = useCallback((index: number) => {
        const currentMask = mask[index];
        if (currentMask !== undefined && currentMask !== paintValue.current) {
            const newMask = [...mask];
            newMask[index] = paintValue.current;
            onUpdateMask(newMask);
        }
    }, [mask, onUpdateMask]);
    
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
            <label className="block text-sm font-medium text-[#a7a984]">Placement Mask</label>
            <p className="text-xs text-[#a7a984] mt-1 mb-2">Click and drag to "paint" the green area where icons are allowed to appear. This defines the placement area within the hex.</p>
            <div
                ref={containerRef}
                className="grid bg-[#41403f] rounded-md select-none cursor-pointer gap-px w-min"
                style={{ gridTemplateColumns: `repeat(${MASK_RESOLUTION}, 1fr)` }}
                onMouseDown={handleMouseDown}
                onMouseUp={() => setIsPainting(false)}
                onMouseLeave={() => setIsPainting(false)}
                onMouseMove={handleMouseMove}
            >
                {mask.map((value, index) => (
                    <div
                        key={index}
                        className="w-5 h-5"
                        style={{ 
                            backgroundColor: value ? '#777741' : '#324446',
                        }}
                    />
                ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
                <button onClick={handleFill} className="px-2 py-0.5 text-xs bg-[#324446] hover:bg-[#435360] rounded-md text-[#a7a984] hover:text-[#eaebec] transition-colors">Fill</button>
                <button onClick={handleEmpty} className="px-2 py-0.5 text-xs bg-[#324446] hover:bg-[#435360] rounded-md text-[#a7a984] hover:text-[#eaebec] transition-colors">Empty</button>
            </div>
        </div>
    );
};

// =================================================================================
// --- Sub-component: HexSprayPreview ---
// =================================================================================
interface HexSprayPreviewProps {
    terrain: Tile;
    regenerateCounter: number;
    onRegenerate: () => void;
}

const HexSprayPreview = ({ terrain, regenerateCounter, onRegenerate }: HexSprayPreviewProps) => {
    const previewHexSize = { x: 50, y: 50 };
    const hexCorners = useMemo(() => getHexCorners('pointy', previewHexSize), []);
    
    const iconsToRender = useMemo(() => {
        // Define a set of coordinates to cycle through for the preview.
        // This ensures the preview shows different, but deterministic, examples.
        const previewCoords = [
            { q: 0, r: 0 }, { q: 1, r: 2 }, { q: -3, r: 1 },
            { q: 5, r: -5 }, { q: -2, r: -4 }, { q: 8, r: 3 },
        ];
        // Select coordinates based on the regenerateCounter.
        const coords = previewCoords[regenerateCounter % previewCoords.length];
        const {q, r} = coords ?? { q: 0, r: 0 };
        
        // Create a mock hex object with the chosen coordinates.
        const mockHex = { q, r, s: -q - r, terrain: terrain.id, barrierEdges: [] };
        
        // Generate icons using the same function as the main map.
        // This guarantees the preview is an exact representation of a real hex.
        return generateSprayIcons(mockHex, terrain, previewHexSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [terrain, regenerateCounter]);

    return (
        <div className="flex flex-col items-center gap-2">
             <svg width="110" height="110" viewBox="-55 -55 110 110">
                <g>
                    <polygon points={hexCorners.map(p => `${p.x},${p.y}`).join(' ')} fill={terrain.color || '#ccc'} stroke="#41403f" strokeWidth="1" />
                    <g>
                        {iconsToRender.map((icon, i) => (
                            <g key={i} transform={`translate(${icon.x}, ${icon.y}) rotate(${icon.rotation})`}>
                                <Icon name={icon.name} style={{ opacity: icon.opacity, color: icon.color }} width={icon.size} height={icon.size} x={-icon.size / 2} y={-icon.size / 2} strokeWidth={2.5} />
                            </g>
                        ))}
                    </g>
                </g>
            </svg>
            <button
                onClick={onRegenerate}
                className="w-full max-w-[200px] flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#a7a984] bg-[#324446] rounded-md hover:bg-[#435360] transition-colors"
            >
                <Icon name="sparkles" className="w-4 h-4" />
                Regenerate Preview
            </button>
        </div>
    );
};

// =================================================================================
// --- Sub-component: RangeSlider ---
// =================================================================================
interface RangeSliderProps {
    min: number; max: number;
    valueMin: number; valueMax: number;
    onChange: (min: number, max: number) => void;
    step?: number;
}

const RangeSlider = ({ min, max, valueMin, valueMax, onChange, step = 1 }: RangeSliderProps) => {
    const minRef = useRef<HTMLInputElement>(null);
    const maxRef = useRef<HTMLInputElement>(null);
    const rangeRef = useRef<HTMLDivElement>(null);

    const getPercent = useCallback((value: number) => Math.round(((value - min) / (max - min)) * 100), [min, max]);

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
            <input type="range" min={min} max={max} step={step} value={valueMin} ref={minRef} onChange={(e) => { const value = Math.min(+e.target.value, valueMax - step); onChange(value, valueMax); }} className="absolute w-full h-2 bg-transparent pointer-events-none appearance-none z-20 thumb-slider" />
            <input type="range" min={min} max={max} step={step} value={valueMax} ref={maxRef} onChange={(e) => { const value = Math.max(+e.target.value, valueMin + step); onChange(valueMin, value); }} className="absolute w-full h-2 bg-transparent pointer-events-none appearance-none z-20 thumb-slider" />
            <div className="relative w-full">
                <div className="absolute w-full rounded-lg h-2 bg-[#324446] z-0 top-1/2 -translate-y-1/2"></div>
                <div ref={rangeRef} className="absolute rounded-lg h-2 bg-[#736b23] z-10 top-1/2 -translate-y-1/2"></div>
            </div>
             <style>{`
                .thumb-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #eaebec;
                    cursor: pointer;
                    pointer-events: auto;
                    margin-top: -7px;
                }
                 .thumb-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #eaebec;
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
    const [regenerateCounter, setRegenerateCounter] = useState(0);
    const colorInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const detailsRefs = useRef<Map<string, HTMLDetailsElement | null>>(new Map());

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

    const handleSettingChange = (terrainId: string, settingKey: keyof SpraySettings, value: any) => {
        setTileSets(prev => ({
            ...prev,
            terrain: prev.terrain.map(t =>
                t.id === terrainId
                    ? { ...t, spraySettings: { ...(t.spraySettings || DEFAULT_SPRAY_SETTINGS), [settingKey]: value } }
                    : t
            )
        }));
    };
    
    const handleToggleSprayIcon = (terrainId: string, iconName: string) => {
        setTileSets(prev => ({
            ...prev,
            terrain: prev.terrain.map(t => {
                if (t.id === terrainId) {
                    const currentIcons = t.sprayIcons || [];
                    const newIcons = currentIcons.includes(iconName)
                        ? currentIcons.filter(i => i !== iconName)
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
                <p className="text-xs text-[#a7a984] !mt-0">
                    Configure the small, semi-transparent icons that are procedurally scattered on each terrain type to add visual texture.
                </p>
                <div className="space-y-4">
                    {tileSets.terrain.map(terrain => {
                        const settings = terrain.spraySettings || DEFAULT_SPRAY_SETTINGS;
                        return (
                        <details ref={el => { detailsRefs.current.set(terrain.id, el); }} key={terrain.id} className="p-3 bg-[#191f29] rounded-md border border-[#41403f]/50 open:border-[#736b23]/50 transition-colors group/details">
                            <summary className="font-semibold text-md text-[#a7a984] list-none cursor-pointer flex items-center gap-2 hover:text-[#eaebec]">
                                <Icon name={terrain.icon} className="w-5 h-5" />
                                {terrain.label}
                                <Icon name="chevron-down" className="w-4 h-4 ml-auto transition-transform duration-200 group-open/details:rotate-180" />
                            </summary>
                            <div className="pl-7 mt-3 pt-3 border-t border-[#41403f]/50 space-y-4">
                               <HexSprayPreview terrain={terrain} regenerateCounter={regenerateCounter} onRegenerate={() => setRegenerateCounter(c => c + 1)} />
                                <IconGridSelector selectedIcons={terrain.sprayIcons || []} onToggleIcon={(icon) => handleToggleSprayIcon(terrain.id, icon)} />
                                <div className="pt-4 grid grid-cols-2 gap-4">
                                    <SettingSlider label="Density" value={settings.density} onChange={v => handleSettingChange(terrain.id, 'density', v)} min={0} max={128} step={1} displayMultiplier={1} displaySuffix=" icons" />
                                    <div>
                                        <label className="block text-sm font-medium text-[#a7a984] mb-1">Color</label>
                                         <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => colorInputRefs.current[terrain.id]?.click()}
                                                className="w-10 h-10 rounded-md flex-shrink-0 border border-black/20 relative group/pipette"
                                                style={{ backgroundColor: settings.color }}
                                                title="Edit color"
                                            >
                                                <input 
                                                    ref={el => { if(el) colorInputRefs.current[terrain.id] = el; }} 
                                                    type="color" 
                                                    value={settings.color} 
                                                    onChange={e => handleSettingChange(terrain.id, 'color', e.target.value)} 
                                                    className="opacity-0 w-0 h-0 absolute pointer-events-none" 
                                                />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/pipette:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Icon name="pipette" className="w-5 h-5 text-white" />
                                                </div>
                                            </button>
                                            <span className="p-2 bg-[#324446] rounded-md text-sm font-mono flex-grow text-center h-10 flex items-center justify-center">{settings.color.toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-[#a7a984] mb-1">Size Range ({settings.sizeMin}px - {settings.sizeMax}px)</label>
                                        <RangeSlider min={0} max={100} valueMin={settings.sizeMin} valueMax={settings.sizeMax} onChange={(min, max) => {
                                            handleSettingChange(terrain.id, 'sizeMin', min);
                                            handleSettingChange(terrain.id, 'sizeMax', max);
                                        }}/>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-[#a7a984] mb-1">Opacity Range ({Math.round(settings.opacityMin * 100)}% - {Math.round(settings.opacityMax * 100)}%)</label>
                                        <RangeSlider min={0.1} max={1.0} step={0.01} valueMin={settings.opacityMin} valueMax={settings.opacityMax} onChange={(min, max) => {
                                            handleSettingChange(terrain.id, 'opacityMin', min);
                                            handleSettingChange(terrain.id, 'opacityMax', max);
                                        }}/>
                                    </div>
                                    
                                    <PlacementMaskEditor mask={settings.placementMask} onUpdateMask={mask => handleSettingChange(terrain.id, 'placementMask', mask)} />
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