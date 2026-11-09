import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PlayerData, ZombieEntity, ChronoRemnant, Weapon, PlayerCosmeticLoadout } from '../../types/game';
import { createCharacterMesh, createZombieMesh, createChronoRemnantMesh } from './modelHelpers';
import { sound } from '../../services/audio';

interface GameWorld3DProps {
  isMultiplayer: boolean;
  localPlayer: {
    id: string;
    name: string;
    characterId: string;
    weapon: Weapon;
    cosmetics?: PlayerCosmeticLoadout;
  };
  remotePlayer: PlayerData | null;
  zombies: ZombieEntity[];
  chronoRemnants: ChronoRemnant[];
  currentHealth: number;
  currentArmor: number;
  currentAmmo: number;
  isAimingDownSights: boolean;
  onFireWeapon: (bulletOrigin: { x: number; y: number; z: number }, bulletDir: { x: number; y: number; z: number }) => void;
  onDamageZombie: (zombieId: string, damage: number, isHeadshot: boolean) => void;
  onPlayerPositionChange: (pos: { x: number; y: number; z: number; rotY: number; pitch: number; isAiming: boolean; isShooting: boolean }) => void;
  onTakeDamage: (dmg: number) => void;
  onNearTeammateForRevive: (canRevive: boolean, teammateId?: string) => void;
}

export const GameWorld3D: React.FC<GameWorld3DProps> = ({
  isMultiplayer,
  localPlayer,
  remotePlayer,
  zombies,
  chronoRemnants,
  currentHealth,
  currentAmmo,
  isAimingDownSights,
  onFireWeapon,
  onDamageZombie,
  onPlayerPositionChange,
  onTakeDamage,
  onNearTeammateForRevive
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // References to keep state accessible in animation loop
  const localPlayerPosRef = useRef({ x: 0, y: 0, z: 0, rotY: 0, pitch: 0 });
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const isPointerLockedRef = useRef(false);
  const isShootingRef = useRef(false);
  const lastShotTimeRef = useRef(0);
  const healthRef = useRef(currentHealth);
  const ammoRef = useRef(currentAmmo);
  const adsRef = useRef(isAimingDownSights);

  healthRef.current = currentHealth;
  ammoRef.current = currentAmmo;
  adsRef.current = isAimingDownSights;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x080a0f, 0.025);

    const camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    moonLight.position.set(20, 40, 20);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    scene.add(moonLight);

    // Extraction LZ Beacon Light (Emerald beam in distance)
    const lzLight = new THREE.PointLight(0x10b981, 4.0, 35);
    lzLight.position.set(0, 1.5, -45);
    scene.add(lzLight);

    // Ground: Broken City Highway / Sector Arena
    const floorGeo = new THREE.PlaneGeometry(140, 140);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090c13,
      roughness: 0.35,
      metalness: 0.5
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Environment Props: Ruined buildings, barricades, light poles, burning cars
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const radius = 55 + Math.random() * 15;
      const w = 8 + Math.random() * 12;
      const h = 20 + Math.random() * 35;
      const d = 8 + Math.random() * 12;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat);
      b.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
      scene.add(b);
    }

    // Barricades in play area
    const barrierGeo = new THREE.BoxGeometry(3.5, 1.0, 0.6);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const barricadePositions = [
      { x: -8, z: -12, r: 0.3 },
      { x: 8, z: -14, r: -0.4 },
      { x: -14, z: -25, r: 0.9 },
      { x: 12, z: -28, r: -0.8 },
      { x: 0, z: -20, r: 0 },
      { x: -5, z: 10, r: 0.5 },
      { x: 7, z: 8, r: -0.2 }
    ];

    barricadePositions.forEach((pos) => {
      const bar = new THREE.Mesh(barrierGeo, barrierMat);
      bar.position.set(pos.x, 0.5, pos.z);
      bar.rotation.y = pos.r;
      bar.castShadow = true;
      bar.receiveShadow = true;
      scene.add(bar);
    });

    // Extraction LZ Platform
    const lzPlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6.5, 0.4, 32),
      new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4, metalness: 0.7 })
    );
    lzPlatform.position.set(0, 0.2, -45);
    scene.add(lzPlatform);

    // Extraction Beacon Laser Beam
    const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, 60, 16);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.65 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 30, -45);
    scene.add(beam);

    // Local Player Character Model in 3D scene (3rd-person)
    const localCharColor = localPlayer.characterId === 'ghost' ? '#ef4444' : localPlayer.characterId === 'bulwark' ? '#f97316' : localPlayer.characterId === 'nyx' ? '#a855f7' : '#06b6d4';
    const localCharMesh = createCharacterMesh(localPlayer.characterId, localCharColor, '#1e293b', localPlayer.cosmetics);
    scene.add(localCharMesh);

    // Remote Teammate Character Model
    let remoteCharMesh: THREE.Group | null = null;
    let teammateNametagDiv: HTMLDivElement | null = null;

    if (isMultiplayer) {
      const remoteColor = remotePlayer?.characterId === 'ghost' ? '#ef4444' : remotePlayer?.characterId === 'bulwark' ? '#f97316' : remotePlayer?.characterId === 'nyx' ? '#a855f7' : '#38bdf8';
      remoteCharMesh = createCharacterMesh(remotePlayer?.characterId || 'viper', remoteColor, '#1e293b', remotePlayer?.cosmetics);
      remoteCharMesh.visible = false;
      scene.add(remoteCharMesh);
    }

    // Active 3D Zombie meshes map: id -> THREE.Group
    const zombieMeshes = new Map<string, THREE.Group>();

    // Active 3D Chrono-Remnant meshes map: id -> THREE.Group
    const remnantMeshes = new Map<string, THREE.Group>();

    // Particle pool for bullet tracers and hit sparks
    interface BulletTracer {
      mesh: THREE.Line;
      direction: THREE.Vector3;
      origin: THREE.Vector3;
      progress: number;
      speed: number;
      maxDist: number;
    }
    const activeTracers: BulletTracer[] = [];

    const spawnBulletTracer = (origin: THREE.Vector3, direction: THREE.Vector3) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1.8)
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xfef08a, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      line.position.copy(origin);
      line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
      scene.add(line);

      activeTracers.push({
        mesh: line,
        origin: origin.clone(),
        direction: direction.clone(),
        progress: 0,
        speed: 120, // m/s
        maxDist: 80
      });
    };

    // Muzzle flash pointlight on player
    const muzzleLight = new THREE.PointLight(0xffaa33, 0, 8);
    localCharMesh.add(muzzleLight);
    muzzleLight.position.set(0.25, 1.35, 1.2);

    // Controls Handling
    const keys = keysPressedRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse aiming & pointer lock
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        // Left click: Fire
        if (!isPointerLockedRef.current && container.requestPointerLock) {
          container.requestPointerLock();
        }
        isShootingRef.current = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isShootingRef.current = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        isPointerLockedRef.current = true;
        const sensitivity = 0.0022;
        localPlayerPosRef.current.rotY -= e.movementX * sensitivity;
        localPlayerPosRef.current.pitch = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, localPlayerPosRef.current.pitch - e.movementY * sensitivity)
        );
      }
    };

    const onPointerLockChange = () => {
      isPointerLockedRef.current = document.pointerLockElement === container;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Game loop
    let clock = new THREE.Clock();
    let animId: number;
    let netUpdateTimer = 0;
    let damageCooldown = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      if (healthRef.current <= 0) {
        // Downed or dead stance
        localCharMesh.rotation.x = -Math.PI / 2;
        localCharMesh.position.y = 0.2;
      } else {
        localCharMesh.rotation.x = 0;
        localCharMesh.position.y = 0;

        // Player movement
        const moveSpeed = keys['ShiftLeft'] || keys['ShiftRight'] ? 8.5 : 5.2;
        const forward = new THREE.Vector3(-Math.sin(localPlayerPosRef.current.rotY), 0, -Math.cos(localPlayerPosRef.current.rotY));
        const right = new THREE.Vector3(Math.cos(localPlayerPosRef.current.rotY), 0, -Math.sin(localPlayerPosRef.current.rotY));

        let moveX = 0;
        let moveZ = 0;

        if (keys['KeyW']) {
          moveX += forward.x;
          moveZ += forward.z;
        }
        if (keys['KeyS']) {
          moveX -= forward.x;
          moveZ -= forward.z;
        }
        if (keys['KeyA']) {
          moveX -= right.x;
          moveZ -= right.z;
        }
        if (keys['KeyD']) {
          moveX += right.x;
          moveZ += right.z;
        }

        const moveVec = new THREE.Vector3(moveX, 0, moveZ);
        const isMoving = moveVec.lengthSq() > 0.001;
        if (isMoving) {
          moveVec.normalize();
          localPlayerPosRef.current.x += moveVec.x * moveSpeed * delta;
          localPlayerPosRef.current.z += moveVec.z * moveSpeed * delta;

          // Leg running animation
          const legL = localCharMesh.getObjectByName('leftLeg');
          const legR = localCharMesh.getObjectByName('rightLeg');
          if (legL) legL.rotation.x = Math.sin(time * 12) * 0.6;
          if (legR) legR.rotation.x = -Math.sin(time * 12) * 0.6;
        } else {
          const legL = localCharMesh.getObjectByName('leftLeg');
          const legR = localCharMesh.getObjectByName('rightLeg');
          if (legL) legL.rotation.x = 0;
          if (legR) legR.rotation.x = 0;
        }

        // Weapon firing loop
        const fireInterval = 1 / localPlayer.weapon.fireRate;
        if (isShootingRef.current && time - lastShotTimeRef.current >= fireInterval) {
          if (ammoRef.current > 0) {
            lastShotTimeRef.current = time;
            sound.playShoot(localPlayer.weapon.category);

            // Muzzle flash
            muzzleLight.intensity = 5.0;

            // Recoil kick on arm
            const arm = localCharMesh.getObjectByName('rightArm');
            if (arm) arm.rotation.x = 0.8;

            // Compute bullet trajectory from player eye level
            const shootDir = new THREE.Vector3(
              -Math.sin(localPlayerPosRef.current.rotY) * Math.cos(localPlayerPosRef.current.pitch),
              Math.sin(localPlayerPosRef.current.pitch),
              -Math.cos(localPlayerPosRef.current.rotY) * Math.cos(localPlayerPosRef.current.pitch)
            ).normalize();

            const bulletOrigin = new THREE.Vector3(
              localPlayerPosRef.current.x + 0.3 * Math.cos(localPlayerPosRef.current.rotY),
              1.4,
              localPlayerPosRef.current.z - 0.3 * Math.sin(localPlayerPosRef.current.rotY)
            );

            spawnBulletTracer(bulletOrigin, shootDir);
            onFireWeapon(bulletOrigin, shootDir);

            // Raycast hit check on zombies
            const ray = new THREE.Raycaster(bulletOrigin, shootDir, 0.1, 100);
            const zombieObjects = Array.from(zombieMeshes.values());
            const intersects = ray.intersectObjects(zombieObjects, true);

            if (intersects.length > 0) {
              const hit = intersects[0];
              // Find matching zombie ID
              for (const [zId, zMesh] of zombieMeshes.entries()) {
                if (zMesh === hit.object || zMesh.getObjectById(hit.object.id)) {
                  const isHeadshot = hit.point.y > (zMesh.position.y + 1.6);
                  const dmg = isHeadshot ? localPlayer.weapon.damage * 2.5 : localPlayer.weapon.damage;
                  sound.playHit(isHeadshot);
                  onDamageZombie(zId, Math.round(dmg), isHeadshot);
                  break;
                }
              }
            }
          }
        }
      }

      // Smooth muzzle light fade
      if (muzzleLight.intensity > 0) {
        muzzleLight.intensity = Math.max(0, muzzleLight.intensity - delta * 25);
      }

      // Update Local Player 3D mesh
      localCharMesh.position.x = localPlayerPosRef.current.x;
      localCharMesh.position.z = localPlayerPosRef.current.z;
      localCharMesh.rotation.y = localPlayerPosRef.current.rotY;

      // 3rd Person Over-The-Shoulder Camera positioning
      const cameraDistance = adsRef.current ? 1.6 : 3.2;
      const cameraHeight = adsRef.current ? 1.45 : 1.7;
      const shoulderOffset = adsRef.current ? 0.35 : 0.65;

      const camForward = new THREE.Vector3(
        -Math.sin(localPlayerPosRef.current.rotY) * Math.cos(localPlayerPosRef.current.pitch),
        Math.sin(localPlayerPosRef.current.pitch),
        -Math.cos(localPlayerPosRef.current.rotY) * Math.cos(localPlayerPosRef.current.pitch)
      );

      const camRight = new THREE.Vector3(
        Math.cos(localPlayerPosRef.current.rotY),
        0,
        -Math.sin(localPlayerPosRef.current.rotY)
      );

      camera.position.x = localPlayerPosRef.current.x - camForward.x * cameraDistance + camRight.x * shoulderOffset;
      camera.position.y = localPlayerPosRef.current.y + cameraHeight - camForward.y * cameraDistance;
      camera.position.z = localPlayerPosRef.current.z - camForward.z * cameraDistance + camRight.z * shoulderOffset;

      const targetLook = new THREE.Vector3(
        localPlayerPosRef.current.x + camForward.x * 20,
        localPlayerPosRef.current.y + cameraHeight + camForward.y * 20,
        localPlayerPosRef.current.z + camForward.z * 20
      );
      camera.lookAt(targetLook);

      // Smooth FOV zoom for Aim-Down-Sights
      const targetFov = adsRef.current ? (localPlayer.weapon.category === 'Sniper' ? 24 : 45) : 65;
      camera.fov += (targetFov - camera.fov) * 0.15;
      camera.updateProjectionMatrix();

      // Update bullet tracers
      for (let i = activeTracers.length - 1; i >= 0; i--) {
        const tracer = activeTracers[i];
        tracer.progress += tracer.speed * delta;
        tracer.mesh.position.addScaledVector(tracer.direction, tracer.speed * delta);
        if (tracer.progress >= tracer.maxDist) {
          scene.remove(tracer.mesh);
          activeTracers.splice(i, 1);
        }
      }

      // Update Teammate (Remote Player) Mesh in 3D
      if (remotePlayer && remoteCharMesh) {
        remoteCharMesh.visible = true;
        // Smoothly interpolate position
        remoteCharMesh.position.x += (remotePlayer.x - remoteCharMesh.position.x) * 0.3;
        remoteCharMesh.position.y = remotePlayer.y;
        remoteCharMesh.position.z += (remotePlayer.z - remoteCharMesh.position.z) * 0.3;
        remoteCharMesh.rotation.y += (remotePlayer.rotY - remoteCharMesh.rotation.y) * 0.3;

        // Downed / crawling state
        if (remotePlayer.state === 'downed' || remotePlayer.health <= 0) {
          remoteCharMesh.rotation.x = -Math.PI / 2;
          remoteCharMesh.position.y = 0.2;
        } else {
          remoteCharMesh.rotation.x = 0;
        }

        // Check if close enough to revive
        const distToTeammate = Math.hypot(
          localPlayerPosRef.current.x - remotePlayer.x,
          localPlayerPosRef.current.z - remotePlayer.z
        );
        const canRevive = distToTeammate < 3.2 && (remotePlayer.health <= 0 || remotePlayer.state === 'downed');
        onNearTeammateForRevive(canRevive, remotePlayer.id);
      } else if (remoteCharMesh) {
        remoteCharMesh.visible = false;
        onNearTeammateForRevive(false);
      }

      // Update 3D Zombies
      const currentZombieIds = new Set(zombies.map(z => z.id));
      // Remove dead/unlisted zombies
      for (const [zId, zMesh] of zombieMeshes.entries()) {
        if (!currentZombieIds.has(zId)) {
          scene.remove(zMesh);
          zombieMeshes.delete(zId);
        }
      }

      // Add/update active zombies
      zombies.forEach((zEntity) => {
        let zMesh = zombieMeshes.get(zEntity.id);
        if (!zMesh) {
          zMesh = createZombieMesh(zEntity.type);
          scene.add(zMesh);
          zombieMeshes.set(zEntity.id, zMesh);
        }

        if (zEntity.state === 'dead' || zEntity.health <= 0) {
          zMesh.rotation.x = -Math.PI / 2;
          zMesh.position.y = 0.2;
          return;
        }

        // Interpolate position and rotation
        zMesh.position.x += (zEntity.x - zMesh.position.x) * 0.25;
        zMesh.position.z += (zEntity.z - zMesh.position.z) * 0.25;
        zMesh.rotation.y = zEntity.rotY;

        // Walking animation
        const shamble = Math.sin(time * 8 + parseInt(zEntity.id.replace(/\D/g, '') || '0'));
        zMesh.position.y = Math.abs(shamble) * 0.05;
        const armL = zMesh.getObjectByName('leftArm');
        const armR = zMesh.getObjectByName('rightArm');
        if (armL) armL.rotation.x = -1.2 + shamble * 0.3;
        if (armR) armR.rotation.x = -1.1 - shamble * 0.3;

        // Attack proximity check on local player
        const distToPlayer = Math.hypot(
          localPlayerPosRef.current.x - zMesh.position.x,
          localPlayerPosRef.current.z - zMesh.position.z
        );
        if (distToPlayer < 1.8 && damageCooldown <= 0 && healthRef.current > 0) {
          const dmg = zEntity.type === 'brute' ? 35 : zEntity.type === 'runner' ? 12 : 18;
          onTakeDamage(dmg);
          sound.playZombieGroan();
          damageCooldown = 1.0; // 1s immunity between bites
        }
      });

      if (damageCooldown > 0) {
        damageCooldown -= delta;
      }

      // Update Chrono-Remnants (Holographic clones)
      const currentRemnantIds = new Set(chronoRemnants.map(r => r.id));
      for (const [rId, rMesh] of remnantMeshes.entries()) {
        if (!currentRemnantIds.has(rId)) {
          scene.remove(rMesh);
          remnantMeshes.delete(rId);
        }
      }

      chronoRemnants.forEach((remnant) => {
        let rMesh = remnantMeshes.get(remnant.id);
        if (!rMesh) {
          rMesh = createChronoRemnantMesh('#06b6d4');
          rMesh.position.set(remnant.x, 0, remnant.z);
          scene.add(rMesh);
          remnantMeshes.set(remnant.id, rMesh);
        }
        // Spinning temporal ring
        const ring = rMesh.getObjectByName('temporalRing');
        if (ring) {
          ring.rotation.z += delta * 3;
          ring.scale.setScalar(1 + Math.sin(time * 5) * 0.2);
        }
      });

      // Throttle network update to 20Hz
      netUpdateTimer += delta;
      if (netUpdateTimer >= 0.05) {
        netUpdateTimer = 0;
        onPlayerPositionChange({
          x: localPlayerPosRef.current.x,
          y: localPlayerPosRef.current.y,
          z: localPlayerPosRef.current.z,
          rotY: localPlayerPosRef.current.rotY,
          pitch: localPlayerPosRef.current.pitch,
          isAiming: adsRef.current,
          isShooting: isShootingRef.current
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-crosshair select-none"
    />
  );
};
