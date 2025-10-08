
import type { TileSet, Tile, TerrainClusteringMatrix, GenerationOptions } from './types';

// =================================================================================
// --- COLOR SETTINGS ---
// All application color constants are defined here for easy theming.
// =================================================================================

// ---------------------------------------------------------------------------------
// Main Color Palette
// The foundational colors for the entire application theme.
// ---------------------------------------------------------------------------------
export const PALETTE = {
  columnBorders: '#41403f',
  textColor: '#221f21',
  lightColorImage: '#a7a984', // Used for grassland
  darkerColorImage: '#324446', // Used for mountains, swamp
  darkColorImage: '#18272e',
  darkBackground: '#191f29',
  lightBackground: '#eaebec',
  purpleHighlight: '#55375d',
  yellowHighlight: '#736b23',
  orangeHighlight: '#8a661a',
  redHighlight: '#60131b',
  blueHighlight: '#435360',
  lightRedHighlight: '#692e2a',
  lightBlue: '#3f6e66', // Used for water, river
  yellowDarkHighlight: '#9d8940', // Used for hills
  lightGreen: '#777741', // Used for forest
  lighterBlue: '#c5d2cb',
  darkOrange: '#813a28',
};

// ---------------------------------------------------------------------------------
// UI Element Colors
// Specific color assignments for various parts of the UI, derived from the main palette.
// ---------------------------------------------------------------------------------
export const MYTH_COLOR = 'rgba(238, 206, 34, 0.8)'; // Corresponds to purpleHighlight with opacity, for myth circles.
export const BARRIER_COLOR = PALETTE.redHighlight;
export const SELECTION_COLOR = PALETTE.yellowHighlight;
export const SEAT_OF_POWER_COLOR = 'rgba(238, 206, 34, 0.8)';
export const HOLDING_ICON_BORDER_COLOR = PALETTE.darkOrange;
export const LANDMARK_ICON_BORDER_COLOR = PALETTE.lightBlue;
export const DEFAULT_GRID_COLOR = 'rgba(234, 235, 236, 0.2)';
export const DEFAULT_GRID_WIDTH = 1;


// ---------------------------------------------------------------------------------
// Default Terrain Colors
// A curated set of default colors for the various terrain types.
// ---------------------------------------------------------------------------------
export const TERRAIN_COLORS = {
    marsh: '#324446',
    heath: '#777741',
    crags: '#18272e',
    peaks: '#41403f',
    forest: '#777741',
    valley: '#a7a984',
    hills: '#9d8940',
    meadow: '#eaebec',
    bog: '#18272e',
    lakes: '#3f6e66',
    glades: '#c5d2cb',
    plain: '#a7a984',
};


// =================================================================================
// --- APPLICATION CONSTANTS ---
// Core constants used for generation, UI, and game logic.
// =================================================================================

export const DEFAULT_GRID_SIZE = 12;

export const TERRAIN_TYPES = ['marsh', 'heath', 'crags', 'peaks', 'forest', 'valley', 'hills', 'meadow', 'bog', 'lakes', 'glades', 'plain'];
export const HOLDING_TYPES = ['castle', 'city', 'town', 'village'];
export const LANDMARK_TYPES = ['dwelling', 'sanctum', 'monument', 'hazard', 'curse', 'ruins'];
export const BARRIER_CHANCE = 1 / 6;

export const DEFAULT_TILE_SETS: TileSet = {
  terrain: [
    { id: 'marsh', label: 'Marsh', icon: 'droplet', color: TERRAIN_COLORS.marsh },
    { id: 'heath', label: 'Heath', icon: 'leaf', color: TERRAIN_COLORS.heath },
    { id: 'crags', label: 'Crags', icon: 'triangle', color: TERRAIN_COLORS.crags },
    { id: 'peaks', label: 'Peaks', icon: 'mountains', color: TERRAIN_COLORS.peaks },
    { id: 'forest', label: 'Forest', icon: 'trees', color: TERRAIN_COLORS.forest },
    { id: 'valley', label: 'Valley', icon: 'curve', color: TERRAIN_COLORS.valley },
    { id: 'hills', label: 'Hills', icon: 'hill', color: TERRAIN_COLORS.hills },
    { id: 'meadow', label: 'Meadow', icon: 'flower', color: TERRAIN_COLORS.meadow },
    { id: 'bog', label: 'Bog', icon: 'droplets', color: TERRAIN_COLORS.bog },
    { id: 'lakes', label: 'Lakes', icon: 'waves', color: TERRAIN_COLORS.lakes },
    { id: 'glades', label: 'Glades', icon: 'sun', color: TERRAIN_COLORS.glades },
    { id: 'plain', label: 'Plain', icon: 'wind', color: TERRAIN_COLORS.plain },
  ],
  holding: [
    { id: 'castle', label: 'Castle', icon: 'castle' },
    { id: 'city', label: 'City', icon: 'city' },
    { id: 'town', label: 'Town', icon: 'town' },
    { id: 'village', label: 'Village', icon: 'village' }
  ],
  landmark: [
    { id: 'dwelling', label: 'Dwelling', icon: 'dwelling' },
    { id: 'sanctum', label: 'Sanctum', icon: 'sanctum' },
    { id: 'monument', label: 'Monument', icon: 'monument' },
    { id: 'hazard', label: 'Hazard', icon: 'hazard' },
    { id: 'curse', label: 'Curse', icon: 'curse' },
    { id: 'ruins', label: 'Ruins', icon: 'ruins' }
  ],
};

export const SPECIAL_POI_ICONS: Tile[] = [
    { id: 'myth', label: 'Myth', icon: 'sparkle' },
    { id: 'seatOfPower', label: 'Seat of Power', icon: 'crown' }
];

export const DEFAULT_TERRAIN_COLORS: { [key: string]: string } = TERRAIN_COLORS;

const affinities = {
  self: 0.75,
  strong: 0.6,
  moderate: 0.4,
  weak: 0.2,
  none: 0.0,
};

const matrix: TerrainClusteringMatrix = {};
TERRAIN_TYPES.forEach(t1 => {
  matrix[t1] = {};
  TERRAIN_TYPES.forEach(t2 => {
    matrix[t1][t2] = affinities.weak;
  });
  matrix[t1][t1] = affinities.self;
});

const applyAffinity = (t1: string, t2: string, level: number) => {
    if (matrix[t1] && matrix[t2]) {
        matrix[t1][t2] = level;
        matrix[t2][t1] = level;
    }
};

applyAffinity('peaks', 'crags', affinities.strong);
applyAffinity('peaks', 'hills', affinities.moderate);
applyAffinity('crags', 'hills', affinities.strong);

applyAffinity('lakes', 'marsh', affinities.strong);
applyAffinity('lakes', 'bog', affinities.moderate);
applyAffinity('marsh', 'bog', affinities.strong);

applyAffinity('plain', 'meadow', affinities.strong);
applyAffinity('plain', 'heath', affinities.strong);
applyAffinity('plain', 'valley', affinities.moderate);
applyAffinity('meadow', 'glades', affinities.moderate);
applyAffinity('valley', 'hills', affinities.moderate);

applyAffinity('forest', 'hills', affinities.moderate);
applyAffinity('forest', 'glades', affinities.strong);
applyAffinity('forest', 'valley', affinities.moderate);

applyAffinity('hills', 'plain', affinities.moderate);
applyAffinity('hills', 'meadow', affinities.moderate);

applyAffinity('peaks', 'marsh', affinities.none);
applyAffinity('peaks', 'bog', affinities.none);
applyAffinity('peaks', 'lakes', affinities.none);
applyAffinity('crags', 'lakes', affinities.none);

export const DEFAULT_TERRAIN_CLUSTERING_MATRIX: TerrainClusteringMatrix = matrix;

export const TERRAIN_CATEGORIES = {
    upland: ['peaks', 'crags', 'hills'],
    lowland: ['lakes', 'marsh', 'bog'],
    midland: ['plain', 'meadow', 'heath', 'valley', 'glades'],
    forest: ['forest']
};

export const DEFAULT_TERRAIN_BIASES: { [key: string]: number } = {
    marsh: 5, heath: 10, crags: 5, peaks: 5, forest: 15, valley: 5,
    hills: 15, meadow: 10, bog: 5, lakes: 5, glades: 5, plain: 10,
};

export const TERRAIN_TEMPLATES: { [key: string]: { name: string; options: Partial<GenerationOptions> }} = {
    balanced: {
        name: 'Balanced Realm',
        options: {
            highlandFormation: 'linear',
            highlandFormationStrength: 0.7,
            highlandFormationRotation: 0,
            terrainRoughness: 0.5,
            terrainBiases: { ...DEFAULT_TERRAIN_BIASES }
        }
    },
    jagged: {
        name: 'Jagged Peaks',
        options: {
            highlandFormation: 'circle',
            highlandFormationStrength: 1.0,
            highlandFormationRotation: 0,
            terrainRoughness: 0.8,
            terrainBiases: {
                marsh: 1, heath: 2, crags: 20, peaks: 25, forest: 5, valley: 3,
                hills: 20, meadow: 2, bog: 1, lakes: 1, glades: 2, plain: 5,
            }
        }
    },
    lush: {
        name: 'Lush Lowlands',
        options: {
            highlandFormation: 'linear',
            highlandFormationStrength: 0.5,
            highlandFormationRotation: 180,
            terrainRoughness: 0.25,
            terrainBiases: {
                marsh: 15, heath: 5, crags: 1, peaks: 1, forest: 25, valley: 10,
                hills: 5, meadow: 8, bog: 10, lakes: 10, glades: 8, plain: 12,
            }
        }
    },
    sunkenCaldera: {
        name: 'Sunken Caldera',
        options: {
            highlandFormation: 'circle',
            highlandFormationStrength: 1.0,
            highlandFormationInverse: true,
            terrainRoughness: 0.75,
            terrainBiases: {
                marsh: 5, heath: 2, crags: 20, peaks: 25, forest: 3, valley: 5,
                hills: 15, meadow: 1, bog: 10, lakes: 15, glades: 1, plain: 2,
            }
        }
    }
};
