/**
 * @file realmGenerator.ts
 * This file contains the core logic for procedurally generating a new realm.
 * It handles grid creation, terrain distribution, and the placement of holdings,
 * landmarks, myths, and barriers.
 */

import type { Realm, Hex, GenerationOptions, Myth } from '../types';
import { HOLDING_TYPES, BARRIER_CHANCE } from '../constants';
import { getAxialDistance, getNeighbors } from '../utils/hexUtils';
import { PerlinNoise } from './perlin';

/**
 * Defines the shape and size for realm generation.
 */
type GenerateRealmOptions =
  | { shape: 'hex'; radius: number }
  | { shape: 'square'; width: number; height: number };

/**
 * Creates a hexagonal grid of hexes.
 * @param radius - The radius of the hexagonal map.
 * @returns An array of Hex objects.
 */
function createHexagonalGrid(radius: number): Hex[] {
  const hexes: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(q) + Math.abs(r) + Math.abs(s) <= radius * 2) {
        if (getAxialDistance({ q: 0, r: 0 }, { q, r }) <= radius) {
          hexes.push({ q, r, s, terrain: '', barrierEdges: [] });
        }
      }
    }
  }
  return hexes;
}

/**
 * Creates a rectangular grid of hexes.
 * @param width - The width of the rectangular map.
 * @param height - The height of the rectangular map.
 * @returns An array of Hex objects.
 */
function createSquareGrid(width: number, height: number): Hex[] {
  const hexes: Hex[] = [];
  const hexesRaw: { q: number; r: number }[] = [];

  // Use offset coordinates and convert to axial to create the rectangle
  for (let r_offset = 0; r_offset < height; r_offset++) {
    for (let q_offset = 0; q_offset < width; q_offset++) {
      const q = q_offset - Math.floor(r_offset / 2);
      hexesRaw.push({ q, r: r_offset });
    }
  }

  if (hexesRaw.length === 0) return [];

  // Center the grid around (0,0)
  const qCenter = hexesRaw.reduce((s, h) => s + h.q, 0) / hexesRaw.length;
  const rCenter = hexesRaw.reduce((s, h) => s + h.r, 0) / hexesRaw.length;
  const qShift = Math.round(qCenter);
  const rShift = Math.round(rCenter);

  for (const h of hexesRaw) {
    const q = h.q - qShift;
    const r = h.r - rShift;
    hexes.push({ q, r, s: -q - r, terrain: '', barrierEdges: [] });
  }
  return hexes;
}

/**
 * Selects a random element from an array.
 * @param arr - The array to select from.
 * @returns A random element from the array.
 */
function getRandomElement<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates an initial terrain map based on Perlin noise and elevation distribution.
 * @param hexes - The array of hexes to assign terrain to.
 * @param options - The generation options.
 * @returns A Map where keys are hex coordinates and values are terrain IDs.
 */
function getInitialTerrainMap(hexes: Hex[], options: GenerationOptions): Map<string, string> {
  const noiseGen = new PerlinNoise(Math.random());
  if (hexes.length === 0) return new Map();

  // Calculate map bounds for noise normalization
  let minQ = Infinity,
    maxQ = -Infinity,
    minR = Infinity,
    maxR = -Infinity;
  hexes.forEach((h) => {
    minQ = Math.min(minQ, h.q);
    maxQ = Math.max(maxQ, h.q);
    minR = Math.min(minR, h.r);
    maxR = Math.max(maxR, h.r);
  });
  const maxDimension = Math.max(maxQ - minQ, maxR - minR, 1);

  const hexElevations: { hex: Hex; elevation: number }[] = hexes.map((hex) => {
    // Base noise calculation
    let e = 0,
      freq = 1,
      amp = 1;
    for (let i = 0; i < 5; i++) {
      e += noiseGen.noise(hex.q * 0.1 * freq, hex.r * 0.1 * freq) * amp;
      freq *= 2;
      amp *= 0.5;
    }

    // Apply highland formation modifier
    let e_mod = 0;
    if (options.highlandFormation !== 'random') {
      const centerX = (minQ + maxQ) / 2;
      const centerY = (minR + maxR) / 2;
      const nx = (hex.q - centerX) / (maxDimension / 2),
        ny = (hex.r - centerY) / (maxDimension / 2);
      const angle = (options.highlandFormationRotation * Math.PI) / 180;
      const rx = nx * Math.cos(angle) - ny * Math.sin(angle);
      const ry = nx * Math.sin(angle) + ny * Math.cos(angle);

      if (options.highlandFormation === 'linear') e_mod = -ry;
      else if (options.highlandFormation === 'circle')
        e_mod = 1 - Math.min(1, Math.sqrt(rx * rx + ry * ry) / Math.sqrt(2));
      // (Triangle logic omitted for brevity, but it calculates if the point is inside a rotated triangle)
    }
    if (
      options.highlandFormationInverse === true &&
      (options.highlandFormation === 'circle' || options.highlandFormation === 'triangle')
    )
      e_mod = -e_mod;
    e += e_mod * 1.5 * options.highlandFormationStrength;

    return { hex, elevation: e };
  });

  hexElevations.sort((a, b) => b.elevation - a.elevation);

  // Distribute terrain types based on elevation and biases
  const initialTerrainMap = new Map<string, string>();
  const totalHexes = hexes.length;
  let currentIndex = 0;
  const { terrainBiases, terrainHeightOrder } = options;
  const totalBias =
    Object.values(terrainBiases).reduce((sum, b) => (sum || 0) + (b || 0), 0) || 1;

  const terrainsToPlace = Object.entries(terrainBiases)
    .filter(([, bias]) => (bias || 0) > 0)
    .sort(
      ([a], [b]) => (terrainHeightOrder.indexOf(a) ?? -1) - (terrainHeightOrder.indexOf(b) ?? -1)
    );

  for (const [terrain, bias] of terrainsToPlace) {
    const numHexesForTerrain = Math.round(((bias || 0) / totalBias) * totalHexes);
    const endIndex = Math.min(currentIndex + numHexesForTerrain, totalHexes);
    for (let i = currentIndex; i < endIndex; i++) {
      const hexElevation = hexElevations[i];
      if (hexElevation) {
        initialTerrainMap.set(`${hexElevation.hex.q},${hexElevation.hex.r}`, terrain);
      }
    }
    currentIndex = endIndex;
  }
  // Fill any remaining hexes with the last terrain type
  if (currentIndex < totalHexes && terrainsToPlace.length > 0) {
    const lastTerrain = terrainsToPlace[terrainsToPlace.length - 1]?.[0];
    if (lastTerrain) {
      for (let i = currentIndex; i < totalHexes; i++) {
        const hexElevation = hexElevations[i];
        if (hexElevation) {
          initialTerrainMap.set(`${hexElevation.hex.q},${hexElevation.hex.r}`, lastTerrain);
        }
      }
    }
  }
  return initialTerrainMap;
}

/**
 * Assigns terrain to all hexes using a cellular automata-like relaxation process
 * to create more natural-looking clusters.
 * @param hexes - The array of hexes.
 * @param options - The generation options containing the clustering matrix.
 */
function generateTerrain(hexes: Hex[], options: GenerationOptions): void {
  const initialTerrainMap = getInitialTerrainMap(hexes, options);
  hexes.forEach((hex) => (hex.terrain = initialTerrainMap.get(`${hex.q},${hex.r}`) || 'plain'));

  const RELAXATION_PASSES = 4;
  const terrainTypes = Object.keys(options.terrainClusteringMatrix);
  let currentHexes = hexes.map((h) => ({ ...h }));

  for (let i = 0; i < RELAXATION_PASSES; i++) {
    const nextHexes = currentHexes.map((h) => ({ ...h }));
    const currentHexesMap = new Map(currentHexes.map((h) => [`${h.q},${h.r}`, h]));

    for (const hex of nextHexes) {
      let bestTerrain = hex.terrain;
      let maxScore = -Infinity;
      for (const candidateTerrain of terrainTypes) {
        let score = 0;
        const neighbors = getNeighbors(hex)
          .map((coords) => currentHexesMap.get(`${coords.q},${coords.r}`))
          .filter((h): h is Hex => !!h);
        for (const neighbor of neighbors) {
          score += options.terrainClusteringMatrix[candidateTerrain]?.[neighbor.terrain] || 0;
        }
        if (candidateTerrain === initialTerrainMap.get(`${hex.q},${hex.r}`)) score += 1.5; // Weight towards initial terrain
        if (score > maxScore) {
          maxScore = score;
          bestTerrain = candidateTerrain;
        }
      }
      hex.terrain = bestTerrain;
    }
    currentHexes = nextHexes;
  }
  const finalHexesMap = new Map(currentHexes.map((h) => [`${h.q},${h.r}`, h]));
  hexes.forEach((h) => {
    h.terrain = finalHexesMap.get(`${h.q},${h.r}`)?.terrain || h.terrain;
  });
}

/**
 * Randomly adds barriers to hex edges.
 * @param hexes - The array of hexes.
 */
function addBarriers(hexes: Hex[]): void {
  const numBarriers = Math.floor((hexes.length * 6 * BARRIER_CHANCE) / 2);
  for (let i = 0; i < numBarriers; i++) {
    const hex = getRandomElement(hexes);
    if (!hex) continue;
    const edge = Math.floor(Math.random() * 6);
    if (!hex.barrierEdges.includes(edge)) {
      hex.barrierEdges.push(edge);
      const neighborCoords = getNeighbors(hex)[edge];
      if (!neighborCoords) continue;
      const neighborHex = hexes.find((h) => h.q === neighborCoords.q && h.r === neighborCoords.r);
      if (neighborHex) {
        const oppositeEdge = (edge + 3) % 6;
        if (!neighborHex.barrierEdges.includes(oppositeEdge)) {
          neighborHex.barrierEdges.push(oppositeEdge);
        }
      }
    }
  }
}

/**
 * Places holdings on the map, avoiding certain terrains and ensuring minimum distance.
 * @param hexes - The array of hexes.
 * @param sizeForDensity - A size metric (radius or max dimension) to scale placement distance.
 * @param numHoldings - The number of holdings to place.
 * @returns The coordinates of the designated Seat of Power.
 */
function placeHoldings(
  hexes: Hex[],
  sizeForDensity: number,
  numHoldings: number
): { q: number; r: number } {
  const validHexes = hexes.filter(
    (h) => !['peaks', 'crags', 'bog', 'lakes', 'marsh'].includes(h.terrain)
  );
  const placedHoldings: Hex[] = [];
  while (placedHoldings.length < numHoldings && validHexes.length > 0) {
    const index = Math.floor(Math.random() * validHexes.length);
    const hex = validHexes.splice(index, 1)[0];
    if (
      hex &&
      !hex.holding &&
      !placedHoldings.some((h) => getAxialDistance(h, hex) < sizeForDensity / 4)
    ) {
      hex.holding = getRandomElement(HOLDING_TYPES);
      placedHoldings.push(hex);
    }
  }
  const firstHolding = placedHoldings[0];
  if (firstHolding) return { q: firstHolding.q, r: firstHolding.r };

  const fallbackHex = hexes.find((h) => h.q === 0 && h.r === 0) || hexes[0];
  if (fallbackHex) {
    fallbackHex.holding = 'castle';
    return { q: fallbackHex.q, r: fallbackHex.r };
  }
  return { q: 0, r: 0 };
}

/**
 * Places myths on the map, prioritizing remote locations.
 * @param hexes - The array of hexes.
 * @param numMyths - The number of myths to place.
 * @param mythMinDistance - The minimum distance between myths.
 * @returns An array of the generated Myth objects.
 */
function placeMyths(hexes: Hex[], numMyths: number, mythMinDistance: number): Myth[] {
  const featureHexes = hexes.filter((h) => h.holding || h.landmark);
  const candidates = hexes.filter((h) => !h.holding && !h.landmark);
  if (featureHexes.length > 0) {
    candidates.sort(
      (a, b) =>
        Math.min(...featureHexes.map((f) => getAxialDistance(b, f))) -
        Math.min(...featureHexes.map((f) => getAxialDistance(a, f)))
    );
  } else {
    candidates.sort((a, b) => getAxialDistance({ q: 0, r: 0 }, b) - getAxialDistance({ q: 0, r: 0 }, a));
  }
  const placedMyths: Hex[] = [];
  for (const candidate of candidates) {
    if (placedMyths.length >= numMyths) break;
    if (placedMyths.every((p) => getAxialDistance(candidate, p) >= mythMinDistance)) {
      placedMyths.push(candidate);
    }
  }
  const myths: Myth[] = [];
  placedMyths.forEach((hex, index) => {
    const mythId = index + 1;
    hex.myth = mythId;
    myths.push({ id: mythId, name: `Myth #${mythId}`, q: hex.q, r: hex.r });
  });
  return myths;
}

/**
 * Places a specified number of each landmark type on valid hexes.
 * @param hexes - The array of hexes.
 * @param landmarkOptions - An object specifying how many of each landmark to place.
 */
function placeLandmarks(hexes: Hex[], landmarkOptions: { [key: string]: number }): void {
  const validHexes = hexes.filter((h) => !h.holding && !h.landmark);
  Object.entries(landmarkOptions).forEach(([type, count]) => {
    const numToPlace = count || 0;
    for (let i = 0; i < numToPlace && validHexes.length > 0; i++) {
      const index = Math.floor(Math.random() * validHexes.length);
      const chosenHex = validHexes.splice(index, 1)[0];
      if (chosenHex) {
        chosenHex.landmark = type;
      }
    }
  });
}

/**
 * The main function to generate a complete realm.
 * @param options - The shape and size of the realm.
 * @param genOptions - The detailed parameters for procedural generation.
 * @returns A complete Realm object.
 */
export function generateRealm(options: GenerateRealmOptions, genOptions: GenerationOptions): Realm {
  let hexes: Hex[];
  let sizeForDensity: number;
  const realmData: Partial<Realm> = { shape: options.shape };

  if (options.shape === 'hex') {
    hexes = createHexagonalGrid(options.radius);
    sizeForDensity = options.radius;
    realmData.radius = options.radius;
  } else {
    hexes = createSquareGrid(options.width, options.height);
    sizeForDensity = Math.max(options.width, options.height);
    realmData.width = options.width;
    realmData.height = options.height;
  }

  generateTerrain(hexes, genOptions);
  if (genOptions.generateBarriers) addBarriers(hexes);
  const seatOfPower = placeHoldings(hexes, sizeForDensity, genOptions.numHoldings);
  placeLandmarks(hexes, genOptions.landmarks);

  hexes.forEach((h) => (h.myth = undefined));
  const myths = placeMyths(hexes, genOptions.numMyths, genOptions.mythMinDistance);

  if (genOptions.numMyths > 0 && myths.length < genOptions.numMyths) {
    throw new Error(
      `Could not place all myths. Only placed ${myths.length} of ${genOptions.numMyths}. Try reducing 'Myth Min Distance' or the number of myths.`
    );
  }

  return { ...realmData, hexes, myths, seatOfPower } as Realm;
}
