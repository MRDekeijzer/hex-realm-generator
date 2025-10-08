/**
 * @file TerrainPainter.tsx
 * This component renders the sidebar for the Terrain Painter tool. It allows users
 * to select a terrain type to paint, customize terrain colors, and add or remove
 * custom terrain types.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { TERRAIN_TYPES, TERRAIN_COLORS as DEFAULT_TERRAIN_COLORS } from '../constants';
import type { TileSet } from '../types';

/**
 * Props for the TerrainPainter component.
 */
interface TerrainPainterProps {
  paintTerrain: string;
  setPaintTerrain: (terrain: string) => void;
  onClose: () => void;
  tileSets: TileSet;
  terrainColors: { [key: string]: string };
  onAddTerrain: (name: string, color: string) => void;
  onRemoveTerrain: (id: string) => void;
  onUpdateTerrainColor: (id: string, color: string) => void;
  onResetTerrainColor: (id: string) => void;
  onStartPicking: () => void;
  isPickingTile: boolean;
  onOpenSpraySettings: (id: string) => void;
}

/**
 * The sidebar component for the terrain painting tool.
 */
export function TerrainPainter({ paintTerrain, setPaintTerrain, onClose, tileSets, terrainColors, onAddTerrain, onRemoveTerrain, onUpdateTerrainColor, onResetTerrainColor, onStartPicking, isPickingTile, onOpenSpraySettings }: TerrainPainterProps) {
  const [newTerrainName, setNewTerrainName] = useState('');
  const [newTerrainColor, setNewTerrainColor] = useState('#cccccc');
  const colorInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            onStartPicking();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartPicking]);


  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTerrainName.trim()) {
        onAddTerrain(newTerrainName.trim(), newTerrainColor);
        setNewTerrainName('');
        setNewTerrainColor('#cccccc');
    }
  };

  return (
    <aside className="w-80 bg-[#191f29] border-l border-[#41403f] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Terrain Painter</h2>
        <div className="flex items-center gap-2">
            <button
                onClick={onStartPicking}
                className={`p-2 rounded-md transition-colors ${isPickingTile ? 'bg-[#736b23] text-[#eaebec]' : 'text-[#a7a984] hover:bg-[#435360]'}`}
                title="Pick Terrain from Map (Ctrl+I)"
            >
                <Icon name="pipette" className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-[#435360]">
              <Icon name="close" className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {isPickingTile && (
            <div className="bg-[#435360]/50 text-center text-sm text-[#c5d2cb] p-2 rounded-md mb-4 animate-pulse">
                Click on the map to pick a terrain.
            </div>
        )}
        <p className="text-sm text-[#a7a984] mb-4">Select a terrain to paint. Click a color swatch to customize.</p>
        <div className="space-y-2">
          {tileSets.terrain.map(terrain => {
            const color = terrainColors[terrain.id] || '#ccc';
            const isSelected = paintTerrain === terrain.id;
            const isDefault = TERRAIN_TYPES.includes(terrain.id);
            const defaultColor = DEFAULT_TERRAIN_COLORS[terrain.id as keyof typeof DEFAULT_TERRAIN_COLORS];
            const isCustomColor = isDefault && defaultColor ? defaultColor !== color : false;

            return (
              <div
                key={terrain.id}
                onClick={() => setPaintTerrain(terrain.id)}
                className={`relative group/item p-2 rounded-md transition-all duration-150 border-2 flex items-center gap-2 cursor-pointer
                ${isSelected ? 'bg-[#736b23]/20 border-[#736b23]' : 'bg-[#18272e] border-[#41403f] hover:border-[#a7a984]'}`}
                title={`Paint ${terrain.label}`}
              >
                <span className={`font-medium text-sm truncate flex-grow ${isSelected ? 'text-[#eaebec]' : 'text-[#a7a984]'}`}>
                    {terrain.label}
                </span>
                
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); isCustomColor ? onResetTerrainColor(terrain.id) : colorInputRefs.current[terrain.id]?.click(); }}
                        className="w-7 h-7 rounded-md flex-shrink-0 border border-white/80 relative group"
                        style={{ backgroundColor: color }}
                        title={isCustomColor ? 'Reset color to default' : 'Edit color'}
                    >
                        <input ref={el => { if(el) colorInputRefs.current[terrain.id] = el; }} type="color" value={color} onChange={e => { e.stopPropagation(); onUpdateTerrainColor(terrain.id, e.target.value); }} onClick={e => e.stopPropagation()} className="opacity-0 w-0 h-0 absolute pointer-events-none" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Icon name={isCustomColor ? "reset" : "pipette"} className="w-4 h-4 text-white" />
                        </div>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenSpraySettings(terrain.id); }}
                        className="w-7 h-7 rounded-md flex-shrink-0 border border-white/80 bg-[#324446] flex items-center justify-center hover:bg-[#435360] transition-colors"
                        title={`Edit ${terrain.label} spray settings`}
                    >
                        <Icon name="spray-can" className="w-5 h-5 text-white" />
                    </button>
                </div>

                {!isDefault && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemoveTerrain(terrain.id); }}
                        className="absolute -top-1.5 -right-1.5 p-1 text-[#eaebec] bg-[#60131b] rounded-full hover:bg-[#8a2a34] opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                        title={`Remove ${terrain.label}`}
                    >
                        <Icon name="close" className="w-3.5 h-3.5" />
                    </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#41403f]">
          <h3 className="text-lg font-bold mb-2">Add New Terrain</h3>
          <form onSubmit={handleAddSubmit}>
              <div className="mb-2">
                  <label htmlFor="terrain-name" className="block text-sm font-medium text-[#a7a984] mb-1">Name</label>
                  <input id="terrain-name" type="text" value={newTerrainName} onChange={(e) => setNewTerrainName(e.target.value)} className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md" placeholder="e.g. Cursed Wastes" required />
              </div>
              <div className="mb-4">
                  <label htmlFor="terrain-color" className="block text-sm font-medium text-[#a7a984] mb-1">Color</label>
                  <div className="flex items-center gap-2">
                       <input id="terrain-color" type="color" value={newTerrainColor} onChange={(e) => setNewTerrainColor(e.target.value)} className="h-10 p-1 bg-[#324446] border border-[#41403f] rounded-md cursor-pointer" title="Select color" />
                      <span className="p-2 bg-[#324446] rounded-md text-sm font-mono flex-grow text-center">{newTerrainColor}</span>
                  </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#eaebec] bg-[#777741] rounded-md hover:bg-[#9d8940] transition-colors disabled:opacity-50" disabled={!newTerrainName.trim()}>
                  <Icon name="plus" className="w-4 h-4" />
                  Add Terrain
              </button>
          </form>
        </div>
      </div>
    </aside>
  );
}