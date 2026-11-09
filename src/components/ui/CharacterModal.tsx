import React, { useState } from 'react';
import { X, Shield, Zap, Crosshair, Wind, Check, Lock, ChevronRight } from 'lucide-react';
import { CHARACTERS } from '../../data/gameData';
import { CharacterInspectScene } from '../3d/CharacterInspectScene';
import { Character } from '../../types/game';
import { sound } from '../../services/audio';

interface CharacterModalProps {
  onClose: () => void;
  selectedCharacterId: string;
  onSelectCharacter: (charId: string) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  onClose,
  selectedCharacterId,
  onSelectCharacter
}) => {
  const [activeCharId, setActiveCharId] = useState(selectedCharacterId);
  const [selectedOutfitIndex, setSelectedOutfitIndex] = useState(0);

  const activeChar = CHARACTERS.find(c => c.id === activeCharId) || CHARACTERS[0];
  const activeOutfit = activeChar.outfits[selectedOutfitIndex] || activeChar.outfits[0];

  const isEquipped = selectedCharacterId === activeChar.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl select-none animate-fadeIn">
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-cyan-400" />
            <h2 className="text-2xl font-extrabold text-white font-['Syne'] tracking-wide uppercase">
              OPERATIVE SHOWCASE // ROSTER
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

        {/* Content Layout: Left Operative Selector + Center 3D Viewport + Right Dossier */}
        <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Character List */}
          <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 p-4 overflow-y-auto space-y-3 z-10">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-['Chakra_Petch'] mb-2">
              TASKFORCE OPERATIVES
            </div>

            {CHARACTERS.map((char) => {
              const isSelected = char.id === activeCharId;
              const isCurrent = char.id === selectedCharacterId;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    sound.playUiClick();
                    setActiveCharId(char.id);
                    setSelectedOutfitIndex(0);
                  }}
                  onMouseEnter={() => sound.playUiHover()}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md translate-x-1'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center font-bold text-sm font-['Rajdhani']"
                      style={{ backgroundColor: `${char.color}20`, color: char.color, border: `1px solid ${char.color}50` }}
                    >
                      {char.role.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white font-['Rajdhani'] uppercase tracking-wider">
                        {char.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {char.callsign}
                      </div>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-500/40">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center Column: 3D Turntable Viewport */}
          <div className="relative flex-1 h-[420px] lg:h-auto overflow-hidden bg-gradient-to-b from-slate-900/30 via-black to-slate-950">
            <div className="absolute top-4 left-6 z-10 text-xs text-slate-400 font-['Chakra_Petch'] tracking-widest uppercase">
              DRAG TO ROTATE 360° // INSPECT LOADOUT
            </div>

            <CharacterInspectScene
              characterId={activeChar.id}
              accentColor={activeChar.color}
              outfitColor={activeOutfit.color}
            />
          </div>

          {/* Right Column: Operative Tactical Dossier & Stats */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/80 p-6 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              {/* Header Info */}
              <div className="mb-4">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider"
                  style={{ backgroundColor: `${activeChar.color}25`, color: activeChar.color }}
                >
                  {activeChar.role} CLASS
                </span>
                <h3 className="text-3xl font-extrabold text-white font-['Rajdhani'] tracking-wider uppercase mt-1">
                  {activeChar.name}
                </h3>
                <div className="text-xs text-slate-400 font-['Inter'] mt-1 leading-relaxed">
                  {activeChar.description}
                </div>
              </div>

              {/* Combat Stats */}
              <div className="space-y-2.5 mb-6 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch'] mb-2">
                  TACTICAL RATINGS
                </div>

                {/* Firepower */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-['Rajdhani']">
                      <Crosshair className="w-3.5 h-3.5 text-red-400" /> FIREPOWER
                    </span>
                    <span className="text-white font-mono">{activeChar.stats.firepower}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${activeChar.stats.firepower}%` }} />
                  </div>
                </div>

                {/* Mobility */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-['Rajdhani']">
                      <Wind className="w-3.5 h-3.5 text-emerald-400" /> MOBILITY
                    </span>
                    <span className="text-white font-mono">{activeChar.stats.mobility}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activeChar.stats.mobility}%` }} />
                  </div>
                </div>

                {/* Defense */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-['Rajdhani']">
                      <Shield className="w-3.5 h-3.5 text-amber-400" /> DEFENSE
                    </span>
                    <span className="text-white font-mono">{activeChar.stats.defense}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${activeChar.stats.defense}%` }} />
                  </div>
                </div>

                {/* Chrono Sync */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-['Rajdhani']">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> CHRONO SYNC
                    </span>
                    <span className="text-white font-mono">{activeChar.stats.chronoSync}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${activeChar.stats.chronoSync}%` }} />
                  </div>
                </div>
              </div>

              {/* Special Ability Box */}
              <div className="mb-6 p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/40">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-bold text-cyan-400 font-['Chakra_Petch'] uppercase flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                    <span>{activeChar.abilityName}</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {activeChar.cooldown}s CD
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-['Inter'] leading-relaxed">
                  {activeChar.abilityDescription}
                </p>
              </div>

              {/* Outfits Selector */}
              <div className="mb-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch'] mb-2">
                  TACTICAL SUIT CAMO
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {activeChar.outfits.map((outfit, idx) => (
                    <button
                      key={outfit.id}
                      onClick={() => {
                        sound.playUiClick();
                        setSelectedOutfitIndex(idx);
                      }}
                      className={`p-2 rounded text-xs font-semibold text-center border transition-all ${
                        selectedOutfitIndex === idx
                          ? 'bg-slate-800 border-cyan-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full mx-auto mb-1 border border-white/20"
                        style={{ backgroundColor: outfit.color }}
                      />
                      <span className="truncate block text-[10px]">{outfit.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Equip Button */}
            <button
              onClick={() => {
                sound.playUiClick();
                onSelectCharacter(activeChar.id);
              }}
              disabled={isEquipped}
              className={`w-full py-3.5 rounded font-['Rajdhani'] font-extrabold text-base tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                isEquipped
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 cursor-default'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              }`}
            >
              {isEquipped ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>CURRENTLY EQUIPPED</span>
                </>
              ) : (
                <>
                  <span>SELECT OPERATIVE</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
