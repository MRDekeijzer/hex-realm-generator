import React, { useRef, useState, useCallback } from 'react';
import { MASK_RESOLUTION } from '@/features/realm/config/constants';

interface PlacementMaskEditorProps {
  mask: number[];
  onUpdateMask: (newMask: number[]) => void;
}

const GRID_AREA = MASK_RESOLUTION * MASK_RESOLUTION;

export const PlacementMaskEditor: React.FC<PlacementMaskEditorProps> = ({ mask, onUpdateMask }) => {
  const [isPainting, setIsPainting] = useState(false);
  const paintValue = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePaint = useCallback(
    (index: number) => {
      const currentMask = mask[index];
      if (currentMask !== undefined && currentMask !== paintValue.current) {
        const newMask = [...mask];
        newMask[index] = paintValue.current;
        onUpdateMask(newMask);
      }
    },
    [mask, onUpdateMask]
  );

  const getIndexFromEvent = (event: React.MouseEvent<HTMLDivElement>): number | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cellWidth = rect.width / MASK_RESOLUTION;
    const cellHeight = rect.height / MASK_RESOLUTION;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (col >= 0 && col < MASK_RESOLUTION && row >= 0 && row < MASK_RESOLUTION) {
      return row * MASK_RESOLUTION + col;
    }
    return null;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const index = getIndexFromEvent(event);
    if (index !== null) {
      setIsPainting(true);
      const currentMaskValue = mask[index];
      paintValue.current = currentMaskValue === 1 ? 0 : 1;
      handlePaint(index);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPainting) return;
    const index = getIndexFromEvent(event);
    if (index !== null) {
      handlePaint(index);
    }
  };

  const handleFill = () => onUpdateMask(new Array(GRID_AREA).fill(1));
  const handleEmpty = () => onUpdateMask(new Array(GRID_AREA).fill(0));

  return (
    <div>
      <label className="block text-sm font-medium text-text-muted">Placement Mask</label>
      <p className="text-xs text-text-muted mt-1 mb-2">
        Click and drag to paint the green area where icons are allowed to appear. This defines the
        placement area within the hex.
      </p>
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="relative w-full max-w-[140px] md:max-w-[180px] bg-realm-command-panel-surface rounded-md overflow-hidden select-none aspect-square"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsPainting(false)}
          onMouseLeave={() => setIsPainting(false)}
        >
          <div
            className="grid h-full"
            style={{ gridTemplateColumns: `repeat(${MASK_RESOLUTION}, minmax(0, 1fr))` }}
          >
            {mask.map((value, index) => (
              <div
                key={index}
                className={`border border-border-panel-divider/40 transition-colors ${
                  value ? 'bg-feedback-success-highlight/60' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
          <div className="absolute inset-0 pointer-events-none border border-border-panel-divider rounded-md" />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={handleEmpty}
          type="button"
          className="text-xs px-2 py-1 rounded-md bg-realm-command-panel-surface text-text-muted hover:bg-realm-command-panel-hover transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleFill}
          type="button"
          className="text-xs px-2 py-1 rounded-md bg-feedback-success-highlight text-text-high-contrast hover:bg-actions-command-primary-hover transition-colors"
        >
          Fill
        </button>
      </div>
    </div>
  );
};
