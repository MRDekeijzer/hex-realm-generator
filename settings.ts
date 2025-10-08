// settings.ts

// Main Color Palette - The foundational colors for the entire application theme.
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

// UI Element Colors - Specific color assignments for various parts of the UI, derived from the main palette.
export const MYTH_COLOR = 'rgba(238, 206, 34, 0.8)'; // Corresponds to purpleHighlight with opacity, for myth circles.
export const BARRIER_COLOR = PALETTE.redHighlight;
export const SELECTION_COLOR = PALETTE.yellowHighlight;
export const SEAT_OF_POWER_COLOR = PALETTE.yellowHighlight;
export const HOLDING_ICON_BORDER_COLOR = PALETTE.darkOrange;
export const LANDMARK_ICON_BORDER_COLOR = PALETTE.lightBlue;

// Default Terrain Colors - A curated set of default colors for the various terrain types.
export const TERRAIN_COLORS = {
    forest: PALETTE.lightGreen,
    grassland: PALETTE.lightColorImage,
    hills: PALETTE.yellowDarkHighlight,
    mountains: PALETTE.darkerColorImage,
    swamp: PALETTE.darkerColorImage,
    water: PALETTE.lightBlue,
    river: PALETTE.lightBlue,
};
