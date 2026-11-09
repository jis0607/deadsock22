import { GunSkin, CharacterCosmeticItem } from '../types/game';

export const GUN_SKINS: GunSkin[] = [
  // 1. Military Camouflage
  {
    id: 'skin_mil_urban',
    name: 'URBAN TACTICAL CAMO',
    collection: 'Military Camouflage',
    rarity: 'Common',
    description: 'Standard-issue digital grey and slate camouflage designed for downtown concrete warfare.',
    colorHex: '#334155',
    accentHex: '#94a3b8',
    patternType: 'digital_camo',
    isAnimated: false,
    unlocked: true,
    unlockRequirement: 'Unlocked by Default',
    creditCost: 0
  },
  {
    id: 'skin_mil_specops',
    name: 'DIGITAL NIGHT OPS',
    collection: 'Military Camouflage',
    rarity: 'Uncommon',
    description: 'Low-reflectivity midnight pixel pattern tailored for high-threat covert raids.',
    colorHex: '#1e293b',
    accentHex: '#0ea5e9',
    patternType: 'digital_camo',
    isAnimated: false,
    unlocked: true,
    unlockRequirement: 'Complete Sector 4 Extraction',
    creditCost: 1200
  },

  // 2. Desert Camouflage
  {
    id: 'skin_desert_dune',
    name: 'SANDSTORM DUNES',
    collection: 'Desert Camouflage',
    rarity: 'Common',
    description: 'Triple-tone arid khaki and burnt sienna finish engineered for scorched outposts.',
    colorHex: '#78350f',
    accentHex: '#d97706',
    patternType: 'desert_brush',
    isAnimated: false,
    unlocked: true,
    unlockRequirement: 'Reach Player Level 5',
    creditCost: 800
  },
  {
    id: 'skin_desert_nomad',
    name: 'NOMAD SCORPION',
    collection: 'Desert Camouflage',
    rarity: 'Rare',
    description: 'Textured desert viper pattern featuring heat-resistant ceramic coating.',
    colorHex: '#92400e',
    accentHex: '#f59e0b',
    patternType: 'desert_brush',
    isAnimated: false,
    unlocked: false,
    unlockRequirement: 'Kill 50 Infected in Industrial Foundry',
    creditCost: 2500
  },

  // 3. Woodland Camouflage
  {
    id: 'skin_wood_flora',
    name: 'DENSE FLORA SPLINTER',
    collection: 'Woodland Camouflage',
    rarity: 'Common',
    description: 'Deep olive and pine splinter pattern optimized for overgrown quarantine sectors.',
    colorHex: '#14532d',
    accentHex: '#4ade80',
    patternType: 'woodland_splinter',
    isAnimated: false,
    unlocked: true,
    unlockRequirement: 'Unlocked by Default',
    creditCost: 0
  },
  {
    id: 'skin_wood_hunter',
    name: 'APEX PREDATOR GREEN',
    collection: 'Woodland Camouflage',
    rarity: 'Rare',
    description: 'High-density camouflage weave infused with bio-resistant anti-corrosion lacquer.',
    colorHex: '#166534',
    accentHex: '#22c55e',
    patternType: 'woodland_splinter',
    isAnimated: false,
    unlocked: false,
    unlockRequirement: 'Survive Wave 4 in Solo Incursion',
    creditCost: 3200
  },

  // 4. Arctic Camouflage
  {
    id: 'skin_arctic_tundra',
    name: 'SUB-ZERO BLIZZARD',
    collection: 'Arctic Camouflage',
    rarity: 'Uncommon',
    description: 'Pure matte chalk and arctic ice polygon mesh built for freezing winter deployments.',
    colorHex: '#0f172a',
    accentHex: '#38bdf8',
    patternType: 'arctic_mesh',
    isAnimated: false,
    unlocked: true,
    unlockRequirement: 'Reach Player Level 10',
    creditCost: 1500
  },
  {
    id: 'skin_arctic_frostwolf',
    name: 'GLACIER SHROUD',
    collection: 'Arctic Camouflage',
    rarity: 'Epic',
    description: 'Cryo-blasted matte finish with subtle frosted condensation along the barrel.',
    colorHex: '#0369a1',
    accentHex: '#7dd3fc',
    patternType: 'arctic_mesh',
    isAnimated: false,
    unlocked: false,
    unlockRequirement: 'Defeat 25 Runner Strains',
    creditCost: 4500
  },

  // 5. Matte Black & Carbon
  {
    id: 'skin_carbon_weave',
    name: 'OBSIDIAN CARBON FIBER',
    collection: 'Matte Black & Carbon',
    rarity: 'Rare',
    description: 'Ultra-lightweight woven 3K carbon fiber composite paired with stealth matte black receiver.',
    colorHex: '#0a0a0a',
    accentHex: '#06b6d4',
    patternType: 'carbon_weave',
    isAnimated: false,
    unlocked: true,
    unlockRequirement: 'Reach Player Level 15',
    creditCost: 3000
  },
  {
    id: 'skin_carbon_titanium',
    name: 'BLACKOUT TITANIUM',
    collection: 'Matte Black & Carbon',
    rarity: 'Epic',
    description: 'Brushed anodized dark titanium finish with zero glare for precision night sniping.',
    colorHex: '#18181b',
    accentHex: '#a1a1aa',
    patternType: 'carbon_weave',
    isAnimated: false,
    unlocked: false,
    unlockRequirement: 'Achieve 30 Sniper Headshots',
    creditCost: 5000
  },

  // 6. Gold & Platinum
  {
    id: 'skin_gold_sovereign',
    name: 'GILDED SOVEREIGN',
    collection: 'Gold & Platinum',
    rarity: 'Epic',
    description: '24-karat solid gold electroplated receiver with intricate royal filigree engraving.',
    colorHex: '#713f12',
    accentHex: '#facc15',
    patternType: 'gold_specular',
    isAnimated: false,
    unlocked: false,
    unlockRequirement: 'Reach Weapon Mastery Tier 3',
    creditCost: 8000
  },
  {
    id: 'skin_plat_mirror',
    name: 'PURE PLATINUM MIRROR',
    collection: 'Gold & Platinum',
    rarity: 'Legendary',
    description: 'Hand-polished mirror platinum chassis with high-specular chrome reflections.',
    colorHex: '#e2e8f0',
    accentHex: '#38bdf8',
    patternType: 'gold_specular',
    isAnimated: false,
    unlocked: false,
    unlockRequirement: 'Survive 10 Waves in Endless Horde',
    creditCost: 12000
  },

  // 7. Inferno / Fire Collection
  {
    id: 'skin_inferno_magma',
    name: 'MAGMA CORE IGNITION',
    collection: 'Inferno Fire',
    rarity: 'Epic',
    description: 'Volcanic basalt plating pulsating with glowing liquid molten cracks along the body.',
    colorHex: '#450a0a',
    accentHex: '#ef4444',
    patternType: 'inferno_flame',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: 'Eliminate 15 Brute Mutators',
    creditCost: 9500
  },
  {
    id: 'skin_inferno_phoenix',
    name: 'HELLFIRE PHOENIX',
    collection: 'Inferno Fire',
    rarity: 'Legendary',
    description: 'Superheated crimson alloy with dynamic incandescent thermal embers drifting from the vent.',
    colorHex: '#7f1d1d',
    accentHex: '#f97316',
    patternType: 'inferno_flame',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: 'Defeat Goliath Bio-Titan Boss',
    creditCost: 15000
  },

  // 8. Frost / Ice Collection
  {
    id: 'skin_frost_cryo',
    name: 'CRYO PERMAFROST SHARD',
    collection: 'Frost Ice',
    rarity: 'Epic',
    description: 'Translucent cryo-synthetic crystalline casing emitting cold vapor condensation.',
    colorHex: '#0c4a6e',
    accentHex: '#06b6d4',
    patternType: 'frost_ice',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: 'Execute 20 Chrono-Phase Rewinds',
    creditCost: 9500
  },
  {
    id: 'skin_frost_valkyrie',
    name: 'GLACIAL VALKYRIE',
    collection: 'Frost Ice',
    rarity: 'Legendary',
    description: 'Deep arctic glacier core with illuminated crystalline facets and zero thermal signature.',
    colorHex: '#164e63',
    accentHex: '#67e8f9',
    patternType: 'frost_ice',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: 'Extract successfully in 2-Player Co-op',
    creditCost: 16000
  },

  // 9. Neon Futuristic Collection
  {
    id: 'skin_neon_tokyo',
    name: 'CYBER TOKYO NEON',
    collection: 'Neon Futuristic',
    rarity: 'Legendary',
    description: 'Midnight carbon chassis wrapped with pulsating cyan and hot magenta neon circuit traces.',
    colorHex: '#581c87',
    accentHex: '#d946ef',
    patternType: 'neon_grid',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: 'Reach Player Level 35',
    creditCost: 18000
  },
  {
    id: 'skin_neon_synth',
    name: 'QUANTUM LASER PULSE',
    collection: 'Neon Futuristic',
    rarity: 'Epic',
    description: 'Vibrant neon gridline patterns with responsive optical illumination when aiming down sights.',
    colorHex: '#022c22',
    accentHex: '#10b981',
    patternType: 'neon_grid',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: 'Complete Bio-Hazard Extraction Mission',
    creditCost: 11000
  },

  // 10. Legendary Animated Collection
  {
    id: 'skin_legendary_void',
    name: 'CHRONO-SINGULARITY VOID',
    collection: 'Legendary Animated',
    rarity: 'Mythic',
    description: 'Experimental weapon chassis forged from a collapsed tachyon rift. Spacetime visibly warps across the chamber with shifting starlight particles.',
    colorHex: '#09090b',
    accentHex: '#818cf8',
    patternType: 'chrono_void',
    isAnimated: true,
    unlocked: false,
    unlockRequirement: 'Mastery Achievement: 100 Headshot Eliminations',
    creditCost: 25000
  }
];

export const CHARACTER_COSMETICS: CharacterCosmeticItem[] = [
  // --- HELMETS ---
  {
    id: 'helm_none',
    slot: 'helmet',
    name: 'NO HELMET / BARE',
    rarity: 'Common',
    description: 'Standard hair and ocular tactical comms piece.',
    colorHex: '#0f172a',
    accentHex: '#06b6d4',
    meshStyle: 'none',
    unlocked: true,
    unlockRequirement: 'Unlocked by Default',
    creditCost: 0
  },
  {
    id: 'helm_fast_ballistic',
    slot: 'helmet',
    name: 'FAST BALLISTIC HELMET',
    rarity: 'Uncommon',
    description: 'Lightweight Kevlar combat helmet equipped with ARC accessory rails and ear protection.',
    colorHex: '#334155',
    accentHex: '#64748b',
    meshStyle: 'ballistic',
    unlocked: true,
    unlockRequirement: 'Reach Player Level 4',
    creditCost: 1000
  },
  {
    id: 'helm_cyber_visor',
    slot: 'helmet',
    name: 'CHRONO HUD CYBER HELM',
    rarity: 'Epic',
    description: 'Full-face polarized visor with real-time tachyon ocular targeting overlay.',
    colorHex: '#0891b2',
    accentHex: '#22d3ee',
    meshStyle: 'cyber_visor',
    unlocked: false,
    unlockRequirement: 'Perform 15 Chrono Decoys',
    creditCost: 5500
  },
  {
    id: 'helm_exo_breacher',
    slot: 'helmet',
    name: 'GOLIATH BREACHER CASQUE',
    rarity: 'Legendary',
    description: 'Reinforced heavy ballistic titanium plate designed to resist point-blank brute shockwaves.',
    colorHex: '#b45309',
    accentHex: '#f59e0b',
    meshStyle: 'heavy_exo',
    unlocked: false,
    unlockRequirement: 'Defeat Goliath Boss without dying',
    creditCost: 12000
  },

  // --- MASKS ---
  {
    id: 'mask_none',
    slot: 'mask',
    name: 'NO MASK',
    rarity: 'Common',
    description: 'Clear lower facial profile.',
    colorHex: '#000000',
    accentHex: '#000000',
    meshStyle: 'none',
    unlocked: true,
    unlockRequirement: 'Unlocked by Default',
    creditCost: 0
  },
  {
    id: 'mask_skull_half',
    slot: 'mask',
    name: 'TACTICAL SKULL BALACLAVA',
    rarity: 'Uncommon',
    description: 'Thermal-dampening neoprene half-mask emblazoned with a sinister phantom jaw.',
    colorHex: '#18181b',
    accentHex: '#f43f5e',
    meshStyle: 'skull',
    unlocked: true,
    unlockRequirement: 'Get 25 Headshots',
    creditCost: 1500
  },
  {
    id: 'mask_bio_respirator',
    slot: 'mask',
    name: 'CBRN BIO-RESPIRATOR',
    rarity: 'Rare',
    description: 'Dual-canister HEPA gas filter mask resistant to aerosolized mutation spores.',
    colorHex: '#14532d',
    accentHex: '#4ade80',
    meshStyle: 'respirator',
    unlocked: false,
    unlockRequirement: 'Clear Sector 4 on Tier 2 difficulty',
    creditCost: 3500
  },
  {
    id: 'mask_cyber_ninja',
    slot: 'mask',
    name: 'TACHYON PHANTOM FILTER',
    rarity: 'Legendary',
    description: 'Glow-vented cybernetic respirator with internal vocal scrambler.',
    colorHex: '#3b0764',
    accentHex: '#c084fc',
    meshStyle: 'cyber_respirator',
    unlocked: false,
    unlockRequirement: 'Survive Wave 8 in Endless Horde',
    creditCost: 9000
  },

  // --- BODY OUTFITS ---
  {
    id: 'outfit_urban_bdu',
    slot: 'outfit',
    name: 'TIER-1 URBAN COMBAT BDU',
    rarity: 'Common',
    description: 'Reinforced tactical ripstop battle dress uniform with multi-threat chest plate.',
    colorHex: '#1e293b',
    accentHex: '#06b6d4',
    meshStyle: 'urban',
    unlocked: true,
    unlockRequirement: 'Unlocked by Default',
    creditCost: 0
  },
  {
    id: 'outfit_desert_striker',
    slot: 'outfit',
    name: 'DESERT STRIKER UNIFORM',
    rarity: 'Uncommon',
    description: 'Sandstorm-treated coyote tan uniform with ceramic trauma plates.',
    colorHex: '#78350f',
    accentHex: '#f59e0b',
    meshStyle: 'desert',
    unlocked: true,
    unlockRequirement: 'Reach Player Level 6',
    creditCost: 1800
  },
  {
    id: 'outfit_stealth_ghillie',
    slot: 'outfit',
    name: 'GHOST STEALTH SHROUD',
    rarity: 'Rare',
    description: 'Thermal-cloaking composite mesh weave that diffuses infrared body heat.',
    colorHex: '#09090b',
    accentHex: '#ef4444',
    meshStyle: 'stealth',
    unlocked: false,
    unlockRequirement: 'Kill 40 Infected from over 30m distance',
    creditCost: 4200
  },
  {
    id: 'outfit_heavy_exo',
    slot: 'outfit',
    name: 'POWERED EXO-HYDRAULIC CHASSIS',
    rarity: 'Epic',
    description: 'Full-body motorized exo-skeleton with hardened tungsten plate carriers.',
    colorHex: '#374151',
    accentHex: '#f97316',
    meshStyle: 'heavy_exo',
    unlocked: false,
    unlockRequirement: 'Survive 3 waves with Bulwark',
    creditCost: 8500
  },
  {
    id: 'outfit_chrono_apex',
    slot: 'outfit',
    name: 'VANGUARD APEX SINGULARITY',
    rarity: 'Mythic',
    description: 'Legendary prototype bio-suit forged from tachyon alloy. Glowing harmonic lines trace operative muscle movement.',
    colorHex: '#1e1b4b',
    accentHex: '#818cf8',
    meshStyle: 'mythic_apex',
    unlocked: false,
    unlockRequirement: 'Attain Level 40 Vanguard Rank',
    creditCost: 24000
  },

  // --- BACKPACKS ---
  {
    id: 'pack_none',
    slot: 'backpack',
    name: 'SLIM SPINE HARNESS',
    rarity: 'Common',
    description: 'Minimalist tactical spine strap with standard emergency chronometer.',
    colorHex: '#18181b',
    accentHex: '#06b6d4',
    meshStyle: 'slim',
    unlocked: true,
    unlockRequirement: 'Unlocked by Default',
    creditCost: 0
  },
  {
    id: 'pack_assault',
    slot: 'backpack',
    name: 'TACTICAL 3-DAY RUCKSACK',
    rarity: 'Uncommon',
    description: 'Heavy cordura MOLLE backpack carrying backup mags and field medical kits.',
    colorHex: '#334155',
    accentHex: '#64748b',
    meshStyle: 'rucksack',
    unlocked: true,
    unlockRequirement: 'Reach Player Level 8',
    creditCost: 1500
  },
  {
    id: 'pack_tachyon_core',
    slot: 'backpack',
    name: 'CHRONO-CORE TACHYON GENERATOR',
    rarity: 'Epic',
    description: 'High-yield temporal particle reactor mounted to spine with rotating coolant turbine.',
    colorHex: '#0c4a6e',
    accentHex: '#06b6d4',
    meshStyle: 'tachyon_core',
    unlocked: false,
    unlockRequirement: 'Rewind from fatal damage 5 times',
    creditCost: 7500
  },
  {
    id: 'pack_cyber_drone',
    slot: 'backpack',
    name: 'AUTONOMOUS RECON DRONE POD',
    rarity: 'Legendary',
    description: 'Compact docking pod carrying a dormant aerial scouting micro-drone.',
    colorHex: '#1e1b4b',
    accentHex: '#a855f7',
    meshStyle: 'drone_pod',
    unlocked: false,
    unlockRequirement: 'Revive 5 squadmates in Online Co-op',
    creditCost: 12500
  },

  // --- ACCESSORIES ---
  {
    id: 'acc_none',
    slot: 'accessory',
    name: 'STANDARD RIG',
    rarity: 'Common',
    description: 'Clean operative silhouette.',
    colorHex: '#000000',
    accentHex: '#000000',
    meshStyle: 'none',
    unlocked: true,
    unlockRequirement: 'Unlocked by Default',
    creditCost: 0
  },
  {
    id: 'acc_radio',
    slot: 'accessory',
    name: 'TACTICAL SHOULDER COMM-LINK',
    rarity: 'Uncommon',
    description: 'Encrypted long-range squad radio with illuminated frequency display.',
    colorHex: '#1e293b',
    accentHex: '#10b981',
    meshStyle: 'shoulder_radio',
    unlocked: true,
    unlockRequirement: 'Play 1 Co-op match',
    creditCost: 1000
  },
  {
    id: 'acc_bandolier',
    slot: 'accessory',
    name: 'HEAVY AMMO BANDOLIER',
    rarity: 'Rare',
    description: 'Chest-slung cross bandolier packed with heavy tungsten shotgun shells.',
    colorHex: '#78350f',
    accentHex: '#f59e0b',
    meshStyle: 'bandolier',
    unlocked: false,
    unlockRequirement: 'Fire 1000 rounds of ammunition',
    creditCost: 3500
  },
  {
    id: 'acc_holo_tag',
    slot: 'accessory',
    name: 'VANGUARD HOLOGRAPHIC ARM TAG',
    rarity: 'Legendary',
    description: 'Arm-mounted tachyon projector displaying operative rank and live biometric vitals.',
    colorHex: '#0891b2',
    accentHex: '#67e8f9',
    meshStyle: 'holo_tag',
    unlocked: false,
    unlockRequirement: 'Extract with 90%+ health remaining',
    creditCost: 8000
  }
];

export const DEFAULT_COSMETIC_LOADOUT = {
  weaponSkinId: 'skin_mil_urban',
  outfitId: 'outfit_urban_bdu',
  helmetId: 'helm_fast_ballistic',
  maskId: 'mask_skull_half',
  backpackId: 'pack_assault',
  glovesId: 'gloves_kevlar',
  accessoryId: 'acc_radio'
};
