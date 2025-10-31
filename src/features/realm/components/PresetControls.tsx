/**
 * @file PresetControls.tsx
 * Renders a floating panel that lets users save and load up to three presets
 * directly to localStorage. Presets capture the full realm export payload so
 * that restoring a state is instant and offline-friendly.
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { RealmExportData } from '@/features/realm/types';
import { Icon } from './Icon';

const STORAGE_PREFIX = 'hex-realm-generator:preset:';
const SLOT_COUNT = 3;

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
    }))
  );

  const refreshSlot = useCallback((slotIndex: number) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.index === slotIndex ? { ...slot, data: loadSlotFromStorage(slotIndex) } : slot
      )
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || !event.key) return;
      if (!event.key.startsWith(STORAGE_PREFIX)) return;
      const slotIndex = Number(event.key.replace(STORAGE_PREFIX, ''));
      if (!Number.isNaN(slotIndex)) {
        refreshSlot(slotIndex);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshSlot]);

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
      } catch (error) {
        console.error('Failed to store preset', error);
        showMessage(
          'Save Failed',
          'Could not write to local storage. Free up space and try again.',
          true
        );
      }
    },
    [getExportData, refreshSlot, showMessage]
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

  const formatTimestamp = (value: string | undefined) => {
    if (!value) return 'No save yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleString();
  };

  return (
    <div className="absolute top-24 left-4 bg-realm-canvas-backdrop/80 border border-border-panel-divider rounded-lg shadow-lg w-60 z-10">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-panel-divider">
        <Icon name="layers" className="w-4 h-4 text-text-muted" aria-hidden="true" />
        <span className="text-sm font-semibold text-text-high-contrast">Presets</span>
      </div>
      <div className="p-3 space-y-3 text-xs text-text-muted">
        {slots.map((slot) => (
          <div
            key={slot.index}
            className="border border-border-panel-divider/60 rounded-md p-2 bg-realm-command-panel-surface/40"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-high-contrast">Preset {slot.index}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(slot.index)}
                  className="px-2 py-1 rounded-md bg-actions-command-primary/20 hover:bg-actions-command-primary/40 text-text-high-contrast transition-colors"
                  title={`Save current realm to Preset ${slot.index}`}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => handleLoad(slot.index)}
                  disabled={!slot.data}
                  className="px-2 py-1 rounded-md bg-realm-command-panel-hover hover:bg-realm-command-panel-hover/80 text-text-high-contrast transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Load Preset ${slot.index}`}
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
  );
}
