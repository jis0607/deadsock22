import React from 'react';
import { Play, Database, HelpCircle, Settings, ShieldAlert, Users, Gamepad2, Globe } from 'lucide-react';
import { GameMode } from '../types/game';

interface MainMenuProps {
  onStartGame: (mode: GameMode) => void;
  onOpenMemoryBank: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onOpenOnlineLobby: () => void;
  savedRemnantCount: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenMemoryBank,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenOnlineLobby,
  savedRemnantCount,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 z-20 pointer-events-auto bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent">
      {/* Background Decorative Tech Lines */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent" />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            TEMPORAL REPLAY ENGINE // CO-OP COHORT ENABLED
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-xs font-mono text-cyan-300">
          <Database className="w-3.5 h-3.5" />
          <span>REMNANTS IN CHRONO-CACHE: {savedRemnantCount}</span>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="max-w-2xl my-auto space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-rose-500 tracking-widest uppercase font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>BIOHAZARD SQUAD SURVIVAL SIMULATOR</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_35px_rgba(0,225,217,0.3)]">
            DEAD<span className="text-cyan-400">//</span>RECKONING
          </h1>

          <p className="text-sm sm:text-base font-mono text-slate-300 font-medium tracking-wide border-l-2 border-cyan-400 pl-3">
            YOU DON'T JUST SURVIVE YOUR DEATHS. <br className="hidden sm:block" />
            <span className="text-cyan-400 font-bold">YOU WEAPONIZE THEM TOGETHER.</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2 max-w-md">
          {/* Solo Run Button */}
          <button
            onClick={() => onStartGame('SOLO')}
            className="group relative flex items-center justify-between px-5 py-3.5 rounded-sm bg-cyan-500 text-slate-950 font-black tracking-wider uppercase text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Play className="w-4 h-4 fill-current" />
              DEPLOY SOLO RUN
            </span>
            <span className="text-xs font-mono bg-slate-950 text-cyan-300 px-2 py-0.5 rounded">
              VANGUARD
            </span>
          </button>

          {/* 2-Player Co-Op Split-Screen Button */}
          <button
            onClick={() => onStartGame('LOCAL_COOP')}
            className="group relative flex items-center justify-between px-5 py-3.5 rounded-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black tracking-wider uppercase text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              DEPLOY 2-PLAYER CO-OP (SPLIT-SCREEN)
            </span>
            <span className="text-xs font-mono bg-slate-950 text-amber-300 px-2 py-0.5 rounded">
              P1 + P2
            </span>
          </button>

          {/* Online Co-Op Lobby Button */}
          <button
            onClick={onOpenOnlineLobby}
            className="flex items-center justify-between px-5 py-3 rounded-sm border border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/30 hover:bg-cyan-950/60 text-cyan-300 font-bold tracking-wider uppercase text-xs transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              ONLINE CO-OP // LOBBY & ARCHITECTURE
            </span>
            <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/50 px-1.5 py-0.5 rounded">
              ROOM CODE
            </span>
          </button>

          {/* Secondary Options */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={onOpenMemoryBank}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-sm border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              REMNANTS
            </button>

            <button
              onClick={onOpenHowToPlay}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-sm border border-slate-800 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              MANUAL
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-sm border border-slate-800 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              SETTINGS
            </button>
          </div>
        </div>

        {/* Co-Op Input Control Guide */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-sm text-[11px] font-mono text-slate-400 max-w-md space-y-1">
          <div className="text-slate-300 font-bold flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            2-PLAYER INPUT ASSIGNMENT:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div><strong className="text-cyan-400">P1 (VANGUARD):</strong> WASD + Mouse, [Space] Dash, [E] Revive</div>
            <div><strong className="text-amber-400">P2 (RECON):</strong> Gamepad (or Arrows+Numpad 0/1/2/3)</div>
          </div>
        </div>
      </div>

      {/* Footer System Specs */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4">
        <div>LOCATION: APEX PETROL // SECTOR 04</div>
        <div>DEAD//RECKONING V2.0 // TWO-PLAYER COOPERATIVE OPERATIONAL</div>
      </div>
    </div>
  );
};
