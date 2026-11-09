import React, { useState } from 'react';
import { X, Volume2, Sliders, Eye, Sparkles, Sun, Moon } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import { GameEngine } from '../core/GameEngine';

interface SettingsModalProps {
  onClose: () => void;
  engine?: GameEngine | null;
  onUpdateSettings?: (settings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, engine, onUpdateSettings }) => {
  const [masterVolume, setMasterVolume] = useState(80);
  const [sfxVolume, setSfxVolume] = useState(85);
  const [musicVolume, setMusicVolume] = useState(50);
  const [sensitivity, setSensitivity] = useState(10);
  const [invertY, setInvertY] = useState(false);
  const [lightingMode, setLightingMode] = useState<'DAY' | 'NIGHT'>(engine?.lightingMode || 'DAY');

  const handleMasterChange = (val: number) => {
    setMasterVolume(val);
    soundManager.updateSettings({ masterVolume: val / 100 });
  };

  const handleSfxChange = (val: number) => {
    setSfxVolume(val);
    soundManager.updateSettings({ sfxVolume: val / 100 });
    soundManager.playClick(0, 1000, 0.05);
  };

  const handleMusicChange = (val: number) => {
    setMusicVolume(val);
    soundManager.updateSettings({ musicVolume: val / 100 });
  };

  const handleLightingChange = (mode: 'DAY' | 'NIGHT') => {
    setLightingMode(mode);
    if (engine) {
      engine.setLightingMode(mode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-sm shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider font-mono">
                SIMULATOR SETTINGS
              </h2>
              <p className="text-xs font-mono text-slate-400">
                LIGHTING, AUDIO & CONTROLS CONFIGURATION
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

        {/* Sliders and options */}
        <div className="space-y-4 font-mono text-xs">
          {/* Environment Lighting Mode Selector */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-sm space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-bold flex items-center gap-2">
                {lightingMode === 'DAY' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-400" />
                )}
                ENVIRONMENT LIGHTING
              </span>
              <span className="text-[11px] text-slate-400">[Key: T]</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLightingChange('DAY')}
                className={`py-2 px-3 rounded flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  lightingMode === 'DAY'
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                DAYLIGHT (BRIGHT)
              </button>
              <button
                type="button"
                onClick={() => handleLightingChange('NIGHT')}
                className={`py-2 px-3 rounded flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  lightingMode === 'NIGHT'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Moon className="w-4 h-4" />
                NIGHT OPS (TACTICAL)
              </button>
            </div>
          </div>

          {/* Master Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" /> MASTER VOLUME
              </span>
              <span className="font-bold text-cyan-400">{masterVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => handleMasterChange(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> SFX / COMBAT SOUNDS
              </span>
              <span className="font-bold text-cyan-400">{sfxVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVolume}
              onChange={(e) => handleSfxChange(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> AMBIENCE & SYNTH
              </span>
              <span className="font-bold text-cyan-400">{musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => handleMusicChange(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Mouse Sensitivity */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span>MOUSE SENSITIVITY</span>
              <span className="font-bold text-cyan-400">{sensitivity / 10}x</span>
            </div>
            <input
              type="range"
              min="2"
              max="25"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Invert Y Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-300">INVERT PITCH (Y-AXIS)</span>
            <button
              onClick={() => setInvertY(!invertY)}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                invertY ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {invertY ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase text-xs font-mono transition-colors cursor-pointer"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
