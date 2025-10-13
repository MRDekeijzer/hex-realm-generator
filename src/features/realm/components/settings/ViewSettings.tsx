/**
 * @file Component for configuring how the Knight view differs from the Referee view.
 */

import React, { useEffect, useMemo } from 'react';
import type {
  ViewOptions,
  TileSet,
  Myth,
  KnightVisibilitySettings,
} from '@/features/realm/types';
import { SettingsSection } from '../ui/SettingsSection';
import { DEFAULT_VIEW_VISIBILITY } from '@/features/realm/config/constants';
import { Icon } from '../Icon';

interface ViewSettingsProps {
  viewOptions: ViewOptions;
  setViewOptions: React.Dispatch<React.SetStateAction<ViewOptions>>;
  tileSets: TileSet;
  myths: Myth[];
}

const buildDefaultVisibility = (tileSets: TileSet, myths: Myth[]): KnightVisibilitySettings => ({
  holdings: tileSets.holding.reduce<Record<string, boolean>>((acc, holding) => {
    acc[holding.id] = true;
    return acc;
  }, {}),
  seatOfPower: true,
  landmarks: tileSets.landmark.reduce<Record<string, boolean>>((acc, landmark) => {
    acc[landmark.id] = false;
    return acc;
  }, {}),
  myths: myths.reduce<Record<number, boolean>>((acc, myth) => {
    acc[myth.id] = false;
    return acc;
  }, {}),
  showBarriers: DEFAULT_VIEW_VISIBILITY.showBarriers,
});

const Switch = ({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <div className="relative pt-1">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="sr-only peer"
    />
    <div className="relative w-11 h-6 bg-realm-command-panel-hover rounded-full peer peer-checked:bg-actions-command-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
  </div>
);

const VisibilityDropdown = ({
  title,
  summary,
  helper,
  children,
}: {
  title: string;
  summary: string;
  helper?: string;
  children: React.ReactNode;
}) => (
  <details className="group rounded-md border border-border-panel-divider bg-realm-command-panel-surface">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-text-high-contrast">{title}</p>
        <p className="text-xs text-text-muted">{summary}</p>
        {helper ? <p className="mt-1 text-[11px] text-text-muted">{helper}</p> : null}
      </div>
      <Icon
        name="chevron-down"
        className="h-4 w-4 text-text-muted transition-transform group-open:rotate-180"
      />
    </summary>
    <div className="border-t border-border-panel-divider px-4 py-3 space-y-3">{children}</div>
  </details>
);

export const ViewSettings = ({
  viewOptions,
  setViewOptions,
  tileSets,
  myths,
}: ViewSettingsProps) => {
  const knightVisibility = viewOptions.visibility.knight;

  useEffect(() => {
    setViewOptions((prev) => {
      const current = prev.visibility.knight ?? DEFAULT_VIEW_VISIBILITY;
      let changed = false;

      const normalizedHoldings = tileSets.holding.reduce<Record<string, boolean>>((acc, holding) => {
        const nextValue = current.holdings?.[holding.id] ?? true;
        acc[holding.id] = nextValue;
        if (current.holdings?.[holding.id] === undefined) {
          changed = true;
        }
        return acc;
      }, {});
      if (Object.keys(current.holdings ?? {}).length !== Object.keys(normalizedHoldings).length) {
        changed = true;
      }

      const normalizedLandmarks = tileSets.landmark.reduce<Record<string, boolean>>(
        (acc, landmark) => {
          const nextValue = current.landmarks?.[landmark.id] ?? false;
          acc[landmark.id] = nextValue;
          if (current.landmarks?.[landmark.id] === undefined) {
            changed = true;
          }
          return acc;
        },
        {}
      );
      if (
        Object.keys(current.landmarks ?? {}).length !== Object.keys(normalizedLandmarks).length
      ) {
        changed = true;
      }

      const normalizedMyths = myths.reduce<Record<number, boolean>>((acc, myth) => {
        const nextValue = current.myths?.[myth.id] ?? false;
        acc[myth.id] = nextValue;
        if (current.myths?.[myth.id] === undefined) {
          changed = true;
        }
        return acc;
      }, {});
      if (Object.keys(current.myths ?? {}).length !== Object.keys(normalizedMyths).length) {
        changed = true;
      }

      const seatOfPower = current.seatOfPower ?? true;
      if (current.seatOfPower === undefined) {
        changed = true;
      }

      const showBarriers =
        current.showBarriers ?? DEFAULT_VIEW_VISIBILITY.showBarriers;
      if (current.showBarriers === undefined) {
        changed = true;
      }

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        visibility: {
          ...prev.visibility,
          knight: {
            holdings: normalizedHoldings,
            seatOfPower,
            landmarks: normalizedLandmarks,
            myths: normalizedMyths,
            showBarriers,
          },
        },
      };
    });
  }, [tileSets, myths, setViewOptions]);

  const holdingsSummary = useMemo(() => {
    const hiddenCount = tileSets.holding.filter(
      (holding) => !(knightVisibility.holdings[holding.id] ?? true)
    ).length;
    const hiddenSeat = knightVisibility.seatOfPower ? 'visible' : 'hidden';
    if (tileSets.holding.length === 0) {
      return 'No holdings configured';
    }
    if (hiddenCount === 0 && hiddenSeat === 'visible') {
      return 'All holding markers visible';
    }
    const parts = [];
    if (hiddenCount > 0) {
      parts.push(`${hiddenCount} type${hiddenCount > 1 ? 's' : ''} hidden`);
    }
    if (hiddenSeat === 'hidden') {
      parts.push('Seat of Power hidden');
    }
    return parts.join('; ');
  }, [tileSets.holding, knightVisibility.holdings, knightVisibility.seatOfPower]);

  const landmarkSummary = useMemo(() => {
    const hiddenCount = tileSets.landmark.filter(
      (landmark) => !(knightVisibility.landmarks[landmark.id] ?? true)
    ).length;
    if (tileSets.landmark.length === 0) {
      return 'No landmarks configured';
    }
    return hiddenCount === 0
      ? 'All landmark markers visible'
      : `${hiddenCount} landmark type${hiddenCount > 1 ? 's' : ''} hidden`;
  }, [tileSets.landmark, knightVisibility.landmarks]);

  const mythSummary = useMemo(() => {
    if (myths.length === 0) {
      return 'No myths placed on the map';
    }
    const hiddenCount = myths.filter((myth) => !(knightVisibility.myths[myth.id] ?? true)).length;
    return hiddenCount === 0
      ? 'All myths visible'
      : `${hiddenCount} myth${hiddenCount > 1 ? 's' : ''} hidden`;
  }, [myths, knightVisibility.myths]);

  const handleHoldingsUpdate = (updater: (current: KnightVisibilitySettings) => KnightVisibilitySettings) => {
    setViewOptions((prev) => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        knight: updater(prev.visibility.knight),
      },
    }));
  };

  const handleHoldingToggle = (id: string, value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      holdings: { ...current.holdings, [id]: value },
    }));
  };

  const handleAllHoldings = (value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      holdings: tileSets.holding.reduce<Record<string, boolean>>((acc, holding) => {
        acc[holding.id] = value;
        return acc;
      }, {}),
    }));
  };

  const handleSeatToggle = (value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      seatOfPower: value,
    }));
  };

  const handleLandmarkToggle = (id: string, value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      landmarks: { ...current.landmarks, [id]: value },
    }));
  };

  const handleAllLandmarks = (value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      landmarks: tileSets.landmark.reduce<Record<string, boolean>>((acc, landmark) => {
        acc[landmark.id] = value;
        return acc;
      }, {}),
    }));
  };

  const handleMythToggle = (id: number, value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      myths: { ...current.myths, [id]: value },
    }));
  };

  const handleAllMyths = (value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      myths: myths.reduce<Record<number, boolean>>((acc, myth) => {
        acc[myth.id] = value;
        return acc;
      }, {}),
    }));
  };

  const handleBarriersToggle = (value: boolean) => {
    handleHoldingsUpdate((current) => ({
      ...current,
      showBarriers: value,
    }));
  };

  const handleReset = () => {
    const defaults = buildDefaultVisibility(tileSets, myths);
    handleHoldingsUpdate(() => defaults);
  };

  return (
    <div className="space-y-6">
      <SettingsSection title="Knight View Visibility">
        <p className="text-xs text-text-muted !mt-0">
          Choose which elements stay visible when you switch to the Knight (player-facing) view.
          Referee view will always show everything.
        </p>

        <VisibilityDropdown
          title="Holdings & Seat of Power"
          summary={holdingsSummary}
          helper="Toggle individual holding types or hide the Seat of Power highlight."
        >
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleAllHoldings(true)}
              className="rounded-md border border-border-panel-divider px-2 py-1 text-text-muted hover:bg-realm-command-panel-hover"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={() => handleAllHoldings(false)}
              className="rounded-md border border-border-panel-divider px-2 py-1 text-text-muted hover:bg-realm-command-panel-hover"
            >
              Hide All
            </button>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="seat-of-power-visibility"
              className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 hover:border-border-panel-divider transition-colors"
            >
              <div>
                <span className="block text-sm font-medium text-text-high-contrast">
                  Seat of Power Highlight
                </span>
                <span className="block text-xs text-text-muted">
                  Controls the golden frame that marks the Seat of Power hex.
                </span>
              </div>
              <Switch
                id="seat-of-power-visibility"
                checked={knightVisibility.seatOfPower}
                onChange={handleSeatToggle}
              />
            </label>
            {tileSets.holding.map((holding) => {
              const checkboxId = `holding-${holding.id}`;
              const isChecked = knightVisibility.holdings[holding.id] ?? true;
              return (
                <label
                  key={holding.id}
                  htmlFor={checkboxId}
                  className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 hover:border-border-panel-divider transition-colors"
                >
                  <span className="text-sm text-text-high-contrast">{holding.label}</span>
                  <Switch
                    id={checkboxId}
                    checked={isChecked}
                    onChange={(value) => handleHoldingToggle(holding.id, value)}
                  />
                </label>
              );
            })}
            {tileSets.holding.length === 0 ? (
              <p className="text-xs text-text-muted">No holding types are currently configured.</p>
            ) : null}
          </div>
        </VisibilityDropdown>

        <VisibilityDropdown
          title="Landmarks"
          summary={landmarkSummary}
          helper="Choose which landmark categories remain visible to players."
        >
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleAllLandmarks(true)}
              className="rounded-md border border-border-panel-divider px-2 py-1 text-text-muted hover:bg-realm-command-panel-hover"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={() => handleAllLandmarks(false)}
              className="rounded-md border border-border-panel-divider px-2 py-1 text-text-muted hover:bg-realm-command-panel-hover"
            >
              Hide All
            </button>
          </div>
          <div className="space-y-2">
            {tileSets.landmark.map((landmark) => {
              const checkboxId = `landmark-${landmark.id}`;
              const isChecked = knightVisibility.landmarks[landmark.id] ?? true;
              return (
                <label
                  key={landmark.id}
                  htmlFor={checkboxId}
                  className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 hover:border-border-panel-divider transition-colors"
                >
                  <span className="text-sm text-text-high-contrast">{landmark.label}</span>
                  <Switch
                    id={checkboxId}
                    checked={isChecked}
                    onChange={(value) => handleLandmarkToggle(landmark.id, value)}
                  />
                </label>
              );
            })}
            {tileSets.landmark.length === 0 ? (
              <p className="text-xs text-text-muted">
                No landmark types are currently configured.
              </p>
            ) : null}
          </div>
        </VisibilityDropdown>

        <VisibilityDropdown
          title="Myths"
          summary={mythSummary}
          helper="Hide individual myths when players should not see them yet."
        >
          {myths.length === 0 ? (
            <p className="text-xs text-text-muted">No myths have been placed on this map.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleAllMyths(true)}
                  className="rounded-md border border-border-panel-divider px-2 py-1 text-text-muted hover:bg-realm-command-panel-hover"
                >
                  Show All
                </button>
                <button
                  type="button"
                  onClick={() => handleAllMyths(false)}
                  className="rounded-md border border-border-panel-divider px-2 py-1 text-text-muted hover:bg-realm-command-panel-hover"
                >
                  Hide All
                </button>
              </div>
              <div className="space-y-2">
                {myths.map((myth) => {
                  const checkboxId = `myth-${myth.id}`;
                  const isChecked = knightVisibility.myths[myth.id] ?? true;
                  return (
                    <label
                      key={myth.id}
                      htmlFor={checkboxId}
                      className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 hover:border-border-panel-divider transition-colors"
                    >
                      <span className="text-sm text-text-high-contrast">Myth #{myth.id}</span>
                      <Switch
                        id={checkboxId}
                        checked={isChecked}
                        onChange={(value) => handleMythToggle(myth.id, value)}
                      />
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </VisibilityDropdown>

        <div className="rounded-md border border-border-panel-divider bg-realm-command-panel-surface px-4 py-3">
          <label
            htmlFor="show-barriers-toggle"
            className="flex items-center justify-between gap-3 cursor-pointer"
          >
            <div>
              <span className="block text-sm font-semibold text-text-high-contrast">Barriers</span>
              <span className="block text-xs text-text-muted">
                Toggle whether barrier lines are visible in Knight view.
              </span>
            </div>
            <Switch
              id="show-barriers-toggle"
              checked={knightVisibility.showBarriers}
              onChange={handleBarriersToggle}
            />
          </label>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-md border border-border-panel-divider bg-realm-command-panel-surface px-3 py-2 text-sm font-medium text-text-muted hover:bg-realm-command-panel-hover transition-colors"
        >
          <Icon name="reset" className="h-4 w-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
