/**
 * @file PresetControls.tsx
 * Renders a floating panel that lets users save and load up to three presets
 * directly to localStorage. Presets capture the full realm export payload so
 * that restoring a state is instant and offline-friendly.
 */

import React, { useCallback, useEffect, useId, useState } from 'react';
import type { RealmExportData } from '@/features/realm/types';
import { Icon } from './Icon';

const STORAGE_PREFIX = 'hex-realm-generator:preset:';
const SLOT_COUNT = 3;
const NAME_SUFFIX = ':name';
const COLLAPSE_STORAGE_KEY = `${STORAGE_PREFIX}collapsed`;

interface PresetControlsProps {
  /** Returns the current realm export payload, or null if the realm is unavailable. */
  getExportData: () => RealmExportData | null;
  /** Loads the provided preset payload into application state. */
  onLoadPreset: (data: RealmExportData) => void;
  /** Optional callback for surfacing status messages to the user. */
  onShowMessage?: (details: { title: string; message: string; isInfo?: boolean }) => void;
}

interface PresetSlot {
  index: number;
  data: RealmExportData | null;
  name: string;
}

const loadSlotFromStorage = (slotIndex: number): RealmExportData | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${slotIndex}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RealmExportData;
  } catch {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${slotIndex}`);
    return null;
  }
};

const getStoredCollapseState = (): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const defaultSlotName = (slotIndex: number) => `Preset ${slotIndex}`;

const loadSlotName = (slotIndex: number): string => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultSlotName(slotIndex);
  }
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${slotIndex}${NAME_SUFFIX}`);
    const trimmed = stored?.trim();
    if (!trimmed) {
      return defaultSlotName(slotIndex);
    }
    return trimmed.slice(0, 50);
  } catch {
    return defaultSlotName(slotIndex);
  }
};

const persistSlotName = (slotIndex: number, value: string) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const trimmed = value.trim();
    if (trimmed) {
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${slotIndex}${NAME_SUFFIX}`,
        trimmed.slice(0, 50)
      );
    } else {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${slotIndex}${NAME_SUFFIX}`);
    }
  } catch (error) {
    console.warn('Failed to persist preset name', error);
  }
};

/**
 * Floating preset controls rendered near the top-right corner of the viewport.
 */
export function PresetControls({
  getExportData,
  onLoadPreset,
  onShowMessage,
}: PresetControlsProps) {
  const [slots, setSlots] = useState<PresetSlot[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, idx) => ({
      index: idx + 1,
      data: loadSlotFromStorage(idx + 1),
      name: loadSlotName(idx + 1),
    }))
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => getStoredCollapseState());
  const panelId = useId();

  const refreshSlot = useCallback((slotIndex: number) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.index === slotIndex
          ? {
              ...slot,
              data: loadSlotFromStorage(slotIndex),
              name: loadSlotName(slotIndex),
            }
          : slot
      )
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || !event.key) return;
      if (event.key === COLLAPSE_STORAGE_KEY) {
        setIsCollapsed(event.newValue === 'true');
        return;
      }
      if (!event.key.startsWith(STORAGE_PREFIX)) return;
      const slotKey = event.key.replace(STORAGE_PREFIX, '');
      const slotIndex = Number(slotKey.split(NAME_SUFFIX)[0]);
      if (!Number.isNaN(slotIndex)) {
        refreshSlot(slotIndex);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshSlot]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
    } catch (error) {
      console.warn('Failed to persist preset collapse state', error);
    }
  }, [isCollapsed]);

  const showMessage = useCallback(
    (title: string, message: string, isInfo = true) => {
      onShowMessage?.({ title, message, isInfo });
    },
    [onShowMessage]
  );

  const handleSave = useCallback(
    (slotIndex: number) => {
      if (typeof window === 'undefined' || !window.localStorage) {
        showMessage(
          'Preset Unavailable',
          'Local storage is not accessible in this environment.',
          true
        );
        return;
      }
      const exportData = getExportData();
      if (!exportData) {
        showMessage('Nothing to Save', 'Generate or import a realm before saving a preset.', true);
        return;
      }
      try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${slotIndex}`, JSON.stringify(exportData));
        refreshSlot(slotIndex);
        const slotName =
          slots.find((s) => s.index === slotIndex)?.name?.trim() || defaultSlotName(slotIndex);
        showMessage('Preset Saved', `Stored the current realm in ${slotName}.`, true);
      } catch (error) {
        console.error('Failed to store preset', error);
        showMessage(
          'Save Failed',
          'Could not write to local storage. Free up space and try again.',
          true
        );
      }
    },
    [getExportData, refreshSlot, showMessage, slots]
  );

  const handleLoad = useCallback(
    (slotIndex: number) => {
      const slot = slots.find((s) => s.index === slotIndex);
      if (!slot?.data) {
        showMessage(
          'Empty Preset',
          `Preset ${slotIndex} is empty. Save a preset before loading.`,
          true
        );
        return;
      }
      onLoadPreset(slot.data);
    },
    [onLoadPreset, showMessage, slots]
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleSlotNameChange = useCallback((slotIndex: number, value: string) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.index === slotIndex ? { ...slot, name: value } : slot))
    );
  }, []);

  const handleSlotNameCommit = useCallback((slotIndex: number, value: string) => {
    const resolved = value.trim() ? value.trim().slice(0, 50) : defaultSlotName(slotIndex);
    persistSlotName(slotIndex, value);
    setSlots((prev) =>
      prev.map((slot) => (slot.index === slotIndex ? { ...slot, name: resolved } : slot))
    );
  }, []);

  const formatTimestamp = (value: string | undefined) => {
    if (!value) return 'No save yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleString();
  };

  const collapseToggleLabel = isCollapsed ? 'Expand preset controls' : 'Collapse preset controls';

  return (
    <div className="absolute left-4 top-[calc(4rem+0.5rem)] bg-realm-canvas-backdrop/80 border border-border-panel-divider rounded-lg shadow-lg w-60 z-10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-panel-divider">
        <div className="flex items-center gap-2">
          <Icon name="layers" className="w-4 h-4 text-text-muted" aria-hidden="true" />
          <span className="text-sm font-semibold text-text-high-contrast">Presets</span>
        </div>
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-1 rounded-md text-text-muted hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
          aria-expanded={!isCollapsed}
          aria-controls={panelId}
        >
          <Icon
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            className="w-4 h-4"
            aria-hidden="true"
          />
          <span className="sr-only">{collapseToggleLabel}</span>
        </button>
      </div>
      <div
        id={panelId}
        aria-hidden={isCollapsed}
        className={`transition-all duration-200 ease-out text-xs text-text-muted ${
          isCollapsed
            ? 'max-h-0 opacity-0 overflow-hidden pointer-events-none px-3'
            : 'max-h-[28rem] opacity-100 px-3 pb-3'
        }`}
      >
        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot.index}
              className="border border-border-panel-divider/60 rounded-md p-2 bg-realm-command-panel-surface/40"
            >
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`preset-name-${slot.index}`} className="sr-only">
                  Preset {slot.index} name
                </label>
                <input
                  id={`preset-name-${slot.index}`}
                  value={slot.name}
                  onChange={(event) => handleSlotNameChange(slot.index, event.target.value)}
                  onBlur={(event) => handleSlotNameCommit(slot.index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.blur();
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      handleSlotNameChange(slot.index, loadSlotName(slot.index));
                      event.currentTarget.blur();
                    }
                  }}
                  maxLength={50}
                  className="flex-1 min-w-0 px-2 py-1 rounded-md bg-realm-command-panel-surface border border-transparent focus:border-actions-command-primary/60 focus:outline-none text-sm font-semibold text-text-high-contrast"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(slot.index)}
                    className="px-2 py-1 rounded-md bg-actions-command-primary/20 hover:bg-actions-command-primary/40 text-text-high-contrast transition-colors"
                    title={`Save current realm to ${slot.name.trim() || defaultSlotName(slot.index)}`}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoad(slot.index)}
                    disabled={!slot.data}
                    className="px-2 py-1 rounded-md bg-realm-command-panel-hover hover:bg-realm-command-panel-hover/80 text-text-high-contrast transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Load ${slot.name.trim() || defaultSlotName(slot.index)}`}
                  >
                    Load
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-tight">
                {formatTimestamp(slot.data?.metadata?.exportedAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
