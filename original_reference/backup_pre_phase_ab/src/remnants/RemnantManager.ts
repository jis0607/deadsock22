import * as THREE from 'three';
import { RemnantFrame, RemnantRun, Playstyle, WeaponType } from '../types/game';
import { CharacterModel } from '../player/CharacterModel';
import { soundManager } from '../audio/SoundManager';
import { VFXSystem } from '../effects/VFXSystem';
import { EnemyManager } from '../enemies/EnemyManager';
import { WEAPON_REGISTRY } from '../weapons/WeaponSystem';

const STORAGE_KEY = 'DEAD_RECKONING_REMNANTS_V1';

export class ActiveRemnantInstance {
  public data: RemnantRun;
  public model: CharacterModel;
  public isMaterialized = false;
  public materializeTimer = 0;
  public currentFrameIdx = 0;
  public isFinished = false;
  public lastShotTime = 0;

  constructor(data: RemnantRun, scene: THREE.Scene) {
    this.data = data;
    const colorHex = parseInt(data.color.replace('#', '0x'), 16) || 0x00ffee;
    this.model = new CharacterModel(true, colorHex);
    this.model.root.position.fromArray(data.frames[0]?.pos || [0, 0, 0]);
    this.model.root.visible = false;
    scene.add(this.model.root);
  }
}

export class RemnantManager {
  private scene: THREE.Scene;
  private vfx: VFXSystem;
  private enemyManager!: EnemyManager;

  // Active in-game recording for current run
  private isRecording = false;
  private currentRunFrames: RemnantFrame[] = [];
  private runStartTime = 0;
  private lastSampleTime = 0;

  // Run telemetry counters
  public currentKills = 0;
  public currentScore = 0;
  public currentDamage = 0;
  public currentShotsFired = 0;
  public currentShotsHit = 0;
  public currentDistanceTraveled = 0;
  public lastPlayerPos: THREE.Vector3 | null = null;
  public primaryWeaponUsed: Record<WeaponType, number> = {
    PISTOL: 0,
    RIFLE: 0,
    SHOTGUN: 0,
    SMG: 0,
    LAUNCHER: 0,
  };

  // Replay instances in current match
  public activeRemnants: ActiveRemnantInstance[] = [];

  constructor(scene: THREE.Scene, vfx: VFXSystem) {
    this.scene = scene;
    this.vfx = vfx;
  }

  public setEnemyManager(em: EnemyManager) {
    this.enemyManager = em;
  }

  // --- RECORDING SYSTEM ---

  public startRecording() {
    this.isRecording = true;
    this.currentRunFrames = [];
    this.runStartTime = performance.now();
    this.lastSampleTime = 0;
    this.currentKills = 0;
    this.currentScore = 0;
    this.currentDamage = 0;
    this.currentShotsFired = 0;
    this.currentShotsHit = 0;
    this.currentDistanceTraveled = 0;
    this.lastPlayerPos = null;
    this.primaryWeaponUsed = { PISTOL: 0, RIFLE: 0, SHOTGUN: 0, SMG: 0, LAUNCHER: 0 };
  }

  public recordPlayerSample(
    pos: THREE.Vector3,
    rotY: number,
    pitch: number,
    anim: RemnantFrame['anim'],
    weaponId: WeaponType,
    action: RemnantFrame['action'] = 'none',
    shootTarget?: THREE.Vector3
  ) {
    if (!this.isRecording) return;
    const now = performance.now();
    const elapsed = now - this.runStartTime;

    // Track distance
    if (this.lastPlayerPos) {
      this.currentDistanceTraveled += pos.distanceTo(this.lastPlayerPos);
    }
    this.lastPlayerPos = pos.clone();

    // Sample every 50ms (20fps telemetry replay is butter-smooth with interpolation)
    if (now - this.lastSampleTime >= 50 || action !== 'none') {
      this.lastSampleTime = now;

      this.currentRunFrames.push({
        t: Math.floor(elapsed),
        pos: [Number(pos.x.toFixed(2)), Number(pos.y.toFixed(2)), Number(pos.z.toFixed(2))],
        rotY: Number(rotY.toFixed(3)),
        pitch: Number(pitch.toFixed(3)),
        anim,
        weaponId,
        action,
        shootTarget: shootTarget ? [Number(shootTarget.x.toFixed(2)), Number(shootTarget.y.toFixed(2)), Number(shootTarget.z.toFixed(2))] : undefined,
      });

      if (action === 'shoot') {
        this.primaryWeaponUsed[weaponId] = (this.primaryWeaponUsed[weaponId] || 0) + 1;
      }
    }
  }

  public finishAndSaveRun(causeOfDeath: string): RemnantRun | null {
    if (!this.isRecording || this.currentRunFrames.length < 15) {
      this.isRecording = false;
      return null;
    }
    this.isRecording = false;

    const survivalSeconds = Math.max(1, Math.floor((performance.now() - this.runStartTime) / 1000));

    // Determine primary weapon
    let bestW: WeaponType = 'RIFLE';
    let maxUsage = -1;
    (Object.keys(this.primaryWeaponUsed) as WeaponType[]).forEach((w) => {
      if (this.primaryWeaponUsed[w] > maxUsage) {
        maxUsage = this.primaryWeaponUsed[w];
        bestW = w;
      }
    });

    // Classify Playstyle
    const playstyle = this.classifyPlaystyle(survivalSeconds);
    const color = this.getPlaystyleColor(playstyle);

    const savedRuns = this.getSavedRuns();
    const runNumber = savedRuns.length + 1;

    const run: RemnantRun = {
      id: `remnant-${Date.now()}`,
      runNumber,
      timestamp: Date.now(),
      survivalTime: survivalSeconds,
      kills: this.currentKills,
      score: this.currentScore,
      damageDealt: Math.floor(this.currentDamage),
      shotsFired: this.currentShotsFired,
      shotsHit: this.currentShotsHit,
      distanceTraveled: Math.floor(this.currentDistanceTraveled),
      primaryWeapon: bestW,
      playstyle,
      causeOfDeath,
      frames: this.currentRunFrames,
      color,
      activeInRun: true,
    };

    savedRuns.unshift(run);
    // Keep up to 10 most recent runs in memory
    if (savedRuns.length > 10) savedRuns.pop();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRuns));
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    return run;
  }

  private classifyPlaystyle(survivalSeconds: number): Playstyle {
    const accuracy = this.currentShotsFired > 0 ? this.currentShotsHit / this.currentShotsFired : 0;
    const distancePerSec = this.currentDistanceTraveled / Math.max(1, survivalSeconds);
    const killsPerMin = (this.currentKills / Math.max(1, survivalSeconds)) * 60;

    if (killsPerMin > 35 && accuracy > 0.4) return 'BERSERKER';
    if (accuracy > 0.65) return 'MARKSMAN';
    if (distancePerSec > 4.5) return 'RUNNER';
    if (killsPerMin > 22) return 'AGGRESSIVE';
    if (distancePerSec < 1.8 && survivalSeconds > 45) return 'DEFENDER';
    return 'SCAVENGER';
  }

  private getPlaystyleColor(style: Playstyle): string {
    switch (style) {
      case 'BERSERKER': return '#ff0055'; // Intense Crimson
      case 'MARKSMAN': return '#00e1d9';  // Cyan
      case 'RUNNER': return '#f59e0b';    // Amber Orange
      case 'AGGRESSIVE': return '#e11d48';// Rose
      case 'DEFENDER': return '#3b82f6';  // Cobalt Blue
      case 'SCAVENGER': return '#10b981'; // Emerald
      default: return '#00ffee';
    }
  }

  // --- PERSISTENCE & MEMORY BANK ---

  public getSavedRuns(): RemnantRun[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error reading remnants from storage:', e);
    }
    // Seed default starter vanguard remnant so first-time players can immediately experience the hook
    return this.generateStarterRemnant();
  }

  private generateStarterRemnant(): RemnantRun[] {
    const starterFrames: RemnantFrame[] = [];
    const tMax = 25000; // 25s
    // Creates a patrol loop around gas station and firing shots
    for (let t = 0; t < tMax; t += 50) {
      const angle = (t / tMax) * Math.PI * 4;
      const rx = Math.sin(angle) * 8 - 10;
      const rz = Math.cos(angle) * 6 - 8;
      const isShooting = t % 1200 < 200;
      starterFrames.push({
        t,
        pos: [rx, 0, rz],
        rotY: angle + Math.PI / 2,
        pitch: -0.05,
        anim: isShooting ? 'shoot' : 'run',
        weaponId: 'RIFLE',
        action: isShooting && t % 200 === 0 ? 'shoot' : 'none',
        shootTarget: [rx + Math.sin(angle + Math.PI / 2) * 20, 1.2, rz + Math.cos(angle + Math.PI / 2) * 20],
      });
    }

    const starter: RemnantRun = {
      id: 'remnant-vanguard-00',
      runNumber: 0,
      timestamp: Date.now() - 360000,
      survivalTime: 25,
      kills: 8,
      score: 850,
      damageDealt: 1200,
      shotsFired: 45,
      shotsHit: 32,
      distanceTraveled: 110,
      primaryWeapon: 'RIFLE',
      playstyle: 'DEFENDER',
      causeOfDeath: 'Overrun by Swarm',
      frames: starterFrames,
      color: '#00ffee',
      activeInRun: true,
    };

    return [starter];
  }

  // --- REPLAY SPAWN & EXECUTION ---

  public deployActiveRemnants() {
    this.clearActiveRemnants();
    const saved = this.getSavedRuns();
    // Deploy all active remnants (up to 3 simultaneous)
    saved.filter(r => r.activeInRun !== false).slice(0, 3).forEach(run => {
      const inst = new ActiveRemnantInstance(run, this.scene);
      this.activeRemnants.push(inst);
    });
  }

  public update(dt: number, currentMatchTimeMs: number) {
    for (let i = 0; i < this.activeRemnants.length; i++) {
      const rem = this.activeRemnants[i];
      if (rem.isFinished) continue;

      // 1. Materialization Stage (0 to 1.5s)
      if (!rem.isMaterialized) {
        rem.materializeTimer += dt;
        if (rem.materializeTimer === dt) {
          // Trigger entry FX
          const startPos = new THREE.Vector3().fromArray(rem.data.frames[0].pos);
          this.vfx.spawnRemnantMaterializeFX(startPos, parseInt(rem.data.color.replace('#', '0x'), 16));
          soundManager.playRemnantMaterialize();
        }

        if (rem.materializeTimer >= 1.2) {
          rem.isMaterialized = true;
          rem.model.root.visible = true;
        }
        continue;
      }

      // 2. Playback Timeline Interpolation
      const frames = rem.data.frames;
      // Loop or pause at end
      const runDuration = frames[frames.length - 1].t;
      const replayTime = currentMatchTimeMs % runDuration;

      // Find surrounding frames
      let idx = rem.currentFrameIdx;
      while (idx < frames.length - 1 && frames[idx + 1].t < replayTime) {
        idx++;
      }
      if (idx >= frames.length - 1) {
        idx = 0; // loop replay
      }
      rem.currentFrameIdx = idx;

      const f0 = frames[idx];
      const f1 = frames[Math.min(frames.length - 1, idx + 1)];
      const frameDelta = f1.t - f0.t;
      const alpha = frameDelta > 0 ? (replayTime - f0.t) / frameDelta : 0;

      // Smooth position interpolation
      const p0 = new THREE.Vector3().fromArray(f0.pos);
      const p1 = new THREE.Vector3().fromArray(f1.pos);
      const currentPos = new THREE.Vector3().lerpVectors(p0, p1, alpha);
      rem.model.root.position.copy(currentPos);

      // Smooth rotation
      const rotY = THREE.MathUtils.lerp(f0.rotY, f1.rotY, alpha);
      rem.model.root.rotation.y = rotY;

      // Update weapon model
      if (rem.model.currentWeaponType !== f0.weaponId) {
        rem.model.setWeapon(f0.weaponId);
      }

      // Update character procedural animations
      const isAiming = f0.anim === 'shoot';
      rem.model.updateAnimation(dt, f0.anim === 'shoot' ? 'idle' : f0.anim, f0.pitch, isAiming);

      // Ghost trail FX
      this.vfx.spawnRemnantGhostTrail(currentPos, parseInt(rem.data.color.replace('#', '0x'), 16));

      // 3. Reproduce Recorded Shooting Actions with Real Combat Utility!
      if (f0.action === 'shoot' && currentMatchTimeMs - rem.lastShotTime > 150) {
        rem.lastShotTime = currentMatchTimeMs;
        rem.model.triggerShootRecoil();

        const muzzle = rem.model.getMuzzleWorldPosition();
        let shootDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
        if (f0.shootTarget) {
          const targetV = new THREE.Vector3().fromArray(f0.shootTarget);
          shootDir = targetV.sub(muzzle).normalize();
        }

        const weaponDef = WEAPON_REGISTRY[f0.weaponId] || WEAPON_REGISTRY.RIFLE;
        
        // Muzzle Flash & Sound
        this.vfx.spawnMuzzleFlash(muzzle, shootDir, true);
        if (f0.weaponId === 'PISTOL') soundManager.playPistolShot(true);
        else if (f0.weaponId === 'RIFLE') soundManager.playRifleShot(true);
        else if (f0.weaponId === 'SHOTGUN') soundManager.playShotgunShot(true);
        else soundManager.playSMGShot(true);

        // Raycast against live zombies
        const ray = new THREE.Raycaster(muzzle, shootDir, 0, weaponDef.range);
        const zombieObjects = this.enemyManager.zombies.filter(z => !z.isDead).map(z => z.group);
        const intersects = ray.intersectObjects(zombieObjects, true);

        let hitPoint = muzzle.clone().addScaledVector(shootDir, weaponDef.range);
        if (intersects.length > 0) {
          hitPoint = intersects[0].point;
          // Find matching zombie
          const hitMesh = intersects[0].object;
          for (const z of this.enemyManager.zombies) {
            if (!z.isDead && (z.group === hitMesh || z.group.getObjectById(hitMesh.id))) {
              this.enemyManager.damageZombie(z, weaponDef.damage * 0.75, hitPoint, shootDir, false, 8.0);
              break;
            }
          }
        }

        this.vfx.spawnBulletTracer(muzzle, hitPoint, true);
      }
    }
  }

  public getRemnantPositions(): { pos: THREE.Vector3; id: string }[] {
    return this.activeRemnants
      .filter(r => r.isMaterialized && !r.isFinished)
      .map(r => ({ pos: r.model.root.position, id: r.data.id }));
  }

  public clearActiveRemnants() {
    this.activeRemnants.forEach((rem) => {
      this.scene.remove(rem.model.root);
    });
    this.activeRemnants = [];
  }
}
