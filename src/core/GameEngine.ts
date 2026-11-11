import * as THREE from 'three';
import { InputManager } from './InputManager';
import { VFXSystem } from '../effects/VFXSystem';
import { CityMap } from '../environment/CityMap';
import { EnemyManager, CombatPlayerTarget } from '../enemies/EnemyManager';
import { RemnantManager } from '../remnants/RemnantManager';
import { PlayerController } from '../player/PlayerController';
import { soundManager } from '../audio/SoundManager';
import { GameMode, GameStats, RemnantRun, PerkDef } from '../types/game';
import { PERK_POOL } from '../types/perks';

export type EngineState = 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADE' | 'GAMEOVER' | 'VICTORY';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public camera2!: THREE.PerspectiveCamera;

  // Game Mode
  public gameMode: GameMode = 'SOLO';

  // Subsystems
  public input!: InputManager;
  public vfx!: VFXSystem;
  public map!: CityMap;
  public enemyManager!: EnemyManager;
  public remnantManager!: RemnantManager;
  public player!: PlayerController;
  public player2: PlayerController | null = null;

  // State
  public state: EngineState = 'MENU';
  public currentWave = 1;
  public waveTimer = 0;
  public isWaveIntermission = false;
  public intermissionTimer = 0;
  public totalMatchTime = 0;
  public lightingMode: 'DAY' | 'NIGHT' = 'DAY';

  // Extraction
  public isExtracting = false;
  public extractionTimer = 0;
  public extractionDuration = 35; // 35 seconds to hold helipad
  public isInExtractionZone = false;

  // Perks
  public selectedPerks: PerkDef[] = [];
  public currentUpgradeChoices: PerkDef[] = [];

  // Animation Frame Loop
  private animFrameId: number | null = null;
  private lastTime = 0;

  // UI Event callbacks
  public onStateChange?: (state: EngineState) => void;
  public onStatsUpdate?: (stats: GameStats) => void;
  public onGameOver?: (run: RemnantRun | null) => void;
  public onVictory?: (stats: GameStats) => void;
  public onWaveComplete?: (wave: number) => void;
  public onLightingModeChange?: (mode: 'DAY' | 'NIGHT') => void;
  public onDamagePopup?: (
    screenPos: { x: number; y: number },
    amount: number,
    isHeadshot: boolean,
    isMelee?: boolean
  ) => void;
  public onLocalPlayerMoved?: (data: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    pitch: number;
    isAiming: boolean;
    isShooting: boolean;
    state: string;
    health: number;
  }) => void;
  public onLocalPlayerFired?: (origin: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }, weaponId: string) => void;
  public onDamageZombie?: (zombieId: string, damage: number, isHeadshot: boolean) => void;
  public onSupplyCrateOpened?: (crateIndex: number) => void;
  public onTeammateRevived?: (teammateId: 'P1' | 'P2') => void;
  public onExplosiveBarrelDetonated?: (barrelIndex: number) => void;
  private telemetryTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initThree();
    this.initSystems();
    this.bindWindowEvents();
  }

  private initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a101d);

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 200);
    this.camera.position.set(0, 5, 10);

    this.camera2 = new THREE.PerspectiveCamera(62, (width / 2) / height, 0.1, 200);
    this.camera2.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
  }

  private initSystems() {
    this.input = new InputManager(this.canvas);
    this.input.onPauseToggle = () => {
      if (this.state === 'PLAYING') {
        this.pauseGame();
      } else if (this.state === 'PAUSED') {
        this.resumeGame();
      }
    };
    this.input.onLightingToggle = () => {
      this.toggleLightingMode();
    };
    this.input.onVisibilityChange = (visible: boolean) => {
      soundManager.handleVisibilityChange(visible);
      if (!visible && this.state === 'PLAYING') {
        this.pauseGame();
      }
    };

    this.vfx = new VFXSystem(this.scene);
    this.map = new CityMap(this.scene);
    this.map.setLightingMode(this.lightingMode);

    this.enemyManager = new EnemyManager(this.scene, this.vfx, this.map);
    this.remnantManager = new RemnantManager(this.scene, this.vfx);
    this.remnantManager.setEnemyManager(this.enemyManager);

    // Player 1 (Operative Vanguard Cyan)
    this.player = new PlayerController(
      this.scene,
      this.camera,
      this.input,
      this.vfx,
      this.map,
      this.enemyManager,
      this.remnantManager,
      'P1'
    );

    // Player 2 (Operative Recon Amber)
    this.player2 = new PlayerController(
      this.scene,
      this.camera2,
      this.input,
      this.vfx,
      this.map,
      this.enemyManager,
      this.remnantManager,
      'P2'
    );
    this.player2.model.root.visible = false;

    // Link Teammates
    this.player.teammate = this.player2;
    this.player2.teammate = this.player;

    // Bind Player death events
    this.player.onPlayerDied = (cause) => {
      this.handlePlayerDeath('P1', cause);
    };
    this.player2.onPlayerDied = (cause) => {
      this.handlePlayerDeath('P2', cause);
    };

    this.player.onPerkReward = () => {
      this.triggerPerkSelection();
    };
    this.player2.onPerkReward = () => {
      this.triggerPerkSelection();
    };

    // Damage Popups with Split-Screen awareness
    const bindPopup = (p: PlayerController, cam: THREE.PerspectiveCamera) => {
      p.onDamagePopup = (worldPos, amount, isHeadshot, isMelee) => {
        const v = worldPos.clone().project(cam);
        if (v.z < 1.0) {
          const w = window.innerWidth;
          const h = window.innerHeight;
          let x = (v.x * 0.5 + 0.5) * w;
          if (this.gameMode === 'LOCAL_COOP') {
            const halfW = w / 2;
            x = (v.x * 0.5 + 0.5) * halfW + (p.playerId === 'P2' ? halfW : 0);
          }
          const y = (-(v.y * 0.5) + 0.5) * h;
          if (this.onDamagePopup) {
            this.onDamagePopup({ x, y }, amount, isHeadshot, isMelee);
          }
        }
      };
    };
    bindPopup(this.player, this.camera);
    bindPopup(this.player2, this.camera2);

    this.player.onShootFired = (origin, dir, weaponId) => {
      if (this.onLocalPlayerFired) {
        this.onLocalPlayerFired(
          { x: origin.x, y: origin.y, z: origin.z },
          { x: dir.x, y: dir.y, z: dir.z },
          weaponId
        );
      }
    };

    this.player.onDamageZombie = (zId, dmg, headshot) => {
      if (this.gameMode === 'ONLINE_COOP' && this.onDamageZombie) {
        this.onDamageZombie(zId, dmg, headshot);
      }
    };

    this.player.onSupplyCrateOpened = (cIdx) => {
      if (this.gameMode === 'ONLINE_COOP' && this.onSupplyCrateOpened) {
        this.onSupplyCrateOpened(cIdx);
      }
    };

    this.player.onTeammateRevived = (tId) => {
      if (this.gameMode === 'ONLINE_COOP' && this.onTeammateRevived) {
        this.onTeammateRevived(tId);
      }
    };

    this.player.onExplosiveBarrelDetonated = (bIdx) => {
      if (this.gameMode === 'ONLINE_COOP' && this.onExplosiveBarrelDetonated) {
        this.onExplosiveBarrelDetonated(bIdx);
      }
    };

    this.enemyManager.onBossKilled = () => {
      this.startExtractionProtocol();
    };
  }

  public setLightingMode(mode: 'DAY' | 'NIGHT') {
    this.lightingMode = mode;
    this.map.setLightingMode(mode);
    if (this.onLightingModeChange) {
      this.onLightingModeChange(mode);
    }
  }

  public toggleLightingMode() {
    const nextMode = this.lightingMode === 'DAY' ? 'NIGHT' : 'DAY';
    this.setLightingMode(nextMode);
  }

  private bindWindowEvents() {
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (!this.renderer || !this.camera || !this.camera2) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.gameMode === 'LOCAL_COOP') {
      const halfW = Math.floor(width / 2);
      this.camera.aspect = halfW / height;
      this.camera.updateProjectionMatrix();
      this.camera2.aspect = (width - halfW) / height;
      this.camera2.updateProjectionMatrix();
    } else {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setSize(width, height);
  };

  // --- GAMEPLAY LIFECYCLE ---

  public startNewRun(mode: GameMode = 'SOLO') {
    this.gameMode = mode;
    this.input.setGameMode(mode);
    this.state = 'PLAYING';
    this.currentWave = 1;
    this.waveTimer = 0;
    this.isWaveIntermission = false;
    this.intermissionTimer = 0;
    this.totalMatchTime = 0;
    this.isExtracting = false;
    this.extractionTimer = 0;
    this.isInExtractionZone = false;
    this.selectedPerks = [];

    // Reset systems
    this.enemyManager.clearAll();
    this.map.deactivateExtraction();

    if (this.gameMode === 'LOCAL_COOP') {
      this.player.resetPlayer(new THREE.Vector3(-2.2, 0, 8));
      this.player.model.root.visible = true;
      if (this.player2) {
        this.player2.resetPlayer(new THREE.Vector3(2.2, 0, 8));
        this.player2.model.root.visible = true;
        this.player.teammate = this.player2;
        this.player2.teammate = this.player;
      }
    } else if (this.gameMode === 'ONLINE_COOP') {
      this.player.resetPlayer(new THREE.Vector3(-1.8, 0, 8));
      this.player.model.root.visible = true;
      if (this.player2) {
        this.player2.resetPlayer(new THREE.Vector3(1.8, 0, 8));
        this.player2.model.root.visible = true;
        this.player2.isDead = false;
        this.player.teammate = this.player2;
        this.player2.teammate = this.player;
      }
    } else {
      this.player.resetPlayer(new THREE.Vector3(0, 0, 8));
      this.player.model.root.visible = true;
      this.player.teammate = null;
      if (this.player2) {
        this.player2.model.root.visible = false;
        this.player2.isDead = true;
        this.player2.teammate = null;
      }
    }

    this.remnantManager.startRecording();
    this.remnantManager.deployActiveRemnants();

    this.input.setPointerLockAllowed(true);
    this.input.requestLock();
    soundManager.init();

    if (this.onStateChange) this.onStateChange('PLAYING');

    // Spawn wave 1 (solo and local coop only; online coop relies on server wave)
    if (this.gameMode !== 'ONLINE_COOP') {
      this.startWave(1);
    }

    if (!this.animFrameId) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public pauseGame() {
    this.state = 'PAUSED';
    this.input.setPointerLockAllowed(false);
    this.input.releaseLock();
    if (this.onStateChange) this.onStateChange('PAUSED');
  }

  public resumeGame() {
    this.state = 'PLAYING';
    this.input.setPointerLockAllowed(true);
    this.input.requestLock();
    if (this.onStateChange) this.onStateChange('PLAYING');
  }

  public triggerPerkSelection() {
    this.state = 'UPGRADE';
    this.input.setPointerLockAllowed(false);
    this.input.releaseLock();

    // Pick 3 random perks from pool not already chosen
    const available = PERK_POOL.filter(p => !this.selectedPerks.some(sp => sp.id === p.id));
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    this.currentUpgradeChoices = shuffled.slice(0, 3);

    if (this.onStateChange) this.onStateChange('UPGRADE');
  }

  public selectPerk(perk: PerkDef) {
    this.selectedPerks.push(perk);
    perk.effect(this.player);
    if (this.gameMode === 'LOCAL_COOP' && this.player2) {
      perk.effect(this.player2);
    }
    this.resumeGame();
  }

  private handlePlayerDeath(playerId: 'P1' | 'P2', cause: string) {
    if (this.gameMode === 'LOCAL_COOP' && this.player2) {
      // In Co-Op, spawn the fallen player's autonomous Chrono-Remnant to fight alongside surviving partner!
      this.remnantManager.finishAndSavePlayerRun(playerId, cause);
      soundManager.playRemnantMaterialize();

      const p1Dead = this.player.isDead;
      const p2Dead = this.player2.isDead;

      if (p1Dead && p2Dead) {
        this.state = 'GAMEOVER';
        this.input.setPointerLockAllowed(false);
        this.input.releaseLock();
        const savedRun = this.remnantManager.finishAndSaveRun('Squad Extinguished in Combat');
        if (this.onGameOver) this.onGameOver(savedRun);
        if (this.onStateChange) this.onStateChange('GAMEOVER');
      }
    } else {
      this.state = 'GAMEOVER';
      this.input.setPointerLockAllowed(false);
      this.input.releaseLock();
      const savedRun = this.remnantManager.finishAndSaveRun(cause);
      if (this.onGameOver) this.onGameOver(savedRun);
      if (this.onStateChange) this.onStateChange('GAMEOVER');
    }
  }

  public startExtractionProtocol() {
    this.isExtracting = true;
    this.extractionTimer = this.extractionDuration;
    this.isInExtractionZone = false;
    this.map.activateExtraction();
    soundManager.playExtractionSiren();

    const count = this.gameMode === 'LOCAL_COOP' ? 18 : 12;
    for (let i = 0; i < count; i++) {
      this.enemyManager.spawnZombie(i % 3 === 0 ? 'RUNNER' : 'SHAMBLER');
    }
  }

  private completeExtraction() {
    this.state = 'VICTORY';
    this.input.setPointerLockAllowed(false);
    this.input.releaseLock();
    this.remnantManager.finishAndSaveRun('Successfully Extracted');

    const stats: GameStats = {
      score: this.remnantManager.currentScore + 5000,
      kills: this.remnantManager.currentKills,
      wave: this.currentWave,
      timeSurvived: Math.floor(this.totalMatchTime),
      damageDealt: Math.floor(this.remnantManager.currentDamage),
      headshots: this.remnantManager.currentShotsHit,
      remnantsActive: this.remnantManager.activeRemnants.length,
      remnantKills: Math.floor(this.remnantManager.currentKills * 0.4),
    };

    if (this.onVictory) this.onVictory(stats);
    if (this.onStateChange) this.onStateChange('VICTORY');
  }

  private startWave(waveNum: number) {
    this.currentWave = waveNum;
    this.isWaveIntermission = false;
    soundManager.playZombieGroan(0.9);

    const isCoop = this.gameMode === 'LOCAL_COOP';

    if (waveNum === 1) {
      const count = isCoop ? 11 : 7;
      for (let i = 0; i < count; i++) this.enemyManager.spawnZombie('SHAMBLER');
    } else if (waveNum === 2) {
      const shamblers = isCoop ? 15 : 10;
      const runners = isCoop ? 5 : 3;
      for (let i = 0; i < shamblers; i++) this.enemyManager.spawnZombie('SHAMBLER');
      for (let i = 0; i < runners; i++) this.enemyManager.spawnZombie('RUNNER');
    } else if (waveNum === 3) {
      const shamblers = isCoop ? 18 : 12;
      const runners = isCoop ? 6 : 4;
      const brutes = isCoop ? 3 : 2;
      for (let i = 0; i < shamblers; i++) this.enemyManager.spawnZombie('SHAMBLER');
      for (let i = 0; i < runners; i++) this.enemyManager.spawnZombie('RUNNER');
      for (let i = 0; i < brutes; i++) this.enemyManager.spawnZombie('BRUTE');
    } else if (waveNum === 4) {
      const shamblers = isCoop ? 15 : 10;
      const spitters = isCoop ? 5 : 3;
      const hunters = isCoop ? 5 : 3;
      for (let i = 0; i < shamblers; i++) this.enemyManager.spawnZombie('SHAMBLER');
      for (let i = 0; i < spitters; i++) this.enemyManager.spawnZombie('SPITTER');
      for (let i = 0; i < hunters; i++) this.enemyManager.spawnZombie('HUNTER');
    } else if (waveNum === 5) {
      // BOSS WAVE: THE RECKONER!
      const boss = this.enemyManager.spawnZombie('BOSS_RECKONER', new THREE.Vector3(0, 0, -25));
      if (isCoop) {
        boss.hp = 3800;
        boss.maxHp = 3800;
      }
      const runners = isCoop ? 9 : 6;
      for (let i = 0; i < runners; i++) this.enemyManager.spawnZombie('RUNNER');
    } else {
      const count = isCoop ? Math.floor((12 + waveNum * 3) * 1.5) : (12 + waveNum * 3);
      for (let i = 0; i < count; i++) {
        const types = ['SHAMBLER', 'RUNNER', 'BRUTE', 'SPITTER', 'HUNTER'] as const;
        this.enemyManager.spawnZombie(types[Math.floor(Math.random() * types.length)]);
      }
    }
  }

  // --- MAIN LOOP ---

  private loop = (now: number) => {
    this.animFrameId = requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.state === 'PLAYING') {
      // Poll gamepad input for P1 and P2
      this.input.updateGamepad(dt);

      this.totalMatchTime += dt;
      const matchTimeMs = this.totalMatchTime * 1000;

      // 1. Update Map & Dynamic Lights
      this.map.update(dt, this.totalMatchTime);

      // 2. Update VFX Particles & Rain
      this.vfx.update(dt, this.player.position);

      // 3. Update Players & Weapon Mechanics
      this.player.update(dt);
      if (this.gameMode === 'LOCAL_COOP' && this.player2) {
        this.player2.update(dt);
      }

      // Telemetry broadcast for ONLINE_COOP
      this.telemetryTimer += dt;
      if (this.telemetryTimer >= 0.04) {
        this.telemetryTimer = 0;
        if (this.gameMode === 'ONLINE_COOP' && this.onLocalPlayerMoved) {
          let animState = 'idle';
          const isMoving = this.player.input.state.forward || this.player.input.state.backward || this.player.input.state.left || this.player.input.state.right;
          if (this.player.isDashing) animState = 'dash';
          else if (isMoving) {
            animState = this.player.input.state.sprint && this.player.stamina > 10 ? 'sprint' : 'run';
          }
          this.onLocalPlayerMoved({
            x: this.player.position.x,
            y: this.player.position.y,
            z: this.player.position.z,
            rotY: this.player.yaw,
            pitch: this.player.pitch,
            isAiming: this.player.input.state.aim,
            isShooting: this.player.input.state.shoot,
            state: this.player.isDead ? 'dead' : this.player.isDowned ? 'downed' : animState,
            health: this.player.hp,
          });
        }
      }

      // 4. Update Remnants Replay & Combat AI
      this.remnantManager.update(dt, matchTimeMs);

      // 5. Update Zombie AI (Targeting alive Players OR Remnants!)
      const targets: CombatPlayerTarget[] = [
        {
          id: 'P1',
          position: this.player.position,
          isDead: this.player.isDead,
          isDowned: this.player.isDowned,
          takeDamage: (dmg: number) => this.player.takeDamage(dmg),
        },
      ];
      if ((this.gameMode === 'LOCAL_COOP' || this.gameMode === 'ONLINE_COOP') && this.player2) {
        targets.push({
          id: 'P2',
          position: this.player2.position,
          isDead: this.player2.isDead,
          isDowned: this.player2.isDowned,
          takeDamage: (dmg: number) => this.player2!.takeDamage(dmg),
        });
      }

      const remnantPositions = this.remnantManager.getRemnantPositions();
      this.enemyManager.update(dt, targets, remnantPositions);

      // 6. Wave Progress & Intermission (Solo and Local Co-op only; Server drives Online Co-op)
      if (this.gameMode !== 'ONLINE_COOP') {
        const aliveZombies = this.enemyManager.zombies.filter(z => !z.isDead).length;
        if (aliveZombies === 0 && !this.isWaveIntermission && !this.isExtracting) {
          this.isWaveIntermission = true;
          this.intermissionTimer = 4.0;
          if (this.onWaveComplete) this.onWaveComplete(this.currentWave);

          if (this.currentWave % 2 === 0) {
            this.triggerPerkSelection();
          }
        }

        if (this.isWaveIntermission) {
          this.intermissionTimer -= dt;
          if (this.intermissionTimer <= 0) {
            this.startWave(this.currentWave + 1);
          }
        }
      }

      // 7. Extraction Protocol Countdown with Zone Validation
      if (this.isExtracting) {
        const inZone1 = !this.player.isDead && this.map.isPlayerInExtractionZone(this.player.position, 6.5);
        const inZone2 = (this.gameMode === 'LOCAL_COOP' || this.gameMode === 'ONLINE_COOP') && this.player2 && !this.player2.isDead && this.map.isPlayerInExtractionZone(this.player2.position, 6.5);
        const anyInZone = inZone1 || inZone2;
        this.isInExtractionZone = !!anyInZone;

        if (anyInZone) {
          const speedMultiplier = (inZone1 && inZone2) ? 1.25 : 1.0;
          this.extractionTimer -= dt * speedMultiplier;
          if (this.extractionTimer <= 0) {
            this.completeExtraction();
          }
        }
      }

      // 8. Push telemetry to UI
      if (this.onStatsUpdate) {
        this.onStatsUpdate({
          score: this.remnantManager.currentScore,
          kills: this.remnantManager.currentKills,
          wave: this.currentWave,
          timeSurvived: Math.floor(this.totalMatchTime),
          damageDealt: Math.floor(this.remnantManager.currentDamage),
          headshots: this.remnantManager.currentShotsHit,
          remnantsActive: this.remnantManager.activeRemnants.length,
          remnantKills: Math.floor(this.remnantManager.currentKills * 0.3),
        });
      }
    }

    // Render 3D Scene (Split-Screen for Local Co-op, Fullscreen for Solo)
    if (this.gameMode === 'LOCAL_COOP' && this.player2) {
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      const halfW = Math.floor(w / 2);

      this.renderer.setScissorTest(true);

      // Player 1 Viewport (Left)
      this.camera.aspect = halfW / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setViewport(0, 0, halfW, h);
      this.renderer.setScissor(0, 0, halfW, h);
      this.renderer.render(this.scene, this.camera);

      // Player 2 Viewport (Right)
      this.camera2.aspect = (w - halfW) / h;
      this.camera2.updateProjectionMatrix();
      this.renderer.setViewport(halfW, 0, w - halfW, h);
      this.renderer.setScissor(halfW, 0, w - halfW, h);
      this.renderer.render(this.scene, this.camera2);

      this.renderer.setScissorTest(false);
    } else {
      this.renderer.setViewport(0, 0, this.canvas.clientWidth || window.innerWidth, this.canvas.clientHeight || window.innerHeight);
      this.renderer.render(this.scene, this.camera);
    }
  };

  public updateRemotePlayer(state: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    pitch: number;
    isAiming: boolean;
    isShooting: boolean;
    state?: string;
    health: number;
  }) {
    if (!this.player2) return;
    this.player2.position.set(state.x, state.y, state.z);
    this.player2.model.root.position.copy(this.player2.position);
    this.player2.model.root.rotation.y = state.rotY;
    this.player2.yaw = state.rotY;
    this.player2.pitch = state.pitch;
    this.player2.hp = state.health;
    this.player2.isDead = state.state === 'dead' || state.health <= 0;
    this.player2.isDowned = state.state === 'downed';
    this.player2.model.root.visible = !this.player2.isDead;
    const animState: any = state.state === 'running' ? 'run' : state.state === 'shooting' ? 'shoot' : 'idle';
    this.player2.model.updateAnimation(0.016, animState, state.pitch, state.isAiming);
  }

  public triggerRemotePlayerShoot(
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    weaponId?: string
  ) {
    if (!this.player2) return;
    const originVec = new THREE.Vector3(origin.x, origin.y, origin.z);
    const dirVec = new THREE.Vector3(dir.x, dir.y, dir.z).normalize();
    this.vfx.spawnMuzzleFlash(originVec, dirVec);
    this.vfx.spawnBulletTracer(originVec, originVec.clone().addScaledVector(dirVec, 45), true);
    soundManager.playRifleShot(true);
  }

  public syncServerZombies(serverZombies: any[]) {
    this.enemyManager.syncServerZombies(serverZombies);
  }

  public handleZombieDamaged(data: {
    zombieId: string;
    damage: number;
    isHeadshot: boolean;
    remainingHealth: number;
    state: string;
    killedBy: string | null;
  }) {
    this.enemyManager.applyRemoteDamage(
      data.zombieId,
      data.damage,
      data.isHeadshot,
      data.killedBy
    );
  }

  public handleWaveStart(waveNum: number) {
    this.currentWave = waveNum;
    this.isWaveIntermission = false;
    soundManager.playZombieGroan(0.9);
    if (this.onWaveComplete) {
      this.onWaveComplete(waveNum);
    }
  }

  public handleCrateOpened(crateIndex: number) {
    this.map.openCrateByIndex(crateIndex);
    soundManager.playReload();
  }

  public handleRemoteBarrelDetonation(barrelIndex: number) {
    this.player.detonateBarrelByIndex(barrelIndex);
  }

  public handleRemoteChronoEcho(data: { x: number; y: number; z: number; characterId?: string }) {
    this.vfx.spawnRemnantMaterializeFX(new THREE.Vector3(data.x, data.y, data.z));
    soundManager.playRemnantMaterialize();
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.input.dispose();
    this.renderer.dispose();
  }
}
