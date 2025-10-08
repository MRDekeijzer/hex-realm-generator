import React from 'react';
import { Icon } from './Icon';
import { TILE_SETS, TERRAIN_COLORS } from '../constants';

interface TerrainPainterProps {
  paintTerrain: string;
  setPaintTerrain: (terrain: string) => void;
  onClose: () => void;
}

export function TerrainPainter({ paintTerrain, setPaintTerrain, onClose }: TerrainPainterProps) {
  return (
    <aside className="w-80 bg-gray-900 border-l border-gray-700 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Terrain Painter</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        <p className="text-sm text-gray-400 mb-4">Select a terrain type to paint on the map. Click and drag to paint multiple hexes.</p>
        <div className="grid grid-cols-2 gap-3">
          {TILE_SETS.terrain.filter(t => t.id !== 'river').map(terrain => {
            const color = TERRAIN_COLORS[terrain.id] || '#ccc';
            const isSelected = paintTerrain === terrain.id;
            const IconComponent = terrain.icon;

            return (
              <button
                key={terrain.id}
                onClick={() => setPaintTerrain(terrain.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg transition-all duration-150 border-2 text-center
                  ${isSelected ? 'bg-amber-600/20 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
                title={`Paint ${terrain.label}`}
                aria-label={`Select ${terrain.label} for painting`}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color }}
                >
                  {typeof IconComponent === 'function' && (
                     <svg width="28" height="28" viewBox="0 0 24 24" className="text-black/50">
                        <IconComponent />
                     </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{terrain.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
