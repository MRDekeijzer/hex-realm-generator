/**
 * @file HexMyth.tsx
 * This component renders the myth indicator on a hexagonal cell.
 */
import React from 'react';
import type { Point } from '../../types';
import { MYTH_COLOR } from '../../constants';

interface HexMythProps {
  mythId: number | undefined;
  isGmView: boolean;
  hexSize: Point;
}

export const HexMyth = ({ mythId, isGmView, hexSize }: HexMythProps) => {
  if (!isGmView || !mythId) {
    return null;
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle r={hexSize.x * 0.3} fill={MYTH_COLOR} />
      <text textAnchor="middle" dy=".3em" fill="var(--color-text-inverse)" className="font-myth-number">
        {mythId}
      </text>
    </g>
  );
};