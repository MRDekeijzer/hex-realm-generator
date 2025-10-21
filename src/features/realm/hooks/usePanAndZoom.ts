/**
 * @file usePanAndZoom.ts
 * This file contains a custom React hook for managing panning and zooming
 * interactions on an SVG canvas.
 */
import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Options for the usePanAndZoom hook.
 */
interface PanAndZoomOptions {
  initialWidth: number;
  initialHeight: number;
  minZoom?: number;
  maxZoom?: number;
  enabled?: boolean;
}

/**
 * A custom hook to manage the state and event handlers for panning and zooming an SVG viewbox.
 * @param options - Configuration for the hook, including initial dimensions and zoom limits.
 * @returns An object containing the viewbox string, a ref for the container element,
 *          event handlers for mouse down and wheel events, and a boolean indicating if panning is active.
 */
export function usePanAndZoom({
  initialWidth,
  initialHeight,
  minZoom = 0.1,
  maxZoom = 10,
  enabled = true,
}: PanAndZoomOptions) {
  const [viewbox, setViewbox] = useState(
    `${-initialWidth / 2} ${-initialHeight / 2} ${initialWidth} ${initialHeight}`
  );
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const clampZoom = useCallback(
    (value: number) => Math.max(minZoom, Math.min(maxZoom, value)),
    [minZoom, maxZoom]
  );

  const setPanningState = useCallback((panning: boolean) => {
    isPanningRef.current = panning;
    setIsPanning(panning);
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (!enabled) return;
      e.preventDefault();
      setPanningState(true);
      lastPoint.current = { x: e.clientX, y: e.clientY };
    },
    [enabled, setPanningState]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - lastPoint.current.x;
      const dy = e.clientY - lastPoint.current.y;
      lastPoint.current = { x: e.clientX, y: e.clientY };

      setViewbox((prev) => {
        const parts = prev.split(' ').map(parseFloat);
        const p0 = parts[0];
        const p1 = parts[1];
        const p2 = parts[2];
        const p3 = parts[3];
        if (p0 === undefined || p1 === undefined || p2 === undefined || p3 === undefined)
          return prev;
        return `${p0 - dx / zoom} ${p1 - dy / zoom} ${p2} ${p3}`;
      });
    },
    [zoom]
  );

  const onMouseUp = useCallback(() => {
    setPanningState(false);
  }, [setPanningState]);

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (!enabled) return;
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left;
      const mouseY = event.clientY - containerRect.top;

      setZoom((prevZoom) => {
        const nextZoom = clampZoom(prevZoom * (1 - event.deltaY / 500));
        if (nextZoom === prevZoom) return prevZoom;

        const zoomFactor = nextZoom / prevZoom;
        const safePrevZoom = prevZoom === 0 ? Number.EPSILON : prevZoom;

        setViewbox((prevViewbox) => {
          const [x, y, w, h] = prevViewbox.split(' ').map(Number);
          if ([x, y, w, h].some((value) => Number.isNaN(value))) {
            return prevViewbox;
          }

          const newW = w / zoomFactor;
          const newH = h / zoomFactor;
          const newX = x + (mouseX / safePrevZoom) * (1 - 1 / zoomFactor);
          const newY = y + (mouseY / safePrevZoom) * (1 - 1 / zoomFactor);

          return `${newX} ${newY} ${newW} ${newH}`;
        });

        return nextZoom;
      });
    },
    [clampZoom, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    const handleMouseMove = (e: MouseEvent) => onMouseMove(e);
    const handleMouseUp = () => onMouseUp();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, onMouseMove, onMouseUp]);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [enabled, onWheel]);

  return { viewbox, containerRef, onMouseDown, isPanning: enabled ? isPanning : false };
}
