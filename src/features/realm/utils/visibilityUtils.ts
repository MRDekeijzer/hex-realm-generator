import type { KnightVisibilitySettings, Myth, TileSet } from '@/features/realm/types';
import { DEFAULT_VIEW_VISIBILITY } from '@/features/realm/config/constants';

interface NormalizeResult {
  visibility: KnightVisibilitySettings;
  changed: boolean;
}

const ensureBoolean = (value: boolean | undefined, fallback: boolean): [boolean, boolean] => {
  if (value === undefined) {
    return [fallback, true];
  }
  return [value, false];
};

export const normalizeKnightVisibility = (
  currentVisibility: KnightVisibilitySettings | undefined,
  tileSets: TileSet,
  myths: Myth[]
): NormalizeResult => {
  const base = currentVisibility ?? DEFAULT_VIEW_VISIBILITY;
  let changed = currentVisibility === undefined;

  const holdings = tileSets.holding.reduce<Record<string, boolean>>((acc, holding) => {
    const next = base.holdings?.[holding.id];
    if (next === undefined) {
      changed = true;
      acc[holding.id] = true;
    } else {
      acc[holding.id] = next;
    }
    return acc;
  }, {});

  if (base.holdings) {
    for (const key of Object.keys(base.holdings)) {
      if (!(key in holdings)) {
        changed = true;
        break;
      }
    }
  }

  const landmarks = tileSets.landmark.reduce<Record<string, boolean>>((acc, landmark) => {
    const next = base.landmarks?.[landmark.id];
    if (next === undefined) {
      changed = true;
      acc[landmark.id] = false;
    } else {
      acc[landmark.id] = next;
    }
    return acc;
  }, {});

  if (base.landmarks) {
    for (const key of Object.keys(base.landmarks)) {
      if (!(key in landmarks)) {
        changed = true;
        break;
      }
    }
  }

  const mythsVisibility = myths.reduce<Record<number, boolean>>((acc, myth) => {
    const next = base.myths?.[myth.id];
    if (next === undefined) {
      changed = true;
      acc[myth.id] = false;
    } else {
      acc[myth.id] = next;
    }
    return acc;
  }, {});

  if (base.myths) {
    for (const key of Object.keys(base.myths)) {
      const numericKey = Number(key);
      if (!(numericKey in mythsVisibility)) {
        changed = true;
        break;
      }
    }
  }

  const [seatOfPower, seatChanged] = ensureBoolean(base.seatOfPower, DEFAULT_VIEW_VISIBILITY.seatOfPower);
  const [showBarriers, barrierChanged] = ensureBoolean(
    base.showBarriers,
    DEFAULT_VIEW_VISIBILITY.showBarriers
  );

  changed = changed || seatChanged || barrierChanged;

  return {
    visibility: {
      holdings,
      seatOfPower,
      landmarks,
      myths: mythsVisibility,
      showBarriers,
    },
    changed,
  };
};
