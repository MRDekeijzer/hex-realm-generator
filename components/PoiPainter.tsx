
import React from 'react';
import { Icon } from './Icon';
// FIX: Rename imported `DEFAULT_TILE_SETS` to `TILE_SETS` as `TILE_SETS` is not an exported member of `constants`.
import { DEFAULT_TILE_SETS as TILE_SETS, SPECIAL_POI_ICONS } from '../constants';
import type { Tile } from '../types';

interface PoiPainterProps {
  paintPoi: string | null;
  setPaintPoi: (poi: string) => void;
  onClose: () => void;
}

const PoiButton = ({ item, isSelected, onClick }: { item: Tile; isSelected: boolean; onClick: () => void; }) => {
    return (
        <button
            key={item.id}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg transition-all duration-150 border-2 text-center
              ${isSelected ? 'bg-[#736b23]/20 border-[#736b23] text-[#eaebec]' : 'bg-[#18272e] border-[#41403f] hover:border-[#a7a984] text-[#a7a984]'}`}
            title={`Place ${item.label}`}
            aria-label={`Select ${item.label} for placement`}
        >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#324446]"
            >
              <Icon name={item.icon} className="w-8 h-8 text-[#eaebec]" strokeWidth={2} />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
        </button>
    );
};

const PoiSection = ({ title, items, type, paintPoi, setPaintPoi }: {
    title: string;
    items: Tile[];
    type: string;
    paintPoi: string | null;
    setPaintPoi: (poi: string) => void;
}) => (
    <div>
        <h3 className="text-lg font-semibold mb-2 text-[#a7a984]">{title}</h3>
        <div className="grid grid-cols-3 gap-2">
            {items.map(item => {
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


export function PoiPainter({ paintPoi, setPaintPoi, onClose }: PoiPainterProps) {
  return (
    <aside className="w-80 bg-[#191f29] border-l border-[#41403f] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Points of Interest</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[#435360]">
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">
        <p className="text-sm text-[#a7a984]">Select an item, then click a hex to place it.</p>
        
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