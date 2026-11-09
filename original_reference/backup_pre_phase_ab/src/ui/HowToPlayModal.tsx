import React from 'react';
import { X, HelpCircle, Zap, Shield, Target, Crosshair, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-sm shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
                TACTICAL MANUAL // HOW TO PLAY
              </h2>
              <p className="text-xs font-mono text-slate-400">
                MASTER THE CHRONO-REMNANT PARADOX
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

        {/* Section 1: The Remnant Hook */}
        <div className="p-4 rounded border border-cyan-500/40 bg-cyan-950/20 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase">
            <Zap className="w-4 h-4" />
            <span>THE CORE HOOK: WEAPONIZING DEATH</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Every run records your exact movement, aiming, weapon fire, and combat decisions down to the millisecond.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>When you die, your previous run becomes a holographic <strong className="text-cyan-300">Remnant</strong>.</li>
            <li>On your next run, your past self materializes and re-enacts your previous route and gunfire.</li>
            <li><strong className="text-rose-300">Tactical Strategy:</strong> Use your Remnants to draw massive horde aggro while you flank, or fight shoulder-to-shoulder with past versions of yourself!</li>
          </ul>
        </div>

        {/* Section 2: Controls Matrix */}
        <div className="space-y-3 font-mono text-xs">
          <div className="text-slate-400 uppercase font-bold tracking-wider text-[11px]">
            FIELD CONTROLS
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">WASD</span>
              <span className="font-bold text-white">Movement</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">MOUSE</span>
              <span className="font-bold text-white">Aim / Look</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">LEFT CLICK</span>
              <span className="font-bold text-rose-400">Fire Weapon</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">RIGHT CLICK</span>
              <span className="font-bold text-cyan-400">Aim Down Sights (ADS)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">SHIFT</span>
              <span className="font-bold text-amber-400">Tactical Sprint</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">SPACE</span>
              <span className="font-bold text-amber-400">Dodge Roll (I-Frames)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">R</span>
              <span className="font-bold text-white">Reload</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">E</span>
              <span className="font-bold text-emerald-400">Interact (Crates/Beacon)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">F / V</span>
              <span className="font-bold text-orange-400">Melee Strike / Kick</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">T</span>
              <span className="font-bold text-amber-300">Toggle Day / Night Mode</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">1 - 5 / WHEEL</span>
              <span className="font-bold text-white">Switch Weapon</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">ESC</span>
              <span className="font-bold text-white">Pause Simulator</span>
            </div>
          </div>
        </div>

        {/* Section 3: Objective */}
        <div className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
          <span className="text-amber-400 font-bold uppercase">MISSION OBJECTIVE:</span>
          <p className="text-slate-400 leading-relaxed">
            Survive escalating zombie waves, defeat <strong className="text-rose-400">THE RECKONER</strong> boss at Wave 5, activate the Helipad extraction beacon, and extract safely to seal the anomaly.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase text-xs font-mono transition-colors"
          >
            UNDERSTOOD
          </button>
        </div>
      </div>
    </div>
  );
};
