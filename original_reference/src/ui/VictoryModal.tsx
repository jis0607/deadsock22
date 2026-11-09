import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, RotateCcw, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GameStats } from '../types/game';

interface VictoryModalProps {
  stats: GameStats;
  onRestart: () => void;
  onOpenMemoryBank: () => void;
  onReturnToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  onRestart,
  onOpenMemoryBank,
  onReturnToMenu,
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00e1d9', '#f59e0b', '#3b82f6', '#10b981'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/80 rounded-sm shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-emerald-500/40 bg-emerald-950/40 text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>HELIPAD EVACUATION SUCCESSFUL</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_25px_rgba(0,225,217,0.5)] font-mono">
            EXTRACTION COMPLETE
          </h2>

          <p className="text-xs sm:text-sm font-mono text-cyan-300">
            YOU AND YOUR SYNCHRONIZED REMNANTS HAVE SURVIVED THE HORDE.
          </p>
        </div>

        {/* Debriefing stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs text-left">
          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">FINAL SCORE</div>
            <div className="text-base font-bold text-cyan-400">{stats.score.toLocaleString()}</div>
          </div>

          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">TIME SURVIVED</div>
            <div className="text-base font-bold text-white">{formatTime(stats.timeSurvived)}</div>
          </div>

          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">ZOMBIES SLAIN</div>
            <div className="text-base font-bold text-rose-400">{stats.kills}</div>
          </div>

          <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">REMNANTS SYNCED</div>
            <div className="text-base font-bold text-amber-400">{stats.remnantsActive}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-sm bg-cyan-500 text-slate-950 font-black tracking-wider uppercase text-base hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" />
            DEPLOY AGAIN WITH REMNANTS
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenMemoryBank}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-slate-700 hover:border-cyan-500/60 bg-slate-800 text-slate-200 text-xs font-bold font-mono tracking-wider uppercase transition-all"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              MEMORY BANK
            </button>

            <button
              onClick={onReturnToMenu}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white text-xs font-bold font-mono tracking-wider uppercase transition-all"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
