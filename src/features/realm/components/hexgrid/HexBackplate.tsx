/**
 * @file HexBackplate.tsx
 * Renders the icon overlay for holdings and landmarks within a hex.
 */
import React from 'react';
import type { Point, Tile, ViewOptions } from '@/features/realm/types';
import { Icon } from '../Icon';
import { SEAT_OF_POWER_COLOR } from '@/features/realm/config/constants';

interface HexBackplateProps {
  activeTile: Tile | null;
  hexCorners: Point[];
  viewOptions: ViewOptions;
  isSeatOfPower: boolean;
  isHolding: boolean;
}

export const HexBackplate = ({
  activeTile,
  hexCorners: _hexCorners,
  viewOptions,
  isSeatOfPower,
  isHolding: _isHolding,
}: HexBackplateProps) => {
  if (!activeTile) {
    return null;
  }

  const hasMarkerAsset = Boolean(activeTile.markerIcon);
  const iconScale = 1.5;
  const iconWidth = viewOptions.hexSize.x * iconScale;
  const iconHeight = viewOptions.hexSize.y * iconScale;
  const crownScale = 0.5;
  const crownWidth = viewOptions.hexSize.x * crownScale;
  const crownHeight = viewOptions.hexSize.y * crownScale;
  const crownYOffset = iconHeight / 2 + crownHeight * 0.27;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {isSeatOfPower && (
        <Icon
          name="crown"
          x={-crownWidth / 2}
          y={-crownYOffset}
          width={crownWidth}
          height={crownHeight}
          strokeWidth={2}
          style={{ color: SEAT_OF_POWER_COLOR }}
        />
      )}
      {hasMarkerAsset ? (
        <image
          href={activeTile.markerIcon}
          x={-iconWidth / 2}
          y={-iconHeight / 2}
          width={iconWidth}
          height={iconHeight}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        activeTile.icon && (
          <Icon
            name={activeTile.icon}
            x={-iconWidth / 2}
            y={-iconHeight / 2}
            width={iconWidth}
            height={iconHeight}
            className="text-text-inverse"
            strokeWidth={2}
          />
        )
      )}
    </g>
  );
};
