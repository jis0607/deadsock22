import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createCharacterMesh } from './modelHelpers';

import { PlayerCosmeticLoadout } from '../../types/game';

interface CharacterInspectSceneProps {
  characterId: string;
  accentColor: string;
  outfitColor?: string;
  cosmetics?: PlayerCosmeticLoadout;
}

export const CharacterInspectScene: React.FC<CharacterInspectSceneProps> = ({
  characterId,
  accentColor,
  outfitColor = '#1e293b',
  cosmetics
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null; // Transparent background to overlay on sleek UI

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 1.35, 3.8);
    camera.lookAt(0, 1.25, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(new THREE.Color(accentColor), 3.5, 10, Math.PI / 4, 0.4);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    // Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.15, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.3,
      metalness: 0.8
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.08;
    scene.add(pedestal);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.15, 32),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(accentColor), side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Character Group
    const charGroup = createCharacterMesh(characterId, accentColor, outfitColor, cosmetics);
    scene.add(charGroup);

    // Interactive Drag-to-Rotate
    let isDragging = false;
    let prevMouseX = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      autoRotate = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      charGroup.rotation.y += deltaX * 0.012;
      prevMouseX = e.clientX;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        autoRotate = false;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      charGroup.rotation.y += deltaX * 0.015;
      prevMouseX = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    dom.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (autoRotate) {
        charGroup.rotation.y += 0.005;
      }

      // Breathing animation
      charGroup.position.y = Math.sin(t * 1.8) * 0.015;

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
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [characterId, accentColor, outfitColor, cosmetics]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};
