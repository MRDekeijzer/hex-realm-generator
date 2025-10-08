import React from 'react';
import type { Tool } from '../types';
import { Icon } from './Icon';

interface ToolsPaletteProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const ToolButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void; }) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-lg transition-colors duration-150 ${isActive ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        aria-label={label}
        title={label}
    >
        <Icon name={icon} className="w-6 h-6" />
    </button>
);

export function ToolsPalette({ activeTool, setActiveTool }: ToolsPaletteProps) {
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-gray-900/80 border border-gray-700 rounded-xl shadow-lg z-10">
            <ToolButton icon="mouse-pointer-2" label="Select Tool" isActive={activeTool === 'select'} onClick={() => setActiveTool('select')} />
            <ToolButton icon="brush" label="Terrain Painter" isActive={activeTool === 'terrain'} onClick={() => setActiveTool('terrain')} />
            <ToolButton icon="barrier-painter" label="Barrier Painter" isActive={activeTool === 'barrier'} onClick={() => setActiveTool('barrier')} />
            <ToolButton icon="map-pin-pen" label="Points of Interest Painter" isActive={activeTool === 'poi'} onClick={() => setActiveTool('poi')} />
            <ToolButton icon="sparkles" label="Myth Tool" isActive={activeTool === 'myth'} onClick={() => setActiveTool('myth')} />
        </div>
    );
}