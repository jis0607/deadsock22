import React, { useEffect, useState } from 'react';
import {
  Shield,
  Zap,
  Crosshair,
  AlertTriangle,
  Radio,
  Sun,
  Moon,
  Swords,
  Volume2,
  VolumeX,
  Gamepad2,
  HeartPulse,
  Users,
  Compass,
} from 'lucide-react';
import { GameEngine } from '../core/GameEngine';
import { soundManager } from '../audio/SoundManager';
import { MobileControls } from './MobileControls';

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
  // Player 1 state (Vanguard - Cyan)
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [activeWeapon, setActiveWeapon] = useState<any>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [isDowned, setIsDowned] = useState(false);
  const [downedTimer, setDownedTimer] = useState(30);
  const [isReviving, setIsReviving] = useState(false);
  const [reviveProgress, setReviveProgress] = useState(0);
  const [p1Dead, setP1Dead] = useState(false);

  // Player 2 state (Recon - Amber)
  const [p2Hp, setP2Hp] = useState(100);
  const [p2MaxHp, setP2MaxHp] = useState(100);
  const [p2Stamina, setP2Stamina] = useState(100);
  const [p2ActiveWeapon, setP2ActiveWeapon] = useState<any>(null);
  const [p2Prompt, setP2Prompt] = useState<string | null>(null);
  const [p2Downed, setP2Downed] = useState(false);
  const [p2DownedTimer, setP2DownedTimer] = useState(30);
  const [p2Reviving, setP2Reviving] = useState(false);
  const [p2ReviveProgress, setP2ReviveProgress] = useState(0);
  const [p2Dead, setP2Dead] = useState(false);

  // Shared state
  const [teammateDist, setTeammateDist] = useState<number | null>(null);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [remnants, setRemnants] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionTimer, setExtractionTimer] = useState(0);
  const [isInExtractionZone, setIsInExtractionZone] = useState(false);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [p1Hitmarker, setP1Hitmarker] = useState(false);
  const [p1Headshot, setP1Headshot] = useState(false);
  const [p2Hitmarker, setP2Hitmarker] = useState(false);
  const [p2Headshot, setP2Headshot] = useState(false);
  const [lightingMode, setLightingMode] = useState<'DAY' | 'NIGHT'>(engine.lightingMode || 'DAY');
  const [p1MeleeReady, setP1MeleeReady] = useState(true);
  const [p2MeleeReady, setP2MeleeReady] = useState(true);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(engine.input.isTouchDevice);

  const isCoop = engine.gameMode === 'LOCAL_COOP' && !!engine.player2;

  useEffect(() => {
    let nextId = 0;

    const interval = setInterval(() => {
      if (!engine || !engine.player) return;
      const p = engine.player;
      setHp(p.hp);
      setMaxHp(p.maxHp);
      setStamina(p.stamina);
      setPrompt(p.currentInteractPrompt);
      setIsDowned(p.isDowned);
      setDownedTimer(Math.max(0, Math.ceil(p.downedTimer)));
      setIsReviving(p.isRevivingTeammate);
      setReviveProgress(Math.min(100, Math.round(p.reviveProgress * 100)));
      setP1Dead(p.isDead);
      setLightingMode(engine.lightingMode);

      setP1MeleeReady(p.meleeTimer <= 0);

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

      // Update Player 2 if in Co-Op
      if (engine.player2) {
        const p2 = engine.player2;
        setP2Hp(p2.hp);
        setP2MaxHp(p2.maxHp);
        setP2Stamina(p2.stamina);
        setP2Prompt(p2.currentInteractPrompt);
        setP2Downed(p2.isDowned);
        setP2DownedTimer(Math.max(0, Math.ceil(p2.downedTimer)));
        setP2Reviving(p2.isRevivingTeammate);
        setP2ReviveProgress(Math.min(100, Math.round(p2.reviveProgress * 100)));
        setP2Dead(p2.isDead);
        setP2MeleeReady(p2.meleeTimer <= 0);

        const wState2 = p2.weapons.getActiveState();
        setP2ActiveWeapon({
          name: wState2.def.name,
          category: wState2.def.category,
          currentMag: wState2.currentMag,
          magSize: wState2.def.magSize,
          reserve: wState2.reserveAmmo,
          isReloading: wState2.isReloading,
          color: wState2.def.color,
        });

        if (!p.isDead && !p2.isDead) {
          setTeammateDist(Math.round(p.position.distanceTo(p2.position)));
        } else {
          setTeammateDist(null);
        }
      }

      setWave(engine.currentWave);
      setScore(engine.remnantManager.currentScore);
      setKills(engine.remnantManager.currentKills);
      setRemnants(engine.remnantManager.activeRemnants);
      setIsExtracting(engine.isExtracting);
      setExtractionTimer(Math.max(0, Math.ceil(engine.extractionTimer)));
      setIsInExtractionZone(engine.isInExtractionZone);
      setGamepadConnected(engine.input.gamepadConnected);
      setIsMuted(soundManager.isMuted);
      setIsTouchDevice(engine.input.isTouchDevice);
    }, 40);

    // Bind hitmarker feedback for P1
    const origHit1 = engine.player.onHitEnemy;
    engine.player.onHitEnemy = (headshot, s, isMelee) => {
      if (origHit1) origHit1(headshot, s, isMelee);
      setP1Headshot(headshot);
      setP1Hitmarker(true);
      setTimeout(() => setP1Hitmarker(false), 120);
    };

    // Bind hitmarker feedback for P2
    if (engine.player2) {
      engine.player2.onHitEnemy = (headshot, s, isMelee) => {
        setP2Headshot(headshot);
        setP2Hitmarker(true);
        setTimeout(() => setP2Hitmarker(false), 120);
      };
    }

    // Bind floating damage numbers
    engine.onDamagePopup = (screenPos, amount, isHeadshot, isMelee) => {
      const id = ++nextId;
      const newPopup: DamagePopup = {
        id,
        x: screenPos.x + (Math.random() - 0.5) * 20,
        y: screenPos.y + (Math.random() - 0.5) * 16,
        amount: Math.round(amount),
        isHeadshot,
        isMelee,
      };

      setPopups((prev) => [...prev.slice(-14), newPopup]);

      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, 750);
    };

    return () => {
      clearInterval(interval);
      engine.onDamagePopup = undefined;
    };
  }, [engine]);

  const p1HpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isP1LowHp = p1HpPercent <= 30 && !isDowned && !p1Dead;

  const p2HpPercent = Math.max(0, Math.min(100, (p2Hp / p2MaxHp) * 100));
  const isP2LowHp = p2HpPercent <= 30 && !p2Downed && !p2Dead;

  const handleToggleLighting = (e: React.MouseEvent) => {
    e.stopPropagation();
    engine.toggleLightingMode();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden font-sans">
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

      {/* Global Top Navigation & Threat Bar */}
      <div className="absolute top-4 left-6 right-6 flex items-start justify-between pointer-events-none z-20">
        {/* Left: Squad Telemetry */}
        <div className="flex flex-col gap-1.5 bg-slate-950/85 border border-slate-800 px-4 py-2 rounded-sm backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 mr-1.5 font-bold">SCORE</span>
              <span className="font-bold text-cyan-400 text-sm">{score.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5 font-bold">KILLS</span>
              <span className="font-bold text-rose-400 text-sm">{kills}</span>
            </div>
            {isCoop && teammateDist !== null && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-bold">SQUAD LINK:</span>
                <span className={`font-mono font-bold ${teammateDist > 20 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                  {teammateDist}m
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Wave / Extraction Indicator + Toggles */}
        <div className="flex flex-col items-center gap-1.5">
          {isExtracting ? (
            <div
              className={`flex flex-col items-center px-6 py-2 rounded-sm shadow-xl transition-all ${
                isInExtractionZone
                  ? 'bg-rose-950/90 border-2 border-rose-500 animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.6)]'
                  : 'bg-amber-950/90 border-2 border-amber-500 animate-bounce shadow-[0_0_25px_rgba(245,158,11,0.6)]'
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase">
                <AlertTriangle className={`w-4 h-4 ${isInExtractionZone ? 'text-rose-400' : 'text-amber-400'}`} />
                <span className={isInExtractionZone ? 'text-rose-300' : 'text-amber-300'}>
                  {isInExtractionZone ? 'HOLDING HELIPAD EXTRACTION' : 'OUTSIDE ZONE - RETURN TO HELIPAD!'}
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-white tracking-widest">
                00:{extractionTimer < 10 ? `0${extractionTimer}` : extractionTimer}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center bg-slate-950/85 border border-slate-800 px-6 py-1 rounded-sm backdrop-blur-md shadow-lg">
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                SECTOR THREAT LEVEL
              </div>
              <div className="text-xl font-black font-mono text-cyan-400 tracking-wider">
                WAVE {wave < 10 ? `0${wave}` : wave}
              </div>
            </div>
          )}

          {/* Quick Controls Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLighting}
              className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-sm font-mono text-[11px] text-slate-200 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              title="Toggle Day/Night Sector Visibility [T]"
            >
              {lightingMode === 'DAY' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-amber-300">DAY</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-cyan-300">NIGHT</span>
                </>
              )}
              <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">
                [T]
              </span>
            </button>

            <button
              onClick={() => {
                const next = soundManager.toggleMute();
                setIsMuted(next);
              }}
              className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-mono text-[11px] transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300 hover:bg-rose-900/80'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="text-[10px] font-bold">{isMuted ? 'MUTED' : 'AUDIO'}</span>
            </button>

            {gamepadConnected && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-cyan-950/70 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 animate-pulse">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">{isCoop ? 'P2 GAMEPAD LINK' : 'GAMEPAD'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Chrono-Remnants Telemetry */}
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-slate-950/85 border border-cyan-500/30 px-3 py-1 rounded-sm shadow-md">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>ACTIVE REMNANTS: {remnants.length}</span>
          </div>

          {remnants.map((r, i) => (
            <div
              key={r.data?.id || i}
              className="flex items-center gap-2 px-2.5 py-0.5 rounded-sm bg-slate-900/85 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-sm"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: r.data?.color || '#00ffee' }}
              />
              <span>REMNANT #{r.data?.runNumber || i + 1}</span>
              <span
                className="px-1.5 py-0.2 text-[9px] rounded font-bold"
                style={{ backgroundColor: `${r.data?.color || '#00ffee'}25`, color: r.data?.color || '#00ffee' }}
              >
                {r.data?.playstyle || 'COMBAT'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOCAL CO-OP SPLIT-SCREEN HUD VIEW                                          */}
      {/* ========================================================================= */}
      {isCoop ? (
        <div className="absolute inset-0 flex">
          {/* Vertical Tactical Center Divider */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-cyan-500/50 via-slate-700/80 to-amber-500/50 z-20 pointer-events-none shadow-[0_0_10px_rgba(0,0,0,0.8)] flex flex-col justify-between py-6">
            <div className="w-2 h-2 rounded-full -translate-x-0.75 bg-cyan-400 shadow-[0_0_8px_#00ffee]" />
            <div className="w-2 h-2 rounded-full -translate-x-0.75 bg-slate-400" />
            <div className="w-2 h-2 rounded-full -translate-x-0.75 bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* PLAYER 1 VIEWPORT HUD (LEFT HALF)                                     */}
          {/* --------------------------------------------------------------------- */}
          <div className="relative w-1/2 h-full flex flex-col justify-between p-6 pointer-events-none">
            {/* Low Health Screen Vignette */}
            {isP1LowHp && (
              <div className="absolute inset-0 border-[10px] border-cyan-500/30 animate-pulse pointer-events-none" />
            )}

            {/* Operative Header Tag */}
            <div className="pt-16 flex items-center gap-2">
              <div className="px-2.5 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                PLAYER 1 // VANGUARD [WASD+MOUSE]
              </div>
              {p2Downed && !p2Dead && (
                <div className="px-2.5 py-0.5 rounded-xs bg-amber-950/90 border border-amber-500 text-amber-300 font-mono text-[10px] font-bold tracking-wider animate-bounce flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-amber-400" />
                  RECON DOWNED ({p2DownedTimer}s)
                </div>
              )}
            </div>

            {/* Crosshair & Prompts for P1 (Center of Left Half) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {!p1Dead && !isDowned && (
                <div className="relative flex items-center justify-center">
                  {p1Hitmarker && (
                    <div
                      className={`absolute w-8 h-8 border-2 rotate-45 animate-ping opacity-95 ${
                        p1Headshot ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]' : 'border-rose-500'
                      }`}
                    />
                  )}
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/90 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                  <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400/70" />
                  <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400/70" />
                  <div className="absolute -left-3 h-0.5 w-2 bg-cyan-400/70" />
                  <div className="absolute -right-3 h-0.5 w-2 bg-cyan-400/70" />
                </div>
              )}

              {/* P1 Downed Bleedout Banner */}
              {isDowned && !p1Dead && (
                <div className="px-5 py-3 rounded-sm bg-rose-950/90 border-2 border-rose-500 text-center font-mono animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                  <div className="text-rose-400 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    VANGUARD INCAPACITATED
                  </div>
                  <div className="text-white text-xl font-black tracking-wider mt-0.5">
                    BLEEDOUT: {downedTimer}s
                  </div>
                  <div className="text-[10px] text-rose-300 mt-1">CRAWL TO COVER // AWAIT SQUAD REVIVE</div>
                </div>
              )}

              {/* P1 Dead State */}
              {p1Dead && (
                <div className="px-4 py-2 rounded-sm bg-slate-950/90 border border-cyan-500 text-center font-mono">
                  <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    OPERATIVE FALLEN // CHRONO-REMNANT ACTIVE
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Your autonomous ghost is now fighting alongside Recon
                  </div>
                </div>
              )}

              {/* P1 Reviving Teammate Progress Bar */}
              {isReviving && (
                <div className="mt-16 w-52 bg-slate-950/90 border border-emerald-500/80 p-2.5 rounded-sm shadow-xl font-mono text-center">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
                    REVIVING RECON... {reviveProgress}%
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-xs mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${reviveProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Interaction Prompt */}
              {prompt && !isDowned && !p1Dead && (
                <div className="mt-16 px-3 py-1.5 rounded-sm bg-slate-950/90 border border-cyan-400 text-cyan-300 font-mono text-[11px] font-bold tracking-wider animate-bounce shadow-lg">
                  {prompt}
                </div>
              )}
            </div>

            {/* P1 Bottom Bar: Health, Stamina, Melee, Weapon */}
            <div className="flex items-end justify-between pr-4">
              <div className="flex flex-col gap-2 bg-slate-950/85 border border-slate-800 p-3 rounded-sm backdrop-blur-md min-w-[210px] shadow-2xl">
                {/* Health */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Shield className="w-3.5 h-3.5" /> P1 HEALTH
                    </span>
                    <span className={isP1LowHp ? 'text-rose-400 animate-pulse font-black' : 'text-slate-200'}>
                      {Math.ceil(hp)} / {maxHp}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-150 ${
                        isP1LowHp ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${p1HpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stamina */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Zap className="w-3 h-3" /> STAMINA
                    </span>
                    <span className="text-slate-400">{Math.ceil(stamina)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-amber-400 transition-all duration-100"
                      style={{ width: `${Math.max(0, stamina)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* P1 Melee Strike */}
              <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-sm font-mono text-xs shadow-md">
                <Swords className={`w-3.5 h-3.5 ${p1MeleeReady ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
                <span className={`text-[10px] font-bold ${p1MeleeReady ? 'text-cyan-300' : 'text-slate-500'}`}>
                  BASH [F]
                </span>
              </div>

              {/* P1 Weapon */}
              {activeWeapon && (
                <div className="flex flex-col items-end gap-0.5 bg-slate-950/85 border border-slate-800 p-3 rounded-sm backdrop-blur-md min-w-[170px] shadow-2xl">
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                    {activeWeapon.category}
                  </div>
                  <div className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    {activeWeapon.name}
                  </div>
                  <div className="flex items-baseline gap-1 font-mono pt-0.5">
                    <span className="text-2xl font-black text-cyan-400">{activeWeapon.currentMag}</span>
                    <span className="text-xs text-slate-500 font-bold">
                      / {activeWeapon.reserve === 999 ? '∞' : activeWeapon.reserve}
                    </span>
                  </div>
                  {activeWeapon.isReloading && (
                    <div className="text-[10px] font-mono text-amber-400 font-bold animate-pulse">RELOADING...</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* PLAYER 2 VIEWPORT HUD (RIGHT HALF)                                    */}
          {/* --------------------------------------------------------------------- */}
          <div className="relative w-1/2 h-full flex flex-col justify-between p-6 pointer-events-none">
            {/* Low Health Screen Vignette */}
            {isP2LowHp && (
              <div className="absolute inset-0 border-[10px] border-amber-500/30 animate-pulse pointer-events-none" />
            )}

            {/* Operative Header Tag */}
            <div className="pt-16 flex items-center justify-end gap-2">
              {isDowned && !p1Dead && (
                <div className="px-2.5 py-0.5 rounded-xs bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold tracking-wider animate-bounce flex items-center gap-1">
                  <HeartPulse className="w-3 h-3 text-cyan-400" />
                  VANGUARD DOWNED ({downedTimer}s)
                </div>
              )}
              <div className="px-2.5 py-0.5 rounded-xs bg-amber-950/80 border border-amber-500/70 text-amber-300 font-mono text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                PLAYER 2 // RECON [GAMEPAD / ARROWS+NUMPAD]
              </div>
            </div>

            {/* Crosshair & Prompts for P2 (Center of Right Half) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {!p2Dead && !p2Downed && (
                <div className="relative flex items-center justify-center">
                  {p2Hitmarker && (
                    <div
                      className={`absolute w-8 h-8 border-2 rotate-45 animate-ping opacity-95 ${
                        p2Headshot ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]' : 'border-rose-500'
                      }`}
                    />
                  )}
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(245,158,11,0.9)]" />
                  <div className="absolute -top-3 w-0.5 h-2 bg-amber-400/70" />
                  <div className="absolute -bottom-3 w-0.5 h-2 bg-amber-400/70" />
                  <div className="absolute -left-3 h-0.5 w-2 bg-amber-400/70" />
                  <div className="absolute -right-3 h-0.5 w-2 bg-amber-400/70" />
                </div>
              )}

              {/* P2 Downed Bleedout Banner */}
              {p2Downed && !p2Dead && (
                <div className="px-5 py-3 rounded-sm bg-rose-950/90 border-2 border-rose-500 text-center font-mono animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                  <div className="text-rose-400 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    RECON INCAPACITATED
                  </div>
                  <div className="text-white text-xl font-black tracking-wider mt-0.5">
                    BLEEDOUT: {p2DownedTimer}s
                  </div>
                  <div className="text-[10px] text-rose-300 mt-1">CRAWL TO COVER // AWAIT SQUAD REVIVE</div>
                </div>
              )}

              {/* P2 Dead State */}
              {p2Dead && (
                <div className="px-4 py-2 rounded-sm bg-slate-950/90 border border-amber-500 text-center font-mono">
                  <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                    OPERATIVE FALLEN // CHRONO-REMNANT ACTIVE
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Your autonomous ghost is now fighting alongside Vanguard
                  </div>
                </div>
              )}

              {/* P2 Reviving Teammate Progress Bar */}
              {p2Reviving && (
                <div className="mt-16 w-52 bg-slate-950/90 border border-emerald-500/80 p-2.5 rounded-sm shadow-xl font-mono text-center">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
                    REVIVING VANGUARD... {p2ReviveProgress}%
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-xs mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${p2ReviveProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Interaction Prompt */}
              {p2Prompt && !p2Downed && !p2Dead && (
                <div className="mt-16 px-3 py-1.5 rounded-sm bg-slate-950/90 border border-amber-400 text-amber-300 font-mono text-[11px] font-bold tracking-wider animate-bounce shadow-lg">
                  {p2Prompt}
                </div>
              )}
            </div>

            {/* P2 Bottom Bar: Health, Stamina, Melee, Weapon */}
            <div className="flex items-end justify-between pl-4">
              <div className="flex flex-col gap-2 bg-slate-950/85 border border-slate-800 p-3 rounded-sm backdrop-blur-md min-w-[210px] shadow-2xl">
                {/* Health */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Shield className="w-3.5 h-3.5" /> P2 HEALTH
                    </span>
                    <span className={isP2LowHp ? 'text-rose-400 animate-pulse font-black' : 'text-slate-200'}>
                      {Math.ceil(p2Hp)} / {p2MaxHp}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-150 ${
                        isP2LowHp ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-amber-500'
                      }`}
                      style={{ width: `${p2HpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stamina */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                    <span className="flex items-center gap-1 text-amber-300">
                      <Zap className="w-3 h-3" /> STAMINA
                    </span>
                    <span className="text-slate-400">{Math.ceil(p2Stamina)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-amber-400 transition-all duration-100"
                      style={{ width: `${Math.max(0, p2Stamina)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* P2 Melee Strike */}
              <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-sm font-mono text-xs shadow-md">
                <Swords className={`w-3.5 h-3.5 ${p2MeleeReady ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                <span className={`text-[10px] font-bold ${p2MeleeReady ? 'text-amber-300' : 'text-slate-500'}`}>
                  BASH [B / R-STICK]
                </span>
              </div>

              {/* P2 Weapon */}
              {p2ActiveWeapon && (
                <div className="flex flex-col items-end gap-0.5 bg-slate-950/85 border border-slate-800 p-3 rounded-sm backdrop-blur-md min-w-[170px] shadow-2xl">
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
                    {p2ActiveWeapon.category}
                  </div>
                  <div className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    {p2ActiveWeapon.name}
                  </div>
                  <div className="flex items-baseline gap-1 font-mono pt-0.5">
                    <span className="text-2xl font-black text-amber-400">{p2ActiveWeapon.currentMag}</span>
                    <span className="text-xs text-slate-500 font-bold">
                      / {p2ActiveWeapon.reserve === 999 ? '∞' : p2ActiveWeapon.reserve}
                    </span>
                  </div>
                  {p2ActiveWeapon.isReloading && (
                    <div className="text-[10px] font-mono text-amber-400 font-bold animate-pulse">RELOADING...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CLASSIC FULLSCREEN SOLO RUN HUD                                          */
        /* ========================================================================= */
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          {/* Low Health Screen Vignette */}
          {isP1LowHp && (
            <div className="absolute inset-0 border-[12px] border-rose-600/40 animate-pulse pointer-events-none" />
          )}

          {/* Center Screen: Tactical Crosshair, Hitmarkers & Interaction Prompt */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative flex items-center justify-center">
              {p1Hitmarker && (
                <div
                  className={`absolute w-8 h-8 border-2 rotate-45 animate-ping opacity-95 ${
                    p1Headshot ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]' : 'border-rose-500'
                  }`}
                />
              )}
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/90 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400/70" />
              <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400/70" />
              <div className="absolute -left-3 h-0.5 w-2 bg-cyan-400/70" />
              <div className="absolute -right-3 h-0.5 w-2 bg-cyan-400/70" />
            </div>

            {prompt && (
              <div className="mt-20 px-4 py-2 rounded-sm bg-slate-950/90 border border-cyan-400/60 text-cyan-300 font-mono text-xs font-bold tracking-wider animate-bounce shadow-[0_0_18px_rgba(6,182,212,0.5)]">
                {prompt}
              </div>
            )}
          </div>

          <div />

          {/* Bottom Bar: Health, Stamina, Melee Cooldown & Weapon HUD */}
          <div className="flex items-end justify-between">
            {/* Health & Stamina Bars */}
            <div className="flex flex-col gap-2.5 bg-slate-950/85 border border-slate-800 p-4 rounded-sm backdrop-blur-md min-w-[260px] shadow-2xl">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <Shield className="w-3.5 h-3.5" /> HEALTH
                  </span>
                  <span className={isP1LowHp ? 'text-rose-500 animate-pulse font-black' : 'text-slate-200'}>
                    {Math.ceil(hp)} / {maxHp}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-xs overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isP1LowHp ? 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.9)]' : 'bg-rose-500'
                    }`}
                    style={{ width: `${p1HpPercent}%` }}
                  />
                </div>
              </div>

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

            {/* Quick Melee Widget */}
            <div className="flex items-center gap-3 bg-slate-950/85 border border-slate-800 px-4 py-2 rounded-sm backdrop-blur-md font-mono text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <Swords className={`w-4 h-4 ${p1MeleeReady ? 'text-orange-400 animate-pulse' : 'text-slate-600'}`} />
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold tracking-wider">MELEE STRIKE</div>
                  <div className={`font-bold ${p1MeleeReady ? 'text-orange-300' : 'text-slate-500'}`}>
                    {p1MeleeReady ? 'READY' : 'RECOVERING'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-bold">
                [F]
              </span>
            </div>

            {/* Weapon & Ammo HUD */}
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
                  <span className="text-4xl font-black text-cyan-400">{activeWeapon.currentMag}</span>
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

          <MobileControls engine={engine} visible={isTouchDevice} />
        </div>
      )}
    </div>
  );
};
