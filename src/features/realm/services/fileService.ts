/**
 * @file fileService.ts
 * This file contains utility functions for handling file operations,
 * such as exporting the realm data to JSON and exporting the SVG map to a PNG image.
 */

import type { Realm } from '@/features/realm/types';

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
export function exportSvgAsPng(svgId: string, fileName: string) {
  const svgElement = document.getElementById(svgId) as unknown as SVGElement | null;
  if (!svgElement) {
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const svgSize = svgElement.getBoundingClientRect();

  // Render at 2x resolution for better quality
  canvas.width = svgSize.width * 2;
  canvas.height = svgSize.height * 2;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Use btoa to handle special characters in the SVG data
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}
