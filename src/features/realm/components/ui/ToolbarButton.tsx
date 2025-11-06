/**
 * @file Reusable toolbar button component with an icon and optional text.
 */

import React from 'react';
import { Icon } from '../Icon';

/**
 * Props for the ToolbarButton component.
 */
interface ToolbarButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'children'> {
  /** The name of the lucide-react icon to display. */
  icon: string;
  /** Optional text label for the button. */
  children?: React.ReactNode;
  /** Whether the button should be styled as active. */
  isActive?: boolean;
}

/**
 * A standardized button component for use in toolbars.
 * It's forward-reffed to allow parent components to access the underlying button element.
 */
export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ onClick, icon, children, disabled, isActive, title, className, ...rest }, ref) => {
    const baseClasses =
      'interactive-surface flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary disabled:opacity-50 disabled:cursor-not-allowed min-h-[2.34rem]';
    const visualClasses = isActive
      ? 'bg-actions-command-primary text-text-high-contrast'
      : 'bg-realm-command-panel-surface text-text-muted hover:bg-realm-command-panel-hover';
    const mergedClassName = `${baseClasses} ${visualClasses}${className ? ` ${className}` : ''}`;

    return (
      <button
        ref={ref}
        onClick={onClick}
        type="button"
        className={mergedClassName}
        disabled={disabled}
        title={title}
        {...rest}
      >
        <Icon name={icon} className="w-4 h-4" />
        {children}
      </button>
    );
  }
);
ToolbarButton.displayName = 'ToolbarButton';
