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
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
    >
      <div className="bg-[#18272e] border border-[#41403f] rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h2 id="confirmation-dialog-title" className="text-xl font-bold text-white text-center mb-4">
          {title}
        </h2>
        <p className="text-[#a7a984] mb-6 text-center">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#eaebec] bg-[#324446] rounded-md hover:bg-[#435360] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-[#60131b] rounded-md hover:bg-[#8a2a34] transition-colors"
          >
            {confirmText}
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
