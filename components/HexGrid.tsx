/**
 * @file HexGrid.tsx
 * This component is the core interactive map area of the application.
 * It renders the hexagonal grid using SVG, handles user interactions like
 * panning, zooming, clicking, and painting, and displays all visual
 * elements of the realm such as terrain, icons, barriers, and selections.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { Realm, Hex, ViewOptions, Point, Tool, TileSet } from '../types';
import {
  axialToPixel,
  getHexCorners,
  getBarrierPath,
  findClosestEdge,
  getNeighbors,
} from '../utils/hexUtils';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import {
  MYTH_COLOR,
  SELECTION_COLOR,
  SEAT_OF_POWER_COLOR,
  HOLDING_ICON_BORDER_COLOR,
  LANDMARK_ICON_BORDER_COLOR,
} from '../constants';
import { ToolsPalette } from './ToolsPalette';
import { Icon } from './Icon';
import { ShortcutTips } from './ShortcutTips';
import { generateSprayIcons } from '../utils/sprayUtils';
import type { ConfirmationState } from '../App';

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
  terrainColors: { [key: string]: string };
  barrierColor: string;
  isSettingsOpen: boolean;
  isPickingTile: boolean;
  onTilePick: (hex: Hex) => void;
  setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState | null>>;
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
  terrainColors,
  barrierColor,
  isSettingsOpen,
  isPickingTile,
  onTilePick,
  setConfirmation,
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

  const [isPainting, setIsPainting] = useState(false);
  const [paintedHexes, setPaintedHexes] = useState(new Map<string, Hex>());
  const barrierPaintModeRef = useRef<'add' | 'remove'>('add');
  const realmHexesMap = useMemo(
    () => new Map(realm.hexes.map((h) => [`${h.q},${h.r}`, h])),
    [realm.hexes]
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSpacePanActive, setIsSpacePanActive] = useState(false);
  const [hoveredBarrier, setHoveredBarrier] = useState<{ q: number; r: number; edge: number } | null>(
    null
  );

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
          const relativePoint = {
            x: transformedPoint.x - center.x,
            y: transformedPoint.y - center.y,
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
            const oppositeEdge = (edgeIndex + 3) % 6;
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
        if (type === 'action') {
          if (id === 'myth') {
            currentHex.myth ? onRemoveMyth(currentHex) : onAddMyth(currentHex);
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
            updatedHex.holding = updatedHex.holding === id ? undefined : id;
            updatedHex.landmark = undefined;
          } else if (type === 'landmark') {
            updatedHex.landmark = updatedHex.landmark === id ? undefined : id;
            updatedHex.holding = undefined;
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
   * Handles mouse move events to show a hover preview for the barrier painter.
   */
  const handleHexMouseMove = useCallback(
    (hex: Hex, e: React.MouseEvent) => {
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
    [activeTool, isPainting, viewOptions.orientation, viewOptions.hexSize, hexCorners, hoveredBarrier]
  );

  const getCursor = () => {
    if (isPickingTile) {
      const pipetteSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#eaebec' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m2 22 1-1h3l9-9a2.828 2.828 0 1 0-4-4L2 18v4Z'/><path d='m12.5 6.5 4-4a2.121 2.121 0 0 1 3 3l-4 4'/></svg>`;
      return `url('data:image/svg+xml;utf8,${encodeURIComponent(pipetteSVG)}') 3 29, auto`;
    }
    if (isSpacePanActive) return isPanning ? 'grabbing' : 'grab';
    if (relocatingMythId !== null) return 'move';

    switch (activeTool) {
      case 'select':
        return 'pointer';
      case 'terrain': {
        const outerCircle = `<circle cx='12' cy='12' r='10' fill='rgba(234, 235, 236, 0.3)' stroke='#eaebec' stroke-width='2'/>`;
        let innerCircle = '';
        if (isPainting) {
          const terrainColor = terrainColors[paintTerrain] || '#cccccc';
          innerCircle = `<circle cx='12' cy='12' r='8' fill='${terrainColor}' stroke='#191f29' stroke-width='1'/>`;
        }
        const brushSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>${outerCircle}${innerCircle}</svg>`;
        return `url('data:image/svg+xml;utf8,${encodeURIComponent(brushSVG)}') 12 12, auto`;
      }
      case 'myth':
      case 'barrier':
      case 'poi':
        return 'crosshair';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[#18272e] relative"
      onWheel={onWheel}
      style={{ cursor: getCursor() }}
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
        {/* Layer 1: Hex Fills, Spray Icons, and Grid Lines */}
        <g>
          {displayHexes.map((hex) => {
            const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
            const terrainColor = terrainColors[hex.terrain] || '#cccccc';
            const borderColor = viewOptions.showGrid ? viewOptions.gridColor : terrainColor;
            return (
              <g
                key={`hex-${hex.q}-${hex.r}`}
                transform={`translate(${center.x}, ${center.y})`}
                onMouseDown={(e) => handleHexMouseDown(hex, e)}
                onMouseEnter={(e) => isPainting && handlePaint(hex, e)}
                onMouseMove={(e) => handleHexMouseMove(hex, e)}
                className="group"
                style={{ pointerEvents: isSpacePanActive ? 'none' : 'auto' }}
              >
                <polygon
                  points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill={terrainColor}
                  stroke={borderColor}
                  strokeWidth={viewOptions.gridWidth}
                />

                {viewOptions.showIconSpray &&
                  (() => {
                    const terrainTile = tileSets.terrain.find((t) => t.id === hex.terrain);
                    if (!terrainTile) return null;

                    const iconsToRender = generateSprayIcons(hex, terrainTile, viewOptions.hexSize);

                    return (
                      <g style={{ pointerEvents: 'none', clipPath: 'url(#hex-clip-path)' }}>
                        {iconsToRender.map((icon, i) => (
                          <g
                            key={i}
                            transform={`translate(${icon.x}, ${icon.y}) rotate(${icon.rotation})`}
                          >
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
                    );
                  })()}

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
              </g>
            );
          })}
        </g>

        {/* Layer 2: Selection and Hover Highlights */}
        {selectedHex && activeTool !== 'barrier' && (
          <g style={{ pointerEvents: 'none' }}>
            <g
              transform={`translate(${
                axialToPixel(selectedHex, viewOptions.orientation, viewOptions.hexSize).x
              }, ${axialToPixel(selectedHex, viewOptions.orientation, viewOptions.hexSize).y})`}
            >
              <polygon
                points={hexCornersInnerHighlight.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={SELECTION_COLOR}
                strokeWidth={4}
                strokeLinejoin="round"
              />
            </g>
          </g>
        )}
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

        {/* Layer 3: Icons and Details */}
        <g style={{ pointerEvents: 'none' }}>
          {displayHexes.map((hex) => {
            const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
            const holdingTile = hex.holding ? tileSets.holding.find((t) => t.id === hex.holding) : null;
            const landmarkTile = hex.landmark
              ? tileSets.landmark.find((t) => t.id === hex.landmark)
              : null;
            const activeTile = holdingTile || (viewOptions.isGmView ? landmarkTile : null);
            const isHolding = !!holdingTile;
            const isSeatOfPower =
              hex.holding && hex.q === realm.seatOfPower.q && hex.r === realm.seatOfPower.r;
            const backplateBorderColor = isSeatOfPower
              ? SEAT_OF_POWER_COLOR
              : isHolding
              ? HOLDING_ICON_BORDER_COLOR
              : LANDMARK_ICON_BORDER_COLOR;
            return (
              <g key={`details-${hex.q}-${hex.r}`} transform={`translate(${center.x}, ${center.y})`}>
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
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      fill="#221f21"
                      className="font-myth-number"
                    >
                      {hex.myth}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Layer 4: Barriers */}
        {viewOptions.isGmView && (
          <g style={{ pointerEvents: 'none' }}>
            {displayHexes.map((hex) => {
              if (hex.barrierEdges.length === 0) return null;
              const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
              return (
                <g key={`barriers-${hex.q}-${hex.r}`} transform={`translate(${center.x}, ${center.y})`}>
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
              );
            })}
          </g>
        )}
      </svg>
      {!isSettingsOpen && <ToolsPalette activeTool={activeTool} setActiveTool={setActiveTool} />}
      {!isSettingsOpen && <ShortcutTips />}
    </div>
  );
}
