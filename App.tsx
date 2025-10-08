/**
 * @file App.tsx
 * This is the root component of the Hex Realm Generator application.
 * It manages the main application state, including the realm data, selected hex,
 * active tool, and view options. It orchestrates the interactions between the
 * toolbar, the hex grid canvas, and the various sidebars.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { HexGrid } from './components/HexGrid';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { TerrainPainter } from './components/TerrainPainter';
import { PoiPainter } from './components/PoiPainter';
import { MythSidebar } from './components/MythSidebar';
import { generateRealm } from './services/realmGenerator';
import { exportRealmAsJson, exportSvgAsPng } from './services/fileService';
import type { Realm, Hex, ViewOptions, GenerationOptions, Tool, Myth } from './types';
import { DEFAULT_GRID_SIZE, DEFAULT_TILE_SETS, LANDMARK_TYPES, TERRAIN_TYPES, DEFAULT_TERRAIN_COLORS, BARRIER_COLOR, DEFAULT_GRID_COLOR, DEFAULT_GRID_WIDTH, DEFAULT_TERRAIN_CLUSTERING_MATRIX, DEFAULT_TERRAIN_BIASES } from './constants';
import { useHistory } from './hooks/useHistory';
import { BarrierPainter } from './components/BarrierPainter';
import { ConfirmationDialog } from './components/ConfirmationDialog';

/**
 * State for managing confirmation dialogs.
 */
interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

/**
 * The main application component.
 */
export default function App() {
  const { state: realm, set: setRealm, undo: handleUndo, redo: handleRedo, canUndo, canRedo } = useHistory<Realm | null>(null);
  const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
  const [relocatingMythId, setRelocatingMythId] = useState<number | null>(null);
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showGrid: true,
    isGmView: true,
    orientation: 'pointy',
    hexSize: { x: 50, y: 50 },
    gridColor: DEFAULT_GRID_COLOR,
    gridWidth: DEFAULT_GRID_WIDTH,
  });
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [paintTerrain, setPaintTerrain] = useState<string>(TERRAIN_TYPES[0]);
  const [paintPoi, setPaintPoi] = useState<string | null>('holding:castle');
  const [tileSets, setTileSets] = useState(DEFAULT_TILE_SETS);
  const [terrainColors, setTerrainColors] = useState(DEFAULT_TERRAIN_COLORS);
  const [barrierColor, setBarrierColor] = useState(BARRIER_COLOR);

  const [realmShape, setRealmShape] = useState<'hex' | 'square'>('square');
  const [realmRadius, setRealmRadius] = useState<number>(DEFAULT_GRID_SIZE);
  const [realmWidth, setRealmWidth] = useState<number>(DEFAULT_GRID_SIZE);
  const [realmHeight, setRealmHeight] = useState<number>(DEFAULT_GRID_SIZE);
  
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize landmark counts for generation options.
  const initialLandmarkCounts = LANDMARK_TYPES.reduce((acc, type) => {
    acc[type] = 3;
    return acc;
  }, {} as { [key: string]: number });

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
  });

  /**
   * Generates a new realm based on the current shape and generation options.
   */
  const handleGenerateRealm = useCallback(() => {
    try {
      const options = realmShape === 'hex'
        ? { shape: 'hex' as const, radius: realmRadius }
        : { shape: 'square' as const, width: realmWidth, height: realmHeight };
      const newRealm = generateRealm(options, generationOptions);
      setRealm(newRealm);
      setSelectedHex(null);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred during realm generation.");
      }
    }
  }, [realmShape, realmRadius, realmWidth, realmHeight, generationOptions, setRealm]);

  /**
   * Generates the initial realm on component mount if one doesn't exist.
   */
  useEffect(() => {
    if (!realm) {
        handleGenerateRealm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  /**
   * Effect to handle tool-specific state changes when the active tool is switched.
   */
  useEffect(() => {
    if (activeTool === 'terrain' || activeTool === 'barrier' || activeTool === 'poi' || activeTool === 'myth') {
      setSelectedHex(null);
    }
     if (activeTool !== 'myth') {
      setRelocatingMythId(null);
    }
  }, [activeTool]);

  /**
   * Effect to set up keyboard shortcuts for undo (Ctrl+Z) and redo (Ctrl+Y / Ctrl+Shift+Z).
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (isCtrlOrCmd && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) { // Redo
          if (canRedo) {
            handleRedo();
            setSelectedHex(null);
          }
        } else { // Undo
          if (canUndo) {
            handleUndo();
            setSelectedHex(null);
          }
        }
      } else if (isCtrlOrCmd && event.key.toLowerCase() === 'y') {
        event.preventDefault(); // Standard Redo
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
  }, [canUndo, canRedo, handleUndo, handleRedo]);


  /**
   * Updates one or more hexes in the realm state.
   * @param updatedHexOrHexes A single Hex object or an array of Hex objects to update.
   */
  const handleUpdateHex = useCallback((updatedHexOrHexes: Hex | Hex[]) => {
    if (!realm) return;

    const updates = Array.isArray(updatedHexOrHexes) ? updatedHexOrHexes : [updatedHexOrHexes];
    if (updates.length === 0) return;

    const updatedHexesMap = new Map<string, Hex>();
    updates.forEach(h => updatedHexesMap.set(`${h.q},${h.r}`, h));

    const newHexes = realm.hexes.map(h => {
        const key = `${h.q},${h.r}`;
        return updatedHexesMap.get(key) || h;
    });

    setRealm({ ...realm, hexes: newHexes });

    if (selectedHex) {
        const updatedSelectedHexObject = updates.find(h => h.q === selectedHex.q && h.r === selectedHex.r);
        if (updatedSelectedHexObject) {
            setSelectedHex(updatedSelectedHexObject);
        }
    }
  }, [realm, selectedHex, setRealm]);

  /**
   * Adds a new myth to a specified hex.
   * @param hex The hex where the myth should be added.
   * @param andSelect If true, selects the hex after adding the myth.
   */
  const handleAddMyth = useCallback((hex: Hex, andSelect: boolean = false) => {
    if (!realm) return;
    
    const currentHexState = realm.hexes.find(h => h.q === hex.q && h.r === hex.r);
    if (!currentHexState || currentHexState.myth || currentHexState.holding || currentHexState.landmark) {
        if(currentHexState?.holding || currentHexState?.landmark) alert("Cannot add a myth to a hex with a holding or landmark.");
        return;
    }

    const newMythId = (realm.myths.length > 0 ? Math.max(...realm.myths.map(m => m.id)) : 0) + 1;
    const newMyth: Myth = { id: newMythId, name: `Myth #${newMythId}`, q: hex.q, r: hex.r };
    const newMyths = [...realm.myths, newMyth];
    
    let updatedHexWithMyth: Hex | undefined;
    const newHexes = realm.hexes.map(h => {
        if (h.q === hex.q && h.r === hex.r) {
            updatedHexWithMyth = { ...h, myth: newMythId };
            return updatedHexWithMyth;
        }
        return h;
    });

    setRealm({ ...realm, hexes: newHexes, myths: newMyths });

    if (updatedHexWithMyth && ((selectedHex && selectedHex.q === hex.q && selectedHex.r === hex.r) || andSelect)) {
        setSelectedHex(updatedHexWithMyth);
    }
  }, [realm, setRealm, selectedHex]);
  
  /**
   * Removes a myth from a specified hex.
   * @param hex The hex containing the myth to remove.
   */
  const handleRemoveMyth = useCallback((hex: Hex) => {
      if (!realm || !hex.myth) return;
  
      const removedMythId = hex.myth;
      const newMyths = realm.myths
          .filter(m => m.id !== removedMythId)
          .map(m => m.id > removedMythId ? { ...m, id: m.id - 1 } : m)
          .sort((a,b) => a.id - b.id);
      
      let updatedHexWithoutMyth: Hex | undefined;
      const newHexes = realm.hexes.map(h => {
          if (h.q === hex.q && h.r === hex.r) {
              const { myth, ...rest } = h;
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
  }, [realm, setRealm, selectedHex]);
  
  /**
   * Updates the data of an existing myth.
   * @param updatedMyth The myth object with updated data.
   */
  const handleUpdateMyth = useCallback((updatedMyth: Myth) => {
      if (!realm) return;
      const newMyths = realm.myths.map(m => m.id === updatedMyth.id ? updatedMyth : m);
      setRealm({ ...realm, myths: newMyths });
  }, [realm, setRealm]);

  /**
   * Toggles the myth relocation mode for a given myth ID.
   * @param mythId The ID of the myth to relocate.
   */
  const handleToggleRelocateMyth = useCallback((mythId: number) => {
    setRelocatingMythId(prev => (prev === mythId ? null : mythId));
    if (relocatingMythId !== mythId) {
        setSelectedHex(null);
    }
  }, [relocatingMythId]);

  /**
   * Relocates a myth to a new hex.
   * @param mythId The ID of the myth to move.
   * @param newHex The target hex for the relocation.
   */
  const handleRelocateMyth = useCallback((mythId: number, newHex: Hex) => {
    if (!realm) return;
    
    const targetHexState = realm.hexes.find(h => h.q === newHex.q && h.r === newHex.r);
    if (!targetHexState || targetHexState.myth || targetHexState.holding || targetHexState.landmark) {
        if(targetHexState?.myth) alert("Cannot relocate to a hex that already has a myth.");
        if(targetHexState?.holding || targetHexState?.landmark) alert("Cannot relocate a myth to a hex that has a holding or a landmark.");
        return;
    }

    const mythToMove = realm.myths.find(m => m.id === mythId);
    if (!mythToMove) return;

    const oldHexCoords = { q: mythToMove.q, r: mythToMove.r };
    const updatedMyth = { ...mythToMove, q: newHex.q, r: newHex.r };
    const newMyths = realm.myths.map(m => m.id === mythId ? updatedMyth : m);

    let updatedNewHexWithMyth: Hex | undefined;
    const newHexes = realm.hexes.map(h => {
        if (h.q === oldHexCoords.q && h.r === oldHexCoords.r) {
            const { myth, ...rest } = h;
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
  }, [realm, setRealm]);

  /**
   * Handles importing a realm from a JSON file, ensuring backward compatibility.
   * @param importedRealm The realm object parsed from the JSON file.
   */
  const handleImportRealm = (importedRealm: Realm) => {
    if (!importedRealm.myths) {
        importedRealm.myths = [];
        importedRealm.hexes.forEach(hex => {
            if (hex.myth) {
                importedRealm.myths.push({ id: hex.myth, name: `Myth #${hex.myth}`, q: hex.q, r: hex.r });
            }
        });
    }
    setRealm(importedRealm);
    setSelectedHex(null);
    setRealmShape(importedRealm.shape);
    if (importedRealm.shape === 'hex') {
      setRealmRadius(importedRealm.radius || DEFAULT_GRID_SIZE);
    } else {
      setRealmWidth(importedRealm.width || DEFAULT_GRID_SIZE);
      setRealmHeight(importedRealm.height || DEFAULT_GRID_SIZE);
    }
  };

  const handleExportJson = useCallback(() => { if (realm) exportRealmAsJson(realm); }, [realm]);
  const handleExportPng = useCallback(() => { exportSvgAsPng('hex-grid-svg', 'realm-map.png'); }, []);
  
  /**
   * Designates a hex with a holding as the Seat of Power.
   * @param hex The hex to become the Seat of Power.
   */
  const handleSetSeatOfPower = useCallback((hex: Hex) => {
    if (!realm || !hex.holding) return;
    setRealm({ ...realm, seatOfPower: { q: hex.q, r: hex.r } });
  }, [realm, setRealm]);

  /**
   * Adds a new custom terrain type.
   * @param name The name of the new terrain.
   * @param color The hex color code for the new terrain.
   */
  const handleAddTerrain = useCallback((name: string, color: string) => {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      if (tileSets.terrain.some(t => t.id === id || t.label.toLowerCase() === name.toLowerCase())) {
          alert('A terrain with this name already exists.');
          return;
      }
      const newTerrain = { id, label: name, icon: 'leaf', color };
      setTileSets(prev => ({ ...prev, terrain: [...prev.terrain, newTerrain] }));
      setTerrainColors(prev => ({ ...prev, [id]: color }));
  }, [tileSets.terrain]);

  /**
   * Removes a custom terrain type.
   * @param terrainId The ID of the terrain to remove.
   */
  const handleRemoveTerrain = useCallback((terrainId: string) => {
      if (TERRAIN_TYPES.includes(terrainId)) {
          alert('Cannot remove default terrain types.');
          return;
      }
      setTileSets(prev => ({ ...prev, terrain: prev.terrain.filter(t => t.id !== terrainId) }));
      setTerrainColors(prev => {
          const newColors = { ...prev };
          delete newColors[terrainId];
          return newColors;
      });
      if (realm) {
          setRealm({ ...realm, hexes: realm.hexes.map(h => h.terrain === terrainId ? { ...h, terrain: 'plain' } : h) });
      }
      if (paintTerrain === terrainId) setPaintTerrain(TERRAIN_TYPES[0]);
  }, [realm, setRealm, paintTerrain]);

  const handleUpdateTerrainColor = useCallback((terrainId: string, color: string) => setTerrainColors(prev => ({ ...prev, [terrainId]: color })), []);
  const handleResetTerrainColor = useCallback((terrainId: string) => {
    const defaultColor = DEFAULT_TERRAIN_COLORS[terrainId as keyof typeof DEFAULT_TERRAIN_COLORS];
    if (defaultColor) setTerrainColors(prev => ({ ...prev, [terrainId]: defaultColor }));
  }, []);

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
            setRealm({ ...realm, hexes: realm.hexes.map(h => ({ ...h, barrierEdges: [] })) });
            setConfirmation(null);
        }
    });
  }, [realm, setRealm]);

  const handleCancelConfirmation = () => setConfirmation(null);
  
  /**
   * Updates the terrain clustering matrix for generation.
   */
  const handleClusteringChange = useCallback((terrainA: string, terrainB: string, value: number) => {
    setGenerationOptions(prev => {
        const newMatrix = JSON.parse(JSON.stringify(prev.terrainClusteringMatrix));
        newMatrix[terrainA][terrainB] = value;
        newMatrix[terrainB][terrainA] = value;
        return { ...prev, terrainClusteringMatrix: newMatrix };
    });
  }, []);
  
  const handleGenerationOptionChange = useCallback((key: keyof GenerationOptions, value: any) => setGenerationOptions(prev => ({ ...prev, [key]: value })), []);

  const handleTerrainBiasChange = useCallback((terrainId: string, newBias: number) => setGenerationOptions(prev => ({ ...prev, terrainBiases: { ...prev.terrainBiases, [terrainId]: newBias } })), []);
    
  const handleApplyTemplate = useCallback((templateOptions: Partial<GenerationOptions>) => setGenerationOptions(prev => ({ ...prev, ...templateOptions })), []);
    
  /**
   * Effect to automatically adjust the terrain clustering matrix based on the "terrain roughness" setting.
   */
  useEffect(() => {
      const newMatrix = JSON.parse(JSON.stringify(DEFAULT_TERRAIN_CLUSTERING_MATRIX));
      const multiplier = 2 * (1 - generationOptions.terrainRoughness);
      TERRAIN_TYPES.forEach(t1 => {
          TERRAIN_TYPES.forEach(t2 => {
              const baseValue = DEFAULT_TERRAIN_CLUSTERING_MATRIX[t1]?.[t2] ?? 0;
              if (newMatrix[t1]) newMatrix[t1][t2] = baseValue === 0 ? 0 : Math.max(0.01, Math.min(1, baseValue * multiplier));
          });
      });
      setGenerationOptions(prev => JSON.stringify(prev.terrainClusteringMatrix) === JSON.stringify(newMatrix) ? prev : { ...prev, terrainClusteringMatrix: newMatrix });
  }, [generationOptions.terrainRoughness]);


  return (
    <div className="flex flex-col h-screen w-screen bg-[#191f2a] overflow-hidden">
      <Toolbar 
        onGenerate={handleGenerateRealm}
        onExportJson={handleExportJson}
        onExportPng={handleExportPng}
        onImportJson={handleImportRealm}
        onUndo={() => { handleUndo(); setSelectedHex(null); }}
        onRedo={() => { handleRedo(); setSelectedHex(null); }}
        canUndo={canUndo}
        canRedo={canRedo}
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
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 bg-[#18272e] relative">
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
              paintPoi={paintPoi}
              onAddMyth={handleAddMyth}
              onRemoveMyth={handleRemoveMyth}
              relocatingMythId={relocatingMythId}
              onRelocateMyth={handleRelocateMyth}
              onSetSeatOfPower={handleSetSeatOfPower}
              terrainColors={terrainColors}
              barrierColor={barrierColor}
              isSettingsOpen={isSettingsOpen}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[#a7a984]">
              <p>Generating initial realm...</p>
            </div>
          )}
        </main>
        {activeTool === 'terrain' ? (
          <TerrainPainter paintTerrain={paintTerrain} setPaintTerrain={setPaintTerrain} onClose={() => setActiveTool('select')} tileSets={tileSets} terrainColors={terrainColors} onAddTerrain={handleAddTerrain} onRemoveTerrain={handleRemoveTerrain} onUpdateTerrainColor={handleUpdateTerrainColor} onResetTerrainColor={handleResetTerrainColor} />
        ) : activeTool === 'poi' ? (
          <PoiPainter paintPoi={paintPoi} setPaintPoi={setPaintPoi} onClose={() => setActiveTool('select')} />
        ) : activeTool === 'barrier' ? (
          <BarrierPainter onRemoveAllBarriers={handleRequestRemoveAllBarriers} onClose={() => setActiveTool('select')} barrierColor={barrierColor} onColorChange={setBarrierColor} />
        ) : activeTool === 'myth' && realm ? (
            <MythSidebar realm={realm} selectedHex={selectedHex} onSelectHex={setSelectedHex} onUpdateMyth={handleUpdateMyth} onRemoveMyth={handleRemoveMyth} relocatingMythId={relocatingMythId} onToggleRelocateMyth={handleToggleRelocateMyth} onClose={() => setActiveTool('select')} />
        ) : (
          <Sidebar selectedHex={selectedHex} realm={realm} onUpdateHex={handleUpdateHex} onDeselect={() => setSelectedHex(null)} onSetSeatOfPower={handleSetSeatOfPower} onAddMyth={handleAddMyth} onRemoveMyth={handleRemoveMyth} tileSets={tileSets} />
        )}
      </div>
      {confirmation?.isOpen && (
        <ConfirmationDialog isOpen={confirmation.isOpen} title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={handleCancelConfirmation} />
      )}
    </div>
  );
}
