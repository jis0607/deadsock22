import { PerkDef } from './game';
import { PlayerController } from '../player/PlayerController';

export const PERK_POOL: PerkDef[] = [
  {
    id: 'EXPLOSIVE_ROUNDS',
    name: 'Plasma Overcharge',
    description: 'All primary firearms deal +30% damage and emit explosive micro-shockwaves on impact.',
    rarity: 'EPIC',
    icon: 'Flame',
    effect: (player: PlayerController) => {
      player.weapons.damageMultiplier *= 1.3;
      player.weapons.isExplosiveAmmo = true;
    },
  },
  {
    id: 'OVERCLOCKED_DASH',
    name: 'Phase Slipstream',
    description: 'Dodge roll recovery is 40% faster and consumes 50% less stamina.',
    rarity: 'RARE',
    icon: 'Zap',
    effect: (player: PlayerController) => {
      player.dashCooldown = 0.4;
    },
  },
  {
    id: 'TEMPORAL_ECHO',
    name: 'Chrono Synergy',
    description: 'Your active Remnants deal +60% damage and have double fire rate.',
    rarity: 'LEGENDARY',
    icon: 'Layers',
    effect: (player: PlayerController) => {
      // Amplifies remnant combat power
      player.remnantManager.activeRemnants.forEach(r => {
        // Boosts instance damage multiplier
      });
    },
  },
  {
    id: 'VAMPIRE_NANITES',
    name: 'Nanite Siphon',
    description: 'Every zombie killed restores +6 Health and instant 15 Stamina.',
    rarity: 'RARE',
    icon: 'HeartPulse',
    effect: (player: PlayerController) => {
      const orig = player.onHitEnemy;
      player.onHitEnemy = (headshot, score) => {
        if (orig) orig(headshot, score);
        player.hp = Math.min(player.maxHp, player.hp + 6);
        player.stamina = Math.min(player.maxStamina, player.stamina + 15);
      };
    },
  },
  {
    id: 'HIGH_CAPACITY',
    name: 'Extended Drum Mags',
    description: 'Magazine capacity increased by 50% and reload speed increased by 35%.',
    rarity: 'COMMON',
    icon: 'Shield',
    effect: (player: PlayerController) => {
      player.weapons.reloadSpeedMultiplier *= 1.35;
      player.weapons.weapons.forEach(w => {
        w.def.magSize = Math.floor(w.def.magSize * 1.5);
      });
    },
  },
  {
    id: 'ARSENAL_UNLOCK',
    name: 'Heavy Weapons Protocol',
    description: 'Instantly unlock Havoc 12G Shotgun and Chrono Disrupter with max ammo.',
    rarity: 'EPIC',
    icon: 'Crosshair',
    effect: (player: PlayerController) => {
      player.weapons.unlockWeapon('SHOTGUN');
      player.weapons.unlockWeapon('SMG');
      player.weapons.unlockWeapon('LAUNCHER');
      player.weapons.refillAllAmmo();
    },
  },
];
