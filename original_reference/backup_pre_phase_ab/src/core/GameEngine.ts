import * as THREE from 'three';
import { InputManager } from './InputManager';
import { VFXSystem } from '../effects/VFXSystem';
import { CityMap } from '../environment/CityMap';
import { EnemyManager } from '../enemies/EnemyManager';
import { RemnantManager } from '../remnants/RemnantManager';
import { PlayerController } from '../player/PlayerController';
import { soundManager } from '../audio/SoundManager';
import { GameStats, RemnantRun, PerkDef } from '../types/game';
import { PERK_POOL } from '../types/perks';

export type EngineState = 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADE' | 'GAMEOVER' | 'VICTORY';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;

  // Subsystems
  public input!: InputManager;
  public vfx!: VFXSystem;
  public map!: CityMap;
  public enemyManager!: EnemyManager;
  public remnantManager!: RemnantManager;
  public player!: PlayerController;

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

    this.vfx = new VFXSystem(this.scene);
    this.map = new CityMap(this.scene);
    // Set default day mode for vibrant, realistic daylight
    this.map.setLightingMode(this.lightingMode);

    this.enemyManager = new EnemyManager(this.scene, this.vfx, this.map);
    this.remnantManager = new RemnantManager(this.scene, this.vfx);
    this.remnantManager.setEnemyManager(this.enemyManager);

    this.player = new PlayerController(
      this.scene,
      this.camera,
      this.input,
      this.vfx,
      this.map,
      this.enemyManager,
      this.remnantManager
    );

    // Bind Player events
    this.player.onPlayerDied = (cause) => {
      this.handlePlayerDeath(cause);
    };

    this.player.onPerkReward = () => {
      this.triggerPerkSelection();
    };

    this.player.onDamagePopup = (worldPos, amount, isHeadshot, isMelee) => {
      if (!this.camera) return;
      const v = worldPos.clone().project(this.camera);
      // Check if in front of camera
      if (v.z < 1.0) {
        const x = (v.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(v.y * 0.5) + 0.5) * window.innerHeight;
        if (this.onDamagePopup) {
          this.onDamagePopup({ x, y }, amount, isHeadshot, isMelee);
        }
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
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // --- GAMEPLAY LIFECYCLE ---

  public startNewRun() {
    this.state = 'PLAYING';
    this.currentWave = 1;
    this.waveTimer = 0;
    this.isWaveIntermission = false;
    this.intermissionTimer = 0;
    this.totalMatchTime = 0;
    this.isExtracting = false;
    this.extractionTimer = 0;
    this.selectedPerks = [];

    // Reset systems
    this.enemyManager.clearAll();
    this.map.deactivateExtraction();
    this.player.resetPlayer(new THREE.Vector3(0, 0, 8));
    this.remnantManager.startRecording();
    this.remnantManager.deployActiveRemnants();

    this.input.requestLock();
    soundManager.init();

    if (this.onStateChange) this.onStateChange('PLAYING');

    // Spawn initial wave 1 zombies
    this.startWave(1);

    if (!this.animFrameId) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  public pauseGame() {
    this.state = 'PAUSED';
    this.input.releaseLock();
    if (this.onStateChange) this.onStateChange('PAUSED');
  }

  public resumeGame() {
    this.state = 'PLAYING';
    this.input.requestLock();
    if (this.onStateChange) this.onStateChange('PLAYING');
  }

  public triggerPerkSelection() {
    this.state = 'UPGRADE';
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
    this.resumeGame();
  }

  private handlePlayerDeath(cause: string) {
    this.state = 'GAMEOVER';
    this.input.releaseLock();

    // Save run into Memory Bank
    const savedRun = this.remnantManager.finishAndSaveRun(cause);

    if (this.onGameOver) this.onGameOver(savedRun);
    if (this.onStateChange) this.onStateChange('GAMEOVER');
  }

  public startExtractionProtocol() {
    this.isExtracting = true;
    this.extractionTimer = this.extractionDuration;
    this.map.activateExtraction();
    soundManager.playExtractionSiren();

    // Spawn massive final extraction wave!
    for (let i = 0; i < 12; i++) {
      this.enemyManager.spawnZombie(i % 3 === 0 ? 'RUNNER' : 'SHAMBLER');
    }
  }

  private completeExtraction() {
    this.state = 'VICTORY';
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

    if (waveNum === 1) {
      // 7 basic Shamblers
      for (let i = 0; i < 7; i++) {
        this.enemyManager.spawnZombie('SHAMBLER');
      }
    } else if (waveNum === 2) {
      // 10 Shamblers + 3 Fast Runners
      for (let i = 0; i < 10; i++) this.enemyManager.spawnZombie('SHAMBLER');
      for (let i = 0; i < 3; i++) this.enemyManager.spawnZombie('RUNNER');
    } else if (waveNum === 3) {
      // Mixed swarm + 2 Brutes
      for (let i = 0; i < 12; i++) this.enemyManager.spawnZombie('SHAMBLER');
      for (let i = 0; i < 4; i++) this.enemyManager.spawnZombie('RUNNER');
      for (let i = 0; i < 2; i++) this.enemyManager.spawnZombie('BRUTE');
    } else if (waveNum === 4) {
      // 3 Spitters + 3 Hunters + 10 Shamblers
      for (let i = 0; i < 10; i++) this.enemyManager.spawnZombie('SHAMBLER');
      for (let i = 0; i < 3; i++) this.enemyManager.spawnZombie('SPITTER');
      for (let i = 0; i < 3; i++) this.enemyManager.spawnZombie('HUNTER');
    } else if (waveNum === 5) {
      // BOSS WAVE: THE RECKONER!
      this.enemyManager.spawnZombie('BOSS_RECKONER', new THREE.Vector3(0, 0, -25));
      for (let i = 0; i < 6; i++) this.enemyManager.spawnZombie('RUNNER');
    } else {
      // Escalating endless / extraction waves
      const count = 12 + waveNum * 3;
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
      this.totalMatchTime += dt;
      const matchTimeMs = this.totalMatchTime * 1000;

      // 1. Update Map & Dynamic Lights
      this.map.update(dt, this.totalMatchTime);

      // 2. Update VFX Particles & Rain
      this.vfx.update(dt, this.player.position);

      // 3. Update Player & Weapon Mechanics
      this.player.update(dt);

      // 4. Update Remnants Replay & Combat AI
      this.remnantManager.update(dt, matchTimeMs);

      // 5. Update Zombie AI (Targeting Player OR Remnants!)
      const remnantPositions = this.remnantManager.getRemnantPositions();
      this.enemyManager.update(dt, this.player.position, remnantPositions, (dmg) => {
        this.player.takeDamage(dmg);
      });

      // 6. Wave Progress & Intermission
      const aliveZombies = this.enemyManager.zombies.filter(z => !z.isDead).length;
      if (aliveZombies === 0 && !this.isWaveIntermission && !this.isExtracting) {
        this.isWaveIntermission = true;
        this.intermissionTimer = 4.0; // 4s breather between waves
        if (this.onWaveComplete) this.onWaveComplete(this.currentWave);

        // Every 2 waves trigger a perk upgrade choice!
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

      // 7. Extraction Protocol Countdown
      if (this.isExtracting) {
        this.extractionTimer -= dt;
        if (this.extractionTimer <= 0) {
          this.completeExtraction();
        }

        // Check if player is standing in Helipad zone
        const distToHelipad = this.player.position.distanceTo(this.map.extractionBeacon.pos);
        if (distToHelipad > 6.0) {
          // Warning player to stay in zone
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

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.input.dispose();
    this.renderer.dispose();
  }
}
