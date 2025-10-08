/**
 * @file ShortcutTips.tsx
 * This component displays a small, unobtrusive list of keyboard shortcuts
 * on the main map view.
 */
import React from 'react';

/**
 * A reusable component for displaying a single shortcut.
 */
const Shortcut = ({ keys, description }: { keys: string[], description: string }) => (
    <div className="flex items-center gap-2">
        <div className="flex items-center">
            {keys.map((key, index) => (
                <React.Fragment key={key}>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#324446] font-sans">{key}</kbd>
                    {index < keys.length - 1 && <span className="mx-1">+</span>}
                </React.Fragment>
            ))}
        </div>
        <span>{description}</span>
    </div>
);

/**
 * A component that renders a list of helpful keyboard shortcuts.
 */
export function ShortcutTips() {
  return (
    <div className="absolute bottom-4 left-4 bg-[#191f29]/80 border border-[#41403f] p-3 rounded-lg shadow-lg text-xs text-[#a7a984] z-10 pointer-events-none space-y-2">
      <Shortcut keys={['Space']} description="Pan Map" />
      <Shortcut keys={['Ctrl', 'Z']} description="Undo" />
      <Shortcut keys={['Ctrl', 'Y']} description="Redo" />
      <Shortcut keys={['Ctrl', 'I']} description="Pipette Tool" />
    </div>
  );
}
