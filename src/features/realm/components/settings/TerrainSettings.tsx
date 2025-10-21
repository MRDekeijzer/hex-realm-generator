/**
 * @file Component for the "Terrain" tab in the main settings modal.
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import type { TileSet, SpraySettings, Tile } from '@/features/realm/types';
import { DEFAULT_SPRAY_SETTINGS, TERRAIN_SPRAY_DEFAULTS } from '@/features/realm/config/constants';
import { resolveColorToken } from '@/app/theme/colors';
import { SettingsSection } from '../ui/SettingsSection';
import { useInfoPopup } from '@/shared/hooks/useInfoPopup';
import { TerrainSprayPanel } from './terrain/TerrainSprayPanel';

interface DraftSprayConfig {
  spraySettings: SpraySettings;
  sprayIcons: string[];
}

const cloneSpraySettings = (settings: SpraySettings): SpraySettings => ({
  ...settings,
  placementMask: Array.isArray(settings.placementMask) ? [...settings.placementMask] : [],
});

const cloneDraftConfig = (config: DraftSprayConfig): DraftSprayConfig => ({
  spraySettings: cloneSpraySettings(config.spraySettings),
  sprayIcons: [...config.sprayIcons],
});

const normalizeSpraySettings = (settings: SpraySettings): SpraySettings => {
  const normalized = { ...settings };
  normalized.sizeMin = Math.max(10, normalized.sizeMin);
  normalized.sizeMax = Math.max(normalized.sizeMin, normalized.sizeMax);
  normalized.opacityMin = Math.max(0, Math.min(1, normalized.opacityMin));
  normalized.opacityMax = Math.max(normalized.opacityMin, Math.min(1, normalized.opacityMax));
  normalized.iconBaseRotation = normalized.iconBaseRotation ?? 0;
  normalized.gridBaseRotation = normalized.gridBaseRotation ?? 0;
  return normalized;
};

const resolveTerrainPreset = (terrainId: string) => TERRAIN_SPRAY_DEFAULTS[terrainId];

const resolveSpraySettingsWithPreset = (terrain: Tile): SpraySettings => {
  const preset = resolveTerrainPreset(terrain.id);
  return normalizeSpraySettings({
    ...DEFAULT_SPRAY_SETTINGS,
    ...(preset?.settings ?? {}),
    ...(terrain.spraySettings ?? {}),
  } as SpraySettings);
};

const resolveSprayIconsWithPreset = (terrain: Tile): string[] => {
  if (terrain.sprayIcons && terrain.sprayIcons.length > 0) {
    return [...terrain.sprayIcons];
  }
  const presetIcons = resolveTerrainPreset(terrain.id)?.icons ?? [];
  return [...presetIcons];
};

const buildBaselineDraft = (terrain: Tile): DraftSprayConfig => ({
  spraySettings: cloneSpraySettings(resolveSpraySettingsWithPreset(terrain)),
  sprayIcons: resolveSprayIconsWithPreset(terrain),
});

const buildDraftFromTerrains = (terrains: Tile[]): Record<string, DraftSprayConfig> =>
  terrains.reduce<Record<string, DraftSprayConfig>>((acc, terrain) => {
    acc[terrain.id] = buildBaselineDraft(terrain);
    return acc;
  }, {});

const areNumberArraysEqual = (a: number[] = [], b: number[] = []): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

const areSpraySettingsEqual = (a: SpraySettings, b: SpraySettings): boolean => {
  const keys = new Set<keyof SpraySettings>([
    'mode',
    'density',
    'sizeMin',
    'sizeMax',
    'opacityMin',
    'opacityMax',
    'color',
    'placementMask',
    'centerBias',
    'minSeparation',
    'gridDensity',
    'gridSize',
    'gridJitter',
    'gridBaseRotation',
    'scaleVariance',
    'gridRotationRange',
    'iconBaseRotation',
    'seedOffset',
  ]);

  for (const key of keys) {
    const valueA = a[key];
    const valueB = b[key];

    if (Array.isArray(valueA) && Array.isArray(valueB)) {
      if (!areNumberArraysEqual(valueA, valueB)) {
        return false;
      }
    } else if (valueA !== valueB) {
      return false;
    }
  }

  return true;
};

const areSprayIconsEqual = (a: string[] = [], b: string[] = []): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};
/**
 * Props for the TerrainSettings component.
 */
interface TerrainSettingsProps {
  tileSets: TileSet;
  setTileSets: React.Dispatch<React.SetStateAction<TileSet>>;
  focusId: string | null;
}

/**
 * A component that renders settings for customizing terrain appearance,
 * including the procedural Icon Spray feature.
 */
export const TerrainSettings = ({ tileSets, setTileSets, focusId }: TerrainSettingsProps) => {
  const detailsRefs = useRef<Map<string, HTMLDetailsElement | null>>(new Map());
  const { activeInfo, handleInfoClick, scheduleHoverOpen, scheduleHoverClose, closeInfo } =
    useInfoPopup();
  const [draftSprayConfigs, setDraftSprayConfigs] = useState<Record<string, DraftSprayConfig>>(() =>
    buildDraftFromTerrains(tileSets.terrain)
  );

  const resolveColor = useCallback((value?: string) => {
    if (!value) {
      return '#CCCCCC';
    }
    return resolveColorToken(value);
  }, []);

  useEffect(() => {
    if (focusId) {
      const element = detailsRefs.current.get(focusId);
      if (element) {
        // Use a short timeout to ensure the DOM is ready after the tab switch
        setTimeout(() => {
          element.open = true;
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [focusId]);

  useEffect(() => {
    if (!activeInfo) {
      return;
    }
    const terrainStillExists = tileSets.terrain.some((terrain) => terrain.id === activeInfo.id);
    if (!terrainStillExists) {
      closeInfo();
    }
  }, [activeInfo, closeInfo, tileSets.terrain]);

  useEffect(() => {
    setDraftSprayConfigs((prev) => {
      const next: Record<string, DraftSprayConfig> = {};

      tileSets.terrain.forEach((terrain) => {
        const baseline = buildBaselineDraft(terrain);

        const existing = prev[terrain.id];

        if (!existing) {
          next[terrain.id] = baseline;
          return;
        }

        const matchesBaseline =
          areSpraySettingsEqual(existing.spraySettings, baseline.spraySettings) &&
          areSprayIconsEqual(existing.sprayIcons, baseline.sprayIcons);

        next[terrain.id] = matchesBaseline ? baseline : existing;
      });

      return next;
    });
  }, [tileSets.terrain]);

  const updateDraftConfig = useCallback(
    (terrainId: string, updater: (draft: DraftSprayConfig) => DraftSprayConfig) => {
      setDraftSprayConfigs((prev) => {
        const current = prev[terrainId];
        if (!current) {
          return prev;
        }
        const updated = updater(cloneDraftConfig(current));
        if (
          areSpraySettingsEqual(current.spraySettings, updated.spraySettings) &&
          areSprayIconsEqual(current.sprayIcons, updated.sprayIcons)
        ) {
          return prev;
        }
        return {
          ...prev,
          [terrainId]: updated,
        };
      });
    },
    []
  );

  const handleSettingChange = (terrainId: string, settingKey: keyof SpraySettings, value: any) => {
    updateDraftConfig(terrainId, (draft) => {
      const nextValue = settingKey === 'placementMask' && Array.isArray(value) ? [...value] : value;

      return {
        ...draft,
        spraySettings: {
          ...draft.spraySettings,
          [settingKey]: nextValue,
        },
      };
    });
  };

  const handleToggleSprayIcon = (terrainId: string, iconName: string) => {
    updateDraftConfig(terrainId, (draft) => {
      const icons = draft.sprayIcons.includes(iconName)
        ? draft.sprayIcons.filter((icon) => icon !== iconName)
        : [...draft.sprayIcons, iconName];

      return {
        ...draft,
        sprayIcons: icons,
      };
    });
  };

  const dirtyTerrainIds = useMemo(() => {
    const dirty = new Set<string>();
    for (const terrain of tileSets.terrain) {
      const draft = draftSprayConfigs[terrain.id];
      if (!draft) {
        continue;
      }
      const baseline = buildBaselineDraft(terrain);

      if (
        !areSpraySettingsEqual(draft.spraySettings, baseline.spraySettings) ||
        !areSprayIconsEqual(draft.sprayIcons, baseline.sprayIcons)
      ) {
        dirty.add(terrain.id);
      }
    }
    return dirty;
  }, [draftSprayConfigs, tileSets.terrain]);

  const hasUnsavedChanges = dirtyTerrainIds.size > 0;

  const handleSaveTerrain = useCallback(
    (terrainId: string) => {
      const draft = draftSprayConfigs[terrainId];
      if (!draft) {
        return;
      }

      setTileSets((prev) => {
        const updatedTerrain = prev.terrain.map((terrain) =>
          terrain.id === terrainId
            ? {
                ...terrain,
                spraySettings: cloneSpraySettings(draft.spraySettings),
                sprayIcons: [...draft.sprayIcons],
              }
            : terrain
        );

        return {
          ...prev,
          terrain: updatedTerrain,
        };
      });

      setDraftSprayConfigs((prev) => ({
        ...prev,
        [terrainId]: {
          spraySettings: cloneSpraySettings(draft.spraySettings),
          sprayIcons: [...draft.sprayIcons],
        },
      }));
    },
    [draftSprayConfigs, setTileSets]
  );

  const handleSave = useCallback(() => {
    setTileSets((prev) => {
      const updatedTerrain = prev.terrain.map((terrain) => {
        const draft = draftSprayConfigs[terrain.id];
        if (!draft) {
          return terrain;
        }
        return {
          ...terrain,
          spraySettings: cloneSpraySettings(draft.spraySettings),
          sprayIcons: [...draft.sprayIcons],
        };
      });

      const nextTileSets = { ...prev, terrain: updatedTerrain };
      setDraftSprayConfigs(buildDraftFromTerrains(nextTileSets.terrain));
      return nextTileSets;
    });
  }, [draftSprayConfigs, setTileSets]);

  const handleDiscard = useCallback(() => {
    setDraftSprayConfigs(buildDraftFromTerrains(tileSets.terrain));
  }, [tileSets.terrain]);

  return (
    <div className="space-y-6">
      <SettingsSection title="Terrain Icon Spray">
        <p className="text-xs text-text-muted !mt-0">
          Configure the small, semi-transparent icons that are procedurally scattered on each
          terrain type to add visual texture.
        </p>
        <div className="space-y-4">
          {tileSets.terrain.map((terrain) => {
            const draft = draftSprayConfigs[terrain.id] ?? buildBaselineDraft(terrain);
            const previewTerrain: Tile = {
              ...terrain,
              spraySettings: draft.spraySettings,
              sprayIcons: draft.sprayIcons,
            };
            const settings = draft.spraySettings || DEFAULT_SPRAY_SETTINGS;
            const resolvedTerrainColor = resolveColor(terrain.color);
            const resolvedSprayColor = resolveColor(settings.color);
            return (
              <TerrainSprayPanel
                key={terrain.id}
                terrain={previewTerrain}
                settings={settings}
                resolvedTerrainColor={resolvedTerrainColor}
                resolvedSprayColor={resolvedSprayColor}
                activeInfo={activeInfo}
                hasUnsavedChanges={dirtyTerrainIds.has(terrain.id)}
                onSave={() => handleSaveTerrain(terrain.id)}
                registerDetailsRef={(element) => {
                  detailsRefs.current.set(terrain.id, element);
                }}
                onInfoClick={(anchor) => handleInfoClick(terrain.id, anchor)}
                onInfoHoverStart={(anchor) => scheduleHoverOpen(terrain.id, anchor)}
                onInfoHoverEnd={() => scheduleHoverClose(terrain.id)}
                onCloseInfo={closeInfo}
                onToggleIcon={(icon) => handleToggleSprayIcon(terrain.id, icon)}
                onSettingChange={(key, value) => handleSettingChange(terrain.id, key, value)}
              />
            );
          })}
        </div>
        <div className="flex flex-col md:flex-row md:justify-end gap-2 pt-2 border-t border-border-panel-divider/40 mt-6">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              hasUnsavedChanges
                ? 'border border-border-panel-divider text-text-muted hover:text-text-high-contrast hover:border-actions-command-primary/40'
                : 'border border-border-panel-divider/60 text-text-subtle cursor-not-allowed'
            }`}
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              hasUnsavedChanges
                ? 'bg-actions-command-primary text-text-high-contrast hover:bg-actions-command-primary/90'
                : 'bg-realm-command-panel-hover text-text-subtle cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </SettingsSection>
    </div>
  );
};
