/**
 * @file Toggle switch UI component used across settings panels.
 */

import React from 'react';

type SwitchChangeHandler = (nextChecked: boolean) => void;

interface SwitchProps {
  /** Unique identifier linking the switch to its external label. */
  id: string;
  /** Current on/off state of the switch. */
  checked: boolean;
  /** Handler invoked when the switch value changes. */
  onChange: SwitchChangeHandler;
  /** Optional flag to disable user interaction. */
  disabled?: boolean;
  /** Optional class name applied to the outer wrapper for layout tweaks. */
  className?: string;
  /** Optional aria-label for cases without a visible label. */
  ariaLabel?: string;
  /** Optional aria-describedby id for assistive descriptions. */
  ariaDescribedBy?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    { id, checked, onChange, disabled = false, className = '', ariaLabel, ariaDescribedBy },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked);
    };

    const wrapperClasses = ['relative inline-flex pt-1'];
    if (className) {
      wrapperClasses.push(className);
    }

    return (
      <span className={wrapperClasses.join(' ')}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          className="sr-only peer"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 cursor-pointer rounded-full bg-realm-command-panel-hover transition-colors duration-200 peer-checked:bg-actions-command-primary peer-disabled:cursor-not-allowed peer-disabled:bg-border-panel-divider peer-focus-visible:ring-2 peer-focus-visible:ring-actions-command-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-realm-map-viewport after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-transform after:duration-200 after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:after:border-border-panel-divider peer-disabled:after:bg-white/70"
        />
      </span>
    );
  }
);

Switch.displayName = 'Switch';
