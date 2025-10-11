/**
 * @file HexTerrain.tsx
 * This component renders the base terrain texture and grid lines for a hex.
 */
import React from 'react';
import type { Point } from '@/features/realm/types';

interface HexTerrainProps {
  textureUrl: string;
  hexBoundingBox: { x: number; y: number; width: number; height: number };
  hexCorners: Point[];
  showGrid: boolean;
  gridColor: string;
  gridWidth: number;
}

export const HexTerrain = ({
  textureUrl,
  hexBoundingBox,
  hexCorners,
  showGrid,
  gridColor,
  gridWidth,
}: HexTerrainProps) => {
  return (
    <>
      {textureUrl ? (
        <image
          href={textureUrl}
          x={hexBoundingBox.x}
          y={hexBoundingBox.y}
          width={hexBoundingBox.width}
          height={hexBoundingBox.height}
          clipPath="url(#hex-clip-path)"
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        // Fallback for missing texture
        <polygon points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')} fill="#FF00FF" />
      )}

      {showGrid && (
        <polygon
          points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={gridColor}
          strokeWidth={gridWidth}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </>
  );
};
