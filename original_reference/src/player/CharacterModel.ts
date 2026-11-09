import * as THREE from 'three';
import { WeaponType } from '../types/game';

export class CharacterModel {
  public root: THREE.Group;
  public isRemnant: boolean;
  public remnantColorHex: number;

  // Joints
  public pelvis!: THREE.Group;
  public spine!: THREE.Group;
  public head!: THREE.Group;
  public leftArmUpper!: THREE.Group;
  public leftArmLower!: THREE.Group;
  public rightArmUpper!: THREE.Group;
  public rightArmLower!: THREE.Group;
  public leftLegUpper!: THREE.Group;
  public leftLegLower!: THREE.Group;
  public rightLegUpper!: THREE.Group;
  public rightLegLower!: THREE.Group;
  public weaponSocket!: THREE.Group;

  // Weapon meshes
  private weaponMeshes: Map<WeaponType, THREE.Group> = new Map();
  public currentWeaponType: WeaponType = 'RIFLE';

  // Animation parameters
  private animTimer = 0;
  private currentAnim: string = 'idle';
  private shootRecoil = 0;
  private reloadProgress = 0;
  private isReloading = false;
  private meleeProgress = 0;
  private isMelee = false;

  // Materials list for opacity / glitch updates
  private materials: THREE.Material[] = [];

  constructor(
    isRemnant = false,
    remnantColorHex = 0x00ffee,
    public operativeType: 'P1' | 'P2' = 'P1'
  ) {
    this.isRemnant = isRemnant;
    this.remnantColorHex = remnantColorHex;
    this.root = new THREE.Group();

    this.buildRig();
    this.buildWeapons();
    this.setWeapon('RIFLE');
  }

  public triggerMelee() {
    this.isMelee = true;
    this.meleeProgress = 0;
  }

  private createMaterial(baseColor: number, roughness = 0.5, metalness = 0.2): THREE.Material {
    if (this.isRemnant) {
      const mat = new THREE.MeshStandardMaterial({
        color: this.remnantColorHex,
        emissive: this.remnantColorHex,
        emissiveIntensity: 0.75,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.65,
        wireframe: false,
        depthWrite: false,
      });
      this.materials.push(mat);
      return mat;
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness,
        metalness,
      });
      this.materials.push(mat);
      return mat;
    }
  }

  private buildRig() {
    const isP2 = this.operativeType === 'P2';
    const shirtColor = isP2 ? 0x443020 : 0x2a333d; // Tactical amber hazard vs tactical navy
    const vestColor = isP2 ? 0x251c16 : 0x1a1e24;  // Carbon amber vest vs ballistic vest
    const pantsColor = isP2 ? 0x383028 : 0x3e443b; // Desert dark vs olive camo
    const visorColor = isP2 ? 0xff9900 : 0x00e1ff; // Glowing visor

    // Colors
    const skinMat = this.createMaterial(0xd8a47f, 0.7, 0.1);
    const shirtMat = this.createMaterial(shirtColor, 0.8, 0.2);
    const vestMat = this.createMaterial(vestColor, 0.6, 0.4);
    const pantsMat = this.createMaterial(pantsColor, 0.9, 0.1);
    const bootMat = this.createMaterial(0x16181b, 0.8, 0.3);
    const gearMat = this.createMaterial(0x111317, 0.5, 0.6);

    // Root -> Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.0;
    this.root.add(this.pelvis);

    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.35), pantsMat);
    hips.castShadow = !this.isRemnant;
    this.pelvis.add(hips);

    // Spine & Torso
    this.spine = new THREE.Group();
    this.spine.position.y = 0.15;
    this.pelvis.add(this.spine);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.38), shirtMat);
    torso.position.y = 0.3;
    torso.castShadow = !this.isRemnant;
    this.spine.add(torso);

    // Tactical Vest with ammo pouches
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.45, 0.44), vestMat);
    vest.position.y = 0.3;
    vest.castShadow = !this.isRemnant;
    this.spine.add(vest);

    // Pouches on front
    for (let i = -1; i <= 1; i++) {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.1), gearMat);
      pouch.position.set(i * 0.18, 0.22, 0.26);
      this.spine.add(pouch);
    }

    // Backpack
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.24), vestMat);
    backpack.position.set(0, 0.35, -0.3);
    backpack.castShadow = !this.isRemnant;
    this.spine.add(backpack);

    // Head & Tactical Helmet / Comm headset
    this.head = new THREE.Group();
    this.head.position.y = 0.65;
    this.spine.add(this.head);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.32), skinMat);
    headMesh.position.y = 0.15;
    headMesh.castShadow = !this.isRemnant;
    this.head.add(headMesh);

    // Helmet & NVG Mount
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.36), vestMat);
    helmet.position.y = 0.24;
    helmet.castShadow = !this.isRemnant;
    this.head.add(helmet);

    // Goggles & Visor Glow
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.1), gearMat);
    goggles.position.set(0, 0.17, 0.18);
    this.head.add(goggles);

    const visorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.04, 0.03),
      new THREE.MeshBasicMaterial({ color: visorColor })
    );
    visorGlow.position.set(0, 0.17, 0.23);
    this.head.add(visorGlow);

    // Left Arm
    this.leftArmUpper = new THREE.Group();
    this.leftArmUpper.position.set(-0.4, 0.5, 0);
    this.spine.add(this.leftArmUpper);

    const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.18), shirtMat);
    lUpper.position.y = -0.18;
    lUpper.castShadow = !this.isRemnant;
    this.leftArmUpper.add(lUpper);

    this.leftArmLower = new THREE.Group();
    this.leftArmLower.position.y = -0.38;
    this.leftArmUpper.add(this.leftArmLower);

    const lLower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.16), skinMat);
    lLower.position.y = -0.18;
    lLower.castShadow = !this.isRemnant;
    this.leftArmLower.add(lLower);

    // Right Arm (Shooting Arm)
    this.rightArmUpper = new THREE.Group();
    this.rightArmUpper.position.set(0.4, 0.5, 0);
    this.spine.add(this.rightArmUpper);

    const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.18), shirtMat);
    rUpper.position.y = -0.18;
    rUpper.castShadow = !this.isRemnant;
    this.rightArmUpper.add(rUpper);

    this.rightArmLower = new THREE.Group();
    this.rightArmLower.position.y = -0.38;
    this.rightArmUpper.add(this.rightArmLower);

    const rLower = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.36, 0.16), skinMat);
    rLower.position.y = -0.18;
    rLower.castShadow = !this.isRemnant;
    this.rightArmLower.add(rLower);

    // Weapon Socket attached to right hand
    this.weaponSocket = new THREE.Group();
    this.weaponSocket.position.set(0, -0.34, 0.12);
    this.rightArmLower.add(this.weaponSocket);

    // Left Leg
    this.leftLegUpper = new THREE.Group();
    this.leftLegUpper.position.set(-0.2, 0, 0);
    this.pelvis.add(this.leftLegUpper);

    const lLegU = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), pantsMat);
    lLegU.position.y = -0.24;
    lLegU.castShadow = !this.isRemnant;
    this.leftLegUpper.add(lLegU);

    this.leftLegLower = new THREE.Group();
    this.leftLegLower.position.y = -0.48;
    this.leftLegUpper.add(this.leftLegLower);

    const lLegL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.2), pantsMat);
    lLegL.position.y = -0.22;
    lLegL.castShadow = !this.isRemnant;
    this.leftLegLower.add(lLegL);

    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.32), bootMat);
    lBoot.position.set(0, -0.46, 0.05);
    lBoot.castShadow = !this.isRemnant;
    this.leftLegLower.add(lBoot);

    // Right Leg
    this.rightLegUpper = new THREE.Group();
    this.rightLegUpper.position.set(0.2, 0, 0);
    this.pelvis.add(this.rightLegUpper);

    const rLegU = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), pantsMat);
    rLegU.position.y = -0.24;
    rLegU.castShadow = !this.isRemnant;
    this.rightLegUpper.add(rLegU);

    this.rightLegLower = new THREE.Group();
    this.rightLegLower.position.y = -0.48;
    this.rightLegUpper.add(this.rightLegLower);

    const rLegL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.2), pantsMat);
    rLegL.position.y = -0.22;
    rLegL.castShadow = !this.isRemnant;
    this.rightLegLower.add(rLegL);

    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.32), bootMat);
    rBoot.position.set(0, -0.46, 0.05);
    rBoot.castShadow = !this.isRemnant;
    this.rightLegLower.add(rBoot);
  }

  private buildWeapons() {
    const gunMetalMat = this.createMaterial(0x181a1f, 0.4, 0.8);
    const stockMat = this.createMaterial(0x3a2c20, 0.7, 0.1);
    const chromeMat = this.createMaterial(0x99a3ad, 0.2, 0.9);

    // 1. Pistol (Tactical P9)
    const pistol = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.32), gunMetalMat);
    pBody.position.set(0, 0.04, 0.1);
    pistol.add(pBody);
    const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.1), stockMat);
    pGrip.position.set(0, -0.06, 0);
    pGrip.rotation.x = -0.3;
    pistol.add(pGrip);
    this.weaponSocket.add(pistol);
    this.weaponMeshes.set('PISTOL', pistol);

    // 2. Assault Rifle (AR-15)
    const rifle = new THREE.Group();
    const rReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.75), gunMetalMat);
    rReceiver.position.set(0, 0.05, 0.15);
    rifle.add(rReceiver);
    const rBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), gunMetalMat);
    rBarrel.rotation.x = Math.PI / 2;
    rBarrel.position.set(0, 0.07, 0.65);
    rifle.add(rBarrel);
    const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.14), gunMetalMat);
    rMag.position.set(0, -0.12, 0.22);
    rMag.rotation.x = 0.2;
    rifle.add(rMag);
    const rStock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.3), stockMat);
    rStock.position.set(0, 0.04, -0.3);
    rifle.add(rStock);
    this.weaponSocket.add(rifle);
    this.weaponMeshes.set('RIFLE', rifle);

    // 3. Shotgun (Havoc 12G)
    const shotgun = new THREE.Group();
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.18, 0.8), gunMetalMat);
    sBody.position.set(0, 0.05, 0.15);
    shotgun.add(sBody);
    const sBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), chromeMat);
    sBarrel.rotation.x = Math.PI / 2;
    sBarrel.position.set(0, 0.09, 0.65);
    shotgun.add(sBarrel);
    this.weaponSocket.add(shotgun);
    this.weaponMeshes.set('SHOTGUN', shotgun);

    // 4. SMG (Vector 9)
    const smg = new THREE.Group();
    const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.45), gunMetalMat);
    smgBody.position.set(0, 0.06, 0.12);
    smg.add(smgBody);
    const smgMag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.09), gunMetalMat);
    smgMag.position.set(0, -0.15, 0.15);
    smg.add(smgMag);
    this.weaponSocket.add(smg);
    this.weaponMeshes.set('SMG', smg);

    // 5. Special Launcher
    const launcher = new THREE.Group();
    const lBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 10), gunMetalMat);
    lBody.rotation.x = Math.PI / 2;
    lBody.position.set(0, 0.08, 0.2);
    launcher.add(lBody);
    const lGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.15, 10), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
    lGlow.rotation.x = Math.PI / 2;
    lGlow.position.set(0, 0.08, 0.2);
    launcher.add(lGlow);
    this.weaponSocket.add(launcher);
    this.weaponMeshes.set('LAUNCHER', launcher);
  }

  public setWeapon(type: WeaponType) {
    this.currentWeaponType = type;
    this.weaponMeshes.forEach((mesh, wType) => {
      mesh.visible = wType === type;
    });
  }

  public getMuzzleWorldPosition(): THREE.Vector3 {
    const muzzle = new THREE.Vector3(0, 0.08, 0.65);
    return this.weaponSocket.localToWorld(muzzle);
  }

  public triggerShootRecoil() {
    this.shootRecoil = 1.0;
  }

  public triggerReload() {
    this.isReloading = true;
    this.reloadProgress = 0;
  }

  public updateAnimation(
    dt: number,
    state: 'idle' | 'walk' | 'run' | 'sprint' | 'dash' | 'reload' | 'hit' | 'death' | 'downed',
    pitch: number,
    isAiming: boolean
  ) {
    this.currentAnim = state;
    this.animTimer += dt;

    // Decay recoil
    if (this.shootRecoil > 0) {
      this.shootRecoil = Math.max(0, this.shootRecoil - dt * 6.5);
    }

    // Decay reload
    if (this.isReloading) {
      this.reloadProgress += dt * 1.3;
      if (this.reloadProgress >= 1.0) {
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }

    // Glitch temporal opacity pulse for remnants
    if (this.isRemnant) {
      const pulse = 0.55 + Math.sin(this.animTimer * 10) * 0.2;
      this.materials.forEach((mat) => {
        if ('opacity' in mat) {
          mat.opacity = pulse;
        }
      });
    }

    if (state === 'downed') {
      // Crawling / downed pose on hands and knees
      this.pelvis.position.y = THREE.MathUtils.lerp(this.pelvis.position.y, 0.45, dt * 6);
      this.spine.rotation.x = 0.55;
      this.leftArmUpper.rotation.x = -1.1;
      this.rightArmUpper.rotation.x = -0.5;
      this.leftLegUpper.rotation.x = 1.3;
      this.rightLegUpper.rotation.x = 1.3;
      return;
    }

    if (state === 'death') {
      // Collapse animation
      this.pelvis.position.y = THREE.MathUtils.lerp(this.pelvis.position.y, 0.2, dt * 5);
      this.pelvis.rotation.x = THREE.MathUtils.lerp(this.pelvis.rotation.x, -Math.PI / 2, dt * 5);
      this.spine.rotation.x = THREE.MathUtils.lerp(this.spine.rotation.x, 0.3, dt * 5);
      return;
    }

    // Base posture reset
    this.pelvis.position.y = 1.0;
    this.pelvis.rotation.set(0, 0, 0);

    // Aim Upper Body pitch tracking
    this.spine.rotation.x = -pitch * 0.75;
    this.head.rotation.x = -pitch * 0.25;

    // Speed multiplier based on state
    let speed = 0;
    if (state === 'walk') speed = 4;
    else if (state === 'run') speed = 8;
    else if (state === 'sprint') speed = 12;

    const legSwing = Math.sin(this.animTimer * speed);

    if (speed > 0) {
      // Leg movement
      this.leftLegUpper.rotation.x = legSwing * 0.65;
      this.leftLegLower.rotation.x = Math.max(0, -legSwing * 0.8);

      this.rightLegUpper.rotation.x = -legSwing * 0.65;
      this.rightLegLower.rotation.x = Math.max(0, legSwing * 0.8);

      // Pelvis subtle bobbing
      this.pelvis.position.y = 1.0 + Math.abs(Math.sin(this.animTimer * speed)) * 0.06;
    } else {
      // Idle breathing
      const breath = Math.sin(this.animTimer * 2.2) * 0.03;
      this.leftLegUpper.rotation.x = 0;
      this.leftLegLower.rotation.x = 0;
      this.rightLegUpper.rotation.x = 0;
      this.rightLegLower.rotation.x = 0;

      this.spine.position.y = 0.15 + breath;
    }

    // Arm Aiming & Holding Weapon Stance
    const recoilOffset = this.shootRecoil * 0.18;
    const aimIntensity = isAiming ? 1.0 : 0.6;

    if (this.isMelee) {
      this.meleeProgress += dt * 3.8;
      const strike = Math.sin(this.meleeProgress * Math.PI);
      this.rightArmUpper.rotation.x = -Math.PI / 2.2 - strike * 0.7;
      this.rightArmUpper.rotation.y = strike * 0.6;
      this.rightArmLower.rotation.x = -0.1 - strike * 0.8;
      this.spine.rotation.y = strike * 0.4;
      if (this.meleeProgress >= 1.0) {
        this.isMelee = false;
        this.meleeProgress = 0;
      }
    } else {
      // Right arm brings weapon up
      this.rightArmUpper.rotation.x = -Math.PI / 2.3 + recoilOffset;
      this.rightArmUpper.rotation.y = -0.2 * aimIntensity;
      this.rightArmUpper.rotation.z = 0.1;
      this.rightArmLower.rotation.x = -0.3 + recoilOffset * 0.5;
    }

    // Left arm supports gun foregrip
    if (this.isReloading) {
      // Reload movement: left arm dips down to grab mag
      const dip = Math.sin(this.reloadProgress * Math.PI);
      this.leftArmUpper.rotation.x = -0.2 - dip * 0.6;
      this.leftArmUpper.rotation.y = 0.4 + dip * 0.4;
      this.leftArmLower.rotation.x = -0.8 + dip * 0.8;
    } else if (!this.isMelee) {
      this.leftArmUpper.rotation.x = -Math.PI / 2.5;
      this.leftArmUpper.rotation.y = 0.55;
      this.leftArmUpper.rotation.z = -0.2;
      this.leftArmLower.rotation.x = -0.9;
    }

    // Dash roll
    if (state === 'dash') {
      this.pelvis.position.y = 0.6;
      this.spine.rotation.x = 0.6;
    }
  }
}
