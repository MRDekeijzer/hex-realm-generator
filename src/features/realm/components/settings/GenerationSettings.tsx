/**
 * @file Component for the "Generation" tab in the main settings modal.
 */

import React, { useMemo, useEffect, useState } from 'react';
import type { GenerationOptions, TileSet, HighlandFormation } from '@/features/realm/types';
import { TERRAIN_TEMPLATES } from '@/features/realm/config/constants';
import { SettingsSection } from '../ui/SettingsSection';
import { SettingSlider } from '../ui/SettingSlider';
import { Icon } from '../Icon';

/**
 * Props for the GenerationSettings component.
 */
interface GenerationSettingsProps {
  generationOptions: GenerationOptions;
  onGenerationOptionChange: <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => void;
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
  tileSets,
}: GenerationSettingsProps) => {
  const [draggedTerrainId, setDraggedTerrainId] = useState<string | null>(null);

  const formationOptions = useMemo(
    () => [
      {
        id: 'random',
        name: 'Random',
        icon: 'sparkles',
        description: [
          'Ignores formation shape.',
          'Elevation is purely noise-based.',
          'Generates a chaotic landscape.',
        ],
      },
      {
        id: 'linear',
        name: 'Linear',
        icon: 'arrow-up',
        description: [
          'Creates a linear slope.',
          "Highlands form at arrow's tip.",
          'Good for continents.',
        ],
      },
      {
        id: 'circle',
        name: 'Circle',
        icon: 'circle',
        description: [
          'Creates a circular formation.',
          'Highlands form inside.',
          'Good for central mountains.',
        ],
      },
      {
        id: 'triangle',
        name: 'Triangle',
        icon: 'triangle',
        description: [
          'Creates a triangular formation.',
          'Highlands form inside.',
          'Good for unique landmasses.',
        ],
      },
    ],
    []
  );

  useEffect(() => {
    if (
      generationOptions.highlandFormation === 'triangle' &&
      generationOptions.highlandFormationRotation > 120
    ) {
      onGenerationOptionChange('highlandFormationRotation', 120);
    }
  }, [
    generationOptions.highlandFormation,
    generationOptions.highlandFormationRotation,
    onGenerationOptionChange,
  ]);

  const handleBiasInputChange = (e: React.ChangeEvent<HTMLInputElement>, terrainId: string) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    handleTerrainBiasChange(terrainId, Math.max(0, value));
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, terrainId: string) => {
    setDraggedTerrainId(terrainId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetTerrainId: string) => {
    if (!draggedTerrainId || draggedTerrainId === targetTerrainId) return;

    const currentOrder = generationOptions.terrainHeightOrder;
    const draggedIndex = currentOrder.indexOf(draggedTerrainId);
    const targetIndex = currentOrder.indexOf(targetTerrainId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    if (removed) {
      newOrder.splice(targetIndex, 0, removed);
      onGenerationOptionChange('terrainHeightOrder', newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedTerrainId(null);
  };

  const getTerrainTile = (id: string) => tileSets.terrain.find((t) => t.id === id);

  return (
    <div className="space-y-6">
      <SettingsSection title="Terrain Generation Templates">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.values(TERRAIN_TEMPLATES).map((template) => (
            <button
              key={template.name}
              onClick={() => onApplyTemplate(template.options)}
              className="p-3 bg-[var(--color-surface-primary)] rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors text-center text-sm font-medium text-[var(--color-text-secondary)]"
            >
              {template.name}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Terrain Height">
        <p className="text-xs text-[var(--color-text-secondary)] !mt-0">
          Drag and drop to reorder terrain types from highest (top) to lowest (bottom). This order
          determines elevation during map generation.
        </p>
        <ol className="space-y-1 bg-[var(--color-background-primary)] p-2 rounded-md border border-[var(--color-border-primary)]">
          {generationOptions.terrainHeightOrder.map((terrainId) => {
            const terrain = getTerrainTile(terrainId);
            if (!terrain) return null;

            const isDragging = draggedTerrainId === terrainId;

            return (
              <li
                key={terrain.id}
                draggable
                onDragStart={(e) => handleDragStart(e, terrain.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, terrain.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-2 rounded-md transition-all duration-150 cursor-grab active:cursor-grabbing bg-[var(--color-surface-primary)] border border-transparent ${
                  isDragging
                    ? 'opacity-50 border-dashed border-[var(--color-accent-primary)]'
                    : 'hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <Icon name="grip-vertical" className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <Icon name={terrain.icon} className="w-5 h-5 text-[var(--color-text-primary)]" />
                <span className="font-medium text-sm text-[var(--color-text-primary)]">
                  {terrain.label}
                </span>
              </li>
            );
          })}
        </ol>
      </SettingsSection>

      <SettingsSection title="Highland Formation">
        <div className="grid grid-cols-2 gap-2">
          {formationOptions.map((option) => (
            <button
              key={option.id}
              onClick={() =>
                onGenerationOptionChange('highlandFormation', option.id as HighlandFormation)
              }
              className={`p-4 rounded-md text-left transition-all duration-150 border-2 h-full ${
                generationOptions.highlandFormation === option.id
                  ? 'bg-[rgba(var(--color-accent-primary-rgb),0.2)] border-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-background-primary)] border-[var(--color-border-primary)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon name={option.icon} className="w-6 h-6 flex-shrink-0" />
                <h4 className="font-bold text-lg">{option.name}</h4>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-xs">
                {option.description.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {generationOptions.highlandFormation !== 'random' && (
          <div className="space-y-4 pt-4 border-t border-[var(--color-border-primary)]">
            <SettingSlider
              label="Formation Strength"
              value={generationOptions.highlandFormationStrength}
              onChange={(v) => onGenerationOptionChange('highlandFormationStrength', v)}
              tooltip="Controls the intensity of the highland formation shape."
            />
            {(generationOptions.highlandFormation === 'linear' ||
              generationOptions.highlandFormation === 'triangle') && (
              <div className="grid grid-cols-2 gap-4 items-center pt-4 border-t border-[var(--color-border-primary)]">
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
                    name={
                      generationOptions.highlandFormation === 'triangle' ? 'triangle' : 'arrow-up'
                    }
                    className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-secondary)]"
                    style={{
                      transform: `rotate(${generationOptions.highlandFormationRotation}deg)`,
                    }}
                  />
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Lowlands start at the base and highlands form towards the tip.
                  </p>
                </div>
              </div>
            )}
            {(generationOptions.highlandFormation === 'circle' ||
              generationOptions.highlandFormation === 'triangle') && (
              <label
                htmlFor="invert-formation"
                className="flex items-center justify-between pt-4 border-t border-[var(--color-border-primary)] cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Invert Formation
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Flips highlands and lowlands.
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="invert-formation"
                    type="checkbox"
                    checked={generationOptions.highlandFormationInverse || false}
                    onChange={(e) =>
                      onGenerationOptionChange('highlandFormationInverse', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--color-surface-primary)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                </div>
              </label>
            )}
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Terrain Biases">
        <p className="text-xs text-[var(--color-text-secondary)] !mt-0">
          Set relative weights. Higher numbers mean more of that terrain.
        </p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          {tileSets.terrain.map((terrain) => (
            <div key={terrain.id} className="flex justify-between items-center">
              <label
                htmlFor={`terrain-bias-${terrain.id}`}
                className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2"
              >
                <Icon name={terrain.icon} className="w-4 h-4" />
                {terrain.label}
              </label>
              <input
                id={`terrain-bias-${terrain.id}`}
                type="number"
                value={Math.round(generationOptions.terrainBiases[terrain.id] || 0)}
                onChange={(e) => handleBiasInputChange(e, terrain.id)}
                min="0"
                className="w-20 bg-[var(--color-surface-primary)] p-1 text-sm text-center font-medium text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] rounded-md"
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
          tooltip="Higher values create large, smooth regions. Lower values result in chaotic, mixed landscapes."
        />
        <div className="pt-4 border-t border-[var(--color-border-primary)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            This matrix controls how terrain types attract each other. It is adjusted by the slider
            above.
          </p>
          <div className="overflow-auto max-h-[calc(80vh-150px)] bg-[var(--color-background-primary)] rounded-md border border-[var(--color-border-primary)] mt-2">
            <table className="w-full border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-[var(--color-background-primary)] z-20">
                <tr>
                  <th className="sticky left-0 bg-[var(--color-background-primary)] p-2 border-r border-b border-[var(--color-border-primary)] w-28 z-30"></th>
                  {tileSets.terrain.map((t) => (
                    <th
                      key={t.id}
                      className="p-1 border-b border-[var(--color-border-primary)] text-center font-medium"
                      title={t.label}
                    >
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
                    <th className="sticky left-0 bg-[var(--color-background-secondary)] p-0 border-r border-b border-[var(--color-border-primary)] text-left font-medium w-28 z-10">
                      <div className="flex items-center gap-2 p-2">
                        <Icon name={rowTerrain.icon} className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{rowTerrain.label}</span>
                      </div>
                    </th>
                    {tileSets.terrain.map((colTerrain, colIndex) => {
                      if (colIndex > rowIndex) {
                        return (
                          <td
                            key={colTerrain.id}
                            className="p-1 border-b border-[var(--color-border-primary)] bg-[var(--color-background-primary)]/50"
                          ></td>
                        );
                      }
                      const value =
                        generationOptions.terrainClusteringMatrix[rowTerrain.id]?.[colTerrain.id] ??
                        0.5;
                      return (
                        <td
                          key={colTerrain.id}
                          className="p-1 border-b border-[var(--color-border-primary)] text-center"
                        >
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={Math.round(value * 100)}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 0;
                              handleClusteringChange(
                                rowTerrain.id,
                                colTerrain.id,
                                Math.max(0, Math.min(100, v)) / 100
                              );
                            }}
                            className="w-14 bg-[var(--color-surface-primary)] p-1 text-sm text-center font-medium text-[var(--color-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] rounded-md"
                            title={`${rowTerrain.label} <> ${colTerrain.label}: ${Math.round(
                              value * 100
                            )}`}
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
  );
};
