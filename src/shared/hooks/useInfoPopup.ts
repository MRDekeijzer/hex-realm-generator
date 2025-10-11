import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface InfoPopupState {
  id: string;
  anchor: HTMLElement;
  locked: boolean;
}

export interface InfoPopupOptions {
  autoOpenOnHover: boolean;
  openDelay: number;
  closeDelay: number;
}

const DEFAULT_OPTIONS: InfoPopupOptions = {
  autoOpenOnHover: true,
  openDelay: 250,
  closeDelay: 200,
};

export const useInfoPopup = (options?: Partial<InfoPopupOptions>) => {
  const mergedOptions = useMemo<InfoPopupOptions>(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  );

  const [activeInfo, setActiveInfo] = useState<InfoPopupState | null>(null);
  const hoverOpenTimeout = useRef<number | null>(null);
  const hoverCloseTimeout = useRef<number | null>(null);

  const cancelOpenTimeout = useCallback(() => {
    if (hoverOpenTimeout.current !== null) {
      window.clearTimeout(hoverOpenTimeout.current);
      hoverOpenTimeout.current = null;
    }
  }, []);

  const cancelCloseTimeout = useCallback(() => {
    if (hoverCloseTimeout.current !== null) {
      window.clearTimeout(hoverCloseTimeout.current);
      hoverCloseTimeout.current = null;
    }
  }, []);

  const closeInfo = useCallback(() => {
    cancelOpenTimeout();
    cancelCloseTimeout();
    setActiveInfo(null);
  }, [cancelCloseTimeout, cancelOpenTimeout]);

  useEffect(() => {
    return () => {
      cancelOpenTimeout();
      cancelCloseTimeout();
    };
  }, [cancelCloseTimeout, cancelOpenTimeout]);

  const handleInfoClick = useCallback((id: string, anchor: HTMLElement) => {
    setActiveInfo((prev) => {
      if (prev?.id === id) {
        if (prev.locked) {
          return { ...prev, anchor };
        }
        return { id, anchor, locked: true };
      }
      return { id, anchor, locked: true };
    });
  }, []);

  const scheduleHoverOpen = useCallback(
    (id: string, anchor: HTMLElement) => {
      if (!mergedOptions.autoOpenOnHover) {
        return;
      }
      cancelCloseTimeout();
      cancelOpenTimeout();
      hoverOpenTimeout.current = window.setTimeout(() => {
        setActiveInfo((prev) => {
          if (prev?.locked && prev.id !== id) {
            return prev;
          }
          if (prev?.id === id && prev.locked) {
            return { ...prev, anchor };
          }
          return { id, anchor, locked: false };
        });
        hoverOpenTimeout.current = null;
      }, mergedOptions.openDelay);
    },
    [cancelCloseTimeout, cancelOpenTimeout, mergedOptions.autoOpenOnHover, mergedOptions.openDelay]
  );

  const scheduleHoverClose = useCallback(
    (id: string) => {
      if (!mergedOptions.autoOpenOnHover) {
        return;
      }
      cancelOpenTimeout();
      cancelCloseTimeout();
      hoverCloseTimeout.current = window.setTimeout(() => {
        setActiveInfo((prev) => {
          if (!prev) {
            return null;
          }
          if (prev.locked) {
            return prev;
          }
          if (prev.id !== id) {
            return prev;
          }
          return null;
        });
        hoverCloseTimeout.current = null;
      }, mergedOptions.closeDelay);
    },
    [cancelCloseTimeout, cancelOpenTimeout, mergedOptions.autoOpenOnHover, mergedOptions.closeDelay]
  );

  return {
    activeInfo,
    options: mergedOptions,
    handleInfoClick,
    scheduleHoverOpen,
    scheduleHoverClose,
    cancelOpenTimeout,
    cancelCloseTimeout,
    closeInfo,
  };
};
