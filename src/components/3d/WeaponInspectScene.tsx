import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createWeaponMesh } from './modelHelpers';
import { sound } from '../../services/audio';

interface WeaponInspectSceneProps {
  weaponId: string;
  category: string;
  accentColor: string;
  skinId?: string;
  triggerFireCount?: number;
}

export const WeaponInspectScene: React.FC<WeaponInspectSceneProps> = ({
  weaponId,
  category,
  accentColor,
  skinId,
  triggerFireCount = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const weaponMeshRef = useRef<THREE.Group | null>(null);
  const flashLightRef = useRef<THREE.PointLight | null>(null);
  const recoilRef = useRef<number>(0);

  // Trigger test-fire recoil and flash when prop changes
  useEffect(() => {
    if (triggerFireCount > 0 && weaponMeshRef.current) {
      sound.playShoot(category);
      recoilRef.current = 1.0;
      if (flashLightRef.current) {
        flashLightRef.current.intensity = 8.0;
      }
    }
  }, [triggerFireCount, category]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 0.45, 2.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.appendChild(renderer.domElement);

    // Studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.SpotLight(new THREE.Color(accentColor), 4.0, 10, Math.PI / 4, 0.4);
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    // Muzzle flash pointlight
    const flashLight = new THREE.PointLight(0xffaa44, 0, 8);
    flashLight.position.set(0, 0.05, 1.2);
    scene.add(flashLight);
    flashLightRef.current = flashLight;

    // Weapon Model
    const weaponMesh = createWeaponMesh(weaponId, accentColor, skinId);
    weaponMesh.scale.set(1.4, 1.4, 1.4);
    weaponMesh.rotation.set(0.12, Math.PI / 4 + 0.2, 0);
    scene.add(weaponMesh);
    weaponMeshRef.current = weaponMesh;

    // Turntable interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      autoRotate = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      weaponMesh.rotation.y += deltaX * 0.012;
      weaponMesh.rotation.x = Math.max(-0.6, Math.min(0.6, weaponMesh.rotation.x + deltaY * 0.008));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
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
        prevMouseY = e.touches[0].clientY;
        autoRotate = false;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      weaponMesh.rotation.y += deltaX * 0.015;
      weaponMesh.rotation.x = Math.max(-0.6, Math.min(0.6, weaponMesh.rotation.x + deltaY * 0.01));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
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
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      if (autoRotate) {
        weaponMesh.rotation.y += 0.008;
      }

      // Gentle floating elevation
      weaponMesh.position.y = Math.sin(t * 1.5) * 0.03;

      // Animated glowing skins (Inferno, Frost, Neon, Chrono-Void)
      if (weaponMesh.userData?.isAnimated) {
        const receiver = weaponMesh.getObjectByName('weaponReceiver') as THREE.Mesh;
        if (receiver && (receiver.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
          (receiver.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(t * 3.5) * 0.25;
        }
        const rail = weaponMesh.getObjectByName('weaponRail') as THREE.Mesh;
        if (rail && (rail.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
          (rail.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.cos(t * 3.5) * 0.3;
        }
      }

      // Recoil kick & recovery
      if (recoilRef.current > 0) {
        weaponMesh.position.z = -recoilRef.current * 0.12;
        weaponMesh.rotation.x -= recoilRef.current * 0.08;
        recoilRef.current = Math.max(0, recoilRef.current - delta * 6);

        if (flashLightRef.current) {
          flashLightRef.current.intensity = recoilRef.current * 8.0;
        }
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
  }, [weaponId, accentColor, skinId]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};
