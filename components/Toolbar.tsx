/**
 * @file Toolbar.tsx
 * This component renders the main header bar of the application.
 * It contains primary actions like generating a new realm, undo/redo, import/export,
 * and provides access to the main settings modal and grid view options.
 */

import React, { useRef, useState, useEffect } from 'react';
import type { ViewOptions, Realm, GenerationOptions, Myth, TileSet } from '../types';
import { ToolbarButton } from './ui/ToolbarButton';
import { SettingsModal } from './settings/SettingsModal';
import { GridSettingsPopover } from './GridSettingsPopover';
import { Icon } from './Icon';

/**
 * Props for the Toolbar component.
 */
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

/**
 * The main application toolbar component.
 */
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
    isSettingsOpen,
    setIsSettingsOpen,
    ...settingsProps
}: ToolbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false);
    const gridSettingsPopoverRef = useRef<HTMLDivElement>(null);
    const gridSettingsButtonRef = useRef<HTMLButtonElement>(null);

    /**
     * Effect to handle closing the settings modal or grid popover when clicking
     * outside of them or pressing the Escape key.
     */
    useEffect(() => {
        const handleCloseEvents = (event: MouseEvent | KeyboardEvent) => {
            if (event instanceof KeyboardEvent && event.key === 'Escape') {
                setIsSettingsOpen(false);
                setIsGridSettingsOpen(false);
            }
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

    /**
     * Handles the file selection for importing a realm.
     */
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedData = JSON.parse(e.target?.result as string);
                    // Basic validation and backward compatibility for older formats
                    if (!loadedData.hexes || !loadedData.seatOfPower) throw new Error("Invalid realm file.");
                    if (!loadedData.myths) {
                        loadedData.myths = [];
                        loadedData.hexes.forEach((hex: any) => {
                            if (hex.myth) loadedData.myths.push({ id: hex.myth, name: `Myth #${hex.myth}`, q: hex.q, r: hex.r });
                        });
                    }
                    onImportJson(loadedData as Realm);
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Failed to import realm. The file might be corrupted or in the wrong format.");
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <header className="flex items-center justify-between p-2 bg-[#191f29] border-b border-[#41403f] shadow-md z-10">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#eaebec] mr-4">Hex Realm Generator</h1>
                <ToolbarButton onClick={onGenerate} icon="sparkles">Generate</ToolbarButton>
                <ToolbarButton onClick={() => setIsSettingsOpen(true)} icon="settings">Settings</ToolbarButton>
                
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    {...settingsProps}
                />

                <div className="h-6 w-px bg-[#41403f] mx-1"></div>

                <div className="relative">
                    <ToolbarButton ref={gridSettingsButtonRef} onClick={() => setIsGridSettingsOpen(prev => !prev)} icon="grid">
                        Grid
                    </ToolbarButton>
                    {isGridSettingsOpen && <GridSettingsPopover ref={gridSettingsPopoverRef} viewOptions={viewOptions} setViewOptions={setViewOptions} />}
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
                <ToolbarButton onClick={() => fileInputRef.current?.click()} icon="upload">Import JSON</ToolbarButton>
                <ToolbarButton onClick={onExportJson} icon="download">Export JSON</ToolbarButton>
                <ToolbarButton onClick={onExportPng} icon="image-down">Export PNG</ToolbarButton>
            </div>
        </header>
    );
}