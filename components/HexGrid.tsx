
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { Realm, Hex, ViewOptions, Point, Tool, Tile } from '../types';
import { axialToPixel, getHexCorners, getBarrierPath, findClosestEdge, getNeighbors } from '../utils/hexUtils';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
// FIX: Rename imported `DEFAULT_TILE_SETS` to `TILE_SETS` as `TILE_SETS` is not an exported member of `constants`.
import { DEFAULT_TILE_SETS as TILE_SETS, MYTH_COLOR, SELECTION_COLOR, SEAT_OF_POWER_COLOR, HOLDING_ICON_BORDER_COLOR, LANDMARK_ICON_BORDER_COLOR } from '../constants';
import { ToolsPalette } from './ToolsPalette';
import { Icon } from './Icon';

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
}

const findTile = (type: string, category: 'terrain' | 'holding' | 'landmark'): Tile | undefined => {
    return TILE_SETS[category].find(t => t.id === type);
}

export function HexGrid({ realm, onUpdateHex, viewOptions, selectedHex, onHexClick, activeTool, setActiveTool, paintTerrain, paintPoi, onAddMyth, onRemoveMyth, relocatingMythId, onRelocateMyth, onSetSeatOfPower, terrainColors, barrierColor }: HexGridProps) {
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

  const displayHexes = useMemo(() => {
    if (paintedHexes.size === 0) {
        return realm.hexes;
    }
    const hexesMap = new Map(realm.hexes.map(h => [`${h.q},${h.r}`, h]));
    paintedHexes.forEach((hex, key) => {
        hexesMap.set(key, hex);
    });
    return Array.from(hexesMap.values());
  }, [realm.hexes, paintedHexes]);


  const handlePaint = useCallback((hex: Hex, e?: React.MouseEvent) => {
    if (activeTool !== 'terrain' && activeTool !== 'barrier') return;

    setPaintedHexes(prevPainted => {
      const getHex = (q: number, r: number) => {
          const key = `${q},${r}`;
          return prevPainted.get(key) || realmHexesMap.get(key);
      };

      const currentHex = getHex(hex.q, hex.r);
      if (!currentHex) return prevPainted;

      const newPainted = new Map(prevPainted);

      if (activeTool === 'terrain') {
          if (currentHex.terrain === paintTerrain) return prevPainted;
          const updatedHex = { ...currentHex, terrain: paintTerrain };
          newPainted.set(`${hex.q},${hex.r}`, updatedHex);
      } else if (activeTool === 'barrier' && e) {
          const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
          
          const svg = svgRef.current;
          if (!svg) return prevPainted;
          const svgPoint = svg.createSVGPoint();
          svgPoint.x = e.clientX;
          svgPoint.y = e.clientY;
          const transformedPoint = svgPoint.matrixTransform(svg.getScreenCTM()?.inverse());
          
          const relativePoint = { x: transformedPoint.x - center.x, y: transformedPoint.y - center.y };
          const edgeIndex = findClosestEdge(relativePoint, hexCorners);
          
          const isAdding = barrierPaintModeRef.current === 'add';
          const hasBarrier = currentHex.barrierEdges.includes(edgeIndex);
          
          if ((isAdding && hasBarrier) || (!isAdding && !hasBarrier)) return prevPainted;

          const newEdges = isAdding ? [...currentHex.barrierEdges, edgeIndex] : currentHex.barrierEdges.filter(e => e !== edgeIndex);
          const updatedHex = { ...currentHex, barrierEdges: [...new Set(newEdges)].sort((a,b)=>a-b) };
          newPainted.set(`${hex.q},${hex.r}`, updatedHex);
          
          const neighborCoords = getNeighbors(hex)[edgeIndex];
          const neighborKey = `${neighborCoords.q},${neighborCoords.r}`;
          const neighborHex = getHex(neighborCoords.q, neighborCoords.r);

          if (neighborHex) {
              const oppositeEdge = (edgeIndex + 3) % 6;
              const newNeighborEdges = isAdding ? [...neighborHex.barrierEdges, oppositeEdge] : neighborHex.barrierEdges.filter(e => e !== oppositeEdge);
              const updatedNeighborHex = { ...neighborHex, barrierEdges: [...new Set(newNeighborEdges)].sort((a,b)=>a-b) };
              newPainted.set(neighborKey, updatedNeighborHex);
          }
      }
      return newPainted;
    });
  }, [activeTool, paintTerrain, viewOptions.orientation, viewOptions.hexSize, hexCorners, realmHexesMap]);


  const handleHexMouseDown = useCallback((hex: Hex, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only react to left-clicks for tools

    if (relocatingMythId !== null) {
      e.stopPropagation();
      e.preventDefault();

      const targetHex = realm.hexes.find(h => h.q === hex.q && h.r === hex.r);
      if (!targetHex) return;

      if (targetHex.myth) {
          alert("Cannot relocate to a hex that already has a myth.");
          return;
      }

      onRelocateMyth(relocatingMythId, targetHex);
      return;
    }

    if (activeTool === 'select') {
      onHexClick(hex);
      return; // Do not stop propagation, allow panning by clicking through
    }
    
    if (activeTool === 'myth') {
      e.stopPropagation();
      e.preventDefault();
      
      const currentHex = realmHexesMap.get(`${hex.q},${hex.r}`);
      if (!currentHex) return;
      
      if (currentHex.myth) {
        onHexClick(currentHex);
      } else {
        onAddMyth(currentHex, true);
      }
      return;
    }

    if (activeTool === 'poi' && paintPoi) {
      e.stopPropagation();
      e.preventDefault();

      const [type, id] = paintPoi.split(':');
      
      const currentHex = realmHexesMap.get(`${hex.q},${hex.r}`);
      if (!currentHex) return;

      if (type === 'action') {
        if (id === 'myth') {
          if (currentHex.myth) {
              onRemoveMyth(currentHex);
          } else {
              onAddMyth(currentHex);
          }
        } else if (id === 'seatOfPower') {
            if (!currentHex.holding) {
                alert('Seat of Power can only be set on a hex with a holding.');
            } else {
                onSetSeatOfPower(currentHex);
            }
        }
        return;
      }

      const updatedHex: Hex = { ...currentHex };

      if (type === 'holding') {
        // If the same holding is clicked again, remove it. Otherwise, set/replace it.
        if (updatedHex.holding === id) {
            updatedHex.holding = undefined;
        } else {
            updatedHex.holding = id;
            updatedHex.landmark = undefined;
        }
      } else if (type === 'landmark') {
        // If the same landmark is clicked again, remove it. Otherwise, set/replace it.
        if (updatedHex.landmark === id) {
            updatedHex.landmark = undefined;
        } else {
            updatedHex.landmark = id;
            updatedHex.holding = undefined;
        }
      }

      onUpdateHex([updatedHex]);
      return;
    }

    if (activeTool !== 'terrain' && activeTool !== 'barrier') return;

    e.stopPropagation(); // Stop pan/zoom from starting when using a tool
    e.preventDefault();
    setIsPainting(true);

    if (activeTool === 'barrier') {
       // Determine barrier mode (add/remove) based on the first clicked edge
       const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
       
       const svg = svgRef.current;
       if (!svg) return;
       const svgPoint = svg.createSVGPoint();
       svgPoint.x = e.clientX;
       svgPoint.y = e.clientY;
       const transformedPoint = svgPoint.matrixTransform(svg.getScreenCTM()?.inverse());
       const relativePoint = { x: transformedPoint.x - center.x, y: transformedPoint.y - center.y };
       const edgeIndex = findClosestEdge(relativePoint, hexCorners);
       // Get the most up-to-date hex data from either the temporary painted state or the base realm map
       const currentHex = paintedHexes.get(`${hex.q},${hex.r}`) || realmHexesMap.get(`${hex.q},${hex.r}`);
       barrierPaintModeRef.current = currentHex?.barrierEdges.includes(edgeIndex) ? 'remove' : 'add';
    }

    handlePaint(hex, e);
  }, [activeTool, onHexClick, handlePaint, viewOptions.orientation, viewOptions.hexSize, hexCorners, realmHexesMap, paintedHexes, paintPoi, onUpdateHex, onAddMyth, onRemoveMyth, relocatingMythId, onRelocateMyth, realm.hexes, onSetSeatOfPower]);

  const handleMouseUp = useCallback(() => {
    if (!isPainting) return;
    setIsPainting(false);
    if (paintedHexes.size > 0) {
      onUpdateHex(Array.from(paintedHexes.values()));
    }
    setPaintedHexes(new Map());
  }, [isPainting, onUpdateHex, paintedHexes]);

  const handleHexMouseMove = useCallback((hex: Hex, e: React.MouseEvent) => {
    if (activeTool !== 'barrier' || isPainting) {
        if (hoveredBarrier) {
            setHoveredBarrier(null);
        }
        return;
    }

    const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
    const svg = svgRef.current;
    if (!svg) return;

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const transformedPoint = svgPoint.matrixTransform(svg.getScreenCTM()?.inverse());
    
    const relativePoint = { x: transformedPoint.x - center.x, y: transformedPoint.y - center.y };
    const edgeIndex = findClosestEdge(relativePoint, hexCorners);

    if (!hoveredBarrier || hoveredBarrier.q !== hex.q || hoveredBarrier.r !== hex.r || hoveredBarrier.edge !== edgeIndex) {
        setHoveredBarrier({ q: hex.q, r: hex.r, edge: edgeIndex });
    }
  }, [activeTool, isPainting, viewOptions.orientation, viewOptions.hexSize, hexCorners, hoveredBarrier]);

  const getCursor = () => {
    if (isSpacePanActive) {
      return isPanning ? 'grabbing' : 'grab';
    }
    if (relocatingMythId !== null) return 'move';
    switch(activeTool) {
      case 'select': return 'pointer';
      case 'myth':
      case 'terrain':
      case 'barrier':
      case 'poi':
        return 'crosshair';
      default: return 'default';
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden bg-[#18272e] relative" onWheel={onWheel} style={{ cursor: getCursor() }}>
      <svg
        ref={svgRef}
        id="hex-grid-svg"
        className="w-full h-full"
        viewBox={viewbox}
        onMouseDown={onMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setHoveredBarrier(null); }}
      >
        {/* Layer 1: Hex Fills and Grid Lines - Clickable */}
        <g>
          {displayHexes.map(hex => {
            const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
            const terrainColor = terrainColors[hex.terrain] || '#cccccc';
            
            // The border is a light color when grid is on, and same as fill color when off to hide seams.
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
                  points={hexCorners.map(p => `${p.x},${p.y}`).join(' ')} 
                  fill={terrainColor}
                  stroke={borderColor}
                  strokeWidth={viewOptions.gridWidth}
                />
                {/* Inner Hover Highlight - prevents overlapping adjacent hexes */}
                <polygon
                  points={hexCornersInnerHighlight.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="rgba(115, 107, 35, 0.8)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className={`opacity-0 ${activeTool !== 'barrier' ? 'group-hover:opacity-100' : ''} transition-opacity duration-150`}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}
        </g>

        {/* Selection Highlight Layer */}
        {selectedHex && activeTool !== 'barrier' && (
          <g style={{ pointerEvents: 'none' }}>
            {(() => {
                const center = axialToPixel(selectedHex, viewOptions.orientation, viewOptions.hexSize);
                return (
                    <g transform={`translate(${center.x}, ${center.y})`}>
                        <polygon
                            points={hexCornersInnerHighlight.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={SELECTION_COLOR}
                            strokeWidth={4}
                            strokeLinejoin="round"
                        />
                    </g>
                );
            })()}
          </g>
        )}

        {/* Barrier Hover Highlight Layer */}
        {hoveredBarrier && activeTool === 'barrier' && !isPainting && (
          <g style={{ pointerEvents: 'none' }}>
            {(() => {
                const hex = realmHexesMap.get(`${hoveredBarrier.q},${hoveredBarrier.r}`);
                if (!hex) return null;
                const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
                const path = getBarrierPath(hoveredBarrier.edge, hexCorners);
                
                return (
                    <g transform={`translate(${center.x}, ${center.y})`}>
                        <path 
                            d={path} 
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

        {/* Layer 2: Icons, Myths, etc. - Not Clickable */}
        <g style={{ pointerEvents: 'none' }}>
          {displayHexes.map(hex => {
            const { isGmView, hexSize } = viewOptions;
            const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
            
            const holdingTile = hex.holding ? findTile(hex.holding, 'holding') : null;
            const landmarkTile = hex.landmark ? findTile(hex.landmark, 'landmark') : null;

            const activeTile = holdingTile || (isGmView ? landmarkTile : null);
            const defaultIcon = activeTile?.icon;

            const isHolding = !!holdingTile;
            const isSeatOfPower = hex.holding && (hex.q === realm.seatOfPower.q && hex.r === realm.seatOfPower.r);
            
            const iconSize = hexSize.x * 0.8; // Slightly smaller icon
            const backplateScale = 0.75;
            
            const backplateBorderColor = isSeatOfPower 
                ? SEAT_OF_POWER_COLOR 
                : (isHolding ? HOLDING_ICON_BORDER_COLOR : LANDMARK_ICON_BORDER_COLOR);

            return (
              <g key={`details-${hex.q}-${hex.r}`} transform={`translate(${center.x}, ${center.y})`}>
                {defaultIcon && (
                  <g>
                    <polygon
                      points={hexCorners.map(p => `${p.x},${p.y}`).join(' ')}
                      transform={`scale(${backplateScale})`}
                      fill="#eaebec"
                      stroke={backplateBorderColor}
                      strokeWidth={isSeatOfPower ? 6 / backplateScale : 4 / backplateScale}
                      strokeLinejoin="round"
                    />
                    {defaultIcon && typeof defaultIcon === 'string' && (
                        <Icon
                            name={defaultIcon}
                            x={-iconSize / 2}
                            y={-iconSize / 2}
                            width={iconSize}
                            height={iconSize}
                            className="text-[#221f21]"
                            strokeWidth={2}
                        />
                    )}
                  </g>
                )}

                {isGmView && hex.myth && (
                  <g>
                    <circle r={hexSize.x * 0.25} fill={MYTH_COLOR} />
                    <text textAnchor="middle" dy=".3em" fill="#221f21" className="font-myth-number">{hex.myth}</text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
        
        {/* Layer 3: Barriers - Not Clickable, rendered on top */}
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
      <ToolsPalette 
        activeTool={activeTool} 
        setActiveTool={setActiveTool}
      />
    </div>
  );
}