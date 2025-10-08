

// FIX: Import React namespace to use types like React.MouseEvent
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface PanAndZoomOptions {
  initialWidth: number;
  initialHeight: number;
  minZoom?: number;
  maxZoom?: number;
}

export function usePanAndZoom({ initialWidth, initialHeight, minZoom = 0.1, maxZoom = 10 }: PanAndZoomOptions) {
  const [viewbox, setViewbox] = useState(`${-initialWidth/2} ${-initialHeight/2} ${initialWidth} ${initialHeight}`);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const setPanningState = useCallback((panning: boolean) => {
    isPanningRef.current = panning;
    setIsPanning(panning);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGElement>) => {
    e.preventDefault();
    setPanningState(true);
    lastPoint.current = { x: e.clientX, y: e.clientY };
  }, [setPanningState]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };

    setViewbox(prev => {
      const parts = prev.split(' ').map(parseFloat);
      return `${parts[0] - dx / zoom} ${parts[1] - dy / zoom} ${parts[2]} ${parts[3]}`;
    });
  }, [zoom]);

  const onMouseUp = useCallback(() => {
    setPanningState(false);
  }, [setPanningState]);
  
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const [x, y, w, h] = viewbox.split(' ').map(parseFloat);
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * (1 - e.deltaY / 500)));
    const zoomFactor = newZoom / zoom;
    
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const newW = w / zoomFactor;
    const newH = h / zoomFactor;
    const newX = x + (mouseX / zoom) * (1 - 1/zoomFactor);
    const newY = y + (mouseY / zoom) * (1 - 1/zoomFactor);

    setViewbox(`${newX} ${newY} ${newW} ${newH}`);
    setZoom(newZoom);
  }, [viewbox, zoom, minZoom, maxZoom]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [onMouseMove, onMouseUp]);

  return { viewbox, containerRef, onMouseDown, onWheel, isPanning };
}
