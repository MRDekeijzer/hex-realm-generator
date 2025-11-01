/**
 * @file HexBackplate.tsx
 * Renders holdings and landmarks inside a hex, including optional backplates, user-defined
 * icon/backplate colors, and the seat-of-power crown. Assets are converted to inline data URLs so
 * they survive SVG-to-canvas export without CORS issues.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { Point, Tile, ViewOptions } from '@/features/realm/types';
import {
  DEFAULT_POI_BACKDROP_COLOR,
  SEAT_OF_POWER_COLOR,
  SEAT_OF_POWER_OVERLAY_LAYOUT,
} from '@/features/realm/config/constants';
import { Icon } from '../Icon';

interface HexBackplateProps {
  activeTile: Tile | null;
  hexCorners: Point[];
  viewOptions: ViewOptions;
  isSeatOfPower: boolean;
  isHolding: boolean;
  markerIconColor: string | null;
  markerBackdropColor: string | null;
  seatOfPowerIconColor: string;
  seatOfPowerBackdropColor: string;
}

const SEAT_OF_POWER_ICON_PATH = '/Icons/crown.svg';
const SEAT_OF_POWER_BACKDROP_PATH = '/Icons/crown_under.svg';

const maskAssetCache = new Map<string, string>();

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
      reject(
        reader.error instanceof Error ? reader.error : new Error('Failed to read blob as data URL')
      );
    reader.readAsDataURL(blob);
  });

const useInlineMaskAsset = (assetUrl?: string | null) => {
  const [inlineSrc, setInlineSrc] = useState<string | undefined>(() => {
    if (!assetUrl) return undefined;
    if (isDataLikeUrl(assetUrl)) return assetUrl;
    return maskAssetCache.get(assetUrl);
  });

  useEffect(() => {
    if (!assetUrl) {
      setInlineSrc(undefined);
      return;
    }
    if (isDataLikeUrl(assetUrl)) {
      setInlineSrc(assetUrl);
      return;
    }
    const cached = maskAssetCache.get(assetUrl);
    if (cached) {
      setInlineSrc(cached);
      return;
    }

    let cancelled = false;
    const absoluteUrl = toAbsoluteUrl(assetUrl);

    const fetchAsset = async () => {
      try {
        const response = await fetch(absoluteUrl, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch mask asset: ${response.status}`);
        }
        const blob = await response.blob();
        const dataUrl = await readBlobAsDataUrl(blob);
        if (!cancelled) {
          maskAssetCache.set(assetUrl, dataUrl);
          setInlineSrc(dataUrl);
        }
      } catch (error) {
        if (!cancelled) {
          setInlineSrc(absoluteUrl);
          console.error(error);
        }
      }
    };

    void fetchAsset();

    return () => {
      cancelled = true;
    };
  }, [assetUrl]);

  if (!assetUrl) {
    return undefined;
  }
  return inlineSrc ?? toAbsoluteUrl(assetUrl);
};

let maskedBlockIdCounter = 0;
const getNextMaskId = () => {
  maskedBlockIdCounter += 1;
  return `hex-backplate-mask-${maskedBlockIdCounter}`;
};

interface MaskedBlockProps {
  href?: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MaskedBlock = ({ href, color, x, y, width, height }: MaskedBlockProps) => {
  const maskIdRef = useRef<string>();
  if (!maskIdRef.current) {
    maskIdRef.current = getNextMaskId();
  }
  const maskId = maskIdRef.current;

  if (!href) {
    return null;
  }

  return (
    <>
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x={x}
          y={y}
          width={width}
          height={height}
          {...{ 'mask-type': 'alpha' as const }}
        >
          <image
            href={href}
            x={x}
            y={y}
            width={width}
            height={height}
            preserveAspectRatio="xMidYMid meet"
          />
        </mask>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        mask={`url(#${maskId})`}
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
};

export const HexBackplate = ({
  activeTile,
  hexCorners: _hexCorners,
  viewOptions,
  isSeatOfPower,
  isHolding: _isHolding,
  markerIconColor,
  markerBackdropColor,
  seatOfPowerIconColor,
  seatOfPowerBackdropColor,
}: HexBackplateProps) => {
  const markerIcon = activeTile?.markerIcon ?? '';
  const markerBackdrop = activeTile?.markerBackdrop ?? '';
  const resolvedMarkerBackdrop = useInlineMaskAsset(markerBackdrop);
  const resolvedMarkerIcon = useInlineMaskAsset(markerIcon);
  const resolvedSeatBackdrop = useInlineMaskAsset(
    isSeatOfPower ? SEAT_OF_POWER_BACKDROP_PATH : null
  );
  const resolvedSeatIcon = useInlineMaskAsset(isSeatOfPower ? SEAT_OF_POWER_ICON_PATH : null);

  if (!activeTile) {
    return null;
  }

  const hasMarkerAsset = Boolean(markerIcon);
  const hasMarkerBackdrop = Boolean(markerBackdrop);

  const backdropColor = markerBackdropColor ?? DEFAULT_POI_BACKDROP_COLOR;
  const iconColor = markerIconColor ?? '#000000';
  const resolvedSeatOfPowerBackdropColor = seatOfPowerBackdropColor || DEFAULT_POI_BACKDROP_COLOR;
  const resolvedSeatOfPowerIconColor = seatOfPowerIconColor || SEAT_OF_POWER_COLOR;

  const iconScale = 1.6;
  const iconWidth = viewOptions.hexSize.x * iconScale;
  const iconHeight = viewOptions.hexSize.y * iconScale;

  const backdropScale = 1.6;
  const backdropWidth = viewOptions.hexSize.x * backdropScale;
  const backdropHeight = viewOptions.hexSize.y * backdropScale;

  const seatIconLayout = SEAT_OF_POWER_OVERLAY_LAYOUT.icon;
  const seatBackdropLayout = SEAT_OF_POWER_OVERLAY_LAYOUT.backdrop;
  const crownWidth = viewOptions.hexSize.x * seatIconLayout.scale;
  const crownHeight = viewOptions.hexSize.y * seatIconLayout.scale;
  const crownYOffset = viewOptions.hexSize.y * seatIconLayout.offset;
  const crownBackdropWidth = viewOptions.hexSize.x * seatBackdropLayout.scale;
  const crownBackdropHeight = viewOptions.hexSize.y * seatBackdropLayout.scale;
  const crownBackdropYOffset = viewOptions.hexSize.y * seatBackdropLayout.offset;

  const halfBackdropWidth = backdropWidth / 2;
  const halfBackdropHeight = backdropHeight / 2;
  const halfIconWidth = iconWidth / 2;
  const halfIconHeight = iconHeight / 2;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {hasMarkerBackdrop && resolvedMarkerBackdrop && (
        <MaskedBlock
          href={resolvedMarkerBackdrop}
          color={backdropColor}
          x={-halfBackdropWidth}
          y={-halfBackdropHeight}
          width={backdropWidth}
          height={backdropHeight}
        />
      )}
      {hasMarkerAsset
        ? resolvedMarkerIcon && (
            <MaskedBlock
              href={resolvedMarkerIcon}
              color={iconColor}
              x={-halfIconWidth}
              y={-halfIconHeight}
              width={iconWidth}
              height={iconHeight}
            />
          )
        : activeTile.icon && (
            <Icon
              name={activeTile.icon}
              x={-halfIconWidth}
              y={-halfIconHeight}
              width={iconWidth}
              height={iconHeight}
              className="text-text-inverse"
              style={{ color: iconColor }}
              strokeWidth={2}
            />
          )}
      {isSeatOfPower && resolvedSeatBackdrop && (
        <MaskedBlock
          href={resolvedSeatBackdrop}
          color={resolvedSeatOfPowerBackdropColor}
          x={-crownBackdropWidth / 2}
          y={-crownBackdropYOffset}
          width={crownBackdropWidth}
          height={crownBackdropHeight}
        />
      )}
      {isSeatOfPower && resolvedSeatIcon && (
        <MaskedBlock
          href={resolvedSeatIcon}
          color={resolvedSeatOfPowerIconColor}
          x={-crownWidth / 2}
          y={-crownYOffset}
          width={crownWidth}
          height={crownHeight}
        />
      )}
    </g>
  );
};
