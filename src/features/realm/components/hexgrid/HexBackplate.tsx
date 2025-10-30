/**
 * @file HexBackplate.tsx
 * Renders holdings and landmarks inside a hex, including optional backplates,
 * user-defined icon/backplate colors, and the seat-of-power crown.
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
  markerIconColor: string | null;
  markerBackdropColor: string | null;
}

const maskStyles = (href: string): React.CSSProperties => ({
  width: '100%',
  height: '100%',
  backgroundColor: 'currentColor',
  pointerEvents: 'none',
  WebkitMaskImage: `url(${href})`,
  maskImage: `url(${href})`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
});

const renderMaskedBlock = (
  href: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number
) => (
  <foreignObject
    x={x}
    y={y}
    width={width}
    height={height}
    pointerEvents="none"
    requiredExtensions="http://www.w3.org/1999/xhtml"
  >
    <div style={{ ...maskStyles(href), color }} />
  </foreignObject>
);

export const HexBackplate = ({
  activeTile,
  hexCorners: _hexCorners,
  viewOptions,
  isSeatOfPower,
  isHolding: _isHolding,
  markerIconColor,
  markerBackdropColor,
}: HexBackplateProps) => {
  if (!activeTile) {
    return null;
  }

  const markerIcon = activeTile.markerIcon ?? '';
  const markerBackdrop = activeTile.markerBackdrop ?? '';
  const hasMarkerAsset = Boolean(markerIcon);
  const hasMarkerBackdrop = Boolean(markerBackdrop);

  const backdropColor = markerBackdropColor ?? '#FFFFFF';
  const iconColor = markerIconColor ?? '#000000';

  const iconScale = 1.25;
  const iconWidth = viewOptions.hexSize.x * iconScale;
  const iconHeight = viewOptions.hexSize.y * iconScale;

  const backdropScale = 1.25;
  const backdropWidth = viewOptions.hexSize.x * backdropScale;
  const backdropHeight = viewOptions.hexSize.y * backdropScale;

  const crownScale = 0.5;
  const crownWidth = viewOptions.hexSize.x * crownScale;
  const crownHeight = viewOptions.hexSize.y * crownScale;
  const crownYOffset = iconHeight / 2 + crownHeight * 0.18;

  const halfBackdropWidth = backdropWidth / 2;
  const halfBackdropHeight = backdropHeight / 2;
  const halfIconWidth = iconWidth / 2;
  const halfIconHeight = iconHeight / 2;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {hasMarkerBackdrop &&
        renderMaskedBlock(
          markerBackdrop,
          backdropColor,
          -halfBackdropWidth,
          -halfBackdropHeight,
          backdropWidth,
          backdropHeight
        )}
      {hasMarkerAsset
        ? renderMaskedBlock(
            markerIcon,
            iconColor,
            -halfIconWidth,
            -halfIconHeight,
            iconWidth,
            iconHeight
          )
        : activeTile.icon && (
            <Icon
              name={activeTile.icon}
              x={-halfIconWidth}
              y={-halfIconHeight}
              width={iconWidth}
              height={iconHeight}
              className="text-text-inverse"
              style={{ color: iconColor }}
              strokeWidth={2}
            />
          )}
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
    </g>
  );
};
