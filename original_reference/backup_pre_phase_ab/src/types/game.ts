export type Playstyle = 'AGGRESSIVE' | 'MARKSMAN' | 'RUNNER' | 'DEFENDER' | 'SCAVENGER' | 'BERSERKER';

export type ZombieType = 'SHAMBLER' | 'RUNNER' | 'BRUTE' | 'SPITTER' | 'HUNTER' | 'BOSS_RECKONER';

export type WeaponType = 'PISTOL' | 'RIFLE' | 'SHOTGUN' | 'SMG' | 'LAUNCHER';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // shots per second
  magSize: number;
  maxAmmo: number;
  reloadTime: number; // in seconds
  spread: number; // in radians
  pellets: number;
  range: number;
  recoilKick: number;
  bulletSpeed: number;
  soundType: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'launcher';
  color: string;
  description: string;
}

export interface RemnantFrame {
  t: number; // time in ms from run start
  pos: [number, number, number];
  rotY: number;
  pitch: number;
  anim: 'idle' | 'walk' | 'run' | 'sprint' | 'shoot' | 'reload' | 'dash' | 'hit' | 'death';
  weaponId: WeaponType;
  action?: 'shoot' | 'reload' | 'dash' | 'switch' | 'none';
  shootTarget?: [number, number, number];
}

export interface RemnantRun {
  id: string;
  runNumber: number;
  timestamp: number;
  survivalTime: number; // seconds
  kills: number;
  score: number;
  damageDealt: number;
  shotsFired: number;
  shotsHit: number;
  distanceTraveled: number;
  primaryWeapon: WeaponType;
  playstyle: Playstyle;
  causeOfDeath: string;
  frames: RemnantFrame[];
  color: string;
  activeInRun?: boolean;
}

export interface PerkDef {
  id: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  icon: string;
  effect: (player: any) => void;
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  mouseSensitivity: number;
  fov: number;
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
  invertY: boolean;
  crosshairStyle: 'DOT' | 'CROSS' | 'CIRCLE';
  lightingMode: 'DAY' | 'NIGHT';
  showDamageNumbers: boolean;
}

export interface DamagePopupItem {
  id: number;
  x: number;
  y: number;
  amount: number;
  isHeadshot: boolean;
  isMelee?: boolean;
  opacity: number;
}

export interface GameStats {
  score: number;
  kills: number;
  wave: number;
  timeSurvived: number;
  damageDealt: number;
  headshots: number;
  remnantsActive: number;
  remnantKills: number;
}
