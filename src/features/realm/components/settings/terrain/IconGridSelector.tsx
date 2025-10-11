import React, { useMemo } from 'react';
import { SPRAYABLE_ICONS } from '@/features/realm/config/constants';
import { Icon } from '@/features/realm/components/Icon';

interface IconGridSelectorProps {
  selectedIcons: string[];
  onToggleIcon: (iconName: string) => void;
}

export const IconGridSelector: React.FC<IconGridSelectorProps> = ({
  selectedIcons,
  onToggleIcon,
}) => {
  const sortedIcons = useMemo(() => [...SPRAYABLE_ICONS].sort(), []);

  return (
    <div>
      <label className="block text-sm font-medium text-text-muted mb-1">Spray Icons</label>
      <div className="grid grid-cols-6 gap-1 p-2 bg-realm-map-viewport rounded-md max-h-48 overflow-y-auto">
        {sortedIcons.map((icon) => {
          const isSelected = selectedIcons.includes(icon);
          return (
            <button
              key={icon}
              onClick={() => onToggleIcon(icon)}
              className={`flex flex-col items-center justify-center gap-1 p-1 rounded-md transition-all duration-150 border-2 text-center h-16 ${
                isSelected
                  ? 'bg-actions-command-primary/30 border-actions-command-primary text-text-high-contrast'
                  : 'bg-realm-command-panel-surface border-transparent hover:border-text-muted text-text-muted'
              }`}
              title={icon}
              type="button"
            >
              <Icon name={icon} className="w-6 h-6" />
              <span className="text-[10px] truncate w-full">{icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
