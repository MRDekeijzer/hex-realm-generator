import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/mrdekeijzer';

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-scrim p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-modal-title"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="relative w-full max-w-xl rounded-lg border border-border-panel-divider bg-realm-command-panel-surface shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1 text-text-muted transition-colors hover:text-text-high-contrast"
          aria-label="Close credits"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-8 space-y-6 text-sm text-text-muted">
          <header className="space-y-1">
            <h2 id="credits-modal-title" className="text-lg font-semibold text-text-high-contrast">
              Credits &amp; Attributions
            </h2>
            <p>
              Hex Realm Generator is an independent fan project. All third-party assets remain the
              property of their respective creators and are used under their published licenses.
            </p>
            <p>
              Please credit original sources when reusing exported maps or derived artwork, and
              respect any additional guidelines shared by Lucide and Bastionland.
            </p>
            <p>
              This tool is a fan project and is in no way endorsed by or otherwise affiliated with
              Mythic Bastionland or Bastionland Press. It is made entirely from the free Quickstart
              and Realm Sheet PDF available on the{' '}
              <a
                href="https://chrismcdee.itch.io/mythic-bastionland"
                target="_blank"
                rel="noopener noreferrer"
                className="text-actions-command-primary hover:underline"
              >
                Mythic Bastionland itch.io page
              </a>
              .
            </p>
          </header>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-text-high-contrast tracking-wide uppercase">
              Assets &amp; Libraries
            </h3>
            <ul className="space-y-2">
              <li>
                <strong className="text-text-high-contrast">Lucide</strong> — Iconography powered by
                the{' '}
                <a
                  href="https://lucide.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-actions-command-primary hover:underline"
                >
                  Lucide
                </a>{' '}
                icon set.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-text-high-contrast tracking-wide uppercase">
              Support The Project
            </h3>
            <p>
              If Hex Realm Generator saves you prep time or sparks ideas, you can fuel more updates
              and maintenance here:
            </p>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-actions-command-primary px-4 py-2 font-medium text-text-high-contrast transition-colors hover:bg-actions-command-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
            >
              <Icon name="coffee" className="w-4 h-4" />
              Buy Me a Coffee
            </a>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
