import React from 'react';
import { Flame, Zap, Layers, HeartPulse, Shield, Crosshair, Sparkles } from 'lucide-react';
import { PerkDef } from '../types/game';

interface UpgradeModalProps {
  choices: PerkDef[];
  onSelect: (perk: PerkDef) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ choices, onSelect }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-8 h-8 text-rose-400" />;
      case 'Zap': return <Zap className="w-8 h-8 text-amber-400" />;
      case 'Layers': return <Layers className="w-8 h-8 text-cyan-400" />;
      case 'HeartPulse': return <HeartPulse className="w-8 h-8 text-emerald-400" />;
      case 'Shield': return <Shield className="w-8 h-8 text-blue-400" />;
      default: return <Crosshair className="w-8 h-8 text-purple-400" />;
    }
  };

  const getRarityBadge = (rarity: PerkDef['rarity']) => {
    switch (rarity) {
      case 'LEGENDARY': return 'border-amber-500/50 bg-amber-950/40 text-amber-300';
      case 'EPIC': return 'border-purple-500/50 bg-purple-950/40 text-purple-300';
      case 'RARE': return 'border-blue-500/50 bg-blue-950/40 text-blue-300';
      default: return 'border-slate-700 bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-3xl space-y-6 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SUPPLY PROTOCOL ACCESSED</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider font-mono">
            SELECT PROTOCOL UPGRADE
          </h2>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            CHOOSE AN ENHANCEMENT FOR YOUR CURRENT COMBAT SURVIVOR
          </p>
        </div>

        {/* 3 Perk Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {choices.map((perk) => (
            <button
              key={perk.id}
              onClick={() => onSelect(perk)}
              className="group relative p-6 rounded-sm bg-slate-900/90 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800/90 transition-all flex flex-col justify-between space-y-4 hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 group-hover:border-cyan-500/40 transition-colors">
                    {getIcon(perk.icon)}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getRarityBadge(perk.rarity)}`}>
                    {perk.rarity}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide group-hover:text-cyan-300 transition-colors">
                    {perk.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-2 leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center justify-between">
                <span>INSTALL PROTOCOL</span>
                <span>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
