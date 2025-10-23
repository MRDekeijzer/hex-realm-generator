import {
  FALLBACK_COLOR,
  combinedColorMap,
  ColorTokenTree,
  flattenColorTree,
  legacyColorAliases,
  legacyColorMap,
  semanticColorMap,
} from './tokens';

type PaletteNode = string | { [key: string]: PaletteNode };

export const colorPalette = legacyColorAliases;

export type ColorPalette = typeof colorPalette;

export type FlattenedColorPalette = Record<string, string>;

export const flattenColorPalette = (
  palette: Record<string, PaletteNode>,
  parents: string[] = []
): FlattenedColorPalette => flattenColorTree(palette as unknown as ColorTokenTree, parents);

export const tailwindColorPalette: FlattenedColorPalette = {
  ...legacyColorMap,
  ...semanticColorMap,
};

export type TailwindColorName = keyof typeof tailwindColorPalette;

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export const resolveColorToken = (token: string): string => {
  const lookupKey = token.trim();
  const paletteValue = combinedColorMap[lookupKey] ?? tailwindColorPalette[lookupKey];
  if (paletteValue) {
    return HEX_PATTERN.test(paletteValue) ? paletteValue.toUpperCase() : paletteValue;
  }
  if (HEX_PATTERN.test(lookupKey)) {
    return lookupKey.toUpperCase();
  }
  return lookupKey;
};

export const getTerrainBaseToken = (terrainId: string): TailwindColorName =>
  `terrain-${terrainId}-base`;

export const getTerrainBaseColor = (terrainId: string): string =>
  tailwindColorPalette[getTerrainBaseToken(terrainId)]?.toUpperCase() ?? FALLBACK_COLOR;

export { basePalette, illustrationColors, semanticColors } from './tokens';
