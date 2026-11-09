import * as THREE from 'three';
import { CharacterModel } from './CharacterModel';
import { InputManager } from '../core/InputManager';
import { WeaponInventory } from '../weapons/WeaponSystem';
import { VFXSystem } from '../effects/VFXSystem';
import { CityMap } from '../environment/CityMap';
import { EnemyManager } from '../enemies/EnemyManager';
import { RemnantManager } from '../remnants/RemnantManager';
import { soundManager } from '../audio/SoundManager';
import { WeaponType } from '../types/game';

export class PlayerController {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public model: CharacterModel;
  public input: InputManager;
  public weapons: WeaponInventory;
  public vfx: VFXSystem;
  public map: CityMap;
  public enemyManager: EnemyManager;
  public remnantManager: RemnantManager;

  // Transform state
  public position = new THREE.Vector3(0, 0, 0);
  public velocity = new THREE.Vector3();
  public yaw = 0;
  public pitch = 0;

  // Stats
  public hp = 100;
  public maxHp = 100;
  public stamina = 100;
  public maxStamina = 100;
  public isDead = false;

  // Co-Op & Downed Mechanics
  public playerId: 'P1' | 'P2' = 'P1';
  public teammate: PlayerController | null = null;
  public isDowned = false;
  public downedTimer = 30.0;
  public isBeingRevived = false;
  public reviveProgress = 0;
  public isRevivingTeammate = false;

  public get inputState() {
    return this.playerId === 'P2' ? this.input.stateP2 : this.input.stateP1;
  }

  // Dash & Mobility
  public isDashing = false;
  public dashTimer = 0;
  public dashCooldown = 0;
  public dashDirection = new THREE.Vector3();

  // Camera Shake & Recoil
  private cameraRecoilPitch = 0;
  private cameraRecoilYaw = 0;
  private cameraShake = 0;

  // Melee Quick Strike
  public meleeTimer = 0;
  public meleeCooldown = 0.65;

  // Interaction prompt
  public currentInteractPrompt: string | null = null;
  public onInteractAction?: () => void;
  public onPlayerDied?: (cause: string) => void;
  public onHitEnemy?: (isHeadshot: boolean, score: number, isMelee?: boolean) => void;
  public onDamagePopup?: (worldPos: THREE.Vector3, amount: number, isHeadshot: boolean, isMelee?: boolean) => void;
  public onPerkReward?: () => void;

  // Temporary vectors for math
  private forward = new THREE.Vector3();
  private right = new THREE.Vector3();
  private moveDir = new THREE.Vector3();
  private camOffset = new THREE.Vector3(0.7, 1.7, -2.8);
  private currentCamPos = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    input: InputManager,
    vfx: VFXSystem,
    map: CityMap,
    enemyManager: EnemyManager,
    remnantManager: RemnantManager,
    playerId: 'P1' | 'P2' = 'P1'
  ) {
    this.scene = scene;
    this.camera = camera;
    this.input = input;
    this.vfx = vfx;
    this.map = map;
    this.enemyManager = enemyManager;
    this.remnantManager = remnantManager;
    this.playerId = playerId;

    this.model = new CharacterModel(false, 0x00ffee, this.playerId);
    this.scene.add(this.model.root);

    this.weapons = new WeaponInventory();
    this.resetPlayer();
  }

  public resetPlayer(spawnPos?: THREE.Vector3) {
    const defaultPos = this.playerId === 'P2' ? new THREE.Vector3(1.8, 0, 8) : new THREE.Vector3(-1.8, 0, 8);
    this.position.copy(spawnPos || defaultPos);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.isDead = false;
    this.isDowned = false;
    this.downedTimer = 30.0;
    this.isBeingRevived = false;
    this.reviveProgress = 0;
    this.isRevivingTeammate = false;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.model.root.position.copy(this.position);
    this.model.root.rotation.set(0, 0, 0);
    this.weapons.refillAllAmmo();
  }

  public update(dt: number) {
    if (this.isDead) {
      this.model.updateAnimation(dt, 'death', 0, false);
      this.updateDeathCamera(dt);
      return;
    }

    // Downed state handling in Co-Op
    if (this.isDowned) {
      if (!this.isBeingRevived) {
        this.downedTimer -= dt;
        if (this.downedTimer <= 0) {
          this.isDead = true;
          this.isDowned = false;
          if (this.onPlayerDied) this.onPlayerDied('Bled out in combat');
          return;
        }
      }
      this.isBeingRevived = false; // Reset per-frame

      const { dx, dy } = this.input.consumeDeltas(this.playerId);
      this.yaw -= dx * 0.5;
      this.pitch = Math.max(-0.6, Math.min(0.6, this.pitch - dy * 0.5));

      this.updateCrawlMovement(dt);
      this.updateCamera(dt);
      this.model.updateAnimation(dt, 'downed', this.pitch, false);

      this.remnantManager.recordPlayerSample(
        this.playerId,
        this.position,
        this.yaw,
        this.pitch,
        'idle',
        this.weapons.activeWeapon
      );
      return;
    }

    // 1. Look Updates (isolated per player)
    const { dx, dy } = this.input.consumeDeltas(this.playerId);
    this.yaw -= dx;
    this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - dy));

    // 2. Weapon Slot Inputs
    if (this.inputState.slot1) this.switchWeapon('PISTOL');
    if (this.inputState.slot2) this.switchWeapon('RIFLE');
    if (this.inputState.slot3) this.switchWeapon('SHOTGUN');
    if (this.inputState.slot4) this.switchWeapon('SMG');
    if (this.inputState.slot5) this.switchWeapon('LAUNCHER');

    if (this.inputState.switchNext) {
      this.cycleWeapon(1);
      this.inputState.switchNext = false;
    } else if (this.inputState.switchPrev) {
      this.cycleWeapon(-1);
      this.inputState.switchPrev = false;
    }

    if (this.inputState.reload) {
      this.weapons.startReload();
      this.model.triggerReload();
      this.inputState.reload = false;
    }

    this.weapons.update(dt);

    // 3. Movement Physics & Dash
    this.updateMovement(dt);

    // 4. Combat / Shooting Raycast & Melee
    this.updateMelee(dt);
    this.updateShooting(dt);

    // 5. Interaction Check (Teammate Revive, Supply crates & Extraction beacon)
    this.checkInteractions();

    // 6. Camera Position Follow & Recoil Decay
    this.updateCamera(dt);

    // 7. Telemetry recording for Remnant AI!
    let animState: 'idle' | 'walk' | 'run' | 'sprint' | 'dash' = 'idle';
    if (this.isDashing) animState = 'dash';
    else if (this.moveDir.lengthSq() > 0.01) {
      animState = this.inputState.sprint && this.stamina > 10 ? 'sprint' : 'run';
    }

    this.model.updateAnimation(dt, animState, this.pitch, this.inputState.aim);

    this.remnantManager.recordPlayerSample(
      this.playerId,
      this.position,
      this.yaw,
      this.pitch,
      animState,
      this.weapons.activeWeapon
    );
  }

  private switchWeapon(type: WeaponType) {
    if (this.weapons.switchWeapon(type)) {
      this.model.setWeapon(type);
      soundManager.playReload();
    }
  }

  private cycleWeapon(dir: number) {
    const list = this.weapons.unlockedWeapons;
    const currentIdx = list.indexOf(this.weapons.activeWeapon);
    const nextIdx = (currentIdx + dir + list.length) % list.length;
    this.switchWeapon(list[nextIdx]);
  }

  private updateMovement(dt: number) {
    // Cooldown timers
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    // Stamina recovery
    if (!this.inputState.sprint && !this.isDashing) {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 25);
    }

    // Direction vectors derived from Camera Yaw
    this.forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    this.moveDir.set(0, 0, 0);
    if (this.inputState.hasAnalogMove) {
      // Smooth 360-degree analog control from virtual joystick or gamepad
      this.moveDir.addScaledVector(this.forward, this.inputState.moveY);
      this.moveDir.addScaledVector(this.right, this.inputState.moveX);
    } else {
      if (this.inputState.forward) this.moveDir.add(this.forward);
      if (this.inputState.backward) this.moveDir.sub(this.forward);
      if (this.inputState.right) this.moveDir.add(this.right);
      if (this.inputState.left) this.moveDir.sub(this.right);
    }

    // Dash initiation
    if (this.inputState.dash && this.dashCooldown <= 0 && this.stamina >= 25 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = 0.28;
      this.dashCooldown = 0.85;
      this.stamina -= 25;
      this.dashDirection.copy(this.moveDir.lengthSq() > 0.01 ? this.moveDir.normalize() : this.forward);
      soundManager.playDash();
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.velocity.copy(this.dashDirection).multiplyScalar(15.0);
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else {
      let speed = 4.2; // Base walk
      if (this.inputState.sprint && this.stamina > 5 && this.moveDir.lengthSq() > 0.01) {
        speed = 7.5;
        this.stamina -= dt * 18;
      } else if (this.inputState.aim) {
        speed = 2.4; // Aim down sights walk
      }

      if (this.moveDir.lengthSq() > 0.01) {
        this.moveDir.normalize();
        this.velocity.copy(this.moveDir).multiplyScalar(speed);
      } else {
        this.velocity.set(0, 0, 0);
      }
    }

    // Apply movement & Environment Collision
    const nextPos = this.position.clone().addScaledVector(this.velocity, dt);

    const collision = this.map.checkCollision(nextPos, 0.55);
    if (collision.hit) {
      nextPos.add(collision.pushOut);
    }

    this.position.copy(nextPos);
    this.model.root.position.copy(this.position);

    // Player faces aim yaw
    this.model.root.rotation.y = this.yaw;
  }

  private updateCrawlMovement(dt: number) {
    this.forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    this.moveDir.set(0, 0, 0);
    if (this.inputState.hasAnalogMove) {
      this.moveDir.addScaledVector(this.forward, this.inputState.moveY);
      this.moveDir.addScaledVector(this.right, this.inputState.moveX);
    } else {
      if (this.inputState.forward) this.moveDir.add(this.forward);
      if (this.inputState.backward) this.moveDir.sub(this.forward);
      if (this.inputState.right) this.moveDir.add(this.right);
      if (this.inputState.left) this.moveDir.sub(this.right);
    }

    if (this.moveDir.lengthSq() > 0.01) {
      this.moveDir.normalize();
      this.velocity.copy(this.moveDir).multiplyScalar(1.2); // Slow crawling pace
    } else {
      this.velocity.set(0, 0, 0);
    }

    const nextPos = this.position.clone().addScaledVector(this.velocity, dt);
    const collision = this.map.checkCollision(nextPos, 0.55);
    if (collision.hit) {
      nextPos.add(collision.pushOut);
    }

    this.position.copy(nextPos);
    this.model.root.position.copy(this.position);
    this.model.root.rotation.y = this.yaw;
  }

  private updateMelee(dt: number) {
    if (this.meleeTimer > 0) {
      this.meleeTimer -= dt;
    }

    if (this.inputState.melee && this.meleeTimer <= 0 && !this.isDead && !this.isDowned) {
      this.meleeTimer = this.meleeCooldown;
      this.model.triggerMelee();
      soundManager.playMeleeKick();
      this.cameraShake = Math.min(0.35, this.cameraShake + 0.14);

      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
      let hitAny = false;

      for (const z of this.enemyManager.zombies) {
        if (z.isDead) continue;
        const toZ = z.position.clone().sub(this.position);
        toZ.y = 0;
        const dist = toZ.length();

        if (dist <= 2.8) {
          const dot = toZ.clone().normalize().dot(fwd);
          if (dot > 0.3) {
            hitAny = true;
            const meleeDamage = 90 * this.weapons.damageMultiplier;
            const hitPos = z.position.clone().add(new THREE.Vector3(0, 1.2, 0));
            this.vfx.spawnMeleeImpact(hitPos, fwd);

            const res = this.enemyManager.damageZombie(z, meleeDamage, hitPos, fwd, false, 18.0);
            if (this.onDamagePopup) {
              this.onDamagePopup(hitPos, res.damageDealt, false, true);
            }

            if (res.killed) {
              this.remnantManager.currentKills++;
              this.remnantManager.currentScore += res.score;
              if (this.onHitEnemy) this.onHitEnemy(false, res.score, true);
            }
          }
        }
      }
    }
  }

  private updateShooting(dt: number) {
    if (this.isDowned) return; // Cannot shoot while downed
    const now = performance.now() / 1000;
    const isShooting = this.inputState.shoot;

    if (isShooting && this.weapons.canShoot(now)) {
      this.weapons.consumeShot(now);
      this.model.triggerShootRecoil();

      const activeState = this.weapons.getActiveState();
      const def = activeState.def;

      // Punchy recoil kick
      this.cameraRecoilPitch += def.recoilKick * (this.inputState.aim ? 0.65 : 1.15);
      this.cameraRecoilYaw += (Math.random() - 0.5) * def.recoilKick * 0.6;
      this.cameraShake = Math.min(0.3, this.cameraShake + def.recoilKick * 0.9);

      // Gun SFX
      if (def.id === 'PISTOL') soundManager.playPistolShot();
      else if (def.id === 'RIFLE') soundManager.playRifleShot();
      else if (def.id === 'SHOTGUN') soundManager.playShotgunShot();
      else if (def.id === 'SMG') soundManager.playSMGShot();
      else if (def.id === 'LAUNCHER') soundManager.playLauncherShot();

      // Muzzle flash at gun barrel
      const muzzlePos = this.model.getMuzzleWorldPosition();
      const aimDir = this.getAimDirection();
      this.vfx.spawnMuzzleFlash(muzzlePos, aimDir);
      this.vfx.spawnMuzzleLight(muzzlePos, def.id === 'LAUNCHER' ? 0x9333ea : 0xffaa33);

      // Brass shell casing physics ejection
      const rightDir = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
      this.vfx.spawnBulletShell(muzzlePos, rightDir);
      soundManager.playBulletShell();

      // Record shot event for Remnant replay!
      const targetPoint = this.position.clone().addScaledVector(aimDir, def.range);
      this.remnantManager.recordPlayerSample(
        this.position,
        this.yaw,
        this.pitch,
        'shoot',
        this.weapons.activeWeapon,
        'shoot',
        targetPoint
      );

      this.remnantManager.currentShotsFired += def.pellets;

      // Knockback force calculation
      let knockbackForce = 7.0;
      if (def.id === 'SHOTGUN') knockbackForce = 16.0;
      else if (def.id === 'RIFLE') knockbackForce = 9.5;
      else if (def.id === 'SMG') knockbackForce = 6.0;
      else if (def.id === 'LAUNCHER') knockbackForce = 22.0;

      // Fire Pellets / Bullets
      for (let p = 0; p < def.pellets; p++) {
        // Apply Spread bloom
        const spreadAmt = this.input.state.aim ? def.spread * 0.4 : def.spread;
        const spreadDir = aimDir.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * spreadAmt * 2,
            (Math.random() - 0.5) * spreadAmt * 2,
            (Math.random() - 0.5) * spreadAmt * 2
          )
        ).normalize();

        // Raycast
        this.performBulletRaycast(muzzlePos, spreadDir, def.damage, def.range, def.id === 'LAUNCHER', knockbackForce);
      }
    }
  }

  private getAimDirection(): THREE.Vector3 {
    // Derive aim vector from camera yaw and pitch
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    return dir.normalize();
  }

  private performBulletRaycast(
    start: THREE.Vector3,
    dir: THREE.Vector3,
    dmg: number,
    range: number,
    isExplosive: boolean,
    knockbackForce = 7.0
  ) {
    const ray = new THREE.Raycaster(start, dir, 0, range);

    // Targets: Live Zombies, Explosive Barrels, Map Colliders
    const targetMeshes: THREE.Object3D[] = [];
    this.enemyManager.zombies.filter(z => !z.isDead).forEach(z => targetMeshes.push(z.group));
    this.map.explosiveBarrels.filter(b => !b.exploded).forEach(b => targetMeshes.push(b.mesh));
    this.map.colliders.forEach(c => {
      if (c.objectRef) targetMeshes.push(c.objectRef);
    });

    const intersects = ray.intersectObjects(targetMeshes, true);
    let hitPoint = start.clone().addScaledVector(dir, range);

    if (intersects.length > 0) {
      const hit = intersects[0];
      hitPoint = hit.point;

      // 1. Check Zombie Hit
      let hitZombie = false;
      for (const z of this.enemyManager.zombies) {
        if (!z.isDead && (z.group === hit.object || z.group.getObjectById(hit.object.id))) {
          hitZombie = true;
          this.remnantManager.currentShotsHit++;
          const isHeadshot = hit.point.y - z.position.y > 1.25 * (z.type === 'BRUTE' ? 1.5 : 1.0);

          const finalDmg = dmg * this.weapons.damageMultiplier;
          this.remnantManager.currentDamage += finalDmg;

          const res = this.enemyManager.damageZombie(z, finalDmg, hit.point, dir, isHeadshot, knockbackForce);

          if (this.onDamagePopup) {
            this.onDamagePopup(hit.point, res.damageDealt, isHeadshot, false);
          }

          if (res.killed) {
            this.remnantManager.currentKills++;
            this.remnantManager.currentScore += res.score;
            if (this.onHitEnemy) this.onHitEnemy(isHeadshot, res.score);
          }
          break;
        }
      }

      // 2. Check Explosive Barrel Hit
      for (const barrel of this.map.explosiveBarrels) {
        if (!barrel.exploded && (barrel.mesh === hit.object || barrel.mesh.getObjectById(hit.object.id))) {
          barrel.hp -= dmg;
          if (barrel.hp <= 0) {
            this.detonateBarrel(barrel);
          }
          break;
        }
      }

      // 3. Environmental Impact Sparks on walls/cars + ricochet
      if (!hitZombie) {
        this.vfx.spawnImpactSparks(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0));
        if (Math.random() < 0.25) {
          soundManager.playRicochet();
        }
      }

      // 4. Special Launcher Explosive Blast
      if (isExplosive) {
        this.triggerExplosiveBlast(hit.point, 5.5, dmg);
      }
    }

    this.vfx.spawnBulletTracer(start, hitPoint, false, isExplosive ? 0x8b5cf6 : 0xffe688);
  }

  private detonateBarrel(barrel: CityMap['explosiveBarrels'][0]) {
    barrel.exploded = true;
    barrel.mesh.visible = false;
    this.map.removeCollider(barrel.mesh);
    this.triggerExplosiveBlast(barrel.pos, 7.0, 320);
  }

  private triggerExplosiveBlast(pos: THREE.Vector3, radius: number, maxDmg: number) {
    this.vfx.spawnExplosion(pos, radius);
    soundManager.playExplosion();

    // Damage all zombies within radius
    this.enemyManager.zombies.forEach((z) => {
      if (!z.isDead) {
        const dist = z.position.distanceTo(pos);
        if (dist <= radius) {
          const falloff = 1 - dist / radius;
          const dmg = maxDmg * falloff;
          const blastDir = z.position.clone().sub(pos).normalize();
          const hitPos = z.position.clone().add(new THREE.Vector3(0, 1, 0));
          const res = this.enemyManager.damageZombie(z, dmg, hitPos, blastDir, false, 25.0);
          if (this.onDamagePopup) {
            this.onDamagePopup(hitPos, res.damageDealt, false, false);
          }
          if (res.killed) {
            this.remnantManager.currentKills++;
            this.remnantManager.currentScore += res.score;
          }
        }
      }
    });

    // Damage player if caught in blast
    const pDist = this.position.distanceTo(pos);
    if (pDist <= radius) {
      const pDmg = maxDmg * 0.45 * (1 - pDist / radius);
      this.takeDamage(pDmg, 'Explosive Shockwave');
    }
  }

  private checkInteractions() {
    this.currentInteractPrompt = null;
    this.onInteractAction = undefined;
    this.isRevivingTeammate = false;

    // Check teammate revive in Co-Op
    if (this.teammate && this.teammate.isDowned && !this.isDowned && !this.isDead) {
      const d = this.position.distanceTo(this.teammate.position);
      if (d < 3.0) {
        const remaining = Math.max(0, Math.ceil(this.teammate.downedTimer));
        const pct = Math.floor(this.teammate.reviveProgress * 100);
        this.currentInteractPrompt = `HOLD [E / X] TO REVIVE ${this.teammate.playerId} (${remaining}s) [${pct}%]`;

        if (this.inputState.interact) {
          this.isRevivingTeammate = true;
          this.teammate.isBeingRevived = true;
          // Progress revive over 2.4 seconds
          this.teammate.reviveProgress += 0.016 / 2.4;
          this.vfx.spawnSparks(this.teammate.position, new THREE.Vector3(0, 1, 0), 0x00ff88);

          if (this.teammate.reviveProgress >= 1.0) {
            this.teammate.revive();
            this.currentInteractPrompt = null;
          }
          return;
        }
      }
    }

    // Check supply crates
    for (const crate of this.map.supplyCrates) {
      if (!crate.opened && this.position.distanceTo(crate.position) < 2.5) {
        const label = crate.type === 'AMMO' ? 'AMMO CRATE' : crate.type === 'HEALTH' ? 'MEDICAL SUPPLY' : 'UPGRADE PROTOCOL';
        this.currentInteractPrompt = `[E / X] OPEN ${label}`;
        this.onInteractAction = () => {
          crate.opened = true;
          crate.mesh.visible = false;
          if (crate.colliderRef) {
            this.map.removeCollider(crate.colliderRef);
          }
          soundManager.playReload();
          if (crate.type === 'AMMO') {
            this.weapons.refillAllAmmo();
          } else if (crate.type === 'HEALTH') {
            this.hp = Math.min(this.maxHp, this.hp + 50);
          } else if (crate.type === 'PERK') {
            if (this.onPerkReward) this.onPerkReward();
          }
        };
        break;
      }
    }

    // Check extraction beacon
    if (this.map.extractionBeacon.active) {
      const inZone = this.map.isPlayerInExtractionZone(this.position, 6.5);
      if (inZone) {
        this.currentInteractPrompt = 'HELIPAD SECURE // HOLD POSITION';
      } else {
        const d = Math.round(this.position.distanceTo(this.map.extractionBeacon.pos));
        this.currentInteractPrompt = `RETURN TO HELIPAD (${d}m)`;
      }
    }

    // Trigger interact key
    if (this.inputState.interact && this.onInteractAction) {
      this.inputState.interact = false;
      this.onInteractAction();
    }
  }

  public takeDamage(amount: number, cause = 'Zombie Swarm') {
    if (this.isDead || this.isDashing) return; // i-frames during roll

    if (this.isDowned) {
      // While downed, damage accelerates bleedout
      this.downedTimer -= amount * 0.15;
      this.vfx.spawnBloodSplatter(this.position);
      if (this.downedTimer <= 0) {
        this.isDead = true;
        this.isDowned = false;
        if (this.onPlayerDied) this.onPlayerDied(cause);
      }
      return;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.cameraShake = Math.min(0.4, this.cameraShake + 0.2);
    soundManager.playPlayerHurt();

    if (this.hp <= 0) {
      this.hp = 0;
      // In Co-Op, if teammate is alive and not dead, enter downed state!
      if (this.teammate && !this.teammate.isDead) {
        this.enterDownedState();
      } else {
        this.isDead = true;
        if (this.onPlayerDied) this.onPlayerDied(cause);
      }
    }
  }

  public enterDownedState() {
    this.isDowned = true;
    this.hp = 0;
    this.downedTimer = 30.0;
    this.reviveProgress = 0;
    this.isDashing = false;
    soundManager.playZombieGroan(1.2);
  }

  public revive() {
    this.isDowned = false;
    this.hp = 45;
    this.downedTimer = 30.0;
    this.reviveProgress = 0;
    this.vfx.spawnBloodSplatter(this.position);
    soundManager.playLevelUp();
  }

  private updateCamera(dt: number) {
    // Camera shake decay
    this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
    this.cameraRecoilPitch = Math.max(0, this.cameraRecoilPitch - dt * 3.5);
    this.cameraRecoilYaw = THREE.MathUtils.lerp(this.cameraRecoilYaw, 0, dt * 8);

    const effectivePitch = this.pitch + this.cameraRecoilPitch;
    const effectiveYaw = this.yaw + this.cameraRecoilYaw;

    // Determine target offset (ADS vs Normal vs Sprint)
    const isAiming = this.input.state.aim;
    const isSprinting = this.input.state.sprint && this.moveDir.lengthSq() > 0.01;

    const targetOffset = isAiming
      ? new THREE.Vector3(0.42, 1.62, -1.6)
      : isSprinting
      ? new THREE.Vector3(0.8, 1.7, -3.2)
      : new THREE.Vector3(0.65, 1.7, -2.6);

    this.camOffset.lerp(targetOffset, dt * 9);

    // Calculate ideal world position for camera
    const backVec = new THREE.Vector3(
      -Math.sin(effectiveYaw) * Math.cos(effectivePitch),
      -Math.sin(effectivePitch),
      -Math.cos(effectiveYaw) * Math.cos(effectivePitch)
    );
    const rightVec = new THREE.Vector3(Math.cos(effectiveYaw), 0, -Math.sin(effectiveYaw));

    const headPos = this.position.clone().add(new THREE.Vector3(0, this.camOffset.y, 0));
    const idealCamPos = headPos.clone()
      .addScaledVector(rightVec, this.camOffset.x)
      .addScaledVector(backVec, -this.camOffset.z);

    // Add camera shake jitter
    if (this.cameraShake > 0) {
      idealCamPos.add(new THREE.Vector3(
        (Math.random() - 0.5) * this.cameraShake,
        (Math.random() - 0.5) * this.cameraShake,
        (Math.random() - 0.5) * this.cameraShake
      ));
    }

    // Camera Collision Avoidance with Walls/Ceilings
    const camRay = new THREE.Raycaster(headPos, idealCamPos.clone().sub(headPos).normalize(), 0, idealCamPos.distanceTo(headPos));
    const wallMeshes = this.map.colliders.filter(c => c.objectRef).map(c => c.objectRef!);
    const hits = camRay.intersectObjects(wallMeshes, true);
    if (hits.length > 0) {
      idealCamPos.copy(hits[0].point).addScaledVector(camRay.ray.direction, -0.2);
    }

    this.camera.position.lerp(idealCamPos, dt * 25);

    // Camera looks at forward crosshair point
    const lookTarget = headPos.clone()
      .addScaledVector(rightVec, this.camOffset.x * 0.5)
      .addScaledVector(backVec.negate(), 20.0);
    this.camera.lookAt(lookTarget);

    // FOV Zoom for ADS
    const targetFov = isAiming ? 48 : isSprinting ? 72 : 62;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 10);
    this.camera.updateProjectionMatrix();
  }

  private updateDeathCamera(dt: number) {
    const deathCamPos = this.position.clone().add(new THREE.Vector3(0, 3.5, -4.5));
    this.camera.position.lerp(deathCamPos, dt * 2);
    this.camera.lookAt(this.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
  }
}
