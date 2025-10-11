/**
 * @file BarrierPainterSidebar.tsx
 * This component renders the sidebar for the Barrier Painter tool.
 * It provides controls for changing the barrier color and an action
 * to remove all barriers from the map.
 */

import React, { useRef } from 'react';
import { Icon } from '../Icon';
import { BARRIER_COLOR as DEFAULT_BARRIER_COLOR } from '@/features/realm/config/constants';

/**
 * Props for the BarrierPainterSidebar component.
 */
interface BarrierPainterSidebarProps {
  /** Callback function to request the removal of all barriers. */
  onRemoveAllBarriers: () => void;
  /** Callback function to close the sidebar. */
  onClose: () => void;
  /** The current color of the barriers. */
  barrierColor: string;
  /** Callback function to update the barrier color. */
  onColorChange: (color: string) => void;
}

/**
 * The sidebar component for the barrier painting tool.
 */
export function BarrierPainterSidebar({
  onRemoveAllBarriers,
  onClose,
  barrierColor,
  onColorChange,
}: BarrierPainterSidebarProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isCustomColor = barrierColor !== DEFAULT_BARRIER_COLOR;

  return (
    <aside className="w-80 bg-[var(--color-background-primary)] border-l border-[var(--color-border-primary)] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Barrier Painter</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-[var(--color-surface-secondary)]"
          aria-label="Close Barrier Painter"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Click and drag on hex edges to add or remove barriers.
        </p>

        <div className="mt-6 pt-4 border-t border-[var(--color-border-primary)]">
          <h3 className="text-lg font-bold mb-2">Barrier Color</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                isCustomColor
                  ? onColorChange(DEFAULT_BARRIER_COLOR)
                  : colorInputRef.current?.click()
              }
              className="w-10 h-10 rounded-md flex-shrink-0 border border-black/20 relative group"
              style={{ backgroundColor: barrierColor }}
              title={isCustomColor ? 'Reset to default color' : 'Edit color'}
              aria-label={
                isCustomColor ? 'Reset barrier color to default' : 'Select custom barrier color'
              }
            >
              <input
                ref={colorInputRef}
                type="color"
                value={barrierColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="opacity-0 w-0 h-0 absolute pointer-events-none"
                aria-label="Barrier color picker"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Icon name={isCustomColor ? 'reset' : 'pipette'} className="w-5 h-5 text-white" />
              </div>
            </button>
            <span className="p-2 bg-[var(--color-surface-primary)] rounded-md text-sm font-mono flex-grow text-center">
              {barrierColor.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={onRemoveAllBarriers}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[rgba(var(--color-accent-danger-rgb),0.5)] rounded-md hover:bg-[rgba(var(--color-accent-danger-rgb),0.8)] border border-[var(--color-accent-danger)] transition-colors"
        >
          <Icon name="trash-2" className="w-4 h-4" />
          Remove All Barriers
        </button>
      </div>
    </aside>
  );
}
