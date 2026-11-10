import * as THREE from 'three';
import { IMapEnvironment, CollidableBox, InteractiveSupplyCrate } from './IMapEnvironment';

export class SubwayMap implements IMapEnvironment {
  public id = 'subway_terminus';
  public name = 'SUBWAY TERMINUS PROTOCOL';
  public group: THREE.Group;
  public colliders: CollidableBox[] = [];
  public explosiveBarrels: { mesh: THREE.Group; pos: THREE.Vector3; hp: number; exploded: boolean }[] = [];
  public supplyCrates: InteractiveSupplyCrate[] = [];
  public extractionBeacon: { mesh: THREE.Group; light: THREE.PointLight; pos: THREE.Vector3; active: boolean };

  public currentLightingMode: 'DAY' | 'NIGHT' = 'NIGHT';
  private sceneRef: THREE.Scene;
  private sunLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private emergencyStrobes: THREE.PointLight[] = [];

  constructor(scene: THREE.Scene, initialLightingMode: 'DAY' | 'NIGHT' = 'NIGHT') {
    this.sceneRef = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.extractionBeacon = {
      mesh: new THREE.Group(),
      light: new THREE.PointLight(0xaa00ff, 0, 18),
      pos: new THREE.Vector3(0, 0, -35),
      active: false,
    };

    this.buildLighting(scene);
    this.setLightingMode(initialLightingMode);
    this.buildSubwayPlatform();
    this.buildRailwayTracks();
    this.buildDerailedTrainCars();
    this.buildPlatformPillars();
    this.buildTurnstilesAndBenches();
    this.buildPerimeterWalls();
    this.buildExtractionZone();
    this.buildExplosiveBarrels();
    this.buildSupplyCrates();
  }

  private buildLighting(scene: THREE.Scene) {
    this.sunLight = new THREE.DirectionalLight(0x7c3aed, 0.8);
    this.sunLight.position.set(0, 20, 0);
    this.group.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x181024, 0.65);
    this.group.add(this.ambientLight);
  }

  public setLightingMode(mode: 'DAY' | 'NIGHT') {
    this.currentLightingMode = mode;
    this.sceneRef.background = new THREE.Color(0x08060d);
    this.sceneRef.fog = new THREE.FogExp2(0x0c0818, 0.024);
  }

  public toggleLightingMode(): 'DAY' | 'NIGHT' {
    const next = this.currentLightingMode === 'DAY' ? 'NIGHT' : 'DAY';
    this.setLightingMode(next);
    return next;
  }

  private buildSubwayPlatform() {
    // Concrete passenger platform raised slightly
    const platGeo = new THREE.BoxGeometry(22, 1.0, 90);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x303238, roughness: 0.9, metalness: 0.2 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(0, -0.5, 0);
    platform.receiveShadow = true;
    this.group.add(platform);

    // Platform edge warning tactile yellow stripe
    const stripL = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 90),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    stripL.rotation.x = -Math.PI / 2;
    stripL.position.set(-10.2, 0.02, 0);
    this.group.add(stripL);

    const stripR = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 90),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    stripR.rotation.x = -Math.PI / 2;
    stripR.position.set(10.2, 0.02, 0);
    this.group.add(stripR);
  }

  private buildRailwayTracks() {
    const gravelMat = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.95 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });

    [-18, 18].forEach((trackX) => {
      // Lower track gravel trench
      const trench = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 90), gravelMat);
      trench.position.set(trackX, -0.8, 0);
      trench.receiveShadow = true;
      this.group.add(trench);

      // Steel rail bars
      [-2, 2].forEach((offset) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 90), railMat);
        rail.position.set(trackX + offset, -0.45, 0);
        this.group.add(rail);
      });
    });
  }

  private buildDerailedTrainCars() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x22303e, metalness: 0.85, roughness: 0.4 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x111e28 });

    // Derailed Train Car 1 (angled across track 1)
    const car1 = new THREE.Group();
    car1.position.set(-16, 0.8, -12);
    car1.rotation.y = 0.22;
    const body1 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 28), metalMat);
    body1.castShadow = true;
    body1.receiveShadow = true;
    car1.add(body1);
    this.group.add(car1);

    this.addCollider(
      new THREE.Vector3(-20, 0, -27),
      new THREE.Vector3(-12, 4.2, 3),
      'vehicle',
      body1
    );

    // Train Car 2 on other track
    const car2 = new THREE.Group();
    car2.position.set(17, 0.8, 16);
    car2.rotation.y = -0.15;
    const body2 = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 30), metalMat);
    body2.castShadow = true;
    body2.receiveShadow = true;
    car2.add(body2);
    this.group.add(car2);

    this.addCollider(
      new THREE.Vector3(13, 0, 0),
      new THREE.Vector3(21, 4.2, 32),
      'vehicle',
      body2
    );
  }

  private buildPlatformPillars() {
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });

    [-30, -15, 0, 15, 30].forEach((z) => {
      [-5, 5].forEach((x) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 8, 1.4), pillarMat);
        pillar.position.set(x, 4, z);
        pillar.castShadow = true;
        this.group.add(pillar);

        // Emergency blinking red strobe
        const strobe = new THREE.PointLight(0xff0044, 2.0, 12);
        strobe.position.set(x, 4.5, z);
        this.group.add(strobe);
        this.emergencyStrobes.push(strobe);

        this.addCollider(
          new THREE.Vector3(x - 0.75, 0, z - 0.75),
          new THREE.Vector3(x + 0.75, 8, z + 0.75),
          'structure',
          pillar
        );
      });
    });
  }

  private buildTurnstilesAndBenches() {
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });

    [-22, 22].forEach((z) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 4.5), benchMat);
      bench.position.set(0, 0.35, z);
      bench.castShadow = true;
      this.group.add(bench);

      this.addCollider(
        new THREE.Vector3(-0.9, 0, z - 2.4),
        new THREE.Vector3(0.9, 1.0, z + 2.4),
        'prop',
        bench
      );
    });
  }

  private buildPerimeterWalls() {
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const size = 46;
    const height = 10;

    const walls = [
      { pos: new THREE.Vector3(0, height / 2, -size), geo: new THREE.BoxGeometry(size * 2, height, 2) },
      { pos: new THREE.Vector3(0, height / 2, size), geo: new THREE.BoxGeometry(size * 2, height, 2) },
      { pos: new THREE.Vector3(-28, height / 2, 0), geo: new THREE.BoxGeometry(2, height, size * 2) },
      { pos: new THREE.Vector3(28, height / 2, 0), geo: new THREE.BoxGeometry(2, height, size * 2) },
    ];

    walls.forEach((w) => {
      const mesh = new THREE.Mesh(w.geo, tunnelMat);
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
    });
  }

  private buildExtractionZone() {
    const padGroup = new THREE.Group();
    padGroup.position.copy(this.extractionBeacon.pos);

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(4.8, 4.8, 0.25, 24),
      new THREE.MeshStandardMaterial({ color: 0x221835, metalness: 0.6 })
    );
    pad.position.y = 0.12;
    padGroup.add(pad);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 4.0, 24),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide })
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
      new THREE.Vector3(-7, 0, -10),
      new THREE.Vector3(7, 0, -10),
      new THREE.Vector3(-7, 0, 12),
      new THREE.Vector3(7, 0, 14),
      new THREE.Vector3(-12, 0, 2),
      new THREE.Vector3(12, 0, -2),
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
      { pos: new THREE.Vector3(0, 0, 6), type: 'AMMO' },
      { pos: new THREE.Vector3(0, 0, -16), type: 'HEALTH' },
      { pos: new THREE.Vector3(-10, 0, -30), type: 'PERK' },
      { pos: new THREE.Vector3(10, 0, -30), type: 'AMMO' },
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
    // Pulse emergency lights
    this.emergencyStrobes.forEach((strobe, idx) => {
      const pulse = Math.sin(time * 5 + idx * 0.8);
      strobe.intensity = pulse > 0.3 ? 2.5 : 0.2;
    });

    if (this.extractionBeacon.active) {
      this.extractionBeacon.light.intensity = 2.0 + Math.sin(time * 8) * 1.5;
    }
  }

  public dispose() {
    this.sceneRef.remove(this.group);
  }
}
