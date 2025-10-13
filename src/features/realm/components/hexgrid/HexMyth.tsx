/**
 * @file HexMyth.tsx
 * This component renders the myth indicator on a hexagonal cell.
 */
import React from 'react';
import type { Point } from '@/features/realm/types';
import { MYTH_COLOR, TEXT_INVERSE_COLOR } from '@/features/realm/config/constants';

interface HexMythProps {
  mythId: number | undefined;
  showMyths: boolean;
  hexSize: Point;
}

export const HexMyth = ({ mythId, showMyths, hexSize }: HexMythProps) => {
  if (!showMyths || !mythId) {
    return null;
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle r={hexSize.x * 0.3} fill={MYTH_COLOR} />
      <text
        textAnchor="middle"
        dy=".3em"
        fill={TEXT_INVERSE_COLOR}
        className="font-myth-number text-[1.8em]"
      >
        {mythId}
      </text>
    </g>
  );
};
