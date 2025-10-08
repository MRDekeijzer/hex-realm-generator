import React from 'react';
import {
  Sparkles,
  Sparkle,
  RotateCcw,
  Undo2,
  Redo2,
  Eye,
  Hexagon,
  FileUp,
  FileDown,
  ImageDown,
  X,
  Settings,
  Star,
  Crown,
  MousePointer2,
  Brush,
  Slice,
  MapPin,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Move,
  Trash2,
  Pipette,
  Trees,
  Leaf,
  Mountain,
  MountainSnow,
  Waves,
  Droplets,
  Castle,
  Building2,
  Ban,
  DoorClosed,
  Landmark,
  Framer,
  Church,
  House,
  Tractor,
  TriangleAlert,
  type LucideIcon
} from 'lucide-react';

const icons: { [key: string]: LucideIcon } = {
  // Toolbar
  sparkles: Sparkles,
  settings: Settings,
  grid: Hexagon,
  undo: Undo2,
  redo: Redo2,
  eye: Eye,
  upload: FileUp,
  download: FileDown,
  'image-down': ImageDown,
  
  // Tools
  'mouse-pointer-2': MousePointer2,
  brush: Brush,
  'barrier-painter': Slice,
  'map-pin-pen': MapPin,
  sparkle: Sparkle, // Myth tool icon

  // UI Elements
  close: X,
  crown: Crown, // Seat of Power
  plus: Plus,
  minus: Minus,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  move: Move,
  'trash-2': Trash2,
  pipette: Pipette,
  reset: RotateCcw,
  star: Star,

  // Terrain
  trees: Trees,
  leaf: Leaf,
  mountain: Mountain,
  mountains: MountainSnow,
  waves: Waves,
  water: Droplets,
  'mountain-range': MountainSnow, // alias for peaks
  tree: Trees, // alias for forest

  // POIs (Holdings & Landmarks)
  castle: Castle,
  city: Building2,
  town: House,
  village: Tractor,
  dwelling: DoorClosed,
  sanctum: Church,
  monument: Landmark,
  hazard: TriangleAlert,
  curse: Ban,
  ruins: Framer,
};

// FIX: Change IconProps to extend React.SVGAttributes<SVGSVGElement>
// This makes standard SVG props like className, x, y, etc., available on the Icon component.
interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string;
}

export const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = icons[name];
  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found.`);
    return null;
  }
  return <LucideIcon strokeWidth={1.5} {...props} />;
};