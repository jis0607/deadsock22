import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  drag?: number;
}

export interface BulletTracer {
  start: THREE.Vector3;
  end: THREE.Vector3;
  current: THREE.Vector3;
  color: THREE.Color;
  speed: number;
  progress: number;
  mesh: THREE.Line;
}

export class VFXSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private tracers: BulletTracer[] = [];
  
  // Rain
  private rainCount = 1200;
  private rainGeometry!: THREE.BufferGeometry;
  private rainMaterial!: THREE.PointsMaterial;
  private rainSystem!: THREE.Points;
  private rainBounds = { minX: -45, maxX: 45, minY: 0, maxY: 30, minZ: -45, maxZ: 45 };

  // Shell Casings
  private shellCasings: {
    mesh: THREE.Mesh;
    vel: THREE.Vector3;
    rotVel: THREE.Vector3;
    life: number;
  }[] = [];
  private shellGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.065, 6);
  private shellMat = new THREE.MeshStandardMaterial({
    color: 0xdfb15b,
    metalness: 0.85,
    roughness: 0.25,
  });

  // Dynamic Muzzle Light
  private muzzleLight: THREE.PointLight;
  private muzzleLightTimer = 0;

  // Ground Blood Splatters
  private bloodDecals: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];
  private bloodDecalGeo = new THREE.PlaneGeometry(0.85, 0.85);
  private bloodDecalMat: THREE.MeshBasicMaterial;

  // Particle Mesh pool using instanced or direct point rendering
  private pointGeo!: THREE.BufferGeometry;
  private pointMat!: THREE.PointsMaterial;
  private particlePoints!: THREE.Points;
  private maxParticles = 2500;
  private positions!: Float32Array;
  private colors!: Float32Array;
  private sizes!: Float32Array;

  // Temporary vectors
  private tempV = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initRain();
    this.initParticleBuffer();

    // Muzzle light
    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 14, 2.0);
    this.scene.add(this.muzzleLight);

    // Procedural blood decal texture
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 64;
    dCanvas.height = 64;
    const dCtx = dCanvas.getContext('2d')!;
    const grad = dCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(120, 5, 15, 0.95)');
    grad.addColorStop(0.5, 'rgba(80, 0, 10, 0.85)');
    grad.addColorStop(0.8, 'rgba(50, 0, 5, 0.4)');
    grad.addColorStop(1, 'rgba(30, 0, 0, 0)');
    dCtx.fillStyle = grad;
    dCtx.beginPath();
    dCtx.arc(32, 32, 30, 0, Math.PI * 2);
    dCtx.fill();

    const dTex = new THREE.CanvasTexture(dCanvas);
    this.bloodDecalMat = new THREE.MeshBasicMaterial({
      map: dTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  private initRain() {
    const rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 80;
      rainPositions[i * 3 + 1] = Math.random() * 25 + 2;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    this.rainMaterial = new THREE.PointsMaterial({
      color: 0x88bbdd,
      size: 0.15,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.rainSystem = new THREE.Points(this.rainGeometry, this.rainMaterial);
    this.scene.add(this.rainSystem);
  }

  private initParticleBuffer() {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.pointGeo = new THREE.BufferGeometry();
    this.pointGeo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.pointGeo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.pointGeo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Custom circle particle texture procedurally generated
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    this.pointMat = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: texture,
    });

    this.particlePoints = new THREE.Points(this.pointGeo, this.pointMat);
    this.scene.add(this.particlePoints);
  }

  public update(dt: number, playerPos?: THREE.Vector3) {
    // 1. Update Rain
    if (this.rainGeometry) {
      const posAttr = this.rainGeometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const centerX = playerPos ? playerPos.x : 0;
      const centerZ = playerPos ? playerPos.z : 0;

      for (let i = 0; i < this.rainCount; i++) {
        arr[i * 3 + 1] -= dt * 32; // fall speed
        arr[i * 3] += dt * 3.5;    // wind slant
        
        // Wrap around
        if (arr[i * 3 + 1] < 0.1) {
          arr[i * 3 + 1] = Math.random() * 10 + 20;
          arr[i * 3] = centerX + (Math.random() - 0.5) * 70;
          arr[i * 3 + 2] = centerZ + (Math.random() - 0.5) * 70;

          // Occasional ground splash
          if (Math.random() < 0.15) {
            this.spawnSplash(new THREE.Vector3(arr[i * 3], 0.05, arr[i * 3 + 2]));
          }
        }
      }
      posAttr.needsUpdate = true;
    }

    // 2. Update Dynamic Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Drag
      if (p.drag) {
        p.velocity.multiplyScalar(Math.pow(p.drag, dt * 60));
      }
      // Gravity
      if (p.gravity !== undefined) {
        p.velocity.y -= p.gravity * dt;
      }

      p.position.addScaledVector(p.velocity, dt);

      // Floor bounce for debris/sparks
      if (p.position.y < 0.05 && p.velocity.y < 0) {
        p.position.y = 0.05;
        p.velocity.y = -p.velocity.y * 0.35;
        p.velocity.x *= 0.6;
        p.velocity.z *= 0.6;
      }
    }

    // Update Particle Buffer attributes
    const pCount = Math.min(this.particles.length, this.maxParticles);
    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];
      const progress = p.life / p.maxLife; // 1 to 0

      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      this.colors[i * 3] = p.color.r * progress * p.alpha;
      this.colors[i * 3 + 1] = p.color.g * progress * p.alpha;
      this.colors[i * 3 + 2] = p.color.b * progress * p.alpha;

      this.sizes[i] = p.size * (0.3 + progress * 0.7);
    }

    // Zero out unused slots
    for (let i = pCount; i < Math.min(this.maxParticles, pCount + 50); i++) {
      this.sizes[i] = 0;
    }

    if (this.pointGeo) {
      (this.pointGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.pointGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      (this.pointGeo.attributes.size as THREE.BufferAttribute).needsUpdate = true;
    }

    // 3. Update Bullet Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.progress += dt * t.speed;
      if (t.progress >= 1.0) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        (t.mesh.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
        continue;
      }

      // Linear interpolation
      t.current.lerpVectors(t.start, t.end, t.progress);
      const trailStart = this.tempV.lerpVectors(t.start, t.end, Math.max(0, t.progress - 0.2));

      const pos = t.mesh.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, trailStart.x, trailStart.y, trailStart.z);
      pos.setXYZ(1, t.current.x, t.current.y, t.current.z);
      pos.needsUpdate = true;
    }

    // 4. Update Dynamic Muzzle Light Decay
    if (this.muzzleLightTimer > 0) {
      this.muzzleLightTimer -= dt;
      this.muzzleLight.intensity = Math.max(0, this.muzzleLightTimer * 38);
      if (this.muzzleLightTimer <= 0) {
        this.muzzleLight.intensity = 0;
      }
    }

    // 5. Update Shell Casings (Physics bounce & spin)
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const s = this.shellCasings[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        this.shellCasings.splice(i, 1);
        continue;
      }

      s.vel.y -= 14.0 * dt; // gravity
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.rotation.x += s.rotVel.x * dt;
      s.mesh.rotation.y += s.rotVel.y * dt;
      s.mesh.rotation.z += s.rotVel.z * dt;

      // Floor bounce
      if (s.mesh.position.y < 0.02) {
        s.mesh.position.y = 0.02;
        s.vel.y = -s.vel.y * 0.4;
        s.vel.x *= 0.7;
        s.vel.z *= 0.7;
        s.rotVel.multiplyScalar(0.5);
      }
    }

    // 6. Update Blood Decals Fade
    for (let i = this.bloodDecals.length - 1; i >= 0; i--) {
      const d = this.bloodDecals[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        this.bloodDecals.splice(i, 1);
        continue;
      }
      if (d.life < 3.0) {
        (d.mesh.material as THREE.MeshBasicMaterial).opacity = (d.life / 3.0) * 0.85;
      }
    }
  }

  // --- SPAWN HELPERS ---

  public spawnMuzzleLight(pos: THREE.Vector3, colorHex = 0xffaa33) {
    this.muzzleLight.color.setHex(colorHex);
    this.muzzleLight.position.copy(pos);
    this.muzzleLight.intensity = 3.2;
    this.muzzleLightTimer = 0.07;
  }

  public spawnBulletShell(pos: THREE.Vector3, rightDir: THREE.Vector3) {
    const mesh = new THREE.Mesh(this.shellGeo, this.shellMat);
    mesh.position.copy(pos);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    this.scene.add(mesh);

    // Eject to the right and slightly up/back
    const ejectVel = rightDir.clone().multiplyScalar(2.2 + Math.random() * 1.5)
      .add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.5 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8));

    const rotVel = new THREE.Vector3(
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 25
    );

    this.shellCasings.push({
      mesh,
      vel: ejectVel,
      rotVel,
      life: 4.5,
    });

    if (this.shellCasings.length > 40) {
      const oldest = this.shellCasings.shift();
      if (oldest) this.scene.remove(oldest.mesh);
    }
  }

  public spawnHeadshotGore(pos: THREE.Vector3, hitDir: THREE.Vector3) {
    // 1. High velocity crimson blood spray
    const bloodColor = new THREE.Color(0x99000a);
    for (let i = 0; i < 35; i++) {
      const vel = hitDir.clone().multiplyScalar(3.5 + Math.random() * 5.0)
        .add(new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1.0, (Math.random() - 0.5) * 4));

      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)),
        velocity: vel,
        color: bloodColor.clone(),
        size: 0.28 + Math.random() * 0.25,
        alpha: 1.0,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75,
        gravity: 14.0,
        drag: 0.92,
      });
    }

    // 2. Bone fragments
    for (let i = 0; i < 12; i++) {
      const vel = hitDir.clone().multiplyScalar(2 + Math.random() * 4)
        .add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2 + 1, (Math.random() - 0.5) * 3));

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: new THREE.Color(0xdad2c5), // bone ivory
        size: 0.14 + Math.random() * 0.1,
        alpha: 1.0,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        gravity: 16.0,
        drag: 0.94,
      });
    }

    // 3. Ground blood puddle
    this.spawnBloodDecal(pos.clone().setY(0.012));
  }

  public spawnBloodDecal(pos: THREE.Vector3) {
    if (this.bloodDecals.length > 25) {
      const oldest = this.bloodDecals.shift();
      if (oldest) this.scene.remove(oldest.mesh);
    }

    const mat = this.bloodDecalMat.clone();
    const mesh = new THREE.Mesh(this.bloodDecalGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.6;
    mesh.scale.set(scale, scale, 1);
    mesh.position.set(pos.x + (Math.random() - 0.5) * 0.3, 0.015, pos.z + (Math.random() - 0.5) * 0.3);
    this.scene.add(mesh);

    this.bloodDecals.push({
      mesh,
      life: 14.0,
      maxLife: 14.0,
    });
  }

  public spawnMeleeImpact(pos: THREE.Vector3, dir: THREE.Vector3) {
    // Kinetic shockwave burst
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2;
      const radialDir = new THREE.Vector3(Math.cos(angle), 0.2 + (Math.random() - 0.5) * 0.4, Math.sin(angle));
      const vel = radialDir.multiplyScalar(4 + Math.random() * 3).add(dir.clone().multiplyScalar(3));

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: new THREE.Color(0xffeedd),
        size: 0.35 + Math.random() * 0.25,
        alpha: 0.9,
        life: 0.22 + Math.random() * 0.15,
        maxLife: 0.37,
        drag: 0.88,
      });
    }
  }

  public spawnBulletTracer(start: THREE.Vector3, end: THREE.Vector3, isRemnant = false, colorHex = 0xffe688) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array([start.x, start.y, start.z, start.x, start.y, start.z]);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color: isRemnant ? 0x00ffff : colorHex,
      transparent: true,
      opacity: isRemnant ? 0.95 : 0.85,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    const mesh = new THREE.Line(geom, mat);
    this.scene.add(mesh);

    this.tracers.push({
      start: start.clone(),
      end: end.clone(),
      current: start.clone(),
      color: new THREE.Color(isRemnant ? 0x00ffff : colorHex),
      speed: 12.0, // fast laser-like speed
      progress: 0,
      mesh,
    });
  }

  public spawnMuzzleFlash(pos: THREE.Vector3, dir: THREE.Vector3, isRemnant = false) {
    const color = isRemnant ? new THREE.Color(0x00ffee) : new THREE.Color(0xffbb44);
    
    // Flash particles
    for (let i = 0; i < 7; i++) {
      const vel = dir.clone().multiplyScalar(4 + Math.random() * 4)
        .add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2));
      
      this.particles.push({
        position: pos.clone().addScaledVector(dir, 0.1),
        velocity: vel,
        color: color.clone(),
        size: 0.35 + Math.random() * 0.25,
        alpha: 1.0,
        life: 0.07 + Math.random() * 0.05,
        maxLife: 0.12,
        drag: 0.85,
      });
    }

    // Gunsmoke puff
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        position: pos.clone().addScaledVector(dir, 0.2),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.8 + 0.4, (Math.random() - 0.5) * 0.8),
        color: new THREE.Color(0x556677),
        size: 0.4 + Math.random() * 0.3,
        alpha: 0.4,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        drag: 0.92,
      });
    }
  }

  public spawnImpactSparks(pos: THREE.Vector3, normal: THREE.Vector3, colorHex = 0xffaa33) {
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < 14; i++) {
      const vel = normal.clone().multiplyScalar(4 + Math.random() * 5)
        .add(new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5));

      this.particles.push({
        position: pos.clone().addScaledVector(normal, 0.05),
        velocity: vel,
        color: color.clone(),
        size: 0.15 + Math.random() * 0.15,
        alpha: 1.0,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        gravity: 9.8,
        drag: 0.94,
      });
    }
  }

  public spawnBloodSplatter(pos: THREE.Vector3, dir: THREE.Vector3, count = 16) {
    const bloodColor = new THREE.Color(0x880011);
    for (let i = 0; i < count; i++) {
      const vel = dir.clone().multiplyScalar(2 + Math.random() * 3)
        .add(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2 + 0.5, (Math.random() - 0.5) * 3));

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: bloodColor.clone(),
        size: 0.2 + Math.random() * 0.2,
        alpha: 0.95,
        life: 0.35 + Math.random() * 0.3,
        maxLife: 0.65,
        gravity: 12.0,
        drag: 0.9,
      });
    }
  }

  public spawnExplosion(pos: THREE.Vector3, radius = 4) {
    // Fire burst
    for (let i = 0; i < 45; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize();
      const speed = 4 + Math.random() * 9;
      
      const fireColor = Math.random() < 0.6 ? new THREE.Color(0xff6600) : new THREE.Color(0xffcc00);

      this.particles.push({
        position: pos.clone().addScaledVector(dir, 0.2),
        velocity: dir.multiplyScalar(speed),
        color: fireColor,
        size: 0.8 + Math.random() * 0.6,
        alpha: 1.0,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        drag: 0.88,
        gravity: 2.0,
      });
    }

    // Heavy black/grey smoke
    for (let i = 0; i < 30; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 2
      ).normalize();

      this.particles.push({
        position: pos.clone().addScaledVector(dir, 0.5),
        velocity: dir.multiplyScalar(2 + Math.random() * 4),
        color: new THREE.Color(0x222222),
        size: 1.2 + Math.random() * 0.9,
        alpha: 0.65,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        drag: 0.92,
        gravity: -0.5, // gentle rise
      });
    }

    // Shrapnel sparks
    for (let i = 0; i < 25; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        Math.random() * 10 + 4,
        (Math.random() - 0.5) * 16
      );

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: new THREE.Color(0xffeedd),
        size: 0.2,
        alpha: 1.0,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
        gravity: 14.0,
        drag: 0.96,
      });
    }
  }

  public spawnRemnantMaterializeFX(pos: THREE.Vector3, colorHex = 0x00ffee) {
    const color = new THREE.Color(colorHex);
    // Swirling inward temporal rings
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.5 + Math.random() * 2.0;
      const height = Math.random() * 2.2;
      const pPos = new THREE.Vector3(
        pos.x + Math.cos(angle) * dist,
        pos.y + height,
        pos.z + Math.sin(angle) * dist
      );
      // Inward velocity
      const targetPos = new THREE.Vector3(pos.x, pos.y + height * 0.8, pos.z);
      const vel = targetPos.clone().sub(pPos).multiplyScalar(2.2 + Math.random() * 1.5);

      this.particles.push({
        position: pPos,
        velocity: vel,
        color: color.clone(),
        size: 0.35 + Math.random() * 0.25,
        alpha: 0.9,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
        drag: 0.95,
      });
    }
  }

  public spawnRemnantGhostTrail(pos: THREE.Vector3, colorHex = 0x00ffee) {
    if (Math.random() < 0.4) {
      this.particles.push({
        position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 1.6 + 0.2, (Math.random() - 0.5) * 0.4)),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.3 + Math.random() * 0.3, (Math.random() - 0.5) * 0.2),
        color: new THREE.Color(colorHex),
        size: 0.28,
        alpha: 0.7,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.6,
        drag: 0.92,
      });
    }
  }

  public spawnSpitAcid(pos: THREE.Vector3, dir: THREE.Vector3) {
    const green = new THREE.Color(0x44ff22);
    for (let i = 0; i < 18; i++) {
      const vel = dir.clone().multiplyScalar(5 + Math.random() * 4)
        .add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2));

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: green.clone(),
        size: 0.25 + Math.random() * 0.2,
        alpha: 0.9,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        gravity: 8.0,
        drag: 0.93,
      });
    }
  }

  private spawnSplash(pos: THREE.Vector3) {
    if (this.particles.length > this.maxParticles - 100) return;
    for (let i = 0; i < 3; i++) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.2 + 0.4, (Math.random() - 0.5) * 1.5);
      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: new THREE.Color(0x99ccff),
        size: 0.12,
        alpha: 0.5,
        life: 0.18,
        maxLife: 0.18,
        gravity: 12.0,
      });
    }
  }
}
