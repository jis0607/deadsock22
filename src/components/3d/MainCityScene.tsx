import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCharacterMesh, createZombieMesh } from './modelHelpers';

import { PlayerCosmeticLoadout } from '../../types/game';

interface MainCitySceneProps {
  selectedCharacterId?: string;
  selectedCharacterColor?: string;
  selectedWeaponId?: string;
  cosmetics?: PlayerCosmeticLoadout;
}

export const MainCityScene: React.FC<MainCitySceneProps> = ({
  selectedCharacterId = 'viper',
  selectedCharacterColor = '#06b6d4',
  selectedWeaponId = 'ar_chronostrike',
  cosmetics
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070a);
    scene.fog = new THREE.FogExp2(0x08090d, 0.038);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    // Cinematic camera angle: low-angle, looking up slightly at hero
    camera.position.set(0.6, 1.45, 3.4);
    camera.lookAt(0.1, 1.35, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    // Rim / Hero Spotlight from above right (Cyan/Ice tactical key)
    const keySpot = new THREE.SpotLight(0x38bdf8, 4.5, 20, Math.PI / 4, 0.5, 1);
    keySpot.position.set(3, 4.5, 3.5);
    keySpot.castShadow = true;
    scene.add(keySpot);

    // Fire Wreckage Glow Light (flickering orange/red)
    const fireLight = new THREE.PointLight(0xff5500, 3.8, 14);
    fireLight.position.set(-2.8, 0.8, -1.2);
    scene.add(fireLight);

    // Background Neon Glow (Deep Magenta / Cyan skyline)
    const neonLight = new THREE.PointLight(0x06b6d4, 2.5, 25);
    neonLight.position.set(2, 6, -10);
    scene.add(neonLight);

    // Ground: Broken Wet Asphalt Road with Roadlines
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090a0f,
      roughness: 0.25,
      metalness: 0.6
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Burning Vehicle / Ruined APC in background left
    const carGroup = new THREE.Group();
    carGroup.position.set(-3.2, 0, -1.6);
    carGroup.rotation.y = 0.45;

    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.9, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.3 })
    );
    carBody.position.y = 0.65;
    carGroup.add(carBody);

    const carCabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.7, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    carCabin.position.set(0, 1.35, -0.4);
    carGroup.add(carCabin);

    // Burning fire flame mesh on car
    const fireGeo = new THREE.ConeGeometry(0.5, 1.3, 8);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff4400, wireframe: true, transparent: true, opacity: 0.7 });
    const fireMesh = new THREE.Mesh(fireGeo, fireMat);
    fireMesh.position.set(0.3, 1.9, 0.2);
    carGroup.add(fireMesh);

    scene.add(carGroup);

    // Ruined City Skyline Buildings in Background
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0b0d13,
      roughness: 0.9,
      metalness: 0.2
    });

    for (let i = 0; i < 18; i++) {
      const w = 4 + Math.random() * 5;
      const h = 12 + Math.random() * 22;
      const d = 4 + Math.random() * 6;
      const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat);
      const angle = (i / 18) * Math.PI * 1.5 - Math.PI * 0.75;
      const dist = 16 + (i % 3) * 6;
      building.position.set(Math.sin(angle) * dist, h / 2, -Math.cos(angle) * dist);
      scene.add(building);

      // Broken Neon Window lines
      if (i % 2 === 0) {
        const neonBar = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.7, 0.2, 0.1),
          new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? 0xef4444 : 0x06b6d4 })
        );
        neonBar.position.set(building.position.x, h * 0.65, building.position.z + d / 2 + 0.1);
        scene.add(neonBar);
      }
    }

    // Concrete Barricades & Rubble in foreground
    const barrierGeo = new THREE.BoxGeometry(2.2, 0.8, 0.4);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 });
    const barrier1 = new THREE.Mesh(barrierGeo, barrierMat);
    barrier1.position.set(1.9, 0.4, 0.6);
    barrier1.rotation.y = -0.3;
    scene.add(barrier1);

    // Foreground Survivor Character (Playable Hero)
    const hero = createCharacterMesh(selectedCharacterId, selectedCharacterColor, '#18202f', cosmetics);
    hero.position.set(0.2, 0, 0.8);
    hero.rotation.y = -0.38; // Facing slightly toward camera with tactical angle
    scene.add(hero);

    // Background Shambling Zombies
    const zombies: THREE.Group[] = [];
    const zombiePositions = [
      { x: -1.8, z: -3.5, type: 'walker' as const, rot: 0.5 },
      { x: 1.4, z: -4.8, type: 'runner' as const, rot: -0.2 },
      { x: -3.8, z: -7.0, type: 'brute' as const, rot: 0.8 },
      { x: 3.2, z: -8.5, type: 'walker' as const, rot: -0.7 }
    ];

    zombiePositions.forEach((pos) => {
      const zMesh = createZombieMesh(pos.type);
      zMesh.position.set(pos.x, 0, pos.z);
      zMesh.rotation.y = pos.rot;
      scene.add(zMesh);
      zombies.push(zMesh);
    });

    // Particle Systems: Smoke & Glowing Ash Embers
    const emberCount = 120;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberSpeeds = new Float32Array(emberCount);

    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3] = (Math.random() - 0.5) * 16;
      emberPositions[i * 3 + 1] = Math.random() * 6;
      emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      emberSpeeds[i] = 0.3 + Math.random() * 0.6;
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));

    const emberMat = new THREE.PointsMaterial({
      color: 0xff6622,
      size: 0.065,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // Mouse Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetMouseX = (e.clientX - halfW) / halfW;
      targetMouseY = (e.clientY - halfH) / halfH;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax camera drift
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      camera.position.x = 0.6 + currentMouseX * 0.25 + Math.sin(elapsedTime * 0.2) * 0.06;
      camera.position.y = 1.45 - currentMouseY * 0.15 + Math.cos(elapsedTime * 0.25) * 0.04;
      camera.lookAt(0.1 + currentMouseX * 0.1, 1.35, 0);

      // Hero idle breathing animation
      const breathing = Math.sin(elapsedTime * 1.8) * 0.015;
      hero.position.y = breathing;
      const rightArm = hero.getObjectByName('rightArm');
      const leftArm = hero.getObjectByName('leftArm');
      if (rightArm) rightArm.rotation.x = 0.5 + Math.sin(elapsedTime * 1.8) * 0.02;
      if (leftArm) leftArm.rotation.x = 0.4 + Math.sin(elapsedTime * 1.8) * 0.02;

      // Hero subtle head turn / weapon sway
      hero.rotation.y = -0.38 + Math.sin(elapsedTime * 0.6) * 0.03;

      // Fire light flicker
      fireLight.intensity = 3.2 + Math.sin(elapsedTime * 14) * 0.7 + Math.cos(elapsedTime * 23) * 0.5;
      fireMesh.rotation.y += 0.03;
      fireMesh.scale.set(
        1 + Math.sin(elapsedTime * 10) * 0.15,
        1 + Math.cos(elapsedTime * 12) * 0.2,
        1 + Math.sin(elapsedTime * 8) * 0.15
      );

      // Zombie shambling animations
      zombies.forEach((zMesh, idx) => {
        const zArmL = zMesh.getObjectByName('leftArm');
        const zArmR = zMesh.getObjectByName('rightArm');
        const zLegL = zMesh.getObjectByName('leftLeg');
        const zLegR = zMesh.getObjectByName('rightLeg');

        const speed = 1.2 + idx * 0.3;
        const shamble = Math.sin(elapsedTime * speed + idx);

        zMesh.rotation.z = shamble * 0.08;
        zMesh.position.y = Math.abs(shamble) * 0.04;

        if (zArmL) zArmL.rotation.x = -1.1 + Math.sin(elapsedTime * speed + idx) * 0.2;
        if (zArmR) zArmR.rotation.x = -1.2 + Math.cos(elapsedTime * speed + idx) * 0.2;
        if (zLegL) zLegL.rotation.x = Math.sin(elapsedTime * speed + idx) * 0.3;
        if (zLegR) zLegR.rotation.x = -Math.sin(elapsedTime * speed + idx) * 0.3;
      });

      // Embers floating upward
      const positions = emberGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < emberCount; i++) {
        positions[i * 3 + 1] += emberSpeeds[i] * 0.025;
        positions[i * 3] += Math.sin(elapsedTime + i) * 0.005;
        if (positions[i * 3 + 1] > 6) {
          positions[i * 3 + 1] = 0.1;
          positions[i * 3] = (Math.random() - 0.5) * 16;
        }
      }
      emberGeo.attributes.position.needsUpdate = true;

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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedCharacterId, selectedCharacterColor, cosmetics]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};
