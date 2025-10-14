/**
 * @file utils/textureUtils.ts
 * This file contains the logic for pre-rendering terrain tiles to canvas textures
 * for performance optimization.
 */

import type { TileSet, TerrainTextures, Point, Tile } from '@/features/realm/types';
import { getHexCorners } from './hexUtils';
import { generateSprayIcons } from './sprayUtils';
import { iconPaths } from './iconPaths';

const DEFAULT_TEXTURE_HEX_SIZE: Point = { x: 50, y: 50 };
const RESOLUTION_SCALE = 4; // Oversample to keep textures crisp when zooming.

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
    const paths = iconPaths[icon.name];
    if (!paths) continue;

    ctx.save();
    ctx.translate(icon.x, icon.y);
    ctx.rotate((icon.rotation * Math.PI) / 180);

    const strokeColor = icon.color || '#FF00FF';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = icon.opacity;

    // The icon paths from lucide are for a 24x24 viewport. We need to scale them to the desired size.
    const scale = icon.size / 24;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // Center the 24x24 viewport

    for (const pathData of paths) {
      try {
        const path2d = new Path2D(pathData);
        ctx.stroke(path2d);
      } catch (e) {
        console.warn(`Could not draw path for icon '${icon.name}':`, e);
      }
    }

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
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1;
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
