/**
 * @file HexHoverHighlight.tsx
 * This component renders the hover highlight effect for a hexagonal cell.
 */
import React from 'react';
import type { Point, Tool } from '@/features/realm/types';
import { HEX_HOVER_COLOR } from '@/features/realm/config/constants';

interface HexHoverHighlightProps {
  points: Point[];
  activeTool: Tool;
  isPickingTile: boolean;
}

export const HexHoverHighlight = ({
  points,
  activeTool,
  isPickingTile,
}: HexHoverHighlightProps) => {
  const shouldShowHover = ['select', 'poi', 'myth'].includes(activeTool) && !isPickingTile;

  return (
    <polygon
      points={points.map((p) => `${p.x},${p.y}`).join(' ')}
      fill="none"
      stroke={HEX_HOVER_COLOR}
      strokeOpacity="0.8"
      strokeWidth="2.5"
      strokeLinejoin="round"
      className={`hex-hover-highlight opacity-0 ${
        shouldShowHover ? 'group-hover:opacity-100' : ''
      } transition-opacity duration-150`}
      style={{ pointerEvents: 'none' }}
    />
  );
};
