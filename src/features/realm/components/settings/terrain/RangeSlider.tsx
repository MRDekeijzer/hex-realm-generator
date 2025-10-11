import React, { useRef, useCallback, useEffect } from 'react';
import { resolveColorToken } from '@/app/theme/colors';

interface RangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 1,
}) => {
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const accentColor = resolveColorToken('text-high-contrast');

  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    if (!rangeRef.current || !minRef.current || !maxRef.current) return;
    const minPercent = getPercent(valueMin);
    const maxPercent = getPercent(valueMax);
    rangeRef.current.style.left = `${minPercent}%`;
    rangeRef.current.style.right = `${100 - maxPercent}%`;
  }, [valueMin, valueMax, getPercent]);

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.min(Number(event.target.value), valueMax - step);
    onChange(newValue, valueMax);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(Number(event.target.value), valueMin + step);
    onChange(valueMin, newValue);
  };

  return (
    <div className="relative pt-5">
      <div className="relative h-2 bg-realm-command-panel-surface rounded-full">
        <div
          ref={rangeRef}
          className="absolute h-full rounded-full bg-actions-command-primary"
        />
      </div>
      <div className="relative">
        <input
          ref={minRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={handleMinChange}
          className="pointer-events-auto absolute top-0 left-0 w-full appearance-none bg-transparent"
          style={{ accentColor }}
        />
        <input
          ref={maxRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={handleMaxChange}
          className="pointer-events-auto absolute top-0 left-0 w-full appearance-none bg-transparent"
          style={{ accentColor }}
        />
      </div>
    </div>
  );
};
