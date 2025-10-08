/**
 * @file HistoryControls.tsx
 * This component renders a floating panel with Undo and Redo buttons.
 */
import React from 'react';
import { Icon } from './Icon';

/**
 * Props for the HistoryControls component.
 */
interface HistoryControlsProps {
  /** Callback to trigger the undo action. */
  onUndo: () => void;
  /** Callback to trigger the redo action. */
  onRedo: () => void;
  /** Whether the undo action is available. */
  canUndo: boolean;
  /** Whether the redo action is available. */
  canRedo: boolean;
}

/**
 * A component that renders floating Undo/Redo controls.
 */
export function HistoryControls({ onUndo, onRedo, canUndo, canRedo }: HistoryControlsProps) {
  return (
    <div className="absolute bottom-4 right-[21rem] bg-[#191f29]/80 border border-[#41403f] p-2 rounded-lg shadow-lg flex items-center gap-2 z-10">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#a7a984] hover:bg-[#435360] enabled:hover:text-[#eaebec]"
        title="Undo (Ctrl+Z)"
      >
        <Icon name="undo" className="w-5 h-5" />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[#a7a984] hover:bg-[#435360] enabled:hover:text-[#eaebec]"
        title="Redo (Ctrl+Y)"
      >
        <Icon name="redo" className="w-5 h-5" />
      </button>
    </div>
  );
}