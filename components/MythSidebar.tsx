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
    <aside className="w-80 bg-[#191f29] border-l border-[#41403f] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Myth Tool</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[#435360]">
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
                  <li key={myth.id} className="bg-[#18272e] rounded-md overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => handleMythClick(myth)}
                      className="w-full text-left p-3 hover:bg-[#435360] transition-colors flex justify-between items-center disabled:cursor-not-allowed"
                      aria-expanded={isExpanded || isRelocating}
                      disabled={!!relocatingMythId}
                    >
                      <div>
                        <p className="font-semibold text-[#736b23]">Myth #{myth.id}: <span className="text-[#eaebec]">{myth.name}</span></p>
                        <p className="text-xs text-[#a7a984]">Location: ({myth.q}, {myth.r})</p>
                      </div>
                      <Icon name={isExpanded || isRelocating ? 'chevron-up' : 'chevron-down'} className="w-5 h-5 text-[#a7a984] flex-shrink-0" />
                    </button>
                    {(isExpanded || isRelocating) && (
                      <div className="p-3 border-t border-[#41403f]/50 bg-[#18272e]/50 space-y-3">
                        <div>
                            <label htmlFor={`myth-name-${myth.id}`} className="block text-sm font-medium text-[#a7a984] mb-1">Edit Name</label>
                            <input
                              id={`myth-name-${myth.id}`}
                              type="text"
                              value={myth.name}
                              onChange={(e) => handleNameChange(e, myth)}
                              className="w-full bg-[#324446] p-2 text-sm font-medium text-[#a7a984] focus:outline-none focus:ring-2 focus:ring-[#736b23] rounded-md"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                              onClick={() => onToggleRelocateMyth(myth.id)}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isRelocating ? 'bg-[#435360]/80 text-[#eaebec] hover:bg-[#435360]' : 'bg-[#324446] text-[#a7a984] hover:bg-[#435360]'}`}
                            >
                                <Icon name="move" className="w-4 h-4" />
                                {isRelocating ? 'Cancel Relocate' : 'Relocate'}
                            </button>
                            <button
                              onClick={() => handleRemoveClick(myth)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#a7a984] bg-[#60131b]/50 rounded-md hover:bg-[#60131b]/80 border border-[#60131b]/80 transition-colors"
                            >
                                <Icon name="trash-2" className="w-4 h-4" />
                                Remove
                            </button>
                        </div>
                      </div>
                    )}
                     {isRelocating && (
                        <div className="p-3 bg-[#435360]/50 text-center text-sm text-[#c5d2cb]">Select a new hex on the map.</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[#a7a984] text-center py-4">No myths have been placed on the map.</p>
          )}
        </div>
      </div>
    </aside>
  );
}