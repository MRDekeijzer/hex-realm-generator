import React, { useState } from 'react';
import { Icon } from './Icon';
import { TERRAIN_TYPES } from '../constants';
import type { TileSet } from '../types';

interface TerrainPainterProps {
  paintTerrain: string;
  setPaintTerrain: (terrain: string) => void;
  onClose: () => void;
  tileSets: TileSet;
  terrainColors: { [key: string]: string };
  onAddTerrain: (name: string, color: string) => void;
  onRemoveTerrain: (id: string) => void;
}

export function TerrainPainter({ paintTerrain, setPaintTerrain, onClose, tileSets, terrainColors, onAddTerrain, onRemoveTerrain }: TerrainPainterProps) {
  const [newTerrainName, setNewTerrainName] = useState('');
  const [newTerrainColor, setNewTerrainColor] = useState('#cccccc');

  return (
    <aside className="w-80 bg-[#191f29] border-l border-[#41403f] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Terrain Painter</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[#435360]">
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        <p className="text-sm text-[#a7a984] mb-4">Select a terrain type to paint on the map. Click and drag to paint multiple hexes.</p>
        <div className="space-y-2">
          {tileSets.terrain.filter(t => t.id !== 'river').map(terrain => {
            const color = terrainColors[terrain.id] || '#ccc';
            const isSelected = paintTerrain === terrain.id;
            const isDefault = TERRAIN_TYPES.includes(terrain.id);

            return (
              <div key={terrain.id} className="flex items-center gap-2">
                <button
                  onClick={() => setPaintTerrain(terrain.id)}
                  className={`flex-grow flex items-center gap-3 p-2 rounded-md transition-all duration-150 border-2 text-left
                    ${isSelected ? 'bg-[#736b23]/20 border-[#736b23] text-[#eaebec]' : 'bg-[#18272e] border-[#41403f] hover:border-[#a7a984] text-[#a7a984]'}`}
                  title={`Paint ${terrain.label}`}
                >
                  <div 
                    className="w-8 h-8 rounded-md flex-shrink-0 border border-black/20"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="font-medium">{terrain.label}</span>
                </button>
                {!isDefault && (
                  <button
                    onClick={() => onRemoveTerrain(terrain.id)}
                    className="p-2 text-[#a7a984] hover:text-[#60131b] hover:bg-[#435360] rounded-md transition-colors"
                    title={`Remove ${terrain.label}`}
                  >
                    <Icon name="trash-2" className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#41403f]">
          <h3 className="text-lg font-bold mb-2">Add New Terrain</h3>
          <form onSubmit={(e) => {
              e.preventDefault();
              if (newTerrainName.trim()) {
                  onAddTerrain(newTerrainName.trim(), newTerrainColor);
                  setNewTerrainName('');
                  setNewTerrainColor('#cccccc');
              }
          }}>
              <div className="mb-2">
                  <label htmlFor="terrain-name" className="block text-sm font-medium text-[#a7a984] mb-1">Name</label>
                  <input
                      id="terrain-name"
                      type="text"
                      value={newTerrainName}
                      onChange={(e) => setNewTerrainName(e.target.value)}
                      className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                      placeholder="e.g. Cursed Wastes"
                      required
                  />
              </div>
              <div className="mb-4">
                  <label htmlFor="terrain-color" className="block text-sm font-medium text-[#a7a984] mb-1">Color</label>
                  <div className="flex items-center gap-2">
                       <input
                          id="terrain-color"
                          type="color"
                          value={newTerrainColor}
                          onChange={(e) => setNewTerrainColor(e.target.value)}
                          className="h-10 p-1 bg-[#324446] border border-[#41403f] rounded-md cursor-pointer"
                          title="Select color"
                      />
                      <span className="p-2 bg-[#324446] rounded-md text-sm font-mono flex-grow text-center">{newTerrainColor}</span>
                  </div>
              </div>
              <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#eaebec] bg-[#777741] rounded-md hover:bg-[#9d8940] transition-colors disabled:opacity-50"
                  disabled={!newTerrainName.trim()}
              >
                  <Icon name="plus" className="w-4 h-4" />
                  Add Terrain
              </button>
          </form>
        </div>
      </div>
    </aside>
  );
}