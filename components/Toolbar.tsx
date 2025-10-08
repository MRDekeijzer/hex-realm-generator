// FIX: Corrected syntax error in React import statement by removing extra comma.
import React, { useRef, useState, useEffect, useMemo } from 'react';
// FIX: Import Myth type to handle backward compatibility for realm imports.
import type { ViewOptions, Realm, GenerationOptions, Myth, TileSet, HighlandFormation } from '../types';
import { Icon } from './Icon';
import { DEFAULT_GRID_COLOR, DEFAULT_GRID_WIDTH, TERRAIN_TEMPLATES } from '../constants';

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
  onGenerationOptionChange: (key: keyof GenerationOptions, value: any) => void;
  handleClusteringChange: (terrainA: string, terrainB: string, value: number) => void;
  handleTerrainBiasChange: (terrainId: string, value: number) => void;
  onApplyTemplate: (templateOptions: Partial<GenerationOptions>) => void;
  tileSets: TileSet;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
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

const SettingSlider = ({ label, tooltip, value, onChange, min = 0, max = 1, step = 0.01, displayMultiplier = 100, displaySuffix = '%' }: { label: string, tooltip?: string, value: number, onChange: (value: number) => void, min?: number, max?: number, step?: number, displayMultiplier?: number, displaySuffix?: string }) => {
    const inputId = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <label htmlFor={inputId} className="text-sm font-medium text-[#a7a984]">{label}</label>
                    {tooltip && (
                        <div className="relative group">
                            <Icon name="help-circle" className="w-4 h-4 text-[#a7a984] cursor-help" />
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-[#18272e] text-xs text-[#eaebec] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-[#41403f]">
                                {tooltip}
                            </div>
                        </div>
                    )}
                </div>
                <span className="px-2 py-0.5 bg-[#324446] rounded-md text-xs">{Math.round(value * displayMultiplier)}{displaySuffix}</span>
            </div>
            <input
                id={inputId}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#324446] rounded-lg appearance-none cursor-pointer accent-[#736b23]"
            />
        </div>
    );
};

const SettingsTabButton = ({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full text-left p-3 rounded-md transition-colors ${
            isActive
                ? 'bg-[#736b23] text-[#eaebec]'
                : 'text-[#a7a984] hover:bg-[#324446]'
        }`}
    >
        <Icon name={icon} className="w-5 h-5" />
        <span className="font-medium">{label}</span>
    </button>
);

const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <h3 className="text-md font-semibold text-[#eaebec] mb-2">{title}</h3>
        <div className="space-y-4 p-4 bg-[#18272e] rounded-md border border-[#41403f]">
            {children}
        </div>
    </div>
);


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
    onGenerationOptionChange,
    handleClusteringChange,
    handleTerrainBiasChange,
    onApplyTemplate,
    tileSets,
    isSettingsOpen,
    setIsSettingsOpen
}: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const settingsModalBackdropRef = useRef<HTMLDivElement>(null);
    const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false);
    const gridSettingsPopoverRef = useRef<HTMLDivElement>(null);
    const gridSettingsButtonRef = useRef<HTMLButtonElement>(null);
    const gridColorInputRef = useRef<HTMLInputElement>(null);
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'generation'>('general');

    const formationOptions = useMemo(() => [
        {
          id: 'random',
          name: 'Random',
          icon: 'sparkles',
          description: [
            'Ignores formation shape entirely.',
            'Terrain elevation is based purely on noise.',
            'Generates a chaotic, unpredictable landscape.',
          ],
        },
        {
          id: 'linear',
          name: 'Linear',
          icon: 'arrow-up',
          description: [
            'Creates a linear slope across the map.',
            'Highlands form towards the arrow\'s tip.',
            'Good for continents or large mountain ranges.',
          ],
        },
        {
          id: 'circle',
          name: 'Circle',
          icon: 'circle',
          description: [
            'Creates a circular formation in the center.',
            'Highlands form inside the circle.',
            'Good for central mountains or, when inverted, a central sea.',
          ],
        },
        {
          id: 'triangle',
          name: 'Triangle',
          icon: 'triangle',
          description: [
            'Creates a triangular formation in the center.',
            'Highlands form inside the triangle.',
            'Good for unique landmasses or, when inverted, a bay or gulf.',
          ],
        },
    ], []);
    
    useEffect(() => {
        if (generationOptions.highlandFormation === 'triangle' && generationOptions.highlandFormationRotation > 120) {
            onGenerationOptionChange('highlandFormationRotation', 120);
        }
    }, [generationOptions.highlandFormation, generationOptions.highlandFormationRotation, onGenerationOptionChange]);

    useEffect(() => {
        const handleCloseEvents = (event: MouseEvent | KeyboardEvent) => {
             // Handle Escape key for both modal and popover
            if (event instanceof KeyboardEvent && event.key === 'Escape') {
                setIsSettingsOpen(false);
                setIsGridSettingsOpen(false);
            }
            
            // Handle clicks outside the grid settings popover
            if (event instanceof MouseEvent) {
                 if (gridSettingsPopoverRef.current && !gridSettingsPopoverRef.current.contains(event.target as Node) && !gridSettingsButtonRef.current?.contains(event.target as Node)) {
                    setIsGridSettingsOpen(false);
                }
            }
        };

        if (isSettingsOpen || isGridSettingsOpen) {
            document.addEventListener('mousedown', handleCloseEvents as EventListener);
            document.addEventListener('keydown', handleCloseEvents as EventListener);
        }

        return () => {
            document.removeEventListener('mousedown', handleCloseEvents as EventListener);
            document.removeEventListener('keydown', handleCloseEvents as EventListener);
        };
    }, [isSettingsOpen, isGridSettingsOpen, setIsSettingsOpen]);
    
    const handleSettingsBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === settingsModalBackdropRef.current) {
            setIsSettingsOpen(false);
        }
    };


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

    const handleBiasInputChange = (e: React.ChangeEvent<HTMLInputElement>, terrainId: string) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value)) value = 0;
        value = Math.max(0, value);
        handleTerrainBiasChange(terrainId, value);
    };


    return (
        <header className="flex items-center justify-between p-2 bg-[#191f29] border-b border-[#41403f] shadow-md z-10">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#eaebec] mr-4">Hex Realm Generator</h1>
                
                <ToolbarButton onClick={onGenerate} icon="sparkles">Generate</ToolbarButton>
                
                <ToolbarButton onClick={() => setIsSettingsOpen(true)} icon="settings">
                    Settings
                </ToolbarButton>
                {isSettingsOpen && (
                    <div
                        ref={settingsModalBackdropRef}
                        onClick={handleSettingsBackdropClick}
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="settings-dialog-title"
                    >
                        <div className="bg-[#191f29] w-full max-w-6xl h-[90vh] rounded-lg shadow-xl flex overflow-hidden border border-[#41403f] animate-fade-in">
                            {/* Left Sidebar for Tabs */}
                            <aside className="w-64 bg-[#18272e] p-6 border-r border-[#41403f] flex flex-col">
                                <h2 id="settings-dialog-title" className="text-2xl font-bold mb-8">Settings</h2>
                                <nav className="flex flex-col gap-2">
                                    <SettingsTabButton icon="settings" label="General" isActive={activeSettingsTab === 'general'} onClick={() => setActiveSettingsTab('general')} />
                                    <SettingsTabButton icon="network" label="Generation" isActive={activeSettingsTab === 'generation'} onClick={() => setActiveSettingsTab('generation')} />
                                </nav>
                            </aside>

                            {/* Right Content Area */}
                            <main className="flex-1 flex flex-col">
                                <div className="text-right p-4 flex-shrink-0">
                                    <button 
                                        onClick={() => setIsSettingsOpen(false)} 
                                        className="p-2 rounded-full bg-[#18272e] hover:bg-[#435360] transition-colors"
                                        aria-label="Close settings"
                                    >
                                        <Icon name="close" className="w-6 h-6"/>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto px-8 pb-8">
                                {activeSettingsTab === 'general' && (
                                    <div className="space-y-6">
                                        <SettingsSection title="Map Shape &amp; Size">
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
                                        </SettingsSection>
                                        <SettingsSection title="Points of Interest">
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
                                        </SettingsSection>
                                        <SettingsSection title="Myth &amp; Mystery">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="num-holdings" className="block text-sm font-medium text-[#a7a984] mb-1">Holdings</label>
                                                    <input
                                                        id="num-holdings"
                                                        type="number"
                                                        value={generationOptions.numHoldings}
                                                        onChange={(e) => setGenerationOptions(prev => ({ ...prev, numHoldings: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
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
                                                        onChange={(e) => setGenerationOptions(prev => ({ ...prev, numMyths: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
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
                                                    onChange={(e) => setGenerationOptions(prev => ({ ...prev, mythMinDistance: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                                                    min="0"
                                                    className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                    aria-label="Minimum distance between myths"
                                                />
                                            </div>
                                            <label htmlFor="generate-barriers" className="flex items-center justify-between pt-4 border-t border-[#41403f] cursor-pointer">
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
                                        </SettingsSection>
                                    </div>
                                )}
                                {activeSettingsTab === 'generation' && (
                                    <div className="space-y-6">
                                        <SettingsSection title="Terrain Generation Templates">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {Object.values(TERRAIN_TEMPLATES).map(template => (
                                                    <button 
                                                        key={template.name} 
                                                        onClick={() => onApplyTemplate(template.options)}
                                                        className="p-3 bg-[#324446] rounded-md hover:bg-[#435360] transition-colors text-center text-sm font-medium text-[#a7a984]"
                                                    >
                                                        {template.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </SettingsSection>
                                        
                                        <SettingsSection title="Highland Formation">
                                            <div className="grid grid-cols-2 gap-2">
                                                {formationOptions.map(option => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => onGenerationOptionChange('highlandFormation', option.id as HighlandFormation)}
                                                        className={`p-4 rounded-md text-left transition-all duration-150 border-2 h-full ${
                                                            generationOptions.highlandFormation === option.id
                                                                ? 'bg-[#736b23]/20 border-[#736b23] text-[#eaebec]'
                                                                : 'bg-[#191f29] border-[#41403f] hover:border-[#a7a984] text-[#a7a984]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <Icon name={option.icon} className="w-6 h-6 flex-shrink-0" />
                                                            <h4 className="font-bold text-lg">{option.name}</h4>
                                                        </div>
                                                        <ul className="list-disc space-y-1 pl-5 text-xs">
                                                            {option.description.map((item, index) => <li key={index}>{item}</li>)}
                                                        </ul>
                                                    </button>
                                                ))}
                                            </div>

                                            {generationOptions.highlandFormation === 'random' ? (
                                                <p className="text-sm text-center text-[#a7a984] py-4">No formation settings available for Random.</p>
                                            ) : (
                                                <div className="space-y-4 pt-4 border-t border-[#41403f]">
                                                    <SettingSlider
                                                        label="Formation Strength"
                                                        value={generationOptions.highlandFormationStrength}
                                                        onChange={(v) => onGenerationOptionChange('highlandFormationStrength', v)}
                                                        tooltip="Controls the intensity of the highland formation shape."
                                                    />

                                                    {(generationOptions.highlandFormation === 'linear' || generationOptions.highlandFormation === 'triangle') && (
                                                        <div className="grid grid-cols-2 gap-4 items-center pt-4 border-t border-[#41403f]">
                                                            <div>
                                                                <SettingSlider
                                                                    label="Formation Rotation"
                                                                    value={generationOptions.highlandFormationRotation}
                                                                    onChange={(v) => onGenerationOptionChange('highlandFormationRotation', v)}
                                                                    min={0}
                                                                    max={generationOptions.highlandFormation === 'triangle' ? 120 : 360}
                                                                    step={1}
                                                                    displayMultiplier={1}
                                                                    displaySuffix="°"
                                                                    tooltip="Sets the orientation of the selected formation."
                                                                />
                                                            </div>
                                                            <div className="flex flex-col items-center justify-center text-center">
                                                                <Icon 
                                                                    name={generationOptions.highlandFormation === 'triangle' ? 'triangle' : 'arrow-up'}
                                                                    className="w-8 h-8 mx-auto mb-2 text-[#a7a984]" 
                                                                    style={{ transform: `rotate(${generationOptions.highlandFormationRotation}deg)`}}
                                                                />
                                                                <p className="text-xs text-[#a7a984]">
                                                                   Lowlands start at the base and highlands form towards the tip.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(generationOptions.highlandFormation === 'circle' || generationOptions.highlandFormation === 'triangle') && (
                                                        <label htmlFor="invert-formation" className="flex items-center justify-between pt-4 border-t border-[#41403f] cursor-pointer">
                                                            <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-[#a7a984]">Invert Formation</span>
                                                            <span className="text-xs text-[#a7a984]">Flips highlands and lowlands for this shape.</span>
                                                            </div>
                                                            <div className="relative">
                                                                <input 
                                                                    id="invert-formation"
                                                                    type="checkbox" 
                                                                    checked={generationOptions.highlandFormationInverse || false} 
                                                                    onChange={(e) => onGenerationOptionChange('highlandFormationInverse', e.target.checked)} 
                                                                    className="sr-only peer" 
                                                                />
                                                                <div className="w-11 h-6 bg-[#324446] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#736b23]"></div>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                            )}
                                        </SettingsSection>
                                        
                                        <SettingsSection title="Terrain Biases">
                                            <p className="text-xs text-[#a7a984] !mt-0">Set relative weights for each terrain type. Higher numbers mean more of that terrain will be generated.</p>
                                            <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                                                {tileSets.terrain.map(terrain => (
                                                    <div key={terrain.id} className="flex justify-between items-center">
                                                        <label htmlFor={`terrain-bias-${terrain.id}`} className="text-sm text-[#a7a984] flex items-center gap-2">
                                                            <Icon name={terrain.icon} className="w-4 h-4" />
                                                            {terrain.label}
                                                        </label>
                                                        <input
                                                            id={`terrain-bias-${terrain.id}`}
                                                            type="number"
                                                            value={Math.round(generationOptions.terrainBiases[terrain.id] || 0)}
                                                            onChange={(e) => handleBiasInputChange(e, terrain.id)}
                                                            min="0"
                                                            className="w-20 bg-[#324446] p-1 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                                                            aria-label={`Bias for ${terrain.label}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </SettingsSection>

                                        <SettingsSection title="Terrain Clustering">
                                            <SettingSlider
                                                label="Terrain Clusteredness"
                                                value={1 - generationOptions.terrainRoughness}
                                                onChange={(v) => onGenerationOptionChange('terrainRoughness', 1 - v)}
                                                tooltip="Adjusts how large terrain clusters are. Higher values create large, smooth regions (more clustered). Lower values result in more chaotic, mixed landscapes (less clustered). This directly modifies the matrix below."
                                            />
                                            <div className="pt-4 border-t border-[#41403f]">
                                                <p className="text-sm text-[#a7a984]">The matrix below controls how strongly different terrain types attract each other. Higher values create stronger bonds. It is automatically adjusted by the Clusteredness slider.</p>
                                                <div className="overflow-auto max-h-[calc(80vh-150px)] bg-[#191f29] rounded-md border border-[#41403f] mt-2">
                                                    <table className="w-full border-collapse text-xs whitespace-nowrap">
                                                        <thead className="sticky top-0 bg-[#191f29] z-10">
                                                            <tr>
                                                                <th className="sticky left-0 bg-[#191f29] p-2 border-r border-b border-[#41403f] w-28"></th>
                                                                {tileSets.terrain.map(t => (
                                                                    <th key={t.id} className="p-1 border-b border-[#41403f] text-center font-medium" title={t.label}>
                                                                        <div className="flex justify-center items-center h-full w-8 mx-auto">
                                                                            <Icon name={t.icon} className="w-5 h-5" />
                                                                        </div>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tileSets.terrain.map((rowTerrain, rowIndex) => (
                                                                <tr key={rowTerrain.id}>
                                                                    <th className="sticky left-0 bg-[#18272e] p-2 border-r border-b border-[#41403f] text-left font-medium group flex items-center gap-2 w-28">
                                                                        <Icon name={rowTerrain.icon} className="w-5 h-5 flex-shrink-0" />
                                                                        <span className="truncate">{rowTerrain.label}</span>
                                                                    </th>
                                                                    {tileSets.terrain.map((colTerrain, colIndex) => {
                                                                        if (colIndex > rowIndex) {
                                                                            return <td key={colTerrain.id} className="p-1 border-b border-[#41403f] bg-[#191f29]/50"></td>;
                                                                        }
                                                                        const value = generationOptions.terrainClusteringMatrix[rowTerrain.id]?.[colTerrain.id] ?? 0.5;
                                                                        return (
                                                                            <td key={colTerrain.id} className="p-1 border-b border-[#41403f] text-center">
                                                                                <input
                                                                                    type="number"
                                                                                    min="0" max="100" step="1"
                                                                                    value={Math.round(value * 100)}
                                                                                    onChange={e => {
                                                                                        let numValue = parseInt(e.target.value, 10);
                                                                                        if (isNaN(numValue)) numValue = 0;
                                                                                        numValue = Math.max(0, Math.min(100, numValue));
                                                                                        handleClusteringChange(rowTerrain.id, colTerrain.id, numValue / 100);
                                                                                    }}
                                                                                    className="w-14 bg-[#324446] p-1 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-1 focus:ring-[#736b23] rounded-md"
                                                                                    title={`${rowTerrain.label} <> ${colTerrain.label}: ${Math.round(value * 100)}`}
                                                                                />
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </SettingsSection>
                                    </div>
                                )}
                                </div>
                            </main>
                        </div>
                        <style>{`
                            @keyframes fade-in {
                                from { opacity: 0; transform: scale(0.98); }
                                to { opacity: 1; transform: scale(1); }
                            }
                            .animate-fade-in {
                                animation: fade-in 0.2s ease-out forwards;
                            }
                        `}</style>
                    </div>
                )}

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