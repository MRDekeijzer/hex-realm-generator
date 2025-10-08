
import React, { useState, useCallback, useEffect } from 'react';
import { HexGrid } from './components/HexGrid';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { TerrainPainter } from './components/TerrainPainter';
import { PoiPainter } from './components/PoiPainter';
import { MythSidebar } from './components/MythSidebar';
import { generateRealm } from './services/realmGenerator';
import { exportRealmAsJson, exportSvgAsPng } from './services/fileService';
import type { Realm, Hex, Point, ViewOptions, GenerationOptions, Tool, Myth } from './types';
// FIX: Remove non-existent import 'DEFAULT_TERRAIN_COLORS_MAP' and rely on 'DEFAULT_TERRAIN_COLORS'.
import { DEFAULT_GRID_SIZE, DEFAULT_TILE_SETS, LANDMARK_TYPES, TERRAIN_TYPES, DEFAULT_TERRAIN_COLORS, BARRIER_COLOR, DEFAULT_GRID_COLOR, DEFAULT_GRID_WIDTH } from './constants';
import { useHistory } from './hooks/useHistory';
import { Icon } from './components/Icon';
import { BarrierPainter } from './components/BarrierPainter';
import { ConfirmationDialog } from './components/ConfirmationDialog';

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

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

  const initialLandmarkCounts = LANDMARK_TYPES.reduce((acc, type) => {
    acc[type] = 3;
    return acc;
  }, {} as { [key: string]: number });

  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    numHoldings: 4,
    numMyths: 6,
    mythMinDistance: 3,
    landmarks: initialLandmarkCounts,
    generateBarriers: false,
  });


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

  useEffect(() => {
    if (!realm) {
        handleGenerateRealm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (activeTool === 'terrain' || activeTool === 'barrier' || activeTool === 'poi' || activeTool === 'myth') {
      setSelectedHex(null);
    }
     if (activeTool !== 'myth') {
      setRelocatingMythId(null);
    }
  }, [activeTool]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (isCtrlOrCmd && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) { // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
          if (canRedo) {
            handleRedo();
            setSelectedHex(null);
          }
        } else { // Ctrl+Z or Cmd+Z for Undo
          if (canUndo) {
            handleUndo();
            setSelectedHex(null);
          }
        }
      } else if (isCtrlOrCmd && event.key.toLowerCase() === 'y') {
        event.preventDefault(); // Standard Redo shortcut
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
        // Find the updated version of the currently selected hex from the updates and set it.
        const updatedSelectedHexObject = updates.find(h => h.q === selectedHex.q && h.r === selectedHex.r);
        if (updatedSelectedHexObject) {
            setSelectedHex(updatedSelectedHexObject);
        }
    }
  }, [realm, selectedHex, setRealm]);

  const handleAddMyth = useCallback((hex: Hex, andSelect: boolean = false) => {
    if (!realm) return;

    // Defend against stale state by checking the hex from the current realm state.
    const currentHexState = realm.hexes.find(h => h.q === hex.q && h.r === hex.r);
    if (!currentHexState) return;
    
    if (currentHexState.myth) return;

    if (currentHexState.holding || currentHexState.landmark) {
        alert("Cannot add a myth to a hex that has a holding or a landmark.");
        return;
    }

    const newMythId = (realm.myths.length > 0 ? Math.max(...realm.myths.map(m => m.id)) : 0) + 1;
    const newMyth: Myth = {
        id: newMythId,
        name: `Myth #${newMythId}`,
        q: hex.q,
        r: hex.r
    };

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

    if (updatedHexWithMyth) {
      // If the modified hex is the selected one, or if we're supposed to select it after adding,
      // update the selectedHex state so the UI reflects the change immediately.
      if ((selectedHex && selectedHex.q === hex.q && selectedHex.r === hex.r) || andSelect) {
          setSelectedHex(updatedHexWithMyth);
      }
    }
  }, [realm, setRealm, selectedHex]);
  
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
  
  const handleUpdateMyth = useCallback((updatedMyth: Myth) => {
      if (!realm) return;
  
      const newMyths = realm.myths.map(m => m.id === updatedMyth.id ? updatedMyth : m);
  
      setRealm({ ...realm, myths: newMyths });
  
  }, [realm, setRealm]);

  const handleToggleRelocateMyth = useCallback((mythId: number) => {
    setRelocatingMythId(prev => (prev === mythId ? null : mythId));
    // When relocation starts, deselect the hex so the highlight doesn't get confusing.
    if (relocatingMythId !== mythId) {
        setSelectedHex(null);
    }
  }, [relocatingMythId]);

  const handleRelocateMyth = useCallback((mythId: number, newHex: Hex) => {
    if (!realm) return;
    
    const targetHexState = realm.hexes.find(h => h.q === newHex.q && h.r === newHex.r);
    if (!targetHexState) return;

    if (targetHexState.myth) {
        alert("Cannot relocate to a hex that already has a myth.");
        return;
    }
    
    if (targetHexState.holding || targetHexState.landmark) {
        alert("Cannot relocate a myth to a hex that has a holding or a landmark.");
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

  const handleImportRealm = (importedRealm: Realm) => {
    // Backward compatibility for files without a 'myths' array
    if (!importedRealm.myths) {
        const mythsFromHexes: Myth[] = [];
        importedRealm.hexes.forEach(hex => {
            if (hex.myth) {
                mythsFromHexes.push({
                    id: hex.myth,
                    name: `Myth #${hex.myth}`,
                    q: hex.q,
                    r: hex.r,
                });
            }
        });
        importedRealm.myths = mythsFromHexes;
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

  const handleExportJson = useCallback(() => {
    if (realm) {
      exportRealmAsJson(realm);
    }
  }, [realm]);

  const handleExportPng = useCallback(() => {
    exportSvgAsPng('hex-grid-svg', 'realm-map.png');
  }, []);
  
  const handleSetSeatOfPower = useCallback((hex: Hex) => {
    if (!realm || !hex.holding) return;
    const newRealm = {
        ...realm,
        seatOfPower: { q: hex.q, r: hex.r }
    };
    setRealm(newRealm);
}, [realm, setRealm]);

  const onUndoClick = useCallback(() => {
    handleUndo();
    setSelectedHex(null);
  }, [handleUndo]);

  const onRedoClick = useCallback(() => {
    handleRedo();
    setSelectedHex(null);
  }, [handleRedo]);

  const handleAddTerrain = useCallback((name: string, color: string) => {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      if (tileSets.terrain.some(t => t.id === id || t.label.toLowerCase() === name.toLowerCase())) {
          alert('A terrain with this name already exists.');
          return;
      }
      const newTerrain = {
          id,
          label: name,
          icon: 'leaf', // Generic icon
          color,
      };
      setTileSets(prev => ({
          ...prev,
          terrain: [...prev.terrain, newTerrain],
      }));
      setTerrainColors(prev => ({ ...prev, [id]: color }));
  }, [tileSets.terrain]);

  const handleRemoveTerrain = useCallback((terrainId: string) => {
      if (TERRAIN_TYPES.includes(terrainId)) {
          alert('Cannot remove default terrain types.');
          return;
      }

      setTileSets(prev => ({
          ...prev,
          terrain: prev.terrain.filter(t => t.id !== terrainId),
      }));

      setTerrainColors(prev => {
          const newColors = { ...prev };
          delete newColors[terrainId];
          return newColors;
      });

      if (realm) {
          const newHexes = realm.hexes.map(h => {
              if (h.terrain === terrainId) {
                  return { ...h, terrain: 'plain' }; // Revert to default
              }
              return h;
          });
          setRealm({ ...realm, hexes: newHexes });
      }
      
      if (paintTerrain === terrainId) {
          setPaintTerrain(TERRAIN_TYPES[0]);
      }

  }, [realm, setRealm, paintTerrain]);

  const handleUpdateTerrainColor = useCallback((terrainId: string, color: string) => {
    setTerrainColors(prev => ({ ...prev, [terrainId]: color }));
  }, []);

  const handleResetTerrainColor = useCallback((terrainId: string) => {
    // FIX: Use DEFAULT_TERRAIN_COLORS which is the correct exported constant for the terrain color map.
    const defaultColor = DEFAULT_TERRAIN_COLORS[terrainId as keyof typeof DEFAULT_TERRAIN_COLORS];
    if (defaultColor) {
        setTerrainColors(prev => ({ ...prev, [terrainId]: defaultColor }));
    }
  }, []);

  const handleRequestRemoveAllBarriers = useCallback(() => {
    setConfirmation({
        isOpen: true,
        title: 'Remove All Barriers',
        message: 'Are you sure you want to remove all barriers from the map? This action cannot be undone.',
        onConfirm: () => {
            if (!realm) return;
            const newHexes = realm.hexes.map(h => ({ ...h, barrierEdges: [] }));
            setRealm({ ...realm, hexes: newHexes });
            setConfirmation(null);
        }
    });
  }, [realm, setRealm]);

  const handleCancelConfirmation = () => {
    setConfirmation(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#191f2a] overflow-hidden">
      <Toolbar 
        onGenerate={handleGenerateRealm}
        onExportJson={handleExportJson}
        onExportPng={handleExportPng}
        onImportJson={handleImportRealm}
        onUndo={onUndoClick}
        onRedo={onRedoClick}
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
        tileSets={tileSets}
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
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[#a7a984]">
              <p>Generating initial realm...</p>
            </div>
          )}
        </main>
        {activeTool === 'terrain' ? (
          <TerrainPainter
            paintTerrain={paintTerrain}
            setPaintTerrain={setPaintTerrain}
            onClose={() => setActiveTool('select')}
            tileSets={tileSets}
            terrainColors={terrainColors}
            onAddTerrain={handleAddTerrain}
            onRemoveTerrain={handleRemoveTerrain}
            onUpdateTerrainColor={handleUpdateTerrainColor}
            onResetTerrainColor={handleResetTerrainColor}
          />
        ) : activeTool === 'poi' ? (
          <PoiPainter
            paintPoi={paintPoi}
            setPaintPoi={setPaintPoi}
            onClose={() => setActiveTool('select')}
          />
        ) : activeTool === 'barrier' ? (
          <BarrierPainter
            onRemoveAllBarriers={handleRequestRemoveAllBarriers}
            onClose={() => setActiveTool('select')}
            barrierColor={barrierColor}
            onColorChange={setBarrierColor}
          />
        ) : activeTool === 'myth' && realm ? (
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
        ) : (
          <Sidebar 
            selectedHex={selectedHex}
            realm={realm}
            onUpdateHex={handleUpdateHex}
            onDeselect={() => setSelectedHex(null)}
            onSetSeatOfPower={handleSetSeatOfPower}
            onAddMyth={handleAddMyth}
            onRemoveMyth={handleRemoveMyth}
            tileSets={tileSets}
          />
        )}
      </div>
      {confirmation?.isOpen && (
        <ConfirmationDialog
            isOpen={confirmation.isOpen}
            title={confirmation.title}
            message={confirmation.message}
            onConfirm={confirmation.onConfirm}
            onCancel={handleCancelConfirmation}
        />
      )}
    </div>
  );
}
