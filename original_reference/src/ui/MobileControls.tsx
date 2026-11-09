import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Crosshair, Eye, RotateCw, Zap, Swords, RefreshCw } from 'lucide-react';
import { GameEngine } from '../core/GameEngine';

interface MobileControlsProps {
  engine: GameEngine;
  visible?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ engine, visible = true }) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const lookAreaRef = useRef<HTMLDivElement | null>(null);

  // Joystick touch tracking
  const [joystickTouchId, setJoystickTouchId] = useState<number | null>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 }); // -1 to 1
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });

  // Look area touch tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef<{ x: number; y: number } | null>(null);

  // Button active states for visual feedback
  const [shootActive, setShootActive] = useState(false);
  const [aimActive, setAimActive] = useState(false);

  // --- JOYSTICK LOGIC ---
  const handleJoystickStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchId !== null) return;
    const touch = e.changedTouches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setJoystickTouchId(touch.identifier);
    setJoystickCenter({ x: centerX, y: centerY });
    setJoystickActive(true);

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const radius = rect.width / 2;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * clampedDist) / radius;
    const ny = -(Math.sin(angle) * clampedDist) / radius; // forward is positive

    setJoystickPos({ x: nx, y: ny });
    engine.input.setVirtualJoystick(nx, ny);
  }, [joystickTouchId, engine]);

  const handleJoystickMove = useCallback((e: TouchEvent) => {
    if (joystickTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId) {
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const radius = 55; // max travel radius in px
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, radius);
        const angle = Math.atan2(dy, dx);

        const nx = (Math.cos(angle) * clampedDist) / radius;
        const ny = -(Math.sin(angle) * clampedDist) / radius;

        setJoystickPos({ x: nx, y: ny });
        engine.input.setVirtualJoystick(nx, ny);
        break;
      }
    }
  }, [joystickTouchId, joystickCenter, engine]);

  const handleJoystickEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId) {
        setJoystickTouchId(null);
        setJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        engine.input.setVirtualJoystick(0, 0);
        break;
      }
    }
  }, [joystickTouchId, engine]);

  // --- LOOK AREA LOGIC ---
  const handleLookStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleLookMove = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null || !lastLookPosRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const dx = touch.clientX - lastLookPosRef.current.x;
        const dy = touch.clientY - lastLookPosRef.current.y;
        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };

        engine.input.addTouchLookDelta(dx, dy);
        break;
      }
    }
  }, [engine]);

  const handleLookEnd = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        lastLookPosRef.current = null;
        break;
      }
    }
  }, []);

  // Global touchmove / touchend listeners for seamless tracking outside bounding boxes
  useEffect(() => {
    window.addEventListener('touchmove', handleJoystickMove, { passive: false });
    window.addEventListener('touchend', handleJoystickEnd, { passive: false });
    window.addEventListener('touchcancel', handleJoystickEnd, { passive: false });

    window.addEventListener('touchmove', handleLookMove, { passive: false });
    window.addEventListener('touchend', handleLookEnd, { passive: false });
    window.addEventListener('touchcancel', handleLookEnd, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleJoystickMove);
      window.removeEventListener('touchend', handleJoystickEnd);
      window.removeEventListener('touchcancel', handleJoystickEnd);

      window.removeEventListener('touchmove', handleLookMove);
      window.removeEventListener('touchend', handleLookEnd);
      window.removeEventListener('touchcancel', handleLookEnd);
    };
  }, [handleJoystickMove, handleJoystickEnd, handleLookMove, handleLookEnd]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden touch-none">
      {/* 1. Left Bottom: Responsive Virtual Joystick */}
      <div className="absolute left-6 bottom-24 sm:bottom-28 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickStart}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-colors flex items-center justify-center backdrop-blur-md shadow-2xl ${
            joystickActive
              ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'border-slate-700/80 bg-slate-950/40'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Outer Crosshair Markings */}
          <div className="absolute w-full h-[1px] bg-slate-700/40 pointer-events-none" />
          <div className="absolute h-full w-[1px] bg-slate-700/40 pointer-events-none" />

          {/* Draggable Inner Knob */}
          <div
            className={`w-12 h-12 rounded-full border-2 transition-transform shadow-lg flex items-center justify-center ${
              joystickActive
                ? 'border-cyan-300 bg-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.9)] scale-110'
                : 'border-slate-500 bg-slate-800/80'
            }`}
            style={{
              transform: `translate(${joystickPos.x * 45}px, ${-joystickPos.y * 45}px)`,
              touchAction: 'none',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white/90" />
          </div>
        </div>
      </div>

      {/* 2. Right Side: Full Camera Swipe & Look Drag Area */}
      <div
        ref={lookAreaRef}
        onTouchStart={handleLookStart}
        className="absolute right-0 top-16 bottom-0 w-[55%] pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        {/* Subtle touch-to-aim label hint */}
        <div className="absolute right-6 top-6 text-[10px] font-mono text-slate-500/60 pointer-events-none uppercase tracking-widest">
          DRAG TO AIM //
        </div>
      </div>

      {/* 3. Action Buttons Cluster (Bottom Right) */}
      <div className="absolute right-6 bottom-20 sm:bottom-24 pointer-events-auto flex items-end gap-3">
        {/* Secondary Buttons Stack */}
        <div className="flex flex-col gap-2.5 items-center">
          {/* Weapon Switch Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              engine.input.setButtonState('switchNext', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              engine.input.setButtonState('switchNext', false);
            }}
            className="w-11 h-11 rounded-full bg-slate-900/90 border border-slate-700 active:bg-cyan-500 active:text-slate-950 text-cyan-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Switch Weapon"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Dash / Evade Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              engine.input.setButtonState('dash', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              engine.input.setButtonState('dash', false);
            }}
            className="w-12 h-12 rounded-full bg-slate-900/90 border border-amber-500/80 active:bg-amber-400 active:text-slate-950 text-amber-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Dodge Roll"
          >
            <Zap className="w-6 h-6 fill-current" />
          </button>

          {/* Quick Melee Strike Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              engine.input.setButtonState('melee', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              engine.input.setButtonState('melee', false);
            }}
            className="w-12 h-12 rounded-full bg-slate-900/90 border border-orange-500/80 active:bg-orange-500 active:text-slate-950 text-orange-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Melee Kick"
          >
            <Swords className="w-6 h-6" />
          </button>
        </div>

        {/* Primary Combat Buttons Stack */}
        <div className="flex flex-col gap-3 items-center">
          {/* Aim Down Sights (ADS) Toggle/Hold */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              const next = !aimActive;
              setAimActive(next);
              engine.input.setButtonState('aim', next);
            }}
            className={`w-13 h-13 rounded-full border-2 flex items-center justify-center shadow-xl active:scale-95 transition-all ${
              aimActive
                ? 'border-cyan-400 bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                : 'border-cyan-600/70 bg-slate-950/80 text-cyan-300'
            }`}
            aria-label="Aim Down Sights"
          >
            <Eye className="w-6 h-6" />
          </button>

          {/* Reload Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              engine.input.setButtonState('reload', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              engine.input.setButtonState('reload', false);
            }}
            className="w-12 h-12 rounded-full bg-slate-900/90 border border-slate-700 active:bg-slate-700 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Reload"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {/* Primary Trigger Shoot Button (Large & prominent) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              setShootActive(true);
              engine.input.setButtonState('shoot', true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setShootActive(false);
              engine.input.setButtonState('shoot', false);
            }}
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-3 flex items-center justify-center shadow-2xl active:scale-95 transition-all ${
              shootActive
                ? 'border-rose-400 bg-rose-600 text-white shadow-[0_0_25px_rgba(225,29,72,0.9)] scale-105'
                : 'border-rose-500/80 bg-rose-950/80 text-rose-300'
            }`}
            aria-label="Fire Weapon"
          >
            <Crosshair className="w-9 h-9" />
          </button>
        </div>
      </div>
    </div>
  );
};
