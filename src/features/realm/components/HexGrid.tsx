/**
 * @file HexGrid.tsx
 * This component is the core interactive map area of the application.
 * It renders the hexagonal grid using SVG, handles user interactions like
 * panning, zooming, clicking, and painting, and displays all visual
 * elements of the realm such as terrain, icons, barriers, and selections.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type {
  Realm,
  Hex,
  ViewOptions,
  Tool,
  TileSet,
  TerrainTextures,
  Point,
} from '@/features/realm/types';
import {
  axialToPixel,
  getHexCorners,
  getBarrierPath,
  findClosestEdge,
  getNeighbors,
} from '@/features/realm/utils/hexUtils';
import { usePanAndZoom } from '@/features/realm/hooks/usePanAndZoom';
import { SELECTION_COLOR } from '@/features/realm/config/constants';
import { ToolsPalette } from './ToolsPalette';
import { ShortcutTips } from './ShortcutTips';
import type { ConfirmationState } from '@/app/App';
import { Hexagon } from './hexgrid/Hexagon';

/**
 * Props for the HexGrid component.
 */
interface HexGridProps {
  realm: Realm;
  onUpdateHex: (updatedHexes: Hex | Hex[]) => void;
  viewOptions: ViewOptions;
  selectedHex: Hex | null;
  onHexClick: (hex: Hex | null) => void;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  paintTerrain: string;
  paintPoi: string | null;
  onAddMyth: (hex: Hex, andSelect?: boolean) => void;
  onRemoveMyth: (hex: Hex) => void;
  relocatingMythId: number | null;
  onRelocateMyth: (mythId: number, newHex: Hex) => void;
  onSetSeatOfPower: (hex: Hex) => void;
  tileSets: TileSet;
  terrainColors: Record<string, string>;
  barrierColor: string;
  isSettingsOpen: boolean;
  isPickingTile: boolean;
  onTilePick: (hex: Hex) => void;
  setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState | null>>;
  terrainTextures: TerrainTextures | null;
  isLoadingTextures: boolean;
}

/**
 * The main interactive hex grid component.
 */
export function HexGrid({
  realm,
  onUpdateHex,
  viewOptions,
  selectedHex,
  onHexClick,
  activeTool,
  setActiveTool,
  paintTerrain,
  paintPoi,
  onAddMyth,
  onRemoveMyth,
  relocatingMythId,
  onRelocateMyth,
  onSetSeatOfPower,
  tileSets,
  barrierColor,
  isSettingsOpen,
  isPickingTile,
  onTilePick,
  setConfirmation,
  terrainTextures,
  isLoadingTextures,
}: HexGridProps) {
  const { viewbox, containerRef, onMouseDown, onWheel, isPanning } = usePanAndZoom({
    initialWidth: 1000,
    initialHeight: 800,
    minZoom: 0.2,
    maxZoom: 5,
  });

  const hexCorners = useMemo(
    () => getHexCorners(viewOptions.orientation, viewOptions.hexSize),
    [viewOptions.orientation, viewOptions.hexSize]
  );
  const hexCornersInnerHighlight = useMemo(
    () => getHexCorners(viewOptions.orientation, viewOptions.hexSize, 0.9),
    [viewOptions.orientation, viewOptions.hexSize]
  );
  const hexBoundingBox = useMemo(() => {
    const xCoords = hexCorners.map((c) => c.x);
    const yCoords = hexCorners.map((c) => c.y);
    const minX = Math.min(...xCoords);
    const minY = Math.min(...yCoords);
    const maxX = Math.max(...xCoords);
    const maxY = Math.max(...yCoords);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [hexCorners]);

  const [isPainting, setIsPainting] = useState(false);
  const [paintedHexes, setPaintedHexes] = useState(new Map<string, Hex>());
  const barrierPaintModeRef = useRef<'add' | 'remove'>('add');
  const realmHexesMap = useMemo(
    () => new Map(realm.hexes.map((h) => [`${h.q},${h.r}`, h])),
    [realm.hexes]
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSpacePanActive, setIsSpacePanActive] = useState(false);
  const [hoveredBarrier, setHoveredBarrier] = useState<{
    q: number;
    r: number;
    edge: number;
  } | null>(null);

  /**
   * Effect to enable panning with the spacebar.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePanActive(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePanActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /**
   * Effect to apply the correct cursor class or style to the main container.
   * This is the single source of truth for the cursor's appearance.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset all custom cursors first
    const customCursorClasses = ['cursor-pipette', 'cursor-terrain-hover'];
    container.classList.remove(...customCursorClasses);
    container.style.cursor = '';

    if (isPickingTile) {
      container.classList.add('cursor-pipette');
    } else if (isSpacePanActive) {
      container.style.cursor = isPanning ? 'grabbing' : 'grab';
    } else if (relocatingMythId !== null) {
      container.style.cursor = 'move';
    } else {
      switch (activeTool) {
        case 'select':
          container.style.cursor = 'pointer';
          break;
        case 'terrain':
          container.classList.add('cursor-terrain-hover');
          break;
        case 'myth':
        case 'barrier':
        case 'poi':
          container.style.cursor = 'crosshair';
          break;
        default:
          container.style.cursor = 'default';
      }
    }
  }, [isPickingTile, isSpacePanActive, isPanning, relocatingMythId, activeTool, containerRef]);

  /**
   * Memoized array of hexes to display, combining base realm hexes with
   * any hexes currently being painted for a responsive preview.
   */
  const displayHexes = useMemo(() => {
    if (paintedHexes.size === 0) return realm.hexes;
    const hexesMap = new Map(realm.hexes.map((h) => [`${h.q},${h.r}`, h]));
    paintedHexes.forEach((hex, key) => hexesMap.set(key, hex));
    return Array.from(hexesMap.values());
  }, [realm.hexes, paintedHexes]);

  /**
   * Handles the painting logic for terrain and barriers while the mouse is held down.
   */
  const handlePaint = useCallback(
    (hex: Hex, e?: React.MouseEvent) => {
      if (activeTool !== 'terrain' && activeTool !== 'barrier') return;

      setPaintedHexes((prevPainted) => {
        const getHex = (q: number, r: number) =>
          prevPainted.get(`${q},${r}`) || realmHexesMap.get(`${q},${r}`);
        const currentHex = getHex(hex.q, hex.r);
        if (!currentHex) return prevPainted;

        const newPainted = new Map(prevPainted);
        if (activeTool === 'terrain') {
          if (currentHex.terrain === paintTerrain) return prevPainted;
          newPainted.set(`${hex.q},${hex.r}`, { ...currentHex, terrain: paintTerrain });
        } else if (activeTool === 'barrier' && e && svgRef.current) {
          const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
          const svgPoint = svgRef.current.createSVGPoint();
          svgPoint.x = e.clientX;
          svgPoint.y = e.clientY;
          const ctm = svgRef.current.getScreenCTM();
          if (!ctm) return prevPainted;
          const transformedPoint = svgPoint.matrixTransform(ctm.inverse());

          const relativePoint: Point = {
            x: Number(transformedPoint.x) - Number(center.x),
            y: Number(transformedPoint.y) - Number(center.y),
          };
          const edgeIndex = findClosestEdge(relativePoint, hexCorners);

          const isAdding = barrierPaintModeRef.current === 'add';
          const hasBarrier = currentHex.barrierEdges.includes(edgeIndex);
          if ((isAdding && hasBarrier) || (!isAdding && !hasBarrier)) return prevPainted;

          const newEdges = isAdding
            ? [...currentHex.barrierEdges, edgeIndex]
            : currentHex.barrierEdges.filter((edge) => edge !== edgeIndex);
          newPainted.set(`${hex.q},${hex.r}`, {
            ...currentHex,
            barrierEdges: [...new Set(newEdges)].sort((a, b) => a - b),
          });

          const neighborCoords = getNeighbors(hex)[edgeIndex];
          if (!neighborCoords) return newPainted;
          const neighborHex = getHex(neighborCoords.q, neighborCoords.r);
          if (neighborHex) {
            const oppositeEdge = (Number(edgeIndex) + 3) % 6;
            const newNeighborEdges = isAdding
              ? [...neighborHex.barrierEdges, oppositeEdge]
              : neighborHex.barrierEdges.filter((edge) => edge !== oppositeEdge);
            newPainted.set(`${neighborCoords.q},${neighborCoords.r}`, {
              ...neighborHex,
              barrierEdges: [...new Set(newNeighborEdges)].sort((a, b) => a - b),
            });
          }
        }
        return newPainted;
      });
    },
    [
      activeTool,
      paintTerrain,
      realmHexesMap,
      viewOptions.orientation,
      viewOptions.hexSize,
      hexCorners,
    ]
  );

  /**
   * Handles mouse down events on a hex, triggering selection, painting, or POI placement.
   */
  const handleHexMouseDown = useCallback(
    (hex: Hex, e: React.MouseEvent) => {
      if (e.button !== 0) return;

      if (isPickingTile) {
        e.stopPropagation();
        e.preventDefault();
        onTilePick(hex);
        return;
      }

      if (relocatingMythId !== null) {
        e.stopPropagation();
        e.preventDefault();
        const targetHex = realm.hexes.find((h) => h.q === hex.q && h.r === hex.r);
        if (targetHex) onRelocateMyth(relocatingMythId, targetHex);
        return;
      }

      if (activeTool === 'select') {
        onHexClick(hex);
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      const currentHex = realmHexesMap.get(`${hex.q},${hex.r}`);
      if (!currentHex) return;

      if (activeTool === 'myth') {
        if (currentHex.myth) onHexClick(currentHex);
        else onAddMyth(currentHex, true);
        return;
      }

      if (activeTool === 'poi' && paintPoi) {
        const [type, id] = paintPoi.split(':');
        if (typeof id === 'undefined') return;
        if (type === 'action') {
          if (id === 'myth') {
            if (currentHex.myth) {
              onRemoveMyth(currentHex);
            } else {
              onAddMyth(currentHex);
            }
          } else if (id === 'seatOfPower') {
            if (currentHex.holding) {
              onSetSeatOfPower(currentHex);
            } else {
              setConfirmation({
                isOpen: true,
                title: 'Invalid Action',
                message: 'Seat of Power can only be set on a hex with a holding.',
                onConfirm: () => setConfirmation(null),
                isInfo: true,
              });
            }
          }
        } else {
          const updatedHex: Hex = { ...currentHex };
          if (type === 'holding') {
            if (updatedHex.holding === id) {
              delete updatedHex.holding;
            } else {
              updatedHex.holding = id;
            }
            delete updatedHex.landmark;
          } else if (type === 'landmark') {
            if (updatedHex.landmark === id) {
              delete updatedHex.landmark;
            } else {
              updatedHex.landmark = id;
            }
            delete updatedHex.holding;
          }
          onUpdateHex([updatedHex]);
        }
        return;
      }

      if (activeTool === 'terrain' || activeTool === 'barrier') {
        setIsPainting(true);
        if (activeTool === 'barrier' && svgRef.current) {
          const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
          const svgPoint = svgRef.current.createSVGPoint();
          svgPoint.x = e.clientX;
          svgPoint.y = e.clientY;
          const ctm = svgRef.current.getScreenCTM();
          if (!ctm) return;
          const transformedPoint = svgPoint.matrixTransform(ctm.inverse());
          const relativePoint = {
            x: transformedPoint.x - center.x,
            y: transformedPoint.y - center.y,
          };
          const edgeIndex = findClosestEdge(relativePoint, hexCorners);
          const latestHex = paintedHexes.get(`${hex.q},${hex.r}`) || currentHex;
          barrierPaintModeRef.current = latestHex?.barrierEdges.includes(edgeIndex)
            ? 'remove'
            : 'add';
        }
        handlePaint(hex, e);
      }
    },
    [
      isPickingTile,
      onTilePick,
      relocatingMythId,
      realm.hexes,
      onRelocateMyth,
      activeTool,
      onHexClick,
      realmHexesMap,
      onAddMyth,
      paintPoi,
      onRemoveMyth,
      onSetSeatOfPower,
      setConfirmation,
      onUpdateHex,
      viewOptions.orientation,
      viewOptions.hexSize,
      hexCorners,
      paintedHexes,
      handlePaint,
    ]
  );

  /**
   * Handles mouse up events to finalize a painting action.
   */
  const handleMouseUp = useCallback(() => {
    if (!isPainting) return;
    setIsPainting(false);
    if (paintedHexes.size > 0) {
      onUpdateHex(Array.from(paintedHexes.values()));
    }
    setPaintedHexes(new Map());
  }, [isPainting, onUpdateHex, paintedHexes]);

  /**
   * Handles mouse move events for painting and barrier hover previews.
   */
  const handleHexMouseMove = useCallback(
    (hex: Hex, e: React.MouseEvent) => {
      // Robust painting on drag
      if (isPainting) {
        handlePaint(hex, e);
      }

      // Barrier hover preview
      if (activeTool !== 'barrier' || isPainting) {
        if (hoveredBarrier) setHoveredBarrier(null);
        return;
      }

      if (!svgRef.current) return;
      const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = e.clientX;
      svgPoint.y = e.clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;
      const transformedPoint = svgPoint.matrixTransform(ctm.inverse());
      const relativePoint = {
        x: transformedPoint.x - center.x,
        y: transformedPoint.y - center.y,
      };
      const edgeIndex = findClosestEdge(relativePoint, hexCorners);

      if (
        !hoveredBarrier ||
        hoveredBarrier.q !== hex.q ||
        hoveredBarrier.r !== hex.r ||
        hoveredBarrier.edge !== edgeIndex
      ) {
        setHoveredBarrier({ q: hex.q, r: hex.r, edge: edgeIndex });
      }
    },
    [
      activeTool,
      isPainting,
      viewOptions.orientation,
      viewOptions.hexSize,
      hexCorners,
      hoveredBarrier,
      handlePaint,
    ]
  );

  if (isLoadingTextures || !terrainTextures) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-secondary)]">
        <p>Loading terrain textures...</p>
      </div>
    );
  }

  const renderHexes = (layer: 'background' | 'foreground') => {
    return displayHexes.map((hex) => {
      const isSelected = selectedHex ? hex.q === selectedHex.q && hex.r === selectedHex.r : false;
      const isSeatOfPower = Boolean(
        hex.holding && hex.q === realm.seatOfPower.q && hex.r === realm.seatOfPower.r
      );
      return (
        <Hexagon
          key={`hex-${layer}-${hex.q}-${hex.r}`}
          hex={hex}
          viewOptions={viewOptions}
          tileSets={tileSets}
          terrainTextures={terrainTextures}
          barrierColor={barrierColor}
          isSelected={isSelected}
          isSeatOfPower={isSeatOfPower}
          isSpacePanActive={isSpacePanActive}
          activeTool={activeTool}
          isPickingTile={isPickingTile}
          onMouseDown={handleHexMouseDown}
          onMouseMove={handleHexMouseMove}
          hexCorners={hexCorners}
          hexCornersInnerHighlight={hexCornersInnerHighlight}
          hexBoundingBox={hexBoundingBox}
          layer={layer}
        />
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[var(--color-background-secondary)] relative"
      onWheel={onWheel}
    >
      <svg
        ref={svgRef}
        id="hex-grid-svg"
        className="w-full h-full"
        viewBox={viewbox}
        onMouseDown={isPickingTile ? undefined : onMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoveredBarrier(null);
        }}
      >
        <defs>
          <clipPath id="hex-clip-path">
            <polygon points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')} />
          </clipPath>
        </defs>

        <g>{renderHexes('background')}</g>
        <g>{renderHexes('foreground')}</g>

        {/* Barrier Hover Highlight Layer */}
        {hoveredBarrier && activeTool === 'barrier' && !isPainting && (
          <g style={{ pointerEvents: 'none' }}>
            {(() => {
              const hex = realmHexesMap.get(`${hoveredBarrier.q},${hoveredBarrier.r}`);
              if (!hex) return null;
              return (
                <g
                  transform={`translate(${
                    axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize).x
                  }, ${axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize).y})`}
                >
                  <path
                    d={getBarrierPath(hoveredBarrier.edge, hexCorners)}
                    stroke={SELECTION_COLOR}
                    strokeOpacity="0.8"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </g>
              );
            })()}
          </g>
        )}
      </svg>
      {!isSettingsOpen && <ToolsPalette activeTool={activeTool} setActiveTool={setActiveTool} />}
      {!isSettingsOpen && <ShortcutTips />}
    </div>
  );
}
