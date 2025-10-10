/**
 * @file A reusable button for tab navigation within settings modals.
 */

import React from 'react';
import { Icon } from '../Icon';

/**
 * Props for the SettingsTabButton component.
 */
interface SettingsTabButtonProps {
  /** The name of the lucide-react icon. */
  icon: string;
  /** The text label for the tab. */
  label: string;
  /** Whether the tab is currently active. */
  isActive: boolean;
  /** The click handler for the button. */
  onClick: () => void;
}

/**
 * A styled button component used for navigating between tabs in a settings panel.
 * It displays an icon and a label, with a distinct style for the active state.
 */
export const SettingsTabButton = ({ icon, label, isActive, onClick }: SettingsTabButtonProps) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full text-left p-3 rounded-md transition-colors ${
            isActive
                ? 'bg-[#736b23] text-[#eaebec]'
                : 'text-[#a7a984] hover:bg-[#324446]'
        }`}
    >
        <Icon name={icon} className="w-5 h-5" />
        <span className="font-medium">{label}</span>
    </button>
);