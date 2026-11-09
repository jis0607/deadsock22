export type GameMode = 'SOLO' | 'LOCAL_COOP' | 'ONLINE_COOP';
export type PlayerId = 'P1' | 'P2';
export type PlayerStateStatus = 'ALIVE' | 'DOWNED' | 'DEAD';
export type P2ControlScheme = 'GAMEPAD' | 'KEYBOARD_SPLIT';

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

// --- COSMETICS & PRESENTATION TYPES ---

export type CosmeticRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type GunSkinCollection =
  | 'Military Camouflage'
  | 'Desert Camouflage'
  | 'Woodland Camouflage'
  | 'Arctic Camouflage'
  | 'Matte Black & Carbon'
  | 'Gold & Platinum'
  | 'Inferno Fire'
  | 'Frost Ice'
  | 'Neon Futuristic'
  | 'Legendary Animated';

export interface GunSkin {
  id: string;
  name: string;
  collection: GunSkinCollection;
  rarity: CosmeticRarity;
  description: string;
  colorHex: string;
  accentHex: string;
  patternType:
    | 'digital_camo'
    | 'desert_brush'
    | 'woodland_splinter'
    | 'arctic_mesh'
    | 'carbon_weave'
    | 'gold_specular'
    | 'inferno_flame'
    | 'frost_ice'
    | 'neon_grid'
    | 'chrono_void';
  isAnimated: boolean;
  unlocked: boolean;
  unlockRequirement: string;
  creditCost?: number;
}

export type CharacterSlotType = 'outfit' | 'helmet' | 'mask' | 'backpack' | 'gloves' | 'accessory';

export interface CharacterCosmeticItem {
  id: string;
  slot: CharacterSlotType;
  name: string;
  rarity: CosmeticRarity;
  description: string;
  colorHex: string;
  accentHex: string;
  meshStyle: string;
  unlocked: boolean;
  unlockRequirement: string;
  creditCost?: number;
}

export interface PlayerCosmeticLoadout {
  weaponSkinId: string;
  outfitId: string;
  helmetId: string;
  maskId: string;
  backpackId: string;
  glovesId: string;
  accessoryId: string;
}

export interface Character {
  id: string;
  name: string;
  callsign: string;
  role: 'Assault' | 'Recon' | 'Heavy' | 'Bio-Medic';
  color: string;
  secondaryColor: string;
  description: string;
  lore: string;
  abilityName: string;
  abilityDescription: string;
  cooldown: number;
  stats: {
    firepower: number;
    mobility: number;
    defense: number;
    chronoSync: number;
  };
  outfits: { id: string; name: string; color: string; unlocked: boolean }[];
  unlocked: boolean;
}

export interface WeaponAttachment {
  type: 'optic' | 'barrel' | 'magazine';
  name: string;
  bonus: string;
}

export interface Weapon {
  id: string;
  name: string;
  category: 'Assault Rifle' | 'SMG' | 'Shotgun' | 'Sniper' | 'Heavy Energy';
  description: string;
  color: string;
  damage: number;
  fireRate: number; // rounds per sec
  magazineSize: number;
  reserveAmmo: number;
  range: number;
  recoil: number;
  reloadTime: number; // seconds
  attachments: {
    optics: WeaponAttachment[];
    barrels: WeaponAttachment[];
    magazines: WeaponAttachment[];
  };
  selectedOptic: number;
  selectedBarrel: number;
  selectedMagazine: number;
  skins: { id: string; name: string; color: string; accent: string; unlocked: boolean }[];
  selectedSkin: number;
}

export interface GameMap {
  id: string;
  name: string;
  subtitle: string;
  tier: 'TIER 1 - NORMAL' | 'TIER 2 - ELEVATED' | 'TIER 3 - NIGHTMARE';
  environment: string;
  weather: 'Acid Rain' | 'Toxic Smog' | 'Midnight Storm' | 'Ash Fall';
  description: string;
  threatLevel: number; // 1 - 5
  recommendedPower: number;
  objectives: string[];
  extractionZone: string;
  accentColor: string;
}

export interface GameModeInfo {
  id: 'solo' | 'coop' | 'endless' | 'campaign' | 'extraction' | 'boss';
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  playerLimit: string;
  rewardTier: string;
  imageAccent: string;
}

export interface PlayerData {
  id: string;
  name: string;
  characterId: string;
  weaponId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitch: number;
  isAiming: boolean;
  isShooting: boolean;
  state: 'idle' | 'running' | 'shooting' | 'downed' | 'reviving' | 'dead';
  health: number;
  maxHealth: number;
  armor: number;
  score: number;
  kills: number;
  isReady: boolean;
  cosmetics?: PlayerCosmeticLoadout;
  lastChronoEcho?: { x: number; y: number; z: number; timestamp: number };
}

export interface ZombieEntity {
  id: string;
  type: 'walker' | 'runner' | 'brute' | 'acid_spitter';
  x: number;
  y: number;
  z: number;
  rotY: number;
  health: number;
  maxHealth: number;
  targetPlayerId: string | null;
  state: 'chase' | 'attack' | 'stagger' | 'dead';
  speed: number;
}

export interface ChronoRemnant {
  id: string;
  ownerId: string;
  ownerName: string;
  x: number;
  y: number;
  z: number;
  characterId: string;
  createdAt: number;
  duration: number;
}

export interface KillFeedEntry {
  id: string;
  killerName: string;
  victimType: string;
  weaponName: string;
  isHeadshot: boolean;
  timestamp: number;
}
