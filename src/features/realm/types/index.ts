/**
 * @file types.ts
 * This file contains all the core TypeScript types and interfaces used throughout the application.
 * It serves as the single source of truth for the data structures.
 */

/** Represents a 2D point with x and y coordinates. */
export interface Point {
  x: number;
  y: number;
}

/** Represents a single hexagonal cell in the grid. */
export interface Hex {
  /** The q coordinate in the axial coordinate system. */
  q: number;
  /** The r coordinate in the axial coordinate system. */
  r: number;
  /** The s coordinate, derived from q and r (q + r + s = 0). */
  s: number;
  /** The identifier for the terrain type of the hex. */
  terrain: string;
  /** An array of edge indices (0-5) that have barriers. */
  barrierEdges: number[];
  /** The identifier for a holding (e.g., 'castle') located in the hex. */
  holding?: string;
  /** The numerical ID of a myth located in the hex. */
  myth?: number;
  /** The identifier for a landmark located in the hex. */
  landmark?: string;
  /** A flag indicating if the hex is a water body. (Not currently used in generation) */
  isWater?: boolean;
  /** A flag indicating if the hex contains a river. (Not currently used in generation) */
  isRiver?: boolean;
}

/** Represents a myth, a special point of interest with a unique ID and name. */
export interface Myth {
  /** The unique identifier for the myth. */
  id: number;
  /** The name of the myth. */
  name: string;
  /** The q coordinate of the hex where the myth is located. */
  q: number;
  /** The r coordinate of the hex where the myth is located. */
  r: number;
}

/** Represents the entire game world or map. */
export interface Realm {
  /** The overall shape of the map grid. */
  shape: 'hex' | 'square';
  /** The radius of the map, if the shape is 'hex'. */
  radius?: number;
  /** The width of the map, if the shape is 'square'. */
  width?: number;
  /** The height of the map, if the shape is 'square'. */
  height?: number;
  /** An array of all the Hex objects that make up the realm. */
  hexes: Hex[];
  /** An array of all the Myth objects in the realm. */
  myths: Myth[];
  /** The coordinates of the hex designated as the Seat of Power. */
  seatOfPower: { q: number; r: number };
}

/** Defines the set of available tools for interacting with the map. */
export type Tool = 'select' | 'terrain' | 'barrier' | 'poi' | 'myth';

/** Defines the orientation of the hex grid. */
export type HexOrientation = 'pointy' | 'flat';

/** Options for controlling the visual representation of the hex grid. */
export interface ViewOptions {
  /** Whether to display the grid lines between hexes. */
  showGrid: boolean;
  /** Whether to show Referee-only information (myths, barriers). */
  isGmView: boolean;
  /** The orientation of the hexes. */
  orientation: HexOrientation;
  /** The size (width and height) of a single hex. */
  hexSize: Point;
  /** The color of the grid lines. */
  gridColor: string;
  /** The width of the grid lines. */
  gridWidth: number;
  /** Whether to display the procedural icon spray layer. */
  showIconSpray: boolean;
}

/** Detailed settings for the procedural Icon Spray feature. */
export interface SpraySettings {
  /** The number of icons to place per hex. */
  density: number;
  /** The minimum size of a spray icon in pixels. */
  sizeMin: number;
  /** The maximum size of a spray icon in pixels. */
  sizeMax: number;
  /** The minimum opacity of spray icons (0.1 to 1.0). */
  opacityMin: number;
  /** The maximum opacity of spray icons (0.1 to 1.0). */
  opacityMax: number;
  /** The base color of the spray icons. */
  color: string;
  /** A grid mask defining where icons can be placed. */
  placementMask: number[];
}

/** Represents a single paintable or placeable item. */
export interface Tile {
  /** The unique identifier for the tile. */
  id: string;
  /** The display label for the tile. */
  label: string;
  /** The name of the icon used to represent the tile. */
  icon: string;
  /** The color associated with the tile (primarily for terrain). */
  color?: string;
  /** An array of icon names to be used by the Icon Spray feature. */
  sprayIcons?: string[];
  /** Detailed settings for the procedural icon spray on this tile. */
  spraySettings?: SpraySettings;
}

/** A collection of all available tile types, categorized. */
export interface TileSet {
  terrain: Tile[];
  holding: Tile[];
  landmark: Tile[];
}

/** A map of terrain IDs to their pre-rendered texture data URLs. */
export type TerrainTextures = Record<string, {
    withSpray: string;
    withoutSpray: string;
  }>;

/** Options for specifying the number of each landmark type to generate. */
export type LandmarkGenerationOptions = Record<string, number>;

/** A matrix defining the clustering affinity between different terrain types. */
export type TerrainClusteringMatrix = Record<string, Record<string, number>>;

/** Defines the shape used for forming highland areas during terrain generation. */
export type HighlandFormation = 'random' | 'linear' | 'circle' | 'triangle';

/** A collection of all options controlling the procedural generation of a realm. */
export interface GenerationOptions {
  /** The number of holdings (castles, cities, etc.) to generate. */
  numHoldings: number;
  /** The number of myths to generate. */
  numMyths: number;
  /** The minimum distance (in hexes) between generated myths. */
  mythMinDistance: number;
  /** The number of each landmark type to generate. */
  landmarks: LandmarkGenerationOptions;
  /** Whether to generate random barriers between hexes. */
  generateBarriers: boolean;
  /** The shape used to influence highland placement. */
  highlandFormation: HighlandFormation;
  /** The strength of the highland formation's influence on elevation. */
  highlandFormationStrength: number;
  /** The rotation (in degrees) of the highland formation shape. */
  highlandFormationRotation: number;
  /** Whether to invert the highland formation (e.g., a central sea instead of a central mountain). */
  highlandFormationInverse?: boolean;
  /** Controls the size and smoothness of terrain clusters. Lower values are more chaotic. */
  terrainRoughness: number;
  /** The matrix of terrain clustering affinities. */
  terrainClusteringMatrix: TerrainClusteringMatrix;
  /** A set of weights influencing the frequency of each terrain type. */
  terrainBiases: Record<string, number>;
  /** An ordered array of terrain IDs from highest to lowest elevation. */
  terrainHeightOrder: string[];
}
