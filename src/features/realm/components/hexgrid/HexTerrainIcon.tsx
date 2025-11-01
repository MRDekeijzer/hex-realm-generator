/**
 * @file HexTerrainIcon.tsx
 * Renders the single terrain icon overlay within a hex cell.
 */
import React, { useEffect, useMemo, useState } from 'react';

interface HexTerrainIconProps {
  iconUrl?: string;
  hexBoundingBox: { x: number; y: number; width: number; height: number };
}

const iconDataCache = new Map<string, string>();

const isDataLikeUrl = (value: string) => /^(data|blob):/i.test(value);
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const toAbsoluteUrl = (value: string) => {
  if (isDataLikeUrl(value) || isAbsoluteHttpUrl(value)) {
    return value;
  }
  if (typeof window === 'undefined') {
    return value;
  }
  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return value;
  }
};

const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error(reader.error?.message ?? 'Failed to convert icon blob to data URL'));
    reader.readAsDataURL(blob);
  });

export const HexTerrainIcon = ({ iconUrl, hexBoundingBox }: HexTerrainIconProps) => {
  const [inlineSrc, setInlineSrc] = useState<string | undefined>(() => {
    if (!iconUrl) {
      return undefined;
    }
    if (isDataLikeUrl(iconUrl)) {
      return iconUrl;
    }
    return iconDataCache.get(iconUrl);
  });

  useEffect(() => {
    if (!iconUrl) {
      setInlineSrc(undefined);
      return;
    }
    if (isDataLikeUrl(iconUrl)) {
      setInlineSrc(iconUrl);
      return;
    }
    const cached = iconDataCache.get(iconUrl);
    if (cached) {
      setInlineSrc(cached);
      return;
    }

    let cancelled = false;
    const absoluteUrl = toAbsoluteUrl(iconUrl);

    const fetchIcon = async () => {
      try {
        const response = await fetch(absoluteUrl, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch terrain icon: ${response.status}`);
        }
        const blob = await response.blob();
        const dataUrl = await readBlobAsDataUrl(blob);
        if (!cancelled) {
          iconDataCache.set(iconUrl, dataUrl);
          setInlineSrc(dataUrl);
        }
      } catch (error) {
        if (!cancelled) {
          // Fallback to the absolute URL so at least the in-app view still renders.
          setInlineSrc(absoluteUrl);
          console.error(error);
        }
      }
    };

    void fetchIcon();

    return () => {
      cancelled = true;
    };
  }, [iconUrl]);

  const resolvedHref = useMemo(() => {
    if (inlineSrc) {
      return inlineSrc;
    }
    if (!iconUrl) {
      return undefined;
    }
    return toAbsoluteUrl(iconUrl);
  }, [iconUrl, inlineSrc]);

  if (!resolvedHref) {
    return null;
  }

  const scale = 0.98;
  const width = hexBoundingBox.width * scale;
  const height = hexBoundingBox.height * scale;
  const x = hexBoundingBox.x + (hexBoundingBox.width - width) / 2;
  const y = hexBoundingBox.y + (hexBoundingBox.height - height) / 2;

  return (
    <image
      href={resolvedHref}
      xlinkHref={resolvedHref}
      x={x}
      y={y}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      clipPath="url(#hex-clip-path)"
      style={{ pointerEvents: 'none' }}
    />
  );
};
