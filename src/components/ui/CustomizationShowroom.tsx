import React, { useState } from 'react';
import { X, Check, Lock, Sparkles, Crosshair, Users, Shield, Zap, Flame, Filter, Tag, ArrowRight } from 'lucide-react';
import { WeaponInspectScene } from '../3d/WeaponInspectScene';
import { CharacterInspectScene } from '../3d/CharacterInspectScene';
import { GUN_SKINS, CHARACTER_COSMETICS } from '../../data/cosmeticsData';
import { GunSkin, CharacterCosmeticItem, CosmeticRarity, GunSkinCollection, CharacterSlotType, PlayerCosmeticLoadout, Character, Weapon } from '../../types/game';
import { sound } from '../../services/audio';

interface CustomizationShowroomProps {
  onClose: () => void;
  activeCharacter: Character;
  activeWeapon: Weapon;
  cosmetics: PlayerCosmeticLoadout;
  credits: number;
  unlockedSkinIds: string[];
  unlockedCosmeticIds: string[];
  onEquipCosmetic: (updated: Partial<PlayerCosmeticLoadout>) => void;
  onUnlockSkin: (skinId: string, cost: number) => void;
  onUnlockCosmetic: (cosmeticId: string, cost: number) => void;
}

export const CustomizationShowroom: React.FC<CustomizationShowroomProps> = ({
  onClose,
  activeCharacter,
  activeWeapon,
  cosmetics,
  credits,
  unlockedSkinIds,
  unlockedCosmeticIds,
  onEquipCosmetic,
  onUnlockSkin,
  onUnlockCosmetic
}) => {
  const [showroomMode, setShowroomMode] = useState<'weapon' | 'character'>('weapon');

  // Previewed selections (local before equipping)
  const [previewLoadout, setPreviewLoadout] = useState<PlayerCosmeticLoadout>({ ...cosmetics });
  const [previewSkinId, setPreviewSkinId] = useState<string>(cosmetics.weaponSkinId);
  const [triggerFireCount, setTriggerFireCount] = useState(0);

  // Filters
  const [rarityFilter, setRarityFilter] = useState<CosmeticRarity | 'All'>('All');
  const [collectionFilter, setCollectionFilter] = useState<GunSkinCollection | 'All'>('All');
  const [slotFilter, setSlotFilter] = useState<CharacterSlotType | 'All'>('All');

  const rarities: (CosmeticRarity | 'All')[] = ['All', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  const collections: (GunSkinCollection | 'All')[] = [
    'All',
    'Military Camouflage',
    'Desert Camouflage',
    'Woodland Camouflage',
    'Arctic Camouflage',
    'Matte Black & Carbon',
    'Gold & Platinum',
    'Inferno Fire',
    'Frost Ice',
    'Neon Futuristic',
    'Legendary Animated'
  ];
  const slots: (CharacterSlotType | 'All')[] = ['All', 'outfit', 'helmet', 'mask', 'backpack', 'accessory'];

  // Current inspected skin or cosmetic item
  const selectedGunSkin = GUN_SKINS.find(s => s.id === previewSkinId) || GUN_SKINS[0];

  const filteredSkins = GUN_SKINS.filter(skin => {
    const matchesRarity = rarityFilter === 'All' || skin.rarity === rarityFilter;
    const matchesCollection = collectionFilter === 'All' || skin.collection === collectionFilter;
    return matchesRarity && matchesCollection;
  });

  const filteredCharacterCosmetics = CHARACTER_COSMETICS.filter(item => {
    const matchesRarity = rarityFilter === 'All' || item.rarity === rarityFilter;
    const matchesSlot = slotFilter === 'All' || item.slot === slotFilter;
    return matchesRarity && matchesSlot;
  });

  // Get active item being inspected in character mode
  const [inspectedCosmeticId, setInspectedCosmeticId] = useState<string>(cosmetics.outfitId);
  const inspectedCosmetic = CHARACTER_COSMETICS.find(c => c.id === inspectedCosmeticId) || CHARACTER_COSMETICS[0];

  const getRarityBadgeStyle = (rarity: CosmeticRarity) => {
    switch (rarity) {
      case 'Mythic':
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_#ef4444]';
      case 'Legendary':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_#f59e0b]';
      case 'Epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'Rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'Uncommon':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/50';
    }
  };

  const isCurrentWeaponSkinEquipped = cosmetics.weaponSkinId === selectedGunSkin.id;
  const isSkinUnlocked = selectedGunSkin.unlocked || unlockedSkinIds.includes(selectedGunSkin.id);

  const isCosmeticEquipped =
    inspectedCosmetic.slot === 'outfit' ? cosmetics.outfitId === inspectedCosmetic.id :
    inspectedCosmetic.slot === 'helmet' ? cosmetics.helmetId === inspectedCosmetic.id :
    inspectedCosmetic.slot === 'mask' ? cosmetics.maskId === inspectedCosmetic.id :
    inspectedCosmetic.slot === 'backpack' ? cosmetics.backpackId === inspectedCosmetic.id :
    cosmetics.accessoryId === inspectedCosmetic.id;

  const isCosmeticUnlocked = inspectedCosmetic.unlocked || unlockedCosmeticIds.includes(inspectedCosmetic.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl select-none animate-fadeIn">
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-2xl font-extrabold text-white font-['Syne'] tracking-wider uppercase">
                COSMETICS & ARMORY CUSTOMIZATION
              </h2>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-sm border border-slate-800 ml-4">
              <button
                onClick={() => {
                  sound.playUiClick();
                  setShowroomMode('weapon');
                }}
                className={`px-4 py-1.5 rounded-xs text-xs font-['Rajdhani'] font-bold uppercase transition-all flex items-center gap-1.5 ${
                  showroomMode === 'weapon'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>GUN SKINS</span>
              </button>

              <button
                onClick={() => {
                  sound.playUiClick();
                  setShowroomMode('character');
                }}
                className={`px-4 py-1.5 rounded-xs text-xs font-['Rajdhani'] font-bold uppercase transition-all flex items-center gap-1.5 ${
                  showroomMode === 'character'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>OPERATIVE LOCKER</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Player Credits */}
            <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded border border-slate-800">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                $
              </span>
              <span className="text-xs font-bold text-amber-300 font-['Rajdhani']">
                {credits.toLocaleString()} CREDITS
              </span>
            </div>

            <button
              onClick={() => {
                sound.playUiClick();
                onClose();
              }}
              className="p-2 rounded bg-slate-800/80 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
          {/* Rarity Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-['Chakra_Petch'] mr-1">
              RARITY:
            </span>
            {rarities.map(r => (
              <button
                key={r}
                onClick={() => {
                  sound.playUiClick();
                  setRarityFilter(r);
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase border transition-all ${
                  rarityFilter === r
                    ? 'bg-slate-800 border-white text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Sub-Filter (Collection for Weapon / Slot for Character) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-['Chakra_Petch']">
              {showroomMode === 'weapon' ? 'COLLECTION:' : 'SLOT:'}
            </span>
            {showroomMode === 'weapon' ? (
              <select
                value={collectionFilter}
                onChange={(e) => {
                  sound.playUiClick();
                  setCollectionFilter(e.target.value as GunSkinCollection | 'All');
                }}
                className="bg-slate-900 border border-slate-700 text-slate-200 font-['Rajdhani'] font-bold text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-400"
              >
                {collections.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1">
                {slots.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      sound.playUiClick();
                      setSlotFilter(s);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold font-['Rajdhani'] uppercase border transition-all ${
                      slotFilter === s
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Cosmetic Grid Selector */}
          <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/70 p-4 overflow-y-auto space-y-2.5 z-10">
            {showroomMode === 'weapon' ? (
              filteredSkins.map(skin => {
                const isSelected = skin.id === previewSkinId;
                const isEquipped = cosmetics.weaponSkinId === skin.id;
                const isUnlocked = skin.unlocked || unlockedSkinIds.includes(skin.id);

                return (
                  <div
                    key={skin.id}
                    onClick={() => {
                      sound.playUiClick();
                      setPreviewSkinId(skin.id);
                    }}
                    onMouseEnter={() => sound.playUiHover()}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-md translate-x-1'
                        : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Preview Swatch */}
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center font-bold text-xs border border-white/20 shadow-inner"
                        style={{
                          background: `linear-gradient(135deg, ${skin.colorHex} 0%, ${skin.accentHex} 100%)`
                        }}
                      >
                        {skin.isAnimated && <Sparkles className="w-4 h-4 text-white animate-pulse" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono border ${getRarityBadgeStyle(skin.rarity)}`}>
                            {skin.rarity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase truncate max-w-[120px]">
                            {skin.collection}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-white font-['Rajdhani'] uppercase tracking-wider mt-0.5">
                          {skin.name}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isEquipped ? (
                        <span className="text-[10px] font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/40">
                          EQUIPPED
                        </span>
                      ) : !isUnlocked ? (
                        <Lock className="w-4 h-4 text-slate-500" />
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              filteredCharacterCosmetics.map(item => {
                const isSelected = item.id === inspectedCosmeticId;
                const isEquipped =
                  item.slot === 'outfit' ? cosmetics.outfitId === item.id :
                  item.slot === 'helmet' ? cosmetics.helmetId === item.id :
                  item.slot === 'mask' ? cosmetics.maskId === item.id :
                  item.slot === 'backpack' ? cosmetics.backpackId === item.id :
                  cosmetics.accessoryId === item.id;
                const isUnlocked = item.unlocked || unlockedCosmeticIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sound.playUiClick();
                      setInspectedCosmeticId(item.id);
                      setPreviewLoadout(prev => ({
                        ...prev,
                        [item.slot === 'outfit' ? 'outfitId' :
                         item.slot === 'helmet' ? 'helmetId' :
                         item.slot === 'mask' ? 'maskId' :
                         item.slot === 'backpack' ? 'backpackId' :
                         'accessoryId']: item.id
                      }));
                    }}
                    onMouseEnter={() => sound.playUiHover()}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-md translate-x-1'
                        : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center font-bold text-xs border border-white/20 shadow-inner"
                        style={{
                          background: `linear-gradient(135deg, ${item.colorHex} 0%, ${item.accentHex} 100%)`
                        }}
                      >
                        <Tag className="w-4 h-4 text-white" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono border ${getRarityBadgeStyle(item.rarity)}`}>
                            {item.rarity}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono uppercase font-semibold">
                            {item.slot}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-white font-['Rajdhani'] uppercase tracking-wider mt-0.5">
                          {item.name}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isEquipped ? (
                        <span className="text-[10px] font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/40">
                          EQUIPPED
                        </span>
                      ) : !isUnlocked ? (
                        <Lock className="w-4 h-4 text-slate-500" />
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Center Column: 3D Interactive Turntable Viewport */}
          <div className="relative flex-1 h-[420px] lg:h-auto overflow-hidden bg-gradient-to-b from-slate-900/30 via-black to-slate-950 flex flex-col justify-between p-6">
            <div className="z-10 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-['Chakra_Petch'] tracking-widest uppercase">
                {showroomMode === 'weapon' ? 'WEAPON SHOWROOM // DRAG TO ROTATE 360°' : 'OPERATIVE SHOWROOM // DRAG TO ROTATE 360°'}
              </span>
              <span className="text-xs text-cyan-400 font-mono uppercase">
                {showroomMode === 'weapon' ? activeWeapon.name : activeCharacter.name}
              </span>
            </div>

            {/* Three.js 3D Viewport */}
            <div className="absolute inset-0">
              {showroomMode === 'weapon' ? (
                <WeaponInspectScene
                  weaponId={activeWeapon.id}
                  category={activeWeapon.category}
                  accentColor={selectedGunSkin.accentHex}
                  skinId={previewSkinId}
                  triggerFireCount={triggerFireCount}
                />
              ) : (
                <CharacterInspectScene
                  characterId={activeCharacter.id}
                  accentColor={activeCharacter.color}
                  outfitColor={inspectedCosmetic.colorHex}
                  cosmetics={previewLoadout}
                />
              )}
            </div>

            {/* Test Fire Button (Weapon mode) */}
            {showroomMode === 'weapon' && (
              <div className="z-10 flex items-center justify-center">
                <button
                  onClick={() => setTriggerFireCount(c => c + 1)}
                  className="px-6 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-['Rajdhani'] font-extrabold text-xs tracking-widest uppercase rounded shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>TEST FIRE SKIN</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Cosmetic Inspector & Unlock System */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/80 p-6 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              {/* Header Info */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono border ${
                      showroomMode === 'weapon' ? getRarityBadgeStyle(selectedGunSkin.rarity) : getRarityBadgeStyle(inspectedCosmetic.rarity)
                    }`}
                  >
                    {showroomMode === 'weapon' ? selectedGunSkin.rarity : inspectedCosmetic.rarity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono uppercase">
                    {showroomMode === 'weapon' ? selectedGunSkin.collection : `${inspectedCosmetic.slot} SLOT`}
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-white font-['Rajdhani'] tracking-wider uppercase">
                  {showroomMode === 'weapon' ? selectedGunSkin.name : inspectedCosmetic.name}
                </h3>

                <p className="text-xs text-slate-300 font-['Inter'] mt-2 leading-relaxed">
                  {showroomMode === 'weapon' ? selectedGunSkin.description : inspectedCosmetic.description}
                </p>
              </div>

              {/* Unlock Requirement Box */}
              <div className="mb-6 p-4 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch'] mb-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>HOW TO UNLOCK:</span>
                </div>
                <div className="text-xs font-medium text-slate-200 font-['Inter'] mb-3">
                  {showroomMode === 'weapon' ? selectedGunSkin.unlockRequirement : inspectedCosmetic.unlockRequirement}
                </div>

                {/* Optional instant unlock via in-game credits */}
                {((showroomMode === 'weapon' && !isSkinUnlocked) || (showroomMode === 'character' && !isCosmeticUnlocked)) && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">INSTANT CRAFT:</span>
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        {(showroomMode === 'weapon' ? (selectedGunSkin.creditCost || 3000) : (inspectedCosmetic.creditCost || 2500)).toLocaleString()} CREDITS
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        sound.playUiClick();
                        if (showroomMode === 'weapon') {
                          onUnlockSkin(selectedGunSkin.id, selectedGunSkin.creditCost || 3000);
                        } else {
                          onUnlockCosmetic(inspectedCosmetic.id, inspectedCosmetic.creditCost || 2500);
                        }
                      }}
                      disabled={credits < (showroomMode === 'weapon' ? (selectedGunSkin.creditCost || 3000) : (inspectedCosmetic.creditCost || 2500))}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-black font-['Rajdhani'] font-extrabold text-xs uppercase rounded transition-all shadow"
                    >
                      CRAFT UNLOCK
                    </button>
                  </div>
                )}
              </div>

              {/* Zero Pay-to-Win Fair Play Guarantee */}
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-['Inter'] mb-6 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>FAIR PLAY COSMETIC:</strong> Purely visual enhancement. Weapon damage, recoil, and character stats remain 100% identical.
                </span>
              </div>
            </div>

            {/* Equip / Save Button */}
            <div>
              {showroomMode === 'weapon' ? (
                <button
                  onClick={() => {
                    sound.playUiClick();
                    onEquipCosmetic({ weaponSkinId: selectedGunSkin.id });
                  }}
                  disabled={!isSkinUnlocked || isCurrentWeaponSkinEquipped}
                  className={`w-full py-3.5 rounded font-['Rajdhani'] font-extrabold text-base tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrentWeaponSkinEquipped
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 cursor-default'
                      : isSkinUnlocked
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  {isCurrentWeaponSkinEquipped ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>EQUIPPED ON {activeWeapon.name}</span>
                    </>
                  ) : isSkinUnlocked ? (
                    <>
                      <span>EQUIP GUN SKIN</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>SKIN LOCKED</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    sound.playUiClick();
                    const slotKey =
                      inspectedCosmetic.slot === 'outfit' ? 'outfitId' :
                      inspectedCosmetic.slot === 'helmet' ? 'helmetId' :
                      inspectedCosmetic.slot === 'mask' ? 'maskId' :
                      inspectedCosmetic.slot === 'backpack' ? 'backpackId' :
                      'accessoryId';
                    onEquipCosmetic({ [slotKey]: inspectedCosmetic.id });
                  }}
                  disabled={!isCosmeticUnlocked || isCosmeticEquipped}
                  className={`w-full py-3.5 rounded font-['Rajdhani'] font-extrabold text-base tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCosmeticEquipped
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 cursor-default'
                      : isCosmeticUnlocked
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  {isCosmeticEquipped ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>EQUIPPED IN {inspectedCosmetic.slot.toUpperCase()} SLOT</span>
                    </>
                  ) : isCosmeticUnlocked ? (
                    <>
                      <span>EQUIP TO {activeCharacter.name}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>COSMETIC LOCKED</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
