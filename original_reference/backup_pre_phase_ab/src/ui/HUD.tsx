import React, { useEffect, useState } from 'react';
import { Shield, Zap, Crosshair, AlertTriangle, Radio, Sun, Moon, Swords } from 'lucide-react';
import { GameEngine } from '../core/GameEngine';

interface HUDProps {
  engine: GameEngine;
}

interface DamagePopup {
  id: number;
  x: number;
  y: number;
  amount: number;
  isHeadshot: boolean;
  isMelee?: boolean;
}

export const HUD: React.FC<HUDProps> = ({ engine }) => {
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [activeWeapon, setActiveWeapon] = useState<any>(null);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [remnants, setRemnants] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionTimer, setExtractionTimer] = useState(0);
  const [hitmarker, setHitmarker] = useState(false);
  const [isHeadshotHit, setIsHeadshotHit] = useState(false);
  const [lightingMode, setLightingMode] = useState<'DAY' | 'NIGHT'>(engine.lightingMode || 'DAY');
  const [meleeReady, setMeleeReady] = useState(true);
  const [meleeCooldownPct, setMeleeCooldownPct] = useState(0);
  const [popups, setPopups] = useState<DamagePopup[]>([]);

  useEffect(() => {
    let nextId = 0;

    const interval = setInterval(() => {
      if (!engine || !engine.player) return;
      const p = engine.player;
      setHp(p.hp);
      setMaxHp(p.maxHp);
      setStamina(p.stamina);
      setPrompt(p.currentInteractPrompt);
      setLightingMode(engine.lightingMode);

      const mTimer = p.meleeTimer;
      const mCool = p.meleeCooldown || 0.65;
      setMeleeReady(mTimer <= 0);
      setMeleeCooldownPct(Math.max(0, Math.min(1, mTimer / mCool)));

      const wState = p.weapons.getActiveState();
      setActiveWeapon({
        name: wState.def.name,
        category: wState.def.category,
        currentMag: wState.currentMag,
        magSize: wState.def.magSize,
        reserve: wState.reserveAmmo,
        isReloading: wState.isReloading,
        color: wState.def.color,
      });

      setWave(engine.currentWave);
      setScore(engine.remnantManager.currentScore);
      setKills(engine.remnantManager.currentKills);
      setRemnants(engine.remnantManager.activeRemnants);
      setIsExtracting(engine.isExtracting);
      setExtractionTimer(Math.max(0, Math.ceil(engine.extractionTimer)));
    }, 40);

    // Bind hitmarker & gore feedback
    const origHit = engine.player.onHitEnemy;
    engine.player.onHitEnemy = (headshot, s, isMelee) => {
      if (origHit) origHit(headshot, s, isMelee);
      setIsHeadshotHit(headshot);
      setHitmarker(true);
      setTimeout(() => setHitmarker(false), 120);
    };

    // Bind floating damage numbers
    engine.onDamagePopup = (screenPos, amount, isHeadshot, isMelee) => {
      const id = ++nextId;
      const newPopup: DamagePopup = {
        id,
        x: screenPos.x + (Math.random() - 0.5) * 24,
        y: screenPos.y + (Math.random() - 0.5) * 16,
        amount: Math.round(amount),
        isHeadshot,
        isMelee,
      };

      setPopups((prev) => [...prev.slice(-12), newPopup]);

      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, 750);
    };

    return () => {
      clearInterval(interval);
      engine.onDamagePopup = undefined;
    };
  }, [engine]);

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isLowHp = hpPercent <= 30;

  const handleToggleLighting = (e: React.MouseEvent) => {
    e.stopPropagation();
    engine.toggleLightingMode();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 select-none">
      {/* Floating Dynamic Damage Popups */}
      {popups.map((p) => (
        <div
          key={p.id}
          className={`absolute font-black pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-[floatUp_0.75s_ease-out_forwards] font-mono select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
            p.isHeadshot
              ? 'text-amber-300 text-2xl font-black scale-125'
              : p.isMelee
              ? 'text-orange-400 text-xl font-bold'
              : 'text-white text-base'
          }`}
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
        >
          {p.isHeadshot ? `CRIT ${p.amount}` : p.isMelee ? `BASH ${p.amount}` : p.amount}
        </div>
      ))}

      {/* Low Health Screen Vignette */}
      {isLowHp && (
        <div className="absolute inset-0 border-[12px] border-rose-600/40 animate-pulse pointer-events-none" />
      )}

      {/* Top Header: Wave, Extraction, Lighting Mode & Score */}
      <div className="flex items-start justify-between">
        {/* Left: Score & Kills */}
        <div className="flex flex-col gap-1 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-sm backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 mr-1.5">SCORE</span>
              <span className="font-bold text-cyan-400 text-sm">{score.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">KILLS</span>
              <span className="font-bold text-rose-400 text-sm">{kills}</span>
            </div>
          </div>
        </div>

        {/* Center: Wave or Extraction Beacon + Day/Night Quick Switch */}
        <div className="flex flex-col items-center gap-2">
          {isExtracting ? (
            <div className="flex flex-col items-center bg-rose-950/85 border-2 border-rose-500 px-6 py-2 rounded-sm animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.5)]">
              <div className="flex items-center gap-2 text-rose-300 font-mono text-xs font-bold tracking-widest uppercase">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>EXTRACTION IN PROGRESS - HOLD HELIPAD</span>
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-widest">
                00:{extractionTimer < 10 ? `0${extractionTimer}` : extractionTimer}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center bg-slate-950/85 border border-slate-800 px-6 py-1.5 rounded-sm backdrop-blur-md shadow-lg">
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                SECTOR THREAT LEVEL
              </div>
              <div className="text-xl font-black font-mono text-cyan-400 tracking-wider">
                WAVE {wave < 10 ? `0${wave}` : wave}
              </div>
            </div>
          )}

          {/* Quick Day / Night Mode Indicator & Toggle */}
          <button
            onClick={handleToggleLighting}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-sm font-mono text-[11px] text-slate-200 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            title="Press [T] to toggle Day/Night Mode"
          >
            {lightingMode === 'DAY' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-amber-300">DAYLIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-300">NIGHT OPS</span>
              </>
            )}
            <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">
              [T]
            </span>
          </button>
        </div>

        {/* Right: Active Remnants Telemetry */}
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-slate-950/80 border border-cyan-500/30 px-3 py-1 rounded-sm shadow-md">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>ACTIVE REMNANTS: {remnants.length}</span>
          </div>

          {remnants.map((r, i) => (
            <div
              key={r.data?.id || i}
              className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-slate-900/85 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-sm"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: r.data?.color || '#00ffee' }}
              />
              <span>REMNANT #{r.data?.runNumber || i + 1}</span>
              <span
                className="px-1.5 py-0.5 text-[9px] rounded font-bold"
                style={{ backgroundColor: `${r.data?.color || '#00ffee'}25`, color: r.data?.color || '#00ffee' }}
              >
                {r.data?.playstyle || 'PATROL'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Center Screen: Crosshair, Hitmarkers & Interaction Prompt */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Tactical Crosshair */}
        <div className="relative flex items-center justify-center">
          {/* Hitmarker X */}
          {hitmarker && (
            <div
              className={`absolute w-8 h-8 border-2 rotate-45 animate-ping opacity-95 ${
                isHeadshotHit ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]' : 'border-rose-500'
              }`}
            />
          )}

          {/* Crosshair Center */}
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/90 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
          <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400/70" />
          <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400/70" />
          <div className="absolute -left-3 h-0.5 w-2 bg-cyan-400/70" />
          <div className="absolute -right-3 h-0.5 w-2 bg-cyan-400/70" />
        </div>

        {/* Interaction Prompt */}
        {prompt && (
          <div className="mt-20 px-4 py-2 rounded-sm bg-slate-950/90 border border-cyan-400/60 text-cyan-300 font-mono text-xs font-bold tracking-wider animate-bounce shadow-[0_0_18px_rgba(6,182,212,0.5)]">
            {prompt}
          </div>
        )}
      </div>

      {/* Bottom Bar: Health, Stamina, Melee Cooldown & Weapon HUD */}
      <div className="flex items-end justify-between">
        {/* Health & Stamina Bars */}
        <div className="flex flex-col gap-2.5 bg-slate-950/85 border border-slate-800 p-4 rounded-sm backdrop-blur-md min-w-[260px] shadow-2xl">
          {/* Health */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Shield className="w-3.5 h-3.5" /> HEALTH
              </span>
              <span className={isLowHp ? 'text-rose-500 animate-pulse font-black' : 'text-slate-200'}>
                {Math.ceil(hp)} / {maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-150 ${
                  isLowHp ? 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.9)]' : 'bg-rose-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Stamina */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Zap className="w-3.5 h-3.5" /> STAMINA
              </span>
              <span className="text-slate-400">{Math.ceil(stamina)} / 100</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
              <div
                className="h-full bg-amber-400 transition-all duration-100"
                style={{ width: `${Math.max(0, stamina)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center-Bottom: Quick Melee Combat Widget */}
        <div className="flex items-center gap-3 bg-slate-950/85 border border-slate-800 px-4 py-2 rounded-sm backdrop-blur-md font-mono text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <Swords className={`w-4 h-4 ${meleeReady ? 'text-orange-400 animate-pulse' : 'text-slate-600'}`} />
            <div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider">MELEE STRIKE</div>
              <div className={`font-bold ${meleeReady ? 'text-orange-300' : 'text-slate-500'}`}>
                {meleeReady ? 'READY' : 'RECOVERING'}
              </div>
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-bold">
            [F]
          </span>
        </div>

        {/* Ammo & Active Weapon HUD */}
        {activeWeapon && (
          <div className="flex flex-col items-end gap-1 bg-slate-950/85 border border-slate-800 p-4 rounded-sm backdrop-blur-md min-w-[220px] shadow-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
              {activeWeapon.category}
            </div>

            <div className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              {activeWeapon.name}
            </div>

            <div className="flex items-baseline gap-1 font-mono pt-1">
              <span className="text-4xl font-black text-cyan-400">
                {activeWeapon.currentMag}
              </span>
              <span className="text-sm text-slate-500 font-bold">
                / {activeWeapon.reserve === 999 ? '∞' : activeWeapon.reserve}
              </span>
            </div>

            {activeWeapon.isReloading && (
              <div className="text-xs font-mono text-amber-400 font-bold animate-pulse tracking-wider">
                RELOADING...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
