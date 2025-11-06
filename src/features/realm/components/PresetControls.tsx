/**
 * @file PresetControls.tsx
 * Renders a floating panel that lets users save and load up to three presets
 * with optional persistence to localStorage once the user grants consent.
 * Presets capture the full realm export payload so that restoring a state is
 * instant and offline-friendly.
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { RealmExportData } from '@/features/realm/types';
import { Icon } from './Icon';

const STORAGE_PREFIX = 'hex-realm-generator:preset:';
const SLOT_COUNT = 3;
const NAME_SUFFIX = ':name';
const COLLAPSE_STORAGE_KEY = `${STORAGE_PREFIX}collapsed`;
const STORAGE_CONSENT_KEY = `${STORAGE_PREFIX}storage-consent`;

type StorageMode = 'prompt' | 'local' | 'memory';

const safeGetLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

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

const loadSlotFromStorage = (
  storage: Storage | null,
  slotIndex: number
): RealmExportData | null => {
  if (!storage) return null;
  const raw = storage.getItem(`${STORAGE_PREFIX}${slotIndex}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RealmExportData;
  } catch {
    storage.removeItem(`${STORAGE_PREFIX}${slotIndex}`);
    return null;
  }
};

const getStoredCollapseState = (storage: Storage | null): boolean => {
  if (!storage) {
    return false;
  }
  try {
    return storage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const defaultSlotName = (slotIndex: number) => `Preset ${slotIndex}`;

const loadSlotName = (storage: Storage | null, slotIndex: number): string => {
  if (!storage) {
    return defaultSlotName(slotIndex);
  }
  try {
    const stored = storage.getItem(`${STORAGE_PREFIX}${slotIndex}${NAME_SUFFIX}`);
    const trimmed = stored?.trim();
    if (!trimmed) {
      return defaultSlotName(slotIndex);
    }
    return trimmed.slice(0, 50);
  } catch {
    return defaultSlotName(slotIndex);
  }
};

const persistSlotName = (storage: Storage | null, slotIndex: number, value: string) => {
  if (!storage) {
    return;
  }
  try {
    const trimmed = value.trim();
    if (trimmed) {
      storage.setItem(`${STORAGE_PREFIX}${slotIndex}${NAME_SUFFIX}`, trimmed.slice(0, 50));
    } else {
      storage.removeItem(`${STORAGE_PREFIX}${slotIndex}${NAME_SUFFIX}`);
    }
  } catch (error) {
    console.warn('Failed to persist preset name', error);
  }
};

const createSlots = (storage: Storage | null): PresetSlot[] =>
  Array.from({ length: SLOT_COUNT }, (_, idx) => ({
    index: idx + 1,
    data: loadSlotFromStorage(storage, idx + 1),
    name: loadSlotName(storage, idx + 1),
  }));

/**
 * Floating preset controls rendered near the top-right corner of the viewport.
 */
export function PresetControls({
  getExportData,
  onLoadPreset,
  onShowMessage,
}: PresetControlsProps) {
  const initialConfig = useMemo(() => {
    const storage = safeGetLocalStorage();
    if (!storage) {
      return {
        mode: 'memory' as StorageMode,
        slots: createSlots(null),
        collapsed: false,
        storageAvailable: false,
      };
    }
    const consentGranted = storage.getItem(STORAGE_CONSENT_KEY) === 'granted';
    return {
      mode: consentGranted ? ('local' as StorageMode) : ('prompt' as StorageMode),
      slots: consentGranted ? createSlots(storage) : createSlots(null),
      collapsed: consentGranted ? getStoredCollapseState(storage) : false,
      storageAvailable: true,
    };
  }, []);

  const [storageMode, setStorageMode] = useState<StorageMode>(initialConfig.mode);
  const [slots, setSlots] = useState<PresetSlot[]>(initialConfig.slots);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(initialConfig.collapsed);
  const lastCommittedNamesRef = useRef<Map<number, string>>(
    new Map(initialConfig.slots.map((slot) => [slot.index, slot.name]))
  );
  const isLocalStorageAvailable = initialConfig.storageAvailable;
  const isLocalStorageEnabled = storageMode === 'local';
  const panelId = useId();

  const refreshSlot = useCallback(
    (slotIndex: number) => {
      if (!isLocalStorageEnabled) {
        return;
      }
      const storage = safeGetLocalStorage();
      if (!storage) {
        setStorageMode('memory');
        return;
      }
      const nextData = loadSlotFromStorage(storage, slotIndex);
      const nextName = loadSlotName(storage, slotIndex);
      lastCommittedNamesRef.current.set(slotIndex, nextName);
      setSlots((prev) =>
        prev.map((slot) =>
          slot.index === slotIndex
            ? {
                ...slot,
                data: nextData,
                name: nextName,
              }
            : slot
        )
      );
    },
    [isLocalStorageEnabled, lastCommittedNamesRef, setStorageMode]
  );

  useEffect(() => {
    if (!isLocalStorageEnabled || typeof window === 'undefined') {
      return;
    }
    const storage = safeGetLocalStorage();
    if (!storage) {
      setStorageMode('memory');
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== storage || !event.key) return;
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
  }, [isLocalStorageEnabled, refreshSlot, setStorageMode]);

  useEffect(() => {
    if (!isLocalStorageEnabled) {
      return;
    }
    const storage = safeGetLocalStorage();
    if (!storage) {
      setStorageMode('memory');
      return;
    }
    try {
      storage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
    } catch (error) {
      console.warn('Failed to persist preset collapse state', error);
      setStorageMode('memory');
    }
  }, [isCollapsed, isLocalStorageEnabled, setStorageMode]);

  const showMessage = useCallback(
    (title: string, message: string, isInfo = true) => {
      onShowMessage?.({ title, message, isInfo });
    },
    [onShowMessage]
  );

  const handleSave = useCallback(
    (slotIndex: number) => {
      const exportData = getExportData();
      if (!exportData) {
        showMessage('Nothing to Save', 'Generate or import a realm before saving a preset.', true);
        return;
      }
      const slotName =
        slots.find((s) => s.index === slotIndex)?.name?.trim() || defaultSlotName(slotIndex);

      if (!isLocalStorageEnabled) {
        setSlots((prev) =>
          prev.map((slot) => (slot.index === slotIndex ? { ...slot, data: exportData } : slot))
        );
        if (storageMode === 'prompt' && isLocalStorageAvailable) {
          showMessage(
            'Enable Preset Storage',
            `Allow local storage to keep ${slotName} between sessions. Presets saved now will last only for this session.`,
            true
          );
        } else {
          const reason = isLocalStorageAvailable
            ? `${slotName} is stored for this session only because local preset storage is disabled.`
            : `${slotName} is stored for this session only because local storage is unavailable in this environment.`;
          showMessage('Preset Saved', reason, true);
        }
        return;
      }

      const storage = safeGetLocalStorage();
      if (!storage) {
        setStorageMode('memory');
        setSlots((prev) =>
          prev.map((slot) => (slot.index === slotIndex ? { ...slot, data: exportData } : slot))
        );
        showMessage(
          'Preset Unavailable',
          `${slotName} was stored for this session only because local storage is currently unavailable.`,
          true
        );
        return;
      }

      try {
        storage.setItem(`${STORAGE_PREFIX}${slotIndex}`, JSON.stringify(exportData));
        refreshSlot(slotIndex);
        showMessage('Preset Saved', `Stored the current realm in ${slotName}.`, true);
      } catch (error) {
        console.error('Failed to store preset', error);
        showMessage(
          'Save Failed',
          `Could not write ${slotName} to local storage. The preset is available for this session only.`,
          true
        );
        setStorageMode('memory');
        try {
          storage.removeItem(STORAGE_CONSENT_KEY);
        } catch {
          // Ignore cleanup failures
        }
        setSlots((prev) =>
          prev.map((slot) => (slot.index === slotIndex ? { ...slot, data: exportData } : slot))
        );
      }
    },
    [
      getExportData,
      isLocalStorageAvailable,
      isLocalStorageEnabled,
      refreshSlot,
      setStorageMode,
      showMessage,
      slots,
      storageMode,
    ]
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

  const handleEnableLocalStorage = useCallback(() => {
    const storage = safeGetLocalStorage();
    if (!storage) {
      showMessage(
        'Storage Unavailable',
        'Local storage cannot be accessed in this environment.',
        true
      );
      setStorageMode('memory');
      return;
    }
    try {
      storage.setItem(STORAGE_CONSENT_KEY, 'granted');
      slots.forEach((slot) => {
        if (slot.data) {
          storage.setItem(`${STORAGE_PREFIX}${slot.index}`, JSON.stringify(slot.data));
        } else {
          storage.removeItem(`${STORAGE_PREFIX}${slot.index}`);
        }
        persistSlotName(storage, slot.index, slot.name);
      });
      storage.setItem(COLLAPSE_STORAGE_KEY, String(isCollapsed));
      const nextSlots = createSlots(storage);
      setSlots(nextSlots);
      lastCommittedNamesRef.current = new Map(nextSlots.map((slot) => [slot.index, slot.name]));
      setStorageMode('local');
      showMessage(
        'Preset Storage Enabled',
        'Presets you save will now persist between sessions.',
        true
      );
    } catch (error) {
      console.error('Failed to enable preset storage', error);
      try {
        storage.removeItem(STORAGE_CONSENT_KEY);
      } catch {
        // Ignore cleanup failures
      }
      showMessage(
        'Storage Error',
        'Could not enable local storage. Presets will remain available for this session only.',
        true
      );
      setStorageMode('memory');
    }
  }, [isCollapsed, lastCommittedNamesRef, setSlots, setStorageMode, showMessage, slots]);

  const handleDeclineLocalStorage = useCallback(() => {
    setStorageMode('memory');
    showMessage(
      'Preset Storage Disabled',
      'Presets you save will be kept only for this session. You can enable local storage at any time.',
      true
    );
  }, [setStorageMode, showMessage]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleSlotNameChange = useCallback((slotIndex: number, value: string) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.index === slotIndex ? { ...slot, name: value } : slot))
    );
  }, []);

  const handleSlotNameCommit = useCallback(
    (slotIndex: number, value: string) => {
      const resolved = value.trim() ? value.trim().slice(0, 50) : defaultSlotName(slotIndex);
      if (isLocalStorageEnabled) {
        const storage = safeGetLocalStorage();
        if (storage) {
          persistSlotName(storage, slotIndex, value);
        } else {
          setStorageMode('memory');
        }
      }
      setSlots((prev) =>
        prev.map((slot) => (slot.index === slotIndex ? { ...slot, name: resolved } : slot))
      );
      lastCommittedNamesRef.current.set(slotIndex, resolved);
    },
    [isLocalStorageEnabled, lastCommittedNamesRef, setStorageMode]
  );

  const formatTimestamp = (value: string | undefined) => {
    if (!value) return 'No save yet';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleString();
  };

  const collapseToggleLabel = isCollapsed ? 'Expand preset controls' : 'Collapse preset controls';
  const storageNotice = (() => {
    if (!isLocalStorageAvailable) {
      return (
        <div className="rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 px-2 py-2 text-[11px] leading-tight text-text-muted">
          Local storage is not available. Presets stay available only while this tab is open.
        </div>
      );
    }
    if (storageMode === 'prompt') {
      return (
        <div className="rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 px-2 py-2">
          <p className="text-[11px] leading-tight text-text-muted">
            Allow this app to store presets in your browser so they persist between sessions?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleEnableLocalStorage}
              className="flex-1 px-2 py-1 rounded-md bg-actions-command-primary/20 hover:bg-actions-command-primary/40 text-text-high-contrast transition-colors"
            >
              Allow
            </button>
            <button
              type="button"
              onClick={handleDeclineLocalStorage}
              className="flex-1 px-2 py-1 rounded-md bg-realm-command-panel-hover hover:bg-realm-command-panel-hover/80 text-text-high-contrast transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      );
    }
    if (storageMode === 'memory') {
      return (
        <div className="rounded-md border border-border-panel-divider/60 bg-realm-command-panel-surface/40 px-2 py-2">
          <p className="text-[11px] leading-tight text-text-muted">
            Presets you save will reset when this tab closes.
          </p>
          <button
            type="button"
            onClick={handleEnableLocalStorage}
            className="mt-2 w-full px-2 py-1 rounded-md bg-actions-command-primary/20 hover:bg-actions-command-primary/40 text-text-high-contrast transition-colors"
          >
            Enable local preset storage
          </button>
        </div>
      );
    }
    return null;
  })();

  return (
    <div
      className="absolute left-4 top-[calc(4rem+0.5rem)] bg-realm-canvas-backdrop/80 border border-border-panel-divider rounded-lg shadow-lg w-60 z-10"
      data-tour-id="preset-controls"
    >
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
          {storageNotice}
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
                      if (isLocalStorageEnabled) {
                        const storage = safeGetLocalStorage();
                        if (storage) {
                          const persistedName = loadSlotName(storage, slot.index);
                          handleSlotNameChange(slot.index, persistedName);
                          lastCommittedNamesRef.current.set(slot.index, persistedName);
                        } else {
                          setStorageMode('memory');
                          const fallback =
                            lastCommittedNamesRef.current.get(slot.index) ??
                            defaultSlotName(slot.index);
                          handleSlotNameChange(slot.index, fallback);
                        }
                      } else {
                        const fallback =
                          lastCommittedNamesRef.current.get(slot.index) ??
                          defaultSlotName(slot.index);
                        handleSlotNameChange(slot.index, fallback);
                      }
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
