// FIX: Import React to make React.FC available.
import type React from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Hex {
  q: number;
  r: number;
  s: number; // s is derived from q and r (q + r + s = 0)
  terrain: string;
  barrierEdges: number[]; // 0-5, where 0 is top-right edge for pointy top
  holding?: string;
  myth?: number;
  landmark?: string;
  isWater?: boolean;
  isRiver?: boolean;
}

export interface Myth {
  id: number;
  name: string;
  q: number;
  r: number;
}

export interface Realm {
  shape: 'hex' | 'square';
  radius?: number;
  width?: number;
  height?: number;
  hexes: Hex[];
  myths: Myth[];
  seatOfPower: { q: number; r: number };
}

export type Tool = 'select' | 'terrain' | 'barrier' | 'poi' | 'myth';

export type HexOrientation = 'pointy' | 'flat';

export interface ViewOptions {
  showGrid: boolean;
  isGmView: boolean;
  orientation: HexOrientation;
  hexSize: Point;
  gridColor: string;
  gridWidth: number;
}

export interface Tile {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }> | string;
  color?: string;
}

export interface TileSet {
  terrain: Tile[];
  holding: Tile[];
  landmark: Tile[];
}

export interface LandmarkGenerationOptions {
  [key: string]: number;
}

export interface GenerationOptions {
  numHoldings: number;
  numMyths: number;
  mythMinDistance: number;
  landmarks: LandmarkGenerationOptions;
}
