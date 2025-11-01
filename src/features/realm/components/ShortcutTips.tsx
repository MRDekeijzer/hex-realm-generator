/**
 * @file ShortcutTips.tsx
 * This component displays a small, unobtrusive list of keyboard shortcuts
 * on the main map view.
 */
import React from 'react';
import { Icon } from './Icon';

/**
 * A reusable component for displaying a single shortcut entry.
 */
const Shortcut = ({ keys, description }: { keys: string[]; description: string }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center">
      {keys.map((key, index) => (
        <React.Fragment key={`${key}-${index}`}>
          <kbd className="px-1.5 py-0.5 rounded bg-realm-command-panel-surface font-sans">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="mx-1">+</span>}
        </React.Fragment>
      ))}
    </div>
    <span>{description}</span>
  </div>
);

interface ShortcutTipsProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * A component that renders a list of helpful keyboard shortcuts.
 */
export function ShortcutTips({ collapsed, onToggleCollapse }: ShortcutTipsProps) {
  const shortcuts: { keys: string[]; description: string }[] = [
    { keys: ['1'], description: 'Select Tool' },
    { keys: ['2'], description: 'Terrain Painter' },
    { keys: ['3'], description: 'Barrier Painter' },
    { keys: ['4'], description: 'Points of Interest Painter' },
    { keys: ['5'], description: 'Myth Tool' },
    { keys: ['P'], description: 'View Presets' },
    { keys: ['Space'], description: 'Pan Map' },
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Y'], description: 'Redo' },
    { keys: ['Ctrl', 'I'], description: 'Pipette Tool' },
  ];

  return (
    <div className="absolute bottom-4 left-4 bg-realm-canvas-backdrop/80 border border-border-panel-divider rounded-lg shadow-lg text-xs text-text-muted z-10 pointer-events-auto max-w-xs">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-semibold text-text-high-contrast hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
        aria-expanded={!collapsed}
        aria-controls="keyboard-shortcuts-panel"
      >
        <span className="truncate">Keyboard Shortcuts</span>
        <Icon name={collapsed ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 shrink-0" />
      </button>
      <div
        id="keyboard-shortcuts-panel"
        aria-hidden={collapsed}
        className={`transition-all duration-200 ease-out ${
          collapsed
            ? 'max-h-0 opacity-0 overflow-hidden pointer-events-none px-3'
            : 'max-h-96 opacity-100 px-3 pb-3'
        }`}
      >
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <Shortcut
              key={shortcut.description}
              keys={shortcut.keys}
              description={shortcut.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
