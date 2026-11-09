import { PlayerData, ZombieEntity, PlayerCosmeticLoadout } from '../types/game';

export type NetEventHandler = (data: unknown) => void;

class NetworkManager {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<NetEventHandler>>();
  private reconnectTimer: NodeJS.Timeout | null = null;
  public isConnected: boolean = false;
  public roomCode: string | null = null;
  public myPlayerId: string | null = null;
  public isHost: boolean = false;
  public pingMs: number = 24;

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

  public async checkRoom(code: string): Promise<{ exists: boolean; playerCount: number; status: string }> {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) return { exists: false, playerCount: 0, status: 'none' };
      const data = await res.json();
      return { exists: data.exists, playerCount: data.playerCount, status: data.status };
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;

    this.roomCode = params.roomCode.toUpperCase();
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.emit('connection_changed', { connected: true });

      // Send join message
      this.send({
        type: 'join_room',
        roomCode: this.roomCode,
        playerName: params.playerName,
        characterId: params.characterId,
        weaponId: params.weaponId,
        playerId: this.myPlayerId,
        cosmetics: params.cosmetics
      });

      // Ping interval
      this.startPingLoop();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room_joined') {
          this.roomCode = msg.roomCode;
          this.myPlayerId = msg.playerId;
          this.isHost = msg.isHost;
        } else if (msg.type === 'pong') {
          this.pingMs = Math.max(12, Date.now() - msg.timestamp);
          this.emit('ping_updated', { ping: this.pingMs });
          return;
        }
        this.emit(msg.type, msg);
      } catch (e) {
        console.error('Error parsing network message:', e);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.emit('connection_changed', { connected: false });
    };

    this.ws.onerror = (err) => {
      console.warn('WebSocket connection error:', err);
    };
  }

  private pingInterval: NodeJS.Timeout | null = null;
  private startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 4000);
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

  public damageZombie(zombieId: string, damage: number, isHeadshot: boolean) {
    this.send({
      type: 'damage_zombie',
      zombieId,
      damage,
      isHeadshot
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

  public disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.roomCode = null;
    this.myPlayerId = null;
    this.isHost = false;
  }
}

export const net = new NetworkManager();
