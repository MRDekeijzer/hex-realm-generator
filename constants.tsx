/**
 * @file constants.tsx
 * This file contains all the static data and default configuration values for the application.
 * It is organized into sections for colors, application constants, and generation defaults.
 */
import type { TileSet, Tile, TerrainClusteringMatrix, GenerationOptions, SpraySettings } from './types';

// =================================================================================
// --- COLOR SETTINGS ---
// All application color constants are defined here for easy theming.
// =================================================================================

/**
 * The foundational color palette for the entire application theme.
 */
export const PALETTE = {
  columnBorders: '#41403f',
  textColor: '#221f21',
  lightColorImage: '#a7a984', // Used for valley, plain
  darkerColorImage: '#324446', // Used for marsh
  darkColorImage: '#18272e', // Used for crags, bog
  darkBackground: '#191f29',
  lightBackground: '#eaebec',
  purpleHighlight: '#55375d',
  yellowHighlight: '#736b23',
  orangeHighlight: '#8a661a',
  redHighlight: '#60131b',
  blueHighlight: '#435360',
  lightRedHighlight: '#692e2a',
  lightBlue: '#3f6e66', // Used for lakes
  yellowDarkHighlight: '#9d8940', // Used for hills
  lightGreen: '#777741', // Used for heath, forest
  lighterBlue: '#c5d2cb', // Used for glades
  darkOrange: '#813a28',
};

// ---------------------------------------------------------------------------------
// UI Element Colors
// Specific color assignments for various parts of the UI, derived from the main palette.
// ---------------------------------------------------------------------------------
export const MYTH_COLOR = 'rgba(238, 206, 34, 0.8)';
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
    marsh: PALETTE.darkerColorImage,
    heath: PALETTE.lightGreen,
    crags: PALETTE.darkColorImage,
    peaks: PALETTE.columnBorders,
    forest: PALETTE.lightGreen,
    valley: PALETTE.lightColorImage,
    hills: PALETTE.yellowDarkHighlight,
    meadow: PALETTE.lightBackground,
    bog: PALETTE.darkColorImage,
    lakes: PALETTE.lightBlue,
    glades: PALETTE.lighterBlue,
    plain: PALETTE.lightColorImage,
};


// =================================================================================
// --- APPLICATION CONSTANTS ---
// Core constants used for generation, UI, and game logic.
// =================================================================================

/** The default size (radius or width/height) for a new realm grid. */
export const DEFAULT_GRID_SIZE = 12;

/** A list of all standard terrain type IDs. */
export const TERRAIN_TYPES = ['marsh', 'heath', 'crags', 'peaks', 'forest', 'valley', 'hills', 'meadow', 'bog', 'lakes', 'glades', 'plain'];
/** The default order of terrain types from highest elevation to lowest. */
export const DEFAULT_TERRAIN_HEIGHT_ORDER = ['peaks', 'crags', 'hills', 'heath', 'forest', 'meadow', 'plain', 'glades', 'valley', 'marsh', 'bog', 'lakes'];

/** A list of all standard holding type IDs. */
export const HOLDING_TYPES = ['castle', 'city', 'town', 'village'];
/** A list of all standard landmark type IDs. */
export const LANDMARK_TYPES = ['dwelling', 'sanctum', 'monument', 'hazard', 'curse', 'ruins'];
/** The base probability for a barrier to be generated on any given hex edge. */
export const BARRIER_CHANCE = 1 / 6;

/** A master list of icons available for the Icon Spray feature. */
export const SPRAYABLE_ICONS = ['tree-pine', 'leaf', 'feather', 'flower', 'grass', 'sprout', 'shrub', 'triangle', 'waves', 'droplet', 'sun', 'wind', 'star', 'sparkle', 'cloud', 'rock', 'flag', 'snowflake', 'branch', 'river', 'path', 'wave-sine', 'chevron-up', 'skull', 'fish', 'tree-deciduous', 'sparkles'];

// ---------------------------------------------------------------------------------
// Icon Spray Mask Generation
// ---------------------------------------------------------------------------------
export const MASK_RESOLUTION = 5;
const createMask = (filter: (x: number, y: number) => boolean): number[] => {
    const mask: number[] = [];
    for (let y = 0; y < MASK_RESOLUTION; y++) {
        for (let x = 0; x < MASK_RESOLUTION; x++) {
            mask.push(filter(x, y) ? 1 : 0);
        }
    }
    return mask;
};
const center = Math.floor(MASK_RESOLUTION / 2);
export const centerMask = createMask((x, y) => Math.abs(x - center) <= 1 && Math.abs(y - center) <= 1);
export const edgeMask = createMask((x, y) => Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2)) > center * 0.7);
export const flowMask = createMask((x, y) => Math.abs(y - center) <= 1);
export const uniformMask = createMask(() => true);
// ---------------------------------------------------------------------------------

/** Default settings for the procedural icon spray. */
export const DEFAULT_SPRAY_SETTINGS: SpraySettings = {
  density: 3,
  sizeMin: 7,
  sizeMax: 9,
  opacityMin: 0.6,
  opacityMax: 0.8,
  color: '#221f21',
  placementMask: uniformMask,
};

/**
 * The default collection of all available tiles (terrain, holdings, landmarks),
 * including their labels, icons, and default colors.
 */
export const DEFAULT_TILE_SETS: TileSet = {
  terrain: [
    { id: 'marsh', label: 'Marsh', icon: 'droplet', color: TERRAIN_COLORS.marsh, sprayIcons: ['droplet', 'feather', 'waves'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 7, sizeMax: 9, placementMask: uniformMask } },
    { id: 'heath', label: 'Heath', icon: 'leaf', color: TERRAIN_COLORS.heath, sprayIcons: ['leaf', 'wind', 'flower'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 7, sizeMax: 9, placementMask: uniformMask } },
    { id: 'crags', label: 'Crags', icon: 'triangle', color: TERRAIN_COLORS.crags, sprayIcons: ['triangle', 'mountain', 'rock'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 4, sizeMin: 8, sizeMax: 10, placementMask: edgeMask } },
    { id: 'peaks', label: 'Peaks', icon: 'mountains', color: TERRAIN_COLORS.peaks, sprayIcons: ['triangle', 'flag', 'snowflake'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 9, sizeMax: 11, placementMask: edgeMask } },
    { id: 'forest', label: 'Forest', icon: 'trees', color: TERRAIN_COLORS.forest, sprayIcons: ['tree-pine', 'leaf', 'branch'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 4, sizeMin: 7, sizeMax: 9, placementMask: uniformMask } },
    { id: 'valley', label: 'Valley', icon: 'curve', color: TERRAIN_COLORS.valley, sprayIcons: ['river', 'path', 'leaf'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 7, sizeMax: 9, placementMask: flowMask } },
    { id: 'hills', label: 'Hills', icon: 'hill', color: TERRAIN_COLORS.hills, sprayIcons: ['wave-sine', 'chevron-up', 'rock'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 7, sizeMax: 9, placementMask: uniformMask } },
    { id: 'meadow', label: 'Meadow', icon: 'flower', color: TERRAIN_COLORS.meadow, sprayIcons: ['flower', 'sun', 'cloud'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 7, sizeMax: 9, placementMask: uniformMask } },
    { id: 'bog', label: 'Bog', icon: 'droplets', color: TERRAIN_COLORS.bog, sprayIcons: ['droplet', 'skull', 'feather'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 7, sizeMax: 9, placementMask: edgeMask } },
    { id: 'lakes', label: 'Lakes', icon: 'waves', color: TERRAIN_COLORS.lakes, sprayIcons: ['waves', 'droplet', 'fish'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 8, sizeMax: 10, placementMask: centerMask } },
    { id: 'glades', label: 'Glades', icon: 'sun', color: TERRAIN_COLORS.glades, sprayIcons: ['tree-deciduous', 'sparkles', 'sun'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 3, sizeMin: 7, sizeMax: 9, placementMask: centerMask } },
    { id: 'plain', label: 'Plain', icon: 'wind', color: TERRAIN_COLORS.plain, sprayIcons: ['wind', 'cloud', 'sun'], spraySettings: { ...DEFAULT_SPRAY_SETTINGS, density: 2, sizeMin: 6, sizeMax: 8, placementMask: centerMask } },
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

/** A special set of icons for use in the POI Painter tool that represent actions. */
export const SPECIAL_POI_ICONS: Tile[] = [
    { id: 'myth', label: 'Myth', icon: 'sparkle' },
    { id: 'seatOfPower', label: 'Seat of Power', icon: 'crown' }
];

/** An explicit mapping of terrain IDs to their default colors. */
export const DEFAULT_TERRAIN_COLORS: { [key: string]: string } = TERRAIN_COLORS;

// =================================================================================
// --- GENERATION DEFAULTS ---
// Default parameters for procedural realm generation.
// =================================================================================

const affinities = { self: 0.75, strong: 0.6, moderate: 0.4, weak: 0.2, none: 0.0 };
const matrix: TerrainClusteringMatrix = {};
TERRAIN_TYPES.forEach(t1 => {
  matrix[t1] = {};
  TERRAIN_TYPES.forEach(t2 => { matrix[t1][t2] = affinities.weak; });
  matrix[t1][t1] = affinities.self;
});
const applyAffinity = (t1: string, t2: string, level: number) => { if (matrix[t1] && matrix[t2]) { matrix[t1][t2] = level; matrix[t2][t1] = level; } };

// Define relationships between terrain types
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

/**
 * The default matrix defining how likely different terrain types are to cluster together.
 * Higher values (0 to 1) indicate a stronger affinity.
 */
export const DEFAULT_TERRAIN_CLUSTERING_MATRIX: TerrainClusteringMatrix = matrix;

/**
 * Logical groupings of terrain types used for highland formation.
 */
export const TERRAIN_CATEGORIES = {
    upland: ['peaks', 'crags', 'hills'],
    lowland: ['lakes', 'marsh', 'bog'],
    midland: ['plain', 'meadow', 'heath', 'valley', 'glades'],
    forest: ['forest']
};

/**
 * The default weights for each terrain type during generation. Higher numbers
 * increase the probability of that terrain appearing.
 */
export const DEFAULT_TERRAIN_BIASES: { [key: string]: number } = {
    marsh: 5, heath: 10, crags: 5, peaks: 5, forest: 15, valley: 5,
    hills: 15, meadow: 10, bog: 5, lakes: 5, glades: 5, plain: 10,
};

/**
 * A collection of preset templates for terrain generation settings.
 */
export const TERRAIN_TEMPLATES: { [key: string]: { name: string; options: Partial<GenerationOptions> }} = {
    balanced: {
        name: 'Balanced Realm',
        options: {
            highlandFormation: 'linear', highlandFormationStrength: 0.7, highlandFormationRotation: 0,
            terrainRoughness: 0.5, terrainBiases: { ...DEFAULT_TERRAIN_BIASES }
        }
    },
    jagged: {
        name: 'Jagged Peaks',
        options: {
            highlandFormation: 'circle', highlandFormationStrength: 1.0, highlandFormationRotation: 0,
            terrainRoughness: 0.8,
            terrainBiases: { marsh: 1, heath: 2, crags: 20, peaks: 25, forest: 5, valley: 3, hills: 20, meadow: 2, bog: 1, lakes: 1, glades: 2, plain: 5 }
        }
    },
    lush: {
        name: 'Lush Lowlands',
        options: {
            highlandFormation: 'linear', highlandFormationStrength: 0.5, highlandFormationRotation: 180,
            terrainRoughness: 0.25,
            terrainBiases: { marsh: 15, heath: 5, crags: 1, peaks: 1, forest: 25, valley: 10, hills: 5, meadow: 8, bog: 10, lakes: 10, glades: 8, plain: 12 }
        }
    },
    sunkenCaldera: {
        name: 'Sunken Caldera',
        options: {
            highlandFormation: 'circle', highlandFormationStrength: 1.0, highlandFormationInverse: true,
            terrainRoughness: 0.75,
            terrainBiases: { marsh: 5, heath: 2, crags: 20, peaks: 25, forest: 3, valley: 5, hills: 15, meadow: 1, bog: 10, lakes: 15, glades: 1, plain: 2 }
        }
    }
};