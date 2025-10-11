/**
 * @file Reusable toolbar button component with an icon and optional text.
 */

import React from 'react';
import { Icon } from '../Icon';

/**
 * Props for the ToolbarButton component.
 */
interface ToolbarButtonProps {
  /** Click handler for the button. */
  onClick: () => void;
  /** The name of the lucide-react icon to display. */
  icon: string;
  /** Optional text label for the button. */
  children?: React.ReactNode;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Whether the button should be styled as active. */
  isActive?: boolean;
  /** A tooltip for the button. */
  title?: string;
}

/**
 * A standardized button component for use in toolbars.
 * It's forward-reffed to allow parent components to access the underlying button element.
 */
export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ onClick, icon, children, disabled, isActive, title }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive
          ? 'bg-actions-command-primary text-text-high-contrast'
          : 'bg-realm-command-panel-surface text-text-muted hover:bg-realm-command-panel-hover'
      }`}
      disabled={disabled}
      title={title}
    >
      <Icon name={icon} className="w-4 h-4" />
      {children}
    </button>
  )
);
ToolbarButton.displayName = 'ToolbarButton';
