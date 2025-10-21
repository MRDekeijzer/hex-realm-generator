/**
 * @file fileService.ts
 * This file contains utility functions for handling file operations,
 * such as exporting the realm data to JSON and exporting the SVG map to a PNG image.
 */

import type { Realm } from '@/features/realm/types';

interface SvgRasterizeOptions {
  scale?: number;
  hideSelectionHighlights?: boolean;
}

/**
 * Exports the current realm data as a JSON file.
 * @param realm The realm object to be exported.
 */
export function exportRealmAsJson(realm: Realm) {
  const jsonString = JSON.stringify(realm, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'realm-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports an SVG element as a PNG image file.
 * @param svgId The ID of the SVG element to export.
 * @param fileName The desired file name for the PNG image.
 */
export async function exportSvgAsPng(
  svgId: string,
  fileName: string,
  options: SvgRasterizeOptions = {}
) {
  const svgElement = document.getElementById(svgId) as unknown as SVGElement | null;
  if (!svgElement) {
    return;
  }

  const pngUrl = await rasterizeSvgToPng(svgElement, options);
  const anchor = document.createElement('a');
  anchor.href = pngUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Converts an SVG element into a PNG data URL.
 * @param svgElement The SVG element to rasterize.
 * @param options Export options controlling resolution and selection visibility.
 * @returns A Promise that resolves with the PNG data URL.
 */
export function rasterizeSvgToPng(
  svgElement: SVGElement,
  options: SvgRasterizeOptions = {}
): Promise<string> {
  const { scale = 2, hideSelectionHighlights = false } = options;
  const clone = svgElement.cloneNode(true) as SVGElement;

  if (hideSelectionHighlights) {
    clone.querySelectorAll('.hex-selection-highlight, .hex-hover-highlight').forEach((element) => {
      element.remove();
    });
  }

  const serializer = new XMLSerializer();
  const svgData = serializer.serializeToString(clone);
  const svgSize = svgElement.getBoundingClientRect();

  const canvas = document.createElement('canvas');
  const viewBoxAttr = clone.getAttribute('viewBox');
  let exportWidth = svgSize.width;
  let exportHeight = svgSize.height;

  if (viewBoxAttr) {
    const [, , vbWidth, vbHeight] = viewBoxAttr.split(' ').map(Number);
    if (Number.isFinite(vbWidth) && Number.isFinite(vbHeight) && vbWidth > 0 && vbHeight > 0) {
      exportWidth = vbWidth;
      exportHeight = vbHeight;
    }
  }

  if (!clone.getAttribute('width')) {
    clone.setAttribute('width', `${exportWidth}`);
  }
  if (!clone.getAttribute('height')) {
    clone.setAttribute('height', `${exportHeight}`);
  }

  canvas.width = Math.max(Math.round(exportWidth * scale), 1);
  canvas.height = Math.max(Math.round(exportHeight * scale), 1);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Canvas context is unavailable.'));
  }

  const img = new Image();
  const svgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to rasterize SVG element.'));
    img.src = svgUrl;
  });
}
