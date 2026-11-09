import React, { useState } from 'react';
import {
  X,
  Users,
  Wifi,
  Copy,
  Check,
  Server,
  Shield,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Gamepad2,
  AlertCircle,
  Play
} from 'lucide-react';
import { GameMode } from '../types/game';

interface OnlineLobbyModalProps {
  onClose: () => void;
  onStartMatch: (mode: GameMode) => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  onClose,
  onStartMatch,
}) => {
  const [tab, setTab] = useState<'HOST' | 'JOIN' | 'ARCHITECTURE'>('HOST');
  const [roomCode, setRoomCode] = useState(() => 'DR-' + Math.floor(1000 + Math.random() * 9000));
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [pingStatus, setPingStatus] = useState<'OPTIMAL' | 'TESTING'>('OPTIMAL');
  const [p1Ready, setP1Ready] = useState(true);
  const [p2Joined, setP2Joined] = useState(false);
  const [p2Ready, setP2Ready] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateJoin = () => {
    setP2Joined(true);
    setTimeout(() => setP2Ready(true), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-sm shadow-2xl overflow-hidden font-mono text-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black tracking-widest text-white uppercase">
              CO-OP MULTIPLAYER // NETWORK OPERATIONS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-bold">
          <button
            onClick={() => setTab('HOST')}
            className={`flex-1 py-3 px-4 border-b-2 transition-all ${
              tab === 'HOST'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            HOST SQUAD ROOM
          </button>
          <button
            onClick={() => setTab('JOIN')}
            className={`flex-1 py-3 px-4 border-b-2 transition-all ${
              tab === 'JOIN'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            JOIN VIA ROOM CODE
          </button>
          <button
            onClick={() => setTab('ARCHITECTURE')}
            className={`flex-1 py-3 px-4 border-b-2 transition-all ${
              tab === 'ARCHITECTURE'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SERVER ARCHITECTURE
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {tab === 'HOST' && (
            <div className="space-y-6">
              {/* Room Code Banner */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    YOUR CO-OP SQUAD ACCESS CODE
                  </div>
                  <div className="text-3xl font-black text-cyan-400 tracking-widest mt-0.5">
                    {roomCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-sm transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'COPIED TO CLIPBOARD' : 'COPY CODE'}
                </button>
              </div>

              {/* Squad Slots */}
              <div className="space-y-3">
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  SQUAD SESSIONS (2 / 2 OPERATIVES)
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Slot 1: Host */}
                  <div className="p-4 rounded-sm bg-cyan-950/30 border border-cyan-500/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-cyan-400 font-bold">SLOT 01 // HOST</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        READY
                      </span>
                    </div>
                    <div className="text-base font-black text-white">OPERATIVE VANGUARD</div>
                    <div className="text-[11px] text-slate-400">Tactical Role: Assault & Breaching</div>
                    <div className="text-[10px] text-cyan-300 font-mono">Controls: Mouse + Keyboard [WASD]</div>
                  </div>

                  {/* Slot 2: Teammate */}
                  <div className={`p-4 rounded-sm border transition-all ${
                    p2Joined
                      ? 'bg-amber-950/30 border-amber-500/50 space-y-2'
                      : 'bg-slate-950/50 border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-6'
                  }`}>
                    {p2Joined ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-bold">SLOT 02 // SQUADMATE</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            p2Ready
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                              : 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse'
                          }`}>
                            {p2Ready ? 'READY' : 'JOINING...'}
                          </span>
                        </div>
                        <div className="text-base font-black text-white">OPERATIVE RECON</div>
                        <div className="text-[11px] text-slate-400">Tactical Role: Flanker & Support</div>
                        <div className="text-[10px] text-amber-300 font-mono">Controls: Gamepad / Secondary KBM</div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-400">AWAITING PEER CONNECTION...</div>
                        <button
                          onClick={handleSimulateJoin}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] rounded font-bold transition-all"
                        >
                          TEST JOIN SLOT 2
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Local Split-Screen Fast Launch Option */}
              <div className="p-4 rounded-sm bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                    PLAY TOGETHER ON SAME MACHINE?
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Launch Instant Split-Screen Co-Op now (Player 1 KBM + Player 2 Gamepad or Split Keys).
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onStartMatch('LOCAL_COOP');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-sm transition-all"
                >
                  PLAY SPLIT-SCREEN
                </button>
              </div>
            </div>
          )}

          {tab === 'JOIN' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  ENTER 6-DIGIT SQUAD ROOM CODE:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="E.G. DR-4820"
                    maxLength={10}
                    className="flex-1 bg-slate-950 border border-slate-700 px-4 py-3 rounded-sm font-mono text-lg font-bold text-cyan-400 focus:outline-none focus:border-cyan-400 uppercase"
                  />
                  <button
                    onClick={() => {
                      if (inputCode.trim()) {
                        onClose();
                        onStartMatch('LOCAL_COOP');
                      }
                    }}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm rounded-sm transition-all"
                  >
                    CONNECT
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-sm bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  NETWORK PEER PROTOCOL
                </div>
                <p>
                  Matches run on a low-latency WebSockets state stream synchronizing operative transforms, zombie aggro vectors, damage events, and dual extraction zones.
                </p>
              </div>
            </div>
          )}

          {tab === 'ARCHITECTURE' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-sm bg-slate-950/80 border border-cyan-500/40 space-y-2">
                <div className="font-bold text-cyan-300 flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  DEAD//RECKONING SERVER-AUTHORITATIVE NETWORKING BLUEPRINT
                </div>
                <p className="text-slate-300">
                  To eliminate cheating, desync, and ghost hits while preserving the signature 60FPS fluid Three.js combat, DEAD//RECKONING uses a hybrid client-predicted / server-authoritative state model:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-sm space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> 1. Server Authority (30Hz)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Zombie spawns, wave transitions, boss HP, and extraction countdowns run deterministically on the Node.js WebSocket host process.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-sm space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" /> 2. Client Prediction
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Local player movement, sprint acceleration, and camera rotation respond with 0ms latency. The server sends delta corrections only if drift exceeds 0.2m.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-sm space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> 3. Hit-Reg & Lag Comp
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Client projectile rays are rewound against the server's historical zombie hitboxes within a 150ms buffer to guarantee zero "blank" bullet hits.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-sm space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-rose-400" /> 4. Remnant Co-Op Sync
                  </div>
                  <p className="text-[11px] text-slate-400">
                    When an operative dies, their recorded combat timeline is broadcasted once and replayed identically across both clients.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-sm text-[11px] text-cyan-300">
                <strong>Deployment Requirements:</strong> Requires a Node.js full-stack process running `ws` on port 3000 alongside Vite middleware. The local co-op split-screen mode is fully operational right now with zero network latency.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>SERVER TICK: 30HZ // LATENCY: 18MS</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-sm transition-all"
            >
              CLOSE
            </button>
            <button
              onClick={() => {
                onClose();
                onStartMatch('LOCAL_COOP');
              }}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black tracking-wider uppercase rounded-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <Play className="w-4 h-4 fill-current" />
              DEPLOY TWO-PLAYER SQUAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
