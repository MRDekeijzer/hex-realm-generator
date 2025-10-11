/**
 * @file ConfirmationDialog.tsx
 * This component renders a modal dialog to confirm a destructive action.
 * It provides a clear message and distinct "Confirm" and "Cancel" buttons.
 */

import React from 'react';

/**
 * Props for the ConfirmationDialog component.
 */
interface ConfirmationDialogProps {
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** The title of the dialog. */
  title: string;
  /** The main message or question for the user. */
  message: string;
  /** Callback function to execute when the user confirms. */
  onConfirm: () => void;
  /** Callback function to execute when the user cancels. */
  onCancel: () => void;
  /** Optional custom text for the confirm button. */
  confirmText?: string;
  /** Optional custom text for the cancel button. */
  cancelText?: string;
  /** If true, styles as an info dialog (e.g., only one button). */
  isInfo?: boolean;
}

/**
 * A modal dialog component for confirming user actions.
 */
export function ConfirmationDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isInfo = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-overlay-scrim z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
    >
      <div className="bg-realm-map-viewport border border-border-panel-divider rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h2
          id="confirmation-dialog-title"
          className="text-xl font-bold text-text-high-contrast text-center mb-4"
        >
          {title}
        </h2>
        <p className="text-text-muted mb-6 text-center">{message}</p>
        <div className="flex justify-center gap-4">
          {!isInfo && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-text-high-contrast bg-realm-command-panel-surface rounded-md hover:bg-realm-command-panel-hover transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-text-high-contrast rounded-md transition-colors ${
              isInfo
                ? 'bg-feedback-info-panel hover:bg-feedback-mystic-highlight'
                : 'bg-actions-danger-base hover:bg-actions-danger-hover'
            }`}
          >
            {isInfo ? 'OK' : confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}
