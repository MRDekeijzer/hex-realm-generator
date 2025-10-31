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
  TerrainBrushCharacter,
} from '@/features/realm/types';
import {
  axialToPixel,
  getHexCorners,
  getBarrierPath,
  findClosestEdge,
  getNeighbors,
} from '@/features/realm/utils/hexUtils';
import { usePanAndZoom } from '@/features/realm/hooks/usePanAndZoom';
import { HEX_SELECTED_COLOR } from '@/features/realm/config/constants';
import { ToolsPalette } from './ToolsPalette';
import { ShortcutTips } from './ShortcutTips';
import type { ConfirmationState } from '@/app/App';
import { Hexagon } from './hexgrid/Hexagon';
import { InfoPopup } from './ui/InfoPopup';

const toTitleCase = (value: string): string =>
  value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const humanizeId = (value: string): string =>
  value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const LoadingOverlay = ({ label, variant }: { label: string; variant: 'full' | 'subtle' }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-text-muted ${
        variant === 'subtle'
          ? 'bg-realm-canvas-backdrop/70 border border-border-panel-divider/60'
          : 'bg-realm-map-viewport border border-border-panel-divider shadow-lg'
      }`}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  </div>
);

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
  paintCharacter: TerrainBrushCharacter;
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
  poiIconColor: string | null;
  poiBackdropColor: string | null;
  svgId?: string;
  isInteractive?: boolean;
  staticPadding?: number;
  shortcutTipsCollapsed: boolean;
  onToggleShortcutTips: () => void;
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
  paintCharacter,
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
  poiIconColor,
  poiBackdropColor,
  svgId = 'hex-grid-svg',
  isInteractive = true,
  staticPadding,
  shortcutTipsCollapsed,
  onToggleShortcutTips,
}: HexGridProps) {
  const { viewbox, containerRef, onMouseDown, isPanning } = usePanAndZoom({
    initialWidth: 1000,
    initialHeight: 800,
    minZoom: 0.2,
    maxZoom: 5,
    enabled: isInteractive,
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
  const terrainTileMap = useMemo(
    () => new Map(tileSets.terrain.map((tile) => [tile.id, tile])),
    [tileSets.terrain]
  );
  const holdingTileMap = useMemo(
    () => new Map(tileSets.holding.map((tile) => [tile.id, tile])),
    [tileSets.holding]
  );
  const landmarkTileMap = useMemo(
    () => new Map(tileSets.landmark.map((tile) => [tile.id, tile])),
    [tileSets.landmark]
  );
  const mythMap = useMemo(() => new Map(realm.myths.map((myth) => [myth.id, myth])), [realm.myths]);
  const staticViewBox = useMemo(() => {
    if (isInteractive) {
      return null;
    }
    const paddingValue = staticPadding ?? Math.max(viewOptions.hexSize.x, viewOptions.hexSize.y);

    if (!realm.hexes.length) {
      return `${hexBoundingBox.x - paddingValue} ${hexBoundingBox.y - paddingValue} ${
        hexBoundingBox.width + paddingValue * 2
      } ${hexBoundingBox.height + paddingValue * 2}`;
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    realm.hexes.forEach((hex) => {
      const center = axialToPixel(hex, viewOptions.orientation, viewOptions.hexSize);
      const hexMinX = center.x + hexBoundingBox.x;
      const hexMaxX = hexMinX + hexBoundingBox.width;
      const hexMinY = center.y + hexBoundingBox.y;
      const hexMaxY = hexMinY + hexBoundingBox.height;
      if (hexMinX < minX) minX = hexMinX;
      if (hexMinY < minY) minY = hexMinY;
      if (hexMaxX > maxX) maxX = hexMaxX;
      if (hexMaxY > maxY) maxY = hexMaxY;
    });

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return `${hexBoundingBox.x - paddingValue} ${hexBoundingBox.y - paddingValue} ${
        hexBoundingBox.width + paddingValue * 2
      } ${hexBoundingBox.height + paddingValue * 2}`;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    return `${minX - paddingValue} ${minY - paddingValue} ${width + paddingValue * 2} ${
      height + paddingValue * 2
    }`;
  }, [
    hexBoundingBox.height,
    hexBoundingBox.width,
    hexBoundingBox.x,
    hexBoundingBox.y,
    isInteractive,
    realm.hexes,
    staticPadding,
    viewOptions.hexSize,
    viewOptions.orientation,
  ]);
  const svgViewBox = isInteractive ? viewbox : (staticViewBox ?? viewbox);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSpacePanActive, setIsSpacePanActive] = useState(false);
  const [hoveredBarrier, setHoveredBarrier] = useState<{
    q: number;
    r: number;
    edge: number;
  } | null>(null);
  const [hoveredHexTooltip, setHoveredHexTooltip] = useState<{
    q: number;
    r: number;
    anchor: Element;
  } | null>(null);

  /**
   * Effect to enable panning with the spacebar.
   */
  useEffect(() => {
    if (!isInteractive) {
      setIsSpacePanActive(false);
      return;
    }
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
  }, [isInteractive]);

  useEffect(() => {
    if (
      !isInteractive ||
      isPickingTile ||
      activeTool !== 'select' ||
      !viewOptions.showTerrainTooltip
    ) {
      setHoveredHexTooltip(null);
    }
  }, [activeTool, isInteractive, isPickingTile, viewOptions.showTerrainTooltip]);

  useEffect(() => {
    if (isPainting) {
      setHoveredHexTooltip(null);
    }
  }, [isPainting]);

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

    if (!isInteractive) {
      return;
    }

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
  }, [
    isInteractive,
    isPickingTile,
    isSpacePanActive,
    isPanning,
    relocatingMythId,
    activeTool,
    containerRef,
  ]);

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
      if (!isInteractive) return;
      if (activeTool !== 'terrain' && activeTool !== 'barrier') return;

      setPaintedHexes((prevPainted) => {
        const getHex = (q: number, r: number) =>
          prevPainted.get(`${q},${r}`) || realmHexesMap.get(`${q},${r}`);
        const currentHex = getHex(hex.q, hex.r);
        if (!currentHex) return prevPainted;

        const newPainted = new Map(prevPainted);
        if (activeTool === 'terrain') {
          const shouldUpdateTerrain = currentHex.terrain !== paintTerrain;
          let shouldUpdateCharacter = false;
          if (paintCharacter === 'none') {
            shouldUpdateCharacter = currentHex.character !== undefined;
          } else if (paintCharacter === 'preserve') {
            shouldUpdateCharacter = false;
          } else {
            shouldUpdateCharacter = currentHex.character !== paintCharacter;
          }

          if (!shouldUpdateTerrain && !shouldUpdateCharacter) {
            return prevPainted;
          }

          const updatedHex: Hex = { ...currentHex, terrain: paintTerrain };
          if (paintCharacter === 'none') {
            delete updatedHex.character;
          } else if (paintCharacter !== 'preserve') {
            updatedHex.character = paintCharacter;
          }

          newPainted.set(`${hex.q},${hex.r}`, updatedHex);
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
      isInteractive,
      activeTool,
      paintTerrain,
      paintCharacter,
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
      if (!isInteractive) return;
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

      setHoveredHexTooltip(null);

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
      isInteractive,
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
    if (!isInteractive) return;
    if (!isPainting) return;
    setIsPainting(false);
    if (paintedHexes.size > 0) {
      onUpdateHex(Array.from(paintedHexes.values()));
    }
    setPaintedHexes(new Map());
  }, [isInteractive, isPainting, onUpdateHex, paintedHexes]);

  /**
   * Handles mouse move events for painting and barrier hover previews.
   */
  const handleHexMouseMove = useCallback(
    (hex: Hex, e: React.MouseEvent) => {
      if (!isInteractive) return;
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
      isInteractive,
      isPainting,
      viewOptions.orientation,
      viewOptions.hexSize,
      hexCorners,
      hoveredBarrier,
      handlePaint,
    ]
  );

  const handleHexHoverStart = useCallback(
    (hex: Hex, target: Element) => {
      if (!isInteractive) return;
      if (isPainting) return;
      if (isPickingTile) return;
      if (activeTool !== 'select') return;
      if (!viewOptions.showTerrainTooltip) return;
      setHoveredHexTooltip({ q: hex.q, r: hex.r, anchor: target });
    },
    [activeTool, isInteractive, isPainting, isPickingTile, viewOptions.showTerrainTooltip]
  );

  const handleHexHoverEnd = useCallback(() => {
    setHoveredHexTooltip(null);
  }, []);

  const hoveredHexTooltipData = useMemo(() => {
    if (!hoveredHexTooltip) return null;
    const key = `${hoveredHexTooltip.q},${hoveredHexTooltip.r}`;
    const baseHex = paintedHexes.get(key) || realmHexesMap.get(key);
    if (!baseHex) return null;

    const terrainTile = terrainTileMap.get(baseHex.terrain);
    const terrainLabel = terrainTile?.label ?? humanizeId(baseHex.terrain);
    const characterLabel = baseHex.character ? toTitleCase(baseHex.character) : null;

    const knightVisibility = viewOptions.visibility.knight;
    const isGmView = viewOptions.isGmView;

    const holdingTile = baseHex.holding ? holdingTileMap.get(baseHex.holding) : undefined;
    const landmarkTile = baseHex.landmark ? landmarkTileMap.get(baseHex.landmark) : undefined;

    let featureTitle: 'Holding' | 'Landmark' = 'Holding';
    let featureValue: string | null = null;

    if (holdingTile) {
      featureTitle = 'Holding';
      const isVisible = isGmView || (knightVisibility.holdings[holdingTile.id] ?? true);
      featureValue = isVisible ? holdingTile.label : 'Hidden';
    } else if (landmarkTile) {
      featureTitle = 'Landmark';
      const isVisible = isGmView || (knightVisibility.landmarks[landmarkTile.id] ?? true);
      featureValue = isVisible ? landmarkTile.label : 'Hidden';
    }

    let mythValue: string | null = null;
    if (baseHex.myth) {
      const myth = mythMap.get(baseHex.myth);
      const isVisible = isGmView || (knightVisibility.myths[baseHex.myth] ?? true);
      mythValue = isVisible ? (myth?.name ?? `Myth #${baseHex.myth}`) : 'Hidden';
    }

    return {
      terrainLabel,
      characterLabel,
      featureTitle,
      featureValue,
      mythValue,
    };
  }, [
    hoveredHexTooltip,
    paintedHexes,
    realmHexesMap,
    terrainTileMap,
    holdingTileMap,
    landmarkTileMap,
    mythMap,
    viewOptions.isGmView,
    viewOptions.visibility.knight,
  ]);

  const renderHexes = (layer: 'background' | 'foreground') => {
    if (!terrainTextures) {
      return null;
    }

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
          onHoverStart={handleHexHoverStart}
          onHoverEnd={handleHexHoverEnd}
          hexCorners={hexCorners}
          hexCornersInnerHighlight={hexCornersInnerHighlight}
          hexBoundingBox={hexBoundingBox}
          layer={layer}
          poiIconColor={poiIconColor}
          poiBackdropColor={poiBackdropColor}
        />
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-realm-map-viewport relative"
    >
      <svg
        ref={svgRef}
        id={svgId}
        className="w-full h-full"
        viewBox={svgViewBox}
        onMouseDown={!isInteractive || isPickingTile ? undefined : onMouseDown}
        onMouseUp={isInteractive ? handleMouseUp : undefined}
        onMouseLeave={
          isInteractive
            ? () => {
                handleMouseUp();
                setHoveredBarrier(null);
                setHoveredHexTooltip(null);
              }
            : undefined
        }
      >
        <defs>
          <clipPath id="hex-clip-path">
            <polygon points={hexCorners.map((p) => `${p.x},${p.y}`).join(' ')} />
          </clipPath>
        </defs>

        <g>{renderHexes('background')}</g>
        <g>{renderHexes('foreground')}</g>

        {/* Barrier Hover Highlight Layer */}
        {isInteractive && hoveredBarrier && activeTool === 'barrier' && !isPainting && (
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
                    stroke={HEX_SELECTED_COLOR}
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
      {!terrainTextures && <LoadingOverlay label="Preparing terrain textures…" variant="full" />}
      {terrainTextures && isLoadingTextures && (
        <LoadingOverlay label="Refreshing terrain textures…" variant="subtle" />
      )}
      {!isSettingsOpen && (
        <>
          <ToolsPalette activeTool={activeTool} setActiveTool={setActiveTool} />
          <ShortcutTips collapsed={shortcutTipsCollapsed} onToggleCollapse={onToggleShortcutTips} />
        </>
      )}
      {isInteractive &&
        viewOptions.showTerrainTooltip &&
        hoveredHexTooltip &&
        hoveredHexTooltipData && (
          <InfoPopup anchor={hoveredHexTooltip.anchor} onClose={() => setHoveredHexTooltip(null)}>
            <div className="space-y-3 text-sm text-text-high-contrast">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-subtle">Terrain</p>
                <p className="font-semibold">{hoveredHexTooltipData.terrainLabel}</p>
                {hoveredHexTooltipData.characterLabel && (
                  <p className="text-xs text-text-muted">
                    Character: {hoveredHexTooltipData.characterLabel}
                  </p>
                )}
              </div>
              {hoveredHexTooltipData.featureValue && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-subtle">
                    {hoveredHexTooltipData.featureTitle}
                  </p>
                  <p>{hoveredHexTooltipData.featureValue}</p>
                </div>
              )}
              {hoveredHexTooltipData.mythValue && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-subtle">Myth</p>
                  <p>{hoveredHexTooltipData.mythValue}</p>
                </div>
              )}
            </div>
          </InfoPopup>
        )}
    </div>
  );
}
