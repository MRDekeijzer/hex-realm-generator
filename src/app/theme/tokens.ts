/**
 * Central color tokens for Hex Realm Generator.
 * Declares base swatches, semantic UI colors, and illustration palettes, plus helpers to flatten them for Tailwind/runtime use.
 */

export type ColorValue = string;

export type ColorTokenTree = {
  readonly [key: string]: ColorValue | ColorTokenTree;
};

export const basePalette = {
  obsidian950: '#191f29',
  obsidian900: '#18272e',
  obsidian800: '#324446',
  obsidian750: '#435360',
  pearl100: '#eaebec',
  granite600: '#41403f',
  ember500: '#813a28',
  tide500: '#3f6e66',
  linen200: '#a7a984',
  mist200: '#c5d2cb',
  ink900: '#221f21',
  gold600: '#736b23',
  gold600Opaque: '#736b23ff',
  gold500: '#9d8940',
  gold400: '#bfa75a',
  gold300: '#d4c16d',
  crimson600: '#60131b',
  crimson500: '#8a2a34',
  moss500: '#777741',
  amethyst500: '#55375d',
  sun500Translucent: '#eece22cc',
  sun500: '#eece22',
  fallback200: '#CCCCCC',
} as const;

const surface = {
  canvas: basePalette.obsidian950,
  map: basePalette.obsidian900,
  panel: basePalette.obsidian800,
  'panel-hover': basePalette.obsidian750,
  card: basePalette.pearl100,
} as const;

const text = {
  primary: basePalette.pearl100,
  muted: basePalette.linen200,
  subtle: basePalette.mist200,
  inverse: basePalette.ink900,
  accent: basePalette.gold600,
} as const;

const border = {
  'panel-divider': basePalette.granite600,
  'holding-marker': basePalette.ember500,
  'landmark-marker': basePalette.tide500,
} as const;

const intent = {
  primary: basePalette.gold600,
  'primary-strong': basePalette.gold600Opaque,
  'primary-hover': basePalette.gold500,
  danger: basePalette.crimson600,
  'danger-hover': basePalette.crimson500,
  success: basePalette.moss500,
  info: basePalette.obsidian750,
} as const;

const interaction = {
  'hex-hover': basePalette.sun500,
  'hex-selected': basePalette.sun500,
} as const;

const overlay = {
  scrim: 'rgba(0, 0, 0, 0.7)',
} as const;

const aura = {
  'mystic-highlight': basePalette.amethyst500,
} as const;

export const semanticColors = {
  surface,
  text,
  border,
  intent,
  interaction,
  overlay,
  aura,
} as const;

const terrain = {
  marsh: {
    base: surface.panel,
    deepwater: surface.panel,
  },
  heath: {
    base: intent.success,
    brush: intent.success,
  },
  crags: {
    base: surface.map,
    stone: surface.map,
  },
  peaks: {
    base: border['panel-divider'],
    ridge: border['panel-divider'],
  },
  forest: {
    base: intent.success,
    canopy: intent.success,
  },
  valley: {
    base: text.muted,
    meander: text.muted,
  },
  hills: {
    base: intent['primary-hover'],
    rise: intent['primary-hover'],
  },
  meadow: {
    base: surface.card,
    bloom: surface.card,
  },
  bog: {
    base: surface.map,
    hollows: surface.map,
  },
  lakes: {
    base: border['landmark-marker'],
    surface: border['landmark-marker'],
  },
  glades: {
    base: text.subtle,
    light: text.subtle,
  },
  plain: {
    base: text.muted,
    expanse: text.muted,
  },
} as const;

const mythic = {
  glow: basePalette.sun500Translucent,
  seatOfPower: basePalette.sun500,
} as const;

export const illustrationColors = {
  terrain,
  mythic,
} as const;

export const legacyColorAliases = {
  realm: {
    'canvas-backdrop': surface.canvas,
    'map-viewport': surface.map,
    'command-panel-surface': surface.panel,
    'command-panel-hover': surface['panel-hover'],
    'card-surface': surface.card,
  },
  border,
  text: {
    'high-contrast': text.primary,
    muted: text.muted,
    subtle: text.subtle,
    inverse: text.inverse,
    'accent-headline': text.accent,
  },
  actions: {
    'command-primary': intent['primary-strong'],
    'command-primary-hover': intent['primary-hover'],
    'danger-base': intent.danger,
    'danger-hover': intent['danger-hover'],
  },
  feedback: {
    'info-panel': intent.info,
    'success-highlight': intent.success,
    'mystic-highlight': aura['mystic-highlight'],
  },
  interaction,
  mythic: {
    'myth-glow': illustrationColors.mythic.glow,
    'seat-of-power': illustrationColors.mythic.seatOfPower,
  },
  overlay,
  terrain: illustrationColors.terrain,
} as const;

export const FALLBACK_COLOR = basePalette.fallback200;

export const flattenColorTree = (
  tree: ColorTokenTree,
  parents: string[] = []
): Record<string, string> =>
  Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const compoundKey = [...parents, key].join('-');

    if (typeof value === 'string') {
      acc[compoundKey] = value;
      return acc;
    }

    Object.assign(acc, flattenColorTree(value, [...parents, key]));
    return acc;
  }, {});

export const semanticColorMap = flattenColorTree(semanticColors);
export const legacyColorMap = flattenColorTree(legacyColorAliases);

export const combinedColorMap = {
  ...legacyColorMap,
  ...semanticColorMap,
};
