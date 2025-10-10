/**
 * @file A reusable slider component for settings panels.
 */

import React from 'react';
import { Icon } from '../Icon';

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
    displaySuffix = '%'
}: SettingSliderProps) => {
    const inputId = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                    <label htmlFor={inputId} className="text-sm font-medium text-[#a7a984]">{label}</label>
                    {tooltip && (
                        <div className="relative group">
                            <Icon name="help-circle" className="w-4 h-4 text-[#a7a984] cursor-help" />
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-[#18272e] text-xs text-[#eaebec] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-[#41403f]">
                                {tooltip}
                            </div>
                        </div>
                    )}
                </div>
                <span className="px-2 py-0.5 bg-[#324446] rounded-md text-xs">{Math.round(value * displayMultiplier)}{displaySuffix}</span>
            </div>
            <input
                id={inputId}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#324446] rounded-lg appearance-none cursor-pointer accent-[#736b23]"
            />
        </div>
    );
};