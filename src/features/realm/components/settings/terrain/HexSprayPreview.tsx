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
  onReroll?: () => void;
}

export const HexSprayPreview: React.FC<HexSprayPreviewProps> = ({ terrain, onReroll }) => {
  const hexCorners = useMemo(() => getHexCorners('pointy', PREVIEW_HEX_SIZE), []);

  const iconsToRender = useMemo(() => {
    const mockHex = { q: 0, r: 0, s: 0, terrain: terrain.id, barrierEdges: [] };
    return generateSprayIcons(mockHex, terrain, PREVIEW_HEX_SIZE);
  }, [terrain]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onReroll}
        disabled={!onReroll}
        aria-label={onReroll ? `Reroll ${terrain.label} spray preview` : undefined}
        className={`group relative inline-flex items-center justify-center transition-transform ${
          onReroll
            ? 'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary focus-visible:ring-offset-2 focus-visible:ring-offset-realm-command-panel-surface'
            : 'cursor-default'
        }`}
        >
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
        {onReroll ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Icon
              name="reset"
              className="h-5 w-5 text-text-high-contrast drop-shadow opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        ) : null}
      </button>
      <p className="text-xs text-center text-text-muted">
        This pattern is consistent for all '{terrain.label}' hexes.
      </p>
    </div>
  );
};
