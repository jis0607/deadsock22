import React, { useState } from 'react';
import { X, Award, FileText, Zap, Shield, BookOpen } from 'lucide-react';
import { LORE_LOGS } from '../../data/gameData';
import { sound } from '../../services/audio';

interface CollectionModalProps {
  onClose: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({ onClose }) => {
  const [activeLogId, setActiveLogId] = useState(LORE_LOGS[0].id);
  const activeLog = LORE_LOGS.find(l => l.id === activeLogId) || LORE_LOGS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl select-none animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80 z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-amber-400" />
            <h2 className="text-2xl font-extrabold text-white font-['Syne'] tracking-wide uppercase">
              ARCHIVES // CLASSIFIED INTEL & COMMENDATIONS
            </h2>
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

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Logs List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 p-4 overflow-y-auto space-y-2">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-['Chakra_Petch'] mb-2">
              DECRYPTED SURVIVOR AUDIO LOGS
            </div>

            {LORE_LOGS.map(log => {
              const isSelected = log.id === activeLogId;

              return (
                <div
                  key={log.id}
                  onClick={() => {
                    sound.playUiClick();
                    setActiveLogId(log.id);
                  }}
                  onMouseEnter={() => sound.playUiHover()}
                  className={`p-3.5 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400/80 text-white shadow-md'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-mono text-amber-400/80 uppercase">
                    {log.date}
                  </div>
                  <div className="text-sm font-bold font-['Rajdhani'] uppercase tracking-wider text-slate-100 mt-0.5">
                    {log.title}
                  </div>
                  <div className="text-xs text-slate-400 font-['Inter'] mt-1 truncate">
                    Author: {log.author}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Intel Detail */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-slate-900/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono uppercase text-amber-400 tracking-wider font-semibold">
                  CLASSIFIED // TOP SECRET
                </span>
              </div>

              <h3 className="text-3xl font-extrabold text-white font-['Rajdhani'] uppercase tracking-wider mb-2">
                {activeLog.title}
              </h3>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pb-4 mb-6 border-b border-slate-800">
                <span>DATE: <strong className="text-slate-200">{activeLog.date}</strong></span>
                <span>ORIGIN: <strong className="text-slate-200">{activeLog.author}</strong></span>
              </div>

              <p className="text-sm sm:text-base text-slate-300 font-['Inter'] leading-relaxed whitespace-pre-line bg-slate-950/60 p-6 rounded-lg border border-slate-800/80">
                {activeLog.text}
              </p>
            </div>

            {/* Tactical Commendations */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch'] mb-3">
                OPERATIVE TROPHIES
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/80 p-3 rounded border border-cyan-500/30 flex items-center gap-3">
                  <Award className="w-6 h-6 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white font-['Rajdhani']">FIRST CONTACT</div>
                    <div className="text-[10px] text-slate-400">Survived initial breach</div>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded border border-amber-500/30 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white font-['Rajdhani']">TEMPORAL MASTER</div>
                    <div className="text-[10px] text-slate-400">50 Chrono-Echoes deployed</div>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded border border-red-500/30 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-red-400" />
                  <div>
                    <div className="text-xs font-bold text-white font-['Rajdhani']">BIO-TITAN SLAYER</div>
                    <div className="text-[10px] text-slate-400">Defeated Apex Goliath</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
