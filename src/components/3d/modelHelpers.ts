import * as THREE from 'three';
import { PlayerCosmeticLoadout, GunSkin } from '../../types/game';
import { GUN_SKINS, CHARACTER_COSMETICS } from '../../data/cosmeticsData';

// Cache procedural CanvasTextures to avoid re-creating them repeatedly
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getProceduralSkinTexture(patternType: GunSkin['patternType'], colorHex: string, accentHex: string): THREE.CanvasTexture {
  const cacheKey = `${patternType}_${colorHex}_${accentHex}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);

  if (patternType === 'digital_camo') {
    // Pixelated camouflage blocks
    const colors = [colorHex, accentHex, '#0f172a', '#475569'];
    for (let x = 0; x < 256; x += 16) {
      for (let y = 0; y < 256; y += 16) {
        if (Math.random() > 0.45) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x, y, 16 + (Math.random() > 0.7 ? 16 : 0), 16 + (Math.random() > 0.7 ? 16 : 0));
        }
      }
    }
  } else if (patternType === 'desert_brush') {
    // Arid desert brush strokes
    ctx.fillStyle = accentHex;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const w = 30 + Math.random() * 60;
      const h = 8 + Math.random() * 15;
      ctx.ellipse(x, y, w / 2, h / 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (patternType === 'woodland_splinter') {
    // Angular splinter woodland shapes
    ctx.fillStyle = accentHex;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40, y + 20);
      ctx.lineTo(x + 20, y + 50);
      ctx.closePath();
      ctx.fill();
    }
  } else if (patternType === 'arctic_mesh') {
    // Winter polygon ice mesh
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.strokeRect(Math.random() * 200, Math.random() * 200, 30 + Math.random() * 40, 30 + Math.random() * 40);
    }
  } else if (patternType === 'carbon_weave') {
    // Carbon fiber twill weave
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#1c1c1e';
    for (let x = 0; x < 256; x += 8) {
      for (let y = 0; y < 256; y += 8) {
        if ((x + y) % 16 === 0) {
          ctx.fillRect(x, y, 6, 6);
        }
      }
    }
  } else if (patternType === 'gold_specular') {
    // Gold engraving filigree
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(128, 128, 20 + i * 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (patternType === 'inferno_flame') {
    // Volcanic magma veins
    ctx.fillStyle = '#260404';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 10;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, 0);
      ctx.bezierCurveTo(Math.random() * 256, 80, Math.random() * 256, 160, Math.random() * 256, 256);
      ctx.stroke();
    }
  } else if (patternType === 'frost_ice') {
    // Crystalline frost fractures
    ctx.fillStyle = '#082f49';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50);
      ctx.stroke();
    }
  } else if (patternType === 'neon_grid') {
    // Cyberpunk neon circuit traces
    ctx.fillStyle = '#0f051d';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 3;
    ctx.shadowColor = accentHex;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }
  } else if (patternType === 'chrono_void') {
    // Tachyon starlight singularity
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 130);
    grad.addColorStop(0, accentHex);
    grad.addColorStop(0.6, '#1e1b4b');
    grad.addColorStop(1, '#050508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Procedural 3D character generator with Modular Cosmetics (Helmet, Mask, Backpack, Accessory, Outfit)
export function createCharacterMesh(
  characterId: string,
  colorHex: string = '#06b6d4',
  skinColorHex: string = '#1e293b',
  cosmetics?: PlayerCosmeticLoadout
): THREE.Group {
  const group = new THREE.Group();

  const outfitId = cosmetics?.outfitId || 'outfit_urban_bdu';
  const helmetId = cosmetics?.helmetId || 'helm_fast_ballistic';
  const maskId = cosmetics?.maskId || 'mask_skull_half';
  const backpackId = cosmetics?.backpackId || 'pack_assault';
  const accessoryId = cosmetics?.accessoryId || 'acc_radio';
  const weaponSkinId = cosmetics?.weaponSkinId || 'skin_mil_urban';

  // Find cosmetic item configs
  const outfitItem = CHARACTER_COSMETICS.find(c => c.id === outfitId);
  const helmetItem = CHARACTER_COSMETICS.find(c => c.id === helmetId);
  const maskItem = CHARACTER_COSMETICS.find(c => c.id === maskId);
  const backpackItem = CHARACTER_COSMETICS.find(c => c.id === backpackId);
  const accessoryItem = CHARACTER_COSMETICS.find(c => c.id === accessoryId);

  const mainColor = outfitItem ? outfitItem.colorHex : skinColorHex;
  const highlightColor = outfitItem ? outfitItem.accentHex : colorHex;

  // Materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(mainColor),
    roughness: outfitId.includes('stealth') ? 0.9 : outfitId.includes('heavy') ? 0.25 : 0.4,
    metalness: outfitId.includes('heavy') ? 0.85 : 0.55
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(highlightColor),
    emissive: new THREE.Color(highlightColor),
    emissiveIntensity: outfitId.includes('apex') ? 0.9 : 0.6,
    roughness: 0.2,
    metalness: 0.8
  });

  const clothMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(mainColor).multiplyScalar(0.7),
    roughness: 0.85,
    metalness: 0.1
  });

  // Pelvis / Hips
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.35), armorMat);
  hips.position.y = 0.95;
  group.add(hips);

  // Torso / Tactical Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.65, 0.4), armorMat);
  torso.position.y = 1.38;
  group.add(torso);

  // Chest Armor Plate with style variation
  const isHeavyOutfit = outfitId.includes('heavy') || outfitId.includes('apex');
  const chestPlate = new THREE.Mesh(
    new THREE.BoxGeometry(isHeavyOutfit ? 0.62 : 0.54, 0.38, 0.14),
    accentMat
  );
  chestPlate.position.set(0, 1.48, 0.18);
  group.add(chestPlate);

  // Head Base
  const headGeo = new THREE.BoxGeometry(0.36, 0.4, 0.38);
  const head = new THREE.Mesh(headGeo, armorMat);
  head.position.y = 1.95;
  head.name = 'headMesh';
  group.add(head);

  // Visor
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(highlightColor),
    emissive: new THREE.Color(highlightColor),
    emissiveIntensity: 0.9,
    roughness: 0.1,
    transmission: 0.5,
    metalness: 0.9
  });
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.08), visorMat);
  visor.position.set(0, 1.95, 0.17);
  group.add(visor);

  // --- MODULAR HELMET ---
  if (helmetId === 'helm_fast_ballistic') {
    const helmGeo = new THREE.BoxGeometry(0.42, 0.22, 0.44);
    const helm = new THREE.Mesh(
      helmGeo,
      new THREE.MeshStandardMaterial({ color: new THREE.Color(helmetItem?.colorHex || '#334155'), roughness: 0.5 })
    );
    helm.position.set(0, 2.08, 0.02);
    head.add(helm);

    // ARC Rails on sides
    const railMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.28), railMat);
    railL.position.set(-0.22, 2.02, 0.02);
    head.add(railL);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.28), railMat);
    railR.position.set(0.22, 2.02, 0.02);
    head.add(railR);
  } else if (helmetId === 'helm_cyber_visor') {
    // Full face glowing cyber helmet
    const cyberHelm = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.44, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.2, metalness: 0.85 })
    );
    cyberHelm.position.set(0, 1.96, 0.02);
    head.add(cyberHelm);

    const cyberGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.18, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    cyberGlow.position.set(0, 1.96, 0.23);
    head.add(cyberGlow);
  } else if (helmetId === 'helm_exo_breacher') {
    // Heavy blast casque with narrow slit
    const casque = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.46, 0.46),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.3, metalness: 0.9 })
    );
    casque.position.set(0, 1.96, 0.02);
    head.add(casque);

    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    slit.position.set(0, 1.96, 0.24);
    head.add(slit);
  }

  // --- MODULAR MASK ---
  if (maskId === 'mask_skull_half') {
    const skullMask = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.16, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
    );
    skullMask.position.set(0, 1.83, 0.16);
    head.add(skullMask);

    // Skull teeth marking
    const teeth = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.05, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    teeth.position.set(0, 1.83, 0.22);
    head.add(teeth);
  } else if (maskId === 'mask_bio_respirator') {
    const respCenter = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.15, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x14532d, metalness: 0.5 })
    );
    respCenter.position.set(0, 1.82, 0.18);
    head.add(respCenter);

    // Dual filter canisters
    const canGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12);
    const canMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.4 });
    const canL = new THREE.Mesh(canGeo, canMat);
    canL.rotation.z = Math.PI / 2;
    canL.position.set(-0.16, 1.82, 0.15);
    head.add(canL);
    const canR = new THREE.Mesh(canGeo, canMat);
    canR.rotation.z = Math.PI / 2;
    canR.position.set(0.16, 1.82, 0.15);
    head.add(canR);
  } else if (maskId === 'mask_cyber_ninja') {
    const ninjaMask = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.18, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x3b0764, metalness: 0.85 })
    );
    ninjaMask.position.set(0, 1.83, 0.17);
    head.add(ninjaMask);

    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xc084fc })
    );
    vent.position.set(0, 1.83, 0.24);
    head.add(vent);
  }

  // --- MODULAR BACKPACK ---
  if (backpackId === 'pack_assault') {
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.58, 0.28),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(backpackItem?.colorHex || '#334155'), roughness: 0.8 })
    );
    pack.position.set(0, 1.38, -0.32);
    group.add(pack);

    // Bedroll on top
    const roll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.48, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 1.7, -0.3);
    group.add(roll);
  } else if (backpackId === 'pack_tachyon_core') {
    // Dual glowing tachyon generator cells
    const cellGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
    const cellMat = new THREE.MeshStandardMaterial({
      color: 0x0c4a6e,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      metalness: 0.9
    });
    const cellL = new THREE.Mesh(cellGeo, cellMat);
    cellL.position.set(-0.14, 1.38, -0.28);
    group.add(cellL);

    const cellR = new THREE.Mesh(cellGeo, cellMat);
    cellR.position.set(0.14, 1.38, -0.28);
    group.add(cellR);

    // Central turbine plate
    const turbine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    turbine.rotation.x = Math.PI / 2;
    turbine.position.set(0, 1.38, -0.28);
    turbine.name = 'tachyonTurbine';
    group.add(turbine);
  } else if (backpackId === 'pack_cyber_drone') {
    // Autonomous scout drone docking pod
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.45, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3, metalness: 0.8 })
    );
    pod.position.set(0, 1.42, -0.28);
    group.add(pod);

    const droneCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    droneCore.position.set(0, 1.42, -0.4);
    group.add(droneCore);
  } else {
    // Default Slim Spine Chrono-Core
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.45, 12), accentMat);
    core.position.set(0, 1.4, -0.22);
    core.rotation.x = Math.PI / 2;
    group.add(core);
  }

  // --- MODULAR ACCESSORIES ---
  if (accessoryId === 'acc_radio') {
    // Shoulder tactical radio
    const radio = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.14, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    radio.position.set(-0.35, 1.68, 0.15);
    group.add(radio);

    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    antenna.position.set(-0.35, 1.82, 0.15);
    group.add(antenna);
  } else if (accessoryId === 'acc_bandolier') {
    // Diagonal torso ammo bandolier
    const bandolierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.44), bandolierMat);
    bandolier.rotation.z = Math.PI / 4;
    bandolier.position.set(0, 1.38, 0.12);
    group.add(bandolier);

    // Shells
    const shellGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const shell = new THREE.Mesh(shellGeo, shellMat);
      shell.position.set(-0.15 + i * 0.1, 1.25 + i * 0.1, 0.24);
      shell.rotation.x = Math.PI / 2;
      group.add(shell);
    }
  } else if (accessoryId === 'acc_holo_tag') {
    // Glowing forearm display
    const holoTag = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
    );
    holoTag.position.set(-0.46, 1.15, 0.12);
    group.add(holoTag);
  }

  // Shoulders
  const shoulderGeo = new THREE.BoxGeometry(0.2, 0.2, 0.25);
  const leftShoulder = new THREE.Mesh(shoulderGeo, accentMat);
  leftShoulder.position.set(-0.42, 1.62, 0);
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, accentMat);
  rightShoulder.position.set(0.42, 1.62, 0);
  group.add(rightShoulder);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.16, 0.55, 0.18);
  const leftArm = new THREE.Mesh(armGeo, clothMat);
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.42, 1.25, 0.1);
  leftArm.rotation.x = 0.4;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, clothMat);
  rightArm.name = 'rightArm';
  rightArm.position.set(0.42, 1.25, 0.1);
  rightArm.rotation.x = 0.5;
  group.add(rightArm);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.22, 0.85, 0.24);
  const leftLeg = new THREE.Mesh(legGeo, clothMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.18, 0.45, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, clothMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.18, 0.45, 0);
  group.add(rightLeg);

  // Combat Boots
  const bootGeo = new THREE.BoxGeometry(0.24, 0.2, 0.35);
  const leftBoot = new THREE.Mesh(bootGeo, armorMat);
  leftBoot.position.set(-0.18, 0.1, 0.05);
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, armorMat);
  rightBoot.position.set(0.18, 0.1, 0.05);
  group.add(rightBoot);

  // Weapon held in hands with custom gun skin!
  const weaponMesh = createWeaponMesh('ar_chronostrike', highlightColor, weaponSkinId);
  weaponMesh.name = 'weaponMesh';
  weaponMesh.scale.set(0.7, 0.7, 0.7);
  weaponMesh.position.set(0.25, 1.28, 0.45);
  weaponMesh.rotation.set(0.1, -0.05, 0);
  group.add(weaponMesh);

  group.castShadow = true;
  group.receiveShadow = true;

  return group;
}

// Procedural 3D weapon generator with 10 Gun Skin collections & materials
export function createWeaponMesh(
  weaponId: string = 'ar_chronostrike',
  accentHex: string = '#06b6d4',
  skinId?: string
): THREE.Group {
  const group = new THREE.Group();

  // Find skin definition if provided
  const skin = GUN_SKINS.find(s => s.id === skinId) || GUN_SKINS[0];
  const primaryColor = skin ? skin.colorHex : '#1f2937';
  const effectiveAccent = skin ? skin.accentHex : accentHex;
  const isAnimated = skin ? skin.isAnimated : false;

  // Generate procedural texture for this skin collection
  const skinTexture = getProceduralSkinTexture(skin.patternType, primaryColor, effectiveAccent);

  const isGold = skin.patternType === 'gold_specular';
  const isInferno = skin.patternType === 'inferno_flame';
  const isFrost = skin.patternType === 'frost_ice';
  const isNeon = skin.patternType === 'neon_grid';
  const isVoid = skin.patternType === 'chrono_void';

  // Weapon main receiver material
  const gunMetalMat = new THREE.MeshStandardMaterial({
    map: skinTexture,
    color: isGold ? new THREE.Color(0xfacc15) : new THREE.Color(primaryColor),
    roughness: isGold ? 0.12 : isFrost ? 0.2 : 0.4,
    metalness: isGold ? 0.95 : 0.75,
    emissive: (isInferno || isNeon || isVoid) ? new THREE.Color(effectiveAccent) : new THREE.Color(0x000000),
    emissiveIntensity: isVoid ? 0.5 : isInferno ? 0.4 : isNeon ? 0.35 : 0
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.7,
    metalness: 0.2
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(effectiveAccent),
    emissive: new THREE.Color(effectiveAccent),
    emissiveIntensity: isAnimated ? 0.9 : 0.5,
    roughness: 0.2,
    metalness: 0.8
  });

  const holoMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(effectiveAccent),
    transparent: true,
    opacity: 0.85
  });

  // Weapon Receiver / Main Body
  const isSniper = weaponId.includes('widowmaker');
  const isShotgun = weaponId.includes('breaker');
  const isSmg = weaponId.includes('vector');

  const receiverLen = isSniper ? 0.9 : isSmg ? 0.45 : isShotgun ? 0.75 : 0.65;
  const receiverGeo = new THREE.BoxGeometry(0.08, 0.16, receiverLen);
  const receiver = new THREE.Mesh(receiverGeo, gunMetalMat);
  receiver.name = 'weaponReceiver';
  group.add(receiver);

  // Top Rail / Accent
  const railGeo = new THREE.BoxGeometry(0.06, 0.04, receiverLen * 0.9);
  const rail = new THREE.Mesh(railGeo, accentMat);
  rail.position.y = 0.09;
  rail.name = 'weaponRail';
  group.add(rail);

  // Barrel
  const barrelLen = isSniper ? 1.0 : isSmg ? 0.35 : isShotgun ? 0.65 : 0.55;
  const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, barrelLen, 12);
  const barrel = new THREE.Mesh(barrelGeo, gunMetalMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.04, receiverLen / 2 + barrelLen / 2);
  group.add(barrel);

  // Muzzle brake / suppressor
  const muzzleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.14, 12);
  const muzzle = new THREE.Mesh(muzzleGeo, accentMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.04, receiverLen / 2 + barrelLen + 0.07);
  group.add(muzzle);

  // Muzzle Flash anchor
  const flashAnchor = new THREE.Group();
  flashAnchor.name = 'muzzleFlash';
  flashAnchor.position.set(0, 0.04, receiverLen / 2 + barrelLen + 0.15);
  group.add(flashAnchor);

  // Grip
  const gripGeo = new THREE.BoxGeometry(0.07, 0.22, 0.1);
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.position.set(0, -0.16, -0.05);
  grip.rotation.x = -0.25;
  group.add(grip);

  // Magazine
  const magLen = isSniper ? 0.16 : isSmg ? 0.3 : 0.22;
  const magGeo = new THREE.BoxGeometry(0.06, magLen, 0.12);
  const magazine = new THREE.Mesh(magGeo, gunMetalMat);
  magazine.position.set(0, -0.16, 0.1);
  magazine.rotation.x = 0.1;
  group.add(magazine);

  // Stock
  const stockGeo = new THREE.BoxGeometry(0.07, 0.18, 0.35);
  const stock = new THREE.Mesh(stockGeo, gripMat);
  stock.position.set(0, -0.02, -receiverLen / 2 - 0.16);
  group.add(stock);

  // Scope / Optical Sight
  const opticGeo = new THREE.BoxGeometry(0.065, 0.08, 0.16);
  const optic = new THREE.Mesh(opticGeo, gunMetalMat);
  optic.position.set(0, 0.14, 0);
  group.add(optic);

  const reticleGeo = new THREE.RingGeometry(0.015, 0.025, 16);
  const reticle = new THREE.Mesh(reticleGeo, holoMat);
  reticle.position.set(0, 0.14, 0.081);
  group.add(reticle);

  group.userData = {
    isAnimated,
    patternType: skin.patternType
  };

  return group;
}

// Procedural 3D Zombie generator (Walker, Fast Runner, Heavy Brute)
export function createZombieMesh(type: 'walker' | 'runner' | 'brute' | 'acid_spitter' = 'walker'): THREE.Group {
  const group = new THREE.Group();

  const isBrute = type === 'brute';
  const isRunner = type === 'runner';

  const skinColor = isBrute ? 0x374151 : type === 'acid_spitter' ? 0x14532d : 0x475569;
  const fleshColor = isBrute ? 0x7f1d1d : type === 'acid_spitter' ? 0x16a34a : 0x991b1b;

  const fleshMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.8,
    metalness: 0.1
  });

  const muscleMat = new THREE.MeshStandardMaterial({
    color: fleshColor,
    roughness: 0.6,
    metalness: 0.2
  });

  const eyesMat = new THREE.MeshBasicMaterial({
    color: type === 'acid_spitter' ? 0x4ade80 : 0xef4444
  });

  const scale = isBrute ? 1.45 : isRunner ? 0.9 : 1.1;

  // Hips
  const hipsGeo = new THREE.BoxGeometry(0.45 * scale, 0.25 * scale, 0.35 * scale);
  const hips = new THREE.Mesh(hipsGeo, fleshMat);
  hips.position.y = 0.9 * scale;
  group.add(hips);

  // Torso / deformed ribcage
  const torsoGeo = new THREE.BoxGeometry(0.6 * scale, 0.7 * scale, 0.42 * scale);
  const torso = new THREE.Mesh(torsoGeo, fleshMat);
  torso.position.y = 1.35 * scale;
  torso.rotation.x = isRunner ? 0.3 : 0.15;
  group.add(torso);

  // Exposed mutated chest core
  const coreGeo = new THREE.SphereGeometry(0.18 * scale, 8, 8);
  const core = new THREE.Mesh(coreGeo, muscleMat);
  core.position.set(0, 1.4 * scale, 0.2 * scale);
  group.add(core);

  // Head
  const headGeo = new THREE.BoxGeometry(0.32 * scale, 0.35 * scale, 0.35 * scale);
  const head = new THREE.Mesh(headGeo, fleshMat);
  head.position.set(0, 1.85 * scale, isRunner ? 0.2 * scale : 0.1 * scale);
  head.rotation.x = 0.1;
  group.add(head);

  // Glowing mutant eyes
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 6, 6), eyesMat);
  eyeLeft.position.set(-0.08 * scale, 1.88 * scale, (isRunner ? 0.37 : 0.27) * scale);
  group.add(eyeLeft);

  const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 6, 6), eyesMat);
  eyeRight.position.set(0.08 * scale, 1.88 * scale, (isRunner ? 0.37 : 0.27) * scale);
  group.add(eyeRight);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.15 * scale, 0.65 * scale, 0.18 * scale);
  const leftArm = new THREE.Mesh(armGeo, muscleMat);
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.4 * scale, 1.3 * scale, 0.3 * scale);
  leftArm.rotation.x = -1.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, muscleMat);
  rightArm.name = 'rightArm';
  rightArm.position.set(0.4 * scale, 1.3 * scale, 0.3 * scale);
  rightArm.rotation.x = -1.1;
  group.add(rightArm);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.2 * scale, 0.85 * scale, 0.22 * scale);
  const leftLeg = new THREE.Mesh(legGeo, fleshMat);
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-0.16 * scale, 0.45 * scale, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, fleshMat);
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(0.16 * scale, 0.45 * scale, 0);
  group.add(rightLeg);

  group.castShadow = true;
  group.receiveShadow = true;

  return group;
}

// Chrono-Remnant holographic clone
export function createChronoRemnantMesh(colorHex: string = '#06b6d4'): THREE.Group {
  const group = new THREE.Group();

  const holoMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    wireframe: true,
    transparent: true,
    opacity: 0.65
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: 0.35
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.4), holoMat);
  torso.position.y = 1.35;
  group.add(torso);

  const torsoInner = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.35), glowMat);
  torsoInner.position.y = 1.35;
  group.add(torsoInner);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.38), holoMat);
  head.position.y = 1.95;
  group.add(head);

  const armGeo = new THREE.BoxGeometry(0.16, 0.55, 0.18);
  const leftArm = new THREE.Mesh(armGeo, holoMat);
  leftArm.position.set(-0.42, 1.25, 0.1);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, holoMat);
  rightArm.position.set(0.42, 1.25, 0.1);
  group.add(rightArm);

  const legGeo = new THREE.BoxGeometry(0.22, 0.85, 0.24);
  const leftLeg = new THREE.Mesh(legGeo, holoMat);
  leftLeg.position.set(-0.18, 0.45, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, holoMat);
  rightLeg.position.set(0.18, 0.45, 0);
  group.add(rightLeg);

  const ringGeo = new THREE.RingGeometry(0.6, 0.8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  ring.name = 'temporalRing';
  group.add(ring);

  return group;
}
