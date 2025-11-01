/**
 * @file PoiPainterSidebar.tsx
 * This component renders the sidebar for the "Points of Interest" painter tool.
 * It allows the user to select a holding, landmark, or action to apply to hexes on the map.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import {
  SPECIAL_POI_ICONS,
  DEFAULT_POI_ICON_COLOR,
  DEFAULT_POI_BACKDROP_COLOR,
  DEFAULT_SEAT_OF_POWER_ICON_COLOR,
  DEFAULT_SEAT_OF_POWER_BACKDROP_COLOR,
} from '@/features/realm/config/constants';
import type { Tile, TileSet } from '@/features/realm/types';
import { TerrainColorSwatch } from '../ui/TerrainColorSwatch';

/**
 * Props for the PoiPainterSidebar component.
 */
interface PoiPainterSidebarProps {
  /** The currently selected POI for painting, as a 'type:id' string. */
  paintPoi: string | null;
  /** Callback to set the POI to be painted. */
  setPaintPoi: (poi: string) => void;
  /** Callback to close the sidebar. */
  onClose: () => void;
  /** Callback to activate the tile picking mode. */
  onStartPicking: () => void;
  /** Whether the tile picking mode is currently active. */
  isPickingTile: boolean;
  /** Available POI tiles. */
  tileSets: TileSet;
  /** Update handler for marker icon uploads. */
  onUpdatePoiMarkerIcon: (category: 'holding' | 'landmark', id: string, dataUrl: string) => void;
  /** Update handler for marker backdrop uploads. */
  onUpdatePoiMarkerBackdrop: (
    category: 'holding' | 'landmark',
    id: string,
    dataUrl: string
  ) => void;
  /** Tint color applied to marker icons on the map. */
  poiIconColor: string | null;
  /** Tint color applied to marker backplates on the map. */
  poiBackdropColor: string | null;
  /** Setter for marker icon tint. */
  onChangePoiIconColor: (color: string | null) => void;
  /** Setter for marker backdrop tint. */
  onChangePoiBackdropColor: (color: string | null) => void;
  /** Seat of power icon tint. */
  seatOfPowerIconColor: string;
  /** Seat of power backdrop tint. */
  seatOfPowerBackdropColor: string;
}

interface PoiButtonProps {
  item: Tile;
  category: 'holding' | 'landmark' | 'action';
  isSelected: boolean;
  onSelect: () => void;
  onUploadIcon?: (dataUrl: string) => void;
  onUploadBackdrop?: (dataUrl: string) => void;
  iconColor: string | null;
  backdropColor: string | null;
}

const createMaskStyle = (src: string): React.CSSProperties => ({
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
});

const PoiButton = ({
  item,
  category,
  isSelected,
  onSelect,
  onUploadIcon,
  onUploadBackdrop,
  iconColor,
  backdropColor,
}: PoiButtonProps) => {
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const backdropInputRef = useRef<HTMLInputElement | null>(null);

  const handleIconUploadClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    iconInputRef.current?.click();
  }, []);

  const handleBackdropUploadClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    backdropInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, uploader?: (dataUrl: string) => void) => {
      const file = event.target.files?.[0];
      if (!file || !uploader) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          uploader(reader.result);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    []
  );

  const hasMarkerAsset = Boolean(item.markerIcon);
  const hasBackdropAsset = Boolean(item.markerBackdrop);

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-2 text-center transition-all duration-150 ${
        isSelected
          ? 'bg-actions-command-primary/20 border-actions-command-primary text-text-high-contrast'
          : 'bg-realm-map-viewport border-border-panel-divider text-text-muted hover:border-text-muted'
      }`}
      title={`Place ${item.label}`}
      aria-label={`Select ${item.label} for placement`}
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        {hasBackdropAsset && (
          <>
            {backdropColor ? (
              <span
                className="absolute inset-0"
                style={{
                  backgroundColor: backdropColor,
                  pointerEvents: 'none',
                  ...createMaskStyle(item.markerBackdrop!),
                }}
              />
            ) : (
              <img
                src={item.markerBackdrop ?? ''}
                alt={`${item.label} backdrop`}
                className="absolute inset-0 h-full w-full object-contain pointer-events-none"
              />
            )}
          </>
        )}
        {hasMarkerAsset ? (
          iconColor ? (
            <span
              className="absolute inset-0"
              style={{
                backgroundColor: iconColor,
                pointerEvents: 'none',
                ...createMaskStyle(item.markerIcon!),
              }}
            />
          ) : (
            <img
              src={item.markerIcon ?? ''}
              alt={`${item.label} icon`}
              className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            />
          )
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-realm-command-panel-surface">
            <Icon
              name={item.icon}
              className="h-8 w-8 text-text-high-contrast"
              strokeWidth={2}
              style={iconColor ? { color: iconColor } : undefined}
            />
          </div>
        )}

        {category !== 'action' && (
          <>
            {onUploadBackdrop && (
              <>
                <button
                  type="button"
                  onClick={handleBackdropUploadClick}
                  className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-realm-command-panel-surface text-text-muted shadow-md transition-colors hover:bg-actions-command-primary hover:text-text-high-contrast"
                  title="Upload backplate"
                  aria-label="Upload backplate"
                >
                  <Icon name="layers" className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={backdropInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(event, onUploadBackdrop)}
                  className="sr-only"
                />
              </>
            )}
            {onUploadIcon && (
              <>
                <button
                  type="button"
                  onClick={handleIconUploadClick}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-realm-command-panel-surface text-text-muted shadow-md transition-colors hover:bg-actions-command-primary hover:text-text-high-contrast"
                  title="Upload icon"
                  aria-label="Upload icon"
                >
                  <Icon name="upload" className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={iconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(event, onUploadIcon)}
                  className="sr-only"
                />
              </>
            )}
          </>
        )}
      </div>
      <span className="text-xs font-medium">{item.label}</span>
    </button>
  );
};

const PoiSection = ({
  title,
  items,
  category,
  paintPoi,
  setPaintPoi,
  iconColor,
  backdropColor,
  onUploadIcon,
  onUploadBackdrop,
  seatOfPowerIconColor,
  seatOfPowerBackdropColor,
}: {
  title: string;
  items: Tile[];
  category: 'holding' | 'landmark' | 'action';
  paintPoi: string | null;
  setPaintPoi: (poi: string) => void;
  iconColor: string | null;
  backdropColor: string | null;
  onUploadIcon?: (id: string) => (dataUrl: string) => void;
  onUploadBackdrop?: (id: string) => (dataUrl: string) => void;
  seatOfPowerIconColor?: string;
  seatOfPowerBackdropColor?: string;
}) => (
  <div>
    <h3 className="mb-2 text-lg font-semibold text-text-muted">{title}</h3>
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const fullId = `${category}:${item.id}`;
        const isSeatOfPowerAction = category === 'action' && item.id === 'seatOfPower';
        const appliedIconColor = isSeatOfPowerAction
          ? (seatOfPowerIconColor ?? DEFAULT_SEAT_OF_POWER_ICON_COLOR)
          : category === 'action'
          ? null
          : iconColor;
        const appliedBackdropColor = isSeatOfPowerAction
          ? seatOfPowerBackdropColor ?? DEFAULT_SEAT_OF_POWER_BACKDROP_COLOR
          : category === 'action'
          ? null
          : backdropColor;
        return (
          <PoiButton
            key={fullId}
            item={item}
            category={category}
            isSelected={paintPoi === fullId}
            onSelect={() => setPaintPoi(fullId)}
            iconColor={appliedIconColor}
            backdropColor={appliedBackdropColor}
            onUploadIcon={
              category === 'action' || !onUploadIcon ? undefined : onUploadIcon(item.id)
            }
            onUploadBackdrop={
              category === 'action' || !onUploadBackdrop ? undefined : onUploadBackdrop(item.id)
            }
          />
        );
      })}
    </div>
  </div>
);

/**
 * The sidebar component for the POI painting tool.
 */
export function PoiPainterSidebar({
  paintPoi,
  setPaintPoi,
  onClose,
  onStartPicking,
  isPickingTile,
  tileSets,
  onUpdatePoiMarkerIcon,
  onUpdatePoiMarkerBackdrop,
  poiIconColor,
  poiBackdropColor,
  onChangePoiIconColor,
  onChangePoiBackdropColor,
  seatOfPowerIconColor,
  seatOfPowerBackdropColor,
}: PoiPainterSidebarProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        onStartPicking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartPicking]);

  const defaultIconColor = (DEFAULT_POI_ICON_COLOR ?? '#000000').toUpperCase();
  const iconSwatchColor = (poiIconColor ?? defaultIconColor).toUpperCase();
  const iconHasCustomColor =
    poiIconColor !== null && poiIconColor.toUpperCase() !== defaultIconColor;

  const handleIconColorSwatchChange = useCallback(
    (value: string) => {
      onChangePoiIconColor(value.toUpperCase());
    },
    [onChangePoiIconColor]
  );

  const handleResetIconColor = useCallback(() => {
    onChangePoiIconColor(defaultIconColor);
  }, [defaultIconColor, onChangePoiIconColor]);

  const fallbackBackdropSwatch = DEFAULT_POI_BACKDROP_COLOR;
  const backdropSwatchColor = (poiBackdropColor ?? fallbackBackdropSwatch).toUpperCase();
  const backdropHasCustomColor = poiBackdropColor !== DEFAULT_POI_BACKDROP_COLOR;

  const handleBackdropColorSwatchChange = useCallback(
    (value: string) => {
      onChangePoiBackdropColor(value.toUpperCase());
    },
    [onChangePoiBackdropColor]
  );

  const handleResetBackdropColor = useCallback(() => {
    onChangePoiBackdropColor(DEFAULT_POI_BACKDROP_COLOR);
  }, [onChangePoiBackdropColor]);

  return (
    <aside className="w-80 bg-realm-canvas-backdrop border-l border-border-panel-divider p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Points of Interest</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onStartPicking}
            className={`p-2 rounded-md transition-colors ${
              isPickingTile
                ? 'bg-actions-command-primary text-text-high-contrast'
                : 'text-text-muted hover:bg-realm-command-panel-hover'
            }`}
            title="Pick POI from Map (Ctrl+I)"
            aria-label="Pick POI from Map"
          >
            <Icon name="pipette" className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-realm-command-panel-hover"
            aria-label="Close POI Painter"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-6 overflow-y-auto pr-2">
        {isPickingTile && (
          <div className="bg-feedback-info-panel/50 text-center text-sm text-text-subtle p-2 rounded-md mb-4 animate-pulse">
            Click on the map to pick a POI.
          </div>
        )}
        <section className="space-y-4 rounded-lg border border-border-panel-divider bg-realm-map-viewport/60 p-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Marker Appearance
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <TerrainColorSwatch
                color={iconSwatchColor}
                ariaLabel="Select POI icon color"
                tooltip="Select POI icon color"
                onChange={handleIconColorSwatchChange}
                onReset={iconHasCustomColor ? handleResetIconColor : undefined}
                canReset={iconHasCustomColor}
                className="h-10 w-10 rounded-md"
                iconClassName="w-4 h-4 text-white"
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Icon
                </span>
                <span className="text-xs text-text-muted">
                  {iconHasCustomColor ? iconSwatchColor : `Default (${defaultIconColor})`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TerrainColorSwatch
                color={backdropSwatchColor}
                ariaLabel="Select POI backplate color"
                tooltip="Select POI backplate color"
                onChange={handleBackdropColorSwatchChange}
                onReset={backdropHasCustomColor ? handleResetBackdropColor : undefined}
                canReset={backdropHasCustomColor}
                className="h-10 w-10 rounded-md"
                iconClassName="w-4 h-4 text-white"
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Backplate
                </span>
                <span className="text-xs text-text-muted">
                  {backdropHasCustomColor ? backdropSwatchColor : 'Original artwork'}
                </span>
            </div>
          </div>
        </div>
      </section>

        <p className="text-sm text-text-muted">
          Select an item, then click a hex to place it. Use the upload controls to override icons or
          backplates.
        </p>
        <PoiSection
          title="Actions"
          items={SPECIAL_POI_ICONS}
          category="action"
          paintPoi={paintPoi}
          setPaintPoi={setPaintPoi}
          iconColor={poiIconColor}
          backdropColor={poiBackdropColor}
          seatOfPowerIconColor={seatOfPowerIconColor}
          seatOfPowerBackdropColor={seatOfPowerBackdropColor}
        />
        <PoiSection
          title="Holdings"
          items={tileSets.holding}
          category="holding"
          paintPoi={paintPoi}
          setPaintPoi={setPaintPoi}
          iconColor={poiIconColor}
          backdropColor={poiBackdropColor}
          onUploadIcon={(id) => (dataUrl) => onUpdatePoiMarkerIcon('holding', id, dataUrl)}
          onUploadBackdrop={(id) => (dataUrl) => onUpdatePoiMarkerBackdrop('holding', id, dataUrl)}
        />
        <PoiSection
          title="Landmarks"
          items={tileSets.landmark}
          category="landmark"
          paintPoi={paintPoi}
          setPaintPoi={setPaintPoi}
          iconColor={poiIconColor}
          backdropColor={poiBackdropColor}
          onUploadIcon={(id) => (dataUrl) => onUpdatePoiMarkerIcon('landmark', id, dataUrl)}
          onUploadBackdrop={(id) => (dataUrl) => onUpdatePoiMarkerBackdrop('landmark', id, dataUrl)}
        />
      </div>
    </aside>
  );
}
