import React from 'react';
import type { Realm, Hex, Myth } from '../types';
import { Icon } from './Icon';

interface MythSidebarProps {
  realm: Realm;
  selectedHex: Hex | null;
  onSelectHex: (hex: Hex | null) => void;
  onUpdateMyth: (myth: Myth) => void;
  onRemoveMyth: (hex: Hex) => void;
  relocatingMythId: number | null;
  onToggleRelocateMyth: (mythId: number) => void;
  onClose: () => void;
}

export function MythSidebar({ realm, selectedHex, onSelectHex, onUpdateMyth, onRemoveMyth, relocatingMythId, onToggleRelocateMyth, onClose }: MythSidebarProps) {
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, myth: Myth) => {
    onUpdateMyth({ ...myth, name: e.target.value });
  };

  const findHexForMyth = (myth: Myth): Hex | undefined => {
    return realm.hexes.find(h => h.q === myth.q && h.r === myth.r);
  };
  
  const handleMythClick = (myth: Myth) => {
    const isExpanded = selectedHex?.myth === myth.id;

    if (relocatingMythId) return; // Don't change selection while relocating

    if (isExpanded) {
      onSelectHex(null);
    } else {
      const hex = findHexForMyth(myth);
      if (hex) {
        onSelectHex(hex);
      }
    }
  };
  
  const handleRemoveClick = (myth: Myth) => {
    const hex = findHexForMyth(myth);
    if (hex) {
        onRemoveMyth(hex);
    }
  };

  return (
    <aside className="w-80 bg-gray-900 border-l border-gray-700 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Myth Tool</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">All Myths</h3>
          {realm.myths.length > 0 ? (
            <ul className="space-y-2">
              {realm.myths.sort((a, b) => a.id - b.id).map(myth => {
                const isExpanded = selectedHex?.myth === myth.id;
                const isRelocating = relocatingMythId === myth.id;

                return (
                  <li key={myth.id} className="bg-gray-800 rounded-md overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => handleMythClick(myth)}
                      className="w-full text-left p-3 hover:bg-gray-700 transition-colors flex justify-between items-center disabled:cursor-not-allowed"
                      aria-expanded={isExpanded || isRelocating}
                      disabled={!!relocatingMythId}
                    >
                      <div>
                        <p className="font-semibold text-amber-500">Myth #{myth.id}: <span className="text-gray-200">{myth.name}</span></p>
                        <p className="text-xs text-gray-400">Location: ({myth.q}, {myth.r})</p>
                      </div>
                      <Icon name={isExpanded || isRelocating ? 'chevron-up' : 'chevron-down'} className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </button>
                    {(isExpanded || isRelocating) && (
                      <div className="p-3 border-t border-gray-700/50 bg-gray-800/50 space-y-3">
                        <div>
                            <label htmlFor={`myth-name-${myth.id}`} className="block text-sm font-medium text-gray-400 mb-1">Edit Name</label>
                            <input
                              id={`myth-name-${myth.id}`}
                              type="text"
                              value={myth.name}
                              onChange={(e) => handleNameChange(e, myth)}
                              className="w-full bg-gray-700 p-2 text-sm font-medium text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                              onClick={() => onToggleRelocateMyth(myth.id)}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isRelocating ? 'bg-blue-600/80 text-white hover:bg-blue-600' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                            >
                                <Icon name="move" className="w-4 h-4" />
                                {isRelocating ? 'Cancel Relocate' : 'Relocate'}
                            </button>
                            <button
                              onClick={() => handleRemoveClick(myth)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-red-800/50 rounded-md hover:bg-red-700/50 border border-red-700/80 transition-colors"
                            >
                                <Icon name="trash-2" className="w-4 h-4" />
                                Remove
                            </button>
                        </div>
                      </div>
                    )}
                     {isRelocating && (
                        <div className="p-3 bg-blue-900/50 text-center text-sm text-blue-300">Select a new hex on the map.</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-4">No myths have been placed on the map.</p>
          )}
        </div>
      </div>
    </aside>
  );
}