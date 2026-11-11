import * as THREE from 'three';
import { IMapEnvironment, CollidableBox, InteractiveSupplyCrate } from './IMapEnvironment';

export class BunkerMap implements IMapEnvironment {
  public id = 'military_bunker';
  public name = 'MILITARY BUNKER OMEGA';
  public group: THREE.Group;
  public colliders: CollidableBox[] = [];
  public explosiveBarrels: { mesh: THREE.Group; pos: THREE.Vector3; hp: number; exploded: boolean }[] = [];
  public supplyCrates: InteractiveSupplyCrate[] = [];
  public extractionBeacon: { mesh: THREE.Group; light: THREE.PointLight; pos: THREE.Vector3; active: boolean };

  public currentLightingMode: 'DAY' | 'NIGHT' = 'NIGHT';
  private sceneRef: THREE.Scene;
  private sunLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private redAlarms: THREE.PointLight[] = [];

  constructor(scene: THREE.Scene, initialLightingMode: 'DAY' | 'NIGHT' = 'NIGHT') {
    this.sceneRef = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.extractionBeacon = {
      mesh: new THREE.Group(),
      light: new THREE.PointLight(0x00ff88, 0, 18),
      pos: new THREE.Vector3(0, 0, -32),
      active: false,
    };

    this.buildLighting(scene);
    this.setLightingMode(initialLightingMode);
    this.buildBunkerFloor();
    this.buildBlastDoors();
    this.buildBioLabCylinders();
    this.buildServerRacks();
    this.buildCommandConsoles();
    this.buildPerimeterWalls();
    this.buildExtractionZone();
    this.buildExplosiveBarrels();
    this.buildSupplyCrates();
  }

  private buildLighting(scene: THREE.Scene) {
    this.sunLight = new THREE.DirectionalLight(0xef4444, 0.7);
    this.sunLight.position.set(0, 20, 0);
    this.group.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x1a0808, 0.6);
    this.group.add(this.ambientLight);
  }

  public setLightingMode(mode: 'DAY' | 'NIGHT') {
    this.currentLightingMode = mode;
    this.sceneRef.background = new THREE.Color(0x0a0303);
    this.sceneRef.fog = new THREE.FogExp2(0x0e0404, 0.025);
  }

  public toggleLightingMode(): 'DAY' | 'NIGHT' {
    const next = this.currentLightingMode === 'DAY' ? 'NIGHT' : 'DAY';
    this.setLightingMode(next);
    return next;
  }

  private buildBunkerFloor() {
    const geo = new THREE.PlaneGeometry(90, 90, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1c20,
      roughness: 0.8,
      metalness: 0.5,
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  private buildBlastDoors() {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.9, roughness: 0.3 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });

    // Massive reinforced bulkhead blast doors
    [-20, 20].forEach((z) => {
      const doorL = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 1.2), steelMat);
      doorL.position.set(-6, 3, z);
      doorL.castShadow = true;
      this.group.add(doorL);

      const doorR = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 1.2), steelMat);
      doorR.position.set(6, 3, z);
      doorR.castShadow = true;
      this.group.add(doorR);

      // Hazard stripes
      const stripeL = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.8), hazardMat);
      stripeL.position.set(-6, 3, z + 0.61);
      this.group.add(stripeL);

      const stripeR = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.8), hazardMat);
      stripeR.position.set(6, 3, z + 0.61);
      this.group.add(stripeR);

      this.addCollider(
        new THREE.Vector3(-9, 0, z - 0.7),
        new THREE.Vector3(-3, 6, z + 0.7),
        'wall',
        doorL
      );
      this.addCollider(
        new THREE.Vector3(3, 0, z - 0.7),
        new THREE.Vector3(9, 6, z + 0.7),
        'wall',
        doorR
      );
    });
  }

  private buildBioLabCylinders() {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
    });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });

    const tubes = [
      new THREE.Vector3(-14, 0, -8),
      new THREE.Vector3(-14, 0, 8),
      new THREE.Vector3(14, 0, -8),
      new THREE.Vector3(14, 0, 8),
    ];

    tubes.forEach((pos) => {
      const tubeGroup = new THREE.Group();
      tubeGroup.position.copy(pos);

      // Glass cylinder
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5.5, 16), glassMat);
      cyl.position.y = 2.75;
      cyl.castShadow = true;
      tubeGroup.add(cyl);

      // Metal base & cap
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.6, 16), baseMat);
      base.position.y = 0.3;
      tubeGroup.add(base);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 1.9, 0.6, 16), baseMat);
      cap.position.y = 5.2;
      tubeGroup.add(cap);

      // Cyan bio light inside tube
      const bioLight = new THREE.PointLight(0x06b6d4, 2.5, 10);
      bioLight.position.set(0, 2.8, 0);
      tubeGroup.add(bioLight);

      this.group.add(tubeGroup);

      this.addCollider(
        new THREE.Vector3(pos.x - 1.8, 0, pos.z - 1.8),
        new THREE.Vector3(pos.x + 1.8, 5.5, pos.z + 1.8),
        'structure',
        cyl
      );
    });
  }

  private buildServerRacks() {
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.8 });

    [-18, 18].forEach((x) => {
      [-12, -4, 4, 12].forEach((z) => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 1.2), rackMat);
        rack.position.set(x, 2.1, z);
        rack.castShadow = true;
        this.group.add(rack);

        this.addCollider(
          new THREE.Vector3(x - 1.3, 0, z - 0.7),
          new THREE.Vector3(x + 1.3, 4.2, z + 0.7),
          'prop',
          rack
        );
      });
    });
  }

  private buildCommandConsoles() {
    const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const cCenter = new THREE.Mesh(new THREE.BoxGeometry(6, 1.1, 3.2), consoleMat);
    cCenter.position.set(0, 0.55, 0);
    cCenter.castShadow = true;
    this.group.add(cCenter);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.5), screenMat);
    screen.position.set(0, 1.2, 0);
    screen.rotation.x = -Math.PI / 4;
    this.group.add(screen);

    this.addCollider(
      new THREE.Vector3(-3.2, 0, -1.8),
      new THREE.Vector3(3.2, 1.8, 1.8),
      'prop',
      cCenter
    );
  }

  private buildPerimeterWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.9, metalness: 0.4 });
    const size = 40;
    const height = 9;

    const walls = [
      { pos: new THREE.Vector3(0, height / 2, -size), geo: new THREE.BoxGeometry(size * 2, height, 2) },
      { pos: new THREE.Vector3(0, height / 2, size), geo: new THREE.BoxGeometry(size * 2, height, 2) },
      { pos: new THREE.Vector3(-size, height / 2, 0), geo: new THREE.BoxGeometry(2, height, size * 2) },
      { pos: new THREE.Vector3(size, height / 2, 0), geo: new THREE.BoxGeometry(2, height, size * 2) },
    ];

    walls.forEach((w) => {
      const mesh = new THREE.Mesh(w.geo, wallMat);
      mesh.position.copy(w.pos);
      mesh.castShadow = true;
      this.group.add(mesh);

      const hW = (w.geo.parameters.width || 0) / 2;
      const hD = (w.geo.parameters.depth || 0) / 2;
      this.addCollider(
        new THREE.Vector3(w.pos.x - hW, 0, w.pos.z - hD),
        new THREE.Vector3(w.pos.x + hW, height, w.pos.z + hD),
        'wall',
        mesh
      );

      // Red klaxon alarm along walls
      const alarmLight = new THREE.PointLight(0xff0022, 2.0, 14);
      alarmLight.position.set(w.pos.x * 0.8, 6.5, w.pos.z * 0.8);
      this.group.add(alarmLight);
      this.redAlarms.push(alarmLight);
    });
  }

  private buildExtractionZone() {
    const padGroup = new THREE.Group();
    padGroup.position.copy(this.extractionBeacon.pos);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(4.8, 4.8, 0.25, 24),
      new THREE.MeshStandardMaterial({ color: 0x182618, metalness: 0.6 })
    );
    pad.position.y = 0.12;
    padGroup.add(pad);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 4.0, 24),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide })
    );
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
      new THREE.Vector3(-10, 0, -16),
      new THREE.Vector3(10, 0, -16),
      new THREE.Vector3(-10, 0, 16),
      new THREE.Vector3(10, 0, 16),
      new THREE.Vector3(-6, 0, 0),
      new THREE.Vector3(6, 0, 0),
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
      { pos: new THREE.Vector3(-8, 0, -24), type: 'AMMO' },
      { pos: new THREE.Vector3(8, 0, -24), type: 'HEALTH' },
      { pos: new THREE.Vector3(0, 0, 24), type: 'PERK' },
      { pos: new THREE.Vector3(0, 0, -12), type: 'AMMO' },
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
    // Rotating / pulsing emergency red alarms
    this.redAlarms.forEach((alarm, idx) => {
      alarm.intensity = 1.0 + Math.sin(time * 6 + idx) * 1.0;
    });

    if (this.extractionBeacon.active) {
      this.extractionBeacon.light.intensity = 2.5 + Math.sin(time * 8) * 1.5;
    }
  }

  public dispose() {
    this.sceneRef.remove(this.group);
  }
}
