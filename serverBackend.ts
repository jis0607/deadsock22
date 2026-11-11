import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export interface PlayerState {
  id: string;
  name: string;
  characterId: string;
  weaponId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitch: number;
  isAiming: boolean;
  isShooting: boolean;
  state: 'idle' | 'running' | 'shooting' | 'downed' | 'reviving' | 'dead';
  health: number;
  maxHealth: number;
  armor: number;
  score: number;
  kills: number;
  isReady: boolean;
  cosmetics?: {
    weaponSkinId: string;
    outfitId: string;
    helmetId: string;
    maskId: string;
    backpackId: string;
    glovesId: string;
    accessoryId: string;
  };
  lastChronoEcho?: { x: number; y: number; z: number; timestamp: number };
}

export interface ZombieState {
  id: string;
  type: 'SHAMBLER' | 'RUNNER' | 'BRUTE' | 'SPITTER' | 'HUNTER' | 'BOSS_RECKONER';
  x: number;
  y: number;
  z: number;
  rotY: number;
  health: number;
  maxHealth: number;
  targetPlayerId: string | null;
  state: 'chase' | 'attack' | 'stagger' | 'dead';
  speed: number;
  damage: number;
}

export interface ConnectedPlayer {
  ws: WebSocket | null;
  state: PlayerState;
  isDisconnected: boolean;
  disconnectTimestamp: number;
  lastDamageTimestamp: number;
  lastShotTimestamp: number;
}

export interface Room {
  code: string;
  createdAt: number;
  status: 'lobby' | 'in_game' | 'extracted' | 'wiped';
  selectedMap: string;
  hostPlayerId: string;
  wave: number;
  isIntermission: boolean;
  intermissionTimer: number;
  isExtracting: boolean;
  extractionTimer: number;
  zombies: Map<string, ZombieState>;
  players: Map<string, ConnectedPlayer>;
  openedCrates: Set<number>;
  nextZombieId: number;
  lastTick: number;
  intervalTimer?: NodeJS.Timeout;
  reconnectGraceMs?: number;
}

// Weapon authority specifications for server-side damage & rate-of-fire enforcement
export const WEAPON_SPECS: Record<string, { maxDamage: number; minIntervalMs: number; maxRange: number }> = {
  ar_chronostrike: { maxDamage: 45, minIntervalMs: 70, maxRange: 75 },
  smg_vector: { maxDamage: 32, minIntervalMs: 45, maxRange: 50 },
  sg_breaker: { maxDamage: 155, minIntervalMs: 250, maxRange: 35 },
  sn_widowmaker: { maxDamage: 350, minIntervalMs: 700, maxRange: 110 },
  melee: { maxDamage: 80, minIntervalMs: 500, maxRange: 4.5 },
  default: { maxDamage: 50, minIntervalMs: 65, maxRange: 75 },
};

export const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  const prefixes = ['ALPHA', 'BRAVO', 'DELTA', 'ECHO', 'GHOST', 'RAVEN', 'VIPER', 'TITAN'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

export function broadcastToRoom(room: Room, message: object, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);
  for (const { ws } of room.players.values()) {
    if (ws && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

export function spawnZombieWave(room: Room, waveNum: number) {
  room.zombies.clear();

  if (waveNum === 1) {
    for (let i = 0; i < 8; i++) spawnSingleZombie(room, 'SHAMBLER');
  } else if (waveNum === 2) {
    for (let i = 0; i < 12; i++) spawnSingleZombie(room, 'SHAMBLER');
    for (let i = 0; i < 4; i++) spawnSingleZombie(room, 'RUNNER');
  } else if (waveNum === 3) {
    for (let i = 0; i < 14; i++) spawnSingleZombie(room, 'SHAMBLER');
    for (let i = 0; i < 6; i++) spawnSingleZombie(room, 'RUNNER');
    for (let i = 0; i < 2; i++) spawnSingleZombie(room, 'BRUTE');
  } else if (waveNum === 4) {
    for (let i = 0; i < 14; i++) spawnSingleZombie(room, 'SHAMBLER');
    for (let i = 0; i < 4; i++) spawnSingleZombie(room, 'SPITTER');
    for (let i = 0; i < 4; i++) spawnSingleZombie(room, 'HUNTER');
  } else if (waveNum === 5) {
    // Boss wave: Reckoner
    spawnSingleZombie(room, 'BOSS_RECKONER', 0, -25);
    for (let i = 0; i < 8; i++) spawnSingleZombie(room, 'RUNNER');
  } else {
    const total = 14 + waveNum * 4;
    const types: Array<'SHAMBLER' | 'RUNNER' | 'BRUTE' | 'SPITTER' | 'HUNTER'> = [
      'SHAMBLER', 'RUNNER', 'BRUTE', 'SPITTER', 'HUNTER'
    ];
    for (let i = 0; i < total; i++) {
      spawnSingleZombie(room, types[Math.floor(Math.random() * types.length)]);
    }
  }
}

function spawnSingleZombie(
  room: Room,
  type: 'SHAMBLER' | 'RUNNER' | 'BRUTE' | 'SPITTER' | 'HUNTER' | 'BOSS_RECKONER',
  customX?: number,
  customZ?: number
) {
  const id = `z_${room.nextZombieId++}`;
  let x = customX;
  let z = customZ;

  if (x === undefined || z === undefined) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 24 + Math.random() * 20;
    x = Math.cos(angle) * dist;
    z = Math.sin(angle) * dist;
  }

  let health = 70;
  let speed = 2.4;
  let damage = 18;

  if (type === 'RUNNER') {
    health = 45;
    speed = 5.2;
    damage = 14;
  } else if (type === 'BRUTE') {
    health = 420;
    speed = 1.8;
    damage = 45;
  } else if (type === 'SPITTER') {
    health = 60;
    speed = 2.8;
    damage = 22;
  } else if (type === 'HUNTER') {
    health = 55;
    speed = 5.8;
    damage = 25;
  } else if (type === 'BOSS_RECKONER') {
    health = 3800;
    speed = 2.6;
    damage = 60;
  }

  room.zombies.set(id, {
    id,
    type,
    x,
    y: 0,
    z,
    rotY: 0,
    health,
    maxHealth: health,
    targetPlayerId: null,
    state: 'chase',
    speed,
    damage
  });
}

export function updateRoomZombies(room: Room, deltaSeconds: number) {
  if (room.status !== 'in_game') return;

  const playerEntries = Array.from(room.players.entries()).filter(([, p]) => !p.isDisconnected);
  if (playerEntries.length === 0) return;

  const activePlayers = playerEntries.filter(([, p]) => p.state.health > 0);
  const targets = activePlayers.length > 0 ? activePlayers : playerEntries;

  let deadCount = 0;

  for (const zombie of room.zombies.values()) {
    if (zombie.state === 'dead' || zombie.health <= 0) {
      deadCount++;
      continue;
    }

    let nearestDist = Infinity;
    let target = targets[0][1].state;
    for (const [, p] of targets) {
      const dx = p.state.x - zombie.x;
      const dz = p.state.z - zombie.z;
      const d = Math.hypot(dx, dz);
      if (d < nearestDist) {
        nearestDist = d;
        target = p.state;
      }
    }

    zombie.targetPlayerId = target.id;
    const dx = target.x - zombie.x;
    const dz = target.z - zombie.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.1) {
      zombie.rotY = Math.atan2(dx, dz);
      if (dist > 1.6) {
        zombie.state = 'chase';
        const moveDist = Math.min(dist - 1.4, zombie.speed * deltaSeconds);
        zombie.x += (dx / dist) * moveDist;
        zombie.z += (dz / dist) * moveDist;
      } else {
        zombie.state = 'attack';
      }
    }
  }

  // Wave progression
  if (room.zombies.size > 0 && deadCount >= room.zombies.size) {
    if (!room.isIntermission) {
      room.isIntermission = true;
      room.intermissionTimer = 4.0;
      broadcastToRoom(room, {
        type: 'wave_complete',
        completedWave: room.wave
      });
    } else {
      room.intermissionTimer -= deltaSeconds;
      if (room.intermissionTimer <= 0) {
        room.isIntermission = false;
        room.wave++;
        spawnZombieWave(room, room.wave);
        broadcastToRoom(room, {
          type: 'wave_start',
          wave: room.wave,
          zombies: Array.from(room.zombies.values())
        });
      }
    }
  }
}

// Attach WebSocket server and HTTP middleware
export function setupGameBackend(httpServer: any, middlewares?: any) {
  // REST routes middleware if using Connect/Express middlewares
  if (middlewares) {
    middlewares.use('/api', (req: http.IncomingMessage, res: http.ServerResponse, next: Function) => {
      // Set permissive CORS headers for cross-origin and iframe proxy compatibility
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const url = req.url || '';
      if (url === '/health' || url.startsWith('/health?')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: Date.now(),
          activeRooms: rooms.size,
          rooms: Array.from(rooms.values()).map(r => ({
            code: r.code,
            status: r.status,
            playerCount: r.players.size,
            activePlayers: Array.from(r.players.values()).filter(p => !p.isDisconnected).length,
            wave: r.wave
          }))
        }));
        return;
      }

      const parseBody = (callback: (body: Record<string, unknown>) => void) => {
        const reqAny = req as unknown as Record<string, unknown>;
        if (reqAny.body && typeof reqAny.body === 'object') {
          callback(reqAny.body as Record<string, unknown>);
          return;
        }
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
          try {
            callback(JSON.parse(raw || '{}'));
          } catch {
            callback({});
          }
        });
      };

      if (url === '/rooms/create' && req.method === 'POST') {
        parseBody((parsed) => {
          const mapId = (parsed.mapId as string) || 'neon_quarantine';
          const code = generateRoomCode();
          const room: Room = {
            code,
            createdAt: Date.now(),
            status: 'lobby',
            selectedMap: mapId,
            hostPlayerId: '',
            wave: 1,
            isIntermission: false,
            intermissionTimer: 0,
            isExtracting: false,
            extractionTimer: 35,
            zombies: new Map(),
            players: new Map(),
            openedCrates: new Set(),
            nextZombieId: 1,
            lastTick: Date.now(),
            reconnectGraceMs: typeof parsed.graceMs === 'number' && parsed.graceMs > 0 ? parsed.graceMs : 30000
          };
          rooms.set(code, room);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, roomCode: code }));
        });
        return;
      }

      if (url.startsWith('/rooms/') && req.method === 'GET') {
        const parts = url.split('/');
        const code = (parts[2] || '').split('?')[0].toUpperCase();
        const room = rooms.get(code);
        res.setHeader('Content-Type', 'application/json');
        if (!room) {
          res.statusCode = 404;
          res.end(JSON.stringify({ exists: false, error: 'Room not found' }));
          return;
        }
        const playersList = Array.from(room.players.values()).map(p => ({
          id: p.state.id,
          name: p.state.name,
          characterId: p.state.characterId,
          isReady: p.state.isReady,
          isDisconnected: p.isDisconnected
        }));
        res.end(JSON.stringify({
          exists: true,
          code: room.code,
          playerCount: room.players.size,
          activePlayerCount: Array.from(room.players.values()).filter(p => !p.isDisconnected).length,
          status: room.status,
          selectedMap: room.selectedMap,
          players: playersList
        }));
        return;
      }

      if (url === '/matchmaking' && req.method === 'POST') {
        for (const [code, room] of rooms.entries()) {
          const connectedCount = Array.from(room.players.values()).filter(p => !p.isDisconnected).length;
          if (room.status === 'lobby' && connectedCount === 1) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, roomCode: code, isHost: false }));
            return;
          }
        }
        const code = generateRoomCode();
        const room: Room = {
          code,
          createdAt: Date.now(),
          status: 'lobby',
          selectedMap: 'neon_quarantine',
          hostPlayerId: '',
          wave: 1,
          isIntermission: false,
          intermissionTimer: 0,
          isExtracting: false,
          extractionTimer: 35,
          zombies: new Map(),
          players: new Map(),
          openedCrates: new Set(),
          nextZombieId: 1,
          lastTick: Date.now()
        };
        rooms.set(code, room);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, roomCode: code, isHost: true }));
        return;
      }

      next();
    });
  }

  // WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // 15-second ping-pong heartbeat verification to detect dead TCP connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      const extWs = client as WebSocket & { isAlive?: boolean };
      if (extWs.isAlive === false) {
        extWs.terminate();
        return;
      }
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 15000);

  // Stale room cleanup reaper (every 30 seconds)
  const roomReaperInterval = setInterval(() => {
    const now = Date.now();
    for (const [code, r] of rooms.entries()) {
      const activeCount = Array.from(r.players.values()).filter(p => !p.isDisconnected).length;
      // If room is completely abandoned for > 35 seconds
      if (activeCount === 0 && now - r.createdAt > 35000) {
        if (r.intervalTimer) clearInterval(r.intervalTimer);
        rooms.delete(code);
      } else if (r.status === 'lobby' && now - r.createdAt > 7200000) {
        // 2 hour idle lobby cleanup
        if (r.intervalTimer) clearInterval(r.intervalTimer);
        rooms.delete(code);
      }
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(roomReaperInterval);
  });

  wss.on('connection', (ws: WebSocket) => {
    const extWs = ws as WebSocket & { isAlive?: boolean };
    extWs.isAlive = true;

    ws.on('pong', () => {
      extWs.isAlive = true;
    });

    let currentRoom: Room | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join_room') {
          const { roomCode, playerName, characterId, weaponId } = msg;
          const code = (roomCode || '').toUpperCase();
          let room = rooms.get(code);
          if (!room) {
            room = {
              code,
              createdAt: Date.now(),
              status: 'lobby',
              selectedMap: 'neon_quarantine',
              hostPlayerId: '',
              wave: 1,
              isIntermission: false,
              intermissionTimer: 0,
              isExtracting: false,
              extractionTimer: 35,
              zombies: new Map(),
              players: new Map(),
              openedCrates: new Set(),
              nextZombieId: 1,
              lastTick: Date.now()
            };
            rooms.set(code, room);
          }

          const pid: string = msg.playerId || `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

          // Check if this is a reconnecting player
          const existingPlayer = room.players.get(pid);
          if (existingPlayer) {
            if (existingPlayer.ws && existingPlayer.ws !== ws && existingPlayer.ws.readyState === WebSocket.OPEN) {
              try {
                existingPlayer.ws.close(1000, 'Duplicate session connected');
              } catch {
                // ignore
              }
            }
            existingPlayer.ws = ws;
            existingPlayer.isDisconnected = false;
            existingPlayer.disconnectTimestamp = 0;
            currentPlayerId = pid;
            currentRoom = room;

            const isHost = room.hostPlayerId === pid || room.players.size === 1;
            if (!room.hostPlayerId) room.hostPlayerId = pid;

            const currentPlayersList = Array.from(room.players.values()).map(p => p.state);
            ws.send(JSON.stringify({
              type: 'room_joined',
              roomCode: room.code,
              playerId: pid,
              isHost,
              isReconnected: true,
              status: room.status,
              selectedMap: room.selectedMap,
              players: currentPlayersList,
              wave: room.wave,
              zombies: Array.from(room.zombies.values()),
              openedCrates: Array.from(room.openedCrates)
            }));

            broadcastToRoom(room, {
              type: 'player_reconnected',
              playerId: pid
            }, ws);
            return;
          }

          // Strict 2-player capacity enforcement for new connections
          const activePlayersCount = Array.from(room.players.values()).filter(p => !p.isDisconnected).length;
          if (activePlayersCount >= 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full (2/2 players)' }));
            return;
          }

          currentPlayerId = pid;
          currentRoom = room;

          const isFirstPlayer = room.players.size === 0 || !room.hostPlayerId;
          if (isFirstPlayer) {
            room.hostPlayerId = pid;
          }

          const playerState: PlayerState = {
            id: pid,
            name: playerName || (isFirstPlayer ? 'Alpha Operative' : 'Bravo Operative'),
            characterId: characterId || 'viper',
            weaponId: weaponId || 'ar_chronostrike',
            x: isFirstPlayer ? -2.5 : 2.5,
            y: 0,
            z: 0,
            rotY: 0,
            pitch: 0,
            isAiming: false,
            isShooting: false,
            state: 'idle',
            health: 100,
            maxHealth: 100,
            armor: 100,
            score: 0,
            kills: 0,
            isReady: false,
            cosmetics: msg.cosmetics || {
              weaponSkinId: 'skin_mil_urban',
              outfitId: 'outfit_urban_bdu',
              helmetId: 'helm_fast_ballistic',
              maskId: 'mask_skull_half',
              backpackId: 'pack_assault',
              glovesId: 'gloves_kevlar',
              accessoryId: 'acc_radio'
            }
          };

          room.players.set(pid, {
            ws,
            state: playerState,
            isDisconnected: false,
            disconnectTimestamp: 0,
            lastDamageTimestamp: 0,
            lastShotTimestamp: 0
          });

          if (!room.intervalTimer) {
            room.lastTick = Date.now();
            room.intervalTimer = setInterval(() => {
              const now = Date.now();
              const delta = (now - room.lastTick) / 1000;
              room.lastTick = now;

              if (room.status === 'in_game') {
                updateRoomZombies(room, delta);
                broadcastToRoom(room, {
                  type: 'zombie_sync',
                  zombies: Array.from(room.zombies.values())
                });
              }
            }, 50);
          }

          const currentPlayersList = Array.from(room.players.values()).map(p => p.state);
          ws.send(JSON.stringify({
            type: 'room_joined',
            roomCode: room.code,
            playerId: pid,
            isHost: room.hostPlayerId === pid,
            status: room.status,
            selectedMap: room.selectedMap,
            players: currentPlayersList,
            wave: room.wave
          }));

          broadcastToRoom(room, {
            type: 'player_joined',
            player: playerState
          }, ws);

          return;
        }

        if (!currentRoom || !currentPlayerId) return;

        const playerObj = currentRoom.players.get(currentPlayerId);
        if (!playerObj) return;

        if (msg.type === 'player_update') {
          const maxCoord = 120;
          const sanitizedX = typeof msg.x === 'number' && isFinite(msg.x) ? Math.max(-maxCoord, Math.min(maxCoord, msg.x)) : playerObj.state.x;
          const sanitizedY = typeof msg.y === 'number' && isFinite(msg.y) ? Math.max(-20, Math.min(40, msg.y)) : playerObj.state.y;
          const sanitizedZ = typeof msg.z === 'number' && isFinite(msg.z) ? Math.max(-maxCoord, Math.min(maxCoord, msg.z)) : playerObj.state.z;

          Object.assign(playerObj.state, {
            x: sanitizedX,
            y: sanitizedY,
            z: sanitizedZ,
            rotY: typeof msg.rotY === 'number' && isFinite(msg.rotY) ? msg.rotY : playerObj.state.rotY,
            pitch: typeof msg.pitch === 'number' && isFinite(msg.pitch) ? msg.pitch : playerObj.state.pitch,
            isAiming: !!msg.isAiming,
            isShooting: !!msg.isShooting,
            state: msg.state || playerObj.state.state,
            health: typeof msg.health === 'number' && isFinite(msg.health) ? Math.max(0, Math.min(playerObj.state.maxHealth, msg.health)) : playerObj.state.health,
            armor: typeof msg.armor === 'number' && isFinite(msg.armor) ? Math.max(0, Math.min(100, msg.armor)) : playerObj.state.armor,
            characterId: msg.characterId || playerObj.state.characterId,
            weaponId: msg.weaponId || playerObj.state.weaponId
          });

          broadcastToRoom(currentRoom, {
            type: 'player_moved',
            playerId: currentPlayerId,
            state: playerObj.state
          }, ws);
          return;
        }

        if (msg.type === 'toggle_ready') {
          playerObj.state.isReady = !playerObj.state.isReady;
          broadcastToRoom(currentRoom, {
            type: 'ready_changed',
            playerId: currentPlayerId,
            isReady: playerObj.state.isReady
          });
          return;
        }

        if (msg.type === 'change_loadout') {
          const VALID_CHARS = new Set(['viper', 'ghost', 'bulwark', 'nyx']);
          const VALID_WEAPONS = new Set(['ar_chronostrike', 'smg_vector', 'sg_breaker', 'sn_widowmaker']);
          if (msg.characterId && VALID_CHARS.has(msg.characterId)) playerObj.state.characterId = msg.characterId;
          if (msg.weaponId && VALID_WEAPONS.has(msg.weaponId)) playerObj.state.weaponId = msg.weaponId;
          if (msg.cosmetics) playerObj.state.cosmetics = { ...playerObj.state.cosmetics, ...msg.cosmetics };
          broadcastToRoom(currentRoom, {
            type: 'loadout_changed',
            playerId: currentPlayerId,
            characterId: playerObj.state.characterId,
            weaponId: playerObj.state.weaponId,
            cosmetics: playerObj.state.cosmetics
          });
          return;
        }

        if (msg.type === 'update_cosmetics') {
          if (msg.cosmetics) {
            playerObj.state.cosmetics = { ...playerObj.state.cosmetics, ...msg.cosmetics };
            broadcastToRoom(currentRoom, {
              type: 'cosmetics_updated',
              playerId: currentPlayerId,
              cosmetics: playerObj.state.cosmetics
            });
          }
          return;
        }

        if (msg.type === 'select_map') {
          currentRoom.selectedMap = msg.mapId;
          broadcastToRoom(currentRoom, {
            type: 'map_selected',
            mapId: msg.mapId
          });
          return;
        }

        if (msg.type === 'start_game') {
          // Only host can start game
          if (currentRoom.hostPlayerId && currentRoom.hostPlayerId !== currentPlayerId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Only host can start the match' }));
            return;
          }

          currentRoom.status = 'in_game';
          currentRoom.wave = 1;
          currentRoom.isIntermission = false;
          currentRoom.intermissionTimer = 0;
          currentRoom.openedCrates.clear();
          currentRoom.zombies.clear();
          spawnZombieWave(currentRoom, 1);

          broadcastToRoom(currentRoom, {
            type: 'game_started',
            mapId: currentRoom.selectedMap,
            wave: 1,
            zombies: Array.from(currentRoom.zombies.values()),
            players: Array.from(currentRoom.players.values()).map(p => p.state)
          });
          return;
        }

        if (msg.type === 'shoot_bullet') {
          const now = Date.now();
          const weaponKey = msg.weaponId || playerObj.state.weaponId || 'default';
          const spec = WEAPON_SPECS[weaponKey] || WEAPON_SPECS['default'];

          // Weapon rate of fire sanity check
          if (now - playerObj.lastShotTimestamp < spec.minIntervalMs * 0.7) {
            // Drop excessive fire packets
            return;
          }
          playerObj.lastShotTimestamp = now;

          broadcastToRoom(currentRoom, {
            type: 'bullet_fired',
            playerId: currentPlayerId,
            origin: msg.origin,
            direction: msg.direction,
            weaponId: msg.weaponId
          }, ws);
          return;
        }

        if (msg.type === 'open_crate') {
          const crateId = typeof msg.crateId === 'number' ? msg.crateId : parseInt(msg.crateId, 10);
          if (isNaN(crateId) || crateId < 0 || crateId >= 16) return;

          // Idempotency: verify crate has not already been opened
          if (currentRoom.openedCrates.has(crateId)) {
            return;
          }

          currentRoom.openedCrates.add(crateId);
          broadcastToRoom(currentRoom, {
            type: 'crate_opened',
            crateId,
            openedBy: currentPlayerId
          });
          return;
        }

        if (msg.type === 'detonate_barrel') {
          const barrelIndex = typeof msg.barrelIndex === 'number' ? msg.barrelIndex : parseInt(msg.barrelIndex, 10);
          if (isNaN(barrelIndex) || barrelIndex < 0 || barrelIndex >= 20) return;

          broadcastToRoom(currentRoom, {
            type: 'barrel_detonated',
            barrelIndex,
            triggeredBy: currentPlayerId
          }, ws);
          return;
        }

        if (msg.type === 'damage_zombie') {
          const zombie = currentRoom.zombies.get(msg.zombieId);
          if (!zombie || zombie.health <= 0 || zombie.state === 'dead') {
            return;
          }

          // Verify player is alive and capable of dealing damage
          if (playerObj.state.health <= 0 || playerObj.state.state === 'downed' || playerObj.state.state === 'dead') {
            return;
          }

          const now = Date.now();
          const weaponKey = msg.weaponId || playerObj.state.weaponId || 'default';
          const spec = WEAPON_SPECS[weaponKey] || WEAPON_SPECS['default'];

          // 1. Rate of fire check (with 30% grace for network jitter)
          if (now - playerObj.lastDamageTimestamp < spec.minIntervalMs * 0.70) {
            return;
          }
          playerObj.lastDamageTimestamp = now;

          // 2. Spatial distance check between player and zombie
          const dist = Math.hypot(playerObj.state.x - zombie.x, playerObj.state.z - zombie.z);
          if (dist > spec.maxRange + 8.0) {
            // Out of range exploit attempt - reject
            return;
          }

          // 3. Server-authoritative damage clamping (headshot max multiplier: 2.5x)
          const isHeadshot = !!msg.isHeadshot;
          const maxAllowableDamage = spec.maxDamage * (isHeadshot ? 2.5 : 1.15);
          const validatedDamage = Math.min(Math.max(1, Number(msg.damage) || spec.maxDamage), maxAllowableDamage);

          zombie.health -= validatedDamage;
          const wasBoss = zombie.type === 'BOSS_RECKONER';
          if (zombie.health <= 0) {
            zombie.health = 0;
            zombie.state = 'dead';
            playerObj.state.kills++;
            playerObj.state.score += wasBoss ? 2500 : zombie.type === 'BRUTE' ? 500 : 150;
          }

          broadcastToRoom(currentRoom, {
            type: 'zombie_damaged',
            zombieId: msg.zombieId,
            damage: validatedDamage,
            isHeadshot,
            remainingHealth: zombie.health,
            state: zombie.state,
            killedBy: zombie.health <= 0 ? currentPlayerId : null,
            score: playerObj.state.score,
            kills: playerObj.state.kills
          });

          if (wasBoss && zombie.health <= 0) {
            currentRoom.isExtracting = true;
            broadcastToRoom(currentRoom, {
              type: 'extraction_started'
            });
          }
          return;
        }

        if (msg.type === 'chrono_echo') {
          playerObj.state.lastChronoEcho = {
            x: msg.x,
            y: msg.y,
            z: msg.z,
            timestamp: Date.now()
          };
          broadcastToRoom(currentRoom, {
            type: 'chrono_echo_created',
            playerId: currentPlayerId,
            x: msg.x,
            y: msg.y,
            z: msg.z,
            characterId: playerObj.state.characterId
          });
          return;
        }

        if (msg.type === 'player_revive') {
          // Reviver must be alive
          if (playerObj.state.health <= 0 || playerObj.state.state === 'downed') {
            return;
          }

          const targetPlayer = currentRoom.players.get(msg.targetPlayerId);
          if (!targetPlayer) return;

          // Target must actually be downed or dead
          if (targetPlayer.state.health > 0 && targetPlayer.state.state !== 'downed') {
            return;
          }

          // Distance check: must be within 5.5 meters
          const dist = Math.hypot(playerObj.state.x - targetPlayer.state.x, playerObj.state.z - targetPlayer.state.z);
          if (dist > 5.5) {
            return;
          }

          targetPlayer.state.health = 50;
          targetPlayer.state.state = 'idle';
          broadcastToRoom(currentRoom, {
            type: 'player_revived',
            reviverId: currentPlayerId,
            revivedId: msg.targetPlayerId,
            health: 50
          });
          return;
        }

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }
      } catch (e) {
        console.error('Error in ws message:', e);
      }
    });

    ws.on('close', () => {
      if (currentRoom && currentPlayerId) {
        const p = currentRoom.players.get(currentPlayerId);
        if (p) {
          p.isDisconnected = true;
          p.disconnectTimestamp = Date.now();
          p.ws = null;

          const graceMs = currentRoom.reconnectGraceMs || 30000;
          broadcastToRoom(currentRoom, {
            type: 'player_disconnected',
            playerId: currentPlayerId,
            gracePeriodSeconds: Math.round(graceMs / 1000)
          });

          // Schedule eviction after grace period
          setTimeout(() => {
            if (!currentRoom) return;
            const playerStill = currentRoom.players.get(currentPlayerId!);
            if (playerStill && playerStill.isDisconnected) {
              currentRoom.players.delete(currentPlayerId!);
              broadcastToRoom(currentRoom, {
                type: 'player_left',
                playerId: currentPlayerId
              });

              // Host migration if host permanently disconnected
              if (currentRoom.hostPlayerId === currentPlayerId) {
                const remaining = Array.from(currentRoom.players.values()).find(pl => !pl.isDisconnected);
                if (remaining) {
                  currentRoom.hostPlayerId = remaining.state.id;
                  broadcastToRoom(currentRoom, {
                    type: 'host_migrated',
                    newHostId: remaining.state.id
                  });
                }
              }

              // If no players remain in room, clean up room
              if (currentRoom.players.size === 0) {
                if (currentRoom.intervalTimer) {
                  clearInterval(currentRoom.intervalTimer);
                }
                rooms.delete(currentRoom.code);
              }
            }
          }, graceMs);
        }
      }
    });
  });
}
