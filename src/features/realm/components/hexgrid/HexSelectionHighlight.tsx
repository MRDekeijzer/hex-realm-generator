/**
 * @file HexSelectionHighlight.tsx
 * This component renders the selection highlight effect for a hexagonal cell.
 */
import React from 'react';
import type { Point, Tool } from '@/features/realm/types';
import { SELECTION_COLOR } from '@/features/realm/config/constants';

interface HexSelectionHighlightProps {
  points: Point[];
  isSelected: boolean;
  activeTool: Tool;
}

export const HexSelectionHighlight = ({
  points,
  isSelected,
  activeTool,
}: HexSelectionHighlightProps) => {
  if (!isSelected || activeTool === 'barrier') {
    return null;
  }

  return (
    <polygon
      points={points.map((p) => `${p.x},${p.y}`).join(' ')}
      fill="none"
      stroke={SELECTION_COLOR}
      strokeWidth={4}
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
    />
  );
};
