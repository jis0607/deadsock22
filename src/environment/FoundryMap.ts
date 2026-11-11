import * as THREE from 'three';
import { IMapEnvironment, CollidableBox, InteractiveSupplyCrate } from './IMapEnvironment';

export class FoundryMap implements IMapEnvironment {
  public id = 'industrial_foundry';
  public name = 'BLACKOUT FOUNDRY COMPLEX';
  public group: THREE.Group;
  public colliders: CollidableBox[] = [];
  public explosiveBarrels: { mesh: THREE.Group; pos: THREE.Vector3; hp: number; exploded: boolean }[] = [];
  public supplyCrates: InteractiveSupplyCrate[] = [];
  public extractionBeacon: { mesh: THREE.Group; light: THREE.PointLight; pos: THREE.Vector3; active: boolean };

  public currentLightingMode: 'DAY' | 'NIGHT' = 'NIGHT';
  private sceneRef: THREE.Scene;
  private sunLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private hemiLight!: THREE.HemisphereLight;
  private moltenLights: THREE.PointLight[] = [];
  private dynamicLights: { light: THREE.PointLight; baseIntensity: number; flicker: boolean; speed: number }[] = [];

  constructor(scene: THREE.Scene, initialLightingMode: 'DAY' | 'NIGHT' = 'NIGHT') {
    this.sceneRef = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.extractionBeacon = {
      mesh: new THREE.Group(),
      light: new THREE.PointLight(0xff6600, 0, 18),
      pos: new THREE.Vector3(0, 0, -32),
      active: false,
    };

    this.buildLighting(scene);
    this.setLightingMode(initialLightingMode);
    this.buildFactoryFloor();
    this.buildMoltenVats();
    this.buildSmeltingFurnaces();
    this.buildHighCatwalks();
    this.buildMachineryPiles();
    this.buildPerimeterWalls();
    this.buildExtractionZone();
    this.buildExplosiveBarrels();
    this.buildSupplyCrates();
  }

  private buildLighting(scene: THREE.Scene) {
    this.sunLight = new THREE.DirectionalLight(0xff9944, 1.2);
    this.sunLight.position.set(-25, 45, -20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.bias = -0.0005;
    this.group.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x221108, 0.9);
    this.group.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xff5511, 0x110804, 0.6);
    this.group.add(this.hemiLight);
  }

  public setLightingMode(mode: 'DAY' | 'NIGHT') {
    this.currentLightingMode = mode;
    if (mode === 'DAY') {
      this.sceneRef.background = new THREE.Color(0x2b1f1a);
      this.sceneRef.fog = new THREE.FogExp2(0x2b1f1a, 0.012);
      this.sunLight.intensity = 1.8;
      this.ambientLight.intensity = 1.1;
    } else {
      this.sceneRef.background = new THREE.Color(0x0e0705);
      this.sceneRef.fog = new THREE.FogExp2(0x0e0705, 0.022);
      this.sunLight.intensity = 0.8;
      this.ambientLight.intensity = 0.5;
    }
  }

  public toggleLightingMode(): 'DAY' | 'NIGHT' {
    const next = this.currentLightingMode === 'DAY' ? 'NIGHT' : 'DAY';
    this.setLightingMode(next);
    return next;
  }

  private buildFactoryFloor() {
    const geo = new THREE.PlaneGeometry(110, 110, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.85,
      metalness: 0.6,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Hazard yellow/black industrial stripes along center channel
    const stripeGeo = new THREE.PlaneGeometry(6, 90);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xcca010,
      roughness: 0.7,
      metalness: 0.2,
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.02, 0);
    stripe.receiveShadow = true;
    this.group.add(stripe);
  }

  private buildMoltenVats() {
    const vatPositions = [
      new THREE.Vector3(-18, 0, -12),
      new THREE.Vector3(18, 0, -12),
      new THREE.Vector3(-18, 0, 14),
      new THREE.Vector3(18, 0, 14),
    ];

    vatPositions.forEach((pos, idx) => {
      const vatGroup = new THREE.Group();
      vatGroup.position.copy(pos);

      // Outer concrete vat ring
      const outerGeo = new THREE.CylinderGeometry(4.2, 4.5, 2.2, 16);
      const outerMat = new THREE.MeshStandardMaterial({ color: 0x33363d, roughness: 0.9, metalness: 0.5 });
      const outer = new THREE.Mesh(outerGeo, outerMat);
      outer.position.y = 1.1;
      outer.castShadow = true;
      outer.receiveShadow = true;
      vatGroup.add(outer);

      // Glowing liquid magma surface
      const moltenGeo = new THREE.CircleGeometry(3.6, 16);
      const moltenMat = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff4400,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const molten = new THREE.Mesh(moltenGeo, moltenMat);
      molten.rotation.x = -Math.PI / 2;
      molten.position.y = 2.05;
      vatGroup.add(molten);

      // Orange heat point light
      const heatLight = new THREE.PointLight(0xff5500, 3.2, 14);
      heatLight.position.set(0, 3.2, 0);
      vatGroup.add(heatLight);
      this.moltenLights.push(heatLight);

      this.group.add(vatGroup);

      this.addCollider(
        new THREE.Vector3(pos.x - 4.2, 0, pos.z - 4.2),
        new THREE.Vector3(pos.x + 4.2, 2.4, pos.z + 4.2),
        'structure',
        outer
      );
    });
  }

  private buildSmeltingFurnaces() {
    const furnaceMat = new THREE.MeshStandardMaterial({ color: 0x222428, metalness: 0.7, roughness: 0.6 });
    const grateMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 1.8 });

    [-32, 32].forEach((xPos) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(xPos, 0, 0);

      const body = new THREE.Mesh(new THREE.BoxGeometry(7, 12, 18), furnaceMat);
      body.position.y = 6;
      body.castShadow = true;
      body.receiveShadow = true;
      fGroup.add(body);

      // Smelter exhaust pipe
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 14, 12), furnaceMat);
      pipe.position.set(0, 16, 0);
      pipe.castShadow = true;
      fGroup.add(pipe);

      // Glowing heat exhaust grill
      const grill = new THREE.Mesh(new THREE.PlaneGeometry(3, 8), grateMat);
      grill.position.set(xPos < 0 ? 3.52 : -3.52, 4.5, 0);
      grill.rotation.y = xPos < 0 ? Math.PI / 2 : -Math.PI / 2;
      fGroup.add(grill);

      const fLight = new THREE.PointLight(0xff4400, 2.8, 16);
      fLight.position.set(xPos < 0 ? 4.5 : -4.5, 4.5, 0);
      fGroup.add(fLight);
      this.dynamicLights.push({ light: fLight, baseIntensity: 2.8, flicker: true, speed: 7 });

      this.group.add(fGroup);

      this.addCollider(
        new THREE.Vector3(xPos - 3.8, 0, -9.2),
        new THREE.Vector3(xPos + 3.8, 12, 9.2),
        'wall',
        body
      );
    });
  }

  private buildHighCatwalks() {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x474c55, metalness: 0.85, roughness: 0.4 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe0a010, metalness: 0.6, roughness: 0.5 });

    // Central cross bridge connecting north to south
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 48), steelMat);
    bridge.position.set(0, 4.2, 0);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.group.add(bridge);

    // Bridge support pillars
    [-18, 0, 18].forEach((z) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), steelMat);
      pillar.position.set(0, 2.1, z);
      pillar.castShadow = true;
      this.group.add(pillar);

      this.addCollider(
        new THREE.Vector3(-0.5, 0, z - 0.5),
        new THREE.Vector3(0.5, 4.2, z + 0.5),
        'structure',
        pillar
      );
    });
  }

  private buildMachineryPiles() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x33373d, metalness: 0.8, roughness: 0.5 });

    const piles = [
      { pos: new THREE.Vector3(-8, 0, -22), size: new THREE.Vector3(4, 3, 4) },
      { pos: new THREE.Vector3(9, 0, -20), size: new THREE.Vector3(5, 2.5, 3) },
      { pos: new THREE.Vector3(-7, 0, 22), size: new THREE.Vector3(4, 3.5, 3.5) },
      { pos: new THREE.Vector3(10, 0, 24), size: new THREE.Vector3(4.5, 2.8, 4) },
    ];

    piles.forEach((p) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.size.x, p.size.y, p.size.z), metalMat);
      mesh.position.set(p.pos.x, p.size.y / 2, p.pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);

      this.addCollider(
        new THREE.Vector3(p.pos.x - p.size.x / 2, 0, p.pos.z - p.size.z / 2),
        new THREE.Vector3(p.pos.x + p.size.x / 2, p.size.y, p.pos.z + p.size.z / 2),
        'prop',
        mesh
      );
    });
  }

  private buildPerimeterWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1f2226, roughness: 0.9, metalness: 0.3 });
    const thickness = 2.5;
    const height = 14;
    const size = 52;

    const walls = [
      { pos: new THREE.Vector3(0, height / 2, -size), geo: new THREE.BoxGeometry(size * 2, height, thickness) },
      { pos: new THREE.Vector3(0, height / 2, size), geo: new THREE.BoxGeometry(size * 2, height, thickness) },
      { pos: new THREE.Vector3(-size, height / 2, 0), geo: new THREE.BoxGeometry(thickness, height, size * 2) },
      { pos: new THREE.Vector3(size, height / 2, 0), geo: new THREE.BoxGeometry(thickness, height, size * 2) },
    ];

    walls.forEach((w) => {
      const mesh = new THREE.Mesh(w.geo, wallMat);
      mesh.position.copy(w.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);

      const hW = (w.geo.parameters.width || 0) / 2;
      const hD = (w.geo.parameters.depth || 0) / 2;
      this.addCollider(
        new THREE.Vector3(w.pos.x - hW, 0, w.pos.z - hD),
        new THREE.Vector3(w.pos.x + hW, height, w.pos.z + hD),
        'wall',
        mesh
      );
    });
  }

  private buildExtractionZone() {
    const padGroup = new THREE.Group();
    padGroup.position.copy(this.extractionBeacon.pos);

    const padGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.25, 24);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x242830, metalness: 0.6, roughness: 0.5 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.12;
    pad.receiveShadow = true;
    padGroup.add(pad);

    const ringGeo = new THREE.RingGeometry(3.5, 4.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6600, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.26;
    padGroup.add(ring);

    this.extractionBeacon.mesh = padGroup;
    this.extractionBeacon.light.position.set(0, 3.5, 0);
    padGroup.add(this.extractionBeacon.light);
    this.group.add(padGroup);
  }

  private buildExplosiveBarrels() {
    const barrelLocations = [
      new THREE.Vector3(-12, 0, -6),
      new THREE.Vector3(12, 0, -6),
      new THREE.Vector3(-11, 0, 8),
      new THREE.Vector3(13, 0, 7),
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0, -18),
    ];

    const barrelGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.35, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.5, metalness: 0.3 });

    barrelLocations.forEach((pos) => {
      const bGroup = new THREE.Group();
      bGroup.position.copy(pos);

      const mesh = new THREE.Mesh(barrelGeo, barrelMat);
      mesh.position.y = 0.68;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bGroup.add(mesh);

      this.group.add(bGroup);

      const barrelObj = { mesh: bGroup, pos, hp: 50, exploded: false };
      this.explosiveBarrels.push(barrelObj);

      this.addCollider(
        new THREE.Vector3(pos.x - 0.6, 0, pos.z - 0.6),
        new THREE.Vector3(pos.x + 0.6, 1.4, pos.z + 0.6),
        'barrel',
        mesh
      );
    });
  }

  private buildSupplyCrates() {
    const crateDefs: { pos: THREE.Vector3; type: 'AMMO' | 'HEALTH' | 'PERK' }[] = [
      { pos: new THREE.Vector3(-8, 0, 0), type: 'AMMO' },
      { pos: new THREE.Vector3(8, 0, 0), type: 'HEALTH' },
      { pos: new THREE.Vector3(-22, 0, -26), type: 'PERK' },
      { pos: new THREE.Vector3(22, 0, -26), type: 'AMMO' },
    ];

    crateDefs.forEach((c) => {
      const group = new THREE.Group();
      group.position.copy(c.pos);

      const color = c.type === 'AMMO' ? 0x00ccff : c.type === 'HEALTH' ? 0x00ff66 : 0xffaa00;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.9, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.7, roughness: 0.4 })
      );
      box.position.y = 0.45;
      box.castShadow = true;
      group.add(box);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.18, 1.12), new THREE.MeshBasicMaterial({ color }));
      stripe.position.y = 0.45;
      group.add(stripe);

      this.group.add(group);

      const col = this.addCollider(
        new THREE.Vector3(c.pos.x - 0.75, 0, c.pos.z - 0.6),
        new THREE.Vector3(c.pos.x + 0.75, 1.0, c.pos.z + 0.6),
        'prop',
        box
      );

      this.supplyCrates.push({
        position: c.pos,
        mesh: group,
        type: c.type,
        opened: false,
        colliderRef: col,
      });
    });
  }

  public activateExtraction() {
    this.extractionBeacon.active = true;
    this.extractionBeacon.light.intensity = 3.5;
  }

  public deactivateExtraction() {
    this.extractionBeacon.active = false;
    this.extractionBeacon.light.intensity = 0;
  }

  public isPlayerInExtractionZone(pos: THREE.Vector3, zoneRadius = 5.5): boolean {
    if (!this.extractionBeacon.active) return false;
    return pos.distanceTo(this.extractionBeacon.pos) <= zoneRadius;
  }

  public addCollider(min: THREE.Vector3, max: THREE.Vector3, type: CollidableBox['type'], objectRef?: THREE.Object3D): CollidableBox {
    const box: CollidableBox = { min, max, type, objectRef };
    this.colliders.push(box);
    return box;
  }

  public removeCollider(obj: THREE.Object3D | CollidableBox) {
    this.colliders = this.colliders.filter(c => c !== obj && c.objectRef !== obj);
  }

  public openCrateByIndex(index: number) {
    const crate = this.supplyCrates[index];
    if (crate && !crate.opened) {
      crate.opened = true;
      crate.mesh.visible = false;
      if (crate.colliderRef) {
        this.removeCollider(crate.colliderRef);
      }
    }
  }

  public checkCollision(pos: THREE.Vector3, radius: number): { hit: boolean; pushOut: THREE.Vector3; collider?: CollidableBox } {
    const pushOut = new THREE.Vector3();
    let hit = false;
    let hitCollider: CollidableBox | undefined;

    for (const c of this.colliders) {
      const closestX = Math.max(c.min.x, Math.min(pos.x, c.max.x));
      const closestZ = Math.max(c.min.z, Math.min(pos.z, c.max.z));
      const distX = pos.x - closestX;
      const distZ = pos.z - closestZ;
      const distSq = distX * distX + distZ * distZ;

      if (distSq < radius * radius && pos.y < c.max.y && pos.y + 1.8 > c.min.y) {
        hit = true;
        hitCollider = c;
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = radius - dist;
          pushOut.x += (distX / dist) * overlap;
          pushOut.z += (distZ / dist) * overlap;
        } else {
          pushOut.x += radius;
        }
      }
    }
    return { hit, pushOut, collider: hitCollider };
  }

  public update(dt: number, time: number) {
    // Dynamic molten flickering
    this.moltenLights.forEach((light, idx) => {
      light.intensity = 2.6 + Math.sin(time * 3 + idx) * 0.7;
    });

    this.dynamicLights.forEach(({ light, baseIntensity, speed }) => {
      const noise = Math.sin(time * speed) * Math.cos(time * speed * 0.7);
      light.intensity = Math.max(0.4, baseIntensity * (0.85 + 0.15 * noise));
    });

    if (this.extractionBeacon.active) {
      this.extractionBeacon.light.intensity = 2.2 + Math.sin(time * 8) * 1.5;
    }
  }

  public dispose() {
    this.sceneRef.remove(this.group);
  }
}
