import * as THREE from 'three';

export interface CollidableBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  type: 'wall' | 'vehicle' | 'prop' | 'barrel' | 'structure';
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

export interface IMapEnvironment {
  id: string;
  name: string;
  group: THREE.Group;
  colliders: CollidableBox[];
  explosiveBarrels: { mesh: THREE.Group; pos: THREE.Vector3; hp: number; exploded: boolean }[];
  supplyCrates: InteractiveSupplyCrate[];
  extractionBeacon: { mesh: THREE.Group; light: THREE.PointLight; pos: THREE.Vector3; active: boolean };
  currentLightingMode: 'DAY' | 'NIGHT';
  setLightingMode(mode: 'DAY' | 'NIGHT'): void;
  toggleLightingMode(): 'DAY' | 'NIGHT';
  update(dt: number, time: number): void;
  activateExtraction(): void;
  deactivateExtraction(): void;
  isPlayerInExtractionZone(pos: THREE.Vector3, zoneRadius?: number): boolean;
  checkCollision(pos: THREE.Vector3, radius: number): { hit: boolean; pushOut: THREE.Vector3; collider?: CollidableBox };
  removeCollider(obj: THREE.Object3D): void;
  dispose(): void;
}
