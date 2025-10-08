
import type { Realm } from '../types';

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

export function exportSvgAsPng(svgId: string, fileName: string) {
  // FIX: Cast to 'unknown' first to allow casting from HTMLElement to SVGElement.
  const svgElement = document.getElementById(svgId) as unknown as SVGElement | null;
  if (!svgElement) {
    console.error('SVG element not found');
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  
  const svgSize = svgElement.getBoundingClientRect();
  canvas.width = svgSize.width * 2; // Increase resolution
  canvas.height = svgSize.height * 2;
  
  const ctx = canvas.getContext('2d');
  if(!ctx) return;
  
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
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}
