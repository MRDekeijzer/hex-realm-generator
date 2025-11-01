import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import type {
  ColorPresetDefinition,
  GenerationPresetDefinition,
} from '@/features/realm/config/realmPresets';

interface RealmPresetsModalProps {
  isOpen: boolean;
  generationPresets: GenerationPresetDefinition[];
  colorPresets: ColorPresetDefinition[];
  initialGenerationPresetId: string | null;
  initialColorPresetId: string;
  onPreviewGenerationPreset: (presetId: string) => void;
  onPreviewColorPreset: (presetId: string) => void;
  onApply: (selection: { generationPresetId: string | null; colorPresetId: string }) => void;
  onCancel: () => void;
}

const cardBaseClasses =
  'group relative flex flex-col gap-3 rounded-lg border border-border-panel-divider bg-realm-map-viewport p-4 text-left transition shadow-sm hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/80';

export function RealmPresetsModal({
  isOpen,
  generationPresets,
  colorPresets,
  initialGenerationPresetId,
  initialColorPresetId,
  onPreviewGenerationPreset,
  onPreviewColorPreset,
  onApply,
  onCancel,
}: RealmPresetsModalProps) {
  const defaultGenerationId = useMemo(
    () => initialGenerationPresetId ?? generationPresets[0]?.id ?? null,
    [initialGenerationPresetId, generationPresets]
  );
  const defaultColorId = useMemo(
    () => initialColorPresetId ?? colorPresets[0]?.id ?? '',
    [initialColorPresetId, colorPresets]
  );

  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(
    defaultGenerationId
  );
  const [selectedColorId, setSelectedColorId] = useState<string>(defaultColorId);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedGenerationId(defaultGenerationId);
    setSelectedColorId(defaultColorId);
  }, [isOpen, defaultGenerationId, defaultColorId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  const handleSelectGeneration = (presetId: string) => {
    if (presetId === selectedGenerationId) {
      onPreviewGenerationPreset(presetId);
      return;
    }
    setSelectedGenerationId(presetId);
    onPreviewGenerationPreset(presetId);
  };

  const handleSelectColor = (presetId: string) => {
    if (presetId === selectedColorId) {
      onPreviewColorPreset(presetId);
      return;
    }
    setSelectedColorId(presetId);
    onPreviewColorPreset(presetId);
  };

  const cyclePreset = (
    collection: { id: string }[],
    currentId: string | null,
    direction: 1 | -1,
    onSelect: (id: string) => void
  ) => {
    if (collection.length === 0) return;
    const currentIndex = collection.findIndex((item) => item.id === currentId);
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + collection.length) % collection.length;
    onSelect(collection[nextIndex].id);
  };

  const handleApply = () => {
    onApply({
      generationPresetId: selectedGenerationId ?? null,
      colorPresetId: selectedColorId,
    });
  };

  const renderDetailsOverlay = (details: string[]) => (
    <div className="pointer-events-none absolute inset-0 rounded-lg border border-actions-command-primary/40 opacity-0 transition-opacity group-hover:opacity-100">
      <div className="absolute inset-x-0 bottom-0 space-y-1 rounded-b-lg bg-realm-canvas-backdrop/95 p-3 text-[11px] leading-snug text-text-muted backdrop-blur-sm">
        {details.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-scrim p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="realm-presets-title"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border-panel-divider bg-realm-canvas-backdrop shadow-xl animate-fade-in">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-text-muted transition-colors hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
          aria-label="Close realm presets"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>

        <header className="space-y-2 border-b border-border-panel-divider bg-realm-map-viewport px-6 py-6 pr-14">
          <h2
            id="realm-presets-title"
            className="text-xl font-semibold text-text-high-contrast leading-tight"
          >
            Realm Presets
          </h2>
          <p className="text-sm text-text-muted">
            Jump-start a fresh map with curated generation mixes, then shift palettes instantly to
            match the vibe you need.
          </p>
        </header>

        <div className="flex flex-col gap-6 bg-realm-canvas-backdrop px-6 py-6">
          <section aria-labelledby="generation-preset-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3
                  id="generation-preset-heading"
                  className="text-sm font-semibold uppercase tracking-wide text-text-high-contrast"
                >
                  Terrain Generation Presets
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  Clicking previews immediately; use the arrows to cycle quickly.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    cyclePreset(generationPresets, selectedGenerationId, -1, handleSelectGeneration)
                  }
                  className="rounded-md border border-border-panel-divider bg-realm-map-viewport p-2 text-text-muted transition hover:bg-realm-map-viewport/80 hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
                >
                  <Icon name="arrow-left" className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Preview previous generation preset</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    cyclePreset(generationPresets, selectedGenerationId, 1, handleSelectGeneration)
                  }
                  className="rounded-md border border-border-panel-divider bg-realm-map-viewport p-2 text-text-muted transition hover:bg-realm-map-viewport/80 hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
                >
                  <Icon name="arrow-right" className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Preview next generation preset</span>
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {generationPresets.map((preset) => {
                const isActive = preset.id === selectedGenerationId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectGeneration(preset.id)}
                    className={`${cardBaseClasses} ${
                      isActive
                        ? 'border-actions-command-primary/80 bg-actions-command-primary/15 shadow-lg'
                        : 'hover:bg-realm-map-viewport/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-md bg-actions-command-primary/20 p-2 text-actions-command-primary">
                        <Icon name={preset.icon} className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-text-high-contrast leading-tight">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-text-muted">{preset.description}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-[11px] text-text-muted">
                      <span>{isActive ? 'Previewing' : 'Click to preview'}</span>
                      <Icon name="arrow-right" className="h-3 w-3 opacity-70" aria-hidden="true" />
                    </div>
                    {renderDetailsOverlay(preset.details)}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="color-preset-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3
                  id="color-preset-heading"
                  className="text-sm font-semibold uppercase tracking-wide text-text-high-contrast"
                >
                  Color Palettes
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  Harmonise the map and exports with high-impact palette swaps.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    cyclePreset(colorPresets, selectedColorId, -1, handleSelectColor)
                  }
                  className="rounded-md border border-border-panel-divider bg-realm-map-viewport p-2 text-text-muted transition hover:bg-realm-map-viewport/80 hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
                >
                  <Icon name="arrow-left" className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Preview previous color preset</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    cyclePreset(colorPresets, selectedColorId, 1, handleSelectColor)
                  }
                  className="rounded-md border border-border-panel-divider bg-realm-map-viewport p-2 text-text-muted transition hover:bg-realm-map-viewport/80 hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
                >
                  <Icon name="arrow-right" className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Preview next color preset</span>
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {colorPresets.map((preset) => {
                const isActive = preset.id === selectedColorId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectColor(preset.id)}
                    className={`${cardBaseClasses} ${
                      isActive
                        ? 'border-actions-command-primary/80 bg-actions-command-primary/15 shadow-lg'
                        : 'hover:bg-realm-map-viewport/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-md bg-actions-command-primary/20 p-2 text-actions-command-primary">
                        <Icon name={preset.icon} className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-text-high-contrast leading-tight">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-text-muted">{preset.description}</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-[11px] text-text-muted">
                      <span>{isActive ? 'Previewing' : 'Click to preview'}</span>
                      <Icon name="arrow-right" className="h-3 w-3 opacity-70" aria-hidden="true" />
                    </div>
                    {renderDetailsOverlay(preset.details)}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border-panel-divider bg-realm-map-viewport px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <span>Tip:</span>
            <span>
              Press{' '}
              <kbd className="rounded border border-border-panel-divider bg-realm-command-panel-surface px-1.5 py-0.5 text-[11px] font-medium text-text-high-contrast shadow-sm">
                P
              </kbd>{' '}
              to toggle this modal.
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border-panel-divider bg-realm-command-panel-surface px-4 py-2 text-sm font-medium text-text-high-contrast transition hover:bg-realm-command-panel-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-md bg-actions-command-primary px-4 py-2 text-sm font-semibold text-text-high-contrast transition hover:bg-actions-command-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
            >
              Apply &amp; Close
            </button>
          </div>
        </footer>
        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
          .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
