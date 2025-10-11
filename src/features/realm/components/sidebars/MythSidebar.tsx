/**
 * @file MythSidebar.tsx
 * This component renders the sidebar for the Myth tool. It lists all myths
 * present in the realm and provides controls for editing their names,
 * relocating them, or removing them.
 */

import React from 'react';
import type { Realm, Hex, Myth } from '@/features/realm/types';
import { Icon } from '../Icon';

/**
 * Props for the MythSidebar component.
 */
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

/**
 * The sidebar component for managing myths.
 */
export function MythSidebar({
  realm,
  selectedHex,
  onSelectHex,
  onUpdateMyth,
  onRemoveMyth,
  relocatingMythId,
  onToggleRelocateMyth,
  onClose,
}: MythSidebarProps) {
  const findHexForMyth = (myth: Myth): Hex | undefined => {
    return realm.hexes.find((h) => h.q === myth.q && h.r === myth.r);
  };

  const handleMythClick = (myth: Myth) => {
    if (relocatingMythId) return;
    const hex = findHexForMyth(myth);
    if (hex) onSelectHex(selectedHex?.myth === myth.id ? null : hex);
  };

  const handleRemoveClick = (myth: Myth) => {
    const hex = findHexForMyth(myth);
    if (hex) onRemoveMyth(hex);
  };

  return (
    <aside className="w-80 bg-realm-canvas-backdrop border-l border-border-panel-divider p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Myth Tool</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-realm-command-panel-hover"
          aria-label="Close Myth Tool"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">All Myths</h3>
          {realm.myths.length > 0 ? (
            <ul className="space-y-2">
              {realm.myths
                .sort((a, b) => a.id - b.id)
                .map((myth) => {
                  const isExpanded = selectedHex?.myth === myth.id;
                  const isRelocating = relocatingMythId === myth.id;

                  return (
                    <li
                      key={myth.id}
                      className="bg-realm-map-viewport rounded-md overflow-hidden transition-all duration-300"
                    >
                      <button
                        onClick={() => handleMythClick(myth)}
                        className="w-full text-left p-3 hover:bg-realm-command-panel-hover transition-colors flex justify-between items-center disabled:cursor-not-allowed"
                        aria-expanded={isExpanded || isRelocating}
                        disabled={!!relocatingMythId}
                      >
                        <div>
                          <p className="font-semibold text-text-accent-headline">
                            Myth #{myth.id}:{' '}
                            <span className="text-text-high-contrast">{myth.name}</span>
                          </p>
                          <p className="text-xs text-text-muted">
                            Location: ({myth.q}, {myth.r})
                          </p>
                        </div>
                        <Icon
                          name={isExpanded || isRelocating ? 'chevron-up' : 'chevron-down'}
                          className="w-5 h-5 text-text-muted flex-shrink-0"
                        />
                      </button>
                      {(isExpanded || isRelocating) && (
                        <div className="p-3 border-t border-border-panel-divider/50 bg-realm-map-viewport/50 space-y-3">
                          <div>
                            <label
                              htmlFor={`myth-name-${myth.id}`}
                              className="block text-sm font-medium text-text-muted mb-1"
                            >
                              Edit Name
                            </label>
                            <input
                              id={`myth-name-${myth.id}`}
                              type="text"
                              value={myth.name}
                              onChange={(e) => onUpdateMyth({ ...myth, name: e.target.value })}
                              className="w-full bg-realm-command-panel-surface p-2 text-sm font-medium text-text-muted focus:outline-none focus:ring-2 focus:ring-actions-command-primary rounded-md"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onToggleRelocateMyth(myth.id)}
                              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                isRelocating
                                  ? 'bg-realm-command-panel-hover/80 text-text-high-contrast hover:bg-realm-command-panel-hover'
                                  : 'bg-realm-command-panel-surface text-text-muted hover:bg-realm-command-panel-hover'
                              }`}
                            >
                              <Icon name="move" className="w-4 h-4" />
                              {isRelocating ? 'Cancel Relocate' : 'Relocate'}
                            </button>
                            <button
                              onClick={() => handleRemoveClick(myth)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-muted bg-actions-danger-base/50 rounded-md hover:bg-actions-danger-base/80 border border-actions-danger-base transition-colors"
                            >
                              <Icon name="trash-2" className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {isRelocating && (
                        <div className="p-3 bg-realm-command-panel-hover/50 text-center text-sm text-text-subtle">
                          Select a new hex on the map.
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-text-muted text-center py-4">
              No myths have been placed on the map.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

