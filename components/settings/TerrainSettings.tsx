/**
 * @file Component for the "Terrain" tab in the main settings modal.
 */

import React, { useState, useRef, useMemo } from 'react';
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

    const handlePaint = (index: number) => {
        if (mask[index] !== paintValue.current) {
            const newMask = [...mask];
            newMask[index] = paintValue.current;
            onUpdateMask(newMask);
        }
    };
    
    const handleMouseDown = (index: number) => {
        setIsPainting(true);
        paintValue.current = mask[index] === 1 ? 0 : 1; // Toggle on first click
        handlePaint(index);
    };

    return (
        <div className="col-span-2">
            <label className="block text-sm font-medium text-[#a7a984] mb-1">Placement Mask</label>
            <div className="flex items-center gap-4">
                <div
                    ref={containerRef}
                    className="grid bg-[#18272e] p-1 rounded-md select-none cursor-pointer"
                    style={{ gridTemplateColumns: `repeat(${MASK_RESOLUTION}, 1fr)` }}
                    onMouseUp={() => setIsPainting(false)}
                    onMouseLeave={() => setIsPainting(false)}
                >
                    {mask.map((value, index) => (
                        <div
                            key={index}
                            className="w-5 h-5 border border-[#41403f]/50"
                            style={{ backgroundColor: value ? '#777741' : '#eaebec' }}
                            onMouseDown={() => handleMouseDown(index)}
                            onMouseEnter={() => isPainting && handlePaint(index)}
                        />
                    ))}
                </div>
                <p className="text-xs text-[#a7a984] flex-1">Click and drag to "paint" the green area where icons are allowed to appear. This defines the placement area within the hex.</p>
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
    const [previewSeed, setPreviewSeed] = useState(Math.random());
    const previewHexSize = { x: 50, y: 50 };
    const hexCorners = useMemo(() => getHexCorners('pointy', previewHexSize), []);
    
    const iconsToRender = useMemo(() => {
        const mockHex = { q: 0, r: 0, s: 0, terrain: terrain.id, barrierEdges: [] };
        return generateSprayIcons(mockHex, terrain, previewHexSize, previewSeed);
    }, [terrain, previewSeed]);

    return (
        <div className="col-span-2">
            <label className="block text-sm font-medium text-[#a7a984] mb-1">Live Preview</label>
            <div className="flex items-center gap-4 p-2 bg-[#18272e] rounded-md">
                 <svg width="110" height="110" viewBox="-55 -55 110 110">
                    <g>
                        <polygon points={hexCorners.map(p => `${p.x},${p.y}`).join(' ')} fill={terrain.color || '#ccc'} stroke="#41403f" strokeWidth="1" />
                        <g>
                            {iconsToRender.map((icon, i) => (
                                <g key={i} transform={`translate(${icon.x}, ${icon.y}) rotate(${icon.rotation})`}>
                                    <Icon name={icon.name} className="text-[#221f21]" style={{ opacity: icon.opacity }} width={icon.size} height={icon.size} strokeWidth={2.5} />
                                </g>
                            ))}
                        </g>
                    </g>
                </svg>
                <button
                    onClick={() => setPreviewSeed(Math.random())}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#a7a984] bg-[#324446] rounded-md hover:bg-[#435360] transition-colors h-full"
                >
                    <Icon name="sparkles" className="w-4 h-4" />
                    Regenerate Preview
                </button>
            </div>
        </div>
    );
};


/**
 * Props for the TerrainSettings component.
 */
interface TerrainSettingsProps {
    tileSets: TileSet;
    setTileSets: React.Dispatch<React.SetStateAction<TileSet>>;
}

/**
 * A component that renders settings for customizing terrain appearance,
 * including the procedural Icon Spray feature.
 */
export const TerrainSettings = ({ tileSets, setTileSets }: TerrainSettingsProps) => {
    
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
                        <details key={terrain.id} className="p-3 bg-[#191f29] rounded-md border border-[#41403f]/50 open:border-[#736b23]/50 transition-colors group">
                            <summary className="font-semibold text-md text-[#a7a984] list-none cursor-pointer flex items-center gap-2 hover:text-[#eaebec]">
                                <Icon name={terrain.icon} className="w-5 h-5" />
                                {terrain.label}
                                <Icon name="chevron-down" className="w-4 h-4 ml-auto transition-transform duration-200 group-open:rotate-180" />
                            </summary>
                            <div className="pl-7 mt-3 pt-3 border-t border-[#41403f]/50 space-y-4">
                                <IconGridSelector selectedIcons={terrain.sprayIcons || []} onToggleIcon={(icon) => handleToggleSprayIcon(terrain.id, icon)} />
                                <div className="pt-4 mt-2 grid grid-cols-2 gap-x-6 gap-y-4">
                                    <SettingSlider label="Density" value={settings.density} onChange={v => handleSettingChange(terrain.id, 'density', v)} min={0} max={16} step={1} displayMultiplier={1} displaySuffix=" icons" />
                                    <SettingSlider label="Opacity" value={settings.opacity} onChange={v => handleSettingChange(terrain.id, 'opacity', v)} min={0.1} max={1.0} step={0.01} />
                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[#a7a984] mb-1">Size Range (px)</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={settings.sizeMin} onChange={e => handleSettingChange(terrain.id, 'sizeMin', parseInt(e.target.value) || 0)} min={1} max={50} className="w-full bg-[#324446] p-2 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Minimum size" />
                                                <input type="number" value={settings.sizeMax} onChange={e => handleSettingChange(terrain.id, 'sizeMax', parseInt(e.target.value) || 0)} min={1} max={50} className="w-full bg-[#324446] p-2 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Maximum size" />
                                            </div>
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-[#a7a984] mb-1">Seed</label>
                                             <div className="flex items-center gap-2">
                                                <input type="number" value={settings.seed === 'auto' ? '' : settings.seed} onChange={e => handleSettingChange(terrain.id, 'seed', parseInt(e.target.value))} placeholder="Auto" className="w-full bg-[#324446] p-2 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Seed" />
                                                <button onClick={() => handleSettingChange(terrain.id, 'seed', 'auto')} className="px-3 py-2 text-sm font-medium text-[#eaebec] bg-[#435360] rounded-md hover:bg-[#736b23] transition-colors">Auto</button>
                                             </div>
                                        </div>
                                    </div>
                                    <SettingSlider label="Rotation Jitter" value={settings.rotationJitter} onChange={v => handleSettingChange(terrain.id, 'rotationJitter', v)} min={0} max={180} step={1} displayMultiplier={1} displaySuffix="°" />
                                    <SettingSlider label="Tint Variance" value={settings.tintVariance} onChange={v => handleSettingChange(terrain.id, 'tintVariance', v)} min={0} max={0.2} step={0.01} />
                                    <PlacementMaskEditor mask={settings.placementMask} onUpdateMask={mask => handleSettingChange(terrain.id, 'placementMask', mask)} />
                                    <SettingSlider label="Cluster Factor" value={settings.clusterFactor} onChange={v => handleSettingChange(terrain.id, 'clusterFactor', v)} min={0} max={1} step={0.01} />
                                    <div>
                                        <label className="flex items-center justify-between cursor-pointer mb-1">
                                            <span className="text-sm font-medium text-[#a7a984]">Collision Avoidance</span>
                                            <div className="relative"><input type="checkbox" checked={settings.collisionAvoidance} onChange={e => handleSettingChange(terrain.id, 'collisionAvoidance', e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-[#324446] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#736b23]"></div></div>
                                        </label>
                                        <input type="number" value={settings.minSpacing} onChange={e => handleSettingChange(terrain.id, 'minSpacing', parseInt(e.target.value) || 0)} disabled={!settings.collisionAvoidance} min={0} max={50} className="w-full bg-[#324446] p-2 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md disabled:opacity-50" aria-label="Minimum spacing" />
                                    </div>
                                    <HexSprayPreview terrain={terrain} />
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
