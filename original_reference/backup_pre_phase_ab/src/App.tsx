import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, EngineState } from './core/GameEngine';
import { MainMenu } from './ui/MainMenu';
import { HUD } from './ui/HUD';
import { MemoryBankModal } from './ui/MemoryBankModal';
import { UpgradeModal } from './ui/UpgradeModal';
import { GameOverModal } from './ui/GameOverModal';
import { VictoryModal } from './ui/VictoryModal';
import { SettingsModal } from './ui/SettingsModal';
import { HowToPlayModal } from './ui/HowToPlayModal';
import { RemnantRun, GameStats, PerkDef } from './types/game';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<EngineState>('MENU');
  const [showMemoryBank, setShowMemoryBank] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const [savedRemnants, setSavedRemnants] = useState<RemnantRun[]>([]);
  const [upgradeChoices, setUpgradeChoices] = useState<PerkDef[]>([]);
  const [lastSavedRun, setLastSavedRun] = useState<RemnantRun | null>(null);
  const [victoryStats, setVictoryStats] = useState<GameStats | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Load initial remnants
    setSavedRemnants(engine.remnantManager.getSavedRuns());

    // Bind engine callbacks
    engine.onStateChange = (newState) => {
      setGameState(newState);
      if (newState === 'UPGRADE') {
        setUpgradeChoices(engine.currentUpgradeChoices);
      }
    };

    engine.onGameOver = (run) => {
      setLastSavedRun(run);
      setSavedRemnants(engine.remnantManager.getSavedRuns());
    };

    engine.onVictory = (stats) => {
      setVictoryStats(stats);
      setSavedRemnants(engine.remnantManager.getSavedRuns());
    };

    return () => {
      engine.destroy();
    };
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startNewRun();
    }
  };

  const handleSelectPerk = (perk: PerkDef) => {
    if (engineRef.current) {
      engineRef.current.selectPerk(perk);
    }
  };

  const handleToggleRemnant = (id: string) => {
    const updated = savedRemnants.map((r) => {
      if (r.id === id) {
        return { ...r, activeInRun: r.activeInRun === false ? true : false };
      }
      return r;
    });
    setSavedRemnants(updated);
    try {
      localStorage.setItem('DEAD_RECKONING_REMNANTS_V1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Save error:', e);
    }
  };

  const handleReturnToMenu = () => {
    if (engineRef.current) {
      engineRef.current.state = 'MENU';
      engineRef.current.input.releaseLock();
      engineRef.current.enemyManager.clearAll();
      setGameState('MENU');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white select-none font-sans">
      {/* 3D WebGL Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair focus:outline-none"
        tabIndex={0}
      />

      {/* Main Menu Overlay */}
      {gameState === 'MENU' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenMemoryBank={() => setShowMemoryBank(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenSettings={() => setShowSettings(true)}
          savedRemnantCount={savedRemnants.length}
        />
      )}

      {/* In-Game Active HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'UPGRADE') && engineRef.current && (
        <HUD engine={engineRef.current} />
      )}

      {/* Pause Menu Overlay */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 p-6 rounded-sm space-y-4 text-center font-mono">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              SIMULATOR PAUSED
            </h2>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => engineRef.current?.resumeGame()}
                className="px-4 py-3 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase text-xs transition-colors"
              >
                RESUME COMBAT
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase text-xs transition-colors"
              >
                SETTINGS
              </button>
              <button
                onClick={handleReturnToMenu}
                className="px-4 py-2.5 rounded border border-slate-800 hover:bg-rose-950/40 text-rose-400 font-bold uppercase text-xs transition-colors"
              >
                ABORT RUN TO LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roguelite Upgrade Selection Modal */}
      {gameState === 'UPGRADE' && (
        <UpgradeModal
          choices={upgradeChoices}
          onSelect={handleSelectPerk}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          run={lastSavedRun}
          onRestart={handleStartGame}
          onOpenMemoryBank={() => setShowMemoryBank(true)}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Victory Modal */}
      {gameState === 'VICTORY' && victoryStats && (
        <VictoryModal
          stats={victoryStats}
          onRestart={handleStartGame}
          onOpenMemoryBank={() => setShowMemoryBank(true)}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Auxiliary Modals */}
      {showMemoryBank && (
        <MemoryBankModal
          remnants={savedRemnants}
          onClose={() => setShowMemoryBank(false)}
          onToggleRemnant={handleToggleRemnant}
        />
      )}

      {showSettings && (
        <SettingsModal
          engine={engineRef.current}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal
          onClose={() => setShowHowToPlay(false)}
        />
      )}
    </div>
  );
}
