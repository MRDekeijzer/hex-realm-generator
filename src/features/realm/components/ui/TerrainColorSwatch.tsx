import React, { useMemo, useRef, useCallback } from 'react';
import { Icon } from '@/features/realm/components/Icon';

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

interface TerrainColorSwatchProps {
  color: string;
  ariaLabel: string;
  tooltip: string;
  onChange: (color: string) => void;
  onReset?: () => void;
  canReset?: boolean;
  className?: string;
  overlayClassName?: string;
  iconClassName?: string;
  overlayIcon?: string;
  resetIcon?: string;
}

const TerrainColorSwatchBase: React.FC<TerrainColorSwatchProps> = ({
  color,
  ariaLabel,
  tooltip,
  onChange,
  onReset,
  canReset = false,
  className = '',
  overlayClassName = 'bg-black/30',
  iconClassName = 'w-5 h-5 text-white',
  overlayIcon = 'pipette',
  resetIcon = 'reset',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedPropColor = useMemo(
    () => (HEX_PATTERN.test(color) ? color.toUpperCase() : '#CCCCCC'),
    [color]
  );

  const shouldReset = Boolean(canReset && onReset);
  const iconName = shouldReset ? resetIcon : overlayIcon;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (shouldReset) {
        onReset?.();
        return;
      }
      inputRef.current?.click();
    },
    [shouldReset, onReset]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const next = HEX_PATTERN.test(raw) ? raw.toUpperCase() : raw;

      // Avoid redundant parent updates
      if (next === normalizedPropColor) return;

      // Only emit valid hex values to parent
      if (HEX_PATTERN.test(next)) onChange(next);
    },
    [normalizedPropColor, onChange]
  );

  return (
    <button
      type="button"
      className={`relative group transition-colors duration-150 ${className}`.trim()}
      style={{ backgroundColor: normalizedPropColor }}
      title={tooltip}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="color"
        value={normalizedPropColor}
        onChange={handleChange}
        className="opacity-0 w-0 h-0 absolute pointer-events-none"
        aria-hidden={true}
        tabIndex={-1}
      />
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${overlayClassName}`.trim()}
      >
        <Icon name={iconName} className={iconClassName} />
      </div>
    </button>
  );
};

export const TerrainColorSwatch = React.memo(TerrainColorSwatchBase);
