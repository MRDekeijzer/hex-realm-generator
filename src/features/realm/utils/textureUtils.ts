/**
 * @file utils/textureUtils.ts
 * This file contains the logic for pre-rendering terrain tiles to canvas textures
 * for performance optimization.
 */

import type { IconNode } from 'lucide-react';

import type { TileSet, TerrainTextures, Point, Tile } from '@/features/realm/types';
import { resolveColorToken } from '@/app/theme/colors';
import { getHexCorners } from './hexUtils';
import { generateSprayIcons } from './sprayUtils';
import { getIconNode } from './iconPaths';

const DEFAULT_TEXTURE_HEX_SIZE: Point = { x: 50, y: 50 };
const RESOLUTION_SCALE = 4; // Oversample to keep textures crisp when zooming.

const toNumber = (value: string | number | undefined): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const parsePoints = (points: string | undefined): { x: number; y: number }[] => {
  if (!points) {
    return [];
  }

  const values = points.trim().split(/[\s,]+/);
  const coordinates: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < values.length; i += 2) {
    const x = Number(values[i]);
    const y = Number(values[i + 1]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      coordinates.push({ x, y });
    }
  }
  return coordinates;
};

const createPathFromNode = (tag: string, attrs: Record<string, string>): Path2D | null => {
  switch (tag) {
    case 'path': {
      const pathData = attrs.d;
      if (!pathData) {
        return null;
      }
      return new Path2D(pathData);
    }
    case 'line': {
      const x1 = toNumber(attrs.x1);
      const y1 = toNumber(attrs.y1);
      const x2 = toNumber(attrs.x2);
      const y2 = toNumber(attrs.y2);
      if (x1 === null || y1 === null || x2 === null || y2 === null) {
        return null;
      }
      const path = new Path2D();
      path.moveTo(x1, y1);
      path.lineTo(x2, y2);
      return path;
    }
    case 'polyline':
    case 'polygon': {
      const points = parsePoints(attrs.points);
      if (points.length < 2) {
        return null;
      }
      const path = new Path2D();
      path.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i]?.x ?? 0, points[i]?.y ?? 0);
      }
      if (tag === 'polygon') {
        path.closePath();
      }
      return path;
    }
    case 'rect': {
      const x = toNumber(attrs.x) ?? 0;
      const y = toNumber(attrs.y) ?? 0;
      const width = toNumber(attrs.width);
      const height = toNumber(attrs.height);
      if (width === null || height === null) {
        return null;
      }
      const path = new Path2D();
      path.rect(x, y, width, height);
      return path;
    }
    case 'circle': {
      const cx = toNumber(attrs.cx) ?? 0;
      const cy = toNumber(attrs.cy) ?? 0;
      const radius = toNumber(attrs.r);
      if (radius === null) {
        return null;
      }
      const path = new Path2D();
      path.arc(cx, cy, radius, 0, Math.PI * 2);
      return path;
    }
    case 'ellipse': {
      const cx = toNumber(attrs.cx) ?? 0;
      const cy = toNumber(attrs.cy) ?? 0;
      const rx = toNumber(attrs.rx);
      const ry = toNumber(attrs.ry);
      if (rx === null || ry === null) {
        return null;
      }
      const path = new Path2D();
      path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      return path;
    }
    default:
      return null;
  }
};

const renderIconNode = (ctx: CanvasRenderingContext2D, iconNode: IconNode) => {
  for (const [tag, attrs] of iconNode) {
    const path = createPathFromNode(tag, attrs);
    if (!path) {
      continue;
    }

    const fillValue = attrs.fill;
    if (fillValue && fillValue !== 'none') {
      const previousFill = ctx.fillStyle;
      const resolvedFill = fillValue === 'currentColor' ? ctx.strokeStyle : fillValue;
      ctx.fillStyle = resolvedFill;
      ctx.fill(path);
      ctx.fillStyle = previousFill;
    }

    ctx.stroke(path);
  }
};

/**
 * Renders the spray icons for a given terrain onto a canvas context.
 * @param ctx The 2D rendering context of the canvas.
 * @param terrain The terrain tile definition.
 */
function drawSprayIcons(ctx: CanvasRenderingContext2D, terrain: Tile, hexSize: Point) {
  // Use a mock hex; the coordinates don't matter as the pattern is deterministic by terrain ID.
  const mockHex = { q: 0, r: 0, s: 0, terrain: terrain.id, barrierEdges: [] };
  const iconsToRender = generateSprayIcons(mockHex, terrain, hexSize);

  for (const icon of iconsToRender) {
    const iconNode = getIconNode(icon.name);
    if (!iconNode || iconNode.length === 0) {
      continue;
    }

    ctx.save();
    ctx.translate(icon.x, icon.y);
    ctx.rotate((icon.rotation * Math.PI) / 180);

    const fallbackColor = '#FF00FF';
    const strokeColor = resolveColorToken(icon.color ?? fallbackColor) || fallbackColor;
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = icon.opacity;

    // The icon definitions from lucide use a 24x24 viewport. Scale to the desired size.
    const scale = icon.size / 24;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // Center the 24x24 viewport

    renderIconNode(ctx, iconNode);

    ctx.restore();
  }
}

/**
 * Asynchronously generates pre-rendered textures for all terrain types.
 * @param tileSets - The complete set of tile definitions.
 * @param terrainColors - A map of terrain IDs to their current hex colors.
 * @returns A promise that resolves to a TerrainTextures object.
 */
export async function generateTerrainTextures(
  tileSets: TileSet,
  terrainColors: Record<string, string>,
  hexSize: Point = DEFAULT_TEXTURE_HEX_SIZE
): Promise<TerrainTextures> {
  const textures: TerrainTextures = {};

  const canvas = document.createElement('canvas');
  const hexBoundingBox = {
    width: hexSize.x * Math.sqrt(3),
    height: hexSize.y * 2,
  };
  const devicePixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;
  const scaleFactor = RESOLUTION_SCALE * devicePixelRatio;
  canvas.width = Math.round(hexBoundingBox.width * scaleFactor);
  canvas.height = Math.round(hexBoundingBox.height * scaleFactor);
  canvas.style.width = `${hexBoundingBox.width}px`;
  canvas.style.height = `${hexBoundingBox.height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D rendering context');
  }
  ctx.scale(scaleFactor, scaleFactor);

  const hexCorners = getHexCorners('pointy', hexSize);

  for (const terrain of tileSets.terrain) {
    const color = terrainColors[terrain.id] || '#cccccc';

    // Reset canvas for the next texture
    ctx.clearRect(0, 0, hexBoundingBox.width, hexBoundingBox.height);
    ctx.save();

    // Center the hex in the canvas
    ctx.translate(hexBoundingBox.width / 2, hexBoundingBox.height / 2);

    // --- Generate texture WITHOUT spray ---
    ctx.beginPath();
    ctx.moveTo(hexCorners[0]?.x ?? 0, hexCorners[0]?.y ?? 0);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(hexCorners[i]?.x ?? 0, hexCorners[i]?.y ?? 0);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    const withoutSpray = canvas.toDataURL('image/png');

    // --- Generate texture WITH spray ---
    drawSprayIcons(ctx, terrain, hexSize);
    const withSpray = canvas.toDataURL('image/png');

    textures[terrain.id] = { withSpray, withoutSpray };
    ctx.restore();
  }

  return textures;
}
