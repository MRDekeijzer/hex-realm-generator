
import type { Realm, Hex, GenerationOptions, Myth } from '../types';
// FIX: Import BARRIER_CHANCE to use it in the addBarriers function.
import { TERRAIN_TYPES, HOLDING_TYPES, BARRIER_CHANCE } from '../constants';
import { getAxialDistance, getNeighbors } from '../utils/hexUtils';
import { PerlinNoise } from './perlin';

type GenerateRealmOptions = 
  | { shape: 'hex', radius: number }
  | { shape: 'square', width: number, height: number };

function createHexagonalGrid(radius: number): Hex[] {
  const hexes: Hex[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(q) + Math.abs(r) + Math.abs(s) <= radius * 2) {
        if (getAxialDistance({q:0, r:0}, {q,r}) <= radius) {
            hexes.push({ q, r, s, terrain: '', barrierEdges: [] });
        }
      }
    }
  }
  return hexes;
}

function createSquareGrid(width: number, height: number): Hex[] {
    const hexes: Hex[] = [];
    const hexesRaw: {q: number, r: number}[] = [];

    // This loop generates coordinates for a horizontal rectangular grid of pointy-top
    // hexes by using an offset coordinate system (q_offset, r_offset) and converting
    // it to a standard axial coordinate system (q, r). This "even-r" conversion
    // ensures that the underlying grid data is compatible with standard axial-based
    // neighbor calculations, fixing the bug where modifying a barrier affected a non-adjacent hex.
    for (let r_offset = 0; r_offset < height; r_offset++) {
        for (let q_offset = 0; q_offset < width; q_offset++) {
            const q = q_offset - Math.floor(r_offset / 2);
            const r = r_offset;
            hexesRaw.push({ q, r });
        }
    }
    
    if (hexesRaw.length === 0) return [];

    // Center the grid around (0,0) so that operations relative to the center work as expected.
    const qSum = hexesRaw.reduce((sum, h) => sum + h.q, 0);
    const rSum = hexesRaw.reduce((sum, h) => sum + h.r, 0);
    const qCenter = qSum / hexesRaw.length;
    const rCenter = rSum / hexesRaw.length;
    const qShift = Math.round(qCenter);
    const rShift = Math.round(rCenter);

    for (const h of hexesRaw) {
        const q = h.q - qShift;
        const r = h.r - rShift;
        const s = -q - r;
        hexes.push({ q, r, s, terrain: '', barrierEdges: [] });
    }
    
    return hexes;
}

function getRandomElement<T,>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getInitialTerrainMap(hexes: Hex[], options: GenerationOptions): Map<string, string> {
    const noiseGen = new PerlinNoise(1);
    if (hexes.length === 0) return new Map();

    let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
    hexes.forEach(h => {
        minQ = Math.min(minQ, h.q);
        maxQ = Math.max(maxQ, h.q);
        minR = Math.min(minR, h.r);
        maxR = Math.max(maxR, h.r);
    });
    const qRange = maxQ - minQ;
    const rRange = maxR - minR;
    const maxDimension = Math.max(qRange, rRange, 1);
    
    const roughnessScale = 1 + options.terrainRoughness * 9;
    
    const hexElevations: { hex: Hex, elevation: number }[] = hexes.map(hex => {
        const nx_p = hex.q * 0.1 * roughnessScale;
        const ny_p = hex.r * 0.1 * roughnessScale;
        let e = 0, freq = 1, amp = 1;
        for (let i = 0; i < 5; i++) {
            e += noiseGen.noise(nx_p * freq, ny_p * freq) * amp;
            freq *= 2;
            amp *= 0.5;
        }

        let e_mod = 0;
        if (options.highlandFormation !== 'random') {
            const centerX = (minQ + maxQ) / 2;
            const centerY = (minR + maxR) / 2;
            
            let nx = (hex.q - centerX) / (maxDimension / 2);
            let ny = (hex.r - centerY) / (maxDimension / 2);

            const angle = options.highlandFormationRotation * Math.PI / 180;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const rx = nx * cosA - ny * sinA;
            const ry = nx * sinA + ny * cosA;

            switch (options.highlandFormation) {
                case 'linear':
                    e_mod = -ry;
                    break;
                case 'circle':
                    const dist = Math.sqrt(rx * rx + ry * ry) / Math.sqrt(2);
                    e_mod = 1 - Math.min(1, dist);
                    break;
                case 'triangle':
                    const vA = {x: 0, y: -1};
                    const vB = {x: 1, y: 1};
                    const vC = {x: -1, y: 1};
                    const p = {x: rx, y: ry};

                    const sign = (p1: {x:number, y:number}, p2: {x:number, y:number}, p3: {x:number, y:number}) => 
                        (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);

                    const d1 = sign(p, vA, vB);
                    const d2 = sign(p, vB, vC);
                    const d3 = sign(p, vC, vA);

                    const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
                    const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
                    
                    if (!(has_neg && has_pos)) {
                        e_mod = 1;
                    }
                    break;
            }
            if (options.highlandFormationInverse && (options.highlandFormation === 'circle' || options.highlandFormation === 'triangle')) {
                e_mod = -e_mod;
            }
        }
        
        const formationEffect = e_mod * 1.5 * options.highlandFormationStrength;
        e += formationEffect;
        
        return { hex, elevation: e };
    });

    hexElevations.sort((a, b) => b.elevation - a.elevation);

    const initialTerrainMap = new Map<string, string>();
    const totalHexes = hexes.length;
    let currentIndex = 0;

    const terrainPlacementOrder = ['peaks', 'crags', 'hills', 'heath', 'forest', 'meadow', 'plain', 'glades', 'valley', 'marsh', 'bog', 'lakes'];
    
    const { terrainBiases } = options;
    let totalBias = Object.values(terrainBiases).reduce((sum, b) => sum + b, 0);
    
    if (totalBias === 0) {
        // Fallback: if all biases are zero, treat them all as 1.
        TERRAIN_TYPES.forEach(t => terrainBiases[t] = 1);
        totalBias = TERRAIN_TYPES.length;
    }
    
    const terrainsToPlace = Object.entries(terrainBiases)
        .filter(([, bias]) => bias > 0)
        .sort(([a], [b]) => terrainPlacementOrder.indexOf(a) - terrainPlacementOrder.indexOf(b));

    for (const [terrain, bias] of terrainsToPlace) {
        const percentage = (bias / totalBias) * 100;
        const numHexesForTerrain = Math.round((percentage / 100) * totalHexes);
        const endIndex = Math.min(currentIndex + numHexesForTerrain, totalHexes);
        for (let i = currentIndex; i < endIndex; i++) {
            const { hex } = hexElevations[i];
            initialTerrainMap.set(`${hex.q},${hex.r}`, terrain);
        }
        currentIndex = endIndex;
    }

    if (currentIndex < totalHexes && terrainsToPlace.length > 0) {
        const lastTerrain = terrainsToPlace[terrainsToPlace.length - 1][0];
        for (let i = currentIndex; i < totalHexes; i++) {
            const { hex } = hexElevations[i];
            initialTerrainMap.set(`${hex.q},${hex.r}`, lastTerrain);
        }
    }
    
    return initialTerrainMap;
}

function generateTerrain(hexes: Hex[], options: GenerationOptions): void {
  const initialTerrainMap = getInitialTerrainMap(hexes, options);
  hexes.forEach(hex => {
      hex.terrain = initialTerrainMap.get(`${hex.q},${hex.r}`) || 'plain';
  });

  const RELAXATION_PASSES = 4;
  const INITIAL_TERRAIN_WEIGHT = 1.5;
  const terrainTypes = Object.keys(options.terrainClusteringMatrix);
  let currentHexes = hexes.map(h => ({...h}));

  for (let i = 0; i < RELAXATION_PASSES; i++) {
    const nextHexes = currentHexes.map(h => ({...h}));
    const currentHexesMap = new Map(currentHexes.map(h => [`${h.q},${h.r}`, h]));

    for (const hex of nextHexes) {
      let bestTerrain = hex.terrain;
      let maxScore = -Infinity;

      for (const candidateTerrain of terrainTypes) {
        let score = 0;

        const neighborsCoords = getNeighbors(hex);
        for (const coords of neighborsCoords) {
          const neighbor = currentHexesMap.get(`${coords.q},${coords.r}`);
          if (neighbor) {
            score += options.terrainClusteringMatrix[candidateTerrain][neighbor.terrain] || 0;
          }
        }

        if (candidateTerrain === initialTerrainMap.get(`${hex.q},${hex.r}`)) {
          score += INITIAL_TERRAIN_WEIGHT;
        }

        if (score > maxScore) {
          maxScore = score;
          bestTerrain = candidateTerrain;
        }
      }
      hex.terrain = bestTerrain;
    }
    currentHexes = nextHexes;
  }

  const finalHexesMap = new Map(currentHexes.map(h => [`${h.q},${h.r}`, h]));
  hexes.forEach(originalHex => {
    const finalHex = finalHexesMap.get(`${originalHex.q},${originalHex.r}`);
    if (finalHex) {
      originalHex.terrain = finalHex.terrain;
    }
  });
}



function addBarriers(hexes: Hex[]): void {
  const totalEdges = hexes.length * 6;
  const numBarriers = Math.floor(totalEdges * BARRIER_CHANCE / 2); // Divide by 2 because each barrier is between two hexes

  for (let i = 0; i < numBarriers; i++) {
    const hex = getRandomElement(hexes);
    const edge = Math.floor(Math.random() * 6);
    if (!hex.barrierEdges.includes(edge)) {
        hex.barrierEdges.push(edge);

        // Add barrier to neighbor
        const neighborCoords = getNeighbors(hex)[edge];
        const neighborHex = hexes.find(h => h.q === neighborCoords.q && h.r === neighborCoords.r);
        if (neighborHex) {
            const oppositeEdge = (edge + 3) % 6;
             if (!neighborHex.barrierEdges.includes(oppositeEdge)) {
                neighborHex.barrierEdges.push(oppositeEdge);
             }
        }
    }
  }
}

function placeHoldings(hexes: Hex[], sizeForDensity: number, numHoldings: number): { q: number; r: number } {
    const validHexes = hexes.filter(h => !['peaks', 'crags', 'bog', 'lakes', 'marsh'].includes(h.terrain));
    let placedCount = 0;
    const placedHoldings: Hex[] = [];

    while (placedCount < numHoldings && validHexes.length > 0) {
        const index = Math.floor(Math.random() * validHexes.length);
        const hex = validHexes[index];
        
        const isTooClose = placedHoldings.some(h => getAxialDistance(h, hex) < sizeForDensity / 4);

        if (!hex.holding && !isTooClose) {
            hex.holding = getRandomElement(HOLDING_TYPES);
            placedHoldings.push(hex);
            placedCount++;
        }
        validHexes.splice(index, 1);
    }
    
    // Designate seat of power
    if (placedHoldings.length > 0) {
        const seatOfPower = placedHoldings[0];
        return {q: seatOfPower.q, r: seatOfPower.r};
    }
    
    // Fallback if no holdings could be placed
    const centerHex = hexes.find(h => h.q === 0 && h.r === 0) || hexes[0];
    if (centerHex) {
        centerHex.holding = 'castle';
        return { q: centerHex.q, r: centerHex.r };
    }

    return { q: 0, r: 0 };
}

function placeMyths(hexes: Hex[], numMyths: number, mythMinDistance: number): Myth[] {
    const featureHexes = hexes.filter(h => h.holding || h.landmark);
    let candidates = hexes.filter(h => !h.holding && !h.landmark);

    if (featureHexes.length > 0) {
        // Prioritize hexes that are most remote from existing holdings and landmarks.
        const candidatesWithDistances = candidates.map(candidate => ({
            hex: candidate,
            dist: Math.min(...featureHexes.map(f => getAxialDistance(candidate, f))),
        }));

        // Shuffle to randomize tie-breaking for hexes with the same remoteness.
        for (let i = candidatesWithDistances.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidatesWithDistances[i], candidatesWithDistances[j]] = [candidatesWithDistances[j], candidatesWithDistances[i]];
        }

        candidatesWithDistances.sort((a, b) => {
            // Primary sort: by distance to nearest feature, descending.
            if (b.dist !== a.dist) {
                return b.dist - a.dist;
            }
            // Secondary sort: if equally remote, prefer hexes further from center.
            return getAxialDistance({ q: 0, r: 0 }, b.hex) - getAxialDistance({ q: 0, r: 0 }, a.hex);
        });

        candidates = candidatesWithDistances.map(item => item.hex);

    } else {
        // Fallback: No features on map, so "remote" means far from the center (edge of map).
        // Shuffle candidates to introduce randomness in which of the equidistant hexes gets picked first.
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        // Then sort by distance from center, so we still prioritize the outer edge.
        candidates.sort((a, b) => getAxialDistance({ q: 0, r: 0 }, b) - getAxialDistance({ q: 0, r: 0 }, a));
    }


    const placedMyths: Hex[] = [];

    for (const candidate of candidates) {
        if (placedMyths.length >= numMyths) {
            break; // We've placed all required myths.
        }

        const isFarEnough = placedMyths.every(placed => getAxialDistance(candidate, placed) >= mythMinDistance);

        if (isFarEnough) {
            placedMyths.push(candidate);
        }
    }
    
    const myths: Myth[] = [];
    // Now that we have our final list, assign the myth IDs and create myth objects.
    placedMyths.forEach((hex, index) => {
        const mythId = index + 1;
        hex.myth = mythId;
        myths.push({
            id: mythId,
            name: `Myth #${mythId}`,
            q: hex.q,
            r: hex.r,
        });
    });

    return myths;
}


function placeLandmarks(hexes: Hex[], landmarkOptions: { [key: string]: number }): void {
    const validHexes = hexes.filter(h => !h.holding && !h.landmark);
    const landmarkTypes = Object.keys(landmarkOptions);

    // Shuffle types to avoid placement bias (e.g. 'dwelling' always getting placed first)
    landmarkTypes.sort(() => Math.random() - 0.5);

    for (const type of landmarkTypes) {
        const numToPlace = landmarkOptions[type] || 0;
        let placedCount = 0;
        
        while(placedCount < numToPlace && validHexes.length > 0) {
            const index = Math.floor(Math.random() * validHexes.length);
            const hex = validHexes[index];
            
            hex.landmark = type;
            placedCount++;
            
            // Remove the hex from the list so it can't be used again
            validHexes.splice(index, 1);
        }
    }
}


export function generateRealm(options: GenerateRealmOptions, genOptions: GenerationOptions): Realm {
  let hexes: Hex[];
  let sizeForDensity: number;
  let realmData: Partial<Realm> = { shape: options.shape };

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
  
  if (genOptions.generateBarriers) {
    addBarriers(hexes);
  }
  const seatOfPower = placeHoldings(hexes, sizeForDensity, genOptions.numHoldings);
  placeLandmarks(hexes, genOptions.landmarks);
  
  // Clear any previous myth data before placing new ones
  hexes.forEach(h => h.myth = undefined);
  const myths = placeMyths(hexes, genOptions.numMyths, genOptions.mythMinDistance);

  if (genOptions.numMyths > 0 && myths.length < genOptions.numMyths) {
    throw new Error(`Could not place all myths. Only placed ${myths.length} of ${genOptions.numMyths} requested. Try reducing the 'Myth Min Distance' or the number of myths.`);
  }
  
  return {
    ...realmData,
    hexes,
    myths,
    seatOfPower,
  } as Realm;
}
