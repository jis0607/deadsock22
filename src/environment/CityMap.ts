import * as THREE from 'three';

export interface CollidableBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  type: 'wall' | 'vehicle' | 'prop' | 'barrel';
  objectRef?: THREE.Object3D;
  hp?: number; // for explosive barrels
  exploded?: boolean;
}

export interface InteractiveSupplyCrate {
  position: THREE.Vector3;
  mesh: THREE.Group;
  type: 'AMMO' | 'HEALTH' | 'PERK';
  opened: boolean;
  colliderRef?: CollidableBox;
}

export class CityMap {
  public group: THREE.Group;
  public colliders: CollidableBox[] = [];
  public explosiveBarrels: { mesh: THREE.Group; pos: THREE.Vector3; hp: number; exploded: boolean }[] = [];
  public supplyCrates: InteractiveSupplyCrate[] = [];
  public extractionBeacon: { mesh: THREE.Group; light: THREE.PointLight; pos: THREE.Vector3; active: boolean };

  private dynamicLights: { light: THREE.PointLight; baseIntensity: number; flicker: boolean; speed: number }[] = [];
  private sceneRef: THREE.Scene;

  // Lighting References
  public currentLightingMode: 'DAY' | 'NIGHT' = 'DAY';
  private sunLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private hemiLight!: THREE.HemisphereLight;

  constructor(scene: THREE.Scene, initialLightingMode: 'DAY' | 'NIGHT' = 'DAY') {
    this.sceneRef = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    // Initial dummy extraction beacon
    this.extractionBeacon = {
      mesh: new THREE.Group(),
      light: new THREE.PointLight(0xff0033, 0, 15),
      pos: new THREE.Vector3(22, 0, -22),
      active: false,
    };

    this.buildLighting(scene);
    this.setLightingMode(initialLightingMode);
    this.buildGroundAndStreets();
    this.buildGasStation();
    this.buildApexMartStore();
    this.buildVehiclesAndBarricades();
    this.buildAlleyAndDumpsters();
    this.buildExtractionZone();
    this.buildExplosiveBarrels();
    this.buildSupplyCrates();
  }

  private buildLighting(scene: THREE.Scene) {
    // 1. Primary Directional Sunlight / Moonlight
    this.sunLight = new THREE.DirectionalLight(0xfff5dd, 2.4);
    this.sunLight.position.set(35, 55, 25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 130;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.bias = -0.0004;
    this.group.add(this.sunLight);

    // 2. Ambient Sky Fill Light
    this.ambientLight = new THREE.AmbientLight(0x95c2f0, 1.35);
    this.group.add(this.ambientLight);

    // 3. Hemisphere Ground Bounce Fill
    this.hemiLight = new THREE.HemisphereLight(0x8ec5fc, 0x5a4836, 0.85);
    this.group.add(this.hemiLight);
  }

  public setLightingMode(mode: 'DAY' | 'NIGHT') {
    this.currentLightingMode = mode;
    if (mode === 'DAY') {
      // Crisp, radiant sunny daytime with sharp visibility
      this.sceneRef.background = new THREE.Color(0x6ca6e8);
      this.sceneRef.fog = new THREE.FogExp2(0x8cbdf0, 0.0075);

      this.sunLight.color.setHex(0xfff8e7);
      this.sunLight.intensity = 2.4;
      this.sunLight.position.set(35, 60, 25);

      this.ambientLight.color.setHex(0xa0c8f8);
      this.ambientLight.intensity = 1.35;

      this.hemiLight.color.setHex(0x90c5ff);
      this.hemiLight.groundColor.setHex(0x5a4836);
      this.hemiLight.intensity = 0.85;

      // Dim artificial streetlights in daytime
      this.dynamicLights.forEach((dl) => {
        dl.light.intensity = dl.baseIntensity * 0.4;
      });
    } else {
      // Atmospheric dark midnight with neon reflections & moonlight
      this.sceneRef.background = new THREE.Color(0x0a101d);
      this.sceneRef.fog = new THREE.FogExp2(0x0a101d, 0.022);

      this.sunLight.color.setHex(0x4a6fa5);
      this.sunLight.intensity = 0.9;
      this.sunLight.position.set(-30, 45, -25);

      this.ambientLight.color.setHex(0x18243b);
      this.ambientLight.intensity = 0.65;

      this.hemiLight.color.setHex(0x283850);
      this.hemiLight.groundColor.setHex(0x0e141e);
      this.hemiLight.intensity = 0.25;

      // Restore full streetlight intensity
      this.dynamicLights.forEach((dl) => {
        dl.light.intensity = dl.baseIntensity;
      });
    }
  }

  public toggleLightingMode(): 'DAY' | 'NIGHT' {
    const next = this.currentLightingMode === 'DAY' ? 'NIGHT' : 'DAY';
    this.setLightingMode(next);
    return next;
  }

  private buildGroundAndStreets() {
    // Wet asphalt ground with subtle shine
    const groundGeo = new THREE.PlaneGeometry(120, 120, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      roughness: 0.28, // wet slick surface
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Sidewalk curbs and borders
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x333842, roughness: 0.8 });
    
    // Main street sidewalk north
    const curb1 = new THREE.Mesh(new THREE.BoxGeometry(90, 0.25, 2.5), curbMat);
    curb1.position.set(0, 0.125, -28);
    curb1.receiveShadow = true;
    this.group.add(curb1);

    // Main street sidewalk south
    const curb2 = new THREE.Mesh(new THREE.BoxGeometry(90, 0.25, 2.5), curbMat);
    curb2.position.set(0, 0.125, 28);
    curb2.receiveShadow = true;
    this.group.add(curb2);

    // Outer boundary walls to keep combat contained and prevent infinite falling
    const boundaryMat = new THREE.MeshStandardMaterial({ color: 0x1f242e, roughness: 0.9 });
    const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(100, 7, 2), boundaryMat);
    wallNorth.position.set(0, 3.5, -45);
    this.group.add(wallNorth);
    this.addCollider(new THREE.Vector3(-50, 0, -46), new THREE.Vector3(50, 7, -44), 'wall');

    const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(100, 7, 2), boundaryMat);
    wallSouth.position.set(0, 3.5, 45);
    this.group.add(wallSouth);
    this.addCollider(new THREE.Vector3(-50, 0, 44), new THREE.Vector3(50, 7, 46), 'wall');

    const wallWest = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 100), boundaryMat);
    wallWest.position.set(-45, 3.5, 0);
    this.group.add(wallWest);
    this.addCollider(new THREE.Vector3(-46, 0, -50), new THREE.Vector3(-44, 7, 50), 'wall');

    const wallEast = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 100), boundaryMat);
    wallEast.position.set(45, 3.5, 0);
    this.group.add(wallEast);
    this.addCollider(new THREE.Vector3(44, 0, -50), new THREE.Vector3(46, 7, 50), 'wall');

    // Parking lot stripe lines
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xc8a432, transparent: true, opacity: 0.65 });
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5), stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i * 3.8 - 8, 0.015, 12);
      this.group.add(stripe);
    }
  }

  private buildGasStation() {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(-10, 0, -8);

    // Large illuminated overhead canopy
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x222730, roughness: 0.6, metalness: 0.3 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 14), canopyMat);
    canopy.position.set(0, 6.2, 0);
    canopy.castShadow = true;
    stationGroup.add(canopy);

    // Canopy glowing edge logo / neon trim
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00e1d9 });
    const trimNorth = new THREE.Mesh(new THREE.BoxGeometry(22.2, 0.25, 0.1), neonMat);
    trimNorth.position.set(0, 6.2, -7.05);
    stationGroup.add(trimNorth);

    const trimSouth = new THREE.Mesh(new THREE.BoxGeometry(22.2, 0.25, 0.1), neonMat);
    trimSouth.position.set(0, 6.2, 7.05);
    stationGroup.add(trimSouth);

    // 4 Heavy Support Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3d434f, roughness: 0.5, metalness: 0.5 });
    const pillarCoords = [
      [-8, -4.5],
      [8, -4.5],
      [-8, 4.5],
      [8, 4.5],
    ];

    pillarCoords.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 6, 12), pillarMat);
      pillar.position.set(px, 3, pz);
      pillar.castShadow = true;
      stationGroup.add(pillar);

      // Yellow safety base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0xbfa01e }));
      base.position.set(px, 0.4, pz);
      stationGroup.add(base);

      this.addCollider(
        new THREE.Vector3(stationGroup.position.x + px - 0.7, 0, stationGroup.position.z + pz - 0.7),
        new THREE.Vector3(stationGroup.position.x + px + 0.7, 6, stationGroup.position.z + pz + 0.7),
        'prop'
      );
    });

    // 4 Detailed Dual-Pump Fuel Islands
    const pumpMat = new THREE.MeshStandardMaterial({ color: 0x1e222b, roughness: 0.4, metalness: 0.7 });
    const pumpScreenMat = new THREE.MeshBasicMaterial({ color: 0x44ffaa });

    const pumpPositions = [
      [-4, -3],
      [4, -3],
      [-4, 3],
      [4, 3],
    ];

    pumpPositions.forEach(([px, pz], idx) => {
      // Concrete island slab
      const island = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.4), new THREE.MeshStandardMaterial({ color: 0x495057 }));
      island.position.set(px, 0.175, pz);
      island.receiveShadow = true;
      stationGroup.add(island);

      // Main pump housing
      const pumpBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.8), pumpMat);
      pumpBody.position.set(px, 1.25, pz);
      pumpBody.castShadow = true;
      stationGroup.add(pumpBody);

      // Digital display screens
      const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), pumpScreenMat);
      screen1.position.set(px, 1.7, pz + 0.41);
      stationGroup.add(screen1);

      const screen2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), pumpScreenMat);
      screen2.position.set(px, 1.7, pz - 0.41);
      screen2.rotation.y = Math.PI;
      stationGroup.add(screen2);

      // Yellow top banner
      const topBanner = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.3, 0.82), new THREE.MeshStandardMaterial({ color: 0xc89b14 }));
      topBanner.position.set(px, 2.3, pz);
      stationGroup.add(topBanner);

      this.addCollider(
        new THREE.Vector3(stationGroup.position.x + px - 1.2, 0, stationGroup.position.z + pz - 0.7),
        new THREE.Vector3(stationGroup.position.x + px + 1.2, 2.5, stationGroup.position.z + pz + 0.7),
        'prop'
      );
    });

    // Flickering overhead fluorescent gas station lights
    const light1 = new THREE.PointLight(0xffeedd, 2.2, 18, 1.2);
    light1.position.set(-4, 5.4, 0);
    stationGroup.add(light1);
    this.dynamicLights.push({ light: light1, baseIntensity: 2.2, flicker: true, speed: 18 });

    const light2 = new THREE.PointLight(0xffeedd, 2.0, 18, 1.2);
    light2.position.set(4, 5.4, 0);
    stationGroup.add(light2);
    this.dynamicLights.push({ light: light2, baseIntensity: 2.0, flicker: true, speed: 25 });

    this.group.add(stationGroup);
  }

  private buildApexMartStore() {
    const storeGroup = new THREE.Group();
    storeGroup.position.set(16, 0, -8);

    // Main Store Building Block
    const storeWallMat = new THREE.MeshStandardMaterial({ color: 0x2b303c, roughness: 0.8 });
    const storeRoof = new THREE.Mesh(new THREE.BoxGeometry(18, 5.5, 16), storeWallMat);
    storeRoof.position.set(0, 2.75, 0);
    storeRoof.castShadow = true;
    storeRoof.receiveShadow = true;
    storeGroup.add(storeRoof);

    // Large glass storefront on West side (facing gas station)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x112233,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.6,
    });
    const glassFront = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.8, 10), glassMat);
    glassFront.position.set(-9.05, 2.0, 0);
    storeGroup.add(glassFront);

    // Glowing Convenience Store interior light (eerie sickly green / warm fluorescent)
    const storeInteriorLight = new THREE.PointLight(0x66ffaa, 1.6, 14);
    storeInteriorLight.position.set(-4, 3.5, 0);
    storeGroup.add(storeInteriorLight);
    this.dynamicLights.push({ light: storeInteriorLight, baseIntensity: 1.6, flicker: true, speed: 12 });

    // Store rooftop neon sign: "APEX MART"
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(8, 1.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x111317 }));
    signBox.position.set(-4, 6.2, -8.1);
    storeGroup.add(signBox);

    const signNeon = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.2, 0.45), new THREE.MeshBasicMaterial({ color: 0xff0055 }));
    signNeon.position.set(-4, 6.2, -8.1);
    storeGroup.add(signNeon);

    // Add solid building collider
    this.addCollider(
      new THREE.Vector3(storeGroup.position.x - 9, 0, storeGroup.position.z - 8),
      new THREE.Vector3(storeGroup.position.x + 9, 6, storeGroup.position.z + 8),
      'wall'
    );

    this.group.add(storeGroup);
  }

  private buildVehiclesAndBarricades() {
    // Vehicle 1: Abandoned Sedan in Parking Lot
    this.createCarMesh(new THREE.Vector3(-14, 0, 16), 0.35, 0x1b3248);

    // Vehicle 2: Police Cruiser near intersection
    this.createCarMesh(new THREE.Vector3(4, 0, 18), -0.6, 0x15161a, true);

    // Vehicle 3: Crashed SUV near alley entrance
    this.createCarMesh(new THREE.Vector3(-24, 0, -18), 1.2, 0x48221b);

    // Police Barricades & Traffic Cones
    this.createBarricade(new THREE.Vector3(-4, 0, 26), 0);
    this.createBarricade(new THREE.Vector3(2, 0, 26), 0);
    this.createBarricade(new THREE.Vector3(8, 0, 26), 0.2);

    this.createTrafficCone(new THREE.Vector3(-6, 0, 24));
    this.createTrafficCone(new THREE.Vector3(0, 0, 24));
    this.createTrafficCone(new THREE.Vector3(6, 0, 24));
  }

  private createCarMesh(pos: THREE.Vector3, rotY: number, colorHex: number, isPolice = false) {
    const carGroup = new THREE.Group();
    carGroup.position.copy(pos);
    carGroup.rotation.y = rotY;

    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x11161d, roughness: 0.1, metalness: 0.9 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    // Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.4), bodyMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Cabin / Roof
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 2.3), bodyMat);
    cabin.position.set(0, 1.35, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Windshields
    const frontWindshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 0.2), glassMat);
    frontWindshield.position.set(0, 1.3, 0.95);
    frontWindshield.rotation.x = 0.35;
    carGroup.add(frontWindshield);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.35, 12);
    const wheelPositions = [
      [-1.0, 0.38, 1.3],
      [1.0, 0.38, 1.3],
      [-1.0, 0.38, -1.3],
      [1.0, 0.38, -1.3],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      carGroup.add(wheel);
    });

    // Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), headlightMat);
    hl1.position.set(-0.7, 0.7, 2.21);
    carGroup.add(hl1);
    const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), headlightMat);
    hl2.position.set(0.7, 0.7, 2.21);
    carGroup.add(hl2);

    if (isPolice) {
      const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.3), new THREE.MeshBasicMaterial({ color: 0x0066ff }));
      lightbar.position.set(0, 1.75, -0.2);
      carGroup.add(lightbar);

      // Flickering blue emergency strobe
      const policeLight = new THREE.PointLight(0x0088ff, 1.8, 12);
      policeLight.position.set(0, 2.0, -0.2);
      carGroup.add(policeLight);
      this.dynamicLights.push({ light: policeLight, baseIntensity: 1.8, flicker: true, speed: 30 });
    }

    this.group.add(carGroup);

    // Collider
    this.addCollider(
      new THREE.Vector3(pos.x - 1.3, 0, pos.z - 2.4),
      new THREE.Vector3(pos.x + 1.3, 2.0, pos.z + 2.4),
      'vehicle',
      carGroup
    );
  }

  private createBarricade(pos: THREE.Vector3, rotY: number) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = rotY;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a606d, roughness: 0.8 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcc8800, roughness: 0.6 });

    // Feet
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.8), woodMat);
    leg1.position.set(-1.2, 0.55, 0);
    group.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.8), woodMat);
    leg2.position.set(1.2, 0.55, 0);
    group.add(leg2);

    // Cross planks
    const plank1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 0.08), stripeMat);
    plank1.position.set(0, 0.8, 0);
    group.add(plank1);

    const plank2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 0.08), stripeMat);
    plank2.position.set(0, 0.45, 0);
    group.add(plank2);

    this.group.add(group);

    this.addCollider(
      new THREE.Vector3(pos.x - 1.4, 0, pos.z - 0.4),
      new THREE.Vector3(pos.x + 1.4, 1.2, pos.z + 0.4),
      'prop'
    );
  }

  private createTrafficCone(pos: THREE.Vector3) {
    const coneGeo = new THREE.ConeGeometry(0.25, 0.75, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.4 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(pos.x, 0.375, pos.z);
    cone.castShadow = true;
    this.group.add(cone);
  }

  private buildAlleyAndDumpsters() {
    // Alley behind Apex Mart (East side)
    const alleyDumpster1 = this.createDumpster(new THREE.Vector3(26, 0, 4), 0);
    const alleyDumpster2 = this.createDumpster(new THREE.Vector3(26, 0, -14), Math.PI);

    // Steam vent particle origin point
    const steamPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 8), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
    steamPipe.position.set(24.5, 1.5, 0);
    this.group.add(steamPipe);
  }

  private createDumpster(pos: THREE.Vector3, rotY: number) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = rotY;

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f3b2b, roughness: 0.6, metalness: 0.4 });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.4), metalMat);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 1.5), lidMat);
    lid.position.set(0, 1.55, 0);
    lid.rotation.x = -0.15;
    group.add(lid);

    this.group.add(group);

    this.addCollider(
      new THREE.Vector3(pos.x - 1.2, 0, pos.z - 0.8),
      new THREE.Vector3(pos.x + 1.2, 1.6, pos.z + 0.8),
      'prop'
    );
    return group;
  }

  private buildExtractionZone() {
    const extractGroup = new THREE.Group();
    extractGroup.position.set(24, 0, 24);

    // Helipad ring on ground
    const ringGeo = new THREE.RingGeometry(3.5, 3.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    extractGroup.add(ring);

    // Helipad "H" marking
    const hMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.0), hMat);
    hLeft.rotation.x = -Math.PI / 2;
    hLeft.position.set(-1.0, 0.025, 0);
    extractGroup.add(hLeft);

    const hRight = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.0), hMat);
    hRight.rotation.x = -Math.PI / 2;
    hRight.position.set(1.0, 0.025, 0);
    extractGroup.add(hRight);

    const hBar = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), hMat);
    hBar.rotation.x = -Math.PI / 2;
    hBar.position.set(0, 0.025, 0);
    extractGroup.add(hBar);

    // Siren Tower Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5, 8), new THREE.MeshStandardMaterial({ color: 0x333 }));
    pole.position.set(3.2, 2.25, 3.2);
    extractGroup.add(pole);

    // Red Siren Light Dome
    const beaconDome = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xff1122 }));
    beaconDome.position.set(3.2, 4.6, 3.2);
    extractGroup.add(beaconDome);

    const beaconLight = new THREE.PointLight(0xff1122, 0, 16);
    beaconLight.position.set(3.2, 4.8, 3.2);
    extractGroup.add(beaconLight);

    this.extractionBeacon = {
      mesh: extractGroup,
      light: beaconLight,
      pos: new THREE.Vector3(24, 0, 24),
      active: false,
    };

    // Sandbags surrounding beacon corner
    const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x8a7b60, roughness: 0.95 });
    for (let i = 0; i < 4; i++) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.6), sandbagMat);
      bag.position.set(24 + i * 1.3, 0.2, 19);
      this.group.add(bag);
    }
    this.addCollider(new THREE.Vector3(23, 0, 18.5), new THREE.Vector3(29, 0.8, 19.5), 'prop');

    this.group.add(extractGroup);
  }

  private buildExplosiveBarrels() {
    const barrelLocations = [
      new THREE.Vector3(-18, 0, 6),
      new THREE.Vector3(-3, 0, 6),
      new THREE.Vector3(7, 0, -22),
      new THREE.Vector3(-22, 0, -6),
      new THREE.Vector3(18, 0, 14),
    ];

    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.4, metalness: 0.6 });
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    barrelLocations.forEach((pos) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      // Barrel Drum
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), barrelMat);
      drum.position.y = 0.6;
      drum.castShadow = true;
      group.add(drum);

      // Yellow hazard stripe
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.2, 12), hazardMat);
      stripe.position.y = 0.6;
      group.add(stripe);

      this.group.add(group);

      this.explosiveBarrels.push({
        mesh: group,
        pos: pos.clone(),
        hp: 30,
        exploded: false,
      });

      this.addCollider(
        new THREE.Vector3(pos.x - 0.45, 0, pos.z - 0.45),
        new THREE.Vector3(pos.x + 0.45, 1.3, pos.z + 0.45),
        'barrel',
        group
      );
    });
  }

  private buildSupplyCrates() {
    const crateLocations: { pos: THREE.Vector3; type: 'AMMO' | 'HEALTH' | 'PERK' }[] = [
      { pos: new THREE.Vector3(-8, 0, 2), type: 'AMMO' },
      { pos: new THREE.Vector3(22, 0, -6), type: 'HEALTH' },
      { pos: new THREE.Vector3(-20, 0, 22), type: 'PERK' },
    ];

    crateLocations.forEach(({ pos, type }) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      const color = type === 'AMMO' ? 0x228833 : type === 'HEALTH' ? 0xcc2222 : 0xaa22dd;
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.5 });

      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.7), mat);
      crate.position.y = 0.3;
      crate.castShadow = true;
      group.add(crate);

      // Holographic glow ring on top
      const beaconLight = new THREE.PointLight(color, 0.8, 4);
      beaconLight.position.set(0, 0.8, 0);
      group.add(beaconLight);

      const collider = this.addCollider(
        new THREE.Vector3(pos.x - 0.5, 0, pos.z - 0.4),
        new THREE.Vector3(pos.x + 0.5, 0.7, pos.z + 0.4),
        'prop',
        group
      );

      this.supplyCrates.push({
        position: pos.clone(),
        mesh: group,
        type,
        opened: false,
        colliderRef: collider,
      });
    });
  }

  public removeCollider(target: CollidableBox | THREE.Object3D) {
    const idx = this.colliders.findIndex(
      (c) => c === target || (c.objectRef && c.objectRef === target)
    );
    if (idx !== -1) {
      this.colliders.splice(idx, 1);
    }
  }

  public isPlayerInExtractionZone(pos: THREE.Vector3, zoneRadius = 6.5): boolean {
    if (!this.extractionBeacon.active) return false;
    const d = pos.distanceTo(this.extractionBeacon.pos);
    return d <= zoneRadius;
  }

  public activateExtraction() {
    this.extractionBeacon.active = true;
    this.extractionBeacon.light.intensity = 2.5;
  }

  public deactivateExtraction() {
    this.extractionBeacon.active = false;
    this.extractionBeacon.light.intensity = 0;
  }

  public update(dt: number, time: number) {
    // 1. Update Flickering Dynamic Lights
    this.dynamicLights.forEach(({ light, baseIntensity, flicker, speed }) => {
      if (flicker) {
        const noise = Math.sin(time * speed) * Math.cos(time * speed * 0.6);
        const glitch = Math.random() < 0.03 ? 0.2 : 1.0;
        light.intensity = Math.max(0.2, baseIntensity * (0.85 + 0.15 * noise) * glitch);
      }
    });

    // 2. Update Extraction Siren rotation/pulse if active
    if (this.extractionBeacon.active) {
      const pulse = 1.5 + Math.sin(time * 8) * 1.2;
      this.extractionBeacon.light.intensity = pulse;
    }
  }

  public addCollider(min: THREE.Vector3, max: THREE.Vector3, type: CollidableBox['type'], objectRef?: THREE.Object3D): CollidableBox {
    const box: CollidableBox = { min, max, type, objectRef };
    this.colliders.push(box);
    return box;
  }

  // Check 2D AABB / Circle collision for entity movement
  public checkCollision(pos: THREE.Vector3, radius: number): { hit: boolean; pushOut: THREE.Vector3; collider?: CollidableBox } {
    const pushOut = new THREE.Vector3();
    let hit = false;
    let hitCollider: CollidableBox | undefined;

    for (const c of this.colliders) {
      // Find closest point on AABB to circle center
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
}
