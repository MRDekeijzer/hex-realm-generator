import React, { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface InfoPopupProps {
  anchor: HTMLElement;
  onClose: () => void;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

interface PopupPosition {
  top: number;
  left: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const InfoPopup: React.FC<InfoPopupProps> = ({
  anchor,
  onClose,
  children,
  onMouseEnter,
  onMouseLeave,
}) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<PopupPosition>({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const rect = anchor.getBoundingClientRect();
    if (!popupRef.current) {
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
      return;
    }

    const popupRect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = rect.top + scrollY - popupRect.height - 12;
    if (top < scrollY + 12) {
      top = rect.bottom + scrollY + 12;
    }

    let left = rect.right + scrollX - popupRect.width;
    const minLeft = scrollX + 12;
    const maxLeft = scrollX + viewportWidth - popupRect.width - 12;
    left = clamp(left, minLeft, Math.max(minLeft, maxLeft));

    setPosition({ top, left });
  }, [anchor]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      updatePosition();
    };

    const handleOutsideMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (popupRef.current?.contains(target)) {
        return;
      }
      if (anchor.contains(target)) {
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    document.addEventListener('mousedown', handleOutsideMouseDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('mousedown', handleOutsideMouseDown, true);
    };
  }, [anchor, onClose, updatePosition]);

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[999] w-64 rounded-md border border-border-panel-divider bg-realm-canvas-backdrop p-3 shadow-lg"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      role="dialog"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>,
    document.body
  );
};
