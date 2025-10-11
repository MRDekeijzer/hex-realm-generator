/**
 * @file A popover component for managing grid display settings.
 */

import React, { useMemo, useRef } from 'react';
import { Icon } from './Icon';
import type { ViewOptions } from '@/features/realm/types';
import { DEFAULT_GRID_COLOR, DEFAULT_GRID_WIDTH } from '@/features/realm/config/constants';

/**
 * Helper to convert RGBA string to hex and opacity.
 */
const rgbaToHexOpacity = (rgba: string): { hex: string; opacity: number } => {
  if (rgba.startsWith('#')) return { hex: rgba, opacity: 1 };
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgba);
  if (!match) return { hex: '#eaebec', opacity: 0.2 };
  const toHex = (c: number) => ('0' + c.toString(16)).slice(-2);
  const r = match[1];
  const g = match[2];
  const b = match[3];
  const o = match[4];
  if (!r || !g || !b) return { hex: '#eaebec', opacity: 0.2 };
  return {
    hex: `#${toHex(parseInt(r, 10))}${toHex(parseInt(g, 10))}${toHex(parseInt(b, 10))}`,
    opacity: o !== undefined ? parseFloat(o) : 1,
  };
};

/**
 * Helper to convert hex string to RGB object.
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const r = result[1];
  const g = result[2];
  const b = result[3];
  if (!r || !g || !b) return null;
  return result ? { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) } : null;
};

/**
 * Props for the GridSettingsPopover component.
 */
interface GridSettingsPopoverProps {
  /** The current view options. */
  viewOptions: ViewOptions;
  /** Function to update the view options. */
  setViewOptions: React.Dispatch<React.SetStateAction<ViewOptions>>;
}

/**
 * A popover component containing controls for grid visibility, color, opacity, and width.
 * It is forward-reffed to allow the parent to manage its closing behavior.
 */
export const GridSettingsPopover = React.forwardRef<HTMLDivElement, GridSettingsPopoverProps>(
  ({ viewOptions, setViewOptions }, ref) => {
    const gridColorInputRef = useRef<HTMLInputElement>(null);
    const { hex: gridHexColor, opacity: gridOpacity } = useMemo(
      () => rgbaToHexOpacity(viewOptions.gridColor),
      [viewOptions.gridColor]
    );
    const isCustomGridColor = viewOptions.gridColor !== DEFAULT_GRID_COLOR;

    const handleGridColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rgb = hexToRgb(e.target.value);
      if (rgb) {
        setViewOptions((v) => ({
          ...v,
          gridColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${gridOpacity})`,
        }));
      }
    };

    const handleGridOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rgb = hexToRgb(gridHexColor);
      if (rgb) {
        setViewOptions((v) => ({
          ...v,
          gridColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${parseFloat(e.target.value)})`,
        }));
      }
    };

    const handleResetGridSettings = () => {
      setViewOptions((v) => ({
        ...v,
        showGrid: true,
        gridColor: DEFAULT_GRID_COLOR,
        gridWidth: DEFAULT_GRID_WIDTH,
      }));
    };

    return (
      <div
        ref={ref}
        className="absolute top-full mt-2 left-0 bg-realm-map-viewport border border-border-panel-divider rounded-lg shadow-xl p-4 z-20 w-64"
      >
        <div className="space-y-4">
          <label
            htmlFor="show-grid-toggle"
            className="flex items-center justify-between gap-2 text-sm font-medium text-text-muted cursor-pointer"
          >
            <span>Show Grid</span>
            <div className="relative">
              <input
                type="checkbox"
                id="show-grid-toggle"
                checked={viewOptions.showGrid}
                onChange={() => setViewOptions((v) => ({ ...v, showGrid: !v.showGrid }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-realm-command-panel-surface rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-actions-command-primary"></div>
            </div>
          </label>
          <hr className="border-border-panel-divider" />
          <div>
            <label
              htmlFor="grid-color-btn"
              className="block text-sm font-medium text-text-muted mb-1"
            >
              Grid Color
            </label>
            <div className="flex items-center gap-2">
              <button
                id="grid-color-btn"
                onClick={() =>
                  isCustomGridColor
                    ? setViewOptions((v) => ({ ...v, gridColor: DEFAULT_GRID_COLOR }))
                    : gridColorInputRef.current?.click()
                }
                className="w-10 h-10 rounded-md flex-shrink-0 border border-black/20 relative group"
                style={{ backgroundColor: gridHexColor }}
                title={isCustomGridColor ? 'Reset color to default' : 'Edit color'}
                aria-label={
                  isCustomGridColor ? 'Reset grid color to default' : 'Select custom grid color'
                }
              >
                <input
                  ref={gridColorInputRef}
                  type="color"
                  value={gridHexColor}
                  onChange={handleGridColorChange}
                  className="opacity-0 w-0 h-0 absolute pointer-events-none"
                  aria-label="Grid color picker"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Icon
                    name={isCustomGridColor ? 'reset' : 'pipette'}
                    className="w-5 h-5 text-white"
                  />
                </div>
              </button>
              <span className="p-2 bg-realm-command-panel-surface rounded-md text-sm font-mono flex-grow text-center">
                {gridHexColor.toUpperCase()}
              </span>
            </div>
          </div>
          <div>
            <label
              htmlFor="grid-opacity"
              className="block text-sm font-medium text-text-muted mb-1"
            >
              Opacity
            </label>
            <div className="flex items-center gap-2">
              <input
                id="grid-opacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={gridOpacity}
                onChange={handleGridOpacityChange}
                className="w-full h-2 bg-realm-command-panel-surface rounded-lg appearance-none cursor-pointer"
                aria-label="Grid opacity"
              />
              <span className="p-1 bg-realm-command-panel-surface rounded-md text-xs w-16 text-center">
                {Math.round(gridOpacity * 100)}%
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="grid-width" className="block text-sm font-medium text-text-muted mb-1">
              Border Width
            </label>
            <input
              id="grid-width"
              type="number"
              value={viewOptions.gridWidth}
              onChange={(e) =>
                setViewOptions((v) => ({
                  ...v,
                  gridWidth: Math.max(0.1, parseFloat(e.target.value)) || 1,
                }))
              }
              min="0.1"
              step="0.1"
              className="w-full bg-realm-command-panel-surface p-2 text-sm font-medium text-text-muted focus:outline-none focus:ring-2 focus:ring-actions-command-primary rounded-md"
              aria-label="Grid border width"
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border-panel-divider">
          <button
            onClick={handleResetGridSettings}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-muted bg-realm-command-panel-surface rounded-md hover:bg-realm-command-panel-hover transition-colors"
          >
            <Icon name="reset" className="w-4 h-4" />
            Reset All Grid Settings
          </button>
        </div>
      </div>
    );
  }
);
GridSettingsPopover.displayName = 'GridSettingsPopover';
