/**
 * @file constants.tsx
 * This file contains all the static data and default configuration values for the application.
 * It is organized into sections for colors, application constants, and generation defaults.
 */
import type {
  TileSet,
  Tile,
  TerrainClusteringMatrix,
  GenerationOptions,
  SpraySettings,
  KnightVisibilitySettings,
} from '../types/index.ts';
import { colorPalette, tailwindColorPalette } from '@/app/theme/colors';

const flattenedColors = tailwindColorPalette;

export const TERRAIN_BASE_COLORS: Record<string, string> = Object.fromEntries(
  Object.keys(colorPalette.terrain).map((terrainId) => [
    terrainId,
    flattenedColors[`terrain-${terrainId}-base`],
  ])
);

// ---------------------------------------------------------------------------------
// UI Element Colors
// Specific color assignments for various parts of the UI, derived from CSS variables.
// ---------------------------------------------------------------------------------
export const MYTH_COLOR = flattenedColors['mythic-myth-glow'];
export const BARRIER_COLOR = flattenedColors['actions-danger-base'];
export const SELECTION_COLOR = flattenedColors['actions-command-primary'];
export const SEAT_OF_POWER_COLOR = flattenedColors['mythic-seat-of-power'];
export const HOLDING_ICON_BORDER_COLOR = flattenedColors['border-holding-marker'];
export const LANDMARK_ICON_BORDER_COLOR = flattenedColors['border-landmark-marker'];
export const TEXT_INVERSE_COLOR = flattenedColors['text-inverse'];
export const TEXT_HIGH_CONTRAST_COLOR = flattenedColors['text-high-contrast'];
export const CARD_SURFACE_COLOR = flattenedColors['realm-card-surface'];
export const BORDER_PANEL_DIVIDER_COLOR = flattenedColors['border-panel-divider'];
export const COMMAND_PANEL_SURFACE_COLOR = flattenedColors['realm-command-panel-surface'];
export const SUCCESS_HIGHLIGHT_COLOR = flattenedColors['feedback-success-highlight'];
export const DEFAULT_GRID_COLOR = 'rgba(234, 235, 236, 0.2)';
export const DEFAULT_GRID_WIDTH = 1;
export const DEFAULT_VIEW_VISIBILITY: KnightVisibilitySettings = {
  holdings: {},
  seatOfPower: true,
  landmarks: {},
  myths: {},
  showBarriers: false,
};

// =================================================================================
// --- APPLICATION CONSTANTS ---
// Core constants used for generation, UI, and game logic.
// =================================================================================

/** The default size (radius or width/height) for a new realm grid. */
export const DEFAULT_GRID_SIZE = 12;

/** A list of all standard terrain type IDs. */
export const TERRAIN_TYPES = [
  'marsh',
  'heath',
  'crags',
  'peaks',
  'forest',
  'valley',
  'hills',
  'meadow',
  'bog',
  'lakes',
  'glades',
  'plain',
];
/** The default order of terrain types from highest elevation to lowest. */
export const DEFAULT_TERRAIN_HEIGHT_ORDER = [
  'peaks',
  'crags',
  'hills',
  'heath',
  'forest',
  'meadow',
  'plain',
  'glades',
  'valley',
  'marsh',
  'bog',
  'lakes',
];

/** A list of all standard holding type IDs. */
export const HOLDING_TYPES = ['castle', 'city', 'town', 'village'];
/** A list of all standard landmark type IDs. */
export const LANDMARK_TYPES = ['dwelling', 'sanctum', 'monument', 'hazard', 'curse', 'ruins'];
/** The base probability for a barrier to be generated on any given hex edge. */
export const BARRIER_CHANCE = 1 / 6;

/** A master list of icons available for the Icon Spray feature. */
export const SPRAYABLE_ICONS = [
  'tree-pine',
  'leaf',
  'feather',
  'flower',
  'grass',
  'sprout',
  'shrub',
  'triangle',
  'waves',
  'droplet',
  'sun',
  'wind',
  'star',
  'sparkle',
  'cloud',
  'rock',
  'flag',
  'snowflake',
  'branch',
  'river',
  'path',
  'wave-sine',
  'chevron-up',
  'skull',
  'fish',
  'tree-deciduous',
  'sparkles',
];

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
export const centerMask = createMask(
  (x, y) => Math.abs(x - center) <= 1 && Math.abs(y - center) <= 1
);
export const edgeMask = createMask(
  (x, y) => Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2)) > center * 0.7
);
export const flowMask = createMask((x, y) => Math.abs(y - center) <= 1);
export const uniformMask = createMask(() => true);

interface TerrainSprayPreset {
  icons: string[];
  settings: Partial<SpraySettings>;
}

export const TERRAIN_SPRAY_DEFAULTS: Record<string, TerrainSprayPreset> = {
  marsh: {
    icons: ['droplet', 'feather', 'waves'],
    settings: {
      mode: 'random',
      density: 5,
      sizeMin: 10,
      sizeMax: 14,
      opacityMin: 0.75,
      opacityMax: 0.95,
      color: 'text-high-contrast',
      placementMask: uniformMask,
      centerBias: 0.1,
      minSeparation: 5,
      scaleVariance: 0.5,
    },
  },
  heath: {
    icons: ['leaf', 'grass', 'wind'],
    settings: {
      density: 3,
      sizeMin: 10,
      sizeMax: 12,
      opacityMin: 0.55,
      opacityMax: 0.85,
      color: 'text-inverse',
      placementMask: uniformMask,
      centerBias: 0.05,
      minSeparation: 8,
      scaleVariance: 0.35,
    },
  },
  crags: {
    icons: ['triangle', 'rock', 'flag'],
    settings: {
      mode: 'grid',
      sizeMin: 12,
      sizeMax: 16,
      opacityMin: 0.8,
      opacityMax: 0.9,
      color: 'text-high-contrast',
      placementMask: edgeMask,
      gridDensity: 3,
      gridSize: 0.85,
      gridJitter: 0.15,
      gridBaseRotation: -20,
      gridRotationRange: 8,
      iconBaseRotation: -5,
      scaleVariance: 0.25,
    },
  },
  peaks: {
    icons: ['triangle', 'flag', 'snowflake'],
    settings: {
      mode: 'grid',
      sizeMin: 14,
      sizeMax: 18,
      opacityMin: 0.75,
      opacityMax: 0.95,
      color: 'text-high-contrast',
      placementMask: edgeMask,
      gridDensity: 2,
      gridSize: 0.9,
      gridJitter: 0.05,
      gridBaseRotation: 12,
      gridRotationRange: 12,
      iconBaseRotation: 0,
      scaleVariance: 0.2,
    },
  },
  forest: {
    icons: ['tree-pine', 'leaf', 'branch'],
    settings: {
      density: 6,
      sizeMin: 11,
      sizeMax: 13,
      opacityMin: 0.85,
      opacityMax: 1,
      color: 'text-inverse',
      placementMask: uniformMask,
      centerBias: 0.2,
      minSeparation: 5,
      scaleVariance: 0.45,
    },
  },
  valley: {
    icons: ['river', 'path', 'sprout'],
    settings: {
      density: 3,
      sizeMin: 10,
      sizeMax: 12,
      opacityMin: 0.65,
      opacityMax: 0.85,
      color: 'text-inverse',
      placementMask: flowMask,
      centerBias: 0.4,
      minSeparation: 6,
      scaleVariance: 0.4,
    },
  },
  hills: {
    icons: ['wave-sine', 'chevron-up', 'rock'],
    settings: {
      density: 3,
      sizeMin: 11,
      sizeMax: 14,
      opacityMin: 0.7,
      opacityMax: 0.9,
      color: 'text-inverse',
      placementMask: uniformMask,
      centerBias: 0.15,
      minSeparation: 7,
      scaleVariance: 0.35,
    },
  },
  meadow: {
    icons: ['flower', 'grass', 'sun'],
    settings: {
      density: 2,
      sizeMin: 12,
      sizeMax: 14,
      opacityMin: 0.55,
      opacityMax: 0.75,
      color: 'text-inverse',
      placementMask: centerMask,
      centerBias: 0.3,
      minSeparation: 10,
      scaleVariance: 0.4,
    },
  },
  bog: {
    icons: ['droplet', 'skull', 'feather'],
    settings: {
      density: 4,
      sizeMin: 10,
      sizeMax: 13,
      opacityMin: 0.6,
      opacityMax: 0.85,
      color: 'text-high-contrast',
      placementMask: edgeMask,
      centerBias: 0.05,
      minSeparation: 6,
      scaleVariance: 0.45,
    },
  },
  lakes: {
    icons: ['waves', 'droplet', 'fish'],
    settings: {
      mode: 'grid',
      density: 3,
      sizeMin: 12,
      sizeMax: 16,
      opacityMin: 0.55,
      opacityMax: 0.75,
      color: 'text-high-contrast',
      placementMask: centerMask,
      gridDensity: 3,
      gridSize: 0.8,
      gridJitter: 0.1,
      gridBaseRotation: 0,
      gridRotationRange: 6,
      iconBaseRotation: 0,
      scaleVariance: 0.3,
    },
  },
  glades: {
    icons: ['tree-deciduous', 'sparkles', 'sun'],
    settings: {
      mode: 'grid',
      density: 3,
      sizeMin: 11,
      sizeMax: 13,
      opacityMin: 0.65,
      opacityMax: 0.85,
      color: 'text-inverse',
      placementMask: centerMask,
      gridDensity: 3,
      gridSize: 0.7,
      gridJitter: 0.2,
      gridBaseRotation: 0,
      gridRotationRange: 10,
      iconBaseRotation: 0,
      centerBias: 0.2,
      scaleVariance: 0.35,
    },
  },
  plain: {
    icons: ['wind', 'cloud', 'grass'],
    settings: {
      density: 2,
      sizeMin: 10,
      sizeMax: 12,
      opacityMin: 0.5,
      opacityMax: 0.7,
      color: 'text-inverse',
      placementMask: centerMask,
      centerBias: 0.2,
      minSeparation: 12,
      scaleVariance: 0.3,
    },
  },
} as const;
// ---------------------------------------------------------------------------------

/** Default settings for the procedural icon spray. */
export const DEFAULT_SPRAY_SETTINGS: SpraySettings = {
  mode: 'random',
  density: 3,
  sizeMin: 10,
  sizeMax: 10,
  opacityMin: 1,
  opacityMax: 1,
  color: flattenedColors['text-inverse'],
  placementMask: uniformMask,
  centerBias: 0,
  minSeparation: 0,
  gridDensity: 3,
  gridSize: 0.75,
  gridJitter: 0.1,
  gridBaseRotation: 0,
  scaleVariance: 0.4,
  gridRotationRange: 20,
  iconBaseRotation: 0,
  seedOffset: 0,
};

/**
 * The default collection of all available tiles (terrain, holdings, landmarks),
 * including their labels, icons, and default colors.
 */
export const DEFAULT_TILE_SETS: TileSet = {
  terrain: [
    {
      id: 'marsh',
      label: 'Marsh',
      icon: 'droplet',
      color: TERRAIN_BASE_COLORS.marsh,
      description:
        'Sodden lowlands thick with reeds and standing water. Travel is slow, but the damp earth hides secrets and strange wildlife.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.marsh.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.marsh.settings,
      },
    },
    {
      id: 'heath',
      label: 'Heath',
      icon: 'leaf',
      color: TERRAIN_BASE_COLORS.heath,
      description:
        'Open scrubland swept by relentless winds and hardy brush. A liminal place where travelers can see danger coming from afar.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.heath.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.heath.settings,
      },
    },
    {
      id: 'crags',
      label: 'Crags',
      icon: 'triangle',
      color: TERRAIN_BASE_COLORS.crags,
      description:
        'Jagged highlands broken into cliffs of bare stone. Treacherous footing rewards climbers with stunning vantage points.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.crags.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.crags.settings,
      },
    },
    {
      id: 'peaks',
      label: 'Peaks',
      icon: 'mountains',
      color: TERRAIN_BASE_COLORS.peaks,
      description:
        'Towering mountain summits often crowned with snow. Thin air and frigid winds shelter ancient shrines and nesting wyverns.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.peaks.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.peaks.settings,
      },
    },
    {
      id: 'forest',
      label: 'Forest',
      icon: 'trees',
      color: TERRAIN_BASE_COLORS.forest,
      description:
        'Dense woodland of towering trunks and tangled undergrowth. Sunlight filters through the canopy, alive with birdsong and hidden paths.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.forest.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.forest.settings,
      },
    },
    {
      id: 'valley',
      label: 'Valley',
      icon: 'curve',
      color: TERRAIN_BASE_COLORS.valley,
      description:
        'Sheltered lowlands carved by rivers and gentle slopes. Trade roads follow the water, drawing settlements and fertile farms.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.valley.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.valley.settings,
      },
    },
    {
      id: 'hills',
      label: 'Hills',
      icon: 'hill',
      color: TERRAIN_BASE_COLORS.hills,
      description:
        'Rolling uplands of ridgelines and wind-swept rises. Shepherds and watchtowers cling to the heights to guard the realm.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.hills.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.hills.settings,
      },
    },
    {
      id: 'meadow',
      label: 'Meadow',
      icon: 'flower',
      color: TERRAIN_BASE_COLORS.meadow,
      description:
        'Lush grasslands dotted with bright wildflowers. Ideal for foraging and grazing, these fields invite festivals in the warm months.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.meadow.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.meadow.settings,
      },
    },
    {
      id: 'bog',
      label: 'Bog',
      icon: 'droplets',
      color: TERRAIN_BASE_COLORS.bog,
      description:
        'Peat-choked wetlands that cling to unwary travelers. Lantern lights drift across the mist, not all of them friendly.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.bog.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.bog.settings,
      },
    },
    {
      id: 'lakes',
      label: 'Lakes',
      icon: 'waves',
      color: TERRAIN_BASE_COLORS.lakes,
      description:
        'Deep inland waters fed by streams and hidden springs. Fisherfolk ply their trade while legends speak of things beneath the surface.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.lakes.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.lakes.settings,
      },
    },
    {
      id: 'glades',
      label: 'Glades',
      icon: 'sun',
      color: TERRAIN_BASE_COLORS.glades,
      description:
        'Sunlit clearings cradled within surrounding trees. Sacred stones and hidden gatherings are said to appear under moonlight.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.glades.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.glades.settings,
      },
    },
    {
      id: 'plain',
      label: 'Plain',
      icon: 'wind',
      color: TERRAIN_BASE_COLORS.plain,
      description:
        'Wide, open flatlands stretching toward distant horizons. Armies march here, but so do caravans and migrating herds.',
      sprayIcons: [...TERRAIN_SPRAY_DEFAULTS.plain.icons],
      spraySettings: {
        ...DEFAULT_SPRAY_SETTINGS,
        ...TERRAIN_SPRAY_DEFAULTS.plain.settings,
      },
    },
  ],
  holding: [
    { id: 'castle', label: 'Castle', icon: 'castle' },
    { id: 'city', label: 'City', icon: 'city' },
    { id: 'town', label: 'Town', icon: 'town' },
    { id: 'village', label: 'Village', icon: 'village' },
  ],
  landmark: [
    { id: 'dwelling', label: 'Dwelling', icon: 'dwelling' },
    { id: 'sanctum', label: 'Sanctum', icon: 'sanctum' },
    { id: 'monument', label: 'Monument', icon: 'monument' },
    { id: 'hazard', label: 'Hazard', icon: 'hazard' },
    { id: 'curse', label: 'Curse', icon: 'curse' },
    { id: 'ruins', label: 'Ruins', icon: 'ruins' },
  ],
};

/** A special set of icons for use in the POI Painter tool that represent actions. */
export const SPECIAL_POI_ICONS: Tile[] = [
  { id: 'myth', label: 'Myth', icon: 'sparkle' },
  { id: 'seatOfPower', label: 'Seat of Power', icon: 'crown' },
];

// =================================================================================
// --- GENERATION DEFAULTS ---
// Default parameters for procedural realm generation.
// =================================================================================

const affinities = { self: 0.75, strong: 0.6, moderate: 0.4, weak: 0.2, none: 0.0 };
const matrix: TerrainClusteringMatrix = {};
TERRAIN_TYPES.forEach((t1) => {
  matrix[t1] = {};
  TERRAIN_TYPES.forEach((t2) => {
    const t1Matrix = matrix[t1];
    if (t1Matrix) t1Matrix[t2] = affinities.weak;
  });
  const t1Matrix = matrix[t1];
  if (t1Matrix) t1Matrix[t1] = affinities.self;
});
const applyAffinity = (t1: string, t2: string, level: number) => {
  const t1Matrix = matrix[t1];
  const t2Matrix = matrix[t2];
  if (t1Matrix && t2Matrix) {
    t1Matrix[t2] = level;
    t2Matrix[t1] = level;
  }
};

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
  forest: ['forest'],
};

/**
 * The default weights for each terrain type during generation. Higher numbers
 * increase the probability of that terrain appearing.
 */
export const DEFAULT_TERRAIN_BIASES: Record<string, number> = {
  marsh: 5,
  heath: 10,
  crags: 5,
  peaks: 5,
  forest: 15,
  valley: 5,
  hills: 15,
  meadow: 10,
  bog: 5,
  lakes: 5,
  glades: 5,
  plain: 10,
};

/**
 * A collection of preset templates for terrain generation settings.
 */
export const TERRAIN_TEMPLATES: Record<
  string,
  { name: string; options: Partial<GenerationOptions> }
> = {
  balanced: {
    name: 'Balanced Realm',
    options: {
      highlandFormation: 'linear',
      highlandFormationStrength: 0.7,
      highlandFormationRotation: 0,
      terrainRoughness: 0.5,
      terrainBiases: { ...DEFAULT_TERRAIN_BIASES },
    },
  },
  jagged: {
    name: 'Jagged Peaks',
    options: {
      highlandFormation: 'circle',
      highlandFormationStrength: 1.0,
      highlandFormationRotation: 0,
      terrainRoughness: 0.8,
      terrainBiases: {
        marsh: 1,
        heath: 2,
        crags: 20,
        peaks: 25,
        forest: 5,
        valley: 3,
        hills: 20,
        meadow: 2,
        bog: 1,
        lakes: 1,
        glades: 2,
        plain: 5,
      },
    },
  },
  lush: {
    name: 'Lush Lowlands',
    options: {
      highlandFormation: 'linear',
      highlandFormationStrength: 0.5,
      highlandFormationRotation: 180,
      terrainRoughness: 0.25,
      terrainBiases: {
        marsh: 15,
        heath: 5,
        crags: 1,
        peaks: 1,
        forest: 25,
        valley: 10,
        hills: 5,
        meadow: 8,
        bog: 10,
        lakes: 10,
        glades: 8,
        plain: 12,
      },
    },
  },
  sunkenCaldera: {
    name: 'Sunken Caldera',
    options: {
      highlandFormation: 'circle',
      highlandFormationStrength: 1.0,
      highlandFormationInverse: true,
      terrainRoughness: 0.75,
      terrainBiases: {
        marsh: 5,
        heath: 2,
        crags: 20,
        peaks: 25,
        forest: 3,
        valley: 5,
        hills: 15,
        meadow: 1,
        bog: 10,
        lakes: 15,
        glades: 1,
        plain: 2,
      },
    },
  },
};
