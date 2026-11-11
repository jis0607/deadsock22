import { PlayerData, PlayerCosmeticLoadout } from '../types/game';

export type NetEventHandler = (data: unknown) => void;

class NetworkManager {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<NetEventHandler>>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastConnectParams: {
    roomCode: string;
    playerName: string;
    characterId: string;
    weaponId: string;
    cosmetics?: PlayerCosmeticLoadout;
  } | null = null;
  private reconnectAttempts = 0;

  public isConnected: boolean = false;
  public roomCode: string | null = null;
  public myPlayerId: string | null = null;
  public isHost: boolean = false;
  public pingMs: number = 24;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('dr_coop_player_id');
        if (saved) {
          this.myPlayerId = saved;
        } else {
          const generated = `p_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
          sessionStorage.setItem('dr_coop_player_id', generated);
          this.myPlayerId = generated;
        }
      } catch {
        this.myPlayerId = `p_${Date.now()}`;
      }
    }
  }

  public on(event: string, handler: NetEventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  public emit(event: string, data: unknown) {
    const list = this.handlers.get(event);
    if (list) {
      for (const h of list) {
        try {
          h(data);
        } catch (e) {
          console.error(`Error in event handler for ${event}:`, e);
        }
      }
    }
  }

  public async createRoom(mapId: string = 'neon_quarantine'): Promise<string> {
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapId })
    });
    const data = await res.json();
    return data.roomCode;
  }

  public async quickMatch(): Promise<{ roomCode: string; isHost: boolean }> {
    const res = await fetch('/api/matchmaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return { roomCode: data.roomCode, isHost: data.isHost };
  }

  public async checkRoom(code: string): Promise<{ exists: boolean; playerCount: number; activePlayerCount?: number; status: string }> {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) return { exists: false, playerCount: 0, status: 'none' };
      const data = await res.json();
      return { exists: data.exists, playerCount: data.playerCount, activePlayerCount: data.activePlayerCount, status: data.status };
    } catch {
      return { exists: false, playerCount: 0, status: 'none' };
    }
  }

  public connectToRoom(params: {
    roomCode: string;
    playerName: string;
    characterId: string;
    weaponId: string;
    cosmetics?: PlayerCosmeticLoadout;
  }) {
    this.lastConnectParams = { ...params };

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;

    this.roomCode = params.roomCode.toUpperCase();
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_changed', { connected: true, isReconnected: false });

      // Join room message with persistent playerId
      this.send({
        type: 'join_room',
        roomCode: this.roomCode,
        playerName: params.playerName,
        characterId: params.characterId,
        weaponId: params.weaponId,
        playerId: this.myPlayerId,
        cosmetics: params.cosmetics
      });

      this.startPingLoop();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room_joined' || msg.type === 'room_reconnected') {
          this.roomCode = msg.roomCode;
          this.myPlayerId = msg.playerId;
          this.isHost = msg.isHost;
          if (typeof window !== 'undefined' && msg.playerId) {
            try {
              sessionStorage.setItem('dr_coop_player_id', msg.playerId);
            } catch {
              // ignore
            }
          }
        } else if (msg.type === 'host_migrated') {
          if (msg.newHostId === this.myPlayerId) {
            this.isHost = true;
          }
        } else if (msg.type === 'pong') {
          this.pingMs = Math.max(8, Date.now() - msg.timestamp);
          this.emit('ping_updated', { ping: this.pingMs });
          return;
        }
        this.emit(msg.type, msg);
      } catch (e) {
        console.error('Error parsing network message:', e);
      }
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      this.emit('connection_changed', { connected: false, wasClean: event.wasClean });

      // Auto-reconnect handling if connection drops while in a room
      if (this.lastConnectParams && this.reconnectAttempts < 5) {
        this.reconnectAttempts++;
        const backoffMs = Math.min(8000, 1000 * Math.pow(1.5, this.reconnectAttempts));
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          if (this.lastConnectParams && !this.isConnected) {
            this.connectToRoom(this.lastConnectParams);
          }
        }, backoffMs);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('WebSocket connection error:', err);
    };
  }

  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 3000);
  }

  public send(payload: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public sendPlayerUpdate(state: Partial<PlayerData>) {
    this.send({
      type: 'player_update',
      ...state
    });
  }

  public toggleReady() {
    this.send({ type: 'toggle_ready' });
  }

  public changeLoadout(characterId: string, weaponId: string, cosmetics?: PlayerCosmeticLoadout) {
    this.send({
      type: 'change_loadout',
      characterId,
      weaponId,
      cosmetics
    });
  }

  public updateCosmetics(cosmetics: PlayerCosmeticLoadout) {
    this.send({
      type: 'update_cosmetics',
      cosmetics
    });
  }

  public selectMap(mapId: string) {
    this.send({
      type: 'select_map',
      mapId
    });
  }

  public startGame() {
    this.send({ type: 'start_game' });
  }

  public shootBullet(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, weaponId: string) {
    this.send({
      type: 'shoot_bullet',
      origin,
      direction,
      weaponId
    });
  }

  public damageZombie(zombieId: string, damage: number, isHeadshot: boolean, weaponId?: string) {
    this.send({
      type: 'damage_zombie',
      zombieId,
      damage,
      isHeadshot,
      weaponId
    });
  }

  public sendChronoEcho(x: number, y: number, z: number) {
    this.send({
      type: 'chrono_echo',
      x,
      y,
      z
    });
  }

  public sendRevive(targetPlayerId: string) {
    this.send({
      type: 'player_revive',
      targetPlayerId
    });
  }

  public openCrate(crateId: number) {
    this.send({
      type: 'open_crate',
      crateId
    });
  }

  public detonateBarrel(barrelIndex: number) {
    this.send({
      type: 'detonate_barrel',
      barrelIndex
    });
  }

  public disconnect() {
    this.lastConnectParams = null;
    this.reconnectAttempts = 0;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.roomCode = null;
    this.isHost = false;
  }
}

export const net = new NetworkManager();
