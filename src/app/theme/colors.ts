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

const CSS_VAR_PATTERN = /^var\((--[^)]+)\)$/i;
const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const normalizeToken = (token: string): string => {
  const trimmed = token.trim();
  const varMatch = CSS_VAR_PATTERN.exec(trimmed);
  const rawToken = varMatch?.[1] ?? trimmed;
  return rawToken;
};

export const legacyColorTokenMap: Record<string, TailwindColorName> = {
  '--color-background-primary': 'realm-canvas-backdrop',
  '--color-background-secondary': 'realm-map-viewport',
  '--color-surface-primary': 'realm-command-panel-surface',
  '--color-surface-secondary': 'realm-command-panel-hover',
  '--color-surface-tertiary': 'realm-card-surface',
  '--color-border-primary': 'border-panel-divider',
  '--color-border-holding': 'border-holding-marker',
  '--color-border-landmark': 'border-landmark-marker',
  '--color-text-primary': 'text-high-contrast',
  '--color-text-secondary': 'text-muted',
  '--color-text-tertiary': 'text-subtle',
  '--color-text-inverse': 'text-inverse',
  '--color-text-accent': 'text-accent-headline',
  '--color-accent-primary': 'actions-command-primary',
  '--color-accent-primary-hover': 'actions-command-primary-hover',
  '--color-accent-danger': 'actions-danger-base',
  '--color-accent-danger-hover': 'actions-danger-hover',
  '--color-accent-special': 'feedback-mystic-highlight',
  '--color-accent-success': 'feedback-success-highlight',
  '--color-accent-info': 'feedback-info-panel',
  '--color-accent-myth': 'mythic-myth-glow',
  '--color-accent-seat-of-power': 'mythic-seat-of-power',
  '--terrain-marsh': 'terrain-marsh-base',
  '--terrain-heath': 'terrain-heath-base',
  '--terrain-crags': 'terrain-crags-base',
  '--terrain-peaks': 'terrain-peaks-base',
  '--terrain-forest': 'terrain-forest-base',
  '--terrain-valley': 'terrain-valley-base',
  '--terrain-hills': 'terrain-hills-base',
  '--terrain-meadow': 'terrain-meadow-base',
  '--terrain-bog': 'terrain-bog-base',
  '--terrain-lakes': 'terrain-lakes-base',
  '--terrain-glades': 'terrain-glades-base',
  '--terrain-plain': 'terrain-plain-base',
};

export const resolveColorToken = (token: string): string => {
  const normalized = normalizeToken(token);
  const lookupKey = legacyColorTokenMap[normalized] ?? normalized;
  const paletteValue = tailwindColorPalette[lookupKey as TailwindColorName];
  if (paletteValue) {
    return HEX_PATTERN.test(paletteValue) ? paletteValue.toUpperCase() : paletteValue;
  }
  if (HEX_PATTERN.test(token)) {
    return token.toUpperCase();
  }
  return token;
};

export const getTerrainBaseToken = (terrainId: string): TailwindColorName =>
  `terrain-${terrainId}-base` as TailwindColorName;

export const getTerrainBaseColor = (terrainId: string): string =>
  tailwindColorPalette[getTerrainBaseToken(terrainId)]?.toUpperCase() ?? '#CCCCCC';
