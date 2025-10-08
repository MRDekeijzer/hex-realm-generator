import React from 'react';
import { Icon } from './Icon';
// FIX: Rename imported `DEFAULT_TILE_SETS` to `TILE_SETS` as `TILE_SETS` is not an exported member of `constants`.
import { DEFAULT_TILE_SETS as TILE_SETS, OVERLAY_ICONS, SPECIAL_POI_ICONS } from '../constants';
import type { Tile } from '../types';

interface PoiPainterProps {
  paintPoi: string | null;
  setPaintPoi: (poi: string) => void;
  onClose: () => void;
  loadedSvgs: { [key: string]: string };
}

const PoiButton = ({ item, type, isSelected, onClick, svgText }: { item: Tile; type: string; isSelected: boolean; onClick: () => void; svgText?: string; }) => {
    const IconComponent = item.icon;

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
              {svgText ? (
                  <svg 
                      width="32" 
                      height="32" 
                      viewBox="0 0 24 24" 
                      className="text-[#eaebec]"
                      fill={'none'}
                      stroke={'currentColor'}
                      strokeWidth={type === 'overlay' ? "1.5" : "2"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  >
                      <g dangerouslySetInnerHTML={{ __html: svgText.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '') }} />
                  </svg>
              ) : (typeof IconComponent === 'function') ? (
                 <svg width="32" height="32" viewBox="0 0 24 24" className="text-[#eaebec]">
                    <IconComponent />
                 </svg>
              ) : null}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
        </button>
    );
};

const PoiSection = ({ title, items, type, paintPoi, setPaintPoi, loadedSvgs }: {
    title: string;
    items: Tile[];
    type: string;
    paintPoi: string | null;
    setPaintPoi: (poi: string) => void;
    loadedSvgs: { [key: string]: string };
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
                        type={type}
                        isSelected={paintPoi === fullId}
                        onClick={() => setPaintPoi(fullId)}
                        svgText={typeof item.icon === 'string' ? loadedSvgs[item.icon] : undefined}
                    />
                );
            })}
        </div>
    </div>
);


export function PoiPainter({ paintPoi, setPaintPoi, onClose, loadedSvgs }: PoiPainterProps) {
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
            loadedSvgs={loadedSvgs}
        />
        
        <PoiSection 
            title="Holdings"
            items={TILE_SETS.holding}
            type="holding"
            paintPoi={paintPoi}
            setPaintPoi={setPaintPoi}
            loadedSvgs={loadedSvgs}
        />
        
        <PoiSection 
            title="Landmarks"
            items={TILE_SETS.landmark}
            type="landmark"
            paintPoi={paintPoi}
            setPaintPoi={setPaintPoi}
            loadedSvgs={loadedSvgs}
        />

        <PoiSection 
            title="Overlays"
            items={OVERLAY_ICONS}
            type="overlay"
            paintPoi={paintPoi}
            setPaintPoi={setPaintPoi}
            loadedSvgs={loadedSvgs}
        />
        
      </div>
    </aside>
  );
}