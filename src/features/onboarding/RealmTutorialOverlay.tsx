import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Tool } from '@/features/realm/types';
import stepsData from './realmTutorialSteps.json';
import { Icon } from '@/features/realm/components/Icon';

type TutorialPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

type TutorialActionType =
  | 'setActiveTool'
  | 'openRealmPresets'
  | 'closeRealmPresets'
  | 'openExportModal'
  | 'closeExportModal'
  | 'selectFirstHex';

interface TutorialAction {
  type: TutorialActionType;
  payload?: Tool;
}

interface TutorialStep {
  id: string;
  title: string;
  body: string;
  target?: string;
  placement?: TutorialPlacement;
  enterActions?: TutorialAction[];
  exitActions?: TutorialAction[];
}

const STEPS: TutorialStep[] = stepsData as TutorialStep[];

interface RealmTutorialOverlayProps {
  isOpen: boolean;
  onDismiss: (outcome: 'completed' | 'skipped') => void;
  actionHandlers: {
    setActiveTool: (tool: Tool) => void;
    openRealmPresets: () => void;
    closeRealmPresets: () => void;
    openExportModal: () => void;
    closeExportModal: () => void;
    selectFirstHex: () => void;
  };
}

const HIGHLIGHT_PADDING = 12;
const OVERLAY_OPACITY_CLASS = 'bg-black/60';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function RealmTutorialOverlay({
  isOpen,
  onDismiss,
  actionHandlers,
}: RealmTutorialOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const calloutRef = useRef<HTMLDivElement | null>(null);
  const [calloutSize, setCalloutSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const stepCount = STEPS.length;
  const currentStep = STEPS[currentIndex] ?? STEPS[STEPS.length - 1];

  const runActions = useCallback(
    (actions?: TutorialAction[]) => {
      if (!actions?.length) {
        return;
      }
      actions.forEach((action) => {
        if (!action) {
          return;
        }
        switch (action.type) {
          case 'setActiveTool': {
            if (action.payload) {
              actionHandlers.setActiveTool(action.payload);
            }
            break;
          }
          case 'openRealmPresets': {
            actionHandlers.openRealmPresets();
            break;
          }
          case 'closeRealmPresets': {
            actionHandlers.closeRealmPresets();
            break;
          }
          case 'openExportModal': {
            actionHandlers.openExportModal();
            break;
          }
          case 'closeExportModal': {
            actionHandlers.closeExportModal();
            break;
          }
          case 'selectFirstHex': {
            actionHandlers.selectFirstHex();
            break;
          }
          default:
            break;
        }
      });
    },
    [actionHandlers]
  );

  const targetSelector = currentStep.target;

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !targetSelector) {
      setTargetRect(null);
      return;
    }
    const element = document.querySelector<HTMLElement>(targetSelector);
    if (!element) {
      setTargetRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setTargetRect(rect);
  }, [isOpen, targetSelector]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      runActions(currentStep.enterActions);
      requestAnimationFrame(() => {
        updateTargetRect();
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      runActions(currentStep.exitActions);
    };
  }, [isOpen, currentStep, runActions, updateTargetRect]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleResize = () => {
      updateTargetRect();
    };
    const handleMutation = () => {
      updateTargetRect();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      observer.disconnect();
    };
  }, [isOpen, updateTargetRect]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss('skipped');
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setCurrentIndex((prev) => {
          if (prev >= stepCount - 1) {
            onDismiss('completed');
            return prev;
          }
          return prev + 1;
        });
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onDismiss, stepCount]);

  useEffect(() => {
    setCurrentIndex(0);
    if (!isOpen) {
      setTargetRect(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !nextButtonRef.current) {
      return;
    }
    const timeout = window.setTimeout(() => {
      nextButtonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [isOpen, currentIndex]);

  const titleId = useMemo(() => `realm-tutorial-${currentStep.id}-title`, [currentStep.id]);
  const descriptionId = useMemo(
    () => `realm-tutorial-${currentStep.id}-description`,
    [currentStep.id]
  );

  useLayoutEffect(() => {
    if (!isOpen || !calloutRef.current) {
      return;
    }
    const element = calloutRef.current;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setCalloutSize({ width: rect.width, height: rect.height });
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(element);
      return () => {
        resizeObserver.disconnect();
      };
    }
    return undefined;
  }, [isOpen, currentIndex, currentStep.id]);

  const calloutStyle = useMemo<React.CSSProperties>(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const placement = currentStep.placement ?? 'bottom';
    const provisionalWidth = calloutSize.width || Math.min(360, viewportWidth - margin * 2);
    const provisionalHeight = calloutSize.height || 220;
    const width = Math.min(provisionalWidth, viewportWidth - margin * 2);
    const height = Math.min(provisionalHeight, viewportHeight - margin * 2);

    const clampPosition = (value: number, min: number, max: number) =>
      clamp(value, min, Math.max(min, max));

    const fallbackTop = clampPosition(
      (viewportHeight - height) / 2,
      margin,
      viewportHeight - margin - height
    );
    const fallbackLeft = clampPosition(
      (viewportWidth - width) / 2,
      margin,
      viewportWidth - margin - width
    );

    if (!targetRect || placement === 'center') {
      return {
        top: fallbackTop,
        left: fallbackLeft,
      };
    }

    switch (placement) {
      case 'top': {
        let top = targetRect.top - margin - height;
        top = clampPosition(top, margin, viewportHeight - margin - height);
        let left = targetRect.left + targetRect.width / 2 - width / 2;
        left = clampPosition(left, margin, viewportWidth - margin - width);
        return { top, left };
      }
      case 'bottom': {
        let top = targetRect.bottom + margin;
        if (top + height > viewportHeight - margin) {
          top = viewportHeight - margin - height;
        }
        top = clampPosition(top, margin, viewportHeight - margin - height);
        let left = targetRect.left + targetRect.width / 2 - width / 2;
        left = clampPosition(left, margin, viewportWidth - margin - width);
        return { top, left };
      }
      case 'left': {
        let left = targetRect.left - margin - width;
        left = clampPosition(left, margin, viewportWidth - margin - width);
        let top = targetRect.top + targetRect.height / 2 - height / 2;
        top = clampPosition(top, margin, viewportHeight - margin - height);
        return { top, left };
      }
      case 'right': {
        let left = targetRect.right + margin;
        if (left + width > viewportWidth - margin) {
          left = viewportWidth - margin - width;
        }
        left = clampPosition(left, margin, viewportWidth - margin - width);
        let top = targetRect.top + targetRect.height / 2 - height / 2;
        top = clampPosition(top, margin, viewportHeight - margin - height);
        return { top, left };
      }
      default:
        return {
          top: fallbackTop,
          left: fallbackLeft,
        };
    }
  }, [calloutSize.height, calloutSize.width, currentStep.placement, targetRect]);

  const highlightStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect) {
      return { opacity: 0 };
    }
    return {
      top: Math.max(targetRect.top - HIGHLIGHT_PADDING, 0),
      left: Math.max(targetRect.left - HIGHLIGHT_PADDING, 0),
      width: targetRect.width + HIGHLIGHT_PADDING * 2,
      height: targetRect.height + HIGHLIGHT_PADDING * 2,
      opacity: 1,
    };
  }, [targetRect]);

  const renderBody = useCallback(() => {
    const raw = currentStep.body ?? '';
    const lines = raw.split('\n');

    type TutorialBlock =
      | { type: 'paragraph'; text: string }
      | { type: 'list'; items: string[] }
      | { type: 'heading'; level: 1 | 2 | 3; text: string };

    const blocks: TutorialBlock[] = [];
    let paragraphLines: string[] = [];
    let listItems: string[] | null = null;

    const flushParagraph = () => {
      if (!paragraphLines.length) return;
      const text = paragraphLines.join(' ');
      blocks.push({ type: 'paragraph', text });
      paragraphLines = [];
    };

    const flushList = () => {
      if (!listItems || listItems.length === 0) return;
      blocks.push({ type: 'list', items: listItems });
      listItems = null;
    };

    const renderInlineContent = (content: string, keyPrefix: string) => {
      const pattern = /(\*\*[^*]+\*\*)|(:[a-z0-9-]+:)/gi;
      const nodes: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let segmentIndex = 0;

      while ((match = pattern.exec(content)) !== null) {
        const [token] = match;
        if (match.index > lastIndex) {
          const textSegment = content.slice(lastIndex, match.index);
          if (textSegment.length) {
            nodes.push(
              <React.Fragment key={`${keyPrefix}-text-${segmentIndex}`}>
                {textSegment}
              </React.Fragment>
            );
            segmentIndex += 1;
          }
        }
        if (token.startsWith('**')) {
          const boldText = token.slice(2, -2);
          nodes.push(
            <strong key={`${keyPrefix}-bold-${segmentIndex}`} className="text-text-high-contrast">
              {boldText}
            </strong>
          );
        } else if (token.startsWith(':') && token.endsWith(':')) {
          const iconName = token.slice(1, -1).toLowerCase();
          nodes.push(
            <Icon
              key={`${keyPrefix}-icon-${segmentIndex}`}
              name={iconName}
              className="inline h-4 w-4 align-[-0.2em] text-white"
              aria-hidden="true"
            />
          );
        }
        lastIndex = match.index + token.length;
        segmentIndex += 1;
      }

      if (lastIndex < content.length) {
        const tail = content.slice(lastIndex);
        if (tail.length) {
          nodes.push(
            <React.Fragment key={`${keyPrefix}-text-${segmentIndex}`}>{tail}</React.Fragment>
          );
        }
      }
      return nodes;
    };

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      const isLast = index === lines.length - 1;

      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length as 1 | 2 | 3;
        blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
        return;
      }

      if (line.startsWith('- ')) {
        flushParagraph();
        if (!listItems) {
          listItems = [];
        }
        listItems.push(line.slice(2).trim());
      } else {
        flushList();
        paragraphLines.push(line);
      }

      if (isLast) {
        flushParagraph();
        flushList();
      }
    });

    const renderHeading = (block: Extract<TutorialBlock, { type: 'heading' }>, index: number) => {
      const baseKey = `${currentStep.id}-heading-${index}`;
      const inline = renderInlineContent(block.text, baseKey);

      if (block.level === 1) {
        return (
          <h3 key={baseKey} className="mt-4 text-base font-semibold text-text-high-contrast">
            {inline}
          </h3>
        );
      }
      if (block.level === 2) {
        return (
          <h4 key={baseKey} className="mt-3 text-sm font-semibold text-text-high-contrast">
            {inline}
          </h4>
        );
      }
      return (
        <p
          key={baseKey}
          className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted"
        >
          {inline}
        </p>
      );
    };

    return blocks.map((block, index) => {
      if (block.type === 'heading') {
        return renderHeading(block, index);
      }
      if (block.type === 'paragraph') {
        return (
          <p key={`${currentStep.id}-paragraph-${index}`} className="mt-2 text-sm text-text-muted">
            {renderInlineContent(block.text, `${currentStep.id}-paragraph-${index}`)}
          </p>
        );
      }
      return (
        <ul
          key={`${currentStep.id}-list-${index}`}
          className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted"
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${currentStep.id}-list-${index}-item-${itemIndex}`}>
              {renderInlineContent(item, `${currentStep.id}-list-${index}-item-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
    });
  }, [currentStep.body, currentStep.id]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= stepCount - 1) {
        onDismiss('completed');
        return prev;
      }
      return prev + 1;
    });
  }, [onDismiss, stepCount]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    onDismiss('skipped');
  }, [onDismiss]);

  if (!isOpen) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] pointer-events-none">
      <div className="absolute inset-0 bg-transparent pointer-events-auto" aria-hidden="true">
        {targetRect ? (
          <div
            className="fixed border-2 border-actions-command-primary/80 rounded-xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out"
            style={highlightStyle}
          />
        ) : (
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${OVERLAY_OPACITY_CLASS}`}
          />
        )}
      </div>
      <div
        className="fixed max-w-sm w-[min(360px,calc(100vw-2rem))] pointer-events-auto rounded-xl border border-border-panel-divider bg-realm-canvas-backdrop/95 p-4 shadow-2xl backdrop-blur-md transition-transform"
        style={calloutStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={calloutRef}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-muted">
              Step {currentIndex + 1} of {stepCount}
            </p>
            <h2 id={titleId} className="mt-1 text-lg font-semibold text-text-high-contrast">
              {currentStep.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-actions-command-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/80 rounded-sm px-1 py-0.5"
          >
            Skip
          </button>
        </div>
        <div id={descriptionId} className="mt-2">
          {renderBody()}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-3 py-2 text-sm rounded-md border border-border-panel-divider text-text-muted disabled:opacity-50 disabled:cursor-not-allowed hover:bg-realm-command-panel-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-actions-command-primary/80"
          >
            Back
          </button>
          <button
            type="button"
            ref={nextButtonRef}
            onClick={handleNext}
            className="px-3 py-2 text-sm font-semibold rounded-md bg-actions-command-primary text-text-high-contrast hover:bg-actions-command-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-actions-command-primary/70"
          >
            {currentIndex >= stepCount - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
