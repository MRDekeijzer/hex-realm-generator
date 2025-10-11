/**
 * @file Toolbar.tsx
 * This component renders the main header bar of the application.
 * It contains primary actions like generating a new realm, undo/redo, import/export,
 * and provides access to the main settings modal and grid view options.
 */

import React, { useRef, useState, useEffect } from 'react';
import type { ViewOptions, Realm, GenerationOptions, TileSet } from '@/features/realm/types';
import { ToolbarButton } from './ui/ToolbarButton';
import { SettingsModal } from './settings/SettingsModal';
import { GridSettingsPopover } from './GridSettingsPopover';
import type { ConfirmationState } from '@/app/App';

/**
 * Props for the Toolbar component.
 */
interface ToolbarProps {
  onGenerate: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onImportJson: (realm: Realm) => void;
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
  onGenerationOptionChange: <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => void;
  handleClusteringChange: (terrainA: string, terrainB: string, value: number) => void;
  handleTerrainBiasChange: (terrainId: string, value: number) => void;
  onApplyTemplate: (templateOptions: Partial<GenerationOptions>) => void;
  tileSets: TileSet;
  setTileSets: React.Dispatch<React.SetStateAction<TileSet>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  settingsView: { tab: 'general' | 'generation' | 'terrain'; focusId: string | null };
  setSettingsView: React.Dispatch<
    React.SetStateAction<{ tab: 'general' | 'generation' | 'terrain'; focusId: string | null }>
  >;
  setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState | null>>;
}

/**
 * The main application toolbar component.
 */
export function Toolbar({
  onGenerate,
  onExportJson,
  onExportPng,
  onImportJson,
  viewOptions,
  setViewOptions,
  isSettingsOpen,
  setIsSettingsOpen,
  settingsView,
  setSettingsView,
  setConfirmation,
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
        if (
          gridSettingsPopoverRef.current &&
          !gridSettingsPopoverRef.current.contains(event.target as Node) &&
          !gridSettingsButtonRef.current?.contains(event.target as Node)
        ) {
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
          const fileContent = e.target?.result;
          if (typeof fileContent !== 'string') throw new Error('File could not be read.');
          const loadedData = JSON.parse(fileContent);
          // Basic validation and backward compatibility for older formats
          if (!loadedData.hexes || !loadedData.seatOfPower) throw new Error('Invalid realm file.');
          if (!loadedData.myths) {
            loadedData.myths = [];
            loadedData.hexes.forEach((hex: { myth: number; q: number; r: number }) => {
              if (hex.myth)
                loadedData.myths.push({
                  id: hex.myth,
                  name: `Myth #${hex.myth}`,
                  q: hex.q,
                  r: hex.r,
                });
            });
          }
          onImportJson(loadedData as Realm);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error.';
          setConfirmation({
            isOpen: true,
            title: 'Import Failed',
            message: `Failed to import realm. The file might be corrupted or in the wrong format. \nError: ${message}`,
            onConfirm: () => setConfirmation(null),
            isInfo: true,
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenSettings = () => {
    setSettingsView({ tab: 'general', focusId: null });
    setIsSettingsOpen(true);
  };

  return (
    <header className="flex items-center justify-between p-2 bg-realm-canvas-backdrop border-b border-border-panel-divider shadow-md z-10">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-text-high-contrast mr-4">
          Hex Realm Generator
        </h1>
        <ToolbarButton onClick={onGenerate} icon="sparkles" title="Generate New Realm">
          Generate
        </ToolbarButton>
        <ToolbarButton onClick={handleOpenSettings} icon="settings" title="Settings">
          Settings
        </ToolbarButton>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settingsView={settingsView}
          {...settingsProps}
        />

        <div className="border-l border-border-panel-divider h-6"></div>

        <div className="relative">
          <ToolbarButton
            ref={gridSettingsButtonRef}
            onClick={() => setIsGridSettingsOpen((prev) => !prev)}
            icon="grid"
            title="Grid Settings"
          >
            Grid
          </ToolbarButton>
          {isGridSettingsOpen && (
            <GridSettingsPopover
              ref={gridSettingsPopoverRef}
              viewOptions={viewOptions}
              setViewOptions={setViewOptions}
            />
          )}
        </div>

        <div className="border-l border-border-panel-divider h-6"></div>

        <ToolbarButton
          onClick={() => setViewOptions((v) => ({ ...v, showIconSpray: !v.showIconSpray }))}
          icon="spray-can"
          isActive={viewOptions.showIconSpray}
          title="Toggle Icon Spray"
        >
          Icon Spray
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setViewOptions((v) => ({ ...v, isGmView: !v.isGmView }))}
          icon="eye"
          isActive={viewOptions.isGmView}
          title={viewOptions.isGmView ? 'Referee View' : 'Knight View'}
        >
          {viewOptions.isGmView ? 'Referee View' : 'Knight View'}
        </ToolbarButton>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          icon="upload"
          title="Import from JSON file"
        >
          Import JSON
        </ToolbarButton>
        <ToolbarButton onClick={onExportJson} icon="download" title="Export as JSON file">
          Export JSON
        </ToolbarButton>
        <ToolbarButton onClick={onExportPng} icon="image-down" title="Export as PNG image">
          Export PNG
        </ToolbarButton>
      </div>
    </header>
  );
}

