import React, { useMemo } from 'react';
import { Icon } from '@/features/realm/components/Icon';
import { generateSprayIcons } from '@/features/realm/utils/sprayUtils';
import { getHexCorners } from '@/features/realm/utils/hexUtils';
import type { Tile, Point } from '@/features/realm/types';
import { BORDER_PANEL_DIVIDER_COLOR } from '@/features/realm/config/constants';
import { resolveColorToken } from '@/app/theme/colors';

const PREVIEW_HEX_SIZE: Point = { x: 50, y: 50 };

interface HexSprayPreviewProps {
  terrain: Tile;
}

export const HexSprayPreview: React.FC<HexSprayPreviewProps> = ({ terrain }) => {
  const hexCorners = useMemo(() => getHexCorners('pointy', PREVIEW_HEX_SIZE), []);

  const iconsToRender = useMemo(() => {
    const mockHex = { q: 0, r: 0, s: 0, terrain: terrain.id, barrierEdges: [] };
    return generateSprayIcons(mockHex, terrain, PREVIEW_HEX_SIZE);
  }, [terrain]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="-55 -55 110 110">
        <g>
          <polygon
            points={hexCorners.map((point) => `${point.x},${point.y}`).join(' ')}
            fill={terrain.color ? resolveColorToken(terrain.color) : '#CCCCCC'}
            stroke={BORDER_PANEL_DIVIDER_COLOR}
            strokeWidth="1"
          />
          <g>
            {iconsToRender.map((icon, index) => (
              <g key={index} transform={`translate(${icon.x}, ${icon.y}) rotate(${icon.rotation})`}>
                <Icon
                  name={icon.name}
                  style={{ opacity: icon.opacity, color: icon.color }}
                  width={icon.size}
                  height={icon.size}
                  x={-icon.size / 2}
                  y={-icon.size / 2}
                  strokeWidth={2.5}
                />
              </g>
            ))}
          </g>
        </g>
      </svg>
      <p className="text-xs text-center text-text-muted">
        This pattern is consistent for all '{terrain.label}' hexes.
      </p>
    </div>
  );
};
