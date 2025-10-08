/**
 * @file HexGrid.tsx
 * This component is the core interactive map area of the application.
 * It renders the hexagonal grid using SVG, handles user interactions like
 * panning, zooming, clicking, and painting, and displays all visual
 * elements of the realm such as terrain, icons, barriers, and selections.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { Realm, Hex, ViewOptions, Point, Tool, Tile } from '../types';
import { axialToPixel, getHexCorners, getBarrierPath, findClosestEdge, getNeighbors } from '../utils/hexUtils';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { DEFAULT_TILE_SETS as TILE_SETS, MYTH_COLOR, SELECTION_COLOR, SEAT_OF_POWER_COLOR, HOLDING_ICON_BORDER_COLOR, LANDMARK_ICON_BORDER_COLOR } from '../constants';
import { ToolsPalette } from './ToolsPalette';
import { Icon } from './Icon';

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
  terrainColors: { [key: string]: string };
  barrierColor: string;
  isSettingsOpen: boolean;
}

/**
 * Helper function to find a tile's definition from the constant tile sets.
 */
const findTile = (type: string, category: 'terrain' | 'holding' | 'landmark'): Tile | undefined => {
    return TILE_SETS[category].find(t => t.id === type);
}

/**
 * The main interactive hex grid component.
 */
export function HexGrid({ realm, onUpdateHex, viewOptions, selectedHex, onHexClick, activeTool, setActiveTool, paintTerrain, paintPoi, onAddMyth, onRemoveMyth, relocatingMythId, onRelocateMyth, onSetSeatOfPower, terrainColors, barrierColor, isSettingsOpen }: HexGridProps) {
  const { viewbox, containerRef, onMouseDown, onWheel, isPanning } = usePanAndZoom({
    initialWidth: 1000,
    initialHeight: 800,
    minZoom: 0.2,
    maxZoom: 5,
  });
  
  const hexCorners = useMemo(() => getHexCorners(viewOptions.orientation, viewOptions.hexSize), [viewOptions.orientation, viewOptions.hexSize]);
  const hexCornersInnerHighlight = useMemo(() => getHexCorners(viewOptions.orientation, viewOptions.hexSize, 0.9), [viewOptions.orientation, viewOptions.hexSize]);

  const [isPainting, setIsPainting] = useState(false);
  const [paintedHexes, setPaintedHexes] = useState(new Map<string, Hex>());
  const barrierPaintModeRef = useRef<'add' | 'remove'>('add');
  const realmHexesMap = useMemo(() => new Map(realm.hexes.map(h => [`${h.q},${h.r}`, h])), [realm.hexes]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSpacePanActive, setIsSpacePanActive] = useState(false);
  const [hoveredBarrier, setHoveredBarrier] = useState<{ q: number; r: number; edge: number } | null>(null);

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
    const hexesMap = new Map(realm.hexes.map(h => [`${h.q},${h.r}`, h]));
    paintedHexes.forEach((hex, key) => hexesMap.set(key, hex));
    return Array.from(hexesMap.values());
  }, [realm.hexes, paintedHexes]);

  /**
   * Handles the painting logic for terrain and barriers while the mouse is held down.
   */
  const handlePaint = useCallback((hex: Hex, e?: React.MouseEvent) => {
    if (activeTool !== 'terrain' && activeTool !== 'barrier') return;

    setPaintedHexes(prevPainted => {
      const getHex = (q: number, r: number) => prevPainted.get(`${q},${r}`) || realmHexesMap.get(`${q},${r}`);
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
          const transformedPoint = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
          const relativePoint = { x: transformedPoint.x - center.x, y: transformedPoint.y - center.y };
          const edgeIndex = findClosestEdge(relativePoint, hexCorners);
          
          const isAdding = barrierPaintModeRef.current === 'add';
          const hasBarrier = currentHex.barrierEdges.includes(edgeIndex);
          if ((isAdding && hasBarrier) || (!isAdding && !hasBarrier)) return prevPainted;

          const newEdges = isAdding ? [...currentHex.barrierEdges, edgeIndex] : currentHex.barrierEdges.filter(e => e !== edgeIndex);
          newPainted.set(`${hex.q},${hex.r}`, { ...currentHex, barrierEdges: [...new Set(newEdges)].sort((a,b)=>a-b) });
          
          const neighborCoords = getNeighbors(hex)[edgeIndex];
          const neighborHex = getHex(neighborCoords.q, neighborCoords.r);
          if (neighborHex) {
              const oppositeEdge = (edgeIndex + 3) % 6;
              const newNeighborEdges = isAdding ? [...neighborHex.barrierEdges, oppositeEdge] : neighborHex.barrierEdges.filter(e => e !== oppositeEdge);
              newPainted.set(`${neighborCoords.q},${neighborCoords.r}`, { ...neighborHex, barrierEdges: [...new Set(newNeighborEdges)].sort((a,b)=>a-b) });
          }
      }
      return newPainted;
    });
  }, [activeTool, paintTerrain, viewOptions.orientation, viewOptions.hexSize, hexCorners, realmHexesMap]);

  /**
   * Handles mouse down events on a hex, triggering selection, painting, or POI placement.
   */
  const handleHexMouseDown = useCallback((hex: Hex, e: React.MouseEvent) => {
    if (e.button !== 0) return;

    if (relocatingMythId !== null) {
      e.stopPropagation(); e.preventDefault();
      const targetHex = realm.hexes.find(h => h.q === hex.q && h.r === hex.r);
      if (targetHex) onRelocateMyth(relocatingMythId, targetHex);
      return;
    }

    if (activeTool === 'select') {
      onHexClick(hex);
      return;
    }
    
    e.stopPropagation(); e.preventDefault();

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
        if (id === 'myth') { currentHex.myth ? onRemoveMyth(currentHex) : onAddMyth(currentHex); } 
        else if (id === 'seatOfPower') { if (currentHex.holding) onSetSeatOfPower(currentHex); else alert('Seat of Power can only be set on a hex with a holding.'); }
      } else {
        const updatedHex: Hex = { ...currentHex };
        if (type === 'holding') { updatedHex.holding = updatedHex.holding === id ? undefined : id; updatedHex.landmark = undefined; } 
        else if (type === 'landmark') { updatedHex.landmark = updatedHex.landmark === id ? undefined : id; updatedHex.holding = undefined; }
        onUpdateHex([updatedHex]);
      }
      return;
    }

    if (activeTool === 'terrain' || activeTool === 'barrier') {
      setIsPainting(true);
      if (activeTool === 'barrier' && svgRef.current) {
         const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
         const svgPoint = svgRef.current.createSVGPoint();
         svgPoint.x = e.clientX; svgPoint.y = e.clientY;
         const transformedPoint = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
         const relativePoint = { x: transformedPoint.x - center.x, y: transformedPoint.y - center.y };
         const edgeIndex = findClosestEdge(relativePoint, hexCorners);
         const latestHex = paintedHexes.get(`${hex.q},${hex.r}`) || currentHex;
         barrierPaintModeRef.current = latestHex?.barrierEdges.includes(edgeIndex) ? 'remove' : 'add';
      }
      handlePaint(hex, e);
    }
  }, [activeTool, onHexClick, handlePaint, viewOptions.orientation, viewOptions.hexSize, hexCorners, realmHexesMap, paintedHexes, paintPoi, onUpdateHex, onAddMyth, onRemoveMyth, relocatingMythId, onRelocateMyth, realm.hexes, onSetSeatOfPower]);

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
  const handleHexMouseMove = useCallback((hex: Hex, e: React.MouseEvent) => {
    if (activeTool !== 'barrier' || isPainting) {
        if (hoveredBarrier) setHoveredBarrier(null);
        return;
    }
    if (!svgRef.current) return;
    const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX; svgPoint.y = e.clientY;
    const transformedPoint = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    const relativePoint = { x: transformedPoint.x - center.x, y: transformedPoint.y - center.y };
    const edgeIndex = findClosestEdge(relativePoint, hexCorners);

    if (!hoveredBarrier || hoveredBarrier.q !== hex.q || hoveredBarrier.r !== hex.r || hoveredBarrier.edge !== edgeIndex) {
        setHoveredBarrier({ q: hex.q, r: hex.r, edge: edgeIndex });
    }
  }, [activeTool, isPainting, viewOptions.orientation, viewOptions.hexSize, hexCorners, hoveredBarrier]);

  const getCursor = () => {
    if (isSpacePanActive) return isPanning ? 'grabbing' : 'grab';
    if (relocatingMythId !== null) return 'move';
    switch(activeTool) {
      case 'select': return 'pointer';
      case 'myth': case 'terrain': case 'barrier': case 'poi': return 'crosshair';
      default: return 'default';
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden bg-[#18272e] relative" onWheel={onWheel} style={{ cursor: getCursor() }}>
      <svg ref={svgRef} id="hex-grid-svg" className="w-full h-full" viewBox={viewbox} onMouseDown={onMouseDown} onMouseUp={handleMouseUp} onMouseLeave={() => { handleMouseUp(); setHoveredBarrier(null); }}>
        {/* Layer 1: Hex Fills and Grid Lines */}
        <g>
          {displayHexes.map(hex => {
            const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
            const terrainColor = terrainColors[hex.terrain] || '#cccccc';
            const borderColor = viewOptions.showGrid ? viewOptions.gridColor : terrainColor;
            return (
              <g key={`hex-${hex.q}-${hex.r}`} transform={`translate(${center.x}, ${center.y})`} onMouseDown={(e) => handleHexMouseDown(hex, e)} onMouseEnter={(e) => isPainting && handlePaint(hex, e)} onMouseMove={(e) => handleHexMouseMove(hex, e)} className="group" style={{ pointerEvents: isSpacePanActive ? 'none' : 'auto' }}>
                <polygon points={hexCorners.map(p => `${p.x},${p.y}`).join(' ')} fill={terrainColor} stroke={borderColor} strokeWidth={viewOptions.gridWidth} />
                <polygon points={hexCornersInnerHighlight.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(115, 107, 35, 0.8)" strokeWidth="2.5" strokeLinejoin="round" className={`opacity-0 ${activeTool !== 'barrier' ? 'group-hover:opacity-100' : ''} transition-opacity duration-150`} style={{ pointerEvents: 'none' }} />
              </g>
            );
          })}
        </g>

        {/* Layer 2: Selection and Hover Highlights */}
        {selectedHex && activeTool !== 'barrier' && (
          <g style={{ pointerEvents: 'none' }}>
            <g transform={`translate(${axialToPixel(selectedHex, viewOptions.orientation, viewOptions.hexSize).x}, ${axialToPixel(selectedHex, viewOptions.orientation, viewOptions.hexSize).y})`}>
                <polygon points={hexCornersInnerHighlight.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={SELECTION_COLOR} strokeWidth={4} strokeLinejoin="round" />
            </g>
          </g>
        )}
        {hoveredBarrier && activeTool === 'barrier' && !isPainting && (
          <g style={{ pointerEvents: 'none' }}>
            {(() => {
                const hex = realmHexesMap.get(`${hoveredBarrier.q},${hoveredBarrier.r}`);
                if (!hex) return null;
                return (
                    <g transform={`translate(${axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize).x}, ${axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize).y})`}>
                        <path d={getBarrierPath(hoveredBarrier.edge, hexCorners)} stroke={SELECTION_COLOR} strokeOpacity="0.8" strokeWidth="8" strokeLinecap="round" />
                    </g>
                );
            })()}
          </g>
        )}

        {/* Layer 3: Icons and Details */}
        <g style={{ pointerEvents: 'none' }}>
          {displayHexes.map(hex => {
            const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
            const holdingTile = hex.holding ? findTile(hex.holding, 'holding') : null;
            const landmarkTile = hex.landmark ? findTile(hex.landmark, 'landmark') : null;
            const activeTile = holdingTile || (viewOptions.isGmView ? landmarkTile : null);
            const isHolding = !!holdingTile;
            const isSeatOfPower = hex.holding && (hex.q === realm.seatOfPower.q && hex.r === realm.seatOfPower.r);
            const backplateBorderColor = isSeatOfPower ? SEAT_OF_POWER_COLOR : (isHolding ? HOLDING_ICON_BORDER_COLOR : LANDMARK_ICON_BORDER_COLOR);
            return (
              <g key={`details-${hex.q}-${hex.r}`} transform={`translate(${center.x}, ${center.y})`}>
                {activeTile?.icon && (
                  <g>
                    <polygon points={hexCorners.map(p => `${p.x},${p.y}`).join(' ')} transform="scale(0.75)" fill="#eaebec" stroke={backplateBorderColor} strokeWidth={isSeatOfPower ? 6 / 0.75 : 4 / 0.75} strokeLinejoin="round" />
                    <Icon name={activeTile.icon} x={-viewOptions.hexSize.x * 0.4} y={-viewOptions.hexSize.y * 0.4} width={viewOptions.hexSize.x * 0.8} height={viewOptions.hexSize.y * 0.8} className="text-[#221f21]" strokeWidth={2} />
                  </g>
                )}
                {viewOptions.isGmView && hex.myth && (
                  <g>
                    <circle r={viewOptions.hexSize.x * 0.25} fill={MYTH_COLOR} />
                    <text textAnchor="middle" dy=".3em" fill="#221f21" className="font-myth-number">{hex.myth}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
        
        {/* Layer 4: Barriers */}
        {viewOptions.isGmView && (
          <g style={{ pointerEvents: 'none' }}>
            {displayHexes.map(hex => {
              if (hex.barrierEdges.length === 0) return null;
              const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
              return (
                <g key={`barriers-${hex.q}-${hex.r}`} transform={`translate(${center.x}, ${center.y})`}>
                  {hex.barrierEdges.map(edgeIndex => (
                    <path key={edgeIndex} d={getBarrierPath(edgeIndex, hexCorners)} stroke={barrierColor} strokeWidth="6" strokeLinecap="round" />
                  ))}
                </g>
              );
            })}
          </g>
        )}
      </svg>
      {!isSettingsOpen && <ToolsPalette activeTool={activeTool} setActiveTool={setActiveTool} />}
    </div>
  );
}
