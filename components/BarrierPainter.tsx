
import React from 'react';
import { Icon } from './Icon';

interface BarrierPainterProps {
  onRemoveAllBarriers: () => void;
  onClose: () => void;
}

export function BarrierPainter({ onRemoveAllBarriers, onClose }: BarrierPainterProps) {
  const handleRemoveClick = () => {
    console.log('[BarrierPainter] "Remove All Barriers" button clicked.');
    if (window.confirm('Are you sure you want to remove all barriers from the map? This action cannot be undone.')) {
      console.log('[BarrierPainter] User confirmed. Calling onRemoveAllBarriers...');
      onRemoveAllBarriers();
    } else {
      console.log('[BarrierPainter] User cancelled barrier removal.');
    }
  };

  return (
    <aside className="w-80 bg-[#191f29] border-l border-[#41403f] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Barrier Painter</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[#435360]">
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">
        <p className="text-sm text-[#a7a984]">Click and drag on hex edges to add or remove barriers.</p>
        <button
          onClick={handleRemoveClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#a7a984] bg-[#60131b]/50 rounded-md hover:bg-[#60131b]/80 border border-[#60131b]/80 transition-colors"
        >
          <Icon name="trash-2" className="w-4 h-4" />
          Remove All Barriers
        </button>
      </div>
    </aside>
  );
}
