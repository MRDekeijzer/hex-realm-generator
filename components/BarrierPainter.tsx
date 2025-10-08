
import React from 'react';
import { Icon } from './Icon';
import { BARRIER_COLOR } from '../constants';

interface BarrierPainterProps {
  onRemoveAllBarriers: () => void;
  onClose: () => void;
  barrierColor: string;
  onColorChange: (color: string) => void;
}

export function BarrierPainter({ onRemoveAllBarriers, onClose, barrierColor, onColorChange }: BarrierPainterProps) {
  const handleRemoveClick = () => {
    onRemoveAllBarriers();
  };
  
  const handleResetColor = () => {
    onColorChange(BARRIER_COLOR);
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
        
        <div className="mt-6 pt-4 border-t border-[#41403f]">
          <h3 className="text-lg font-bold mb-2">Barrier Color</h3>
          <div className="flex items-center gap-2">
            <input
              id="barrier-color"
              type="color"
              value={barrierColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-10 p-1 bg-[#324446] border border-[#41403f] rounded-md cursor-pointer"
              title="Select barrier color"
            />
            <span className="p-2 bg-[#324446] rounded-md text-sm font-mono flex-grow text-center">{barrierColor}</span>
            <button
              onClick={handleResetColor}
              className="p-2 text-[#a7a984] bg-[#324446] rounded-md hover:bg-[#435360] transition-colors"
              title="Reset to default color"
            >
              <Icon name="reset" className="w-5 h-5" />
            </button>
          </div>
        </div>

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