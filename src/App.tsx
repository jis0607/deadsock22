import React, { useState, useEffect, useRef } from 'react';
import { GameEngine, EngineState } from './core/GameEngine';
import { HUD } from './ui/HUD';
import { UpgradeModal } from './ui/UpgradeModal';
import { GameOverModal } from './ui/GameOverModal';
import { VictoryModal } from './ui/VictoryModal';
import { MemoryBankModal } from './ui/MemoryBankModal';
import { HowToPlayModal } from './ui/HowToPlayModal';
import { SettingsModal } from './ui/SettingsModal';

import { MainCityScene } from './components/3d/MainCityScene';
import { MainMenu } from './components/ui/MainMenu';
import { PlayModeModal } from './components/ui/PlayModeModal';
import { MultiplayerLobbyModal } from './components/ui/MultiplayerLobbyModal';
import { CharacterModal } from './components/ui/CharacterModal';
import { ArmoryModal } from './components/ui/ArmoryModal';
import { OperationsModal } from './components/ui/OperationsModal';
import { CollectionModal } from './components/ui/CollectionModal';
import { CustomizationShowroom } from './components/ui/CustomizationShowroom';

import { CHARACTERS, WEAPONS, MAPS } from './data/gameData';
import { DEFAULT_COSMETIC_LOADOUT } from './data/cosmeticsData';
import { RemnantRun, GameStats, PerkDef, GameMode, PlayerCosmeticLoadout, PlayerData } from './types/game';
import { safeStorage } from './utils/storage';
import { net } from './services/network';
import { sound } from './services/audio';

type ActiveMenuModal =
  | null
  | 'play'
  | 'lobby'
  | 'operations'
  | 'armory'
  | 'characters'
  | 'customization'
  | 'collection'
  | 'settings'
  | 'memory_bank'
  | 'how_to_play';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Engine state: 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADE' | 'GAMEOVER' | 'VICTORY'
  const [gameState, setGameState] = useState<EngineState>('MENU');
  const [activeModal, setActiveModal] = useState<ActiveMenuModal>(null);

  // Remnant & Match Results
  const [savedRemnants, setSavedRemnants] = useState<RemnantRun[]>([]);
  const [upgradeChoices, setUpgradeChoices] = useState<PerkDef[]>([]);
  const [lastSavedRun, setLastSavedRun] = useState<RemnantRun | null>(null);
  const [victoryStats, setVictoryStats] = useState<GameStats | null>(null);

  // User Profile
  const [playerName] = useState<string>(() => {
    const saved = localStorage.getItem('dr_player_name');
    if (saved) return saved;
    const names = ['Apex Stalker', 'Ghost Vanguard', 'Shadow Operative', 'Viper Scout'];
    const chosen = `${names[Math.floor(Math.random() * names.length)]}-${Math.floor(10 + Math.random() * 89)}`;
    localStorage.setItem('dr_player_name', chosen);
    return chosen;
  });

  const [playerLevel] = useState<number>(48);
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('dr_player_credits');
    return saved ? parseInt(saved, 10) : 28500;
  });
  const [chronoCores] = useState<number>(18);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Cosmetics Loadout
  const [cosmetics, setCosmetics] = useState<PlayerCosmeticLoadout>(() => {
    const saved = localStorage.getItem('dr_player_cosmetics');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_COSMETIC_LOADOUT;
  });

  const [unlockedSkinIds, setUnlockedSkinIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dr_unlocked_skins');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return ['skin_ar_digi_militia', 'skin_smg_desert_spec', 'skin_sniper_arctic', 'skin_sg_carbon', 'skin_ar_woodland'];
  });

  const [unlockedCosmeticIds, setUnlockedCosmeticIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dr_unlocked_cosmetics');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return ['helm_fast_ballistic', 'mask_skull_half', 'outfit_viper_specops', 'pack_assault', 'acc_radio'];
  });

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('viper');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>('ar_chronostrike');
  const [selectedMapId, setSelectedMapId] = useState<string>('neon_quarantine');

  // Online Multiplayer State
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pingMs, setPingMs] = useState<number>(24);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [remotePlayer, setRemotePlayer] = useState<PlayerData | null>(null);

  const activeChar = CHARACTERS.find(c => c.id === selectedCharacterId) || CHARACTERS[0];
  const activeWeapon = WEAPONS.find(w => w.id === selectedWeaponId) || WEAPONS[0];
  const activeMap = MAPS.find(m => m.id === selectedMapId) || MAPS[0];

  // Initialize GameEngine on Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Load initial saved remnants
    setSavedRemnants(engine.remnantManager.getSavedRuns());

    // Bind engine state callbacks
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

    // Wire online multiplayer telemetry emission
    engine.onLocalPlayerMoved = (data) => {
      if (engine.gameMode === 'ONLINE_COOP') {
        net.sendPlayerUpdate({
          ...data,
          state: (data.state as PlayerData['state']) || 'idle',
          characterId: selectedCharacterId,
          weaponId: selectedWeaponId
        });
      }
    };

    engine.onLocalPlayerFired = (origin, dir, weaponId) => {
      if (engine.gameMode === 'ONLINE_COOP') {
        net.shootBullet(origin, dir, weaponId);
      }
    };

    return () => {
      engine.destroy();
    };
  }, []);

  // Online Multiplayer Network Event Listeners
  useEffect(() => {
    const unsubConn = net.on('connection_changed', (data: unknown) => {
      const d = data as { connected: boolean };
      setIsConnected(d.connected);
    });

    const unsubPing = net.on('ping_updated', (data: unknown) => {
      const d = data as { ping: number };
      setPingMs(d.ping);
    });

    const unsubJoined = net.on('room_joined', (data: unknown) => {
      const d = data as {
        roomCode: string;
        playerId: string;
        isHost: boolean;
        players: PlayerData[];
      };
      setRoomCode(d.roomCode);
      setIsHost(d.isHost);
      const other = d.players.find(p => p.id !== d.playerId);
      if (other) {
        setRemotePlayer(other);
      }
    });

    const unsubPlayerJoined = net.on('player_joined', (data: unknown) => {
      const d = data as { player: PlayerData };
      setRemotePlayer(d.player);
      sound.playUiClick();
    });

    const unsubPlayerMoved = net.on('player_moved', (data: unknown) => {
      const d = data as { playerId: string; state: PlayerData };
      setRemotePlayer(d.state);
      if (engineRef.current && engineRef.current.gameMode === 'ONLINE_COOP') {
        engineRef.current.updateRemotePlayer(d.state);
      }
    });

    const unsubBulletShot = net.on('bullet_shot', (data: unknown) => {
      const d = data as { origin: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number }; weaponId: string };
      if (engineRef.current && engineRef.current.gameMode === 'ONLINE_COOP') {
        engineRef.current.triggerRemotePlayerShoot(d.origin, d.direction, d.weaponId);
      }
    });

    const unsubReady = net.on('ready_changed', (data: unknown) => {
      const d = data as { playerId: string; isReady: boolean };
      if (d.playerId === net.myPlayerId) {
        setIsReady(d.isReady);
      } else {
        setRemotePlayer(prev => prev ? { ...prev, isReady: d.isReady } : null);
      }
    });

    const unsubLoadout = net.on('loadout_changed', (data: unknown) => {
      const d = data as { playerId: string; characterId: string; weaponId: string; cosmetics?: PlayerCosmeticLoadout };
      if (d.playerId !== net.myPlayerId) {
        setRemotePlayer(prev => prev ? {
          ...prev,
          characterId: d.characterId,
          weaponId: d.weaponId,
          cosmetics: d.cosmetics || prev.cosmetics
        } : null);
      }
    });

    const unsubGameStarted = net.on('game_started', () => {
      handleLaunchEngineRun('ONLINE_COOP');
    });

    const unsubRevived = net.on('player_revived', (data: unknown) => {
      const d = data as { reviverId: string; revivedId: string };
      if (engineRef.current) {
        if (d.revivedId === net.myPlayerId) {
          engineRef.current.player.revive();
        } else if (engineRef.current.player2) {
          engineRef.current.player2.revive();
        }
      }
    });

    const unsubLeft = net.on('player_left', () => {
      setRemotePlayer(null);
    });

    return () => {
      unsubConn();
      unsubPing();
      unsubJoined();
      unsubPlayerJoined();
      unsubPlayerMoved();
      unsubBulletShot();
      unsubReady();
      unsubLoadout();
      unsubGameStarted();
      unsubRevived();
      unsubLeft();
    };
  }, [selectedCharacterId, selectedWeaponId]);

  // Launch Engine Run (Solo or Online Co-op)
  const handleLaunchEngineRun = (mode: GameMode = 'SOLO') => {
    setActiveModal(null);
    if (engineRef.current) {
      engineRef.current.startNewRun(mode);
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
    safeStorage.setItem('DEAD_RECKONING_REMNANTS_V1', JSON.stringify(updated));
  };

  const handleReturnToMenu = () => {
    if (engineRef.current) {
      engineRef.current.state = 'MENU';
      engineRef.current.input.releaseLock();
      engineRef.current.enemyManager.clearAll();
      setGameState('MENU');
    }
    net.disconnect();
    setRemotePlayer(null);
  };

  // Online Room Operations
  const handleCreateRoom = async () => {
    try {
      const code = await net.createRoom(selectedMapId);
      net.connectToRoom({
        roomCode: code,
        playerName,
        characterId: selectedCharacterId,
        weaponId: selectedWeaponId,
        cosmetics
      });
      setActiveModal('lobby');
    } catch (e) {
      console.error('Failed to create room:', e);
    }
  };

  const handleJoinRoom = (code: string) => {
    net.connectToRoom({
      roomCode: code,
      playerName,
      characterId: selectedCharacterId,
      weaponId: selectedWeaponId,
      cosmetics
    });
    setActiveModal('lobby');
  };

  const handleQuickMatch = async () => {
    try {
      const { roomCode: code } = await net.quickMatch();
      net.connectToRoom({
        roomCode: code,
        playerName,
        characterId: selectedCharacterId,
        weaponId: selectedWeaponId,
        cosmetics
      });
      setActiveModal('lobby');
    } catch (e) {
      console.error('Quickmatch error:', e);
    }
  };

  const handleToggleReady = () => {
    net.toggleReady();
    setIsReady(r => !r);
  };

  const handleStartMultiplayerMatch = () => {
    net.startGame();
    handleLaunchEngineRun('ONLINE_COOP');
  };

  const isPlayingActiveGame = gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'UPGRADE';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-white select-none font-sans">
      {/* 1. Primary 3D WebGL Three.js Game Engine Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block cursor-crosshair focus:outline-none ${
          gameState === 'MENU' ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'
        }`}
        tabIndex={0}
      />

      {/* 2. Main Menu 3D Cinematic City Backdrop Scene (Active during Menu navigation) */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 z-0">
          <MainCityScene
            selectedCharacterId={selectedCharacterId}
            selectedCharacterColor={activeChar.color}
            selectedWeaponId={selectedWeaponId}
            cosmetics={cosmetics}
          />
        </div>
      )}

      {/* 3. AAA Video Game Main Menu Interface */}
      {gameState === 'MENU' && (
        <MainMenu
          onNavigate={(targetView) => {
            if (targetView === 'play') setActiveModal('play');
            else if (targetView === 'operations') setActiveModal('operations');
            else if (targetView === 'armory') setActiveModal('armory');
            else if (targetView === 'characters') setActiveModal('characters');
            else if (targetView === 'customization') setActiveModal('customization');
            else if (targetView === 'collection') setActiveModal('collection');
            else if (targetView === 'settings') setActiveModal('settings');
            else if (targetView === 'memory_bank') setActiveModal('memory_bank');
            else if (targetView === 'how_to_play') setActiveModal('how_to_play');
          }}
          onQuickDeploy={() => handleLaunchEngineRun('SOLO')}
          playerName={playerName}
          playerLevel={playerLevel}
          credits={credits}
          chronoCores={chronoCores}
          savedRemnantCount={savedRemnants.length}
          isMuted={isMuted}
          onToggleMute={() => {
            setIsMuted(m => {
              sound.setMuted(!m);
              return !m;
            });
          }}
        />
      )}

      {/* 4. Play Mode Selection Modal */}
      {activeModal === 'play' && (
        <PlayModeModal
          onClose={() => setActiveModal(null)}
          onSelectSolo={() => handleLaunchEngineRun('SOLO')}
          onSelectCoop={handleCreateRoom}
        />
      )}

      {/* 5. Online Multiplayer Co-op Lobby Modal */}
      {activeModal === 'lobby' && (
        <MultiplayerLobbyModal
          onClose={() => {
            net.disconnect();
            setActiveModal(null);
          }}
          roomCode={roomCode}
          isConnected={isConnected}
          pingMs={pingMs}
          isHost={isHost}
          localPlayer={{
            id: net.myPlayerId || 'p_local',
            name: playerName,
            characterId: selectedCharacterId,
            weaponId: selectedWeaponId,
            isReady,
            cosmetics
          }}
          remotePlayer={remotePlayer}
          characters={CHARACTERS}
          weapons={WEAPONS}
          selectedMap={activeMap}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onQuickMatch={handleQuickMatch}
          onToggleReady={handleToggleReady}
          onChangeCharacter={(cId) => {
            setSelectedCharacterId(cId);
            net.changeLoadout(cId, selectedWeaponId, cosmetics);
          }}
          onChangeWeapon={(wId) => {
            setSelectedWeaponId(wId);
            net.changeLoadout(selectedCharacterId, wId, cosmetics);
          }}
          onStartGame={handleStartMultiplayerMatch}
          onOpenCosmetics={() => setActiveModal('customization')}
        />
      )}

      {/* 6. Character Showcase Modal */}
      {activeModal === 'characters' && (
        <CharacterModal
          onClose={() => setActiveModal(null)}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={(charId) => {
            setSelectedCharacterId(charId);
            net.changeLoadout(charId, selectedWeaponId, cosmetics);
          }}
        />
      )}

      {/* 7. Armory Weapon Showroom Modal */}
      {activeModal === 'armory' && (
        <ArmoryModal
          onClose={() => setActiveModal(null)}
          selectedWeaponId={selectedWeaponId}
          onSelectWeapon={(weaponId) => {
            setSelectedWeaponId(weaponId);
            net.changeLoadout(selectedCharacterId, weaponId, cosmetics);
          }}
        />
      )}

      {/* 8. Cosmetics & Locker Showroom */}
      {activeModal === 'customization' && (
        <CustomizationShowroom
          onClose={() => setActiveModal(null)}
          activeCharacter={activeChar}
          activeWeapon={activeWeapon}
          cosmetics={cosmetics}
          unlockedSkinIds={unlockedSkinIds}
          unlockedCosmeticIds={unlockedCosmeticIds}
          credits={credits}
          onEquipCosmetic={(updated: Partial<PlayerCosmeticLoadout>) => {
            const next = { ...cosmetics, ...updated };
            setCosmetics(next);
            localStorage.setItem('dr_player_cosmetics', JSON.stringify(next));
            net.updateCosmetics(next);
          }}
          onUnlockSkin={(skinId, cost) => {
            if (credits >= cost) {
              const nextCredits = credits - cost;
              setCredits(nextCredits);
              localStorage.setItem('dr_player_credits', nextCredits.toString());
              const nextSkins = [...unlockedSkinIds, skinId];
              setUnlockedSkinIds(nextSkins);
              localStorage.setItem('dr_unlocked_skins', JSON.stringify(nextSkins));
            }
          }}
          onUnlockCosmetic={(cosmeticId, cost) => {
            if (credits >= cost) {
              const nextCredits = credits - cost;
              setCredits(nextCredits);
              localStorage.setItem('dr_player_credits', nextCredits.toString());
              const nextCosmetics = [...unlockedCosmeticIds, cosmeticId];
              setUnlockedCosmeticIds(nextCosmetics);
              localStorage.setItem('dr_unlocked_cosmetics', JSON.stringify(nextCosmetics));
            }
          }}
        />
      )}

      {/* 9. Operations & Map Selection Modal */}
      {activeModal === 'operations' && (
        <OperationsModal
          onClose={() => setActiveModal(null)}
          selectedMapId={selectedMapId}
          onSelectMap={(mapId) => {
            setSelectedMapId(mapId);
            net.selectMap(mapId);
          }}
        />
      )}

      {/* 10. Collection & Lore Archives */}
      {activeModal === 'collection' && (
        <CollectionModal onClose={() => setActiveModal(null)} />
      )}

      {/* 11. Chrono Memory Bank Modal */}
      {activeModal === 'memory_bank' && (
        <MemoryBankModal
          remnants={savedRemnants}
          onClose={() => setActiveModal(null)}
          onToggleRemnant={handleToggleRemnant}
        />
      )}

      {/* 12. Tactical Manual (How to Play) Modal */}
      {activeModal === 'how_to_play' && (
        <HowToPlayModal onClose={() => setActiveModal(null)} />
      )}

      {/* 13. Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          engine={engineRef.current}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 14. IN-GAME ACTIVE HUD & OVERLAYS                                          */}
      {/* ========================================================================= */}
      {isPlayingActiveGame && engineRef.current && (
        <HUD engine={engineRef.current} />
      )}

      {/* 15. In-Game Pause Overlay */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 p-6 rounded-sm space-y-4 text-center font-mono">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider font-['Rajdhani']">
              SIMULATOR PAUSED
            </h2>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => engineRef.current?.resumeGame()}
                className="px-4 py-3 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase text-xs transition-colors font-['Rajdhani'] tracking-wider text-base"
              >
                RESUME COMBAT
              </button>
              <button
                onClick={() => setActiveModal('settings')}
                className="px-4 py-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase text-xs transition-colors font-['Rajdhani'] text-sm"
              >
                SETTINGS
              </button>
              <button
                onClick={handleReturnToMenu}
                className="px-4 py-2.5 rounded border border-rose-900/60 hover:bg-rose-950/40 text-rose-400 font-bold uppercase text-xs transition-colors font-['Rajdhani'] text-sm"
              >
                ABORT RUN TO LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 16. Roguelite Upgrade Perk Selection Modal */}
      {gameState === 'UPGRADE' && (
        <UpgradeModal
          choices={upgradeChoices}
          onSelect={handleSelectPerk}
        />
      )}

      {/* 17. Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          run={lastSavedRun}
          onRestart={() => handleLaunchEngineRun(engineRef.current?.gameMode || 'SOLO')}
          onOpenMemoryBank={() => setActiveModal('memory_bank')}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* 18. Victory & Extraction Clearance Modal */}
      {gameState === 'VICTORY' && victoryStats && (
        <VictoryModal
          stats={victoryStats}
          onRestart={() => handleLaunchEngineRun(engineRef.current?.gameMode || 'SOLO')}
          onOpenMemoryBank={() => setActiveModal('memory_bank')}
          onReturnToMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}
