import * as THREE from 'three';
import { IMapEnvironment, CollidableBox, InteractiveSupplyCrate } from './IMapEnvironment';

export class SkylineMap implements IMapEnvironment {
  public id = 'skyline_helipad';
  public name = 'APEX SKYLINE EXTRACTION';
  public group: THREE.Group;
  public colliders: CollidableBox[] = [];
  public explosiveBarrels: { mesh: THREE.Group; pos: THREE.Vector3; hp: number; exploded: boolean }[] = [];
  public supplyCrates: InteractiveSupplyCrate[] = [];
  public extractionBeacon: { mesh: THREE.Group; light: THREE.PointLight; pos: THREE.Vector3; active: boolean };

  public currentLightingMode: 'DAY' | 'NIGHT' = 'NIGHT';
  private sceneRef: THREE.Scene;
  private sunLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private lightningLight!: THREE.PointLight;
  private nextLightningTime = 4.0;

  constructor(scene: THREE.Scene, initialLightingMode: 'DAY' | 'NIGHT' = 'NIGHT') {
    this.sceneRef = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.extractionBeacon = {
      mesh: new THREE.Group(),
      light: new THREE.PointLight(0xff0044, 0, 20),
      pos: new THREE.Vector3(0, 0, 0), // Helipad is right in the center!
      active: false,
    };

    this.buildLighting(scene);
    this.setLightingMode(initialLightingMode);
    this.buildRooftop();
    this.buildHelipadPlatform();
    this.buildHvacAndAntennas();
    this.buildGlassSkylights();
    this.buildPerimeterRailings();
    this.buildExtractionZone();
    this.buildExplosiveBarrels();
    this.buildSupplyCrates();
  }

  private buildLighting(scene: THREE.Scene) {
    this.sunLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    this.sunLight.position.set(-20, 50, -30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.group.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x0c1524, 0.7);
    this.group.add(this.ambientLight);

    this.lightningLight = new THREE.PointLight(0xdbeafe, 0, 90);
    this.lightningLight.position.set(0, 35, 0);
    this.group.add(this.lightningLight);
  }

  public setLightingMode(mode: 'DAY' | 'NIGHT') {
    this.currentLightingMode = mode;
    this.sceneRef.background = new THREE.Color(0x040810);
    this.sceneRef.fog = new THREE.FogExp2(0x081020, 0.016);
  }

  public toggleLightingMode(): 'DAY' | 'NIGHT' {
    const next = this.currentLightingMode === 'DAY' ? 'NIGHT' : 'DAY';
    this.setLightingMode(next);
    return next;
  }

  private buildRooftop() {
    const geo = new THREE.PlaneGeometry(90, 90, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.7,
      metalness: 0.5,
    });
    const roof = new THREE.Mesh(geo, mat);
    roof.rotation.x = -Math.PI / 2;
    roof.receiveShadow = true;
    this.group.add(roof);
  }

  private buildHelipadPlatform() {
    const padGroup = new THREE.Group();
    padGroup.position.set(0, 0.1, 0);

    // Large octagonal helipad
    const padGeo = new THREE.CylinderGeometry(11, 11, 0.25, 8);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.8, metalness: 0.4 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.receiveShadow = true;
    padGroup.add(pad);

    // Giant yellow "H" marking
    const hBarMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const leftBar = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 7.5), hBarMat);
    leftBar.rotation.x = -Math.PI / 2;
    leftBar.position.set(-2.5, 0.15, 0);
    padGroup.add(leftBar);

    const rightBar = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 7.5), hBarMat);
    rightBar.rotation.x = -Math.PI / 2;
    rightBar.position.set(2.5, 0.15, 0);
    padGroup.add(rightBar);

    const crossBar = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9), hBarMat);
    crossBar.rotation.x = -Math.PI / 2;
    crossBar.position.set(0, 0.15, 0);
    padGroup.add(crossBar);

    // Yellow circle ring
    const ringGeo = new THREE.RingGeometry(8.5, 9.2, 32);
    const ring = new THREE.Mesh(ringGeo, hBarMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.15;
    padGroup.add(ring);

    this.group.add(padGroup);
  }

  private buildHvacAndAntennas() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x272c35, metalness: 0.8, roughness: 0.4 });

    // Large HVAC chillers acting as cover
    const hvacPiles = [
      { pos: new THREE.Vector3(-22, 0, -20), size: new THREE.Vector3(8, 3.8, 5) },
      { pos: new THREE.Vector3(22, 0, -20), size: new THREE.Vector3(8, 3.8, 5) },
      { pos: new THREE.Vector3(-22, 0, 20), size: new THREE.Vector3(8, 3.8, 5) },
      { pos: new THREE.Vector3(22, 0, 20), size: new THREE.Vector3(8, 3.8, 5) },
    ];

    hvacPiles.forEach((h) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(h.size.x, h.size.y, h.size.z), metalMat);
      mesh.position.set(h.pos.x, h.size.y / 2, h.pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);

      this.addCollider(
        new THREE.Vector3(h.pos.x - h.size.x / 2, 0, h.pos.z - h.size.z / 2),
        new THREE.Vector3(h.pos.x + h.size.x / 2, h.size.y, h.pos.z + h.size.z / 2),
        'prop',
        mesh
      );
    });

    // Tall satellite communication antenna tower
    const antennaGroup = new THREE.Group();
    antennaGroup.position.set(0, 0, -32);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 22, 8), metalMat);
    mast.position.y = 11;
    mast.castShadow = true;
    antennaGroup.add(mast);

    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 0.4, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.7 })
    );
    dish.rotation.x = Math.PI / 3;
    dish.position.set(0, 14, 0);
    antennaGroup.add(dish);

    // Red warning blinker
    const blinker = new THREE.PointLight(0xff1100, 2.0, 15);
    blinker.position.set(0, 22, 0);
    antennaGroup.add(blinker);

    this.group.add(antennaGroup);

    this.addCollider(
      new THREE.Vector3(-1.2, 0, -33.2),
      new THREE.Vector3(1.2, 18, -30.8),
      'structure',
      mast
    );
  }

  private buildGlassSkylights() {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2229, metalness: 0.9 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
    });

    [-18, 18].forEach((x) => {
      const skylight = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 10), frameMat);
      skylight.position.set(x, 0.6, 0);
      skylight.castShadow = true;
      this.group.add(skylight);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 9.6), glassMat);
      glass.position.set(x, 1.25, 0);
      this.group.add(glass);

      this.addCollider(
        new THREE.Vector3(x - 2.1, 0, -5.2),
        new THREE.Vector3(x + 2.1, 1.4, 5.2),
        'structure',
        skylight
      );
    });
  }

  private buildPerimeterRailings() {
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.4 });
    const size = 42;
    const height = 1.4;

    const rails = [
      { pos: new THREE.Vector3(0, height / 2, -size), geo: new THREE.BoxGeometry(size * 2, height, 0.3) },
      { pos: new THREE.Vector3(0, height / 2, size), geo: new THREE.BoxGeometry(size * 2, height, 0.3) },
      { pos: new THREE.Vector3(-size, height / 2, 0), geo: new THREE.BoxGeometry(0.3, height, size * 2) },
      { pos: new THREE.Vector3(size, height / 2, 0), geo: new THREE.BoxGeometry(0.3, height, size * 2) },
    ];

    rails.forEach((r) => {
      const mesh = new THREE.Mesh(r.geo, railMat);
      mesh.position.copy(r.pos);
      this.group.add(mesh);

      const hW = (r.geo.parameters.width || 0) / 2;
      const hD = (r.geo.parameters.depth || 0) / 2;
      this.addCollider(
        new THREE.Vector3(r.pos.x - hW, 0, r.pos.z - hD),
        new THREE.Vector3(r.pos.x + hW, 8, r.pos.z + hD),
        'wall',
        mesh
      );
    });
  }

  private buildExtractionZone() {
    const beaconMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 2.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x111827 })
    );
    beaconMesh.position.set(0, 1.1, 0);

    this.extractionBeacon.mesh.add(beaconMesh);
    this.extractionBeacon.light.position.set(0, 3.2, 0);
    this.extractionBeacon.mesh.add(this.extractionBeacon.light);
    this.group.add(this.extractionBeacon.mesh);
  }

  private buildExplosiveBarrels() {
    const barrelLocations = [
      new THREE.Vector3(-14, 0, -14),
      new THREE.Vector3(14, 0, -14),
      new THREE.Vector3(-14, 0, 14),
      new THREE.Vector3(14, 0, 14),
      new THREE.Vector3(0, 0, 22),
      new THREE.Vector3(0, 0, -22),
    ];

    const barrelGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.35, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.5, metalness: 0.3 });

    barrelLocations.forEach((pos) => {
      const bGroup = new THREE.Group();
      bGroup.position.copy(pos);
      const mesh = new THREE.Mesh(barrelGeo, barrelMat);
      mesh.position.y = 0.68;
      mesh.castShadow = true;
      bGroup.add(mesh);
      this.group.add(bGroup);

      this.explosiveBarrels.push({ mesh: bGroup, pos, hp: 50, exploded: false });

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
      { pos: new THREE.Vector3(-16, 0, -22), type: 'AMMO' },
      { pos: new THREE.Vector3(16, 0, -22), type: 'HEALTH' },
      { pos: new THREE.Vector3(-16, 0, 22), type: 'PERK' },
      { pos: new THREE.Vector3(16, 0, 22), type: 'AMMO' },
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
    this.extractionBeacon.light.intensity = 4.0;
  }

  public deactivateExtraction() {
    this.extractionBeacon.active = false;
    this.extractionBeacon.light.intensity = 0;
  }

  public isPlayerInExtractionZone(pos: THREE.Vector3, zoneRadius = 9.5): boolean {
    if (!this.extractionBeacon.active) return false;
    return pos.distanceTo(this.extractionBeacon.pos) <= zoneRadius;
  }

  public addCollider(min: THREE.Vector3, max: THREE.Vector3, type: CollidableBox['type'], objectRef?: THREE.Object3D): CollidableBox {
    const box: CollidableBox = { min, max, type, objectRef };
    this.colliders.push(box);
    return box;
  }

  public removeCollider(obj: THREE.Object3D) {
    this.colliders = this.colliders.filter(c => c.objectRef !== obj);
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
    // Dynamic lightning flash
    this.nextLightningTime -= dt;
    if (this.nextLightningTime <= 0) {
      this.lightningLight.intensity = 8.0;
      this.nextLightningTime = 3.5 + Math.random() * 5.0;
    } else {
      this.lightningLight.intensity = Math.max(0, this.lightningLight.intensity - dt * 25);
    }

    if (this.extractionBeacon.active) {
      this.extractionBeacon.light.intensity = 2.5 + Math.sin(time * 9) * 1.8;
    }
  }

  public dispose() {
    this.sceneRef.remove(this.group);
  }
}
