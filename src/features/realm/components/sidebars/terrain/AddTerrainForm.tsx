import React from 'react';
import { Icon } from '@/features/realm/components/Icon';

interface AddTerrainFormProps {
  name: string;
  color: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const AddTerrainForm: React.FC<AddTerrainFormProps> = ({
  name,
  color,
  onNameChange,
  onColorChange,
  onSubmit,
}) => {
  const isSubmitDisabled = name.trim().length === 0;

  return (
    <div className="mt-6 pt-4 border-t border-border-panel-divider">
      <h3 className="text-lg font-bold mb-2">Add New Terrain</h3>
      <form onSubmit={onSubmit}>
        <div className="mb-2">
          <label htmlFor="terrain-name" className="block text-sm font-medium text-text-muted mb-1">
            Name
          </label>
          <input
            id="terrain-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full bg-realm-command-panel-surface p-2 text-sm font-medium text-text-muted focus:outline-none focus:ring-2 focus:ring-actions-command-primary rounded-md"
            placeholder="e.g. Cursed Wastes"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="terrain-color" className="block text-sm font-medium text-text-muted mb-1">
            Color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="terrain-color"
              type="color"
              value={color}
              onChange={(event) => onColorChange(event.target.value)}
              className="h-10 p-1 bg-realm-command-panel-surface border border-border-panel-divider rounded-md cursor-pointer"
              title="Select color"
              aria-label="New terrain color picker"
            />
            <span className="p-2 bg-realm-command-panel-surface rounded-md text-sm font-mono flex-grow text-center">
              {color}
            </span>
          </div>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-high-contrast bg-feedback-success-highlight rounded-md hover:bg-actions-command-primary-hover transition-colors disabled:opacity-50"
          disabled={isSubmitDisabled}
        >
          <Icon name="plus" className="w-4 h-4" />
          Add Terrain
        </button>
      </form>
    </div>
  );
};
