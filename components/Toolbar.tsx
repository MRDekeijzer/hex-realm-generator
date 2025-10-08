import React, { useRef, useState, useEffect } from 'react';
// FIX: Import Myth type to handle backward compatibility for realm imports.
import type { ViewOptions, Realm, GenerationOptions, Myth } from '../types';
import { Icon } from './Icon';
import { TILE_SETS } from '../constants';

interface ToolbarProps {
  onGenerate: () => void;
  onReset: () => void;
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
}

interface ToolbarButtonProps {
    onClick: () => void;
    icon: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

const ToolbarButton = ({ onClick, icon, children, disabled }: ToolbarButtonProps) => (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={disabled}>
        <Icon name={icon} className="w-4 h-4" />
        {children}
    </button>
);

interface ViewToggleButtonProps {
    isChecked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: string;
    children?: React.ReactNode;
}

const ViewToggleButton = ({ isChecked, onChange, icon, children }: ViewToggleButtonProps) => (
    <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors cursor-pointer">
        <Icon name={icon} className="w-4 h-4" />
        <input type="checkbox" checked={isChecked} onChange={onChange} className="hidden" />
        <span>{children}</span>
    </label>
);

export function Toolbar({ 
    onGenerate, 
    onReset, 
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
    setGenerationOptions
}: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsPopoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };

        if (isSettingsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSettingsOpen]);


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

    return (
        <header className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700 shadow-md z-10">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white mr-4">Hex Realm Generator</h1>
                
                <ToolbarButton onClick={onGenerate} icon="sparkles">Generate</ToolbarButton>
                
                <div className="relative">
                    <ToolbarButton onClick={() => setIsSettingsOpen(prev => !prev)} icon="settings">
                        Settings
                    </ToolbarButton>
                    {isSettingsOpen && (
                        <div ref={settingsPopoverRef} className="absolute top-full mt-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-20 w-80">
                            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
                                <div>
                                    <label htmlFor="realm-shape" className="block text-sm font-medium text-gray-400 mb-1">Shape</label>
                                    <select
                                        id="realm-shape"
                                        value={realmShape}
                                        onChange={(e) => setRealmShape(e.target.value as 'hex' | 'square')}
                                        className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                    >
                                        <option value="hex">Hexagon</option>
                                        <option value="square">Square</option>
                                    </select>
                                </div>

                                {realmShape === 'hex' ? (
                                    <div>
                                        <label htmlFor="realm-radius" className="block text-sm font-medium text-gray-400 mb-1">Radius</label>
                                        <input
                                            id="realm-radius"
                                            type="number"
                                            value={realmRadius}
                                            onChange={(e) => setRealmRadius(Math.max(3, parseInt(e.target.value, 10) || 1))}
                                            min="3"
                                            max="50"
                                            className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                            aria-label="Realm radius"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="realm-width" className="block text-sm font-medium text-gray-400 mb-1">Width</label>
                                            <input
                                                id="realm-width"
                                                type="number"
                                                value={realmWidth}
                                                onChange={(e) => setRealmWidth(Math.max(3, parseInt(e.target.value, 10) || 1))}
                                                min="3"
                                                max="50"
                                                className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                                aria-label="Realm width"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="realm-height" className="block text-sm font-medium text-gray-400 mb-1">Height</label>
                                            <input
                                                id="realm-height"
                                                type="number"
                                                value={realmHeight}
                                                onChange={(e) => setRealmHeight(Math.max(3, parseInt(e.target.value, 10) || 1))}
                                                min="3"
                                                max="50"
                                                className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                                aria-label="Realm height"
                                            />
                                        </div>
                                    </div>
                                )}
                                <hr className="border-gray-600" />
                                <div className="space-y-3">
                                    <h3 className="text-md font-semibold text-gray-200">Generation Options</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="num-holdings" className="block text-sm font-medium text-gray-400 mb-1">Holdings</label>
                                            <input
                                                id="num-holdings"
                                                type="number"
                                                value={generationOptions.numHoldings}
                                                onChange={(e) => handleGenerationOptionChange('numHoldings', e.target.value)}
                                                min="0"
                                                className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                                aria-label="Number of holdings"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="num-myths" className="block text-sm font-medium text-gray-400 mb-1">Myths</label>
                                            <input
                                                id="num-myths"
                                                type="number"
                                                value={generationOptions.numMyths}
                                                onChange={(e) => handleGenerationOptionChange('numMyths', e.target.value)}
                                                min="0"
                                                className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                                aria-label="Number of myths"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="myth-min-distance" className="block text-sm font-medium text-gray-400 mb-1">Myth Min Distance</label>
                                        <input
                                            id="myth-min-distance"
                                            type="number"
                                            value={generationOptions.mythMinDistance}
                                            onChange={(e) => handleGenerationOptionChange('mythMinDistance', e.target.value)}
                                            min="0"
                                            className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                            aria-label="Minimum distance between myths"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-sm font-semibold text-gray-300">Landmarks per Type</h4>
                                        {TILE_SETS.landmark.map(landmark => (
                                            <div key={landmark.id} className="flex justify-between items-center">
                                                <label htmlFor={`landmark-${landmark.id}`} className="text-sm text-gray-400">{landmark.label}</label>
                                                <input
                                                    id={`landmark-${landmark.id}`}
                                                    type="number"
                                                    value={generationOptions.landmarks[landmark.id] || 0}
                                                    onChange={(e) => handleLandmarkChange(landmark.id, e.target.value)}
                                                    min="0"
                                                    className="w-20 bg-gray-700 p-1 text-sm text-center font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                                                    aria-label={`Number of ${landmark.label}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ToolbarButton onClick={onReset} icon="reset">Reset</ToolbarButton>
                <div className="h-6 w-px bg-gray-700 mx-1"></div>
                <ToolbarButton onClick={onUndo} icon="undo" disabled={!canUndo}>Undo</ToolbarButton>
                <ToolbarButton onClick={onRedo} icon="redo" disabled={!canRedo}>Redo</ToolbarButton>
            </div>
            <div className="flex items-center gap-2">
                <ViewToggleButton isChecked={viewOptions.isGmView} onChange={() => setViewOptions(v => ({ ...v, isGmView: !v.isGmView }))} icon="eye">
                    GM View
                </ViewToggleButton>
                 <ViewToggleButton isChecked={viewOptions.showGrid} onChange={() => setViewOptions(v => ({ ...v, showGrid: !v.showGrid }))} icon="grid">
                    Grid
                </ViewToggleButton>
                
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }}/>
                <ToolbarButton onClick={handleImportClick} icon="upload">Import JSON</ToolbarButton>
                <ToolbarButton onClick={onExportJson} icon="download">Export JSON</ToolbarButton>
                <ToolbarButton onClick={onExportPng} icon="image-down">Export PNG</ToolbarButton>
            </div>
        </header>
    );
}