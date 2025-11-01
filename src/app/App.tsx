/**
 * @file App.tsx
 * This is the root component of the Hex Realm Generator application.
 * It manages the main application state, including the realm data, selected hex,
 * active tool, and view options. It orchestrates the interactions between the
 * toolbar, the hex grid canvas, and the various sidebars.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { HexGrid } from '@/features/realm/components/HexGrid';
import { Toolbar } from '@/features/realm/components/Toolbar';
import { SelectionSidebar } from '@/features/realm/components/sidebars/SelectionSidebar';
import { TerrainPainterSidebar } from '@/features/realm/components/sidebars/TerrainPainterSidebar';
import { PoiPainterSidebar } from '@/features/realm/components/sidebars/PoiPainterSidebar';
import { MythSidebar } from '@/features/realm/components/sidebars/MythSidebar';
import { generateRealm } from '@/features/realm/services/realmGenerator';
import { exportRealmAsJson, exportSvgAsPng } from '@/features/realm/services/fileService';
import { ExportModal } from '@/features/realm/components/export/ExportModal';
import { CreditsModal } from '@/features/realm/components/CreditsModal';
import type { SettingsTab } from '@/features/realm/components/settings/SettingsModal';
import type { ColorSettingsHandlers } from '@/features/realm/components/settings/ColorSettings';
import type {
  Realm,
  Hex,
  ViewOptions,
  GenerationOptions,
  Tool,
  Myth,
  TileSet,
  Tile,
  TerrainTextures,
  ExportSettings,
  TerrainBrushCharacter,
  FeatureFlags,
  RealmExportData,
} from '@/features/realm/types';
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_TILE_SETS,
  LANDMARK_TYPES,
  TERRAIN_TYPES,
  BARRIER_COLOR,
  DEFAULT_GRID_COLOR,
  DEFAULT_GRID_WIDTH,
  DEFAULT_TERRAIN_CLUSTERING_MATRIX,
  DEFAULT_TERRAIN_BIASES,
  DEFAULT_TERRAIN_HEIGHT_ORDER,
  TERRAIN_BASE_COLORS,
  DEFAULT_POI_ICON_COLOR,
  DEFAULT_POI_BACKDROP_COLOR,
  DEFAULT_FEATURE_FLAGS,
} from '@/features/realm/config/constants';
import { useHistory } from '@/shared/hooks/useHistory';
import { BarrierPainterSidebar } from '@/features/realm/components/sidebars/BarrierPainterSidebar';
import { ConfirmationDialog } from '@/features/realm/components/ConfirmationDialog';
import { HistoryControls } from '@/features/realm/components/HistoryControls';
import { PresetControls } from '@/features/realm/components/PresetControls';
import { RealmPresetsModal } from '@/features/realm/components/RealmPresetsModal';
import { generateTerrainTextures } from '@/features/realm/utils/textureUtils';
import { normalizeKnightVisibility } from '@/features/realm/utils/visibilityUtils';
import { getTerrainBaseColor } from '@/app/theme/colors';
import {
  createRealmExportData,
  ensureRealmHasMyths,
  isRealmExportData,
  REALM_EXPORT_VERSION,
} from '@/features/realm/utils/importExport';
import { GENERATION_PRESETS, COLOR_PRESETS } from '@/features/realm/config/realmPresets';

const INITIAL_KNIGHT_VISIBILITY = normalizeKnightVisibility(
  undefined,
  DEFAULT_TILE_SETS,
  []
).visibility;

const cloneKnightVisibility = () =>
  JSON.parse(JSON.stringify(INITIAL_KNIGHT_VISIBILITY)) as typeof INITIAL_KNIGHT_VISIBILITY;

const DEFAULT_BARRIER_COLOR_VALUE =
  typeof BARRIER_COLOR === 'string' ? BARRIER_COLOR.toUpperCase() : '#000000';

const createDefaultViewOptions = (iconSprayEnabled: boolean): ViewOptions => ({
  showGrid: true,
  showTerrainTooltip: true,
  isGmView: true,
  orientation: 'pointy',
  hexSize: { x: 50, y: 50 },
  gridColor: DEFAULT_GRID_COLOR,
  gridWidth: DEFAULT_GRID_WIDTH,
  showIconSpray: iconSprayEnabled,
  showTerrainIcons: true,
  visibility: {
    knight: cloneKnightVisibility(),
  },
});

const createDefaultExportSettings = (iconSprayEnabled: boolean): ExportSettings => ({
  viewMode: 'referee',
  includeGrid: true,
  includeIconSpray: iconSprayEnabled,
  includeTerrainIcons: true,
  blackAndWhite: false,
});

const mergeViewOptions = (
  incoming: Partial<ViewOptions> | undefined,
  iconSprayEnabled: boolean
): ViewOptions => {
  const defaults = createDefaultViewOptions(iconSprayEnabled);
  if (!incoming) {
    return defaults;
  }
  return {
    ...defaults,
    ...incoming,
    hexSize: incoming.hexSize ? { ...incoming.hexSize } : defaults.hexSize,
    visibility: {
      knight: incoming.visibility?.knight
        ? (JSON.parse(
            JSON.stringify(incoming.visibility.knight)
          ) as typeof defaults.visibility.knight)
        : defaults.visibility.knight,
    },
  };
};

const mergeExportSettings = (
  incoming: Partial<ExportSettings> | undefined,
  iconSprayEnabled: boolean
): ExportSettings => ({
  ...createDefaultExportSettings(iconSprayEnabled),
  ...incoming,
});

interface RealmPresetSnapshot {
  generationOptions: GenerationOptions;
  realm: Realm | null;
  terrainColors: Record<string, string>;
  viewOptions: ViewOptions;
  exportSettings: ExportSettings;
  poiIconColor: string | null;
  poiBackdropColor: string | null;
  barrierColor: string;
  selectedHex: Hex | null;
  relocatingMythId: number | null;
  activeGenerationPresetId: string | null;
  activeColorPresetId: string;
}

const EXPORT_PREVIEW_SVG_ID = 'hex-grid-export-preview';
const DEFAULT_COLOR_PRESET_ID = COLOR_PRESETS[0]?.id ?? 'full-spectrum';
const EXPORT_IMAGE_SCALE = 6;
const CREDITS_COOKIE_KEY = 'hexRealmCreditsSeen';

const hasSeenCredits = () => {
  if (typeof document === 'undefined') {
    return true;
  }
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${CREDITS_COOKIE_KEY}=`));
};

const rememberCredits = () => {
  if (typeof document === 'undefined') {
    return;
  }
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 5);
  document.cookie = `${CREDITS_COOKIE_KEY}=true; expires=${expires.toUTCString()}; path=/`;
};
const SHORTCUT_TIPS_STORAGE_KEY = 'hex-realm-generator:ui:hide-shortcut-tips';
const TOOL_SHORTCUTS: Record<string, Tool> = {
  '1': 'select',
  '2': 'terrain',
  '3': 'barrier',
  '4': 'poi',
  '5': 'myth',
};

/**
 * State for managing confirmation dialogs.
 */
export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  isInfo?: boolean;
}

/**
 * The main application component.
 */
export default function App() {
  const {
    state: realm,
    set: setRealm,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  } = useHistory<Realm | null>(null);
  const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
  const [relocatingMythId, setRelocatingMythId] = useState<number | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => ({
    ...DEFAULT_FEATURE_FLAGS,
  }));
  const [viewOptions, setViewOptions] = useState<ViewOptions>(() =>
    createDefaultViewOptions(DEFAULT_FEATURE_FLAGS.iconSpray)
  );
  const [exportSettings, setExportSettings] = useState<ExportSettings>(() =>
    createDefaultExportSettings(DEFAULT_FEATURE_FLAGS.iconSpray)
  );
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [paintTerrain, setPaintTerrain] = useState<string>(TERRAIN_TYPES[0] ?? 'plain');
  const [paintCharacter, setPaintCharacter] = useState<TerrainBrushCharacter>('preserve');
  const [paintPoi, setPaintPoi] = useState<string | null>('holding:castle');
  const [tileSets, setTileSets] = useState<TileSet>(DEFAULT_TILE_SETS);
  const [terrainColors, setTerrainColors] = useState<Record<string, string>>(() => ({
    ...TERRAIN_BASE_COLORS,
  }));
  const [poiIconColor, setPoiIconColor] = useState<string | null>(DEFAULT_POI_ICON_COLOR);
  const [poiBackdropColor, setPoiBackdropColor] = useState<string | null>(
    DEFAULT_POI_BACKDROP_COLOR
  );
  const [barrierColor, setBarrierColor] = useState<string>(DEFAULT_BARRIER_COLOR_VALUE);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [isRealmPresetsOpen, setIsRealmPresetsOpen] = useState(false);
  const [activeGenerationPresetId, setActiveGenerationPresetId] = useState<string | null>(null);
  const [activeColorPresetId, setActiveColorPresetId] = useState<string>(DEFAULT_COLOR_PRESET_ID);
  const presetSnapshotRef = useRef<RealmPresetSnapshot | null>(null);
  const [areShortcutTipsCollapsed, setAreShortcutTipsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      return window.localStorage.getItem(SHORTCUT_TIPS_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    if (hasSeenCredits()) {
      return;
    }
    setIsCreditsOpen(true);
    rememberCredits();
  }, []);

  useEffect(() => {
    if (featureFlags.iconSpray) {
      return;
    }
    setViewOptions((prev) => (prev.showIconSpray ? { ...prev, showIconSpray: false } : prev));
    setExportSettings((prev) =>
      prev.includeIconSpray ? { ...prev, includeIconSpray: false } : prev
    );
  }, [featureFlags.iconSpray]);

  useEffect(() => {
    const myths = realm?.myths ?? [];
    setViewOptions((prev) => {
      const { visibility, changed } = normalizeKnightVisibility(
        prev.visibility.knight,
        tileSets,
        myths
      );
      if (!changed) {
        return prev;
      }
      return {
        ...prev,
        visibility: {
          ...prev.visibility,
          knight: visibility,
        },
      };
    });
  }, [realm?.myths, tileSets, setViewOptions]);

  const [realmShape, setRealmShape] = useState<'hex' | 'square'>('square');
  const [realmRadius, setRealmRadius] = useState<number>(DEFAULT_GRID_SIZE);
  const [realmWidth, setRealmWidth] = useState<number>(DEFAULT_GRID_SIZE);
  const [realmHeight, setRealmHeight] = useState<number>(DEFAULT_GRID_SIZE);

  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<{
    tab: SettingsTab;
    focusId: string | null;
  }>({ tab: 'general', focusId: null });
  const [isPickingTile, setIsPickingTile] = useState(false);

  // State for performance-enhancing pre-rendered terrain textures
  const [terrainTextures, setTerrainTextures] = useState<TerrainTextures | null>(null);
  const [isLoadingTextures, setIsLoadingTextures] = useState(true);

  const showMessage = useCallback(
    (title: string, message: string, isInfo = true) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        onConfirm: () => setConfirmation(null),
        confirmText: 'OK',
        isInfo,
      });
    },
    [setConfirmation]
  );

  const handlePresetMessage = useCallback(
    ({ title, message, isInfo }: { title: string; message: string; isInfo?: boolean }) =>
      showMessage(title, message, isInfo ?? true),
    [showMessage]
  );

  const handleToggleShortcutTips = useCallback(() => {
    setAreShortcutTipsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(SHORTCUT_TIPS_STORAGE_KEY, String(next));
        } catch (error) {
          console.warn('Failed to persist shortcut tips preference', error);
        }
      }
      return next;
    });
  }, []);

  // Initialize landmark counts for generation options.
  const initialLandmarkCounts = LANDMARK_TYPES.reduce(
    (acc, type) => {
      acc[type] = 3;
      return acc;
    },
    {} as Record<string, number>
  );

  // State for all realm generation parameters.
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    numHoldings: 4,
    numMyths: 6,
    mythMinDistance: 3,
    landmarks: initialLandmarkCounts,
    generateBarriers: false,
    highlandFormation: 'linear',
    highlandFormationStrength: 0.7,
    highlandFormationRotation: 0,
    highlandFormationInverse: false,
    terrainRoughness: 0.5,
    terrainClusteringMatrix: DEFAULT_TERRAIN_CLUSTERING_MATRIX,
    terrainBiases: DEFAULT_TERRAIN_BIASES,
    terrainHeightOrder: DEFAULT_TERRAIN_HEIGHT_ORDER,
  });

  const regenerateRealm = useCallback(
    (options: GenerationOptions) => {
      try {
        const shapeConfig =
          realmShape === 'hex'
            ? { shape: 'hex' as const, radius: realmRadius }
            : { shape: 'square' as const, width: realmWidth, height: realmHeight };
        const newRealm = generateRealm(shapeConfig, options);
        setRealm(newRealm);
        setSelectedHex(null);
        setRelocatingMythId(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred during realm generation.';
        setConfirmation({
          isOpen: true,
          title: 'Generation Failed',
          message: errorMessage,
          onConfirm: () => setConfirmation(null),
          confirmText: 'OK',
          isInfo: true,
        });
      }
    },
    [
      realmShape,
      realmRadius,
      realmWidth,
      realmHeight,
      setRealm,
      setSelectedHex,
      setRelocatingMythId,
      setConfirmation,
    ]
  );

  /**
   * Generates a new realm based on the current shape and generation options.
   */
  const handleGenerateRealm = useCallback(() => {
    regenerateRealm(generationOptions);
  }, [generationOptions, regenerateRealm]);

  /**
   * Generates the initial realm on component mount if one doesn't exist.
   */
  useEffect(() => {
    if (!realm) {
      regenerateRealm(generationOptions);
    }
  }, [realm, regenerateRealm, generationOptions]);

  /**
   * Effect to regenerate terrain textures whenever terrain settings or colors change.
   */
  useEffect(() => {
    if (Object.keys(terrainColors).length === 0) return;

    const generateAndSetTextures = async () => {
      setIsLoadingTextures(true);
      try {
        const textures = await generateTerrainTextures(
          tileSets,
          terrainColors,
          viewOptions.hexSize,
          featureFlags.iconSpray
        );
        setTerrainTextures(textures);
      } catch (error) {
        console.error('Failed to generate terrain textures:', error);
        setConfirmation({
          isOpen: true,
          title: 'Texture Generation Failed',
          message: 'Could not generate map textures. The map may not display correctly.',
          onConfirm: () => setConfirmation(null),
          isInfo: true,
        });
      } finally {
        setIsLoadingTextures(false);
      }
    };
    generateAndSetTextures();
  }, [tileSets, terrainColors, viewOptions.hexSize, featureFlags.iconSpray, setConfirmation]);

  const handlePreviewGenerationPreset = useCallback(
    (presetId: string) => {
      const preset = GENERATION_PRESETS.find((item) => item.id === presetId);
      if (!preset) {
        return;
      }
      setGenerationOptions((prev) => {
        const next: GenerationOptions = {
          ...prev,
          ...preset.options,
          terrainBiases: preset.options.terrainBiases
            ? { ...preset.options.terrainBiases }
            : prev.terrainBiases,
          landmarks: preset.options.landmarks ? { ...preset.options.landmarks } : prev.landmarks,
          terrainHeightOrder: preset.options.terrainHeightOrder
            ? [...preset.options.terrainHeightOrder]
            : prev.terrainHeightOrder,
          terrainClusteringMatrix: preset.options.terrainClusteringMatrix
            ? (JSON.parse(
                JSON.stringify(preset.options.terrainClusteringMatrix)
              ) as GenerationOptions['terrainClusteringMatrix'])
            : prev.terrainClusteringMatrix,
        };
        regenerateRealm(next);
        return next;
      });
    },
    [regenerateRealm]
  );

  const handleUpdatePoiIconColor = useCallback((color: string | null) => {
    setPoiIconColor(color ? color.toUpperCase() : null);
  }, []);

  const handleUpdatePoiBackdropColor = useCallback((color: string | null) => {
    setPoiBackdropColor(color ? color.toUpperCase() : DEFAULT_POI_BACKDROP_COLOR);
  }, []);

  const handleResetPoiIconColor = useCallback(() => {
    setPoiIconColor(DEFAULT_POI_ICON_COLOR.toUpperCase());
  }, []);

  const handleResetPoiBackdropColor = useCallback(() => {
    setPoiBackdropColor(DEFAULT_POI_BACKDROP_COLOR.toUpperCase());
  }, []);

  const handleUpdateBarrierColor = useCallback((color: string) => {
    setBarrierColor(color.toUpperCase());
  }, []);

  const handleResetBarrierColor = useCallback(() => {
    setBarrierColor(DEFAULT_BARRIER_COLOR_VALUE);
  }, []);

  const handlePreviewColorPreset = useCallback(
    (presetId: string) => {
      const preset = COLOR_PRESETS.find((item) => item.id === presetId);
      if (!preset) {
        return;
      }

      setTerrainColors({ ...preset.terrainColors });
      handleUpdatePoiIconColor(preset.poiIconColor);
      handleUpdatePoiBackdropColor(preset.poiBackdropColor);
      handleUpdateBarrierColor(preset.barrierColor);

      if (preset.viewOptions) {
        const overrides = preset.viewOptions;
        setViewOptions((prev) => {
          const nextVisibility = overrides.visibility
            ? {
                ...prev.visibility,
                ...overrides.visibility,
                knight: overrides.visibility.knight
                  ? {
                      ...prev.visibility.knight,
                      ...overrides.visibility.knight,
                    }
                  : prev.visibility.knight,
              }
            : prev.visibility;

          return {
            ...prev,
            ...overrides,
            hexSize: overrides.hexSize ? { ...overrides.hexSize } : prev.hexSize,
            visibility: nextVisibility,
          };
        });
      }

      if (preset.exportSettings) {
        setExportSettings((prev) => ({
          ...prev,
          ...preset.exportSettings,
        }));
      }
    },
    [
      setTerrainColors,
      handleUpdatePoiIconColor,
      handleUpdatePoiBackdropColor,
      handleUpdateBarrierColor,
      setViewOptions,
      setExportSettings,
    ]
  );

  const handleOpenRealmPresets = useCallback(() => {
    presetSnapshotRef.current = {
      generationOptions: JSON.parse(JSON.stringify(generationOptions)) as GenerationOptions,
      realm,
      terrainColors: { ...terrainColors },
      viewOptions: JSON.parse(JSON.stringify(viewOptions)) as ViewOptions,
      exportSettings: { ...exportSettings },
      poiIconColor,
      poiBackdropColor,
      barrierColor,
      selectedHex: selectedHex ? { ...selectedHex } : null,
      relocatingMythId,
      activeGenerationPresetId,
      activeColorPresetId,
    };
    setIsRealmPresetsOpen(true);
  }, [
    generationOptions,
    realm,
    terrainColors,
    viewOptions,
    exportSettings,
    poiIconColor,
    poiBackdropColor,
    barrierColor,
    selectedHex,
    relocatingMythId,
    activeGenerationPresetId,
    activeColorPresetId,
  ]);

  const handleDismissRealmPresets = useCallback(() => {
    const snapshot = presetSnapshotRef.current;
    if (snapshot) {
      setGenerationOptions(snapshot.generationOptions);
      setTerrainColors({ ...snapshot.terrainColors });
      setViewOptions(snapshot.viewOptions);
      setExportSettings(snapshot.exportSettings);
      setPoiIconColor(snapshot.poiIconColor);
      setPoiBackdropColor(snapshot.poiBackdropColor);
      setBarrierColor(snapshot.barrierColor);
      setSelectedHex(snapshot.selectedHex);
      setRelocatingMythId(snapshot.relocatingMythId);
      setActiveGenerationPresetId(snapshot.activeGenerationPresetId);
      setActiveColorPresetId(snapshot.activeColorPresetId);
      setRealm(snapshot.realm);
    }
    presetSnapshotRef.current = null;
    setIsRealmPresetsOpen(false);
  }, [
    setGenerationOptions,
    setTerrainColors,
    setViewOptions,
    setExportSettings,
    setPoiIconColor,
    setPoiBackdropColor,
    setBarrierColor,
    setSelectedHex,
    setRelocatingMythId,
    setActiveGenerationPresetId,
    setActiveColorPresetId,
    setRealm,
  ]);

  const commitPresetSelection = useCallback(
    (selection: { generationPresetId: string | null; colorPresetId: string }) => {
      setActiveGenerationPresetId(selection.generationPresetId);
      setActiveColorPresetId(selection.colorPresetId);
    },
    []
  );

  const handleConfirmRealmPresets = useCallback(
    (selection: { generationPresetId: string | null; colorPresetId: string }) => {
      commitPresetSelection(selection);
      presetSnapshotRef.current = null;
      setIsRealmPresetsOpen(false);
    },
    [commitPresetSelection]
  );

  const handleOpenGenerationSettingsFromPresets = useCallback(
    (selection: { generationPresetId: string | null; colorPresetId: string }) => {
      commitPresetSelection(selection);
      presetSnapshotRef.current = null;
      setIsRealmPresetsOpen(false);
      setSettingsView({ tab: 'generation', focusId: null });
      setIsSettingsOpen(true);
    },
    [commitPresetSelection, setSettingsView, setIsSettingsOpen]
  );

  const handleOpenColorSettingsFromPresets = useCallback(
    (selection: { generationPresetId: string | null; colorPresetId: string }) => {
      commitPresetSelection(selection);
      presetSnapshotRef.current = null;
      setIsRealmPresetsOpen(false);
      setSettingsView({ tab: 'color', focusId: null });
      setIsSettingsOpen(true);
    },
    [commitPresetSelection, setSettingsView, setIsSettingsOpen]
  );

  const handleToggleRealmPresets = useCallback(() => {
    if (isRealmPresetsOpen) {
      handleDismissRealmPresets();
    } else {
      handleOpenRealmPresets();
    }
  }, [isRealmPresetsOpen, handleDismissRealmPresets, handleOpenRealmPresets]);

  /**
   * Effect to handle tool-specific state changes when the active tool is switched.
   */
  useEffect(() => {
    if (
      activeTool === 'terrain' ||
      activeTool === 'barrier' ||
      activeTool === 'poi' ||
      activeTool === 'myth'
    ) {
      setSelectedHex(null);
    }
    if (activeTool !== 'myth') {
      setRelocatingMythId(null);
    }
    if (activeTool !== 'terrain' && activeTool !== 'poi') {
      setIsPickingTile(false);
    }
  }, [activeTool]);

  /**
   * Effect to set up keyboard shortcuts for undo (Ctrl+Z), redo (Ctrl+Y), and canceling actions (Escape).
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const loweredKey = event.key.toLowerCase();

      if (!isEditable && !event.altKey && !isCtrlOrCmd && loweredKey === 'p') {
        event.preventDefault();
        handleToggleRealmPresets();
        return;
      }

      if (isRealmPresetsOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          handleDismissRealmPresets();
        }
        return;
      }

      if (!isEditable && !event.altKey && !isCtrlOrCmd) {
        const mappedTool = TOOL_SHORTCUTS[event.key];
        if (mappedTool) {
          event.preventDefault();
          if (activeTool !== mappedTool) {
            setActiveTool(mappedTool);
          }
          return;
        }
      }

      if (event.key === 'Escape' && isPickingTile) {
        event.preventDefault();
        setIsPickingTile(false);
        return;
      }

      if (isCtrlOrCmd && loweredKey === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) {
            handleRedo();
            setSelectedHex(null);
          }
        } else if (canUndo) {
          handleUndo();
          setSelectedHex(null);
        }
        return;
      }

      if (isCtrlOrCmd && loweredKey === 'y') {
        event.preventDefault();
        if (canRedo) {
          handleRedo();
          setSelectedHex(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeTool,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    isPickingTile,
    setActiveTool,
    handleToggleRealmPresets,
    isRealmPresetsOpen,
    handleDismissRealmPresets,
  ]);

  /**
   * Updates one or more hexes in the realm state.
   * @param updatedHexOrHexes A single Hex object or an array of Hex objects to update.
   */
  const handleUpdateHex = useCallback(
    (updatedHexOrHexes: Hex | Hex[]) => {
      if (!realm) return;

      const updates = Array.isArray(updatedHexOrHexes) ? updatedHexOrHexes : [updatedHexOrHexes];
      if (updates.length === 0) return;

      const updatedHexesMap = new Map<string, Hex>();
      updates.forEach((h) => updatedHexesMap.set(`${h.q},${h.r}`, h));

      const newHexes = realm.hexes.map((h) => {
        const key = `${h.q},${h.r}`;
        return updatedHexesMap.get(key) || h;
      });

      setRealm({ ...realm, hexes: newHexes });

      if (selectedHex) {
        const updatedSelectedHexObject = updates.find(
          (h) => h.q === selectedHex.q && h.r === selectedHex.r
        );
        if (updatedSelectedHexObject) {
          setSelectedHex(updatedSelectedHexObject || null);
        }
      }
    },
    [realm, selectedHex, setRealm]
  );

  /**
   * Adds a new myth to a specified hex.
   * @param hex The hex where the myth should be added.
   * @param andSelect If true, selects the hex after adding the myth.
   */
  const handleAddMyth = useCallback(
    (hex: Hex, andSelect = false) => {
      if (!realm) return;

      const currentHexState = realm.hexes.find((h) => h.q === hex.q && h.r === hex.r);
      if (
        !currentHexState ||
        currentHexState.myth ||
        currentHexState.holding ||
        currentHexState.landmark
      ) {
        if (currentHexState?.holding || currentHexState?.landmark) {
          setConfirmation({
            isOpen: true,
            title: 'Action Blocked',
            message: 'Cannot add a myth to a hex with a holding or landmark.',
            onConfirm: () => setConfirmation(null),
            isInfo: true,
          });
        }
        return;
      }

      const newMythId =
        (realm.myths.length > 0 ? Math.max(...realm.myths.map((m) => m.id)) : 0) + 1;
      const newMyth: Myth = { id: newMythId, name: `Myth #${newMythId}`, q: hex.q, r: hex.r };
      const newMyths = [...realm.myths, newMyth];

      let updatedHexWithMyth: Hex | undefined;
      const newHexes = realm.hexes.map((h) => {
        if (h.q === hex.q && h.r === hex.r) {
          updatedHexWithMyth = { ...h, myth: newMythId };
          return updatedHexWithMyth;
        }
        return h;
      });

      setRealm({ ...realm, hexes: newHexes, myths: newMyths });

      if (
        updatedHexWithMyth &&
        ((selectedHex && selectedHex.q === hex.q && selectedHex.r === hex.r) || andSelect)
      ) {
        setSelectedHex(updatedHexWithMyth);
      }
    },
    [realm, setRealm, selectedHex]
  );

  /**
   * Removes a myth from a specified hex.
   * @param hex The hex containing the myth to remove.
   */
  const handleRemoveMyth = useCallback(
    (hex: Hex) => {
      if (!realm || !hex.myth) return;

      const removedMythId = hex.myth;
      const newMyths = realm.myths
        .filter((m) => m.id !== removedMythId)
        .map((m) => (m.id > removedMythId ? { ...m, id: m.id - 1 } : m))
        .sort((a, b) => a.id - b.id);

      let updatedHexWithoutMyth: Hex | undefined;
      const newHexes = realm.hexes.map((h) => {
        if (h.q === hex.q && h.r === hex.r) {
          const { myth: _removedMyth, ...rest } = h;
          updatedHexWithoutMyth = rest;
          return rest;
        }
        if (h.myth && h.myth > removedMythId) {
          return { ...h, myth: h.myth - 1 };
        }
        return h;
      });

      setRealm({ ...realm, hexes: newHexes, myths: newMyths });

      if (selectedHex && selectedHex.q === hex.q && selectedHex.r === hex.r) {
        setSelectedHex(updatedHexWithoutMyth || null);
      }
    },
    [realm, setRealm, selectedHex]
  );

  /**
   * Updates the data of an existing myth.
   * @param updatedMyth The myth object with updated data.
   */
  const handleUpdateMyth = useCallback(
    (updatedMyth: Myth) => {
      if (!realm) return;
      const newMyths = realm.myths.map((m) => (m.id === updatedMyth.id ? updatedMyth : m));
      setRealm({ ...realm, myths: newMyths });
    },
    [realm, setRealm]
  );

  /**
   * Toggles the myth relocation mode for a given myth ID.
   * @param mythId The ID of the myth to relocate.
   */
  const handleToggleRelocateMyth = useCallback(
    (mythId: number) => {
      setRelocatingMythId((prev) => (prev === mythId ? null : mythId));
      if (relocatingMythId !== mythId) {
        setSelectedHex(null);
      }
    },
    [relocatingMythId]
  );

  /**
   * Relocates a myth to a new hex.
   * @param mythId The ID of the myth to move.
   * @param newHex The target hex for the relocation.
   */
  const handleRelocateMyth = useCallback(
    (mythId: number, newHex: Hex) => {
      if (!realm) return;

      const targetHexState = realm.hexes.find((h) => h.q === newHex.q && h.r === newHex.r);
      if (
        !targetHexState ||
        targetHexState.myth ||
        targetHexState.holding ||
        targetHexState.landmark
      ) {
        if (targetHexState?.myth) {
          setConfirmation({
            isOpen: true,
            title: 'Relocation Blocked',
            message: 'Cannot relocate to a hex that already has a myth.',
            onConfirm: () => setConfirmation(null),
            isInfo: true,
          });
        }
        if (targetHexState?.holding || targetHexState?.landmark) {
          setConfirmation({
            isOpen: true,
            title: 'Relocation Blocked',
            message: 'Cannot relocate a myth to a hex that has a holding or a landmark.',
            onConfirm: () => setConfirmation(null),
            isInfo: true,
          });
        }
        return;
      }

      const mythToMove = realm.myths.find((m) => m.id === mythId);
      if (!mythToMove) return;

      const oldHexCoords = { q: mythToMove.q, r: mythToMove.r };
      const updatedMyth = { ...mythToMove, q: newHex.q, r: newHex.r };
      const newMyths = realm.myths.map((m) => (m.id === mythId ? updatedMyth : m));

      let updatedNewHexWithMyth: Hex | undefined;
      const newHexes = realm.hexes.map((h) => {
        if (h.q === oldHexCoords.q && h.r === oldHexCoords.r) {
          const { myth: _removedMyth, ...rest } = h;
          return rest;
        }
        if (h.q === newHex.q && h.r === newHex.r) {
          updatedNewHexWithMyth = { ...h, myth: mythId };
          return updatedNewHexWithMyth;
        }
        return h;
      });

      setRealm({ ...realm, hexes: newHexes, myths: newMyths });
      setRelocatingMythId(null);
      if (updatedNewHexWithMyth) {
        setSelectedHex(updatedNewHexWithMyth);
      }
    },
    [realm, setRealm]
  );

  /**
   * Handles importing a realm from a JSON file (legacy realm-only files or the new full export).
   * @param payload The parsed JSON data.
   * @throws {Error} When the payload does not resemble a supported export format.
   */
  const handleImportRealm = useCallback(
    (payload: Realm | RealmExportData) => {
      const applyRealmState = (nextRealm: Realm) => {
        setRealm(nextRealm);
        setSelectedHex(null);
        setRelocatingMythId(null);
        setActiveTool('select');
        setIsPickingTile(false);
      };

      const syncRealmDimensions = (
        shape: Realm['shape'],
        radius?: number,
        width?: number,
        height?: number
      ) => {
        setRealmShape(shape);
        if (shape === 'hex') {
          setRealmRadius(radius ?? DEFAULT_GRID_SIZE);
        } else {
          setRealmWidth(width ?? DEFAULT_GRID_SIZE);
          setRealmHeight(height ?? DEFAULT_GRID_SIZE);
        }
      };

      if (isRealmExportData(payload)) {
        if (!payload.realm || !Array.isArray(payload.realm.hexes) || !payload.realm.seatOfPower) {
          throw new Error('Invalid realm export payload.');
        }

        if (payload.version > REALM_EXPORT_VERSION) {
          console.warn(
            `Importing realm export created with newer schema version ${payload.version} (current ${REALM_EXPORT_VERSION}).`
          );
        }

        const realmWithMyths = ensureRealmHasMyths(payload.realm);
        applyRealmState(realmWithMyths);
        syncRealmDimensions(
          payload.realmShape ?? realmWithMyths.shape,
          payload.realmRadius ?? realmWithMyths.radius,
          payload.realmWidth ?? realmWithMyths.width,
          payload.realmHeight ?? realmWithMyths.height
        );

        const nextFeatureFlags: FeatureFlags = {
          ...DEFAULT_FEATURE_FLAGS,
          ...payload.featureFlags,
        };
        setFeatureFlags(nextFeatureFlags);

        setGenerationOptions((prev) => ({
          ...prev,
          ...payload.generationOptions,
        }));
        setTileSets(payload.tileSets);
        setTerrainColors(payload.terrainColors);

        const nextPoiIconColor = Object.prototype.hasOwnProperty.call(payload, 'poiIconColor')
          ? payload.poiIconColor
          : DEFAULT_POI_ICON_COLOR;
        handleUpdatePoiIconColor(nextPoiIconColor);

        const nextPoiBackdropColor = Object.prototype.hasOwnProperty.call(
          payload,
          'poiBackdropColor'
        )
          ? payload.poiBackdropColor
          : DEFAULT_POI_BACKDROP_COLOR;
        handleUpdatePoiBackdropColor(nextPoiBackdropColor);
        handleUpdateBarrierColor(payload.barrierColor ?? DEFAULT_BARRIER_COLOR_VALUE);

        setViewOptions(mergeViewOptions(payload.viewOptions, nextFeatureFlags.iconSpray));
        setExportSettings(mergeExportSettings(payload.exportSettings, nextFeatureFlags.iconSpray));

        const terrainIds = payload.tileSets.terrain.map((tile) => tile.id);
        setPaintTerrain((prev) => (terrainIds.includes(prev) ? prev : (terrainIds[0] ?? prev)));
        setPaintPoi((prev) => {
          if (!prev) return prev;
          const [category, id] = prev.split(':');
          if (category === 'holding') {
            if (payload.tileSets.holding.some((tile) => tile.id === id)) {
              return prev;
            }
            const fallbackHolding = payload.tileSets.holding[0]?.id;
            return fallbackHolding ? `holding:${fallbackHolding}` : null;
          }
          if (category === 'landmark') {
            if (payload.tileSets.landmark.some((tile) => tile.id === id)) {
              return prev;
            }
            const fallbackLandmark = payload.tileSets.landmark[0]?.id;
            return fallbackLandmark ? `landmark:${fallbackLandmark}` : null;
          }
          return prev;
        });

        return;
      }

      if (!payload.hexes || !payload.seatOfPower) {
        throw new Error('Invalid realm file.');
      }
      const legacyRealm = ensureRealmHasMyths(payload);
      applyRealmState(legacyRealm);
      syncRealmDimensions(
        legacyRealm.shape,
        legacyRealm.radius,
        legacyRealm.width,
        legacyRealm.height
      );
    },
    [
      setRealm,
      setSelectedHex,
      setRelocatingMythId,
      setActiveTool,
      setIsPickingTile,
      setRealmShape,
      setRealmRadius,
      setRealmWidth,
      setRealmHeight,
      setFeatureFlags,
      setGenerationOptions,
      setTileSets,
      setTerrainColors,
      handleUpdatePoiIconColor,
      handleUpdatePoiBackdropColor,
      handleUpdateBarrierColor,
      setViewOptions,
      setExportSettings,
      setPaintTerrain,
      setPaintPoi,
    ]
  );

  const buildRealmExportData = useCallback((): RealmExportData | null => {
    if (!realm) return null;
    return createRealmExportData({
      realm,
      realmShape,
      realmRadius,
      realmWidth,
      realmHeight,
      generationOptions,
      tileSets,
      terrainColors,
      viewOptions,
      exportSettings,
      poiIconColor,
      poiBackdropColor,
      barrierColor,
      featureFlags,
    });
  }, [
    realm,
    realmShape,
    realmRadius,
    realmWidth,
    realmHeight,
    generationOptions,
    tileSets,
    terrainColors,
    viewOptions,
    exportSettings,
    poiIconColor,
    poiBackdropColor,
    barrierColor,
    featureFlags,
  ]);

  const handleExportJson = useCallback(() => {
    const exportPayload = buildRealmExportData();
    if (!exportPayload) {
      showMessage('Nothing to Export', 'Generate or import a realm before exporting.', true);
      return;
    }
    exportRealmAsJson(exportPayload);
  }, [buildRealmExportData, showMessage]);
  const handleExportPng = useCallback(() => {
    setExportSettings((prev) => ({
      ...prev,
      includeGrid: viewOptions.showGrid,
      includeIconSpray: viewOptions.showIconSpray,
      includeTerrainIcons: viewOptions.showTerrainIcons,
      viewMode: viewOptions.isGmView ? ('referee' as const) : ('knight' as const),
    }));
    setIsExportModalOpen(true);
  }, [
    setExportSettings,
    setIsExportModalOpen,
    viewOptions.isGmView,
    viewOptions.showGrid,
    viewOptions.showIconSpray,
    viewOptions.showTerrainIcons,
  ]);

  const handleConfirmExport = useCallback(
    (settings: ExportSettings) => {
      if (!realm || isExporting) return;
      setIsExporting(true);

      const runExport = async () => {
        try {
          const fileName =
            settings.viewMode === 'referee' ? 'realm-map-referee.png' : 'realm-map-knight.png';
          await exportSvgAsPng(EXPORT_PREVIEW_SVG_ID, fileName, {
            scale: EXPORT_IMAGE_SCALE,
            hideSelectionHighlights: true,
            monochrome: settings.blackAndWhite,
          });
          setIsExportModalOpen(false);
        } catch (error) {
          console.error('Failed to export PNG', error);
          setConfirmation({
            isOpen: true,
            title: 'Export Failed',
            message:
              'Something went wrong while exporting the PNG. Please try again or report the issue if it persists.',
            onConfirm: () => setConfirmation(null),
            isInfo: true,
          });
        } finally {
          setIsExporting(false);
        }
      };

      void runExport();
    },
    [realm, isExporting, setConfirmation, setIsExportModalOpen]
  );

  const handleExportSettingsChange = useCallback((next: ExportSettings) => {
    setExportSettings(next);
  }, []);

  /**
   * Designates a hex with a holding as the Seat of Power.
   * @param hex The hex to become the Seat of Power.
   */
  const handleSetSeatOfPower = useCallback(
    (hex: Hex) => {
      if (!realm || !hex.holding) return;
      setRealm({ ...realm, seatOfPower: { q: hex.q, r: hex.r } });
    },
    [realm, setRealm]
  );

  const handleUpdateTerrainColor = useCallback(
    (terrainId: string, color: string) =>
      setTerrainColors((prev) => ({ ...prev, [terrainId]: color })),
    []
  );

  const handleResetTerrainColor = useCallback((terrainId: string) => {
    const defaultColor = getTerrainBaseColor(terrainId);
    setTerrainColors((prev) => ({ ...prev, [terrainId]: defaultColor }));
  }, []);

  const handleUpdateTerrainIcon = useCallback((terrainId: string, iconDataUrl: string) => {
    setTileSets((prev) => ({
      ...prev,
      terrain: prev.terrain.map((terrain) =>
        terrain.id === terrainId ? { ...terrain, terrainIcon: iconDataUrl } : terrain
      ),
    }));
  }, []);

  const updatePoiTile = useCallback(
    (category: 'holding' | 'landmark', tileId: string, updater: Partial<Tile>) => {
      setTileSets((prev) => ({
        ...prev,
        [category]: prev[category].map((tile) =>
          tile.id === tileId ? { ...tile, ...updater } : tile
        ),
      }));
    },
    []
  );

  const handleUpdatePoiMarkerIcon = useCallback(
    (category: 'holding' | 'landmark', tileId: string, dataUrl: string) => {
      updatePoiTile(category, tileId, { markerIcon: dataUrl });
    },
    [updatePoiTile]
  );

  const handleUpdatePoiMarkerBackdrop = useCallback(
    (category: 'holding' | 'landmark', tileId: string, dataUrl: string) => {
      updatePoiTile(category, tileId, { markerBackdrop: dataUrl });
    },
    [updatePoiTile]
  );

  const colorSettingsHandlers = useMemo<ColorSettingsHandlers>(
    () => ({
      terrainColors,
      onUpdateTerrainColor: handleUpdateTerrainColor,
      onResetTerrainColor: handleResetTerrainColor,
      poiIconColor,
      poiBackdropColor,
      onUpdatePoiIconColor: (color: string) => handleUpdatePoiIconColor(color),
      onResetPoiIconColor: handleResetPoiIconColor,
      onUpdatePoiBackdropColor: (color: string) => handleUpdatePoiBackdropColor(color),
      onResetPoiBackdropColor: handleResetPoiBackdropColor,
      barrierColor,
      onUpdateBarrierColor: handleUpdateBarrierColor,
      onResetBarrierColor: handleResetBarrierColor,
    }),
    [
      terrainColors,
      handleUpdateTerrainColor,
      handleResetTerrainColor,
      poiIconColor,
      poiBackdropColor,
      handleUpdatePoiIconColor,
      handleResetPoiIconColor,
      handleUpdatePoiBackdropColor,
      handleResetPoiBackdropColor,
      barrierColor,
      handleUpdateBarrierColor,
      handleResetBarrierColor,
    ]
  );

  /**
   * Opens a confirmation dialog to remove all barriers from the map.
   */
  const handleRequestRemoveAllBarriers = useCallback(() => {
    setConfirmation({
      isOpen: true,
      title: 'Remove All Barriers',
      message: 'Are you sure you want to remove all barriers? This action cannot be undone.',
      onConfirm: () => {
        if (!realm) return;
        setRealm({ ...realm, hexes: realm.hexes.map((h) => ({ ...h, barrierEdges: [] })) });
        setConfirmation(null);
      },
    });
  }, [realm, setRealm]);

  const handleCancelConfirmation = () => setConfirmation(null);

  /**
   * Updates the terrain clustering matrix for generation.
   */
  const handleClusteringChange = useCallback(
    (terrainA: string, terrainB: string, value: number) => {
      setGenerationOptions((prev) => {
        const newMatrix = JSON.parse(JSON.stringify(prev.terrainClusteringMatrix));
        const matrixRowA = newMatrix[terrainA];
        const matrixRowB = newMatrix[terrainB];
        if (matrixRowA && matrixRowB) {
          matrixRowA[terrainB] = value;
          matrixRowB[terrainA] = value;
        }
        return { ...prev, terrainClusteringMatrix: newMatrix };
      });
    },
    []
  );

  const handleGenerationOptionChange = useCallback(
    <K extends keyof GenerationOptions>(key: K, value: GenerationOptions[K]) =>
      setGenerationOptions((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleTerrainBiasChange = useCallback(
    (terrainId: string, newBias: number) =>
      setGenerationOptions((prev) => ({
        ...prev,
        terrainBiases: { ...prev.terrainBiases, [terrainId]: newBias },
      })),
    []
  );

  const handleApplyTemplate = useCallback(
    (templateOptions: Partial<GenerationOptions>) =>
      setGenerationOptions((prev) => ({ ...prev, ...templateOptions })),
    []
  );

  /**
   * Handles the start of a tile picking action from a painter tool.
   */
  const handleStartPicking = useCallback(() => {
    if (activeTool === 'terrain' || activeTool === 'poi') {
      setIsPickingTile(true);
    }
  }, [activeTool]);

  /**
   * Handles the result of a tile pick action from the hex grid.
   * @param hex The hex that was clicked during picking mode.
   */
  const handleTilePick = useCallback(
    (hex: Hex) => {
      if (!isPickingTile) return;

      if (activeTool === 'terrain') {
        setPaintTerrain(hex.terrain);
        setPaintCharacter(hex.character ?? 'none');
      } else if (activeTool === 'poi') {
        if (hex.holding) setPaintPoi(`holding:${hex.holding}`);
        else if (hex.landmark) setPaintPoi(`landmark:${hex.landmark}`);
        else if (hex.myth) setPaintPoi('action:myth');
      }

      setIsPickingTile(false);
    },
    [isPickingTile, activeTool]
  );

  /**
   * Effect to automatically adjust the terrain clustering matrix based on the "terrain roughness" setting.
   */
  useEffect(() => {
    const newMatrix = JSON.parse(JSON.stringify(DEFAULT_TERRAIN_CLUSTERING_MATRIX));
    const multiplier = 2 * (1 - generationOptions.terrainRoughness);

    for (const t1 of TERRAIN_TYPES) {
      const row = newMatrix[t1];
      if (!row) continue;
      for (const t2 of TERRAIN_TYPES) {
        const baseValue = DEFAULT_TERRAIN_CLUSTERING_MATRIX[t1]?.[t2] ?? 0;
        row[t2] = baseValue === 0 ? 0 : Math.max(0.01, Math.min(1, baseValue * multiplier));
      }
    }
    setGenerationOptions((prev) =>
      JSON.stringify(prev.terrainClusteringMatrix) === JSON.stringify(newMatrix)
        ? prev
        : { ...prev, terrainClusteringMatrix: newMatrix }
    );
  }, [generationOptions.terrainRoughness, generationOptions.terrainClusteringMatrix]);

  /**
   * Opens the settings modal and focuses on a specific terrain's spray settings.
   */
  const handleOpenSpraySettings = useCallback(
    (terrainId: string) => {
      setSettingsView({
        tab: 'terrain',
        focusId: featureFlags.iconSpray ? terrainId : null,
      });
      setIsSettingsOpen(true);
    },
    [featureFlags.iconSpray]
  );

  const sidebarContent = (() => {
    if (activeTool === 'terrain') {
      return (
        <TerrainPainterSidebar
          paintTerrain={paintTerrain}
          paintCharacter={paintCharacter}
          setPaintTerrain={setPaintTerrain}
          setPaintCharacter={setPaintCharacter}
          onClose={() => setActiveTool('select')}
          tileSets={tileSets}
          terrainColors={terrainColors}
          onUpdateTerrainColor={handleUpdateTerrainColor}
          onResetTerrainColor={handleResetTerrainColor}
          onUpdateTerrainIcon={handleUpdateTerrainIcon}
          onStartPicking={handleStartPicking}
          isPickingTile={isPickingTile}
          onOpenSpraySettings={handleOpenSpraySettings}
          isIconSprayEnabled={featureFlags.iconSpray}
        />
      );
    }

    if (activeTool === 'poi') {
      return (
        <PoiPainterSidebar
          paintPoi={paintPoi}
          setPaintPoi={setPaintPoi}
          onClose={() => setActiveTool('select')}
          onStartPicking={handleStartPicking}
          isPickingTile={isPickingTile}
          tileSets={tileSets}
          onUpdatePoiMarkerIcon={handleUpdatePoiMarkerIcon}
          onUpdatePoiMarkerBackdrop={handleUpdatePoiMarkerBackdrop}
          poiIconColor={poiIconColor}
          poiBackdropColor={poiBackdropColor}
          onChangePoiIconColor={handleUpdatePoiIconColor}
          onChangePoiBackdropColor={handleUpdatePoiBackdropColor}
        />
      );
    }

    if (activeTool === 'barrier') {
      return (
        <BarrierPainterSidebar
          onRemoveAllBarriers={handleRequestRemoveAllBarriers}
          onClose={() => setActiveTool('select')}
          barrierColor={barrierColor}
          onColorChange={handleUpdateBarrierColor}
        />
      );
    }

    if (activeTool === 'myth' && realm) {
      return (
        <MythSidebar
          realm={realm}
          selectedHex={selectedHex}
          onSelectHex={setSelectedHex}
          onUpdateMyth={handleUpdateMyth}
          onRemoveMyth={handleRemoveMyth}
          relocatingMythId={relocatingMythId}
          onToggleRelocateMyth={handleToggleRelocateMyth}
          onClose={() => setActiveTool('select')}
        />
      );
    }

    if (activeTool === 'select') {
      return (
        <SelectionSidebar
          selectedHex={selectedHex}
          realm={realm}
          onUpdateHex={handleUpdateHex}
          onDeselect={() => setSelectedHex(null)}
          onSetSeatOfPower={handleSetSeatOfPower}
          onAddMyth={handleAddMyth}
          onRemoveMyth={handleRemoveMyth}
          tileSets={tileSets}
          showTerrainTooltip={viewOptions.showTerrainTooltip}
          onToggleTerrainTooltip={(value) =>
            setViewOptions((prev) => ({ ...prev, showTerrainTooltip: value }))
          }
        />
      );
    }

    return null;
  })();

  return (
    <div className="flex flex-col h-screen w-screen bg-realm-canvas-backdrop overflow-hidden">
      <Toolbar
        onGenerate={handleGenerateRealm}
        onExportJson={handleExportJson}
        onExportPng={handleExportPng}
        onImportJson={handleImportRealm}
        viewOptions={viewOptions}
        setViewOptions={setViewOptions}
        realmShape={realmShape}
        setRealmShape={setRealmShape}
        realmRadius={realmRadius}
        setRealmRadius={setRealmRadius}
        realmWidth={realmWidth}
        setRealmWidth={setRealmWidth}
        realmHeight={realmHeight}
        setRealmHeight={setRealmHeight}
        generationOptions={generationOptions}
        setGenerationOptions={setGenerationOptions}
        onGenerationOptionChange={handleGenerationOptionChange}
        handleClusteringChange={handleClusteringChange}
        handleTerrainBiasChange={handleTerrainBiasChange}
        onApplyTemplate={handleApplyTemplate}
        tileSets={tileSets}
        setTileSets={setTileSets}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        settingsView={settingsView}
        setSettingsView={setSettingsView}
        setConfirmation={setConfirmation}
        myths={realm?.myths ?? []}
        featureFlags={featureFlags}
        setFeatureFlags={setFeatureFlags}
        onOpenCredits={() => setIsCreditsOpen(true)}
        onToggleRealmPresets={handleToggleRealmPresets}
        isRealmPresetsOpen={isRealmPresetsOpen}
        colorSettings={colorSettingsHandlers}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 bg-realm-map-viewport relative">
          {realm ? (
            <HexGrid
              realm={realm}
              onUpdateHex={handleUpdateHex}
              viewOptions={viewOptions}
              selectedHex={selectedHex}
              onHexClick={setSelectedHex}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              paintTerrain={paintTerrain}
              paintCharacter={paintCharacter}
              paintPoi={paintPoi}
              onAddMyth={handleAddMyth}
              onRemoveMyth={handleRemoveMyth}
              relocatingMythId={relocatingMythId}
              onRelocateMyth={handleRelocateMyth}
              onSetSeatOfPower={handleSetSeatOfPower}
              tileSets={tileSets}
              terrainColors={terrainColors}
              barrierColor={barrierColor}
              isSettingsOpen={isSettingsOpen}
              isPickingTile={isPickingTile}
              onTilePick={handleTilePick}
              setConfirmation={setConfirmation}
              terrainTextures={terrainTextures}
              isLoadingTextures={isLoadingTextures}
              poiIconColor={poiIconColor}
              poiBackdropColor={poiBackdropColor}
              shortcutTipsCollapsed={areShortcutTipsCollapsed}
              onToggleShortcutTips={handleToggleShortcutTips}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              <p>Generating initial realm...</p>
            </div>
          )}
        </main>
        <div className="relative flex-shrink-0 h-full">
          {sidebarContent ? (
            <div key={activeTool} className="sidebar-container h-full flex">
              {sidebarContent}
            </div>
          ) : null}
        </div>
      </div>
      {!isSettingsOpen && (
        <PresetControls
          getExportData={buildRealmExportData}
          onLoadPreset={handleImportRealm}
          onShowMessage={handlePresetMessage}
        />
      )}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleConfirmExport}
        settings={exportSettings}
        onSettingsChange={handleExportSettingsChange}
        realm={realm}
        tileSets={tileSets}
        baseViewOptions={viewOptions}
        terrainTextures={terrainTextures}
        isLoadingTextures={isLoadingTextures}
        barrierColor={barrierColor ?? ''}
        previewSvgId={EXPORT_PREVIEW_SVG_ID}
        isExporting={isExporting}
        terrainColors={terrainColors}
        poiIconColor={poiIconColor}
        poiBackdropColor={poiBackdropColor}
        previewPadding={Math.max(viewOptions.hexSize.x, viewOptions.hexSize.y)}
        isIconSprayEnabled={featureFlags.iconSpray}
      />
      <RealmPresetsModal
        isOpen={isRealmPresetsOpen}
        generationPresets={GENERATION_PRESETS}
        colorPresets={COLOR_PRESETS}
        initialGenerationPresetId={activeGenerationPresetId}
        initialColorPresetId={activeColorPresetId}
        onPreviewGenerationPreset={handlePreviewGenerationPreset}
        onPreviewColorPreset={handlePreviewColorPreset}
        onApply={handleConfirmRealmPresets}
        onCancel={handleDismissRealmPresets}
        onOpenGenerationSettings={handleOpenGenerationSettingsFromPresets}
        onOpenColorSettings={handleOpenColorSettingsFromPresets}
      />
      <CreditsModal isOpen={isCreditsOpen} onClose={() => setIsCreditsOpen(false)} />
      {confirmation?.isOpen && (
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={handleCancelConfirmation}
          confirmText={confirmation.confirmText ?? 'OK'}
          isInfo={confirmation.isInfo ?? false}
        />
      )}
      {!isSettingsOpen && (
        <HistoryControls
          onUndo={() => {
            handleUndo();
            setSelectedHex(null);
          }}
          onRedo={() => {
            handleRedo();
            setSelectedHex(null);
          }}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}
    </div>
  );
}
