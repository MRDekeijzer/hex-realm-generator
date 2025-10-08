import React, { useRef, useState, useEffect, useMemo } from 'react';
// FIX: Import Myth type to handle backward compatibility for realm imports.
import type { ViewOptions, Realm, GenerationOptions, Myth, TileSet } from '../types';
import { Icon } from './Icon';
import { DEFAULT_GRID_COLOR, DEFAULT_GRID_WIDTH } from '../constants';

interface ToolbarProps {
  onGenerate: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onImportJson: (realm: Realm) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  viewOptions: ViewOptions;
  setViewOptions: React.Dispatch<React.SetStateAction<ViewOptions>>;
  realmShape: 'hex' | 'square';
  setRealmShape: React.Dispatch<React.SetStateAction<'hex' | 'square'>>;
  realmRadius: number;
  setRealmRadius: React.Dispatch<React.SetStateAction<number>>;
  realmWidth: number;
  setRealmWidth: React.Dispatch<React.SetStateAction<number>>;
  realmHeight: number;
  setRealmHeight: React.Dispatch<React.SetStateAction<number>>;
  generationOptions: GenerationOptions;
  setGenerationOptions: React.Dispatch<React.SetStateAction<GenerationOptions>>;
  tileSets: TileSet;
}

interface ToolbarButtonProps {
    onClick: () => void;
    icon: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
    ({ onClick, icon, children, disabled }, ref) => (
    <button ref={ref} onClick={onClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#a7a984] bg-[#324446] rounded-md hover:bg-[#435360] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={disabled}>
        <Icon name={icon} className="w-4 h-4" />
        {children}
    </button>
));
ToolbarButton.displayName = 'ToolbarButton';

const rgbaToHexOpacity = (rgba: string): { hex: string; opacity: number } => {
    if (rgba.startsWith('#')) {
        return { hex: rgba, opacity: 1 };
    }
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return { hex: '#eaebec', opacity: 0.2 };

    const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
    const hex = `#${toHex(parseInt(match[1]))}${toHex(parseInt(match[2]))}${toHex(parseInt(match[3]))}`;
    const opacity = match[4] !== undefined ? parseFloat(match[4]) : 1;

    return { hex, opacity };
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
};

export function Toolbar({ 
    onGenerate, 
    onExportJson, 
    onExportPng, 
    onImportJson,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    viewOptions, 
    setViewOptions,
    realmShape,
    setRealmShape,
    realmRadius,
    setRealmRadius,
    realmWidth,
    setRealmWidth,
    realmHeight,
    setRealmHeight,
    generationOptions,
    setGenerationOptions,
    tileSets
}: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsPopoverRef = useRef<HTMLDivElement>(null);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false);
    const gridSettingsPopoverRef = useRef<HTMLDivElement>(null);
    const gridSettingsButtonRef = useRef<HTMLButtonElement>(null);
    const gridColorInputRef = useRef<HTMLInputElement>(null);
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'mythics'>('general');


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsButtonRef.current?.contains(event.target as Node)) {
                return;
            }
            if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
            
            if (gridSettingsButtonRef.current?.contains(event.target as Node)) {
                return;
            }
            if (gridSettingsPopoverRef.current && !gridSettingsPopoverRef.current.contains(event.target as Node)) {
                setIsGridSettingsOpen(false);
            }
        };

        if (isSettingsOpen || isGridSettingsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSettingsOpen, isGridSettingsOpen]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedData = JSON.parse(e.target?.result as string);
                    
                    const shape = loadedData.shape || 'hex';
                    const hexes = loadedData.hexes;
                    const seatOfPower = loadedData.seatOfPower;
                    let myths = loadedData.myths;

                    if (!hexes || !seatOfPower) {
                        throw new Error("Invalid realm file: missing hexes or seatOfPower.");
                    }
                    
                    // FIX: Handle older realm files that may not have a 'myths' array.
                    // If 'myths' is missing, reconstruct it from 'myth' properties on individual hexes.
                    // This fixes the 'myths' property missing error.
                    if (!myths) {
                        const mythsFromHexes: Myth[] = [];
                        if (hexes && Array.isArray(hexes)) {
                            hexes.forEach((hex: any) => { // Use any for hex as it's from JSON
                                if (hex.myth) {
                                    mythsFromHexes.push({
                                        id: hex.myth,
                                        name: `Myth #${hex.myth}`,
                                        q: hex.q,
                                        r: hex.r,
                                    });
                                }
                            });
                        }
                        myths = mythsFromHexes;
                    }
                    
                    let realmToImport: Realm;

                    if (shape === 'hex') {
                        const radius = loadedData.radius || loadedData.size || loadedData.gridSize;
                        if (!radius) throw new Error("Invalid hex realm: missing radius/size.");
                        realmToImport = { shape: 'hex', radius, hexes, seatOfPower, myths };
                    } else { // square
                        const width = loadedData.width || loadedData.size || loadedData.gridSize;
                        const height = loadedData.height || loadedData.size || loadedData.gridSize;
                        if (!width || !height) throw new Error("Invalid square realm: missing width/height/size.");
                        realmToImport = { shape: 'square', width, height, hexes, seatOfPower, myths };
                    }
                    onImportJson(realmToImport);
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Failed to import realm. The file might be corrupted or in the wrong format.");
                }
            };
            reader.readAsText(file);
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleGenerationOptionChange = (key: 'numHoldings' | 'numMyths' | 'mythMinDistance', value: string) => {
        setGenerationOptions(prev => ({
            ...prev,
            [key]: Math.max(0, parseInt(value, 10) || 0)
        }));
    };
    
    const handleLandmarkChange = (landmarkId: string, value: string) => {
        setGenerationOptions(prev => ({
            ...prev,
            landmarks: {
                ...prev.landmarks,
                [landmarkId]: Math.max(0, parseInt(value, 10) || 0)
            }
        }));
    };
    
    const { hex: gridHexColor, opacity: gridOpacity } = useMemo(() => rgbaToHexOpacity(viewOptions.gridColor), [viewOptions.gridColor]);
    const isCustomGridColor = viewOptions.gridColor !== DEFAULT_GRID_COLOR;

    const handleGridColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        const rgb = hexToRgb(newHex);
        if (rgb) {
            const newRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${gridOpacity})`;
            setViewOptions(v => ({ ...v, gridColor: newRgba }));
        }
    };
    
    const handleGridOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newOpacity = parseFloat(e.target.value);
        const rgb = hexToRgb(gridHexColor);
        if (rgb) {
            const newRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${newOpacity})`;
            setViewOptions(v => ({ ...v, gridColor: newRgba }));
        }
    };
    
    const handleResetGridSettings = () => {
        setViewOptions(v => ({
            ...v,
            showGrid: true,
            gridColor: DEFAULT_GRID_COLOR,
            gridWidth: DEFAULT_GRID_WIDTH,
        }));
    };


    return (
        <header className="flex items-center justify-between p-2 bg-[#191f29] border-b border-[#41403f] shadow-md z-10">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#eaebec] mr-4">Hex Realm Generator</h1>
                
                <ToolbarButton onClick={onGenerate} icon="sparkles">Generate</ToolbarButton>
                
                <div className="relative">
                    <ToolbarButton ref={settingsButtonRef} onClick={() => setIsSettingsOpen(prev => !prev)} icon="settings">
                        Settings
                    </ToolbarButton>
                    {isSettingsOpen && (
                        <div ref={settingsPopoverRef} className="absolute top-full mt-2 left-0 bg-[#18272e] border border-[#41403f] rounded-lg shadow-xl p-4 z-20 w-96">
                            <div className="flex border-b border-[#41403f]">
                                <button
                                    onClick={() => setActiveSettingsTab('general')}
                                    className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                                    activeSettingsTab === 'general'
                                        ? 'border-[#736b23] text-[#eaebec]'
                                        : 'border-transparent text-[#a7a984] hover:border-[#a7a984]/50'
                                    }`}
                                >
                                    General
                                </button>
                                <button
                                    onClick={() => setActiveSettingsTab('mythics')}
                                    className={`flex-1 py-2 text-center text-sm font-medium border-b-2 transition-colors ${
                                    activeSettingsTab === 'mythics'
                                        ? 'border-[#736b23] text-[#eaebec]'
                                        : 'border-transparent text-[#a7a984] hover:border-[#a7a984]/50'
                                    }`}
                                >
                                    Mythics
                                </button>
                            </div>
                            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                                {activeSettingsTab === 'general' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="realm-shape" className="block text-sm font-medium text-[#a7a984] mb-1">Shape</label>
                                            <select
                                                id="realm-shape"
                                                value={realmShape}
                                                onChange={(e) => setRealmShape(e.target.value as 'hex' | 'square')}
                                                className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                            >
                                                <option value="hex">Hexagon</option>
                                                <option value="square">Square</option>
                                            </select>
                                        </div>

                                        {realmShape === 'hex' ? (
                                            <div>
                                                <label htmlFor="realm-radius" className="block text-sm font-medium text-[#a7a984] mb-1">Radius</label>
                                                <input
                                                    id="realm-radius"
                                                    type="number"
                                                    value={realmRadius}
                                                    onChange={(e) => setRealmRadius(Math.max(3, parseInt(e.target.value, 10) || 1))}
                                                    min="3"
                                                    max="50"
                                                    className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                    aria-label="Realm radius"
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="realm-width" className="block text-sm font-medium text-[#a7a984] mb-1">Width</label>
                                                    <input
                                                        id="realm-width"
                                                        type="number"
                                                        value={realmWidth}
                                                        onChange={(e) => setRealmWidth(Math.max(3, parseInt(e.target.value, 10) || 1))}
                                                        min="3"
                                                        max="50"
                                                        className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                        aria-label="Realm width"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="realm-height" className="block text-sm font-medium text-[#a7a984] mb-1">Height</label>
                                                    <input
                                                        id="realm-height"
                                                        type="number"
                                                        value={realmHeight}
                                                        onChange={(e) => setRealmHeight(Math.max(3, parseInt(e.target.value, 10) || 1))}
                                                        min="3"
                                                        max="50"
                                                        className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                        aria-label="Realm height"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2 pt-4 border-t border-[#41403f]">
                                            <h3 className="text-md font-semibold text-[#eaebec] mb-2">Landmarks per Type</h3>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                {tileSets.landmark.map(landmark => (
                                                    <div key={landmark.id} className="flex justify-between items-center">
                                                        <label htmlFor={`landmark-${landmark.id}`} className="text-sm text-[#a7a984]">{landmark.label}</label>
                                                        <input
                                                            id={`landmark-${landmark.id}`}
                                                            type="number"
                                                            value={generationOptions.landmarks[landmark.id] || 0}
                                                            onChange={(e) => handleLandmarkChange(landmark.id, e.target.value)}
                                                            min="0"
                                                            className="w-20 bg-[#324446] p-1 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                            aria-label={`Number of ${landmark.label}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeSettingsTab === 'mythics' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="num-holdings" className="block text-sm font-medium text-[#a7a984] mb-1">Holdings</label>
                                                <input
                                                    id="num-holdings"
                                                    type="number"
                                                    value={generationOptions.numHoldings}
                                                    onChange={(e) => handleGenerationOptionChange('numHoldings', e.target.value)}
                                                    min="0"
                                                    className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                    aria-label="Number of holdings"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="num-myths" className="block text-sm font-medium text-[#a7a984] mb-1">Myths</label>
                                                <input
                                                    id="num-myths"
                                                    type="number"
                                                    value={generationOptions.numMyths}
                                                    onChange={(e) => handleGenerationOptionChange('numMyths', e.target.value)}
                                                    min="0"
                                                    className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                    aria-label="Number of myths"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="myth-min-distance" className="block text-sm font-medium text-[#a7a984] mb-1">Myth Min Distance</label>
                                            <input
                                                id="myth-min-distance"
                                                type="number"
                                                value={generationOptions.mythMinDistance}
                                                onChange={(e) => handleGenerationOptionChange('mythMinDistance', e.target.value)}
                                                min="0"
                                                className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                aria-label="Minimum distance between myths"
                                            />
                                        </div>
                                        
                                        <label htmlFor="generate-barriers" className="flex items-center justify-between pt-2 border-t border-[#41403f] cursor-pointer">
                                            <span className="text-sm font-medium text-[#a7a984]">Generate Barriers</span>
                                            <div className="relative">
                                                <input 
                                                    id="generate-barriers"
                                                    type="checkbox" 
                                                    checked={generationOptions.generateBarriers} 
                                                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, generateBarriers: e.target.checked }))} 
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-[#324446] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#736b23]"></div>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-[#41403f] mx-1"></div>

                <div className="relative">
                    <ToolbarButton ref={gridSettingsButtonRef} onClick={() => setIsGridSettingsOpen(prev => !prev)} icon="grid">
                        Grid
                    </ToolbarButton>
                     {isGridSettingsOpen && (
                        <div ref={gridSettingsPopoverRef} className="absolute top-full mt-2 left-0 bg-[#18272e] border border-[#41403f] rounded-lg shadow-xl p-4 z-20 w-64">
                            <div className="space-y-4">
                                <label className="flex items-center justify-between gap-2 text-sm font-medium text-[#a7a984] cursor-pointer">
                                    <span>Show Grid</span>
                                    <div className="relative">
                                        <input type="checkbox" checked={viewOptions.showGrid} onChange={() => setViewOptions(v => ({ ...v, showGrid: !v.showGrid }))} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-[#324446] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#736b23]"></div>
                                    </div>
                                </label>
                                <hr className="border-[#41403f]" />
                                <div>
                                    <label htmlFor="grid-color-btn" className="block text-sm font-medium text-[#a7a984] mb-1">Grid Color</label>
                                    <div className="flex items-center gap-2">
                                         <button
                                            id="grid-color-btn"
                                            onClick={() => {
                                                if (isCustomGridColor) {
                                                    setViewOptions(v => ({ ...v, gridColor: DEFAULT_GRID_COLOR }));
                                                } else {
                                                    gridColorInputRef.current?.click();
                                                }
                                            }}
                                            className="w-10 h-10 rounded-md flex-shrink-0 border border-black/20 relative group"
                                            style={{ backgroundColor: gridHexColor }}
                                            title={isCustomGridColor ? 'Reset color to default' : 'Edit color'}
                                        >
                                            <input
                                                ref={gridColorInputRef}
                                                type="color"
                                                value={gridHexColor}
                                                onChange={handleGridColorChange}
                                                className="opacity-0 w-0 h-0 absolute pointer-events-none"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Icon name={isCustomGridColor ? "reset" : "pipette"} className="w-5 h-5 text-white" />
                                            </div>
                                        </button>
                                        <span className="p-2 bg-[#324446] rounded-md text-sm font-mono flex-grow text-center">{gridHexColor.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="grid-opacity" className="block text-sm font-medium text-[#a7a984] mb-1">Opacity</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="grid-opacity"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={gridOpacity}
                                            onChange={handleGridOpacityChange}
                                            className="w-full h-2 bg-[#324446] rounded-lg appearance-none cursor-pointer"
                                            aria-label="Grid opacity"
                                        />
                                        <span className="p-1 bg-[#324446] rounded-md text-xs w-16 text-center">{Math.round(gridOpacity * 100)}%</span>
                                    </div>
                                </div>
                                 <div>
                                    <label htmlFor="grid-width" className="block text-sm font-medium text-[#a7a984] mb-1">Border Width</label>
                                    <input
                                        id="grid-width"
                                        type="number"
                                        value={viewOptions.gridWidth}
                                        onChange={(e) => setViewOptions(v => ({...v, gridWidth: Math.max(0.1, parseFloat(e.target.value)) || 1}))}
                                        min="0.1"
                                        step="0.1"
                                        className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                        aria-label="Grid border width"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-[#41403f]">
                                <button
                                    onClick={handleResetGridSettings}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#a7a984] bg-[#324446] rounded-md hover:bg-[#435360] transition-colors"
                                    >
                                    <Icon name="reset" className="w-4 h-4" />
                                    Reset All Grid Settings
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-[#41403f] mx-1"></div>
                <ToolbarButton onClick={onUndo} icon="undo" disabled={!canUndo}>Undo</ToolbarButton>
                <ToolbarButton onClick={onRedo} icon="redo" disabled={!canRedo}>Redo</ToolbarButton>
            </div>
            <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#a7a984] bg-[#324446] rounded-md hover:bg-[#435360] transition-colors cursor-pointer">
                    <Icon name="eye" className="w-4 h-4" />
                    <input type="checkbox" checked={viewOptions.isGmView} onChange={() => setViewOptions(v => ({ ...v, isGmView: !v.isGmView }))} className="hidden" />
                    <span>{viewOptions.isGmView ? 'Referee View' : 'Knight View'}</span>
                </label>
                
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }}/>
                <ToolbarButton onClick={handleImportClick} icon="upload">Import JSON</ToolbarButton>
                <ToolbarButton onClick={onExportJson} icon="download">Export JSON</ToolbarButton>
                <ToolbarButton onClick={onExportPng} icon="image-down">Export PNG</ToolbarButton>
            </div>
        </header>
    );
}