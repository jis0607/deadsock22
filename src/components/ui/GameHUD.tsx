import React from 'react';
import { Shield, Heart, Zap, Crosshair, Users, AlertCircle, Compass, RotateCcw, Pause, Play, CheckCircle2, Skull } from 'lucide-react';
import { PlayerData, Weapon, Character, KillFeedEntry } from '../../types/game';
import { sound } from '../../services/audio';

interface GameHUDProps {
  isMultiplayer: boolean;
  localPlayer: {
    name: string;
    character: Character;
    weapon: Weapon;
  };
  remotePlayer: PlayerData | null;
  health: number;
  armor: number;
  ammo: number;
  reserveAmmo: number;
  chronoEnergy: number; // 0 - 100
  chronoCooldown: number;
  wave: number;
  zombiesRemaining: number;
  extractionTimer: number; // seconds
  killFeed: KillFeedEntry[];
  isAimingDownSights: boolean;
  hitMarker: 'body' | 'headshot' | null;
  canReviveTeammate: boolean;
  gameStatus: 'playing' | 'paused' | 'extracted' | 'game_over';
  score: number;
  kills: number;
  onReload: () => void;
  onActivateChronoEcho: () => void;
  onReviveTeammate: () => void;
  onResumeGame: () => void;
  onPauseGame: () => void;
  onReturnToMenu: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  isMultiplayer,
  localPlayer,
  remotePlayer,
  health,
  armor,
  ammo,
  reserveAmmo,
  chronoEnergy,
  chronoCooldown,
  wave,
  zombiesRemaining,
  extractionTimer,
  killFeed,
  isAimingDownSights,
  hitMarker,
  canReviveTeammate,
  gameStatus,
  score,
  kills,
  onReload,
  onActivateChronoEcho,
  onReviveTeammate,
  onResumeGame,
  onPauseGame,
  onReturnToMenu
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isChronoReady = chronoEnergy >= 100 && chronoCooldown <= 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Header Row: Teammate Status (Left), Mission Objective (Center), Minimap Radar & Killfeed (Right) */}
      <div className="flex items-start justify-between">
        {/* Top Left: Teammate Status Widget (Co-op) */}
        <div className="pointer-events-auto flex flex-col gap-2">
          {isMultiplayer && (
            <div className="bg-slate-950/80 backdrop-blur-md p-3.5 rounded-lg border border-slate-800 shadow-xl min-w-[220px]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 font-['Rajdhani'] uppercase">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SQUADMATE</span>
                </div>
                {remotePlayer ? (
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      remotePlayer.health <= 0
                        ? 'bg-red-950 text-red-400 animate-pulse border border-red-500/50'
                        : 'bg-emerald-950 text-emerald-400'
                    }`}
                  >
                    {remotePlayer.health <= 0 ? 'DOWNED' : 'ACTIVE'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">CONNECTING...</span>
                )}
              </div>

              {remotePlayer ? (
                <>
                  <div className="text-sm font-bold text-white font-['Rajdhani'] mb-1.5">
                    {remotePlayer.name}
                  </div>
                  {/* Teammate Health Bar */}
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className={`h-full transition-all duration-200 ${
                        remotePlayer.health <= 0
                          ? 'bg-red-500'
                          : remotePlayer.health < 30
                          ? 'bg-amber-500'
                          : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, remotePlayer.health))}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 font-['Inter']">
                  Waiting for player 2...
                </div>
              )}
            </div>
          )}

          {/* Pause Button */}
          <button
            onClick={() => {
              sound.playUiClick();
              onPauseGame();
            }}
            className="self-start p-2 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-md"
            title="Pause Menu [ESC]"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Top Center: Mission Objective & Extraction Countdown */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/85 backdrop-blur-md px-6 py-2.5 rounded-b-lg border-x border-b border-cyan-500/30 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 font-['Chakra_Petch']">
                WAVE {wave} // EXTRACTION LZ INBOUND
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-white tracking-widest">
              {formatTime(extractionTimer)}
            </div>
            <div className="text-[10px] text-slate-400 font-['Inter'] mt-0.5">
              HOSTILES REMAINING: <strong className="text-red-400 font-mono">{zombiesRemaining}</strong>
            </div>
          </div>
        </div>

        {/* Top Right: Tactical Radar & Kill Feed */}
        <div className="flex flex-col items-end gap-3">
          {/* Tactical Radar Widget */}
          <div className="relative w-28 h-28 rounded-full bg-slate-950/90 border border-cyan-500/40 p-2 shadow-xl backdrop-blur-md flex items-center justify-center overflow-hidden">
            {/* Radar sweep line */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
            <div className="absolute w-full h-px bg-cyan-500/30" />
            <div className="absolute h-full w-px bg-cyan-500/30" />

            {/* Local player center ping */}
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] z-10" />

            {/* Teammate ping (if present) */}
            {remotePlayer && (
              <div
                className="absolute w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#a855f7]"
                style={{
                  top: `${Math.max(15, Math.min(85, 50 + (remotePlayer.z - 0) * 1.5))}%`,
                  left: `${Math.max(15, Math.min(85, 50 + (remotePlayer.x - 0) * 1.5))}%`
                }}
              />
            )}

            {/* Zombie threat red dots */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-red-500 top-5 right-7 animate-ping" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-red-500 bottom-6 left-8" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-red-500 top-8 left-5" />

            <div className="absolute bottom-1 text-[8px] font-mono text-cyan-400/80 font-bold">
              RADAR // 40M
            </div>
          </div>

          {/* Kill Feed */}
          <div className="space-y-1 max-w-[240px]">
            {killFeed.slice(-3).map(feed => (
              <div
                key={feed.id}
                className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow"
              >
                <span className="text-cyan-400 font-bold">{feed.killerName}</span>
                <span className="text-slate-500">[{feed.weaponName}]</span>
                <span className="text-red-400">{feed.victimType}</span>
                {feed.isHeadshot && (
                  <span className="text-amber-400 text-[9px] font-bold">CRIT</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Reticle / Crosshair & Hit Markers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dynamic Crosshair */}
        <div className={`relative transition-all duration-150 ${isAimingDownSights ? 'scale-75' : 'scale-100'}`}>
          {/* Top, Bottom, Left, Right crosshair ticks */}
          <div className="w-0.5 h-3 bg-white/90 absolute -top-5 left-1/2 -translate-x-1/2 shadow" />
          <div className="w-0.5 h-3 bg-white/90 absolute top-2 left-1/2 -translate-x-1/2 shadow" />
          <div className="h-0.5 w-3 bg-white/90 absolute -left-5 top-1/2 -translate-y-1/2 shadow" />
          <div className="h-0.5 w-3 bg-white/90 absolute left-2 top-1/2 -translate-y-1/2 shadow" />
          <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />

          {/* Hit Marker Ticks */}
          {hitMarker && (
            <div
              className={`absolute -inset-3 border-2 rotate-45 animate-ping duration-150 ${
                hitMarker === 'headshot' ? 'border-red-500' : 'border-white'
              }`}
            />
          )}
        </div>

        {/* Downed Teammate Revive Prompt Banner */}
        {canReviveTeammate && (
          <div className="absolute top-2/3 pointer-events-auto flex flex-col items-center gap-2 animate-bounce">
            <button
              onClick={() => {
                sound.playUiClick();
                onReviveTeammate();
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-['Rajdhani'] font-extrabold text-base tracking-widest uppercase rounded shadow-[0_0_25px_rgba(16,185,129,0.8)] border border-emerald-300 flex items-center gap-2"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>HOLD [F] TO REVIVE SQUADMATE</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Row: Operative Vitals (Left), Chrono-Echo Ability (Center), Weapon & Ammo (Right) */}
      <div className="flex items-end justify-between pointer-events-none">
        {/* Bottom Left: Health, Armor, and Character Card */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md p-4 rounded-lg border border-slate-800 shadow-2xl min-w-[260px] max-w-xs">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center font-bold text-base font-['Rajdhani']"
              style={{
                backgroundColor: `${localPlayer.character.color}20`,
                color: localPlayer.character.color,
                border: `1px solid ${localPlayer.character.color}60`
              }}
            >
              {localPlayer.character.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-extrabold text-white font-['Rajdhani'] uppercase tracking-wider">
                {localPlayer.name}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono font-semibold">
                {localPlayer.character.callsign} • {localPlayer.character.role}
              </div>
            </div>
          </div>

          {/* Armor Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400 flex items-center gap-1 font-['Rajdhani']">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> ARMOR
              </span>
              <span className="text-cyan-300 font-mono">{armor}/100</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-150 shadow-[0_0_8px_#06b6d4]"
                style={{ width: `${Math.max(0, Math.min(100, armor))}%` }}
              />
            </div>
          </div>

          {/* Health Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400 flex items-center gap-1 font-['Rajdhani']">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400/30" /> HEALTH
              </span>
              <span className={`font-mono ${health < 30 ? 'text-red-400 font-bold animate-pulse' : 'text-white'}`}>
                {health}/100
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  health < 30 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Center: Chrono-Remnant Echo Ability Gauge */}
        <div className="pointer-events-auto flex flex-col items-center">
          <button
            onClick={() => {
              if (isChronoReady) {
                sound.playChronoEcho();
                onActivateChronoEcho();
              }
            }}
            disabled={!isChronoReady}
            className={`group relative p-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-2xl ${
              isChronoReady
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 cursor-pointer animate-pulse'
                : 'bg-slate-950/80 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <Zap className="w-7 h-7 fill-current" />
            <div className="absolute -top-7 text-[10px] font-bold font-mono tracking-wider uppercase text-cyan-300 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-cyan-500/40">
              {isChronoReady ? 'CHRONO ECHO READY [E]' : `CHARGING ${chronoEnergy}%`}
            </div>
          </button>
        </div>

        {/* Bottom Right: Weapon & Ammunition Widget */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md p-4 rounded-lg border border-slate-800 shadow-2xl min-w-[240px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-['Chakra_Petch']">
              {localPlayer.weapon.category}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">CALIBER 6.8MM</span>
          </div>

          <div className="text-xl font-extrabold text-white font-['Rajdhani'] uppercase tracking-wider mb-2">
            {localPlayer.weapon.name}
          </div>

          {/* Ammo Counters */}
          <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-extrabold font-mono tracking-tight ${ammo <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {ammo}
              </span>
              <span className="text-lg text-slate-500 font-mono">
                / {reserveAmmo}
              </span>
            </div>

            {/* Reload Button */}
            <button
              onClick={() => {
                sound.playReload();
                onReload();
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-['Rajdhani'] font-bold text-slate-300 hover:text-white rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RELOAD [R]</span>
            </button>
          </div>

          {ammo === 0 && (
            <div className="mt-2 text-center text-xs font-bold text-red-400 uppercase font-['Chakra_Petch'] animate-pulse">
              MAGAZINE EMPTY // PRESS [R]
            </div>
          )}
        </div>
      </div>

      {/* Pause Menu Modal Overlay */}
      {gameStatus === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl pointer-events-auto">
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-lg shadow-2xl max-w-sm w-full text-center space-y-4">
            <h3 className="text-3xl font-extrabold text-white font-['Syne'] uppercase">
              GAME PAUSED
            </h3>
            <p className="text-xs text-slate-400 font-['Inter']">
              Combat halted. Select an option to proceed.
            </p>
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  sound.playUiClick();
                  onResumeGame();
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-['Rajdhani'] font-bold text-base uppercase rounded"
              >
                RESUME COMBAT
              </button>
              <button
                onClick={() => {
                  sound.playUiClick();
                  onReturnToMenu();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-['Rajdhani'] font-bold text-base uppercase rounded border border-slate-700"
              >
                ABORT TO MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extraction Victory Overlay */}
      {gameStatus === 'extracted' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl pointer-events-auto animate-fadeIn">
          <div className="bg-slate-950 border border-emerald-500/50 p-8 rounded-lg shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-['Chakra_Petch']">
                MISSION ACCOMPLISHED
              </div>
              <h3 className="text-4xl font-extrabold text-white font-['Syne'] uppercase mt-1">
                SECTOR EXTRACTED
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded border border-slate-800 text-left font-['Rajdhani']">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">SCORE EARNED</span>
                <span className="text-2xl font-bold text-amber-300 font-mono">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">HOSTILES ELIMINATED</span>
                <span className="text-2xl font-bold text-white font-mono">{kills}</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playUiClick();
                onReturnToMenu();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-['Rajdhani'] font-extrabold text-lg uppercase rounded shadow-lg"
            >
              RETURN TO BASE LOBBY
            </button>
          </div>
        </div>
      )}

      {/* Defeat / KIA Overlay */}
      {gameStatus === 'game_over' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl pointer-events-auto animate-fadeIn">
          <div className="bg-slate-950 border border-red-500/50 p-8 rounded-lg shadow-2xl max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/40">
              <Skull className="w-10 h-10" />
            </div>

            <div>
              <div className="text-xs font-bold text-red-500 uppercase tracking-widest font-['Chakra_Petch']">
                OPERATIVE ELIMINATED
              </div>
              <h3 className="text-4xl font-extrabold text-white font-['Syne'] uppercase mt-1">
                KILLED IN ACTION
              </h3>
            </div>

            <p className="text-xs text-slate-400 font-['Inter']">
              Your vital signs flatlined in the quarantine zone. Spacetime stabilized with no surviving remnant.
            </p>

            <button
              onClick={() => {
                sound.playUiClick();
                onReturnToMenu();
              }}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-['Rajdhani'] font-extrabold text-lg uppercase rounded shadow-[0_0_20px_rgba(239,68,68,0.5)]"
            >
              RESPAWN AT MAIN MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
