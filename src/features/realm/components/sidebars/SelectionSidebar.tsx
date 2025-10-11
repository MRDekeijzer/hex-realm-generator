/**
 * @file SelectionSidebar.tsx
 * This component displays the details of a selected hex and allows for editing its properties,
 * such as terrain, holding, landmark, myths, and barriers. It appears when the 'select'
 * tool is active and a hex has been clicked.
 */

import React from 'react';
import type { Hex, Realm, TileSet } from '@/features/realm/types';
import { BARRIER_COLOR } from '@/features/realm/config/constants';
import { Icon } from '../Icon';
import { getHexCorners, getBarrierPath, getNeighbors } from '@/features/realm/utils/hexUtils';

/**
 * Props for the SelectionSidebar component.
 */
interface SelectionSidebarProps {
  selectedHex: Hex | null;
  realm: Realm | null;
  onUpdateHex: (hex: Hex | Hex[]) => void;
  onDeselect: () => void;
  onSetSeatOfPower: (hex: Hex) => void;
  onAddMyth: (hex: Hex, andSelect?: boolean) => void;
  onRemoveMyth: (hex: Hex) => void;
  tileSets: TileSet;
}

/**
 * A reusable select input component for the sidebar.
 */
const renderSelect = (
  label: string,
  value: string,
  options: { id: string; label: string }[],
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full p-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
    >
      <option value="">None</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

/**
 * The sidebar component for viewing and editing a selected hex.
 */
export function SelectionSidebar({
  selectedHex,
  realm,
  onUpdateHex,
  onDeselect,
  onSetSeatOfPower,
  onAddMyth,
  onRemoveMyth,
  tileSets,
}: SelectionSidebarProps) {
  if (!selectedHex) {
    return (
      <aside className="w-80 bg-[var(--color-background-primary)] border-l border-[var(--color-border-primary)] p-4 flex flex-col items-center justify-center text-center">
        <Icon name="mouse-pointer-2" className="w-16 h-16 text-[var(--color-surface-secondary)] mb-4" />
        <h2 className="text-xl font-bold">Select a Hex</h2>
        <p className="text-[var(--color-text-secondary)]">Click on any hex on the map to view and edit its details.</p>
      </aside>
    );
  }

  const handleChange = <K extends keyof Hex>(key: K, value: Hex[K]) => {
    onUpdateHex({ ...selectedHex, [key]: value });
  };

  const handleBarrierToggle = (edge: number) => {
    if (!selectedHex || !realm) return;

    const isAdding = !selectedHex.barrierEdges.includes(edge);
    const newEdges = isAdding
      ? [...selectedHex.barrierEdges, edge]
      : selectedHex.barrierEdges.filter((e) => e !== edge);
    const updatedSelectedHex = { ...selectedHex, barrierEdges: newEdges.sort((a, b) => a - b) };

    const updates: Hex[] = [updatedSelectedHex];

    const neighborCoords = getNeighbors(selectedHex)[edge];
    if (!neighborCoords) {
      onUpdateHex(updates);
      return;
    }

    const neighborHex = realm.hexes.find((h) => h.q === neighborCoords.q && h.r === neighborCoords.r);

    if (neighborHex) {
      const oppositeEdge = (edge + 3) % 6;
      const newNeighborEdges = isAdding
        ? [...neighborHex.barrierEdges, oppositeEdge]
        : neighborHex.barrierEdges.filter((e) => e !== oppositeEdge);
      const updatedNeighborHex = {
        ...neighborHex,
        barrierEdges: [...new Set(newNeighborEdges)].sort((a, b) => a - b),
      };
      updates.push(updatedNeighborHex);
    }
    onUpdateHex(updates);
  };

  const handleMythToggle = () => {
    if (!selectedHex) return;
    if (selectedHex.myth) onRemoveMyth(selectedHex);
    else onAddMyth(selectedHex);
  };

  const previewHexSize = { x: 45, y: 45 };
  const previewHexCorners = getHexCorners('pointy', previewHexSize);
  const isSeatOfPower =
    realm && selectedHex.q === realm.seatOfPower.q && selectedHex.r === realm.seatOfPower.r;

  return (
    <aside className="w-80 bg-[var(--color-background-primary)] border-l border-[var(--color-border-primary)] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Hex (<span className="font-decorative">{selectedHex.q}</span>,{' '}
          <span className="font-decorative">{selectedHex.r}</span>)
        </h2>
        <button onClick={onDeselect} className="p-1 rounded-full hover:bg-[var(--color-surface-secondary)]" aria-label="Deselect Hex">
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {renderSelect('Terrain', selectedHex.terrain, tileSets.terrain, (e) =>
          handleChange('terrain', e.target.value)
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Holding</label>
          <select
            value={selectedHex.holding || ''}
            onChange={(e) => handleChange('holding', e.target.value)}
            className="w-full p-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
          >
            <option value="">None</option>
            {tileSets.holding.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {selectedHex.holding && (
          <div className="mb-4">
            {isSeatOfPower ? (
              <div className="flex items-center justify-center gap-2 p-2 bg-[rgba(var(--color-accent-primary-rgb),0.3)] border border-[var(--color-accent-primary)] rounded-md text-[var(--color-accent-primary-hover)] text-sm">
                <Icon name="crown" className="w-4 h-4 text-[var(--color-accent-primary)]" />
                <span>This is the Seat of Power.</span>
              </div>
            ) : (
              <button
                onClick={() => onSetSeatOfPower(selectedHex)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-primary)] rounded-md hover:bg-[var(--color-accent-primary)] transition-colors"
              >
                <Icon name="crown" className="w-4 h-4" />
                Make Seat of Power
              </button>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Landmark</label>
          <select
            value={selectedHex.landmark || ''}
            onChange={(e) => handleChange('landmark', e.target.value)}
            className="w-full p-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
          >
            <option value="">None</option>
            {tileSets.landmark.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Myth</label>
          <button
            onClick={handleMythToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-primary)] rounded-md hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            <Icon name="sparkle" className="w-4 h-4" />
            {selectedHex.myth ? `Remove Myth #${selectedHex.myth}` : 'Add Myth'}
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Barriers (Click edge to toggle)
          </label>
          <div className="flex justify-center items-center p-2 bg-[var(--color-background-secondary)] rounded-md">
            <svg
              width="100"
              height="115"
              viewBox="-55 -55 110 110"
              role="group"
              aria-label="Interactive hex for toggling barriers"
            >
              <polygon
                points={previewHexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="transparent"
                stroke="rgba(234, 235, 236, 0.3)"
                strokeWidth="2"
              />
              {selectedHex.barrierEdges.map((edgeIndex) => (
                <path
                  key={`barrier-visible-${edgeIndex}`}
                  d={getBarrierPath(edgeIndex, previewHexCorners)}
                  stroke={BARRIER_COLOR}
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
              ))}
              {[...Array(6).keys()].map((edgeIndex) => (
                <g
                  key={`barrier-interactive-${edgeIndex}`}
                  onClick={() => handleBarrierToggle(edgeIndex)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleBarrierToggle(edgeIndex)}
                  className="cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label={`Toggle barrier on edge ${edgeIndex + 1}`}
                >
                  <title>{`Toggle barrier on edge ${edgeIndex + 1}`}</title>
                  <path
                    d={getBarrierPath(edgeIndex, previewHexCorners)}
                    stroke="transparent"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                  <path
                    d={getBarrierPath(edgeIndex, previewHexCorners)}
                    stroke={
                      selectedHex.barrierEdges.includes(edgeIndex)
                        ? 'var(--color-accent-primary)'
                        : 'rgba(115, 107, 35, 0.6)'
                    }
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </aside>
  );
}
