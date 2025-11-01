/**
 * @file realmPresets.ts
 * Defines curated generation and color presets used by the Realm Presets modal.
 * Each preset bundles together the settings necessary to quickly explore
 * different terrain vibes or visual treatments without diving into the full
 * settings UI.
 */

import type { GenerationOptions, ViewOptions, ExportSettings } from '@/features/realm/types';
import {
  LANDMARK_TYPES,
  TERRAIN_BASE_COLORS,
  DEFAULT_POI_ICON_COLOR,
  DEFAULT_POI_BACKDROP_COLOR,
  DEFAULT_MYTH_MARKER_FILL_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_COLOR,
  DEFAULT_MYTH_MARKER_BORDER_WIDTH,
  BARRIER_COLOR,
} from '@/features/realm/config/constants';
import { TERRAIN_TYPES } from '@/features/realm/config/constants';

/**
 * Helper to clone landmark counts while allowing targeted overrides.
 */
const _buildLandmarkCounts = (overrides: Partial<Record<string, number>> = {}) => {
  return LANDMARK_TYPES.reduce<Record<string, number>>((acc, type) => {
    acc[type] = overrides[type] ?? 3;
    return acc;
  }, {});
};

/**
 * Helper to create a terrain palette from an ordered list of hex colors.
 */
const buildTerrainPalette = (colors: string[]) => {
  return TERRAIN_TYPES.reduce<Record<string, string>>((acc, terrainId, index) => {
    acc[terrainId] = colors[index] ?? colors[colors.length - 1];
    return acc;
  }, {});
};

export interface GenerationPresetDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  details: string[];
  options: Partial<GenerationOptions>;
}

export interface ColorPresetDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  details: string[];
  terrainColors: Record<string, string>;
  viewOptions?: Partial<ViewOptions>;
  mythMarkerFillColor: string;
  mythMarkerBorderColor: string;
  mythMarkerBorderWidth: number;
  poiIconColor: string | null;
  poiBackdropColor: string | null;
  barrierColor: string;
  exportSettings?: Partial<ExportSettings>;
}

const highlandBiases = {
  marsh: 2,
  heath: 6,
  crags: 18,
  peaks: 24,
  forest: 6,
  valley: 4,
  hills: 18,
  meadow: 4,
  bog: 2,
  lakes: 3,
  glades: 4,
  plain: 5,
};

const mysticFenBiases = {
  marsh: 22,
  heath: 6,
  crags: 3,
  peaks: 2,
  forest: 12,
  valley: 8,
  hills: 4,
  meadow: 6,
  bog: 18,
  lakes: 15,
  glades: 8,
  plain: 4,
};

const crystallineBiases = {
  marsh: 4,
  heath: 6,
  crags: 16,
  peaks: 20,
  forest: 6,
  valley: 5,
  hills: 10,
  meadow: 6,
  bog: 3,
  lakes: 14,
  glades: 12,
  plain: 4,
};

const sunkenRuinsBiases = {
  marsh: 16,
  heath: 4,
  crags: 8,
  peaks: 6,
  forest: 6,
  valley: 8,
  hills: 5,
  meadow: 5,
  bog: 14,
  lakes: 18,
  glades: 6,
  plain: 4,
};

const duneSeaBiases = {
  marsh: 1,
  heath: 16,
  crags: 4,
  peaks: 2,
  forest: 4,
  valley: 12,
  hills: 12,
  meadow: 18,
  bog: 1,
  lakes: 2,
  glades: 8,
  plain: 20,
};

export const GENERATION_PRESETS: GenerationPresetDefinition[] = [
  {
    id: 'highland-helix',
    name: 'Highland Helix',
    icon: 'mountains',
    description: 'A windswept ridge-world where bastions cling to cliff sides.',
    details: [
      'Terrain bias: Peaks & crags surge while marshes all but vanish.',
      'Elevation: Twisting ridge spine with steep drop-offs.',
    ],
    options: {
      generateBarriers: false,
      highlandFormation: 'linear',
      highlandFormationStrength: 0.9,
      highlandFormationRotation: 45,
      terrainRoughness: 0.65,
      terrainBiases: highlandBiases,
    },
  },
  {
    id: 'mystic-fen',
    name: 'Mystic Fen',
    icon: 'droplets',
    description: 'A lantern-lit wetland riddled with hidden myths and mist.',
    details: [
      'Terrain bias: Marsh, bog, and lakes dominate the sprawl.',
      'Elevation: Low-lying pools with gentle transitions.',
    ],
    options: {
      generateBarriers: false,
      highlandFormation: 'circle',
      highlandFormationStrength: 0.4,
      highlandFormationRotation: 0,
      terrainRoughness: 0.35,
      terrainBiases: mysticFenBiases,
    },
  },
  {
    id: 'crystalline-expanse',
    name: 'Crystalline Expanse',
    icon: 'sparkle',
    description: 'Glacial peaks feed mirrored lakes and glittering glades.',
    details: [
      'Terrain bias: Cold peaks and reflective lakes share the map.',
      'Elevation: Faceted triangle bands with steady rises.',
    ],
    options: {
      generateBarriers: false,
      highlandFormation: 'triangle',
      highlandFormationStrength: 0.7,
      highlandFormationRotation: 15,
      terrainRoughness: 0.45,
      terrainBiases: crystallineBiases,
    },
  },
  {
    id: 'sunken-ruins',
    name: 'Sunken Ruins',
    icon: 'waves',
    description: 'Collapsed coasts circle a tidal heart filled with secrets.',
    details: [
      'Terrain bias: Lakes and bogs expand inward to a drowned core.',
      'Elevation: Inverted caldera with coastal escarpments.',
    ],
    options: {
      numHoldings: 4,
      numMyths: 6,
      mythMinDistance: 3,
      generateBarriers: false,
      highlandFormation: 'circle',
      highlandFormationStrength: 0.8,
      highlandFormationInverse: true,
      highlandFormationRotation: 0,
      terrainRoughness: 0.55,
      terrainBiases: sunkenRuinsBiases,
    },
  },
  {
    id: 'dune-nomads',
    name: 'Dune Nomads',
    icon: 'wind',
    description: 'Rolling steppe broken by dry valleys and stubborn outposts.',
    details: [
      'Terrain bias: Plains, meadows, and valleys overwhelm waterways.',
      'Elevation: Gentle waves of sand and scrub with rare peaks.',
    ],
    options: {
      numHoldings: 6,
      numMyths: 5,
      mythMinDistance: 3,
      generateBarriers: false,
      highlandFormation: 'linear',
      highlandFormationStrength: 0.35,
      highlandFormationRotation: 305,
      terrainRoughness: 0.3,
      terrainBiases: duneSeaBiases,
    },
  },
];

const whitePalette = buildTerrainPalette(['#ffffffff']);

export const COLOR_PRESETS: ColorPresetDefinition[] = [
  {
    id: 'full-spectrum',
    name: 'Full Spectrum',
    icon: 'sun',
    description: 'Standard color palette',
    details: [
      'Terrain uses project default hues.',
      'Landmarks keep standard icon and backdrop colours.',
    ],
    terrainColors: { ...TERRAIN_BASE_COLORS },
    viewOptions: {
      showIconSpray: true,
      showTerrainIcons: true,
      showGrid: true,
    },
    poiIconColor: DEFAULT_POI_ICON_COLOR,
    poiBackdropColor: DEFAULT_POI_BACKDROP_COLOR,
    mythMarkerFillColor: DEFAULT_MYTH_MARKER_FILL_COLOR,
    mythMarkerBorderColor: DEFAULT_MYTH_MARKER_BORDER_COLOR,
    mythMarkerBorderWidth: DEFAULT_MYTH_MARKER_BORDER_WIDTH,
    barrierColor: BARRIER_COLOR,
    exportSettings: {
      blackAndWhite: false,
    },
  },
  {
    id: 'landmark-spotlight',
    name: 'Landmark Spotlight',
    icon: 'flag',
    description: 'Black & white, with red highlights.',
    details: [
      'Terrain renders white.',
      'POI icons are displayed in bright red.',
      'Barriers use the same red for visual continuity.',
    ],
    terrainColors: whitePalette,
    viewOptions: {
      showIconSpray: false,
      showTerrainIcons: true,
      gridColor: 'rgba(255, 255, 255, 0.08)',
    },
    poiIconColor: '#f43735',
    poiBackdropColor: '#FFFFFF',
    mythMarkerFillColor: '#f43735',
    mythMarkerBorderColor: '#FFFFFF',
    mythMarkerBorderWidth: 1.5,
    barrierColor: '#f43735',
    exportSettings: {
      blackAndWhite: false,
    },
  },
  {
    id: 'black-and-white',
    name: 'Black & White',
    icon: 'moon',
    description: 'Black & white',
    details: ['Terrain renders white.', 'POI icons are displayed in black.'],
    terrainColors: whitePalette,
    viewOptions: {
      showIconSpray: false,
      showTerrainIcons: true,
      gridColor: 'rgba(255, 255, 255, 0.12)',
    },
    poiIconColor: '#000000',
    poiBackdropColor: '#ffffffff',
    mythMarkerFillColor: '#ffffffff',
    mythMarkerBorderColor: '#000000',
    mythMarkerBorderWidth: 1.25,
    barrierColor: '#000000',
    exportSettings: {
      blackAndWhite: true,
    },
  },
];
