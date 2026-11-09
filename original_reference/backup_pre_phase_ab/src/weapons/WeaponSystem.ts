import * as THREE from 'three';
import { WeaponDef, WeaponType } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import { VFXSystem } from '../effects/VFXSystem';

export const WEAPON_REGISTRY: Record<WeaponType, WeaponDef> = {
  PISTOL: {
    id: 'PISTOL',
    name: 'Tactical P9',
    category: 'Sidearm',
    damage: 38,
    fireRate: 4.5,
    magSize: 12,
    maxAmmo: 999, // infinite reserve for sidearm
    reloadTime: 1.2,
    spread: 0.015,
    pellets: 1,
    range: 50,
    recoilKick: 0.04,
    bulletSpeed: 95,
    soundType: 'pistol',
    color: '#00e1d9',
    description: 'Crisp, high-precision tactical sidearm with fast reload.',
  },
  RIFLE: {
    id: 'RIFLE',
    name: 'Valkyrie AR-15',
    category: 'Assault Rifle',
    damage: 32,
    fireRate: 8.5,
    magSize: 30,
    maxAmmo: 180,
    reloadTime: 1.8,
    spread: 0.028,
    pellets: 1,
    range: 65,
    recoilKick: 0.065,
    bulletSpeed: 110,
    soundType: 'rifle',
    color: '#3b82f6',
    description: 'Full-automatic combat rifle with dependable stopping power.',
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'Havoc 12G',
    category: 'Shotgun',
    damage: 24, // x 8 pellets = 192 total point-blank!
    fireRate: 1.4,
    magSize: 8,
    maxAmmo: 48,
    reloadTime: 2.2,
    spread: 0.09,
    pellets: 8,
    range: 28,
    recoilKick: 0.18,
    bulletSpeed: 80,
    soundType: 'shotgun',
    color: '#f59e0b',
    description: 'Devastating 8-pellet buckshot spread for close-quarters crowd control.',
  },
  SMG: {
    id: 'SMG',
    name: 'Spectre-9',
    category: 'Submachine Gun',
    damage: 20,
    fireRate: 14.0,
    magSize: 40,
    maxAmmo: 240,
    reloadTime: 1.4,
    spread: 0.045,
    pellets: 1,
    range: 35,
    recoilKick: 0.035,
    bulletSpeed: 100,
    soundType: 'smg',
    color: '#10b981',
    description: 'Ultra-high cyclic rate designed for run-and-gun mobility.',
  },
  LAUNCHER: {
    id: 'LAUNCHER',
    name: 'Chrono Disrupter',
    category: 'Heavy Special',
    damage: 280, // Heavy AoE
    fireRate: 1.0,
    magSize: 4,
    maxAmmo: 16,
    reloadTime: 2.8,
    spread: 0.01,
    pellets: 1,
    range: 45,
    recoilKick: 0.22,
    bulletSpeed: 45,
    soundType: 'launcher',
    color: '#8b5cf6',
    description: 'Fires high-yield temporal explosive spheres that obliterate hordes.',
  },
};

export interface WeaponState {
  def: WeaponDef;
  currentMag: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  lastShotTime: number;
}

export class WeaponInventory {
  public weapons: Map<WeaponType, WeaponState> = new Map();
  public unlockedWeapons: WeaponType[] = ['PISTOL', 'RIFLE'];
  public activeWeapon: WeaponType = 'RIFLE';

  // Temporary damage multipliers from perks
  public damageMultiplier = 1.0;
  public fireRateMultiplier = 1.0;
  public reloadSpeedMultiplier = 1.0;
  public isExplosiveAmmo = false;
  public isPiercingAmmo = false;

  constructor() {
    // Initialize standard arsenal
    (Object.keys(WEAPON_REGISTRY) as WeaponType[]).forEach((type) => {
      const def = WEAPON_REGISTRY[type];
      this.weapons.set(type, {
        def,
        currentMag: def.magSize,
        reserveAmmo: def.id === 'PISTOL' ? 999 : def.maxAmmo,
        isReloading: false,
        reloadTimer: 0,
        lastShotTime: 0,
      });
    });
  }

  public getActiveState(): WeaponState {
    return this.weapons.get(this.activeWeapon)!;
  }

  public switchWeapon(type: WeaponType): boolean {
    if (!this.unlockedWeapons.includes(type)) return false;
    if (this.activeWeapon === type) return false;

    // Interrupt reload if switching
    const current = this.getActiveState();
    if (current.isReloading) {
      current.isReloading = false;
      current.reloadTimer = 0;
    }

    this.activeWeapon = type;
    return true;
  }

  public unlockWeapon(type: WeaponType) {
    if (!this.unlockedWeapons.includes(type)) {
      this.unlockedWeapons.push(type);
    }
  }

  public startReload(): boolean {
    const state = this.getActiveState();
    if (state.isReloading) return false;
    if (state.currentMag >= state.def.magSize) return false;
    if (state.reserveAmmo <= 0 && state.def.id !== 'PISTOL') return false;

    state.isReloading = true;
    state.reloadTimer = state.def.reloadTime / this.reloadSpeedMultiplier;
    soundManager.playReload();
    return true;
  }

  public update(dt: number) {
    // Update reloading on all weapons
    this.weapons.forEach((state) => {
      if (state.isReloading) {
        state.reloadTimer -= dt;
        if (state.reloadTimer <= 0) {
          state.isReloading = false;
          state.reloadTimer = 0;

          const needed = state.def.magSize - state.currentMag;
          if (state.def.id === 'PISTOL') {
            state.currentMag = state.def.magSize;
          } else {
            const transfer = Math.min(needed, state.reserveAmmo);
            state.currentMag += transfer;
            state.reserveAmmo -= transfer;
          }
        }
      }
    });
  }

  public canShoot(now: number): boolean {
    const state = this.getActiveState();
    if (state.isReloading) return false;
    if (state.currentMag <= 0) return false;

    const interval = 1.0 / (state.def.fireRate * this.fireRateMultiplier);
    return now - state.lastShotTime >= interval;
  }

  public consumeShot(now: number) {
    const state = this.getActiveState();
    state.currentMag = Math.max(0, state.currentMag - 1);
    state.lastShotTime = now;

    // Auto reload if mag empty
    if (state.currentMag === 0) {
      this.startReload();
    }
  }

  public addAmmo(type: WeaponType, amount: number) {
    const state = this.weapons.get(type);
    if (state && state.def.id !== 'PISTOL') {
      state.reserveAmmo = Math.min(state.def.maxAmmo * 2, state.reserveAmmo + amount);
    }
  }

  public refillAllAmmo() {
    this.weapons.forEach((state) => {
      if (state.def.id !== 'PISTOL') {
        state.reserveAmmo = state.def.maxAmmo;
        state.currentMag = state.def.magSize;
      }
    });
  }
}
