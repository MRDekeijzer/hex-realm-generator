import React, { useRef } from 'react';
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

export const TerrainColorSwatch: React.FC<TerrainColorSwatchProps> = ({
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
  const inputValue = HEX_PATTERN.test(color) ? color : '#CCCCCC';
  const shouldReset = canReset && onReset;
  const iconName = shouldReset ? resetIcon : overlayIcon;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (shouldReset) {
      onReset?.();
      return;
    }
    inputRef.current?.click();
  };

  const normalizeColor = (value: string) =>
    HEX_PATTERN.test(value) ? value.toUpperCase() : value;

  const handleColorUpdate = (value: string) => {
    onChange(normalizeColor(value));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    handleColorUpdate(nextValue);
  };

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value;
    handleColorUpdate(nextValue);
  };

  return (
    <button
      type="button"
      className={`relative group transition-colors duration-150 ${className}`.trim()}
      style={{ backgroundColor: color }}
      title={tooltip}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="color"
        value={inputValue}
        onChange={handleChange}
        onInput={handleInput}
        className="opacity-0 w-0 h-0 absolute pointer-events-none"
        aria-hidden
      />
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${overlayClassName}`.trim()}
      >
        <Icon name={iconName} className={iconClassName} />
      </div>
    </button>
  );
};
