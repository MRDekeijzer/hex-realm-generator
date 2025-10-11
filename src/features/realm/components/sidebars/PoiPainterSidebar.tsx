/**
 * @file PoiPainterSidebar.tsx
 * This component renders the sidebar for the "Points of Interest" painter tool.
 * It allows the user to select a holding, landmark, or action to apply to hexes on the map.
 */

import React, { useEffect } from 'react';
import { Icon } from '../Icon';
import {
  DEFAULT_TILE_SETS as TILE_SETS,
  SPECIAL_POI_ICONS,
} from '@/features/realm/config/constants';
import type { Tile } from '@/features/realm/types';

/**
 * Props for the PoiPainterSidebar component.
 */
interface PoiPainterSidebarProps {
  /** The currently selected POI for painting, as a 'type:id' string. */
  paintPoi: string | null;
  /** Callback to set the POI to be painted. */
  setPaintPoi: (poi: string) => void;
  /** Callback to close the sidebar. */
  onClose: () => void;
  /** Callback to activate the tile picking mode. */
  onStartPicking: () => void;
  /** Whether the tile picking mode is currently active. */
  isPickingTile: boolean;
}

interface PoiButtonProps {
  item: Tile;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * A reusable button for selecting a POI to paint.
 */
// FIX: Changed to React.FC to correctly type as a component, resolving key prop errors.
const PoiButton: React.FC<PoiButtonProps> = ({ item, isSelected, onClick }) => {
  return (
    <button
      // FIX: Removed invalid key prop from inside component.
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg transition-all duration-150 border-2 text-center
              ${
                isSelected
                  ? 'bg-[rgba(var(--color-accent-primary-rgb),0.2)] border-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-background-secondary)] border-[var(--color-border-primary)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]'
              }`}
      title={`Place ${item.label}`}
      aria-label={`Select ${item.label} for placement`}
    >
      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[var(--color-surface-primary)]">
        <Icon
          name={item.icon}
          className="w-8 h-8 text-[var(--color-text-primary)]"
          strokeWidth={2}
        />
      </div>
      <span className="text-xs font-medium">{item.label}</span>
    </button>
  );
};

/**
 * A section within the POI painter, containing a grid of POI buttons.
 */
const PoiSection = ({
  title,
  items,
  type,
  paintPoi,
  setPaintPoi,
}: {
  title: string;
  items: Tile[];
  type: string;
  paintPoi: string | null;
  setPaintPoi: (poi: string) => void;
}) => (
  <div>
    <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-secondary)]">{title}</h3>
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const fullId = `${type}:${item.id}`;
        return (
          <PoiButton
            key={fullId}
            item={item}
            isSelected={paintPoi === fullId}
            onClick={() => setPaintPoi(fullId)}
          />
        );
      })}
    </div>
  </div>
);

/**
 * The sidebar component for the POI painting tool.
 */
export function PoiPainterSidebar({
  paintPoi,
  setPaintPoi,
  onClose,
  onStartPicking,
  isPickingTile,
}: PoiPainterSidebarProps) {
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

  return (
    <aside className="w-80 bg-[var(--color-background-primary)] border-l border-[var(--color-border-primary)] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Points of Interest</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onStartPicking}
            className={`p-2 rounded-md transition-colors ${
              isPickingTile
                ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
            title="Pick POI from Map (Ctrl+I)"
            aria-label="Pick POI from Map"
          >
            <Icon name="pipette" className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--color-surface-secondary)]"
            aria-label="Close POI Painter"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">
        {isPickingTile && (
          <div className="bg-[rgba(var(--color-accent-info-rgb),0.5)] text-center text-sm text-[var(--color-text-tertiary)] p-2 rounded-md mb-4 animate-pulse">
            Click on the map to pick a POI.
          </div>
        )}
        <p className="text-sm text-[var(--color-text-secondary)]">
          Select an item, then click a hex to place it.
        </p>
        <PoiSection
          title="Actions"
          items={SPECIAL_POI_ICONS}
          type="action"
          paintPoi={paintPoi}
          setPaintPoi={setPaintPoi}
        />
        <PoiSection
          title="Holdings"
          items={TILE_SETS.holding}
          type="holding"
          paintPoi={paintPoi}
          setPaintPoi={setPaintPoi}
        />
        <PoiSection
          title="Landmarks"
          items={TILE_SETS.landmark}
          type="landmark"
          paintPoi={paintPoi}
          setPaintPoi={setPaintPoi}
        />
      </div>
    </aside>
  );
}
