/**
 * @file Hexagon.tsx
 * This component represents a single hexagonal cell in the grid.
 * It handles rendering the hex's terrain, icons, barriers, and interaction states
 * like selection and hover highlights. It is memoized for performance.
 */
import React, { useMemo } from 'react';
import type {
  Hex,
  ViewOptions,
  Point,
  Tool,
  TileSet,
  TerrainTextures,
} from '@/features/realm/types';
import { axialToPixel } from '@/features/realm/utils/hexUtils';
import { HexHoverHighlight } from './HexHoverHighlight';
import { HexBackplate } from './HexBackplate';
import { HexSelectionHighlight } from './HexSelectionHighlight';
import { HexMyth } from './HexMyth';
import { HexBarriers } from './HexBarriers';
import { HexTerrain } from './HexTerrain';

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
  hexCorners: Point[];
  hexCornersInnerHighlight: Point[];
  hexBoundingBox: { x: number; y: number; width: number; height: number };
  layer: 'background' | 'foreground';
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
    layer,
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

    const activeTile: typeof holdingTile = holdingTile ?? (viewOptions.isGmView ? landmarkTile ?? null : null);
    const isHolding = !!holdingTile;

    const textureSet = terrainTextures ? terrainTextures[hex.terrain] : null;
    let textureUrl = '';
    if (textureSet) {
      let selectedTexture;
      if (viewOptions.showIconSpray) {
        selectedTexture = textureSet.withSpray;
      } else {
        selectedTexture = textureSet.withoutSpray;
      }
      textureUrl = selectedTexture;
    }

    return (
      <g
        transform={`translate(${center.x}, ${center.y})`}
        onMouseDown={(e) => onMouseDown(hex, e)}
        onMouseMove={(e) => onMouseMove(hex, e)}
        className="group"
        style={{ pointerEvents: isSpacePanActive ? 'none' : 'auto' }}
      >
        {layer === 'background' && (
          <>
            <HexTerrain
              textureUrl={textureUrl}
              hexBoundingBox={hexBoundingBox}
              hexCorners={hexCorners}
              showGrid={viewOptions.showGrid}
              gridColor={viewOptions.gridColor}
              gridWidth={viewOptions.gridWidth}
            />

            <HexBackplate
              activeTile={activeTile}
              hexCorners={hexCorners}
              viewOptions={viewOptions}
              isSeatOfPower={isSeatOfPower}
              isHolding={isHolding}
            />
            <HexMyth
              mythId={hex.myth}
              isGmView={viewOptions.isGmView}
              hexSize={viewOptions.hexSize}
            />
          </>
        )}

        {layer === 'foreground' && (
          <>
            {/* Transparent, hittable area for hover detection */}
            <polygon
              points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="transparent"
              stroke="none"
            />
            <HexHoverHighlight
              points={hexCornersInnerHighlight}
              activeTool={activeTool}
              isPickingTile={isPickingTile}
            />
            <HexSelectionHighlight
              points={hexCornersInnerHighlight}
              isSelected={isSelected}
              activeTool={activeTool}
            />
            <HexBarriers
              barrierEdges={hex.barrierEdges}
              hexCorners={hexCorners}
              barrierColor={barrierColor}
              isGmView={viewOptions.isGmView}
            />
          </>
        )}
      </g>
    );
  }
);
Hexagon.displayName = 'Hexagon';
