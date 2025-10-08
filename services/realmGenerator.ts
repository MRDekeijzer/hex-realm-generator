
import type { Realm, Hex, GenerationOptions, Myth } from '../types';
// FIX: Import BARRIER_CHANCE to use it in the addBarriers function.
import { TERRAIN_TYPES, HOLDING_TYPES, BARRIER_CHANCE } from '../constants';
import { getAxialDistance, getNeighbors } from '../utils/hexUtils';

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

function generateTerrain(hexes: Hex[]): void {
    const unassigned = new Set(hexes);
    while (unassigned.size > 0) {
        const startHex = getRandomElement(Array.from(unassigned));
        const terrain = getRandomElement(TERRAIN_TYPES);
        const clusterSize = 12;
        let currentClusterSize = 0;
        const queue: Hex[] = [startHex];
        const visitedInCluster = new Set<Hex>([startHex]);

        while(queue.length > 0 && currentClusterSize < clusterSize) {
            const current = queue.shift()!;
            if (unassigned.has(current)) {
                current.terrain = terrain;
                unassigned.delete(current);
                currentClusterSize++;

                const neighbors = getNeighbors(current);
                const validNeighbors = hexes.filter(h => 
                    neighbors.some(n => n.q === h.q && n.r === h.r) && 
                    !visitedInCluster.has(h) &&
                    unassigned.has(h)
                );
                
                for(const neighbor of validNeighbors) {
                    if (!visitedInCluster.has(neighbor)) {
                        queue.push(neighbor);
                        visitedInCluster.add(neighbor);
                    }
                }
            }
        }
    }
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
    const validHexes = hexes.filter(h => h.terrain !== 'mountains' && h.terrain !== 'water');
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
  
  generateTerrain(hexes);
  // Water features would go here. For simplicity, I'm skipping complex river/lake generation.
  addBarriers(hexes);
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