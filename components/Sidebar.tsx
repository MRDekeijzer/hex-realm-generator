import React, { useRef } from 'react';
import type { Hex, Realm } from '../types';
import { TILE_SETS, BARRIER_COLOR } from '../constants';
import { Icon } from './Icon';
import { getHexCorners, getBarrierPath, getNeighbors } from '../utils/hexUtils';

interface SidebarProps {
  selectedHex: Hex | null;
  realm: Realm | null;
  onUpdateHex: (hex: Hex | Hex[]) => void;
  onDeselect: () => void;
  onSetSeatOfPower: (hex: Hex) => void;
  customIcons: { [key: string]: string };
  onUpdateCustomIcon: (type: string, dataUrl: string) => void;
  onAddMyth: (hex: Hex, andSelect?: boolean) => void;
  onRemoveMyth: (hex: Hex) => void;
}

const renderSelect = (label: string, value: string, options: {id: string, label: string}[], onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="">None</option>
            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </select>
    </div>
);

export function Sidebar({ selectedHex, realm, onUpdateHex, onDeselect, onSetSeatOfPower, customIcons, onUpdateCustomIcon, onAddMyth, onRemoveMyth }: SidebarProps) {
  const holdingFileInputRef = useRef<HTMLInputElement>(null);
  const landmarkFileInputRef = useRef<HTMLInputElement>(null);
  
  if (!selectedHex) {
    return (
      <aside className="w-64 bg-gray-900 border-l border-gray-700 p-4 text-gray-400 flex items-center justify-center">
        <p className="text-center">Select a hex to see details.</p>
      </aside>
    );
  }

  const handleChange = <K extends keyof Hex,>(key: K, value: Hex[K]) => {
    onUpdateHex({ ...selectedHex, [key]: value });
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'holding' | 'landmark') => {
      const file = event.target.files?.[0];
      const typeId = selectedHex?.[type];
      if (file && typeId) {
          const reader = new FileReader();
          reader.onload = (e) => {
              onUpdateCustomIcon(typeId, e.target?.result as string);
          };
          reader.readAsDataURL(file);
      }
      // Reset file input value to allow re-uploading the same file
      if(event.target) {
        event.target.value = '';
      }
  };

  const handleUploadClick = (ref: React.RefObject<HTMLInputElement>, type: 'holding' | 'landmark') => {
      if (!selectedHex?.[type]) {
          alert(`Please select a ${type} type first.`);
          return;
      }
      ref.current?.click();
  };

  const handleBarrierToggle = (edge: number) => {
    if (!selectedHex || !realm) return;

    const isAdding = !selectedHex.barrierEdges.includes(edge);
    const newEdges = isAdding
        ? [...selectedHex.barrierEdges, edge]
        : selectedHex.barrierEdges.filter(e => e !== edge);
    
    const updatedSelectedHex = { 
        ...selectedHex, 
        barrierEdges: newEdges.sort((a, b) => a - b)
    };

    const updates: Hex[] = [updatedSelectedHex];

    const neighborCoords = getNeighbors(selectedHex)[edge];
    const neighborHex = realm.hexes.find(h => h.q === neighborCoords.q && h.r === neighborCoords.r);
    
    if (neighborHex) {
        const oppositeEdge = (edge + 3) % 6;
        const newNeighborEdges = isAdding
            ? [...neighborHex.barrierEdges, oppositeEdge]
            : neighborHex.barrierEdges.filter(e => e !== oppositeEdge);
        
        const uniqueNeighborEdges = [...new Set(newNeighborEdges)];
        
        const updatedNeighborHex = {
            ...neighborHex,
            barrierEdges: uniqueNeighborEdges.sort((a, b) => a - b)
        };
        updates.push(updatedNeighborHex);
    }
    
    onUpdateHex(updates);
  };
  
  const handleMythToggle = () => {
    if (!selectedHex) return;

    if (selectedHex.myth) {
        onRemoveMyth(selectedHex);
    } else {
        onAddMyth(selectedHex);
    }
  };

  const previewHexSize = { x: 45, y: 45 };
  const previewHexCorners = getHexCorners('pointy', previewHexSize);

  const isSeatOfPower = realm && selectedHex.q === realm.seatOfPower.q && selectedHex.r === realm.seatOfPower.r;

  return (
    <aside className="w-80 bg-gray-900 border-l border-gray-700 p-4 flex flex-col">
       <div className="flex justify-between items-center mb-4">
         <h2 className="text-xl font-bold">Hex ({selectedHex.q}, {selectedHex.r})</h2>
         <button onClick={onDeselect} className="p-1 rounded-full hover:bg-gray-700">
            <Icon name="close" className="w-5 h-5"/>
         </button>
       </div>
      <div className="flex-grow overflow-y-auto">
        {renderSelect('Terrain', selectedHex.terrain, TILE_SETS.terrain, (e) => handleChange('terrain', e.target.value))}
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Holding</label>
            <div className="flex items-center gap-2">
                <select value={selectedHex.holding || ''} onChange={(e) => handleChange('holding', e.target.value)} className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">None</option>
                    {TILE_SETS.holding.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
                {selectedHex.holding && customIcons[selectedHex.holding] && <img src={customIcons[selectedHex.holding]} alt="custom icon" className="w-8 h-8 rounded object-cover" />}
                <button onClick={() => handleUploadClick(holdingFileInputRef, 'holding')} title={`Upload custom icon for ${selectedHex.holding || 'holding'}`} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedHex.holding}>
                    <Icon name="upload" className="w-4 h-4" />
                </button>
                <input type="file" ref={holdingFileInputRef} onChange={(e) => handleFileChange(e, 'holding')} accept="image/*" style={{ display: 'none' }}/>
            </div>
        </div>

        {selectedHex.holding && (
          <div className="mb-4">
            {isSeatOfPower ? (
                <div className="flex items-center gap-2 p-2 bg-amber-900/50 border border-amber-500 rounded-md text-amber-300 text-sm">
                    <Icon name="star" className="w-4 h-4 text-amber-400" />
                    <span>This is the Seat of Power.</span>
                </div>
            ) : (
                <button
                    onClick={() => onSetSeatOfPower(selectedHex)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-amber-600 transition-colors"
                >
                    <Icon name="star" className="w-4 h-4" />
                    Make Seat of Power
                </button>
            )}
          </div>
        )}

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Landmark</label>
            <div className="flex items-center gap-2">
                <select value={selectedHex.landmark || ''} onChange={(e) => handleChange('landmark', e.target.value)} className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">None</option>
                    {TILE_SETS.landmark.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
                {selectedHex.landmark && customIcons[selectedHex.landmark] && <img src={customIcons[selectedHex.landmark]} alt="custom icon" className="w-8 h-8 rounded object-cover" />}
                <button onClick={() => handleUploadClick(landmarkFileInputRef, 'landmark')} title={`Upload custom icon for ${selectedHex.landmark || 'landmark'}`} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedHex.landmark}>
                    <Icon name="upload" className="w-4 h-4" />
                </button>
                <input type="file" ref={landmarkFileInputRef} onChange={(e) => handleFileChange(e, 'landmark')} accept="image/*" style={{ display: 'none' }}/>
            </div>
        </div>
        
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Myth</label>
            <button
                onClick={handleMythToggle}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            >
                <Icon name={selectedHex.myth ? "minus" : "sparkles"} className="w-4 h-4" />
                {selectedHex.myth ? `Remove Myth #${selectedHex.myth}` : 'Add Myth'}
            </button>
        </div>

        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Barriers (Click edge to toggle)</label>
            <div className="flex justify-center items-center p-2 bg-gray-800 rounded-md">
                <svg width="100" height="115" viewBox="-55 -55 110 110" role="group" aria-label="Interactive hex for toggling barriers">
                    <polygon
                        points={previewHexCorners.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="2"
                    />
                    
                    {/* Visible Barriers */}
                    {selectedHex.barrierEdges.map(edgeIndex => (
                        <path
                            key={`barrier-visible-${edgeIndex}`}
                            d={getBarrierPath(edgeIndex, previewHexCorners)}
                            stroke={BARRIER_COLOR}
                            strokeWidth="6"
                            strokeLinecap="round"
                            style={{ pointerEvents: 'none' }}
                        />
                    ))}

                    {/* Clickable Layer */}
                    {[...Array(6).keys()].map(edgeIndex => {
                        const isBarrierActive = selectedHex.barrierEdges.includes(edgeIndex);
                        return (
                            <g 
                                key={`barrier-interactive-${edgeIndex}`} 
                                onClick={() => handleBarrierToggle(edgeIndex)} 
                                className="cursor-pointer group"
                            >
                                <title>{`Toggle barrier on edge ${edgeIndex + 1}`}</title>
                                {/* Invisible wide path for easy clicking */}
                                <path
                                    d={getBarrierPath(edgeIndex, previewHexCorners)}
                                    stroke="transparent"
                                    strokeWidth="15"
                                    strokeLinecap="round"
                                />
                                {/* Hover effect */}
                                <path
                                    d={getBarrierPath(edgeIndex, previewHexCorners)}
                                    stroke={isBarrierActive ? '#FBBF24' : 'rgba(251, 191, 36, 0.6)'}
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                />
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
      </div>
    </aside>
  );
}