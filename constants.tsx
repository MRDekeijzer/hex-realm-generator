import React from 'react';
import type { TileSet, Tile } from './types';
import { Icon } from './components/Icon';

export const DEFAULT_GRID_SIZE = 12;

export const TERRAIN_TYPES = ['forest', 'grassland', 'hills', 'mountains', 'swamp'];
export const HOLDING_TYPES = ['castle', 'city', 'town', 'village'];
export const LANDMARK_TYPES = ['dwelling', 'sanctum', 'monument', 'hazard', 'curse', 'ruins'];
export const BARRIER_CHANCE = 1 / 6;

export const TILE_SETS: TileSet = {
  terrain: [
    { id: 'forest', label: 'Forest', icon: (props) => <Icon name="tree" {...props} />, color: '#228B22' },
    { id: 'grassland', label: 'Grassland', icon: (props) => <Icon name="leaf" {...props} />, color: '#90EE90' },
    // FIX: Corrected typo in icon name from 'mountain' to "mountain"
    { id: 'hills', label: 'Hills', icon: (props) => <Icon name="mountain" {...props} />, color: '#D2B48C' },
    { id: 'mountains', label: 'Mountains', icon: (props) => <Icon name="mountain-range" {...props} />, color: '#A9A9A9' },
    { id: 'swamp', label: 'Swamp', icon: (props) => <Icon name="waves" {...props} />, color: '#556B2F' },
    { id: 'water', label: 'Water', icon: (props) => <Icon name="water" {...props} />, color: '#4682B4' },
    { id: 'river', label: 'River', icon: (props) => <Icon name="water" {...props} />, color: '#4682B4' }
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

export const TERRAIN_COLORS: { [key: string]: string } = TILE_SETS.terrain.reduce((acc, t) => {
  if (t.color) acc[t.id] = t.color;
  return acc;
}, {} as { [key: string]: string });

export const MYTH_COLOR = 'rgba(255, 215, 0, 0.8)';
export const BARRIER_COLOR = '#DC2626';
export const SEAT_OF_POWER_COLOR = '#FFD700';
export const HOLDING_ICON_BORDER_COLOR = '#CD7F32'; // Bronze
export const LANDMARK_ICON_BORDER_COLOR = '#60A5FA'; // Light Blue