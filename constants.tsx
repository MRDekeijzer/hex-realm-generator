
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
    { id: 'marsh', label: 'Marsh', icon: (props) => <Icon name="waves" {...props} />, color: TERRAIN_COLORS.marsh },
    { id: 'heath', label: 'Heath', icon: (props) => <Icon name="leaf" {...props} />, color: TERRAIN_COLORS.heath },
    { id: 'crags', label: 'Crags', icon: (props) => <Icon name="mountain" {...props} />, color: TERRAIN_COLORS.crags },
    { id: 'peaks', label: 'Peaks', icon: (props) => <Icon name="mountain-range" {...props} />, color: TERRAIN_COLORS.peaks },
    { id: 'forest', label: 'Forest', icon: (props) => <Icon name="tree" {...props} />, color: TERRAIN_COLORS.forest },
    { id: 'valley', label: 'Valley', icon: (props) => <Icon name="leaf" {...props} />, color: TERRAIN_COLORS.valley },
    { id: 'hills', label: 'Hills', icon: (props) => <Icon name="mountain" {...props} />, color: TERRAIN_COLORS.hills },
    { id: 'meadow', label: 'Meadow', icon: (props) => <Icon name="leaf" {...props} />, color: TERRAIN_COLORS.meadow },
    { id: 'bog', label: 'Bog', icon: (props) => <Icon name="waves" {...props} />, color: TERRAIN_COLORS.bog },
    { id: 'lakes', label: 'Lakes', icon: (props) => <Icon name="water" {...props} />, color: TERRAIN_COLORS.lakes },
    { id: 'glades', label: 'Glades', icon: (props) => <Icon name="leaf" {...props} />, color: TERRAIN_COLORS.glades },
    { id: 'plain', label: 'Plain', icon: (props) => <Icon name="leaf" {...props} />, color: TERRAIN_COLORS.plain },
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

export const SPECIAL_POI_ICONS: Tile[] = [
    { id: 'myth', label: 'Myth', icon: 'assets/icons/sparkle.svg' },
    { id: 'seatOfPower', label: 'Seat of Power', icon: 'assets/icons/system/crown.svg' }
];

export const DEFAULT_TERRAIN_COLORS: { [key: string]: string } = TERRAIN_COLORS;
