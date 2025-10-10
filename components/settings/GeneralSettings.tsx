/**
 * @file Component for the "General" tab in the main settings modal.
 */

import React from 'react';
import type { GenerationOptions, TileSet } from '../../types';
import { SettingsSection } from '../ui/SettingsSection';
import { Icon } from '../Icon';

/**
 * Props for the GeneralSettings component.
 */
interface GeneralSettingsProps {
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

/**
 * A component that renders the general settings for realm generation,
 * including map shape, size, points of interest, and myth settings.
 */
export const GeneralSettings = ({
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
}: GeneralSettingsProps) => {

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
        <div className="space-y-6">
            <SettingsSection title="Map Shape &amp; Size">
                <div>
                    <label htmlFor="realm-shape" className="block text-sm font-medium text-[#a7a984] mb-1">Shape</label>
                    <select id="realm-shape" value={realmShape} onChange={(e) => setRealmShape(e.target.value as 'hex' | 'square')} className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md">
                        <option value="hex">Hexagon</option>
                        <option value="square">Square</option>
                    </select>
                </div>
                {realmShape === 'hex' ? (
                    <div>
                        <label htmlFor="realm-radius" className="block text-sm font-medium text-[#a7a984] mb-1">Radius</label>
                        <input id="realm-radius" type="number" value={realmRadius} onChange={(e) => setRealmRadius(Math.max(3, parseInt(e.target.value, 10) || 1))} min="3" max="50" className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Realm radius" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="realm-width" className="block text-sm font-medium text-[#a7a984] mb-1">Width</label>
                            <input id="realm-width" type="number" value={realmWidth} onChange={(e) => setRealmWidth(Math.max(3, parseInt(e.target.value, 10) || 1))} min="3" max="50" className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Realm width" />
                        </div>
                        <div>
                            <label htmlFor="realm-height" className="block text-sm font-medium text-[#a7a984] mb-1">Height</label>
                            <input id="realm-height" type="number" value={realmHeight} onChange={(e) => setRealmHeight(Math.max(3, parseInt(e.target.value, 10) || 1))} min="3" max="50" className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Realm height" />
                        </div>
                    </div>
                )}
            </SettingsSection>
            <SettingsSection title="Points of Interest">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {tileSets.landmark.map(landmark => (
                        <div key={landmark.id} className="flex justify-between items-center">
                            <label htmlFor={`landmark-${landmark.id}`} className="text-sm text-[#a7a984]">{landmark.label}</label>
                            <input id={`landmark-${landmark.id}`} type="number" value={generationOptions.landmarks[landmark.id] || 0} onChange={(e) => handleLandmarkChange(landmark.id, e.target.value)} min="0" className="w-20 bg-[#324446] p-1 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label={`Number of ${landmark.label}`} />
                        </div>
                    ))}
                </div>
            </SettingsSection>
            <SettingsSection title="Myth &amp; Mystery">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="num-holdings" className="block text-sm font-medium text-[#a7a984] mb-1">Holdings</label>
                        <input id="num-holdings" type="number" value={generationOptions.numHoldings} onChange={(e) => setGenerationOptions(prev => ({ ...prev, numHoldings: Math.max(0, parseInt(e.target.value, 10) || 0) }))} min="0" className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Number of holdings" />
                    </div>
                    <div>
                        <label htmlFor="num-myths" className="block text-sm font-medium text-[#a7a984] mb-1">Myths</label>
                        <input id="num-myths" type="number" value={generationOptions.numMyths} onChange={(e) => setGenerationOptions(prev => ({ ...prev, numMyths: Math.max(0, parseInt(e.target.value, 10) || 0) }))} min="0" className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Number of myths" />
                    </div>
                </div>
                <div>
                    <label htmlFor="myth-min-distance" className="block text-sm font-medium text-[#a7a984] mb-1">Myth Min Distance</label>
                    <input id="myth-min-distance" type="number" value={generationOptions.mythMinDistance} onChange={(e) => setGenerationOptions(prev => ({ ...prev, mythMinDistance: Math.max(0, parseInt(e.target.value, 10) || 0) }))} min="0" className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label="Minimum distance between myths" />
                </div>
                <label htmlFor="generate-barriers" className="flex items-center justify-between pt-4 border-t border-[#41403f] cursor-pointer">
                    <span className="text-sm font-medium text-[#a7a984]">Generate Barriers</span>
                    <div className="relative">
                        <input id="generate-barriers" type="checkbox" checked={generationOptions.generateBarriers} onChange={(e) => setGenerationOptions(prev => ({ ...prev, generateBarriers: e.target.checked }))} className="sr-only peer" />
                        <div className="w-11 h-6 bg-[#324446] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#736b23]"></div>
                    </div>
                </label>
            </SettingsSection>
        </div>
    );
};