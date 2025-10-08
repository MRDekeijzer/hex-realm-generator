/**
 * @file Component for the "Generation" tab in the main settings modal.
 */

import React, { useMemo, useEffect } from 'react';
import type { GenerationOptions, TileSet, HighlandFormation } from '../../types';
import { TERRAIN_TEMPLATES } from '../../constants';
import { SettingsSection } from '../ui/SettingsSection';
import { SettingSlider } from '../ui/SettingSlider';
import { Icon } from '../Icon';

/**
 * Props for the GenerationSettings component.
 */
interface GenerationSettingsProps {
    generationOptions: GenerationOptions;
    onGenerationOptionChange: (key: keyof GenerationOptions, value: any) => void;
    handleClusteringChange: (terrainA: string, terrainB: string, value: number) => void;
    handleTerrainBiasChange: (terrainId: string, value: number) => void;
    onApplyTemplate: (templateOptions: Partial<GenerationOptions>) => void;
    tileSets: TileSet;
}

/**
 * A component that renders advanced terrain generation settings, including
 * templates, highland formation, terrain biases, and clustering.
 */
export const GenerationSettings = ({
    generationOptions,
    onGenerationOptionChange,
    handleClusteringChange,
    handleTerrainBiasChange,
    onApplyTemplate,
    tileSets
}: GenerationSettingsProps) => {

    const formationOptions = useMemo(() => [
        { id: 'random', name: 'Random', icon: 'sparkles', description: ['Ignores formation shape.', 'Elevation is purely noise-based.', 'Generates a chaotic landscape.'] },
        { id: 'linear', name: 'Linear', icon: 'arrow-up', description: ['Creates a linear slope.', 'Highlands form at arrow\'s tip.', 'Good for continents.'] },
        { id: 'circle', name: 'Circle', icon: 'circle', description: ['Creates a circular formation.', 'Highlands form inside.', 'Good for central mountains.'] },
        { id: 'triangle', name: 'Triangle', icon: 'triangle', description: ['Creates a triangular formation.', 'Highlands form inside.', 'Good for unique landmasses.'] },
    ], []);

    useEffect(() => {
        if (generationOptions.highlandFormation === 'triangle' && generationOptions.highlandFormationRotation > 120) {
            onGenerationOptionChange('highlandFormationRotation', 120);
        }
    }, [generationOptions.highlandFormation, generationOptions.highlandFormationRotation, onGenerationOptionChange]);

    const handleBiasInputChange = (e: React.ChangeEvent<HTMLInputElement>, terrainId: string) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value)) value = 0;
        handleTerrainBiasChange(terrainId, Math.max(0, value));
    };

    return (
        <div className="space-y-6">
            <SettingsSection title="Terrain Generation Templates">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.values(TERRAIN_TEMPLATES).map(template => (
                        <button key={template.name} onClick={() => onApplyTemplate(template.options)} className="p-3 bg-[#324446] rounded-md hover:bg-[#435360] transition-colors text-center text-sm font-medium text-[#a7a984]">
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
                            className={`p-4 rounded-md text-left transition-all duration-150 border-2 h-full ${generationOptions.highlandFormation === option.id ? 'bg-[#736b23]/20 border-[#736b23] text-[#eaebec]' : 'bg-[#191f29] border-[#41403f] hover:border-[#a7a984] text-[#a7a984]'}`}
                        >
                            <div className="flex items-center gap-3 mb-2"><Icon name={option.icon} className="w-6 h-6 flex-shrink-0" /><h4 className="font-bold text-lg">{option.name}</h4></div>
                            <ul className="list-disc space-y-1 pl-5 text-xs">{option.description.map((item, index) => <li key={index}>{item}</li>)}</ul>
                        </button>
                    ))}
                </div>

                {generationOptions.highlandFormation !== 'random' && (
                    <div className="space-y-4 pt-4 border-t border-[#41403f]">
                        <SettingSlider label="Formation Strength" value={generationOptions.highlandFormationStrength} onChange={(v) => onGenerationOptionChange('highlandFormationStrength', v)} tooltip="Controls the intensity of the highland formation shape." />
                        {(generationOptions.highlandFormation === 'linear' || generationOptions.highlandFormation === 'triangle') && (
                            <div className="grid grid-cols-2 gap-4 items-center pt-4 border-t border-[#41403f]">
                                <div><SettingSlider label="Formation Rotation" value={generationOptions.highlandFormationRotation} onChange={(v) => onGenerationOptionChange('highlandFormationRotation', v)} min={0} max={generationOptions.highlandFormation === 'triangle' ? 120 : 360} step={1} displayMultiplier={1} displaySuffix="°" tooltip="Sets the orientation of the selected formation." /></div>
                                <div className="flex flex-col items-center justify-center text-center">
                                    <Icon name={generationOptions.highlandFormation === 'triangle' ? 'triangle' : 'arrow-up'} className="w-8 h-8 mx-auto mb-2 text-[#a7a984]" style={{ transform: `rotate(${generationOptions.highlandFormationRotation}deg)`}} />
                                    <p className="text-xs text-[#a7a984]">Lowlands start at the base and highlands form towards the tip.</p>
                                </div>
                            </div>
                        )}
                        {(generationOptions.highlandFormation === 'circle' || generationOptions.highlandFormation === 'triangle') && (
                            <label htmlFor="invert-formation" className="flex items-center justify-between pt-4 border-t border-[#41403f] cursor-pointer">
                                <div className="flex flex-col"><span className="text-sm font-medium text-[#a7a984]">Invert Formation</span><span className="text-xs text-[#a7a984]">Flips highlands and lowlands.</span></div>
                                <div className="relative"><input id="invert-formation" type="checkbox" checked={generationOptions.highlandFormationInverse || false} onChange={(e) => onGenerationOptionChange('highlandFormationInverse', e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-[#324446] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#736b23]"></div></div>
                            </label>
                        )}
                    </div>
                )}
            </SettingsSection>

            <SettingsSection title="Terrain Biases">
                <p className="text-xs text-[#a7a984] !mt-0">Set relative weights. Higher numbers mean more of that terrain.</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                    {tileSets.terrain.map(terrain => (
                        <div key={terrain.id} className="flex justify-between items-center">
                            <label htmlFor={`terrain-bias-${terrain.id}`} className="text-sm text-[#a7a984] flex items-center gap-2"><Icon name={terrain.icon} className="w-4 h-4" />{terrain.label}</label>
                            <input id={`terrain-bias-${terrain.id}`} type="number" value={Math.round(generationOptions.terrainBiases[terrain.id] || 0)} onChange={(e) => handleBiasInputChange(e, terrain.id)} min="0" className="w-20 bg-[#324446] p-1 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" aria-label={`Bias for ${terrain.label}`} />
                        </div>
                    ))}
                </div>
            </SettingsSection>

            <SettingsSection title="Terrain Clustering">
                <SettingSlider label="Terrain Clusteredness" value={1 - generationOptions.terrainRoughness} onChange={(v) => onGenerationOptionChange('terrainRoughness', 1 - v)} tooltip="Higher values create large, smooth regions. Lower values result in chaotic, mixed landscapes." />
                <div className="pt-4 border-t border-[#41403f]">
                    <p className="text-sm text-[#a7a984]">This matrix controls how terrain types attract each other. It is adjusted by the slider above.</p>
                    <div className="overflow-auto max-h-[calc(80vh-150px)] bg-[#191f29] rounded-md border border-[#41403f] mt-2">
                        <table className="w-full border-collapse text-xs whitespace-nowrap">
                            <thead className="sticky top-0 bg-[#191f29] z-10"><tr><th className="sticky left-0 bg-[#191f29] p-2 border-r border-b border-[#41403f] w-28"></th>{tileSets.terrain.map(t => (<th key={t.id} className="p-1 border-b border-[#41403f] text-center font-medium" title={t.label}><div className="flex justify-center items-center h-full w-8 mx-auto"><Icon name={t.icon} className="w-5 h-5" /></div></th>))}</tr></thead>
                            <tbody>{tileSets.terrain.map((rowTerrain, rowIndex) => (<tr key={rowTerrain.id}><th className="sticky left-0 bg-[#18272e] p-2 border-r border-b border-[#41403f] text-left font-medium flex items-center gap-2 w-28"><Icon name={rowTerrain.icon} className="w-5 h-5 flex-shrink-0" /><span className="truncate">{rowTerrain.label}</span></th>{tileSets.terrain.map((colTerrain, colIndex) => {
                                if (colIndex > rowIndex) { return <td key={colTerrain.id} className="p-1 border-b border-[#41403f] bg-[#191f29]/50"></td>; }
                                const value = generationOptions.terrainClusteringMatrix[rowTerrain.id]?.[colTerrain.id] ?? 0.5;
                                return (<td key={colTerrain.id} className="p-1 border-b border-[#41403f] text-center"><input type="number" min="0" max="100" step="1" value={Math.round(value * 100)} onChange={e => { let v = parseInt(e.target.value, 10) || 0; handleClusteringChange(rowTerrain.id, colTerrain.id, Math.max(0, Math.min(100, v)) / 100); }} className="w-14 bg-[#324446] p-1 text-sm text-center font-medium text-[#a7a984] focus:outline-none focus:ring-1 focus:ring-[#736b23] rounded-md" title={`${rowTerrain.label} <> ${colTerrain.label}: ${Math.round(value * 100)}`} /></td>);
                            })}</tr>))}</tbody>
                        </table>
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
};
