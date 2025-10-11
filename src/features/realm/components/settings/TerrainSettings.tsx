/**
 * @file Component for the "Terrain" tab in the main settings modal.
 */

import React, { useRef, useCallback, useEffect } from 'react';
import type { TileSet, SpraySettings } from '@/features/realm/types';
import { DEFAULT_SPRAY_SETTINGS } from '@/features/realm/config/constants';
import { resolveColorToken } from '@/app/theme/colors';
import { SettingsSection } from '../ui/SettingsSection';
import { useInfoPopup } from '@/shared/hooks/useInfoPopup';
import { TerrainSprayPanel } from './terrain/TerrainSprayPanel';
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

  const handleSettingChange = (terrainId: string, settingKey: keyof SpraySettings, value: any) => {
    setTileSets((prev) => ({
      ...prev,
      terrain: prev.terrain.map((t) =>
        t.id === terrainId
          ? {
              ...t,
              spraySettings: {
                ...(t.spraySettings || DEFAULT_SPRAY_SETTINGS),
                [settingKey]: value,
              },
            }
          : t
      ),
    }));
  };

  const handleToggleSprayIcon = (terrainId: string, iconName: string) => {
    setTileSets((prev) => ({
      ...prev,
      terrain: prev.terrain.map((t) => {
        if (t.id === terrainId) {
          const currentIcons = t.sprayIcons || [];
          const newIcons = currentIcons.includes(iconName)
            ? currentIcons.filter((i) => i !== iconName)
            : [...currentIcons, iconName];
          return { ...t, sprayIcons: newIcons };
        }
        return t;
      }),
    }));
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Terrain Icon Spray">
        <p className="text-xs text-text-muted !mt-0">
          Configure the small, semi-transparent icons that are procedurally scattered on each
          terrain type to add visual texture.
        </p>
        <div className="space-y-4">
          {tileSets.terrain.map((terrain) => {
            const settings = terrain.spraySettings || DEFAULT_SPRAY_SETTINGS;
            const resolvedTerrainColor = resolveColor(terrain.color);
            const resolvedSprayColor = resolveColor(settings.color);
            return (
              <TerrainSprayPanel
                key={terrain.id}
                terrain={terrain}
                settings={settings}
                resolvedTerrainColor={resolvedTerrainColor}
                resolvedSprayColor={resolvedSprayColor}
                activeInfo={activeInfo}
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
      </SettingsSection>
    </div>
  );
};
