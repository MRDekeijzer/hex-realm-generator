/**
 * @file Hexagon.tsx
 * This component represents a single hexagonal cell in the grid.
 * It handles rendering the hex's terrain, icons, barriers, and interaction states
 * like selection and hover highlights. It is memoized for performance.
 */
import React, { useMemo } from 'react';
import type { Hex, ViewOptions, Point, Tool, TileSet, TerrainTextures } from '../types';
import { axialToPixel, getBarrierPath } from '../utils/hexUtils';
import {
  MYTH_COLOR,
  SELECTION_COLOR,
  SEAT_OF_POWER_COLOR,
  HOLDING_ICON_BORDER_COLOR,
  LANDMARK_ICON_BORDER_COLOR,
} from '../constants';
import { Icon } from './Icon';

interface HexagonProps {
  hex: Hex;
  viewOptions: ViewOptions;
  tileSets: TileSet;
  terrainTextures: TerrainTextures | null;
  barrierColor: string;
  isSelected: boolean;
  isSeatOfPower: boolean;
  isSpacePanActive: boolean;
  activeTool: Tool;
  isPickingTile: boolean;
  onMouseDown: (hex: Hex, e: React.MouseEvent) => void;
  onMouseMove: (hex: Hex, e: React.MouseEvent) => void;
  // Memoized geometry passed from parent
  hexCorners: Point[];
  hexCornersInnerHighlight: Point[];
  hexBoundingBox: { x: number; y: number; width: number; height: number };
}

export const Hexagon = React.memo(
  ({
    hex,
    viewOptions,
    tileSets,
    terrainTextures,
    barrierColor,
    isSelected,
    isSeatOfPower,
    isSpacePanActive,
    activeTool,
    isPickingTile,
    onMouseDown,
    onMouseMove,
    hexCorners,
    hexCornersInnerHighlight,
    hexBoundingBox,
  }: HexagonProps) => {
    const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);

    const holdingTile = useMemo(
      () => (hex.holding ? tileSets.holding.find((t) => t.id === hex.holding) : null),
      [hex.holding, tileSets.holding]
    );

    const landmarkTile = useMemo(
      () => (hex.landmark ? tileSets.landmark.find((t) => t.id === hex.landmark) : null),
      [hex.landmark, tileSets.landmark]
    );

    const activeTile = holdingTile || (viewOptions.isGmView ? landmarkTile : null);
    const isHolding = !!holdingTile;

    const backplateBorderColor = isSeatOfPower
      ? SEAT_OF_POWER_COLOR
      : isHolding
      ? HOLDING_ICON_BORDER_COLOR
      : LANDMARK_ICON_BORDER_COLOR;

    const textureSet = terrainTextures ? terrainTextures[hex.terrain] : null;
    const textureUrl = textureSet
      ? viewOptions.showIconSpray
        ? textureSet.withSpray
        : textureSet.withoutSpray
      : '';

    return (
      <g
        transform={`translate(${center.x}, ${center.y})`}
        onMouseDown={(e) => onMouseDown(hex, e)}
        onMouseMove={(e) => onMouseMove(hex, e)}
        className="group"
        style={{ pointerEvents: isSpacePanActive ? 'none' : 'auto' }}
      >
        {/* Layer 1: Texture & Grid */}
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
          <polygon points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')} fill="#FF00FF" />
        )}

        {viewOptions.showGrid && (
          <polygon
            points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={viewOptions.gridColor}
            strokeWidth={viewOptions.gridWidth}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Hover highlight */}
        <polygon
          points={hexCornersInnerHighlight.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgba(115, 107, 35, 0.8)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className={`opacity-0 ${
            activeTool !== 'barrier' && activeTool !== 'terrain' && !isPickingTile
              ? 'group-hover:opacity-100'
              : ''
          } transition-opacity duration-150`}
          style={{ pointerEvents: 'none' }}
        />

        {/* Selection highlight */}
        {isSelected && activeTool !== 'barrier' && (
          <polygon
            points={hexCornersInnerHighlight.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={SELECTION_COLOR}
            strokeWidth={4}
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Layer 2: Icons and Details */}
        <g style={{ pointerEvents: 'none' }}>
          {activeTile?.icon && (
            <g>
              <polygon
                points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
                transform="scale(0.75)"
                fill="#eaebec"
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
                className="text-[#221f21]"
                strokeWidth={2}
              />
            </g>
          )}
          {viewOptions.isGmView && hex.myth && (
            <g>
              <circle r={viewOptions.hexSize.x * 0.25} fill={MYTH_COLOR} />
              <text textAnchor="middle" dy=".3em" fill="#221f21" className="font-myth-number">
                {hex.myth}
              </text>
            </g>
          )}
        </g>

        {/* Layer 3: Barriers */}
        {viewOptions.isGmView &&
          hex.barrierEdges.length > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {hex.barrierEdges.map((edgeIndex) => (
                <path
                  key={edgeIndex}
                  d={getBarrierPath(edgeIndex, hexCorners)}
                  stroke={barrierColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              ))}
            </g>
          )}
      </g>
    );
  }
);
Hexagon.displayName = 'Hexagon';