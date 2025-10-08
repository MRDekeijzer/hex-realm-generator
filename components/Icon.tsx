/**
 * @file Icon.tsx
 * This component acts as a centralized wrapper for the `lucide-react` icon library.
 * It provides a simple interface to render any icon by name, ensuring consistency
 * in styling (like stroke width) across the application.
 */

import React from 'react';
import {
  Sparkles, Sparkle, RotateCcw, Undo2, Redo2, Eye, Hexagon, FileUp, FileDown,
  ImageDown, X, Settings, Star, Crown, MousePointer2, Brush, Slice, MapPin,
  Plus, Minus, ChevronUp, ChevronDown, Move, Trash2, Trees, Leaf,
  Mountain, MountainSnow, Waves, Droplets, Castle, Building2, Ban, DoorClosed,
  Landmark, Framer, Church, House, Tractor, TriangleAlert, HelpCircle, Network,
  Cloud, Spline, Droplet, Feather, Flower, Sun, TreePine, Triangle, Wind,
  Compass, ArrowUp, Circle, Pipette, Wheat, Sprout, Shrub, SprayCan, type LucideIcon,
  Flag, Snowflake, GitBranchPlus, Activity, Skull, Fish, Gem
} from 'lucide-react';

/**
 * Raw SVG path data for icons used in special cases like cursors.
 */
export const iconPaths = {
    // This is now empty, but kept in case other special cursors are needed.
};

/**
 * A mapping of string names to Lucide icon components.
 * This allows icons to be referenced by a simple string name throughout the app.
 */
const icons: { [key: string]: React.ElementType } = {
  // Toolbar
  sparkles: Sparkles, settings: Settings, grid: Hexagon, undo: Undo2, redo: Redo2,
  eye: Eye, upload: FileUp, download: FileDown, 'image-down': ImageDown,
  
  // Tools
  'mouse-pointer-2': MousePointer2, brush: Brush, 'barrier-painter': Slice,
  'map-pin-pen': MapPin, sparkle: Sparkle,

  // UI Elements
  close: X, crown: Crown, plus: Plus, minus: Minus, 'chevron-up': ChevronUp,
  'chevron-down': ChevronDown, move: Move, 'trash-2': Trash2, pipette: Pipette,
  reset: RotateCcw, star: Star, 'help-circle': HelpCircle, network: Network,
  compass: Compass, 'arrow-up': ArrowUp, circle: Circle, 'spray-can': SprayCan,

  // Terrain & Spray Icons
  trees: Trees, leaf: Leaf, mountain: Mountain, mountains: MountainSnow,
  waves: Waves, water: Droplets, 'mountain-range': MountainSnow, tree: Trees,
  droplet: Droplet, triangle: Triangle, hill: Mountain, flower: Flower,
  droplets: Droplets, sun: Sun, wind: Wind, 'tree-pine': TreePine, curve: Spline,
  feather: Feather, cloud: Cloud, grass: Wheat, sprout: Sprout, shrub: Shrub,
  flag: Flag, snowflake: Snowflake, branch: GitBranchPlus, river: Spline,
  path: Spline, 'wave-sine': Activity, skull: Skull, fish: Fish, rock: Gem,
  'tree-deciduous': Leaf,

  // POIs (Holdings & Landmarks)
  castle: Castle, city: Building2, town: House, village: Tractor, dwelling: DoorClosed,
  sanctum: Church, monument: Landmark, hazard: TriangleAlert, curse: Ban, ruins: Framer,
};

/**
 * Props for the Icon component.
 */
interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  /** The string name of the icon to render. Must exist in the `icons` map. */
  name: string;
}

/**
 * Renders a Lucide icon based on a string name.
 * @param {IconProps} props - The component props.
 * @returns A Lucide icon component or null if the name is not found.
 */
export const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = icons[name];
  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found.`);
    return null;
  }
  return <LucideIcon strokeWidth={1.5} {...props} />;
};
