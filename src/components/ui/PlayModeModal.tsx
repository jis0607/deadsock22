import React from 'react';
import { X, Play, Users, Skull, Flame, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import { GAME_MODES } from '../../data/gameData';
import { sound } from '../../services/audio';

interface PlayModeModalProps {
  onClose: () => void;
  onSelectSolo: (modeId: string) => void;
  onSelectCoop: () => void;
}

export const PlayModeModal: React.FC<PlayModeModalProps> = ({
  onClose,
  onSelectSolo,
  onSelectCoop
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-xl select-none animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800/80 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400 font-['Chakra_Petch']">
                MISSION SELECT // PROTOCOL
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white font-['Syne'] tracking-tight">
              SELECT OPERATION MODE
            </h2>
          </div>

          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="p-2.5 rounded-md bg-slate-800/60 hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition-colors border border-slate-700/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cinematic Game Mode Grid */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAME_MODES.map((mode) => {
              const isCoop = mode.id === 'coop';
              const isSolo = mode.id === 'solo';

              return (
                <div
                  key={mode.id}
                  onClick={() => {
                    sound.playUiClick();
                    if (isCoop) {
                      onSelectCoop();
                    } else {
                      onSelectSolo(mode.id);
                    }
                  }}
                  onMouseEnter={() => sound.playUiHover()}
                  className={`group relative flex flex-col justify-between p-6 rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isCoop
                      ? 'bg-gradient-to-br from-blue-950/70 via-slate-900/90 to-black border-blue-500/50 hover:border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:-translate-y-1'
                      : isSolo
                      ? 'bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-black border-cyan-500/40 hover:border-cyan-400 hover:-translate-y-1'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-600 hover:-translate-y-1'
                  }`}
                >
                  {/* Decorative background glow */}
                  <div
                    className={`absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${
                      isCoop ? 'bg-blue-500' : isSolo ? 'bg-cyan-500' : 'bg-red-500'
                    }`}
                  />

                  {/* Top Badge & Player Count */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded font-mono tracking-wider uppercase ${
                          isCoop
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : isSolo
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {mode.badge}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium font-['Rajdhani']">
                        {isCoop ? <Users className="w-3.5 h-3.5 text-blue-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{mode.playerLimit}</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white font-['Rajdhani'] tracking-wider uppercase group-hover:text-cyan-300 transition-colors">
                      {mode.title}
                    </h3>
                    <div className="text-[11px] text-cyan-400/80 uppercase font-semibold font-['Chakra_Petch'] mb-3">
                      {mode.subtitle}
                    </div>

                    <p className="text-xs text-slate-300/90 font-['Inter'] leading-relaxed mb-6">
                      {mode.description}
                    </p>
                  </div>

                  {/* Bottom Reward info & Action Button */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-3 text-slate-400">
                      <span>REWARDS:</span>
                      <span className="text-amber-300 font-semibold font-mono text-[11px]">
                        {mode.rewardTier}
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded font-['Rajdhani'] font-bold text-sm tracking-wider uppercase transition-all ${
                        isCoop
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                          : isSolo
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
                          : 'bg-slate-800 group-hover:bg-cyan-950 group-hover:text-cyan-300 text-slate-200'
                      }`}
                    >
                      <span>{isCoop ? 'OPEN MULTIPLAYER LOBBY' : 'DEPLOY NOW'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
