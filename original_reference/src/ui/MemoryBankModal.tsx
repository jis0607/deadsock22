import React, { useState } from 'react';
import { X, Database, CheckCircle2, Circle, Shield, Flame, Zap, Target, Crosshair, Award } from 'lucide-react';
import { RemnantRun, Playstyle } from '../types/game';

interface MemoryBankModalProps {
  remnants: RemnantRun[];
  onClose: () => void;
  onToggleRemnant: (id: string) => void;
}

export const MemoryBankModal: React.FC<MemoryBankModalProps> = ({
  remnants,
  onClose,
  onToggleRemnant,
}) => {
  const [selectedRemnant, setSelectedRemnant] = useState<RemnantRun | null>(remnants[0] || null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStyleIcon = (style: Playstyle) => {
    switch (style) {
      case 'BERSERKER': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'MARKSMAN': return <Target className="w-4 h-4 text-cyan-400" />;
      case 'RUNNER': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'DEFENDER': return <Shield className="w-4 h-4 text-blue-400" />;
      default: return <Crosshair className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                TEMPORAL MEMORY BANK
              </h2>
              <p className="text-xs font-mono text-slate-400">
                CHRONO-DATABASE OF PREVIOUS SURVIVAL RUNS & COMBAT TELEMETRY
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Left Column: Remnants List */}
          <div className="border-r border-slate-800/80 p-4 space-y-2.5 overflow-y-auto max-h-[500px]">
            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest px-1 font-semibold">
              RECORDED COHORTS ({remnants.length})
            </div>

            {remnants.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                NO RECORDINGS IN DATABASE. COMPLETE YOUR FIRST RUN TO GENERATE A REMNANT.
              </div>
            ) : (
              remnants.map((r) => {
                const isSelected = selectedRemnant?.id === r.id;
                const isActive = r.activeInRun !== false;

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRemnant(r)}
                    className={`p-3 rounded border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: r.color || '#00ffee' }}
                        />
                        <span className="font-mono font-bold text-white text-xs">
                          REMNANT #{r.runNumber < 10 ? `0${r.runNumber}` : r.runNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>{formatTime(r.survivalTime)}</span>
                        <span>•</span>
                        <span className="text-rose-400">{r.kills} KILLS</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRemnant(r.id);
                      }}
                      className="p-1 text-cyan-400 hover:text-cyan-300"
                      title={isActive ? 'Deactivate Remnant' : 'Activate Remnant for Next Run'}
                    >
                      {isActive ? (
                        <CheckCircle2 className="w-5 h-5 fill-cyan-400 text-slate-950" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Right 2 Columns: Detailed Telemetry View */}
          <div className="md:col-span-2 p-6 flex flex-col justify-between overflow-y-auto bg-slate-950/40">
            {selectedRemnant ? (
              <div className="space-y-6">
                {/* Cohort Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                      <Award className="w-4 h-4" />
                      <span>COHORT TELEMETRY LOG #{selectedRemnant.runNumber}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white font-mono uppercase">
                      REMNANT {selectedRemnant.runNumber < 10 ? `0${selectedRemnant.runNumber}` : selectedRemnant.runNumber}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-slate-700 bg-slate-900 font-mono text-xs">
                    {getStyleIcon(selectedRemnant.playstyle)}
                    <span className="font-bold text-white uppercase">{selectedRemnant.playstyle}</span>
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                  <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">SURVIVAL TIME</div>
                    <div className="text-lg font-bold text-white">
                      {formatTime(selectedRemnant.survivalTime)}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">CONFIRMED KILLS</div>
                    <div className="text-lg font-bold text-rose-400">
                      {selectedRemnant.kills}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">SCORE ACCUMULATED</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {selectedRemnant.score.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">PRIMARY WEAPON</div>
                    <div className="text-lg font-bold text-amber-400">
                      {selectedRemnant.primaryWeapon}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">DAMAGE OUTPUT</div>
                    <div className="text-lg font-bold text-white">
                      {selectedRemnant.damageDealt.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">DISTANCE COVERED</div>
                    <div className="text-lg font-bold text-white">
                      {selectedRemnant.distanceTraveled}m
                    </div>
                  </div>
                </div>

                {/* Cause of Death */}
                <div className="p-4 rounded border border-rose-950 bg-rose-950/20 font-mono text-xs text-rose-300 flex items-center justify-between">
                  <span className="text-rose-500 uppercase font-semibold">CAUSE OF DEATH:</span>
                  <span className="font-bold text-white">{selectedRemnant.causeOfDeath}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
                SELECT A REMNANT TO INSPECT TELEMETRY
              </div>
            )}

            {/* Footer Action */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase text-xs font-mono transition-colors"
              >
                RETURN TO LOBBY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
