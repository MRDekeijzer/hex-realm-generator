/**
 * @file Component for configuring visibility differences between referee and knight views.
 */

import React from 'react';
import type { ViewOptions, ViewVisibilitySettings } from '@/features/realm/types';
import { SettingsSection } from '../ui/SettingsSection';
import { DEFAULT_VIEW_VISIBILITY } from '@/features/realm/config/constants';

type Audience = 'referee' | 'knight';

interface ViewSettingsProps {
  viewOptions: ViewOptions;
  setViewOptions: React.Dispatch<React.SetStateAction<ViewOptions>>;
}

const VISIBILITY_OPTIONS: {
  key: keyof ViewVisibilitySettings;
  label: string;
  description: string;
}[] = [
  {
    key: 'showHoldings',
    label: 'Holdings & Seat of Power',
    description: 'Display castles, cities, and other strongholds including the Seat of Power.',
  },
  {
    key: 'showLandmarks',
    label: 'Landmarks',
    description: 'Reveal sacred sites, hazards, ruins, and other landmark markers.',
  },
  {
    key: 'showMyths',
    label: 'Myths',
    description: 'Show hidden myths and legends that normally only the referee sees.',
  },
  {
    key: 'showBarriers',
    label: 'Barriers',
    description: 'Render barrier lines between hexes such as walls or natural obstacles.',
  },
];

export const ViewSettings = ({ viewOptions, setViewOptions }: ViewSettingsProps) => {
  const handleToggle = (audience: Audience, key: keyof ViewVisibilitySettings) => {
    setViewOptions((prev) => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [audience]: {
          ...prev.visibility[audience],
          [key]: !prev.visibility[audience][key],
        },
      },
    }));
  };

  const handleReset = () => {
    setViewOptions((prev) => ({
      ...prev,
      visibility: {
        referee: { ...DEFAULT_VIEW_VISIBILITY.referee },
        knight: { ...DEFAULT_VIEW_VISIBILITY.knight },
      },
    }));
  };

  const renderVisibilitySection = (audience: Audience, title: string, helper: string) => (
    <SettingsSection title={title}>
      <p className="text-xs text-text-muted !mt-0">{helper}</p>
      <div className="space-y-3">
        {VISIBILITY_OPTIONS.map(({ key, label, description }) => {
          const checkboxId = `${audience}-${key}`;
          const isChecked = viewOptions.visibility[audience][key];
          return (
            <label
              key={checkboxId}
              htmlFor={checkboxId}
              className="flex items-start justify-between gap-3 p-3 bg-realm-command-panel-surface rounded-md border border-border-panel-divider hover:border-border-panel-divider/80 transition-colors cursor-pointer"
            >
              <div>
                <span className="block text-sm font-semibold text-text-high-contrast">{label}</span>
                <span className="block text-xs text-text-muted mt-1">{description}</span>
              </div>
              <div className="relative pt-1">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(audience, key)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-realm-command-panel-hover rounded-full peer peer-checked:bg-actions-command-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </div>
            </label>
          );
        })}
      </div>
    </SettingsSection>
  );

  return (
    <div className="space-y-6">
      {renderVisibilitySection(
        'referee',
        'Referee View',
        'Control which map layers remain visible to the referee. These settings apply while Referee View is active.'
      )}
      {renderVisibilitySection(
        'knight',
        'Knight View',
        'Choose which layers are exposed when sharing the Knight (player-facing) view.'
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-text-muted bg-realm-command-panel-surface rounded-md border border-border-panel-divider hover:bg-realm-command-panel-hover transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
