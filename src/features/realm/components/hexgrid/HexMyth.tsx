/**
 * @file HexMyth.tsx
 * This component renders the myth indicator on a hexagonal cell.
 */
import React from 'react';
import type { Point } from '@/features/realm/types';
import {
  DEFAULT_MYTH_MARKER_FILL_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_WIDTH,
  TEXT_INVERSE_COLOR,
} from '@/features/realm/config/constants';

interface HexMythProps {
  mythId: number | undefined;
  showMyths: boolean;
  hexSize: Point;
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

const ICON_SCALE = 1.25;
const CROWN_SCALE = 0.5;
const CROWN_VERTICAL_OFFSET_FACTOR = 0.18;
const MYTH_FONT_SCALE = 1.25;

export const HexMyth = ({
  mythId,
  showMyths,
  hexSize,
  fillColor = DEFAULT_MYTH_MARKER_FILL_COLOR,
  borderColor = DEFAULT_MYTH_MARKER_BORDER_COLOR,
  borderWidth = DEFAULT_MYTH_MARKER_BORDER_WIDTH,
}: HexMythProps) => {
  if (!showMyths || !mythId) {
    return null;
  }

  const iconHeight = hexSize.y * ICON_SCALE;
  const crownHeight = hexSize.y * CROWN_SCALE;
  const crownWidth = hexSize.x * CROWN_SCALE;
  const crownYOffset = iconHeight / 2 + crownHeight * CROWN_VERTICAL_OFFSET_FACTOR;

  const mythCenterY = -crownYOffset + crownHeight / 2;
  const mythRadius = crownWidth / 2;
  const mythFontSize = mythRadius * MYTH_FONT_SCALE;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle
        cx={0}
        cy={mythCenterY}
        r={mythRadius}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
      <text
        x={0}
        y={mythCenterY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={TEXT_INVERSE_COLOR}
        className="font-myth-number"
        fontSize={mythFontSize}
        fontFamily="AnglicanText, serif"
      >
        {mythId}
      </text>
    </g>
  );
};
