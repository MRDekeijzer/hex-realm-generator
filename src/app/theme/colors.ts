type PaletteNode = string | { [key: string]: PaletteNode };

export const colorPalette = {
  realm: {
    'canvas-backdrop': '#191f29',
    'map-viewport': '#18272e',
    'command-panel-surface': '#324446',
    'command-panel-hover': '#435360',
    'card-surface': '#eaebec',
  },
  border: {
    'panel-divider': '#41403f',
    'holding-marker': '#813a28',
    'landmark-marker': '#3f6e66',
  },
  text: {
    'high-contrast': '#eaebec',
    muted: '#a7a984',
    subtle: '#c5d2cb',
    inverse: '#221f21',
    'accent-headline': '#736b23',
  },
  actions: {
    'command-primary': '#736b23',
    'command-primary-hover': '#9d8940',
    'danger-base': '#60131b',
    'danger-hover': '#8a2a34',
  },
  feedback: {
    'info-panel': '#435360',
    'success-highlight': '#777741',
    'mystic-highlight': '#55375d',
  },
  mythic: {
    'myth-glow': '#eece22cc',
    'seat-of-power': '#eece22',
  },
  overlay: {
    scrim: 'rgba(0, 0, 0, 0.7)',
  },
  terrain: {
    marsh: {
      base: '#324446',
      deepwater: '#324446',
    },
    heath: {
      base: '#777741',
      brush: '#777741',
    },
    crags: {
      base: '#18272e',
      stone: '#18272e',
    },
    peaks: {
      base: '#41403f',
      ridge: '#41403f',
    },
    forest: {
      base: '#777741',
      canopy: '#777741',
    },
    valley: {
      base: '#a7a984',
      meander: '#a7a984',
    },
    hills: {
      base: '#9d8940',
      rise: '#9d8940',
    },
    meadow: {
      base: '#eaebec',
      bloom: '#eaebec',
    },
    bog: {
      base: '#18272e',
      hollows: '#18272e',
    },
    lakes: {
      base: '#3f6e66',
      surface: '#3f6e66',
    },
    glades: {
      base: '#c5d2cb',
      light: '#c5d2cb',
    },
    plain: {
      base: '#a7a984',
      expanse: '#a7a984',
    },
  },
} as const satisfies Record<string, PaletteNode>;

export type ColorPalette = typeof colorPalette;

export type FlattenedColorPalette = Record<string, string>;

export const flattenColorPalette = (
  palette: Record<string, PaletteNode>,
  parents: string[] = []
): FlattenedColorPalette =>
  Object.entries(palette).reduce<FlattenedColorPalette>((acc, [key, value]) => {
    const compoundKey = [...parents, key].join('-');

    if (typeof value === 'string') {
      acc[compoundKey] = value;
      return acc;
    }

    Object.assign(acc, flattenColorPalette(value, [...parents, key]));
    return acc;
  }, {});

export const tailwindColorPalette = flattenColorPalette(colorPalette);

export type TailwindColorName = keyof typeof tailwindColorPalette;

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export const resolveColorToken = (token: string): string => {
  const lookupKey = token.trim();
  const paletteValue = tailwindColorPalette[lookupKey as TailwindColorName];
  if (paletteValue) {
    return HEX_PATTERN.test(paletteValue) ? paletteValue.toUpperCase() : paletteValue;
  }
  if (HEX_PATTERN.test(lookupKey)) {
    return lookupKey.toUpperCase();
  }
  return lookupKey;
};

export const getTerrainBaseToken = (terrainId: string): TailwindColorName =>
  `terrain-${terrainId}-base` as TailwindColorName;

export const getTerrainBaseColor = (terrainId: string): string =>
  tailwindColorPalette[getTerrainBaseToken(terrainId)]?.toUpperCase() ?? '#CCCCCC';
