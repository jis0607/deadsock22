import { Character, Weapon, GameMap, GameModeInfo } from '../types/game';

export const CHARACTERS: Character[] = [
  {
    id: 'viper',
    name: 'Elena "Viper" Vance',
    callsign: 'VIPER-01',
    role: 'Assault',
    color: '#06b6d4', // Cyan
    secondaryColor: '#0891b2',
    description: 'Former Tier-1 Infiltration Operative equipped with experimental tachyon combat relays.',
    lore: 'During the initial containment breach in Sector 4, Vance survived 14 days behind quarantine lines by synchronizing her nervous system with prototype Chrono-Remnant tech.',
    abilityName: 'CHRONO-PHASE ECHO',
    abilityDescription: 'Splits spacetime to leave a holographic decoy at your current coordinate that draws zombie aggression while you rewind health and blink back 4 seconds.',
    cooldown: 18,
    stats: {
      firepower: 85,
      mobility: 95,
      defense: 65,
      chronoSync: 90
    },
    outfits: [
      { id: 'v_urban', name: 'Ghost Ops Camo', color: '#06b6d4', unlocked: true },
      { id: 'v_obsidian', name: 'Obsidian Syndicate', color: '#ef4444', unlocked: true },
      { id: 'v_gold', name: 'Vanguard Elite', color: '#eab308', unlocked: false }
    ],
    unlocked: true
  },
  {
    id: 'ghost',
    name: 'Logan "Ghost" Thorne',
    callsign: 'REAPER-04',
    role: 'Recon',
    color: '#ef4444', // Red
    secondaryColor: '#b91c1c',
    description: 'Covert marksman utilizing cloaking tachyon arrays to spot weakpoints and eliminate targets at range.',
    lore: 'A phantom across the ruined skyline, Thorne’s ocular implants detect mutant bio-signatures through reinforced walls and fog.',
    abilityName: 'TEMPORAL CLOAK & CRIT',
    abilityDescription: 'Enters 6 seconds of refractive stealth. The next shot gains a 350% critical damage multiplier and reveals all nearby mutations on the radar.',
    cooldown: 22,
    stats: {
      firepower: 95,
      mobility: 80,
      defense: 55,
      chronoSync: 85
    },
    outfits: [
      { id: 'g_night', name: 'Blackout Shroud', color: '#ef4444', unlocked: true },
      { id: 'g_arctic', name: 'Sub-Zero Stalker', color: '#38bdf8', unlocked: true },
      { id: 'g_specops', name: 'Cyber Hunter', color: '#a855f7', unlocked: false }
    ],
    unlocked: true
  },
  {
    id: 'bulwark',
    name: 'Marcus "Bulwark" Stone',
    callsign: 'TITAN-02',
    role: 'Heavy',
    color: '#f97316', // Orange
    secondaryColor: '#c2410c',
    description: 'Armored combat engineer clad in powered exo-hydraulic chassis built to withstand brute charges.',
    lore: 'Stationed at the outer perimeter gate during the First Wave, Marcus held the quarantine door single-handedly until civilian evac choppers took off.',
    abilityName: 'KINETIC BULWARK SHIELD',
    abilityDescription: 'Deploys an immovable tachyon forcefield that repels undead lunges and supercharges teammate weapon velocity when firing through it.',
    cooldown: 25,
    stats: {
      firepower: 90,
      mobility: 55,
      defense: 100,
      chronoSync: 70
    },
    outfits: [
      { id: 'b_hazard', name: 'Industrial Hazard', color: '#f97316', unlocked: true },
      { id: 'b_iron', name: 'Iron Forged', color: '#64748b', unlocked: true },
      { id: 'b_titanium', name: 'Goliath Plating', color: '#10b981', unlocked: false }
    ],
    unlocked: true
  },
  {
    id: 'nyx',
    name: 'Dr. Maya "Nyx" Lin',
    callsign: 'AEGIS-03',
    role: 'Bio-Medic',
    color: '#a855f7', // Purple
    secondaryColor: '#7e22ce',
    description: 'Combat surgeon specializing in cellular chrono-reversal and bio-synthesis nanites.',
    lore: 'Chief virologist of the Aegis Project who synthesized the first stabilizing antigen by distilling temporal remnants left behind in mutation rifts.',
    abilityName: 'CHRONO-REVIVE BEACON',
    abilityDescription: 'Channels bio-temporal nanites that regenerate teammate health in an 8m radius and instantly revives any downed ally in line of sight.',
    cooldown: 20,
    stats: {
      firepower: 70,
      mobility: 85,
      defense: 75,
      chronoSync: 100
    },
    outfits: [
      { id: 'n_aegis', name: 'Aegis Bio-Suit', color: '#a855f7', unlocked: true },
      { id: 'n_crimson', name: 'Red Cross Combatant', color: '#f43f5e', unlocked: true },
      { id: 'n_holo', name: 'Quantum Luminary', color: '#2dd4bf', unlocked: false }
    ],
    unlocked: true
  }
];

export const WEAPONS: Weapon[] = [
  {
    id: 'ar_chronostrike',
    name: 'AR-9 CHRONO-STRIKE',
    category: 'Assault Rifle',
    description: 'Standard issue rapid-cycle bullpup rifle chambered in 6.8mm hyper-velocity kinetic rounds.',
    color: '#06b6d4',
    damage: 38,
    fireRate: 11, // rounds/sec
    magazineSize: 32,
    reserveAmmo: 192,
    range: 65,
    recoil: 32,
    reloadTime: 1.8,
    attachments: {
      optics: [
        { type: 'optic', name: 'Red Dot Reflex', bonus: '+15% ADS Speed' },
        { type: 'optic', name: 'Holo Sight 2x', bonus: '+25% Precision Zoom' },
        { type: 'optic', name: 'ACOG 3.5x Tactical', bonus: '+40% Range & Headshot' }
      ],
      barrels: [
        { type: 'barrel', name: 'Flash Suppressor', bonus: '-20% Muzzle Smoke' },
        { type: 'barrel', name: 'Compensator V', bonus: '-35% Vertical Recoil' },
        { type: 'barrel', name: 'Heavy Rifled Barrel', bonus: '+20% Effective Range' }
      ],
      magazines: [
        { type: 'magazine', name: 'Standard 32-Rnd', bonus: 'Balanced handling' },
        { type: 'magazine', name: 'Extended 45-Rnd Drum', bonus: '+13 Ammo Capacity' },
        { type: 'magazine', name: 'Chrono-Infused Core', bonus: '+15% Damage vs Mutants' }
      ]
    },
    selectedOptic: 0,
    selectedBarrel: 1,
    selectedMagazine: 0,
    skins: [
      { id: 's_default', name: 'Tactical Matte Black', color: '#1e293b', accent: '#06b6d4', unlocked: true },
      { id: 's_camo', name: 'Urban Ashen Camo', color: '#475569', accent: '#94a3b8', unlocked: true },
      { id: 's_blood', name: 'Obsidian Crimson', color: '#7f1d1d', accent: '#ef4444', unlocked: true },
      { id: 's_gold', name: 'Vanguard Gold', color: '#713f12', accent: '#eab308', unlocked: false }
    ],
    selectedSkin: 0
  },
  {
    id: 'smg_vector',
    name: 'VECTOR-VAMPIRE 45',
    category: 'SMG',
    description: 'Ultra-compact submachine gun engineered for extreme rate-of-fire in confined urban quarters.',
    color: '#ef4444',
    damage: 26,
    fireRate: 16,
    magazineSize: 40,
    reserveAmmo: 240,
    range: 42,
    recoil: 28,
    reloadTime: 1.4,
    attachments: {
      optics: [
        { type: 'optic', name: 'Micro Reflex', bonus: '+20% ADS Speed' },
        { type: 'optic', name: 'Thermal CQB', bonus: 'Highlights infected in smoke' },
        { type: 'optic', name: 'Laser Aperture', bonus: '+30% Hipfire Accuracy' }
      ],
      barrels: [
        { type: 'barrel', name: 'Osprey Suppressor', bonus: 'Silent firing profile' },
        { type: 'barrel', name: 'Muzzle Brake', bonus: '-40% Horizontal Sway' },
        { type: 'barrel', name: 'Vented Shroud', bonus: '+10% Fire Rate' }
      ],
      magazines: [
        { type: 'magazine', name: 'Quick-Draw 40-Rnd', bonus: '-30% Reload Time' },
        { type: 'magazine', name: 'Drum 55-Rnd', bonus: '+15 Ammo Capacity' },
        { type: 'magazine', name: 'Hollow-Point 40', bonus: '+25% Stagger Chance' }
      ]
    },
    selectedOptic: 0,
    selectedBarrel: 0,
    selectedMagazine: 0,
    skins: [
      { id: 's_v_dark', name: 'Midnight Spec-Ops', color: '#0f172a', accent: '#ef4444', unlocked: true },
      { id: 's_v_toxic', name: 'Toxic Hazard Green', color: '#14532d', accent: '#22c55e', unlocked: true },
      { id: 's_v_neon', name: 'Cyberpunk Neon', color: '#581c87', accent: '#c084fc', unlocked: false }
    ],
    selectedSkin: 0
  },
  {
    id: 'sg_breaker',
    name: 'BREAKER-12 GAUGE',
    category: 'Shotgun',
    description: 'Semi-automatic tactical combat shotgun firing high-density tungsten buckshot pellets.',
    color: '#f97316',
    damage: 130,
    fireRate: 3.2,
    magazineSize: 10,
    reserveAmmo: 60,
    range: 30,
    recoil: 65,
    reloadTime: 2.2,
    attachments: {
      optics: [
        { type: 'optic', name: 'Ghost Ring Iron Sights', bonus: 'Maximum peripheral view' },
        { type: 'optic', name: 'Wide Reflex Circle', bonus: 'Optimal buckshot framing' },
        { type: 'optic', name: 'Holo Stalker', bonus: '+15% Medium Range Focus' }
      ],
      barrels: [
        { type: 'barrel', name: 'Choke Full-Bore', bonus: '-35% Pellet Spread' },
        { type: 'barrel', name: 'Duckbill Spreader', bonus: 'Horizontal wave pattern' },
        { type: 'barrel', name: 'Ported Breacher', bonus: '+40% Door / Barricade Blast' }
      ],
      magazines: [
        { type: 'magazine', name: 'Tube Extender (10)', bonus: 'Default combat load' },
        { type: 'magazine', name: 'Drum Mag (16)', bonus: '+6 Shells, slower reload' },
        { type: 'magazine', name: 'Incendiary Slugs (8)', bonus: 'Burn damage over 3s' }
      ]
    },
    selectedOptic: 1,
    selectedBarrel: 0,
    selectedMagazine: 0,
    skins: [
      { id: 's_sg_rust', name: 'Scavenger Rust', color: '#431407', accent: '#f97316', unlocked: true },
      { id: 's_sg_black', name: 'Armored Enforcer', color: '#1e293b', accent: '#e2e8f0', unlocked: true },
      { id: 's_sg_gold', name: 'Gilded Doom', color: '#713f12', accent: '#facc15', unlocked: false }
    ],
    selectedSkin: 0
  },
  {
    id: 'sn_widowmaker',
    name: 'WIDOWMAKER .50 BMG',
    category: 'Sniper',
    description: 'Anti-materiel heavy bolt rifle designed to sever bio-goliath limbs at extreme distances.',
    color: '#a855f7',
    damage: 280,
    fireRate: 1.1,
    magazineSize: 5,
    reserveAmmo: 30,
    range: 98,
    recoil: 80,
    reloadTime: 2.9,
    attachments: {
      optics: [
        { type: 'optic', name: 'Variable 6x-12x Scope', bonus: 'Dual-stage zoom' },
        { type: 'optic', name: 'Thermal Recon 8x', bonus: 'Penetrates smoke & walls' },
        { type: 'optic', name: 'Chrono-Lock 10x', bonus: 'Slow-motion hold breath' }
      ],
      barrels: [
        { type: 'barrel', name: 'Fluted Carbon 32"', bonus: '+15% Bullet Velocity' },
        { type: 'barrel', name: 'Titanium Suppressor', bonus: 'Dampens acoustic echo' },
        { type: 'barrel', name: 'Reinforced Muzzle', bonus: '-30% Flinch Kick' }
      ],
      magazines: [
        { type: 'magazine', name: 'Match Grade 5-Rnd', bonus: 'High precision ballistic' },
        { type: 'magazine', name: 'Armor Piercing AP-5', bonus: '+50% Penetration damage' },
        { type: 'magazine', name: 'Extended 8-Rnd Box', bonus: '+3 Capacity' }
      ]
    },
    selectedOptic: 0,
    selectedBarrel: 0,
    selectedMagazine: 0,
    skins: [
      { id: 's_sn_camo', name: 'Ghillie Dusk', color: '#1e293b', accent: '#a855f7', unlocked: true },
      { id: 's_sn_blood', name: 'Crimson Talon', color: '#881337', accent: '#f43f5e', unlocked: true },
      { id: 's_sn_chrome', name: 'Platinum Sovereign', color: '#334155', accent: '#38bdf8', unlocked: false }
    ],
    selectedSkin: 0
  }
];

export const MAPS: GameMap[] = [
  {
    id: 'neon_quarantine',
    name: 'SECTOR 4: NEON QUARANTINE',
    subtitle: 'DOWNTOWN METROPOLIS // RED ZONE',
    tier: 'TIER 1 - NORMAL',
    environment: 'Flooded Asphalt, Neon Shophouses, Crashed Armored Transports',
    weather: 'Acid Rain',
    description: 'The epicenter of the initial tachyon eruption. Abandoned evacuation convoys and collapsed pedestrian skybridges provide tactical high-ground against wandering hordes.',
    threatLevel: 2,
    recommendedPower: 120,
    objectives: [
      'Establish LZ perimeter at the crashed APC',
      'Purge 3 waves of mutant hostiles',
      'Deploy Chrono-Beacon for helicopter extraction'
    ],
    extractionZone: 'Central Crossroads // Rooftop Pad 4',
    accentColor: '#06b6d4'
  },
  {
    id: 'industrial_foundry',
    name: 'BLACKOUT FOUNDRY COMPLEX',
    subtitle: 'SUB-LEVEL INDUSTRIAL SMELTER // SECTOR 9',
    tier: 'TIER 2 - ELEVATED',
    environment: 'Molten Metal Vats, Narrow Catwalks, Heavy Machinery Shadows',
    weather: 'Ash Fall',
    description: 'An automated steel refining plant where emergency generators failed. Tight catwalks make brute encounters fatal without cooperative crossfire.',
    threatLevel: 3,
    recommendedPower: 240,
    objectives: [
      'Override blast doors on Sub-Level 2',
      'Defend power turbine for 90 seconds',
      'Exfiltrate via freight elevator before meltdown'
    ],
    extractionZone: 'Freight Platform 02 // North Shaft',
    accentColor: '#f97316'
  },
  {
    id: 'subway_terminus',
    name: 'SUBWAY TERMINUS PROTOCOL',
    subtitle: 'CENTRAL TRANSIT HUB // DEEP UNDERGROUND',
    tier: 'TIER 2 - ELEVATED',
    environment: 'Subterranean Rail Tracks, Derailment Wreckage, Flickering Emergency Lights',
    weather: 'Toxic Smog',
    description: 'Deep below the surface, thousands of evacuees were trapped inside subway tunnels. Highly aggressive runner strains thrive in the darkness.',
    threatLevel: 4,
    recommendedPower: 380,
    objectives: [
      'Clear tunnel blockades with C4 breach charges',
      'Neutralize Screamer mutation nests',
      'Secure the last outbound maintenance trolley'
    ],
    extractionZone: 'Platform 3 // Express Tunnel B',
    accentColor: '#a855f7'
  },
  {
    id: 'skyline_helipad',
    name: 'APEX SKYLINE EXTRACTION',
    subtitle: 'CORPO-TOWER ROOFTOP // ALTITUDE 450M',
    tier: 'TIER 3 - NIGHTMARE',
    environment: 'Open Rooftop Helipad, Antennas, Gale Force Winds, Lightning',
    weather: 'Midnight Storm',
    description: 'The highest point in the quarantined zone. Thunderstorms rattle the glass canopy as apex Goliath mutants scale the tower exterior.',
    threatLevel: 5,
    recommendedPower: 550,
    objectives: [
      'Survive category-5 storm gale and horde breach',
      'Defeat Goliath Bio-Titan in the rooftop arena',
      'Signal EVAC chopper via flare gun and board'
    ],
    extractionZone: 'Helipad Alpha // Tower Pinnacle',
    accentColor: '#ef4444'
  },
  {
    id: 'military_bunker',
    name: 'MILITARY BUNKER OMEGA',
    subtitle: 'SUBTERRANEAN COMMAND COMPLEX // BLACK OPS',
    tier: 'TIER 3 - NIGHTMARE',
    environment: 'Blast Doors, Containment Biolabs, Flashing Red Klaxons',
    weather: 'Toxic Smog',
    description: 'Deep military bioweapons research facility. Heavy blast doors and containment cylinders hold mutating bio-titans.',
    threatLevel: 5,
    recommendedPower: 600,
    objectives: [
      'Override bio-containment lock',
      'Purge specimen outbreak',
      'Evacuate through bunker blast shaft'
    ],
    extractionZone: 'Command Shaft // Blast Platform 01',
    accentColor: '#10b981'
  }
];

export const GAME_MODES: GameModeInfo[] = [
  {
    id: 'solo',
    title: 'SOLO INCURSION',
    badge: 'SINGLE-PLAYER',
    subtitle: 'TACTICAL LONE-WOLF DEPLOYMENT',
    description: 'Infiltrate quarantined sectors alone. Rely on personal weapon mastery and your Chrono-Remnant echo to outmaneuver swarms without squad backup.',
    playerLimit: '1 Player',
    rewardTier: '100% EXP // Solo Trophies',
    imageAccent: 'from-cyan-950 via-slate-900 to-black'
  },
  {
    id: 'coop',
    title: 'ONLINE CO-OP STRIKE',
    badge: 'FREE FIRE-STYLE MULTIPLAYER',
    subtitle: '2-PLAYER REAL-TIME DUO SQUAD',
    description: 'Team up with another player across independent screens via online room code. Coordinate crossfire, revive downed allies, and combine Chrono echoes.',
    playerLimit: '2 Players (Cross-Device)',
    rewardTier: '+50% Bonus Squad Creds',
    imageAccent: 'from-blue-950 via-slate-900 to-black'
  },
  {
    id: 'endless',
    title: 'ENDLESS HORDE PROTOCOL',
    badge: 'SURVIVAL HORROR',
    subtitle: 'UNLIMITED WAVE ESCALATION',
    description: 'Hold out against ever-intensifying waves of mutated horrors. Every wave increases zombie count, speed, and mutation threat tier.',
    playerLimit: '1-2 Players',
    rewardTier: 'Global Leaderboards & Skulls',
    imageAccent: 'from-amber-950 via-slate-900 to-black'
  },
  {
    id: 'campaign',
    title: 'OPERATION: ECLIPSE',
    badge: 'STORY MISSIONS',
    subtitle: 'EPISODIC NARRATIVE CAMPAIGN',
    description: 'Uncover the dark origin of the Chrono-Contagion. Follow the Aegis Corporation research trail from initial lab leak to urban collapse.',
    playerLimit: '1-2 Players',
    rewardTier: 'Unique Hero Skins & Lore Logs',
    imageAccent: 'from-emerald-950 via-slate-900 to-black'
  },
  {
    id: 'extraction',
    title: 'BIO-HAZARD EXTRACTION',
    badge: 'HIGH STAKES',
    subtitle: 'RETRIEVAL & TIME-LIMIT EVAC',
    description: 'Locate 3 classified Tachyon Cores scattered across the red zone. If you fail to reach the extraction chopper before countdown zeroes, air strikes incinerate the sector.',
    playerLimit: '1-2 Players',
    rewardTier: 'Legendary Weapon Blueprints',
    imageAccent: 'from-purple-950 via-slate-900 to-black'
  },
  {
    id: 'boss',
    title: 'GOLIATH APEX ENCOUNTER',
    badge: 'BOSS RAID',
    subtitle: 'BIO-TITAN COMBAT ARENA',
    description: 'Face off against colossal 12-foot mutated bio-titans with armor plates, ground slams, and projectile cysts. Requires precision hit-box targeting.',
    playerLimit: '1-2 Players',
    rewardTier: 'Exotic Weapon Attachments',
    imageAccent: 'from-red-950 via-slate-900 to-black'
  }
];

export const LORE_LOGS = [
  {
    id: 'log_01',
    title: 'INCIDENT 09: THE TACHYON RUPTURE',
    date: 'OCTOBER 24, 2026',
    author: 'Chief Researcher Lin',
    text: 'When the particle containment ring cracked at 03:14 AM, time did not stop. It echoed. Workers caught in the radius ceased aging, then rapidly devolved into hyper-aggressive cellular constructs hungry for living neural tissue.'
  },
  {
    id: 'log_02',
    title: 'THE CHRONO-REMNANT PROTOCOL',
    date: 'NOVEMBER 02, 2026',
    author: 'Vanguard Taskforce Command',
    text: 'By mounting tachyon harmonic emitters to operative spine rigs, a soldier can project an echo of their coordinate four seconds into the past. Zombies are overwhelmingly drawn to this temporal decoy, giving operatives precious moments to reposition.'
  },
  {
    id: 'log_03',
    title: 'MUTATION CLASSIFICATION: BRUTE',
    date: 'NOVEMBER 12, 2026',
    author: 'Dr. Maya Lin',
    text: 'The heavy variants exhibit calcified bone armor plating over their thoracic cages. Small arms fire will ricochet; aim for the exposed glowing carotid artery at the base of the skull.'
  }
];
