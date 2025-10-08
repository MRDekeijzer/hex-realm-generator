/**
 * @file sprayUtils.ts
 * This file contains the core logic for the procedural "Icon Spray" feature.
 */
import type { Hex, Point, Tile } from '../types';
import { DEFAULT_SPRAY_SETTINGS, MASK_RESOLUTION } from '../constants';

type SprayIcon = { name: string; x: number; y: number; size: number; rotation: number; opacity: number };

/**
 * Generates a set of procedural icons to spray onto a hex tile for added texture.
 * The generation is deterministic based on the hex coordinates and spray settings.
 */
export const generateSprayIcons = (hex: Hex, terrainTile: Tile, hexSize: Point, previewSeed?: number): SprayIcon[] => {
    const settings = terrainTile.spraySettings || DEFAULT_SPRAY_SETTINGS;
    if (!terrainTile.sprayIcons || terrainTile.sprayIcons.length === 0 || settings.density === 0) {
        return [];
    }
    
    // Use a provided seed for previews, or a deterministic one for the main map
    const baseSeed = (settings.seed === 'auto' ? (hex.q * 1337 + hex.r * 31337) : settings.seed);
    let seed = previewSeed ? baseSeed + previewSeed : baseSeed;
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const icons: SprayIcon[] = [];
    const count = settings.density;
    const availableIcons = terrainTile.sprayIcons;
    const hexRadius = hexSize.x * 0.85;

    // 1. Generate potential points
    const points: Point[] = [];
    const clusterSpread = hexRadius * (1 - Math.pow(settings.clusterFactor, 2));
    const clusterCenter: Point = {
        x: (random() - 0.5) * 2 * (hexRadius - clusterSpread),
        y: (random() - 0.5) * 2 * (hexRadius - clusterSpread),
    };

    for (let i = 0; i < count * 20 && points.length < count; i++) {
        const angle = random() * 2 * Math.PI;
        const radius = Math.sqrt(random()) * clusterSpread;
        const pt = {
            x: clusterCenter.x + Math.cos(angle) * radius,
            y: clusterCenter.y + Math.sin(angle) * radius,
        };

        // Check if point is inside hex boundary (approximation) and placement mask
        if (Math.sqrt(pt.x * pt.x + pt.y * pt.y) < hexRadius) {
            const mask = settings.placementMask;
            const nx = (pt.x / hexRadius + 1) / 2;
            const ny = (pt.y / hexRadius + 1) / 2;

            if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
                const maskX = Math.floor(nx * MASK_RESOLUTION);
                const maskY = Math.floor(ny * MASK_RESOLUTION);
                const maskIndex = maskY * MASK_RESOLUTION + maskX;
                if (mask[maskIndex] === 1) {
                    points.push(pt);
                }
            }
        }
    }

    // 2. Create icons from points
    points.forEach(pt => {
        icons.push({
            name: availableIcons[Math.floor(random() * availableIcons.length)],
            x: pt.x,
            y: pt.y,
            size: random() * (settings.sizeMax - settings.sizeMin) + settings.sizeMin,
            rotation: (random() - 0.5) * 2 * settings.rotationJitter,
            opacity: settings.opacity + (random() - 0.5) * 2 * settings.tintVariance,
        });
    });

    // 3. Handle collision avoidance
    if (settings.collisionAvoidance && icons.length > 1) {
        const finalIcons: SprayIcon[] = [];
        icons.forEach(icon => {
            let hasCollision = false;
            for (const finalIcon of finalIcons) {
                const dist = Math.sqrt(Math.pow(icon.x - finalIcon.x, 2) + Math.pow(icon.y - finalIcon.y, 2));
                if (dist < (icon.size / 2 + finalIcon.size / 2 + settings.minSpacing)) {
                    hasCollision = true;
                    break;
                }
            }
            if (!hasCollision) {
                finalIcons.push(icon);
            }
        });
        return finalIcons;
    }

    return icons;
};