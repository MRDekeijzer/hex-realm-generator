/**
 * @file hexUtils.ts
 * This file contains utility functions for working with hexagonal grids using an
 * axial coordinate system (q, r). It includes functions for coordinate conversion,
 * geometry calculation, and neighbor finding.
 */
import type { Point, HexOrientation } from '@/features/realm/types';

/**
 * Converts axial hex coordinates to pixel coordinates.
 * @param hex - The hex coordinates {q, r}.
 * @param orientation - The orientation of the grid ('pointy' or 'flat').
 * @param size - The size of the hexes in pixels {x, y}.
 * @returns The pixel coordinates {x, y} of the hex center.
 */
export function axialToPixel(
  hex: { q: number; r: number },
  orientation: HexOrientation,
  size: Point
): Point {
  let x, y;
  if (orientation === 'pointy') {
    x = size.x * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
    y = size.y * ((3 / 2) * hex.r);
  } else {
    // flat
    x = size.x * ((3 / 2) * hex.q);
    y = size.y * ((Math.sqrt(3) / 2) * hex.q + Math.sqrt(3) * hex.r);
  }
  return { x, y };
}

/**
 * Calculates the pixel coordinates of the 6 corners of a hex.
 * @param orientation - The orientation of the hex.
 * @param size - The size of the hex in pixels.
 * @param scale - An optional scaling factor for the corners.
 * @returns An array of 6 Point objects representing the corners.
 */
export function getHexCorners(orientation: HexOrientation, size: Point, scale = 1): Point[] {
  const corners: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - (orientation === 'pointy' ? 30 : 0));
    corners.push({
      x: size.x * Math.cos(angle) * scale,
      y: size.y * Math.sin(angle) * scale,
    });
  }
  return corners;
}

/**
 * Generates an SVG path string for a barrier on a specific hex edge.
 * @param edgeIndex - The index of the edge (0-5).
 * @param corners - The array of the hex's corner points.
 * @returns An SVG path data string (e.g., "M x1 y1 L x2 y2").
 */
export function getBarrierPath(edgeIndex: number, corners: Point[]): string {
  const start = corners[edgeIndex];
  const end = corners[(edgeIndex + 1) % 6];
  if (!start || !end) return '';
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

/**
 * Finds the closest edge of a hex to a given point.
 * @param point - The point relative to the hex center {x, y}.
 * @param corners - The array of the hex's corner points.
 * @returns The index of the closest edge (0-5).
 */
export function findClosestEdge(point: Point, corners: Point[]): number {
  let minDistance = Infinity;
  let closestEdgeIndex = -1;

  for (let i = 0; i < 6; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % 6];
    if (!p1 || !p2) continue;
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;

    const t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / (dx * dx + dy * dy);
    const closestX = t < 0 ? p1.x : t > 1 ? p2.x : p1.x + t * dx;
    const closestY = t < 0 ? p1.y : t > 1 ? p2.y : p1.y + t * dy;

    const distance = Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
    if (distance < minDistance) {
      minDistance = distance;
      closestEdgeIndex = i;
    }
  }
  return closestEdgeIndex;
}

/**
 * Axial direction vectors, ordered to match pointy-top edge indices.
 * 0:E, 1:SE, 2:SW, 3:W, 4:NW, 5:NE
 */
const axialDirections = [
  { q: +1, r: 0 },
  { q: 0, r: +1 },
  { q: -1, r: +1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: +1, r: -1 },
];

/**
 * Gets the axial coordinates of all 6 neighbors of a hex.
 * @param hex - The source hex {q, r}.
 * @returns An array of 6 neighbor coordinate objects.
 */
export function getNeighbors(hex: { q: number; r: number }): { q: number; r: number }[] {
  return axialDirections.map((dir) => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
  }));
}

/**
 * Calculates the distance between two hexes in grid units.
 * @param a - The first hex {q, r}.
 * @param b - The second hex {q, r}.
 * @returns The number of hexes between a and b.
 */
export function getAxialDistance(a: { q: number; r: number }, b: { q: number; r: number }): number {
  const dq = Math.abs(a.q - b.q);
  const dr = Math.abs(a.r - b.r);
  const ds = Math.abs(-a.q - a.r - (-b.q - b.r));
  return (dq + dr + ds) / 2;
}
