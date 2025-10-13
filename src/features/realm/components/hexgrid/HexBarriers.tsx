/**
 * @file HexBarriers.tsx
 * This component renders the barrier lines on the edges of a hexagonal cell.
 */
import React from 'react';
import type { Point } from '@/features/realm/types';
import { getBarrierPath } from '@/features/realm/utils/hexUtils';

interface HexBarriersProps {
  barrierEdges: number[];
  hexCorners: Point[];
  barrierColor: string;
  showBarriers: boolean;
}

export const HexBarriers = ({
  barrierEdges,
  hexCorners,
  barrierColor,
  showBarriers,
}: HexBarriersProps) => {
  if (!showBarriers || barrierEdges.length === 0) {
    return null;
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      {barrierEdges.map((edgeIndex) => (
        <path
          key={edgeIndex}
          d={getBarrierPath(edgeIndex, hexCorners)}
          stroke={barrierColor}
          strokeWidth="6"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};
