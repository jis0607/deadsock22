import React from 'react';
import { X, MapPin, AlertTriangle, CloudRain, Check, Target, Compass, ChevronRight } from 'lucide-react';
import { MAPS } from '../../data/gameData';
import { GameMap } from '../../types/game';
import { sound } from '../../services/audio';

interface OperationsModalProps {
  onClose: () => void;
  selectedMapId: string;
  onSelectMap: (mapId: string) => void;
}

export const OperationsModal: React.FC<OperationsModalProps> = ({
  onClose,
  selectedMapId,
  onSelectMap
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl select-none animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80 z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-cyan-400" />
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] font-['Chakra_Petch']">
                THEATER OF WAR // TACTICAL MAPS
              </div>
              <h2 className="text-2xl font-extrabold text-white font-['Syne'] tracking-wide uppercase">
                OPERATIONS & COMBAT SECTORS
              </h2>
            </div>
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

        {/* Maps Grid */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MAPS.map((map) => {
              const isSelected = map.id === selectedMapId;

              return (
                <div
                  key={map.id}
                  onClick={() => {
                    sound.playUiClick();
                    onSelectMap(map.id);
                  }}
                  onMouseEnter={() => sound.playUiHover()}
                  className={`group relative flex flex-col justify-between p-6 rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    {/* Top Tier & Threat Bar */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded uppercase font-mono tracking-wider"
                        style={{
                          backgroundColor: `${map.accentColor}20`,
                          color: map.accentColor,
                          border: `1px solid ${map.accentColor}50`
                        }}
                      >
                        {map.tier}
                      </span>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{map.weather}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-extrabold text-white font-['Rajdhani'] tracking-wider uppercase group-hover:text-cyan-300 transition-colors">
                      {map.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono uppercase mb-3">
                      {map.subtitle}
                    </div>

                    <p className="text-xs text-slate-300 font-['Inter'] leading-relaxed mb-4">
                      {map.description}
                    </p>

                    {/* Environment Details */}
                    <div className="bg-slate-950/70 p-3 rounded mb-4 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-['Chakra_Petch'] mb-1">
                        ENVIRONMENT CONDITIONS:
                      </div>
                      <div className="text-xs text-slate-200 font-medium font-['Rajdhani']">
                        {map.environment}
                      </div>
                    </div>

                    {/* Objectives */}
                    <div className="space-y-1.5 mb-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-['Chakra_Petch']">
                        PRIMARY OBJECTIVES:
                      </div>
                      {map.objectives.map((obj, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300 font-['Inter']">
                          <Target className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>

                    {/* Extraction LZ */}
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium font-['Rajdhani'] bg-emerald-950/30 px-3 py-1.5 rounded border border-emerald-500/30">
                      <Compass className="w-3.5 h-3.5" />
                      <span>EXTRACTION LZ: {map.extractionZone}</span>
                    </div>
                  </div>

                  {/* Bottom Select Action */}
                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">THREAT:</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-1.5 rounded-xs ${
                            i < map.threatLevel ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      className={`px-4 py-2 rounded text-xs font-['Rajdhani'] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>CURRENT SECTOR</span>
                        </>
                      ) : (
                        <>
                          <span>SELECT OPERATION</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
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
