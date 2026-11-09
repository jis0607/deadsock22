import * as THREE from 'three';
import { ZombieType } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import { VFXSystem } from '../effects/VFXSystem';
import { CityMap } from '../environment/CityMap';

export interface ZombieInstance {
  id: number;
  type: ZombieType;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  staggerTimer: number;
  flinchTimer: number;
  animTimer: number;
  isDead: boolean;
  deathTimer: number;
  isHeadshotKilled: boolean;
  scoreValue: number;

  // Joints for procedural animation
  torsoMesh: THREE.Mesh;
  headMesh: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;

  // Material for hit flash
  skinMat: THREE.MeshStandardMaterial;

  // Target ref (Player or Remnant position)
  currentTargetPos: THREE.Vector3;
  targetIsRemnant: boolean;
}

export class EnemyManager {
  private scene: THREE.Scene;
  private vfx: VFXSystem;
  private map: CityMap;
  public zombies: ZombieInstance[] = [];
  private nextId = 1;

  // Projectiles (for Spitters and Boss)
  public acidProjectiles: { pos: THREE.Vector3; vel: THREE.Vector3; life: number; mesh: THREE.Mesh; damage: number }[] = [];

  // Spawning pools
  private spawnLocations: THREE.Vector3[] = [
    new THREE.Vector3(-35, 0, -35),
    new THREE.Vector3(35, 0, -35),
    new THREE.Vector3(-35, 0, 35),
    new THREE.Vector3(35, 0, 35),
    new THREE.Vector3(-38, 0, 0),
    new THREE.Vector3(38, 0, 0),
    new THREE.Vector3(0, 0, -40),
    new THREE.Vector3(0, 0, 40),
  ];

  // Boss active state
  public bossInstance: ZombieInstance | null = null;
  public onBossKilled?: () => void;

  constructor(scene: THREE.Scene, vfx: VFXSystem, map: CityMap) {
    this.scene = scene;
    this.vfx = vfx;
    this.map = map;
  }

  public spawnZombie(type: ZombieType, customPos?: THREE.Vector3): ZombieInstance {
    const id = this.nextId++;
    const pos = customPos ? customPos.clone() : this.getRandomSpawnPos();

    const group = new THREE.Group();
    group.position.copy(pos);

    // Stats configuration based on zombie archetype
    let hp = 70;
    let speed = 2.4;
    let damage = 18;
    let attackRange = 1.4;
    let attackCooldown = 1.1;
    let scoreValue = 100;
    let scale = 1.0;

    // Materials
    let skinColor = 0x475949; // Sickly decayed greenish gray
    let clothColor = 0x22252a;
    let eyeColor = 0xff2200;

    if (type === 'RUNNER') {
      hp = 45;
      speed = 5.2;
      damage = 14;
      attackRange = 1.3;
      attackCooldown = 0.7;
      scoreValue = 150;
      skinColor = 0x5b3e34;
      clothColor = 0x3d1f1f;
    } else if (type === 'BRUTE') {
      hp = 420;
      speed = 1.8;
      damage = 45;
      attackRange = 2.0;
      attackCooldown = 1.8;
      scoreValue = 350;
      scale = 1.5;
      skinColor = 0x2c332d;
      clothColor = 0x15181c;
      eyeColor = 0xffaa00;
    } else if (type === 'SPITTER') {
      hp = 60;
      speed = 2.8;
      damage = 22;
      attackRange = 18.0; // Ranged
      attackCooldown = 2.4;
      scoreValue = 200;
      skinColor = 0x3b663b;
      clothColor = 0x243324;
      eyeColor = 0x44ff22;
    } else if (type === 'HUNTER') {
      hp = 55;
      speed = 5.8;
      damage = 25;
      attackRange = 1.6;
      attackCooldown = 0.9;
      scoreValue = 220;
      scale = 0.95;
      skinColor = 0x3d3844;
      clothColor = 0x1a1820;
    } else if (type === 'BOSS_RECKONER') {
      hp = 2500;
      speed = 3.2;
      damage = 60;
      attackRange = 2.8;
      attackCooldown = 1.5;
      scoreValue = 2500;
      scale = 2.2;
      skinColor = 0x1a1e24;
      clothColor = 0x441122;
      eyeColor = 0x00ffee; // Temporal glowing eyes!
    }

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
    const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.9 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

    // Rig construction
    const pelvis = new THREE.Group();
    pelvis.position.y = 1.0 * scale;
    group.add(pelvis);

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.65 * scale, 0.35 * scale), clothMat);
    torsoMesh.position.y = 0.35 * scale;
    torsoMesh.castShadow = true;
    pelvis.add(torsoMesh);

    // Head with glowing eyes
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.35 * scale, 0.32 * scale), skinMat);
    headMesh.position.y = 0.8 * scale;
    headMesh.castShadow = true;
    pelvis.add(headMesh);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.06 * scale, 0.04 * scale), eyeMat);
    eyeL.position.set(-0.08 * scale, 0.82 * scale, 0.17 * scale);
    pelvis.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.06 * scale, 0.04 * scale), eyeMat);
    eyeR.position.set(0.08 * scale, 0.82 * scale, 0.17 * scale);
    pelvis.add(eyeR);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.38 * scale, 0.6 * scale, 0);
    pelvis.add(leftArm);
    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16 * scale, 0.7 * scale, 0.16 * scale), skinMat);
    lArmMesh.position.y = -0.35 * scale;
    lArmMesh.castShadow = true;
    leftArm.add(lArmMesh);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.38 * scale, 0.6 * scale, 0);
    pelvis.add(rightArm);
    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16 * scale, 0.7 * scale, 0.16 * scale), skinMat);
    rArmMesh.position.y = -0.35 * scale;
    rArmMesh.castShadow = true;
    rightArm.add(rArmMesh);

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18 * scale, 0, 0);
    pelvis.add(leftLeg);
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.9 * scale, 0.18 * scale), clothMat);
    lLegMesh.position.y = -0.45 * scale;
    lLegMesh.castShadow = true;
    leftLeg.add(lLegMesh);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18 * scale, 0, 0);
    pelvis.add(rightLeg);
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.9 * scale, 0.18 * scale), clothMat);
    rLegMesh.position.y = -0.45 * scale;
    rLegMesh.castShadow = true;
    rightLeg.add(rLegMesh);

    // Special Boss Core light
    if (type === 'BOSS_RECKONER') {
      const bossLight = new THREE.PointLight(0x00ffee, 2.5, 8);
      bossLight.position.set(0, 1.6, 0.4);
      group.add(bossLight);
    }

    this.scene.add(group);

    const zombie: ZombieInstance = {
      id,
      type,
      group,
      position: pos,
      velocity: new THREE.Vector3(),
      rotationY: 0,
      hp,
      maxHp: hp,
      speed,
      damage,
      attackRange,
      attackCooldown,
      attackTimer: 0,
      staggerTimer: 0,
      flinchTimer: 0,
      animTimer: Math.random() * 10,
      isDead: false,
      deathTimer: 0,
      isHeadshotKilled: false,
      scoreValue,
      torsoMesh,
      headMesh,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      skinMat,
      currentTargetPos: new THREE.Vector3(),
      targetIsRemnant: false,
    };

    this.zombies.push(zombie);
    if (type === 'BOSS_RECKONER') {
      this.bossInstance = zombie;
      soundManager.playBossRoar();
    }

    return zombie;
  }

  private getRandomSpawnPos(): THREE.Vector3 {
    const pt = this.spawnLocations[Math.floor(Math.random() * this.spawnLocations.length)];
    return new THREE.Vector3(
      pt.x + (Math.random() - 0.5) * 8,
      0,
      pt.z + (Math.random() - 0.5) * 8
    );
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    remnantPositions: { pos: THREE.Vector3; id: string }[],
    onPlayerDamage: (dmg: number) => void
  ) {
    // 1. Update Projectiles
    for (let i = this.acidProjectiles.length - 1; i >= 0; i--) {
      const proj = this.acidProjectiles[i];
      proj.life -= dt;
      proj.pos.addScaledVector(proj.vel, dt);
      proj.mesh.position.copy(proj.pos);

      // Check hit player
      if (proj.pos.distanceTo(playerPos) < 1.3) {
        onPlayerDamage(proj.damage);
        this.vfx.spawnSpitAcid(proj.pos, proj.vel.clone().negate());
        this.scene.remove(proj.mesh);
        this.acidProjectiles.splice(i, 1);
        continue;
      }

      // Check hit ground / expired
      if (proj.pos.y <= 0.1 || proj.life <= 0) {
        this.vfx.spawnSpitAcid(proj.pos, new THREE.Vector3(0, 1, 0));
        this.scene.remove(proj.mesh);
        this.acidProjectiles.splice(i, 1);
        continue;
      }
    }

    // 2. Update Zombie AI & Movement
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      // Handle Hit Flash & Flinch Decay
      if (z.flinchTimer > 0) {
        z.flinchTimer -= dt;
        if (z.flinchTimer > 0) {
          z.skinMat.emissive.setHex(0xaa1111);
          z.skinMat.emissiveIntensity = 0.85;
        } else {
          z.skinMat.emissive.setHex(0x000000);
          z.skinMat.emissiveIntensity = 0;
        }
      }

      // Handle Death Sequence with Ragdoll Momentum
      if (z.isDead) {
        z.deathTimer += dt;
        // Slide / tumble with leftover velocity
        z.velocity.multiplyScalar(Math.max(0, 1.0 - dt * 4.0));
        z.position.addScaledVector(z.velocity, dt);
        z.group.position.copy(z.position);
        z.group.position.y = Math.max(0, z.group.position.y - dt * 0.5);
        z.group.rotation.x = THREE.MathUtils.lerp(z.group.rotation.x, -Math.PI / 2, dt * 8);

        if (z.deathTimer >= 3.5) {
          this.scene.remove(z.group);
          this.zombies.splice(i, 1);
          if (z.type === 'BOSS_RECKONER') {
            this.bossInstance = null;
            if (this.onBossKilled) this.onBossKilled();
          }
        }
        continue;
      }

      z.animTimer += dt;
      if (z.staggerTimer > 0) {
        z.staggerTimer -= dt;
      }
      if (z.attackTimer > 0) {
        z.attackTimer -= dt;
      }

      // Target selection: Determine closest between Player and active Remnants!
      let bestTarget = playerPos;
      let closestDist = z.position.distanceTo(playerPos);
      let isRemnantTarget = false;

      for (const rem of remnantPositions) {
        const d = z.position.distanceTo(rem.pos);
        // Remnants have high aggro pull if within 14m!
        if (d < closestDist && d < 14) {
          closestDist = d;
          bestTarget = rem.pos;
          isRemnantTarget = true;
        }
      }

      z.currentTargetPos.copy(bestTarget);
      z.targetIsRemnant = isRemnantTarget;

      const toTarget = new THREE.Vector3().subVectors(bestTarget, z.position);
      toTarget.y = 0;
      const dist = toTarget.length();

      // Look at target
      if (dist > 0.1) {
        const targetRotY = Math.atan2(toTarget.x, toTarget.z);
        z.rotationY = THREE.MathUtils.lerp(z.rotationY, targetRotY, dt * 6.5);
        z.group.rotation.y = z.rotationY;
      }

      // Move toward target if not staggering or attacking
      const effectiveSpeed = z.staggerTimer > 0 ? z.speed * 0.15 : z.speed;

      if (dist > z.attackRange && z.staggerTimer <= 0) {
        toTarget.normalize();
        z.velocity.copy(toTarget).multiplyScalar(effectiveSpeed);

        // Flocking / Zombie separation
        for (const other of this.zombies) {
          if (other.id !== z.id && !other.isDead) {
            const sep = new THREE.Vector3().subVectors(z.position, other.position);
            sep.y = 0;
            const sepDist = sep.length();
            if (sepDist < 1.4 && sepDist > 0.01) {
              z.velocity.addScaledVector(sep.normalize(), (1.4 - sepDist) * 3);
            }
          }
        }

        // Apply movement step
        const nextPos = z.position.clone().addScaledVector(z.velocity, dt);

        // Map collision check
        const coll = this.map.checkCollision(nextPos, 0.6);
        if (coll.hit) {
          nextPos.add(coll.pushOut);
        }

        z.position.copy(nextPos);
        z.group.position.copy(z.position);
      } else if (z.staggerTimer > 0) {
        // Apply knockback slide even while staggered
        z.position.addScaledVector(z.velocity, dt * 0.5);
        z.group.position.copy(z.position);
      }

      // Attack Logic
      if (dist <= z.attackRange && z.attackTimer <= 0 && z.staggerTimer <= 0) {
        z.attackTimer = z.attackCooldown;
        soundManager.playZombieAttack();

        // Deal damage to player if player is target
        if (!isRemnantTarget) {
          onPlayerDamage(z.damage);
          this.vfx.spawnBloodSplatter(playerPos.clone().add(new THREE.Vector3(0, 1.2, 0)), toTarget.clone().negate(), 8);
        } else {
          // Attacking remnant (causes visual spark/glitch)
          this.vfx.spawnRemnantGhostTrail(bestTarget, 0x00ffee);
        }
      }

      // Spitter Ranged Acid Attack
      if (z.type === 'SPITTER' && dist < 22 && dist > 5 && z.attackTimer <= 0) {
        z.attackTimer = z.attackCooldown;
        this.spawnAcidBall(z.position.clone().add(new THREE.Vector3(0, 1.5, 0)), bestTarget.clone().add(new THREE.Vector3(0, 1, 0)), z.damage);
      }

      // Boss special attacks
      if (z.type === 'BOSS_RECKONER' && z.attackTimer <= 0) {
        if (dist > 8 && Math.random() < 0.4) {
          // Boss ground wave
          z.attackTimer = z.attackCooldown;
          soundManager.playExplosion();
          this.vfx.spawnExplosion(z.position.clone().addScaledVector(toTarget, 4), 3);
        }
      }

      // Procedural walking/attacking animations
      this.animateZombie(z, dt, dist <= z.attackRange);
    }
  }

  private spawnAcidBall(start: THREE.Vector3, target: THREE.Vector3, dmg: number) {
    const dir = new THREE.Vector3().subVectors(target, start).normalize();
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x44ff22 })
    );
    mesh.position.copy(start);
    this.scene.add(mesh);

    this.acidProjectiles.push({
      pos: start,
      vel: dir.multiplyScalar(16),
      life: 2.5,
      mesh,
      damage: dmg,
    });
  }

  private animateZombie(z: ZombieInstance, dt: number, isAttacking: boolean) {
    const swingSpeed = z.speed * 2.5;
    const legSwing = Math.sin(z.animTimer * swingSpeed);

    z.leftLeg.rotation.x = legSwing * 0.7;
    z.rightLeg.rotation.x = -legSwing * 0.7;

    if (z.flinchTimer > 0) {
      // Violent recoil jerk backward on bullet impact
      z.torsoMesh.rotation.x = 0.45;
      z.headMesh.rotation.x = -0.35;
      z.leftArm.rotation.x = -0.2;
      z.rightArm.rotation.x = -0.2;
      return;
    } else {
      z.torsoMesh.rotation.x = 0;
    }

    if (isAttacking) {
      // Violent clawing forward
      const attackSwing = Math.sin(z.animTimer * 12);
      z.leftArm.rotation.x = -Math.PI / 2 + attackSwing * 0.8;
      z.rightArm.rotation.x = -Math.PI / 2 - attackSwing * 0.8;
    } else {
      // Classic zombie lumbering arms held forward
      const armBob = Math.sin(z.animTimer * 2.5) * 0.15;
      z.leftArm.rotation.x = -Math.PI / 2.6 + armBob;
      z.leftArm.rotation.z = -0.15;
      z.rightArm.rotation.x = -Math.PI / 2.4 - armBob;
      z.rightArm.rotation.z = 0.15;
    }

    // Head twitch
    if (Math.random() < 0.05) {
      z.headMesh.rotation.y = (Math.random() - 0.5) * 0.4;
    }
  }

  public damageZombie(
    zombie: ZombieInstance,
    amount: number,
    hitPos: THREE.Vector3,
    hitDir = new THREE.Vector3(0, 0, 1),
    isHeadshot = false,
    knockbackForce = 6.0
  ): { killed: boolean; score: number; isHeadshot: boolean; damageDealt: number } {
    if (zombie.isDead) return { killed: false, score: 0, isHeadshot: false, damageDealt: 0 };

    const finalDamage = isHeadshot ? Math.round(amount * 2.2) : Math.round(amount);
    zombie.hp -= finalDamage;
    zombie.staggerTimer = isHeadshot ? 0.45 : 0.22;
    zombie.flinchTimer = 0.12;

    // Apply directional knockback impulse
    zombie.velocity.addScaledVector(hitDir, knockbackForce);

    if (zombie.hp <= 0) {
      zombie.isDead = true;
      zombie.hp = 0;

      if (isHeadshot) {
        zombie.isHeadshotKilled = true;
        // Pop head mesh
        zombie.headMesh.scale.set(0.01, 0.01, 0.01);
        this.vfx.spawnHeadshotGore(hitPos, hitDir);
        soundManager.playSkullCrunch();
        soundManager.playHitMarker(true);
      } else {
        this.vfx.spawnBloodSplatter(hitPos, hitDir, 22);
        this.vfx.spawnBloodDecal(zombie.position);
        soundManager.playZombieDeath();
        soundManager.playHitMarker(false);
      }

      // Add death momentum
      zombie.velocity.addScaledVector(hitDir, knockbackForce * 1.4);
      return { killed: true, score: zombie.scoreValue * (isHeadshot ? 2 : 1), isHeadshot, damageDealt: finalDamage };
    }

    // Hit survived
    if (isHeadshot) {
      this.vfx.spawnBloodSplatter(hitPos, hitDir, 24);
      soundManager.playFleshImpact(true);
      soundManager.playHitMarker(true);
    } else {
      this.vfx.spawnBloodSplatter(hitPos, hitDir, 14);
      soundManager.playFleshImpact(false);
      soundManager.playHitMarker(false);
    }

    return { killed: false, score: 0, isHeadshot, damageDealt: finalDamage };
  }

  public clearAll() {
    this.zombies.forEach((z) => {
      this.scene.remove(z.group);
    });
    this.zombies = [];
    this.acidProjectiles.forEach((p) => this.scene.remove(p.mesh));
    this.acidProjectiles = [];
    this.bossInstance = null;
  }
}
