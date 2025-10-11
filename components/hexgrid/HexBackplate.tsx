/**
 * @file HexBackplate.tsx
 * This component renders the backplate and icon for holdings and landmarks on a hex.
 */
import React from 'react';
import type { Point, Tile, ViewOptions } from '../../types';
import { Icon } from '../Icon';
import {
  SEAT_OF_POWER_COLOR,
  HOLDING_ICON_BORDER_COLOR,
  LANDMARK_ICON_BORDER_COLOR,
} from '../../constants';

interface HexBackplateProps {
  activeTile: Tile | null;
  hexCorners: Point[];
  viewOptions: ViewOptions;
  isSeatOfPower: boolean;
  isHolding: boolean;
}

export const HexBackplate = ({
  activeTile,
  hexCorners,
  viewOptions,
  isSeatOfPower,
  isHolding,
}: HexBackplateProps) => {
  if (!activeTile?.icon) {
    return null;
  }

  const backplateBorderColor = isSeatOfPower
    ? SEAT_OF_POWER_COLOR
    : isHolding
    ? HOLDING_ICON_BORDER_COLOR
    : LANDMARK_ICON_BORDER_COLOR;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <polygon
        points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
        transform="scale(0.75)"
        fill="var(--color-surface-tertiary)"
        stroke={backplateBorderColor}
        strokeWidth={isSeatOfPower ? 6 / 0.75 : 4 / 0.75}
        strokeLinejoin="round"
      />
      <Icon
        name={activeTile.icon}
        x={-viewOptions.hexSize.x * 0.4}
        y={-viewOptions.hexSize.y * 0.4}
        width={viewOptions.hexSize.x * 0.8}
        height={viewOptions.hexSize.y * 0.8}
        className="text-[var(--color-text-inverse)]"
        strokeWidth={2}
      />
    </g>
  );
};