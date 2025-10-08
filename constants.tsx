import React from 'react';
import type { TileSet, Tile } from './types';
import { Icon } from './components/Icon';

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

// ---------------------------------------------------------------------------------
// Default Terrain Colors
// A curated set of default colors for the various terrain types.
// ---------------------------------------------------------------------------------
export const TERRAIN_COLORS = {
    forest: PALETTE.lightGreen,
    grassland: PALETTE.lightColorImage,
    hills: PALETTE.yellowDarkHighlight,
    mountains: PALETTE.darkerColorImage,
    swamp: PALETTE.darkerColorImage,
    water: PALETTE.lightBlue,
    river: PALETTE.lightBlue,
};


// =================================================================================
// --- APPLICATION CONSTANTS ---
// Core constants used for generation, UI, and game logic.
// =================================================================================

export const DEFAULT_GRID_SIZE = 12;

export const TERRAIN_TYPES = ['forest', 'grassland', 'hills', 'mountains', 'swamp'];
export const HOLDING_TYPES = ['castle', 'city', 'town', 'village'];
export const LANDMARK_TYPES = ['dwelling', 'sanctum', 'monument', 'hazard', 'curse', 'ruins'];
export const BARRIER_CHANCE = 1 / 6;

export const DEFAULT_TILE_SETS: TileSet = {
  terrain: [
    { id: 'forest', label: 'Forest', icon: (props) => <Icon name="tree" {...props} />, color: TERRAIN_COLORS.forest },
    { id: 'grassland', label: 'Grassland', icon: (props) => <Icon name="leaf" {...props} />, color: TERRAIN_COLORS.grassland },
    // FIX: Corrected typo in icon name from 'mountain' to "mountain"
    { id: 'hills', label: 'Hills', icon: (props) => <Icon name="mountain" {...props} />, color: TERRAIN_COLORS.hills },
    { id: 'mountains', label: 'Mountains', icon: (props) => <Icon name="mountain-range" {...props} />, color: TERRAIN_COLORS.mountains },
    { id: 'swamp', label: 'Swamp', icon: (props) => <Icon name="waves" {...props} />, color: TERRAIN_COLORS.swamp },
    { id: 'water', label: 'Water', icon: (props) => <Icon name="water" {...props} />, color: TERRAIN_COLORS.water },
    { id: 'river', label: 'River', icon: (props) => <Icon name="water" {...props} />, color: TERRAIN_COLORS.river }
  ],
  holding: [
    { id: 'castle', label: 'Castle', icon: 'assets/icons/castle.svg' },
    { id: 'city', label: 'City', icon: 'assets/icons/city.svg' },
    { id: 'town', label: 'Town', icon: 'assets/icons/town.svg' },
    { id: 'village', label: 'Village', icon: 'assets/icons/village.svg' }
  ],
  landmark: [
    { id: 'dwelling', label: 'Dwelling', icon: 'assets/icons/dwelling.svg' },
    { id: 'sanctum', label: 'Sanctum', icon: 'assets/icons/sanctum.svg' },
    { id: 'monument', label: 'Monument', icon: 'assets/icons/monument.svg' },
    { id: 'hazard', label: 'Hazard', icon: 'assets/icons/hazard.svg' },
    { id: 'curse', label: 'Curse', icon: 'assets/icons/curse.svg' },
    { id: 'ruins', label: 'Ruins', icon: 'assets/icons/ruins.svg' }
  ],
};

export const OVERLAY_ICONS: Tile[] = [
    { id: 'circle-star', label: 'Circle Star', icon: 'assets/icons/overlays/circle-star.svg' },
    { id: 'drafting-compass', label: 'Compass', icon: 'assets/icons/overlays/drafting-compass.svg' },
    { id: 'flame', label: 'Flame', icon: 'assets/icons/overlays/flame.svg' },
    { id: 'gem', label: 'Gem', icon: 'assets/icons/overlays/gem.svg' },
    { id: 'globe', label: 'Globe', icon: 'assets/icons/overlays/globe.svg' },
    { id: 'leaf', label: 'Leaf', icon: 'assets/icons/overlays/leaf.svg' },
    { id: 'leafy-green', label: 'Lush Leaf', icon: 'assets/icons/overlays/leafy-green.svg' },
    { id: 'map-pin', label: 'Map Pin', icon: 'assets/icons/overlays/map-pin.svg' },
    { id: 'shield-half', label: 'Shield', icon: 'assets/icons/overlays/shield-half.svg' },
    { id: 'sprout', label: 'Sprout', icon: 'assets/icons/overlays/sprout.svg' },
    { id: 'star', label: 'Star', icon: 'assets/icons/overlays/star.svg' },
    { id: 'wand-sparkles', label: 'Magic Wand', icon: 'assets/icons/overlays/wand-sparkles.svg' },
];

export const SPECIAL_POI_ICONS: Tile[] = [
    { id: 'myth', label: 'Myth', icon: 'assets/icons/sparkle.svg' },
    { id: 'seatOfPower', label: 'Seat of Power', icon: 'assets/icons/system/crown.svg' }
];

export const DEFAULT_TERRAIN_COLORS: { [key: string]: string } = TERRAIN_COLORS;