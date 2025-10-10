/**
 * @file ToolsPalette.tsx
 * This component renders the floating palette of tools at the bottom of the screen,
 * allowing the user to switch between different interaction modes (select, paint, etc.).
 */

import React from 'react';
import type { Tool } from '../types';
import { Icon } from './Icon';

/**
 * Props for the ToolsPalette component.
 */
interface ToolsPaletteProps {
  /** The currently active tool. */
  activeTool: Tool;
  /** Callback to set the active tool. */
  setActiveTool: (tool: Tool) => void;
}

interface ToolButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * A reusable button component for the tools palette.
 */
// FIX: Changed to React.FC to correctly type as a component, resolving key prop errors.
const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg transition-colors duration-150 ${
      isActive ? 'bg-[#736b23] text-[#eaebec]' : 'bg-[#324446] text-[#a7a984] hover:bg-[#435360]'
    }`}
    aria-label={label}
    title={label}
  >
    <Icon name={icon} className="w-6 h-6" />
  </button>
);

/**
 * A floating palette for selecting the active map interaction tool.
 */
export function ToolsPalette({ activeTool, setActiveTool }: ToolsPaletteProps) {
  const tools: { id: Tool; icon: string; label: string }[] = [
    { id: 'select', icon: 'mouse-pointer-2', label: 'Select Tool' },
    { id: 'terrain', icon: 'brush', label: 'Terrain Painter' },
    { id: 'barrier', icon: 'barrier-painter', label: 'Barrier Painter' },
    { id: 'poi', icon: 'map-pin-pen', label: 'Points of Interest Painter' },
    { id: 'myth', icon: 'sparkle', label: 'Myth Tool' },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-[#191f29]/80 border border-[#41403f] rounded-xl shadow-lg z-10">
      {tools.map((tool) => (
        <ToolButton
          key={tool.id}
          icon={tool.icon}
          label={tool.label}
          isActive={activeTool === tool.id}
          onClick={() => setActiveTool(tool.id)}
        />
      ))}
    </div>
  );
}