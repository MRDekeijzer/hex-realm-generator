/**
 * @file sprayUtils.ts
 * This file contains the core logic for the procedural "Icon Spray" feature.
 */
import type { Hex, Point, Tile } from '../types';
import { DEFAULT_SPRAY_SETTINGS, MASK_RESOLUTION } from '../constants';

type SprayIcon = {
  name: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  color: string;
};

/**
 * A simple, high-quality pseudo-random number generator.
 * @param a The seed.
 * @returns A function that returns a random number between 0 and 1.
 */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a consistent seed from a string.
 * @param str The input string (e.g., terrain ID).
 * @returns A 32-bit integer seed.
 */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Generates a set of procedural icons to spray onto a hex tile for added texture.
 * The generation is deterministic based on the hex coordinates.
 */
export const generateSprayIcons = (
  hex: Hex,
  terrainTile: Tile,
  hexSize: Point
): SprayIcon[] => {
  const settings = terrainTile.spraySettings || DEFAULT_SPRAY_SETTINGS;
  if (!terrainTile.sprayIcons || terrainTile.sprayIcons.length === 0 || settings.density === 0) {
    return [];
  }

  // Find all valid cells in the placement mask.
  const validMaskIndices: number[] = [];
  settings.placementMask.forEach((value, index) => {
    if (value === 1) {
      validMaskIndices.push(index);
    }
  });

  // If mask is empty, no icons can be placed.
  if (validMaskIndices.length === 0) {
    return [];
  }

  // The seed is deterministically based on the hex coordinates and terrain type,
  // making the spray pattern unique for each hex but consistent on regeneration.
  const seed = hex.q * 1337 + hex.r * 31337 + stringToSeed(terrainTile.id);
  const random = mulberry32(seed);

  const finalIcons: SprayIcon[] = [];
  const availableIcons = terrainTile.sprayIcons;

  // Use the hex's outer radius (center to corner) for the placement area.
  // The SVG clipping path in the renderer will handle the precise hexagonal shape.
  const hexRadius = hexSize.x;

  let attempts = 0;
  const maxAttempts = settings.density * 50; // Safety break

  // Attempt to place icons until the desired density is met
  while (finalIcons.length < settings.density && attempts < maxAttempts) {
    attempts++;

    // 1. Pick a random valid mask cell
    const chosenMaskIndex = validMaskIndices[Math.floor(random() * validMaskIndices.length)];
    if (chosenMaskIndex === undefined) {
      // This should be unreachable due to the length check, but satisfies the compiler.
      continue;
    }
    const maskY = Math.floor(chosenMaskIndex / MASK_RESOLUTION);
    const maskX = chosenMaskIndex % MASK_RESOLUTION;

    // 2. Generate a random point *within* that cell
    const cellSize = 1 / MASK_RESOLUTION;
    // Convert mask coords [0, MASK_RESOLUTION-1] to normalized coords [-1, 1]
    const cellXStart = maskX * cellSize * 2 - 1;
    const cellYStart = maskY * cellSize * 2 - 1;

    const ptNormX = cellXStart + random() * cellSize * 2;
    const ptNormY = cellYStart + random() * cellSize * 2;

    const pt = {
      x: ptNormX * hexRadius,
      y: ptNormY * hexRadius,
    };

    // Optimization: Ensure the icon's center is within the hex's circumscribing circle.
    // This prevents generating icons that would be almost entirely clipped away.
    if (Math.sqrt(pt.x * pt.x + pt.y * pt.y) > hexRadius) {
      continue;
    }

    const size = random() * (settings.sizeMax - settings.sizeMin) + settings.sizeMin;

    const chosenIconName = availableIcons[Math.floor(random() * availableIcons.length)];
    if (chosenIconName === undefined) {
      // Also unreachable due to length check
      continue;
    }

    const newIcon: SprayIcon = {
      name: chosenIconName,
      x: pt.x,
      y: pt.y,
      size: size,
      rotation: 0, // No rotation
      opacity: random() * (settings.opacityMax - settings.opacityMin) + settings.opacityMin,
      color: settings.color,
    };

    finalIcons.push(newIcon);
  }

  return finalIcons;
};