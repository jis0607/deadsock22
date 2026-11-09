import React, { useState } from 'react';
import { X, Copy, Check, Users, Shield, Zap, Play, ArrowRight, RefreshCw, Radio, Sparkles } from 'lucide-react';
import { Lobby3DScene } from '../3d/Lobby3DScene';
import { PlayerData, Character, Weapon, GameMap, PlayerCosmeticLoadout } from '../../types/game';
import { sound } from '../../services/audio';

interface MultiplayerLobbyModalProps {
  onClose: () => void;
  roomCode: string | null;
  isConnected: boolean;
  pingMs: number;
  isHost: boolean;
  localPlayer: {
    id: string;
    name: string;
    characterId: string;
    weaponId: string;
    isReady: boolean;
    cosmetics?: PlayerCosmeticLoadout;
  };
  remotePlayer: PlayerData | null;
  characters: Character[];
  weapons: Weapon[];
  selectedMap: GameMap;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onQuickMatch: () => void;
  onToggleReady: () => void;
  onChangeCharacter: (charId: string) => void;
  onChangeWeapon: (weaponId: string) => void;
  onStartGame: () => void;
  onOpenCosmetics?: () => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  onClose,
  roomCode,
  isConnected,
  pingMs,
  isHost,
  localPlayer,
  remotePlayer,
  characters,
  weapons,
  selectedMap,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onToggleReady,
  onChangeCharacter,
  onChangeWeapon,
  onStartGame,
  onOpenCosmetics
}) => {
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sound.playUiClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const localChar = characters.find(c => c.id === localPlayer.characterId) || characters[0];
  const localWep = weapons.find(w => w.id === localPlayer.weaponId) || weapons[0];

  const remoteChar = remotePlayer ? characters.find(c => c.id === remotePlayer.characterId) : null;
  const remoteWep = remotePlayer ? weapons.find(w => w.id === remotePlayer.weaponId) : null;

  const bothReady = isHost ? (remotePlayer ? remotePlayer.isReady && localPlayer.isReady : localPlayer.isReady) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl select-none animate-fadeIn">
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400 font-['Chakra_Petch']">
                ONLINE DUO PROTOCOL
              </span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Rajdhani'] tracking-wider uppercase">
              CO-OP STRIKE LOBBY
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status Pill */}
            <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-sm border border-slate-800 text-xs">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-slate-300 font-mono text-[11px]">
                {isConnected ? `ONLINE (${pingMs}ms)` : 'CONNECTING...'}
              </span>
            </div>

            <button
              onClick={() => {
                sound.playUiClick();
                onClose();
              }}
              className="p-2 rounded bg-slate-800/80 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Interactive Lobby Scene Container */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* Three.js 3D viewport showing both operatives */}
          <div className="absolute inset-0 z-0">
            <Lobby3DScene
              localPlayer={localPlayer}
              remotePlayer={remotePlayer}
            />
          </div>

          {/* Overlay UI: Top Room Code Bar */}
          <div className="absolute top-4 left-6 right-6 z-10 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
            {/* Room Code Widget */}
            <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-5 py-3 rounded border border-slate-700 shadow-xl">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase font-['Chakra_Petch']">
                  SQUAD ROOM CODE
                </div>
                <div className="text-2xl font-extrabold font-mono text-cyan-400 tracking-wider">
                  {roomCode || 'CREATING...'}
                </div>
              </div>

              {roomCode && (
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded text-xs font-['Rajdhani'] font-bold uppercase transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
                </button>
              )}
            </div>

            {/* Join / Switch Room Inputs */}
            <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded border border-slate-800 shadow-xl">
              <input
                type="text"
                placeholder="ENTER SQUAD CODE"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-36 uppercase"
              />
              <button
                onClick={() => {
                  if (joinCodeInput.trim()) {
                    sound.playUiClick();
                    onJoinRoom(joinCodeInput.trim());
                  }
                }}
                disabled={!joinCodeInput.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-bold font-['Rajdhani'] uppercase"
              >
                JOIN
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1" />
              <button
                onClick={() => {
                  sound.playUiClick();
                  onQuickMatch();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold font-['Rajdhani'] uppercase flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>MATCHMAKING</span>
              </button>
            </div>
          </div>

          {/* Overlay UI: Operative Cards (Left: Local Player, Right: Remote Player) */}
          <div className="absolute bottom-28 left-6 right-6 z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 pointer-events-none">
            {/* Player 1 Card (Local) */}
            <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md p-5 rounded-lg border border-cyan-500/40 shadow-xl max-w-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-['Chakra_Petch']">
                    OPERATIVE 01 (YOU) {isHost && '• HOST'}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded font-mono uppercase ${
                    localPlayer.isReady
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {localPlayer.isReady ? 'READY' : 'NOT READY'}
                </span>
              </div>

              <div className="text-xl font-extrabold text-white font-['Rajdhani'] mb-4">
                {localPlayer.name}
              </div>

              {/* Character & Weapon Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    HERO CLASS
                  </label>
                  <select
                    value={localPlayer.characterId}
                    onChange={(e) => {
                      sound.playUiClick();
                      onChangeCharacter(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-['Rajdhani'] font-bold text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    PRIMARY WEAPON
                  </label>
                  <select
                    value={localPlayer.weaponId}
                    onChange={(e) => {
                      sound.playUiClick();
                      onChangeWeapon(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-['Rajdhani'] font-bold text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
                  >
                    {weapons.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {onOpenCosmetics && (
                <button
                  onClick={() => {
                    sound.playUiClick();
                    onOpenCosmetics();
                  }}
                  className="mt-3.5 w-full py-2 px-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 rounded text-xs font-['Rajdhani'] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>CUSTOMIZE SKINS & LOCKER</span>
                </button>
              )}
            </div>

            {/* Player 2 Card (Remote Teammate) */}
            <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md p-5 rounded-lg border border-slate-800 shadow-xl max-w-md sm:ml-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${remotePlayer ? 'bg-purple-400' : 'bg-slate-500'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-['Chakra_Petch']">
                    OPERATIVE 02 (TEAMMATE)
                  </span>
                </div>
                {remotePlayer ? (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded font-mono uppercase ${
                      remotePlayer.isReady
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {remotePlayer.isReady ? 'READY' : 'PREPARING'}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">STANDBY</span>
                )}
              </div>

              {remotePlayer ? (
                <>
                  <div className="text-xl font-extrabold text-white font-['Rajdhani'] mb-4">
                    {remotePlayer.name}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">HERO:</span>
                      <span className="font-bold text-purple-300 font-['Rajdhani']">
                        {remoteChar ? remoteChar.name : remotePlayer.characterId}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block">WEAPON:</span>
                      <span className="font-bold text-slate-200 font-['Rajdhani']">
                        {remoteWep ? remoteWep.name : remotePlayer.weaponId}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-5 text-center">
                  <div className="text-sm font-bold text-slate-300 font-['Rajdhani'] tracking-wider uppercase mb-1">
                    WAITING FOR 2ND OPERATIVE
                  </div>
                  <p className="text-xs text-slate-400 font-['Inter']">
                    Share the room code <span className="text-cyan-400 font-mono font-bold">{roomCode}</span> with a friend on another device!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95 z-20">
          {/* Mission Brief summary */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider font-['Chakra_Petch']">
                ACTIVE OPERATION
              </div>
              <div className="text-sm font-bold text-white font-['Rajdhani'] uppercase">
                {selectedMap.name} • {selectedMap.tier}
              </div>
            </div>
          </div>

          {/* Ready & Deploy Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                sound.playUiClick();
                onToggleReady();
              }}
              className={`px-6 py-3 rounded font-['Rajdhani'] font-extrabold text-base tracking-wider uppercase transition-all duration-200 border ${
                localPlayer.isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
            >
              {localPlayer.isReady ? 'READY (LOCKED IN)' : 'READY UP'}
            </button>

            {isHost && (
              <button
                onClick={() => {
                  sound.playUiClick();
                  onStartGame();
                }}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-['Rajdhani'] font-extrabold text-base tracking-widest uppercase rounded shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>DEPLOY SQUAD</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
