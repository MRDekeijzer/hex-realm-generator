import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveColorToken } from '@/app/theme/colors';

interface RangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
  ariaLabelMin?: string;
  ariaLabelMax?: string;
}

type SliderHandle = 'min' | 'max';

interface DragState {
  handle: SliderHandle;
  pointerId: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const getStepPrecision = (step: number | undefined): number => {
  if (!step || step <= 0) {
    return 0;
  }
  const stepString = step.toString();
  return stepString.includes('.') ? stepString.split('.')[1]?.length ?? 0 : 0;
};

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 1,
  ariaLabelMin,
  ariaLabelMax,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const precision = useMemo(() => getStepPrecision(step), [step]);
  const effectiveStep = useMemo(() => {
    if (step > 0) {
      return step;
    }
    const derived = (max - min) / 100;
    return derived > 0 ? derived : 1;
  }, [step, min, max]);

  const accentColor = resolveColorToken('actions-command-primary');
  const trackColor = resolveColorToken('realm-command-panel-surface');
  const handleFill = resolveColorToken('realm-command-panel-surface');
  const handleBorder = resolveColorToken('border-panel-divider');

  const range = max - min;
  const safeRange = range === 0 ? 1 : range;
  const percentMin = clamp(((valueMin - min) / safeRange) * 100, 0, 100);
  const percentMax = clamp(((valueMax - min) / safeRange) * 100, 0, 100);

  const roundToStep = useCallback(
    (rawValue: number) => {
      const multiplier = Math.pow(10, precision);
      const rounded = Math.round(rawValue / effectiveStep) * effectiveStep;
      return parseFloat((Math.round(rounded * multiplier) / multiplier).toFixed(precision));
    },
    [effectiveStep, precision]
  );

  const getValueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) {
        return min;
      }
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) {
        return min;
      }
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const rawValue = min + ratio * (max - min);
      return roundToStep(rawValue);
    },
    [min, max, roundToStep]
  );

  const updateHandleValue = useCallback(
    (clientX: number, handle: SliderHandle) => {
      const rawValue = getValueFromClientX(clientX);
      if (handle === 'min') {
        const upperLimit = Math.max(min, valueMax - effectiveStep);
        const nextMin = clamp(rawValue, min, upperLimit);
        if (nextMin !== valueMin) {
          onChange(nextMin, valueMax);
        }
      } else {
        const lowerLimit = Math.min(max, valueMin + effectiveStep);
        const nextMax = clamp(rawValue, lowerLimit, max);
        if (nextMax !== valueMax) {
          onChange(valueMin, nextMax);
        }
      }
    },
    [getValueFromClientX, effectiveStep, min, max, valueMin, valueMax, onChange]
  );

  const startDrag = useCallback(
    (handle: SliderHandle, event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      setDragState({ handle, pointerId: event.pointerId });
      updateHandleValue(event.clientX, handle);
    },
    [updateHandleValue]
  );

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }
      updateHandleValue(event.clientX, dragState.handle);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, updateHandleValue]);

  const handleTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const proposedValue = getValueFromClientX(event.clientX);
      const distanceToMin = Math.abs(proposedValue - valueMin);
      const distanceToMax = Math.abs(proposedValue - valueMax);
      const handle: SliderHandle = distanceToMin <= distanceToMax ? 'min' : 'max';
      startDrag(handle, event);
    },
    [getValueFromClientX, startDrag, valueMin, valueMax]
  );

  const handleKeyDown = useCallback(
    (handle: SliderHandle) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      let delta = 0;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        delta = -effectiveStep;
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        delta = effectiveStep;
      } else if (event.key === 'PageDown') {
        delta = -effectiveStep * 10;
      } else if (event.key === 'PageUp') {
        delta = effectiveStep * 10;
      } else if (event.key === 'Home') {
        event.preventDefault();
        if (handle === 'min') {
          onChange(min, valueMax);
        } else {
          onChange(valueMin, max);
        }
        return;
      } else if (event.key === 'End') {
        event.preventDefault();
        if (handle === 'min') {
          onChange(Math.max(min, valueMax - effectiveStep), valueMax);
        } else {
          onChange(valueMin, Math.min(max, valueMin + effectiveStep));
        }
        return;
      } else {
        return;
      }

      event.preventDefault();

      if (handle === 'min') {
        const next = clamp(roundToStep(valueMin + delta), min, Math.max(min, valueMax - effectiveStep));
        if (next !== valueMin) {
          onChange(next, valueMax);
        }
      } else {
        const next = clamp(
          roundToStep(valueMax + delta),
          Math.min(max, valueMin + effectiveStep),
          max
        );
        if (next !== valueMax) {
          onChange(valueMin, next);
        }
      }
    },
    [effectiveStep, max, min, onChange, roundToStep, valueMin, valueMax]
  );

  return (
    <div className="relative flex h-10 w-full items-center">
      <div
        ref={trackRef}
        className="relative h-1.5 w-full select-none rounded-full touch-none cursor-pointer"
        style={{ backgroundColor: trackColor }}
        onPointerDown={handleTrackPointerDown}
      >
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            backgroundColor: accentColor,
            left: `${percentMin}%`,
            right: `${100 - percentMax}%`,
          }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label={ariaLabelMin ?? 'Minimum value'}
          aria-valuemin={min}
          aria-valuemax={Math.max(min, valueMax - effectiveStep)}
          aria-valuenow={valueMin}
          aria-orientation="horizontal"
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md outline-none transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer touch-none"
          style={{
            left: `${percentMin}%`,
            backgroundColor: handleFill,
            borderColor: handleBorder,
            outlineColor: accentColor,
          }}
          onPointerDown={(event) => startDrag('min', event)}
          onKeyDown={handleKeyDown('min')}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label={ariaLabelMax ?? 'Maximum value'}
          aria-valuemin={Math.min(max, valueMin + effectiveStep)}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-orientation="horizontal"
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md outline-none transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer touch-none"
          style={{
            left: `${percentMax}%`,
            backgroundColor: handleFill,
            borderColor: handleBorder,
            outlineColor: accentColor,
          }}
          onPointerDown={(event) => startDrag('max', event)}
          onKeyDown={handleKeyDown('max')}
        />
      </div>
    </div>
  );
};
