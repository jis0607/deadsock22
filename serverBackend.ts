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
  type: 'walker' | 'runner' | 'brute' | 'acid_spitter';
  x: number;
  y: number;
  z: number;
  rotY: number;
  health: number;
  maxHealth: number;
  targetPlayerId: string | null;
  state: 'chase' | 'attack' | 'stagger' | 'dead';
  speed: number;
}

export interface Room {
  code: string;
  createdAt: number;
  status: 'lobby' | 'in_game' | 'extracted' | 'wiped';
  selectedMap: string;
  wave: number;
  zombies: Map<string, ZombieState>;
  players: Map<string, { ws: WebSocket; state: PlayerState }>;
  nextZombieId: number;
  lastTick: number;
  intervalTimer?: NodeJS.Timeout;
}

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
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

export function spawnZombieWave(room: Room, count: number) {
  const types: Array<'walker' | 'runner' | 'brute' | 'acid_spitter'> = ['walker', 'runner', 'walker', 'brute', 'walker'];
  for (let i = 0; i < count; i++) {
    const id = `z_${room.nextZombieId++}`;
    const angle = Math.random() * Math.PI * 2;
    const dist = 22 + Math.random() * 20;
    const type = types[Math.floor(Math.random() * types.length)];
    const health = type === 'brute' ? 320 : type === 'runner' ? 80 : 140;
    const speed = type === 'runner' ? 6.5 : type === 'brute' ? 3.0 : 4.0;

    room.zombies.set(id, {
      id,
      type,
      x: Math.cos(angle) * dist,
      y: 0,
      z: Math.sin(angle) * dist,
      rotY: 0,
      health,
      maxHealth: health,
      targetPlayerId: null,
      state: 'chase',
      speed
    });
  }
}

export function updateRoomZombies(room: Room, deltaSeconds: number) {
  if (room.status !== 'in_game') return;

  const playerEntries = Array.from(room.players.entries());
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
      if (dist > 1.8) {
        zombie.state = 'chase';
        const moveDist = Math.min(dist - 1.5, zombie.speed * deltaSeconds);
        zombie.x += (dx / dist) * moveDist;
        zombie.z += (dz / dist) * moveDist;
      } else {
        zombie.state = 'attack';
      }
    }
  }

  if (room.zombies.size > 0 && deadCount >= room.zombies.size) {
    room.wave++;
    const nextCount = 6 + room.wave * 4;
    spawnZombieWave(room, nextCount);
    broadcastToRoom(room, {
      type: 'wave_start',
      wave: room.wave,
      count: nextCount
    });
  }
}

// Attach WebSocket server and HTTP middleware
export function setupGameBackend(httpServer: any, middlewares?: any) {
  // REST routes middleware if using Connect/Express middlewares
  if (middlewares) {
    middlewares.use('/api', (req: http.IncomingMessage, res: http.ServerResponse, next: Function) => {
      const url = req.url || '';
      if (url === '/health' || url.startsWith('/health?')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', timestamp: Date.now(), activeRooms: rooms.size }));
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
            wave: 1,
            zombies: new Map(),
            players: new Map(),
            nextZombieId: 1,
            lastTick: Date.now()
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
          isReady: p.state.isReady
        }));
        res.end(JSON.stringify({
          exists: true,
          code: room.code,
          playerCount: room.players.size,
          status: room.status,
          selectedMap: room.selectedMap,
          players: playersList
        }));
        return;
      }

      if (url === '/matchmaking' && req.method === 'POST') {
        for (const [code, room] of rooms.entries()) {
          if (room.status === 'lobby' && room.players.size === 1) {
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
          wave: 1,
          zombies: new Map(),
          players: new Map(),
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

  wss.on('connection', (ws: WebSocket) => {
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
              wave: 1,
              zombies: new Map(),
              players: new Map(),
              nextZombieId: 1,
              lastTick: Date.now()
            };
            rooms.set(code, room);
          }

          if (room.players.size >= 2 && !room.players.has(msg.playerId)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room is full (2/2 players)' }));
            return;
          }

          const pid: string = msg.playerId || `p_${Date.now()}`;
          currentPlayerId = pid;
          currentRoom = room;

          const isFirstPlayer = room.players.size === 0;

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

          room.players.set(pid, { ws, state: playerState });

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
            isHost: isFirstPlayer,
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
          Object.assign(playerObj.state, {
            x: msg.x ?? playerObj.state.x,
            y: msg.y ?? playerObj.state.y,
            z: msg.z ?? playerObj.state.z,
            rotY: msg.rotY ?? playerObj.state.rotY,
            pitch: msg.pitch ?? playerObj.state.pitch,
            isAiming: !!msg.isAiming,
            isShooting: !!msg.isShooting,
            state: msg.state || playerObj.state.state,
            health: msg.health ?? playerObj.state.health,
            armor: msg.armor ?? playerObj.state.armor,
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
          if (msg.characterId) playerObj.state.characterId = msg.characterId;
          if (msg.weaponId) playerObj.state.weaponId = msg.weaponId;
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
          currentRoom.status = 'in_game';
          currentRoom.wave = 1;
          currentRoom.zombies.clear();
          spawnZombieWave(currentRoom, 10);

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
          broadcastToRoom(currentRoom, {
            type: 'bullet_fired',
            playerId: currentPlayerId,
            origin: msg.origin,
            direction: msg.direction,
            weaponId: msg.weaponId
          }, ws);
          return;
        }

        if (msg.type === 'damage_zombie') {
          const zombie = currentRoom.zombies.get(msg.zombieId);
          if (zombie && zombie.health > 0) {
            zombie.health -= msg.damage;
            if (zombie.health <= 0) {
              zombie.health = 0;
              zombie.state = 'dead';
              playerObj.state.kills++;
              playerObj.state.score += zombie.type === 'brute' ? 500 : 150;
            }
            broadcastToRoom(currentRoom, {
              type: 'zombie_damaged',
              zombieId: msg.zombieId,
              damage: msg.damage,
              isHeadshot: !!msg.isHeadshot,
              remainingHealth: zombie.health,
              state: zombie.state,
              killedBy: zombie.health <= 0 ? currentPlayerId : null,
              score: playerObj.state.score,
              kills: playerObj.state.kills
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
          const targetPlayer = currentRoom.players.get(msg.targetPlayerId);
          if (targetPlayer && targetPlayer.state.health <= 0) {
            targetPlayer.state.health = 50;
            targetPlayer.state.state = 'idle';
            broadcastToRoom(currentRoom, {
              type: 'player_revived',
              reviverId: currentPlayerId,
              revivedId: msg.targetPlayerId,
              health: 50
            });
          }
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
        currentRoom.players.delete(currentPlayerId);
        broadcastToRoom(currentRoom, {
          type: 'player_left',
          playerId: currentPlayerId
        });

        if (currentRoom.players.size === 0) {
          if (currentRoom.intervalTimer) {
            clearInterval(currentRoom.intervalTimer);
          }
          rooms.delete(currentRoom.code);
        }
      }
    });
  });
}
