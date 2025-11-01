import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/mrdekeijzer';
const cardClasses =
  'rounded-lg border border-border-panel-divider bg-realm-map-viewport px-5 py-5 shadow-sm';
const sectionHeadingClasses =
  'flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-high-contrast';

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
      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-border-panel-divider bg-realm-canvas-backdrop shadow-xl animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-text-muted transition-colors hover:text-text-high-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
          aria-label="Close credits"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>

        <header className="space-y-3 border-b border-border-panel-divider bg-realm-map-viewport px-6 py-6 pr-14 text-sm text-text-muted">
          <h2
            id="credits-modal-title"
            className="text-xl font-semibold text-text-high-contrast leading-tight"
          >
            Credits &amp; Attributions
          </h2>
          <p>
            Thanks for exploring Hex Realm Generator. Here are the people, projects, and resources
            that make the tool possible.
          </p>
        </header>

        <div className="bg-realm-canvas-backdrop px-6 py-6 text-sm text-text-muted">
          <div className="grid gap-6 lg:grid-cols-[1.15fr,1fr]">
            <div className="space-y-6">
              <section className={`${cardClasses} space-y-3`}>
                <h3 className={sectionHeadingClasses}>
                  <Icon
                    name="book-open"
                    className="h-4 w-4 text-actions-command-primary"
                    aria-hidden="true"
                  />
                  <span>Fan Project Overview</span>
                </h3>
                <p>
                  Hex Realm Generator is an independent fan project. All third-party assets remain
                  the property of their respective creators and are used under their published
                  licenses.
                </p>
                <p>
                  This tool is in no way endorsed by or otherwise affiliated with Mythic Bastionland
                  or Bastionland Press. It is built entirely from the free Quickstart and Realm
                  Sheet PDF available on the{' '}
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
              </section>
            </div>

            <div className="space-y-6">
              <section className={`${cardClasses} space-y-3`}>
                <h3 className={sectionHeadingClasses}>
                  <Icon
                    name="boxes"
                    className="h-4 w-4 text-actions-command-primary"
                    aria-hidden="true"
                  />
                  <span>Assets &amp; Libraries</span>
                </h3>
                <ul className="space-y-2">
                  <li>
                    <strong className="text-text-high-contrast">Lucide</strong> – Iconography
                    powered by the{' '}
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
                  <li>
                    <strong className="text-text-high-contrast">Art</strong> – Art powered by the{' '}
                    <a
                      href="https://chrismcdee.itch.io/mythic-bastionland"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-actions-command-primary hover:underline"
                    >
                      Mythic Bastionland Realm Sheets
                    </a>{' '}
                    from the Mythic Bastionland itch.io page.
                  </li>
                </ul>
              </section>
              <section className={`${cardClasses} space-y-4`}>
                <h3 className={sectionHeadingClasses}>
                  <Icon
                    name="heart"
                    className="h-4 w-4 text-actions-command-primary"
                    aria-hidden="true"
                  />
                  <span>Support The Project</span>
                </h3>
                <p>
                  If Hex Realm Generator saves you prep time or sparks ideas, you can fuel more
                  updates and maintenance here:
                </p>
                <a
                  href={BUY_ME_A_COFFEE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-actions-command-primary px-4 py-2 text-sm font-semibold text-text-high-contrast transition hover:bg-actions-command-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/60"
                >
                  <Icon name="coffee" className="h-4 w-4" aria-hidden="true" />
                  Buy Me a Coffee
                </a>
              </section>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
          .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        `}</style>
      </div>
    </div>,
    document.body
  );
}
