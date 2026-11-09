import React from 'react';
import { Volume2, VolumeX, Shield, Zap, Users, Play, Crosshair, Award, Settings as SettingsIcon, MapPin, Sparkles, Database, HelpCircle } from 'lucide-react';
import { sound } from '../../services/audio';

interface MainMenuProps {
  onNavigate: (view: 'play' | 'operations' | 'armory' | 'characters' | 'customization' | 'collection' | 'settings' | 'memory_bank' | 'how_to_play') => void;
  onQuickDeploy: () => void;
  playerName: string;
  playerLevel: number;
  credits: number;
  chronoCores: number;
  savedRemnantCount?: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onNavigate,
  onQuickDeploy,
  playerName,
  playerLevel,
  credits,
  chronoCores,
  savedRemnantCount = 0,
  isMuted,
  onToggleMute
}) => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none">
      {/* Top Bar: Player Profile & Tactical Resource Counters */}
      <div className="flex items-center justify-between pointer-events-auto">
        {/* Game Title Sub-Header */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-7 bg-cyan-400 shadow-[0_0_12px_#06b6d4]" />
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-cyan-400 font-semibold font-['Chakra_Petch']">
              CHRONO PROTOCOL // ACTIVE DEPLOYMENT
            </div>
            <div className="text-xs text-slate-400 font-medium tracking-wider">
              GLOBAL SECTOR 04 // CONTAINMENT LZ
            </div>
          </div>
        </div>

        {/* Player Profile & Stats */}
        <div className="flex items-center gap-4 sm:gap-6 bg-slate-950/80 backdrop-blur-md px-5 py-2.5 rounded-sm border border-slate-800/80 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-['Rajdhani']">
              {playerLevel}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white tracking-wide font-['Rajdhani'] flex items-center gap-2">
                <span>{playerName}</span>
                <span className="text-[9px] bg-red-950/90 text-red-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                  TIER 1
                </span>
              </div>
              <div className="text-[10px] text-cyan-400/80 tracking-wider uppercase font-medium">
                VANGUARD ELITE
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Credits */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
              $
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">CREDITS</div>
              <div className="text-xs font-bold text-amber-300 font-['Rajdhani']">
                {credits.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Chrono Cores */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">CORES</div>
              <div className="text-xs font-bold text-cyan-300 font-['Rajdhani']">
                {chronoCores}
              </div>
            </div>
          </div>

          {/* Audio Mute Button */}
          <button
            onClick={() => {
              sound.playUiClick();
              onToggleMute();
            }}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Center Left: Cinematic Title and AAA Main Navigation Menu */}
      <div className="max-w-xl pointer-events-auto my-auto pt-8">
        {/* DEAD//RECKONING Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs tracking-[0.4em] uppercase text-red-400 font-bold font-['Chakra_Petch']">
              TACTICAL SURVIVAL HORROR
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-white font-['Syne'] uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            DEAD<span className="text-red-500">//</span>RECKONING
          </h1>

          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md font-['Inter'] leading-relaxed drop-shadow-md">
            Spacetime ruptured. The undead mutate at the speed of thought. Harness your Chrono-Remnant echo to reclaim the quarantine zone.
          </p>
        </div>

        {/* AAA Navigation Menu Options */}
        <div className="space-y-2.5 max-w-sm">
          {/* PLAY Button */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('play');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-['Rajdhani'] font-extrabold text-2xl tracking-widest uppercase transition-all duration-200 rounded-sm shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_45px_rgba(239,68,68,0.7)] hover:translate-x-1.5"
          >
            <div className="flex items-center gap-4">
              <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
              <span>PLAY GAME</span>
            </div>
            <span className="text-xs font-mono font-medium tracking-normal bg-black/40 px-2 py-1 rounded text-red-200">
              SOLO / CO-OP
            </span>
          </button>

          {/* OPERATIONS (Maps & Missions) */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('operations');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 hover:text-white font-['Rajdhani'] font-bold text-xl tracking-wider uppercase border border-slate-800 hover:border-cyan-500/50 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1.5"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>OPERATIONS</span>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-cyan-300 font-['Chakra_Petch']">
              4 MAPS
            </span>
          </button>

          {/* ARMORY (Weapon Showroom) */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('armory');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 hover:text-white font-['Rajdhani'] font-bold text-xl tracking-wider uppercase border border-slate-800 hover:border-cyan-500/50 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1.5"
          >
            <div className="flex items-center gap-3">
              <Crosshair className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>ARMORY</span>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-cyan-300 font-['Chakra_Petch']">
              GUNSMITH
            </span>
          </button>

          {/* CHARACTERS (Operative Showcase) */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('characters');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800/90 text-slate-100 hover:text-white font-['Rajdhani'] font-bold text-xl tracking-wider uppercase border border-slate-800 hover:border-cyan-500/50 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1.5"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>CHARACTERS</span>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-cyan-300 font-['Chakra_Petch']">
              4 OPERATIVES
            </span>
          </button>

          {/* COSMETICS & SHOWROOM */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('customization');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-amber-950/40 to-slate-900/80 hover:from-amber-950/60 hover:to-slate-800/90 text-amber-200 hover:text-amber-100 font-['Rajdhani'] font-bold text-xl tracking-wider uppercase border border-amber-500/40 hover:border-amber-400 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>COSMETICS SHOWROOM</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
              10 COLLECTIONS
            </span>
          </button>

          {/* COLLECTION (Lore & Archives) */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('collection');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-3 bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 hover:text-white font-['Rajdhani'] font-semibold text-lg tracking-wider uppercase border border-slate-800/60 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1"
          >
            <div className="flex items-center gap-3">
              <Award className="w-4 h-4 text-amber-400" />
              <span>COLLECTION</span>
            </div>
            <span className="text-xs text-slate-500 font-['Chakra_Petch']">INTEL LOGS</span>
          </button>

          {/* SETTINGS */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('settings');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-3 bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 hover:text-white font-['Rajdhani'] font-semibold text-lg tracking-wider uppercase border border-slate-800/60 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1"
          >
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-4 h-4 text-slate-400" />
              <span>SETTINGS</span>
            </div>
            <span className="text-xs text-slate-500 font-['Chakra_Petch']">AUDIO / VIDEO</span>
          </button>

          {/* CHRONO MEMORY BANK */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('memory_bank');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-2.5 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 hover:text-white font-['Rajdhani'] font-semibold text-base tracking-wider uppercase border border-cyan-800/50 hover:border-cyan-400/60 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>CHRONO MEMORY BANK</span>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {savedRemnantCount} RUNS
            </span>
          </button>

          {/* TACTICAL MANUAL (HOW TO PLAY) */}
          <button
            onClick={() => {
              sound.playUiClick();
              onNavigate('how_to_play');
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="group w-full flex items-center justify-between px-6 py-2 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 font-['Rajdhani'] font-medium text-sm tracking-wider uppercase border border-slate-800/40 backdrop-blur-md transition-all duration-200 rounded-sm hover:translate-x-1"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>HOW TO PLAY MANUAL</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">GUIDE</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Status, Quick Match, Version */}
      <div className="flex items-end justify-between pointer-events-auto pt-6">
        <div className="flex items-center gap-4 text-xs text-slate-400 font-['Inter']">
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-300">ONLINE CO-OP READY</span>
          </div>
          <span className="hidden sm:inline text-slate-500 font-mono text-[11px]">
            BUILD v2.8.0-CHRONO // THREE.JS ENGINE
          </span>
        </div>

        {/* Quick Instant Deploy */}
        <button
          onClick={() => {
            sound.playUiClick();
            onQuickDeploy();
          }}
          onMouseEnter={() => sound.playUiHover()}
          className="px-6 py-2.5 bg-slate-900/90 hover:bg-cyan-950 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-['Rajdhani'] font-bold text-sm tracking-wider uppercase rounded-sm transition-all shadow-lg flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
          <span>INSTANT SOLO INFILTRATION</span>
        </button>
      </div>
    </div>
  );
};
