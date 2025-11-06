/**
 * @file Component for the "Generation" tab in the main settings modal.
 */

import React, { useMemo, useEffect, useState } from 'react';
import type { GenerationOptions, TileSet, HighlandFormation } from '@/features/realm/types';
import { SettingsSection } from '../ui/SettingsSection';
import { SettingSlider } from '../ui/SettingSlider';
import { Icon } from '../Icon';
import { Switch } from '../ui/Switch';

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
          'No formation shape.',
          'Elevation is purely noise-based.',
          'Generates a more chaotic landscape.',
        ],
      },
      {
        id: 'linear',
        name: 'Linear',
        icon: 'arrow-up',
        description: [
          'Creates a linear slope.',
          'Highlands form on one side, lowlands on the other.',
          'Good for a gradual elevation change.',
        ],
      },
      {
        id: 'circle',
        name: 'Circle',
        icon: 'circle',
        description: [
          'Creates a circular formation.',
          'Highlands form inside or outside.',
          'Good for central mountains or central lakes.',
        ],
      },
      {
        id: 'triangle',
        name: 'Triangle',
        icon: 'triangle',
        description: [
          'Creates a triangular formation.',
          'Highlands form inside or outside.',
          'Good for unique landmasses (experimental).',
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
                  ? 'bg-actions-command-primary/20 border-actions-command-primary text-text-high-contrast'
                  : 'bg-realm-canvas-backdrop border-border-panel-divider hover:border-text-muted text-text-muted'
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
          <div className="space-y-4 pt-4 border-t border-border-panel-divider">
            <SettingSlider
              label="Formation Strength"
              value={generationOptions.highlandFormationStrength}
              onChange={(v) => onGenerationOptionChange('highlandFormationStrength', v)}
              tooltip="Controls the intensity of the highland formation shape."
            />
            {(generationOptions.highlandFormation === 'linear' ||
              generationOptions.highlandFormation === 'triangle') && (
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
            )}
            {(generationOptions.highlandFormation === 'circle' ||
              generationOptions.highlandFormation === 'triangle') && (
              <label
                htmlFor="invert-formation"
                className="flex items-center justify-between pt-4 border-t border-border-panel-divider cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-muted">Invert Formation</span>
                  <span className="text-xs text-text-muted">Flips highlands and lowlands.</span>
                </div>
                <Switch
                  id="invert-formation"
                  checked={generationOptions.highlandFormationInverse ?? false}
                  onChange={(next) => onGenerationOptionChange('highlandFormationInverse', next)}
                />
              </label>
            )}
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Terrain Biases">
        <p className="text-xs text-text-muted !mt-0">
          Set relative weights. Higher numbers mean more of that terrain.
        </p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
          {tileSets.terrain.map((terrain) => (
            <div key={terrain.id} className="flex justify-between items-center">
              <label
                htmlFor={`terrain-bias-${terrain.id}`}
                className="text-sm text-text-muted flex items-center gap-2"
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
                className="w-20 bg-realm-command-panel-surface p-1 text-sm text-center font-medium text-text-muted focus:outline-none focus:ring-2 focus:ring-actions-command-primary rounded-md"
                aria-label={`Bias for ${terrain.label}`}
              />
            </div>
          ))}
          <p className="text-sm text-text-muted">
            This matrix controls how terrain types attract each other. It is adjusted by the slider
            above.
          </p>
          <div className="overflow-auto max-h-[calc(80vh-150px)] bg-realm-canvas-backdrop rounded-md border border-border-panel-divider mt-2">
            <table className="w-full border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-realm-canvas-backdrop z-20">
                <tr>
                  <th className="sticky left-0 bg-realm-canvas-backdrop p-2 border-r border-b border-border-panel-divider w-28 z-30"></th>
                  {tileSets.terrain.map((t) => (
                    <th
                      key={t.id}
                      className="p-1 border-b border-border-panel-divider text-center font-medium"
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
                    <th className="sticky left-0 bg-realm-map-viewport p-0 border-r border-b border-border-panel-divider text-left font-medium w-28 z-10">
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
                            className="p-1 border-b border-border-panel-divider bg-realm-canvas-backdrop/50"
                          ></td>
                        );
                      }
                      const value =
                        generationOptions.terrainClusteringMatrix[rowTerrain.id]?.[colTerrain.id] ??
                        0.5;
                      return (
                        <td
                          key={colTerrain.id}
                          className="p-1 border-b border-border-panel-divider text-center"
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
                            className="w-14 bg-realm-command-panel-surface p-1 text-sm text-center font-medium text-text-muted focus:outline-none focus:ring-1 focus:ring-actions-command-primary rounded-md"
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

      <SettingsSection title="Terrain Height">
        <p className="text-xs text-text-muted !mt-0">
          Drag and drop to reorder terrain types from highest (top) to lowest (bottom). This order
          determines elevation during map generation.
        </p>
        <ol className="space-y-1 bg-realm-canvas-backdrop p-2 rounded-md border border-border-panel-divider">
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
                className={`flex items-center gap-3 p-2 rounded-md transition-all duration-150 cursor-grab active:cursor-grabbing bg-realm-command-panel-surface border border-transparent ${
                  isDragging
                    ? 'opacity-50 border-dashed border-actions-command-primary'
                    : 'hover:bg-realm-command-panel-hover'
                }`}
              >
                <Icon name="grip-vertical" className="w-5 h-5 text-text-muted" />
                <Icon name={terrain.icon} className="w-5 h-5 text-text-high-contrast" />
                <span className="font-medium text-sm text-text-high-contrast">{terrain.label}</span>
              </li>
            );
          })}
        </ol>
      </SettingsSection>
    </div>
  );
};
