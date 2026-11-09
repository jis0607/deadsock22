import React from 'react';
import { Play, Database, HelpCircle, Settings, ShieldAlert, Zap, Skull, Crosshair } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenMemoryBank: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  savedRemnantCount: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenMemoryBank,
  onOpenHowToPlay,
  onOpenSettings,
  savedRemnantCount,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 z-20 pointer-events-auto bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent">
      {/* Background Decorative Tech Lines */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent" />
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase font-semibold">
            TEMPORAL REPLAY ENGINE // ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-xs font-mono text-cyan-300">
          <Database className="w-3.5 h-3.5" />
          <span>REMNANTS IN CHRONO-CACHE: {savedRemnantCount}</span>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="max-w-2xl my-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-rose-500 tracking-widest uppercase font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>BIOHAZARD SURVIVAL SIMULATOR</span>
          </div>

          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_35px_rgba(0,225,217,0.3)]">
            DEAD<span className="text-cyan-400">//</span>RECKONING
          </h1>

          <p className="text-base sm:text-lg font-mono text-slate-300 font-medium tracking-wide border-l-2 border-cyan-400 pl-3">
            YOU DON'T JUST SURVIVE YOUR DEATHS. <br className="hidden sm:block" />
            <span className="text-cyan-400 font-bold">YOU WEAPONIZE THEM.</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 max-w-sm">
          <button
            onClick={onStartGame}
            className="group relative flex items-center justify-between px-6 py-4 rounded-sm bg-cyan-500 text-slate-950 font-black tracking-wider uppercase text-base hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <Play className="w-5 h-5 fill-current" />
              DEPLOY TO RUN
            </span>
            <span className="text-xs font-mono bg-slate-950 text-cyan-300 px-2 py-0.5 rounded">
              WAVE 01
            </span>
          </button>

          <button
            onClick={onOpenMemoryBank}
            className="flex items-center justify-between px-6 py-3.5 rounded-sm border border-slate-700 hover:border-cyan-500/60 bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-bold tracking-wider uppercase text-sm transition-all"
          >
            <span className="flex items-center gap-3">
              <Database className="w-4 h-4 text-cyan-400" />
              MEMORY BANK
            </span>
            <span className="text-xs font-mono text-cyan-400">
              {savedRemnantCount} SAVED
            </span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenHowToPlay}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-slate-800 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-xs font-bold tracking-wider uppercase transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              HOW TO PLAY
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-slate-800 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-900 text-slate-300 text-xs font-bold tracking-wider uppercase transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              SETTINGS
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Specs */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-4">
        <div>LOCATION: APEX PETROL // SECTOR 04</div>
        <div>V1.0.4 - READY FOR REPLAY</div>
      </div>
    </div>
  );
};
