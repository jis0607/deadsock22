import React from 'react';
import { Skull, RotateCcw, Database, ShieldAlert, ArrowRight, Zap, Target, Flame } from 'lucide-react';
import { RemnantRun } from '../types/game';

interface GameOverModalProps {
  run: RemnantRun | null;
  onRestart: () => void;
  onOpenMemoryBank: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  run,
  onRestart,
  onOpenMemoryBank,
  onReturnToMenu,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
      <div className="w-full max-w-xl bg-slate-900 border border-rose-900/60 rounded-sm shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-rose-500/40 bg-rose-950/40 text-xs font-mono text-rose-400 font-bold uppercase tracking-widest">
            <Skull className="w-4 h-4" />
            <span>VITALS TERMINATED</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(244,63,94,0.4)] font-mono">
            YOU HAVE FALLEN
          </h2>

          <p className="text-xs sm:text-sm font-mono text-rose-300">
            CAUSE: {run?.causeOfDeath || 'OVERRUN BY HORDE'}
          </p>
        </div>

        {/* Remnant Born Hook Banner */}
        {run && (
          <div className="p-4 rounded border border-cyan-500/50 bg-cyan-950/30 text-left space-y-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                <span>NEW REMNANT GENERATED // #{run.runNumber < 10 ? `0${run.runNumber}` : run.runNumber}</span>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                style={{ backgroundColor: `${run.color}25`, color: run.color }}
              >
                {run.playstyle}
              </span>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Your actions, movement route, and weapon fire have been recorded into the Chrono-Engine. <br />
              <strong className="text-cyan-300 font-bold">This Remnant will materialize and fight alongside you on your next run.</strong>
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-500/20 text-center font-mono text-xs">
              <div className="p-1.5 rounded bg-slate-950/60">
                <div className="text-[9px] text-slate-500">SURVIVED</div>
                <div className="font-bold text-white">{formatTime(run.survivalTime)}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-950/60">
                <div className="text-[9px] text-slate-500">KILLS</div>
                <div className="font-bold text-rose-400">{run.kills}</div>
              </div>
              <div className="p-1.5 rounded bg-slate-950/60">
                <div className="text-[9px] text-slate-500">SCORE</div>
                <div className="font-bold text-cyan-400">{run.score.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-sm bg-cyan-500 text-slate-950 font-black tracking-wider uppercase text-base hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" />
            REWEAPONIZE REMNANT // LAUNCH RUN
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
