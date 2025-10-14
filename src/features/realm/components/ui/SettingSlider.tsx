/**
 * @file A reusable slider component for settings panels.
 */

import React, { useMemo } from 'react';
import { Icon } from '../Icon';
import { resolveColorToken } from '@/app/theme/colors';

/**
 * Props for the SettingSlider component.
 */
interface SettingSliderProps {
  /** The label displayed above the slider. */
  label: string;
  /** An optional tooltip for the label. */
  tooltip?: string;
  /** The current value of the slider. */
  value: number;
  /** Callback function when the slider value changes. */
  onChange: (value: number) => void;
  /** The minimum value of the slider. */
  min?: number;
  /** The maximum value of the slider. */
  max?: number;
  /** The step increment of the slider. */
  step?: number;
  /** A multiplier for displaying the value (e.g., 100 for percentages). */
  displayMultiplier?: number;
  /** A suffix for the displayed value (e.g., '%'). */
  displaySuffix?: string;
}

/**
 * A component that renders a styled range input (slider) with a label,
 * current value display, and an optional tooltip.
 */
export const SettingSlider = ({
  label,
  tooltip,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  displayMultiplier = 100,
  displaySuffix = '%',
}: SettingSliderProps) => {
  const inputId = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const range = max - min;
  const safeRange = range === 0 ? 1 : range;
  const percent = useMemo(() => {
    const rawPercent = ((value - min) / safeRange) * 100;
    return Math.min(100, Math.max(0, rawPercent));
  }, [value, min, safeRange]);
  const accentColor = resolveColorToken('actions-command-primary');
  const trackColor = resolveColorToken('realm-command-panel-surface');
  const thumbBg = resolveColorToken('realm-command-panel-surface');
  const thumbBorder = resolveColorToken('border-panel-divider');
  const displayValue = Math.round(value * displayMultiplier);

  const sliderStyle = useMemo(
    () => ({
      background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`,
      '--slider-thumb-bg': thumbBg,
      '--slider-thumb-border': thumbBorder,
    }),
    [accentColor, trackColor, thumbBg, thumbBorder, percent]
  );

  const handleValueChange = (nextValue: string) => {
    const numericValue = parseFloat(nextValue);
    if (!Number.isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="text-sm font-medium text-text-muted">
            {label}
          </label>
          {tooltip && (
            <div className="relative group">
              <Icon name="help-circle" className="w-4 h-4 text-text-muted cursor-help" />
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-realm-map-viewport text-xs text-text-high-contrast rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-border-panel-divider">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <span className="px-2 py-0.5 bg-realm-command-panel-surface rounded-md text-xs">
          {displayValue}
          {displaySuffix}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => handleValueChange(event.target.value)}
        onInput={(event) => handleValueChange((event.target as HTMLInputElement).value)}
        className="realm-slider"
        style={sliderStyle}
      />
    </div>
  );
};
