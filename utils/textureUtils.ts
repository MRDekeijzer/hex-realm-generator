/**
 * @file utils/textureUtils.ts
 * This file contains the logic for pre-rendering terrain tiles to canvas textures
 * for performance optimization.
 */

import type { TileSet, TerrainTextures, Point, Tile } from '../types';
import { getHexCorners } from './hexUtils';
import { generateSprayIcons } from './sprayUtils';
import { iconPaths } from './iconPaths';
import { colorTokenList } from '../constants';

const TEXTURE_SIZE = 256; // Use a high-resolution power-of-two for good quality and performance.
const TEXTURE_HEX_SIZE: Point = { x: TEXTURE_SIZE / 2, y: TEXTURE_SIZE / 2 };

/**
 * Reads all theme-related CSS variables from the document's computed style.
 * @returns A map of CSS variable names to their computed color values.
 */
function getResolvedColors(): { [key: string]: string } {
    const rootStyle = getComputedStyle(document.documentElement);
    const newColors: { [key: string]: string } = {};
    for (const token of colorTokenList) {
        newColors[token] = rootStyle.getPropertyValue(token).trim();
    }
    return newColors;
}

/**
 * Renders the spray icons for a given terrain onto a canvas context.
 * @param ctx The 2D rendering context of the canvas.
 * @param terrain The terrain tile definition.
 * @param resolvedColors A map of CSS variable names to their computed color values.
 */
function drawSprayIcons(ctx: CanvasRenderingContext2D, terrain: Tile, resolvedColors: { [key: string]: string }) {
  // Use a mock hex; the coordinates don't matter as the pattern is deterministic by terrain ID.
  const mockHex = { q: 0, r: 0, s: 0, terrain: terrain.id, barrierEdges: [] };
  const iconsToRender = generateSprayIcons(mockHex, terrain, TEXTURE_HEX_SIZE);

  for (const icon of iconsToRender) {
    const paths = iconPaths[icon.name];
    if (!paths) continue;

    ctx.save();
    ctx.translate(icon.x, icon.y);
    ctx.rotate((icon.rotation * Math.PI) / 180);

    const varNameMatch = icon.color.match(/--[a-zA-Z0-9-]+/);
    const colorKey = varNameMatch ? varNameMatch[0] : null;
    const resolvedColor = colorKey ? resolvedColors[colorKey] : icon.color;

    ctx.fillStyle = resolvedColor || '#FF00FF'; // Fallback to magenta if color is invalid
    ctx.globalAlpha = icon.opacity;

    // The icon paths from lucide are for a 24x24 viewport. We need to scale them to the desired size.
    const scale = icon.size / 24;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // Center the 24x24 viewport

    for (const pathData of paths) {
      try {
        const path2d = new Path2D(pathData);
        ctx.fill(path2d);
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
  terrainColors: { [key: string]: string }
): Promise<TerrainTextures> {
  const resolvedColors = getResolvedColors();
  if (!resolvedColors['--color-background-primary']) {
      throw new Error("CSS color variables could not be resolved. Styles may not be loaded.");
  }

  const textures: TerrainTextures = {};

  const canvas = document.createElement('canvas');
  const hexBoundingBox = {
    width: TEXTURE_HEX_SIZE.x * Math.sqrt(3),
    height: TEXTURE_HEX_SIZE.y * 2,
  };
  canvas.width = hexBoundingBox.width;
  canvas.height = hexBoundingBox.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D rendering context');
  }

  const hexCorners = getHexCorners('pointy', TEXTURE_HEX_SIZE);

  for (const terrain of tileSets.terrain) {
    const color = terrainColors[terrain.id] || '#cccccc';

    // Reset canvas for the next texture
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Center the hex in the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

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
    drawSprayIcons(ctx, terrain, resolvedColors);
    const withSpray = canvas.toDataURL('image/png');

    textures[terrain.id] = { withSpray, withoutSpray };
    ctx.restore();
  }

  return textures;
}