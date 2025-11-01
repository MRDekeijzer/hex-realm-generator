import type {
  ExportSettings,
  FeatureFlags,
  GenerationOptions,
  Realm,
  RealmExportData,
  TileSet,
  ViewOptions,
} from '@/features/realm/types';

/** Schema version for serialized realm export files. */
export const REALM_EXPORT_VERSION = 1;

/**
 * Type guard that determines whether a parsed JSON value matches the serialized
 * realm export schema introduced in version 1.
 */
export function isRealmExportData(value: unknown): value is RealmExportData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<RealmExportData>;
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.realm === 'object' &&
    candidate.realm !== null &&
    Array.isArray(candidate.realm.hexes) &&
    typeof candidate.realmShape === 'string' &&
    typeof candidate.generationOptions === 'object' &&
    candidate.generationOptions !== null &&
    typeof candidate.tileSets === 'object' &&
    candidate.tileSets !== null &&
    typeof candidate.viewOptions === 'object' &&
    candidate.viewOptions !== null &&
    typeof candidate.exportSettings === 'object' &&
    candidate.exportSettings !== null &&
    'featureFlags' in candidate
  );
}

/**
 * Ensures the provided realm has an explicit myths collection. Older exports only
 * stored myth IDs on individual hexes, so this function reconstructs the array.
 */
export function ensureRealmHasMyths(realm: Realm): Realm {
  if (Array.isArray(realm.myths)) {
    return realm;
  }

  const myths = realm.hexes
    .filter((hex) => typeof hex.myth === 'number')
    .map((hex) => ({
      id: hex.myth!,
      name: `Myth #${hex.myth!}`,
      q: hex.q,
      r: hex.r,
    }));

  return {
    ...realm,
    myths,
  };
}

interface RealmExportBuildOptions {
  realm: Realm;
  realmShape: Realm['shape'];
  realmRadius?: number;
  realmWidth?: number;
  realmHeight?: number;
  generationOptions: GenerationOptions;
  tileSets: TileSet;
  terrainColors: Record<string, string>;
  viewOptions: ViewOptions;
  exportSettings: ExportSettings;
  mythMarkerFillColor: string;
  mythMarkerBorderColor: string;
  mythMarkerBorderWidth: number;
  seatOfPowerIconColor: string;
  seatOfPowerBackdropColor: string;
  poiIconColor: string | null;
  poiBackdropColor: string | null;
  barrierColor: string;
  featureFlags: FeatureFlags;
  metadata?: RealmExportData['metadata'];
}

/**
 * Builds a fully-populated export payload that can be persisted to disk.
 */
export function createRealmExportData(options: RealmExportBuildOptions): RealmExportData {
  const {
    realm,
    realmShape,
    realmRadius,
    realmWidth,
    realmHeight,
    generationOptions,
    tileSets,
    terrainColors,
    viewOptions,
    exportSettings,
    mythMarkerFillColor,
    mythMarkerBorderColor,
    mythMarkerBorderWidth,
    seatOfPowerIconColor,
    seatOfPowerBackdropColor,
    poiIconColor,
    poiBackdropColor,
    barrierColor,
    featureFlags,
    metadata,
  } = options;

  return {
    version: REALM_EXPORT_VERSION,
    metadata: {
      exportedAt: new Date().toISOString(),
      ...metadata,
    },
    realm,
    realmShape,
    realmRadius,
    realmWidth,
    realmHeight,
    generationOptions,
    tileSets,
    terrainColors,
    viewOptions,
    exportSettings,
    mythMarkerFillColor,
    mythMarkerBorderColor,
    mythMarkerBorderWidth,
    seatOfPowerIconColor,
    seatOfPowerBackdropColor,
    poiIconColor,
    poiBackdropColor,
    barrierColor,
    featureFlags,
  };
}
