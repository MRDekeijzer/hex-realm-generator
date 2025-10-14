/**
 * @file sprayUtils.ts
 * This file contains the core logic for the procedural "Icon Spray" feature.
 */
import type { Hex, Point, Tile, SpraySettings } from '@/features/realm/types';
import { DEFAULT_SPRAY_SETTINGS, MASK_RESOLUTION } from '@/features/realm/config/constants';

interface SprayIcon {
  name: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  color: string;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isPointAllowedByMask = (
  normX: number,
  normY: number,
  mask: number[] | undefined
): boolean => {
  if (!mask || mask.length === 0) {
    return true;
  }

  // Convert [-1, 1] space to mask indices [0, MASK_RESOLUTION - 1]
  const maskX = clamp(Math.floor(((normX + 1) / 2) * MASK_RESOLUTION), 0, MASK_RESOLUTION - 1);
  const maskY = clamp(Math.floor(((normY + 1) / 2) * MASK_RESOLUTION), 0, MASK_RESOLUTION - 1);
  const maskIndex = maskY * MASK_RESOLUTION + maskX;

  return mask[maskIndex] === 1;
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

interface SizeBounds {
  base: number;
  min: number;
  max: number;
  range: number;
  half: number;
}

const computeSizeBounds = (settings: SpraySettings): SizeBounds => {
  const base = (settings.sizeMin + settings.sizeMax) / 2;
  const legacyHalfRange = Math.abs(settings.sizeMax - settings.sizeMin) / 2;
  const varianceHalfRange = Math.max(0, base) * clamp(settings.scaleVariance ?? 0, 0, 1) * 0.5;
  const half = Math.max(legacyHalfRange, varianceHalfRange);
  const min = Math.max(0, base - half);
  const max = Math.max(min, base + half);

  return {
    base,
    min,
    max,
    range: max - min,
    half,
  };
};

const generateGridModeIcons = (
  settings: SpraySettings,
  availableIcons: string[],
  random: () => number,
  hexRadius: number,
  sizeBounds: SizeBounds
): SprayIcon[] => {
  const icons: SprayIcon[] = [];
  if (availableIcons.length === 0) {
    return icons;
  }

  const gridDensity = Math.max(1, Math.round(settings.gridDensity));
  const gridExtentScalar = clamp(settings.gridSize, 0.1, 1);
  const jitterAmount = clamp(settings.gridJitter, 0, 1);
  const rotationRange = Math.max(0, settings.gridRotationRange);

  const gridSpan = hexRadius * 2 * gridExtentScalar;
  const step = gridDensity > 1 ? gridSpan / (gridDensity - 1) : 0;
  const halfSpan = gridSpan / 2;
  const cellSize = gridDensity > 1 ? step : gridSpan;

  const { base: baseSize, min: minSize, max: maxSize, half: halfRange, range } = sizeBounds;

  for (let row = 0; row < gridDensity; row++) {
    for (let col = 0; col < gridDensity; col++) {
      let x = gridDensity > 1 ? -halfSpan + col * step : 0;
      let y = gridDensity > 1 ? -halfSpan + row * step : 0;

      if (cellSize > 0 && jitterAmount > 0) {
        const jitterOffset = () => (random() * 2 - 1) * cellSize * 0.5 * jitterAmount;
        x += jitterOffset();
        y += jitterOffset();
      }

      if (Math.sqrt(x * x + y * y) > hexRadius) {
        continue;
      }

      const normX = x / hexRadius;
      const normY = y / hexRadius;
      if (!isPointAllowedByMask(normX, normY, settings.placementMask)) {
        continue;
      }

      const chosenIconName = availableIcons[Math.floor(random() * availableIcons.length)];
      if (!chosenIconName) {
        continue;
      }

      const size =
        range > 0 ? clamp(baseSize + (random() * 2 - 1) * halfRange, minSize, maxSize) : baseSize;

      const rotation = rotationRange > 0 ? (random() * 2 - 1) * rotationRange : 0;
      const opacity = random() * (settings.opacityMax - settings.opacityMin) + settings.opacityMin;

      icons.push({
        name: chosenIconName,
        x,
        y,
        size,
        rotation,
        opacity,
        color: settings.color,
      });
    }
  }

  return icons;
};

const generateRandomModeIcons = (
  settings: SpraySettings,
  availableIcons: string[],
  random: () => number,
  hexRadius: number,
  sizeBounds: SizeBounds
): SprayIcon[] => {
  const icons: SprayIcon[] = [];
  if (availableIcons.length === 0) {
    return icons;
  }

  const validMaskIndices: number[] = [];
  settings.placementMask?.forEach((value, index) => {
    if (value === 1) {
      validMaskIndices.push(index);
    }
  });

  if (validMaskIndices.length === 0) {
    return icons;
  }

  const desiredCount = Math.max(0, Math.floor(settings.density));
  const maxAttempts = Math.max(1, desiredCount * 50);
  const minSeparation = Math.max(0, settings.minSeparation);
  const centerBias = clamp(settings.centerBias, 0, 1);
  const biasExponent = 1 + centerBias * 2;
  const { min: minSize, max: maxSize, range: sizeRange, base: baseSize } = sizeBounds;

  let attempts = 0;
  while (icons.length < desiredCount && attempts < maxAttempts) {
    attempts++;

    const chosenMaskIndex = validMaskIndices[Math.floor(random() * validMaskIndices.length)];
    if (chosenMaskIndex === undefined) {
      continue;
    }

    const maskY = Math.floor(chosenMaskIndex / MASK_RESOLUTION);
    const maskX = chosenMaskIndex % MASK_RESOLUTION;

    const cellSize = 1 / MASK_RESOLUTION;
    const cellXStart = maskX * cellSize * 2 - 1;
    const cellYStart = maskY * cellSize * 2 - 1;

    let normX = cellXStart + random() * cellSize * 2;
    let normY = cellYStart + random() * cellSize * 2;

    if (centerBias > 0) {
      const distance = Math.sqrt(normX * normX + normY * normY);
      if (distance > 0) {
        const normalizedDistance = Math.min(1, distance);
        const biasedDistance = Math.pow(normalizedDistance, biasExponent);
        const scale = biasedDistance / normalizedDistance;
        normX *= scale;
        normY *= scale;
      }
    }

    if (!isPointAllowedByMask(normX, normY, settings.placementMask)) {
      continue;
    }

    const x = normX * hexRadius;
    const y = normY * hexRadius;

    if (Math.sqrt(x * x + y * y) > hexRadius) {
      continue;
    }

    if (
      minSeparation > 0 &&
      icons.some((icon) => {
        const dx = icon.x - x;
        const dy = icon.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minSeparation;
      })
    ) {
      continue;
    }

    const chosenIconName = availableIcons[Math.floor(random() * availableIcons.length)];
    if (!chosenIconName) {
      continue;
    }

    const size = sizeRange > 0 ? minSize + random() * sizeRange : baseSize;
    const opacity = random() * (settings.opacityMax - settings.opacityMin) + settings.opacityMin;

    icons.push({
      name: chosenIconName,
      x,
      y,
      size,
      rotation: 0,
      opacity,
      color: settings.color,
    });
  }

  return icons;
};

/**
 * Generates a set of procedural icons to spray onto a hex tile for added texture.
 * The generation is deterministic based on the hex coordinates.
 */
export const generateSprayIcons = (hex: Hex, terrainTile: Tile, hexSize: Point): SprayIcon[] => {
  const rawSettings = terrainTile.spraySettings || DEFAULT_SPRAY_SETTINGS;
  const settings: SpraySettings = {
    ...DEFAULT_SPRAY_SETTINGS,
    ...rawSettings,
    placementMask: rawSettings.placementMask ?? DEFAULT_SPRAY_SETTINGS.placementMask,
    scaleVariance:
      rawSettings.scaleVariance ??
      (rawSettings as Partial<SpraySettings> & { gridScaleVariance?: number }).gridScaleVariance ??
      DEFAULT_SPRAY_SETTINGS.scaleVariance,
    seedOffset: rawSettings.seedOffset ?? DEFAULT_SPRAY_SETTINGS.seedOffset,
  };

  if (!terrainTile.sprayIcons || terrainTile.sprayIcons.length === 0) {
    return [];
  }

  const hexRadius = hexSize.x;
  if (hexRadius <= 0) {
    return [];
  }

  const seed = hex.q * 1337 + hex.r * 31337 + stringToSeed(terrainTile.id) + (settings.seedOffset ?? 0);
  const random = mulberry32(seed);
  const sizeBounds = computeSizeBounds(settings);

  if (settings.mode === 'grid') {
    return generateGridModeIcons(settings, terrainTile.sprayIcons, random, hexRadius, sizeBounds);
  }

  if (settings.density <= 0) {
    return [];
  }

  return generateRandomModeIcons(settings, terrainTile.sprayIcons, random, hexRadius, sizeBounds);
};
