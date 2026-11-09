import React, { useState } from 'react';
import { X, Volume2, VolumeX, Sliders, Monitor, Keyboard, Check } from 'lucide-react';
import { sound } from '../../services/audio';

interface SettingsModalProps {
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  isMuted,
  onToggleMute
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'controls' | 'display'>('controls');
  const [sensitivity, setSensitivity] = useState(50);
  const [volume, setVolume] = useState(85);
  const [graphicsQuality, setGraphicsQuality] = useState('High');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl select-none animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/80 z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-slate-400" />
            <h2 className="text-2xl font-extrabold text-white font-['Syne'] tracking-wide uppercase">
              TACTICAL SETTINGS // PREFERENCES
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

        {/* Tab Headers */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('controls');
            }}
            className={`px-4 py-2.5 text-xs font-['Rajdhani'] font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'controls'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>CONTROLS & KEYBINDS</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('audio');
            }}
            className={`px-4 py-2.5 text-xs font-['Rajdhani'] font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'audio'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>AUDIO & SOUND</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              setActiveTab('display');
            }}
            className={`px-4 py-2.5 text-xs font-['Rajdhani'] font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'display'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>GRAPHICS & DISPLAY</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {activeTab === 'controls' && (
            <div className="space-y-6">
              {/* Sensitivity Slider */}
              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white font-['Rajdhani'] uppercase tracking-wider">
                    MOUSE LOOK SENSITIVITY
                  </span>
                  <span className="text-cyan-400 font-mono text-sm font-bold">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Keybindings Reference */}
              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch'] mb-4">
                  COMBAT KEYBINDINGS REFERENCE
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">MOVE FORWARD / BACK / STRAFE</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold">W, A, S, D</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">FIRE WEAPON</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-red-400 font-bold">LEFT CLICK</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">AIM DOWN SIGHTS (ADS)</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold">RIGHT CLICK</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">TACTICAL SPRINT</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold">LEFT SHIFT</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">RELOAD WEAPON</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold">R</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">CHRONO-REMNANT ECHO & REWIND</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-bold">E</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">REVIVE DOWNED TEAMMATE</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">F</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">PAUSE / ESCAPE MENU</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">ESC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
                    <div>
                      <div className="text-sm font-bold text-white font-['Rajdhani'] uppercase tracking-wider">
                        MASTER AUDIO
                      </div>
                      <div className="text-xs text-slate-400">Weapon shots, zombie groans, and tactical UI</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playUiClick();
                      onToggleMute();
                    }}
                    className={`px-4 py-1.5 rounded text-xs font-bold font-['Rajdhani'] uppercase border transition-all ${
                      isMuted
                        ? 'bg-red-950 text-red-400 border-red-500/50'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                    }`}
                  >
                    {isMuted ? 'UNMUTE SOUND' : 'MUTED: OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">VOLUME LEVEL</span>
                  <span className="text-cyan-400 font-mono text-xs font-bold">{isMuted ? 0 : volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={isMuted}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800">
                <div className="text-sm font-bold text-white font-['Rajdhani'] uppercase tracking-wider mb-3">
                  GRAPHICS RENDER PRESET
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Performance (60FPS)', 'Balanced', 'High Quality'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        sound.playUiClick();
                        setGraphicsQuality(preset);
                      }}
                      className={`p-3 rounded text-xs font-['Rajdhani'] font-bold uppercase border transition-all ${
                        graphicsQuality === preset
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white font-['Rajdhani'] uppercase tracking-wider">
                    TARGET REFRESH RATE
                  </div>
                  <div className="text-xs text-slate-400">Locked to browser V-Sync (60Hz / 120Hz)</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/30">
                  AUTO (OPTIMAL)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
