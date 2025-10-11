/**
 * @file usePanAndZoom.ts
 * This file contains a custom React hook for managing panning and zooming
 * interactions on an SVG canvas.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Options for the usePanAndZoom hook.
 */
interface PanAndZoomOptions {
  initialWidth: number;
  initialHeight: number;
  minZoom?: number;
  maxZoom?: number;
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
}: PanAndZoomOptions) {
  const [viewbox, setViewbox] = useState(
    `${-initialWidth / 2} ${-initialHeight / 2} ${initialWidth} ${initialHeight}`
  );
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const setPanningState = useCallback((panning: boolean) => {
    isPanningRef.current = panning;
    setIsPanning(panning);
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      e.preventDefault();
      setPanningState(true);
      lastPoint.current = { x: e.clientX, y: e.clientY };
    },
    [setPanningState]
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
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const [x, y, w, h] = viewbox.split(' ').map(parseFloat);
      if (x === undefined || y === undefined || w === undefined || h === undefined) return;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * (1 - e.deltaY / 500)));
      const zoomFactor = newZoom / zoom;

      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const newW = w / zoomFactor;
      const newH = h / zoomFactor;
      const newX = x + (mouseX / zoom) * (1 - 1 / zoomFactor);
      const newY = y + (mouseY / zoom) * (1 - 1 / zoomFactor);

      setViewbox(`${newX} ${newY} ${newW} ${newH}`);
      setZoom(newZoom);
    },
    [viewbox, zoom, minZoom, maxZoom]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onMouseMove(e);
    const handleMouseUp = () => onMouseUp();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return { viewbox, containerRef, onMouseDown, onWheel, isPanning };
}
