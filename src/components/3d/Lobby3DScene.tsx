import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCharacterMesh } from './modelHelpers';
import { PlayerData, PlayerCosmeticLoadout } from '../../types/game';

interface Lobby3DSceneProps {
  localPlayer: {
    name: string;
    characterId: string;
    weaponId: string;
    isReady: boolean;
    cosmetics?: PlayerCosmeticLoadout;
  };
  remotePlayer: PlayerData | null;
}

export const Lobby3DScene: React.FC<Lobby3DSceneProps> = ({ localPlayer, remotePlayer }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    scene.fog = new THREE.FogExp2(0x07090e, 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 1.6, 4.4);
    camera.lookAt(0, 1.25, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(2, 6, 4);
    scene.add(mainLight);

    // Player 1 Spotlight
    const p1Spot = new THREE.SpotLight(0x06b6d4, 3.5, 12, Math.PI / 4, 0.5);
    p1Spot.position.set(-1.2, 4, 2);
    scene.add(p1Spot);

    // Player 2 Spotlight
    const p2Spot = new THREE.SpotLight(remotePlayer ? (remotePlayer.isReady ? 0x22c55e : 0xa855f7) : 0x475569, 3.5, 12, Math.PI / 4, 0.5);
    p2Spot.position.set(1.2, 4, 2);
    scene.add(p2Spot);

    // Ground Platform: Hexagonal Tactical Deploy Bay
    const floorGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.2, 6);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.1;
    scene.add(floor);

    // Deploy Ring 1 (Left - Local)
    const ringGeo = new THREE.RingGeometry(0.7, 0.78, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: localPlayer.isReady ? 0x22c55e : 0x06b6d4,
      side: THREE.DoubleSide
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.set(-1.2, 0.02, 0);
    scene.add(ring1);

    // Deploy Ring 2 (Right - Remote)
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: remotePlayer ? (remotePlayer.isReady ? 0x22c55e : 0xa855f7) : 0x334155,
      side: THREE.DoubleSide
    });
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.set(1.2, 0.02, 0);
    scene.add(ring2);

    // Background Wall / Grate with neon line
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0b0f19, roughness: 0.9 })
    );
    backWall.position.set(0, 2, -2.5);
    scene.add(backWall);

    const backNeon = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.05, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    backNeon.position.set(0, 2.6, -2.3);
    scene.add(backNeon);

    // Local Player Character
    const p1Color = localPlayer.characterId === 'ghost' ? '#ef4444' : localPlayer.characterId === 'bulwark' ? '#f97316' : localPlayer.characterId === 'nyx' ? '#a855f7' : '#06b6d4';
    const char1 = createCharacterMesh(localPlayer.characterId, p1Color, '#1e293b', localPlayer.cosmetics);
    char1.position.set(-1.2, 0, 0);
    char1.rotation.y = 0.25;
    scene.add(char1);

    // Remote Player Character or Hologram Placeholder
    let char2: THREE.Group;
    if (remotePlayer) {
      const p2Color = remotePlayer.characterId === 'ghost' ? '#ef4444' : remotePlayer.characterId === 'bulwark' ? '#f97316' : remotePlayer.characterId === 'nyx' ? '#a855f7' : '#06b6d4';
      char2 = createCharacterMesh(remotePlayer.characterId, p2Color, '#1e293b', remotePlayer.cosmetics);
      char2.position.set(1.2, 0, 0);
      char2.rotation.y = -0.25;
      scene.add(char2);
    } else {
      // Waiting holographic placeholder
      char2 = new THREE.Group();
      char2.position.set(1.2, 0, 0);
      const holoMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const holoBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.8, 12), holoMat);
      holoBody.position.y = 0.9;
      char2.add(holoBody);

      const holoBeacon = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.45, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      holoBeacon.rotation.x = -Math.PI / 2;
      holoBeacon.position.y = 1.9;
      char2.add(holoBeacon);

      scene.add(char2);
    }

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Idle breathing for player 1
      char1.position.y = Math.sin(t * 1.8) * 0.015;
      const rightArm1 = char1.getObjectByName('rightArm');
      if (rightArm1) rightArm1.rotation.x = 0.5 + Math.sin(t * 1.8) * 0.02;

      // Player 2 breathing or hologram spin
      if (remotePlayer) {
        char2.position.y = Math.sin(t * 1.9 + 1) * 0.015;
        const rightArm2 = char2.getObjectByName('rightArm');
        if (rightArm2) rightArm2.rotation.x = 0.5 + Math.sin(t * 1.9 + 1) * 0.02;
      } else {
        char2.rotation.y = t * 0.6;
      }

      // Subtle camera pan
      camera.position.x = Math.sin(t * 0.4) * 0.15;
      camera.lookAt(0, 1.25, 0);

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
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [localPlayer, remotePlayer]);

  return <div ref={containerRef} className="w-full h-full" />;
};
