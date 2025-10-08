/**
 * @file A modal component for displaying all application settings.
 */

import React, { useState, useEffect } from 'react';
import type { GenerationOptions, TileSet } from '../../types';
import { Icon } from '../Icon';
import { SettingsTabButton } from '../ui/SettingsTabButton';
import { GeneralSettings } from './GeneralSettings';
import { GenerationSettings } from './GenerationSettings';
import { TerrainSettings } from './TerrainSettings';

/**
 * Props for the SettingsModal component.
 */
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settingsView: { tab: 'general' | 'generation' | 'terrain'; focusId: string | null };
  // Props for GeneralSettings
  realmShape: 'hex' | 'square';
  setRealmShape: React.Dispatch<React.SetStateAction<'hex' | 'square'>>;
  realmRadius: number;
  setRealmRadius: React.Dispatch<React.SetStateAction<number>>;
  realmWidth: number;
  setRealmWidth: React.Dispatch<React.SetStateAction<number>>;
  realmHeight: number;
  setRealmHeight: React.Dispatch<React.SetStateAction<number>>;
  // Props for multiple tabs
  generationOptions: GenerationOptions;
  setGenerationOptions: React.Dispatch<React.SetStateAction<GenerationOptions>>;
  tileSets: TileSet;
  setTileSets: React.Dispatch<React.SetStateAction<TileSet>>;
  // Props for GenerationSettings
  onGenerationOptionChange: <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => void;
  handleClusteringChange: (terrainA: string, terrainB: string, value: number) => void;
  handleTerrainBiasChange: (terrainId: string, value: number) => void;
  onApplyTemplate: (templateOptions: Partial<GenerationOptions>) => void;
}

/**
 * A full-screen modal that houses all application settings, organized into tabs.
 */
export const SettingsModal = ({ isOpen, onClose, settingsView, ...props }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'generation' | 'terrain'>(
    settingsView.tab
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(settingsView.tab);
    }
  }, [isOpen, settingsView.tab]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div className="bg-[#191f29] w-full max-w-6xl h-[90vh] rounded-lg shadow-xl flex overflow-hidden border border-[#41403f] animate-fade-in">
        {/* Left Sidebar for Tabs */}
        <aside className="w-64 bg-[#18272e] p-6 border-r border-[#41403f] flex flex-col">
          <h2 id="settings-dialog-title" className="text-2xl font-bold mb-8">
            Settings
          </h2>
          <nav className="flex flex-col gap-2">
            <SettingsTabButton
              icon="settings"
              label="General"
              isActive={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
            />
            <SettingsTabButton
              icon="network"
              label="Generation"
              isActive={activeTab === 'generation'}
              onClick={() => setActiveTab('generation')}
            />
            <SettingsTabButton
              icon="brush"
              label="Terrain"
              isActive={activeTab === 'terrain'}
              onClick={() => setActiveTab('terrain')}
            />
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="text-right p-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-1 text-[#a7a984] hover:text-[#eaebec] transition-colors"
              aria-label="Close settings"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-scroll px-8 pb-8">
            {activeTab === 'general' && (
              <GeneralSettings
                realmShape={props.realmShape}
                setRealmShape={props.setRealmShape}
                realmRadius={props.realmRadius}
                setRealmRadius={props.setRealmRadius}
                realmWidth={props.realmWidth}
                setRealmWidth={props.setRealmWidth}
                realmHeight={props.realmHeight}
                setRealmHeight={props.setRealmHeight}
                generationOptions={props.generationOptions}
                setGenerationOptions={props.setGenerationOptions}
                tileSets={props.tileSets}
              />
            )}
            {activeTab === 'generation' && (
              <GenerationSettings
                generationOptions={props.generationOptions}
                onGenerationOptionChange={props.onGenerationOptionChange}
                handleClusteringChange={props.handleClusteringChange}
                handleTerrainBiasChange={props.handleTerrainBiasChange}
                onApplyTemplate={props.onApplyTemplate}
                tileSets={props.tileSets}
              />
            )}
            {activeTab === 'terrain' && (
              <TerrainSettings
                tileSets={props.tileSets}
                setTileSets={props.setTileSets}
                focusId={settingsView.focusId}
              />
            )}
          </div>
        </main>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};
