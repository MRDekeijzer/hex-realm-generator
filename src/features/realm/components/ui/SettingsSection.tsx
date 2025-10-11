/**
 * @file A reusable component for creating visually distinct sections in settings panels.
 */

import React from 'react';

/**
 * Props for the SettingsSection component.
 */
// FIX: Changed to use React.FC and PropsWithChildren for more robust typing.
interface SettingsSectionProps {
  /** The title of the section. */
  title: string;
}

/**
 * A container component that wraps content in a styled box with a title,
 * used for grouping related settings.
 */
export const SettingsSection: React.FC<React.PropsWithChildren<SettingsSectionProps>> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="text-md font-semibold text-text-high-contrast mb-2">{title}</h3>
    <div className="space-y-4 p-4 bg-realm-map-viewport rounded-md border border-border-panel-divider">
      {children}
    </div>
  </div>
);

