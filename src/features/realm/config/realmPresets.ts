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
  BARRIER_COLOR,
} from '@/features/realm/config/constants';
import { TERRAIN_TYPES } from '@/features/realm/config/constants';

/**
 * Helper to clone landmark counts while allowing targeted overrides.
 */
const buildLandmarkCounts = (overrides: Partial<Record<string, number>> = {}) => {
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
      'Population: Sparse strongholds with longer myth distances.',
    ],
    options: {
      numHoldings: 3,
      numMyths: 5,
      mythMinDistance: 4,
      generateBarriers: false,
      highlandFormation: 'linear',
      highlandFormationStrength: 0.9,
      highlandFormationRotation: 45,
      terrainRoughness: 0.65,
      terrainBiases: highlandBiases,
      landmarks: buildLandmarkCounts({ ruins: 4, monument: 4, hazard: 2 }),
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
      'Population: Plenty of myths; curses and hazards abound.',
    ],
    options: {
      numHoldings: 4,
      numMyths: 7,
      mythMinDistance: 3,
      generateBarriers: false,
      highlandFormation: 'circle',
      highlandFormationStrength: 0.4,
      highlandFormationRotation: 0,
      terrainRoughness: 0.35,
      terrainBiases: mysticFenBiases,
      landmarks: buildLandmarkCounts({ curse: 4, hazard: 4, sanctum: 2 }),
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
      'Population: Holdings travel with trade routes; myths are rarer.',
    ],
    options: {
      numHoldings: 5,
      numMyths: 4,
      mythMinDistance: 5,
      generateBarriers: false,
      highlandFormation: 'triangle',
      highlandFormationStrength: 0.7,
      highlandFormationRotation: 15,
      terrainRoughness: 0.45,
      terrainBiases: crystallineBiases,
      landmarks: buildLandmarkCounts({ monument: 5, sanctum: 4, ruins: 2 }),
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
      'Population: Relics everywhere—expect ruins and myths.',
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
      landmarks: buildLandmarkCounts({ ruins: 5, curse: 3, monument: 2 }),
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
      'Population: Holdings cluster around scarce oases.',
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
      landmarks: buildLandmarkCounts({ monument: 3, hazard: 3, sanctum: 1 }),
    },
  },
];

const whitePalette = buildTerrainPalette([
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
  '#ffffffff',
]);

export const COLOR_PRESETS: ColorPresetDefinition[] = [
  {
    id: 'full-spectrum',
    name: 'Full Spectrum',
    icon: 'sun',
    description: 'The vibrant baseline palette—great for exploring new seeds.',
    details: [
      'Keeps the default terrain hues and spray accents.',
      'Landmarks use warm gold backdrops for quick reads.',
      'Exports stay in full colour.',
    ],
    terrainColors: { ...TERRAIN_BASE_COLORS },
    viewOptions: {
      showIconSpray: true,
      showTerrainIcons: true,
      showGrid: true,
    },
    poiIconColor: DEFAULT_POI_ICON_COLOR,
    poiBackdropColor: DEFAULT_POI_BACKDROP_COLOR,
    barrierColor: BARRIER_COLOR,
    exportSettings: {
      blackAndWhite: false,
    },
  },
  {
    id: 'landmark-spotlight',
    name: 'Landmark Spotlight',
    icon: 'flag',
    description: 'Moody grayscale terrain with landmarks screaming signal red.',
    details: [
      'Restrained grayscale map keeps terrain readable but subtle.',
      'Landmark icons flip to crimson with bright white halos.',
      'Great for printing handouts with dramatic focal points.',
    ],
    terrainColors: whitePalette,
    viewOptions: {
      showIconSpray: false,
      showTerrainIcons: true,
      gridColor: 'rgba(255, 255, 255, 0.08)',
    },
    poiIconColor: '#f43735',
    poiBackdropColor: '#FFFFFF',
    barrierColor: '#f43735',
    exportSettings: {
      blackAndWhite: false,
    },
  },
  {
    id: 'black-and-white',
    name: 'Black & White',
    icon: 'moon',
    description: 'Hi-contrast black and white for zines, risographs, and print.',
    details: [
      'Terrain collapses to deep charcoal banding.',
      'Landmarks and holdings render in stark monochrome.',
      'Exports default to black & white for quick printouts.',
    ],
    terrainColors: whitePalette,
    viewOptions: {
      showIconSpray: false,
      showTerrainIcons: true,
      gridColor: 'rgba(255, 255, 255, 0.12)',
    },
    poiIconColor: '#000000',
    poiBackdropColor: '#ffffffff',
    barrierColor: '#000000',
    exportSettings: {
      blackAndWhite: true,
    },
  },
];
