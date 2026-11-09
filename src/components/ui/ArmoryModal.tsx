import React, { useState } from 'react';
import { X, Check, Crosshair, Zap, Shield, Flame, RotateCw, Volume2 } from 'lucide-react';
import { WEAPONS } from '../../data/gameData';
import { WeaponInspectScene } from '../3d/WeaponInspectScene';
import { Weapon } from '../../types/game';
import { sound } from '../../services/audio';

interface ArmoryModalProps {
  onClose: () => void;
  selectedWeaponId: string;
  onSelectWeapon: (weaponId: string) => void;
}

export const ArmoryModal: React.FC<ArmoryModalProps> = ({
  onClose,
  selectedWeaponId,
  onSelectWeapon
}) => {
  const [activeWepId, setActiveWepId] = useState(selectedWeaponId);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [triggerFireCount, setTriggerFireCount] = useState(0);

  const activeWeapon = WEAPONS.find(w => w.id === activeWepId) || WEAPONS[0];
  const [selectedSkinIndex, setSelectedSkinIndex] = useState(activeWeapon.selectedSkin || 0);
  const [selectedOpticIndex, setSelectedOpticIndex] = useState(activeWeapon.selectedOptic || 0);
  const [selectedBarrelIndex, setSelectedBarrelIndex] = useState(activeWeapon.selectedBarrel || 0);
  const [selectedMagIndex, setSelectedMagIndex] = useState(activeWeapon.selectedMagazine || 0);

  const isEquipped = selectedWeaponId === activeWeapon.id;

  const categories = ['All', 'Assault Rifle', 'SMG', 'Shotgun', 'Sniper'];

  const filteredWeapons = selectedCategory === 'All'
    ? WEAPONS
    : WEAPONS.filter(w => w.category === selectedCategory);

  const activeSkin = activeWeapon.skins[selectedSkinIndex] || activeWeapon.skins[0];

  const handleTestFire = () => {
    setTriggerFireCount(c => c + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl select-none animate-fadeIn">
      <div className="relative w-full max-w-7xl h-[94vh] flex flex-col bg-slate-950/95 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-cyan-400" />
            <h2 className="text-2xl font-extrabold text-white font-['Syne'] tracking-wide uppercase">
              WEAPON ARMORY // GUNSMITH SHOWROOM
            </h2>
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

        {/* Content Layout */}
        <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Category Filter & Weapon List */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 p-4 overflow-y-auto space-y-4 z-10">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playUiClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-['Rajdhani'] font-bold uppercase transition-all ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-black'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Weapon List */}
            <div className="space-y-2.5">
              {filteredWeapons.map(weapon => {
                const isSelected = weapon.id === activeWepId;
                const isCurrent = weapon.id === selectedWeaponId;

                return (
                  <div
                    key={weapon.id}
                    onClick={() => {
                      sound.playUiClick();
                      setActiveWepId(weapon.id);
                      setSelectedSkinIndex(0);
                    }}
                    onMouseEnter={() => sound.playUiHover()}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-md translate-x-1'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                        {weapon.category}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-400 font-bold px-2 py-0.5 rounded border border-cyan-500/40">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <div className="text-base font-extrabold text-white font-['Rajdhani'] tracking-wider uppercase mt-0.5">
                      {weapon.name}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                      <span>DMG: <strong className="text-white">{weapon.damage}</strong></span>
                      <span>RPM: <strong className="text-white">{weapon.fireRate * 60}</strong></span>
                      <span>MAG: <strong className="text-white">{weapon.magazineSize}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Column: 3D Weapon Showroom */}
          <div className="relative flex-1 h-[420px] lg:h-auto overflow-hidden bg-gradient-to-b from-slate-900/30 via-black to-slate-950 flex flex-col justify-between p-6">
            <div className="z-10 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-['Chakra_Petch'] tracking-widest uppercase">
                3D SHOWROOM // DRAG TO ROTATE
              </span>
              <span className="text-xs text-cyan-400 font-mono uppercase">
                {activeWeapon.category} CLASS
              </span>
            </div>

            {/* Three.js 3D Viewport */}
            <div className="absolute inset-0">
              <WeaponInspectScene
                weaponId={activeWeapon.id}
                category={activeWeapon.category}
                accentColor={activeSkin.accent}
                triggerFireCount={triggerFireCount}
              />
            </div>

            {/* Interactive Test-Fire Button */}
            <div className="z-10 flex items-center justify-center">
              <button
                onClick={handleTestFire}
                className="group px-6 py-2.5 bg-red-600/90 hover:bg-red-500 text-white font-['Rajdhani'] font-extrabold text-sm tracking-widest uppercase rounded shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Flame className="w-4 h-4 text-amber-300 group-hover:animate-pulse" />
                <span>TEST FIRE (RECOIL & AUDIO)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Gunsmith Attachments & Weapon Stats */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/80 p-6 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="mb-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {activeWeapon.category}
                </span>
                <h3 className="text-2xl font-extrabold text-white font-['Rajdhani'] tracking-wider uppercase mt-1">
                  {activeWeapon.name}
                </h3>
                <p className="text-xs text-slate-400 font-['Inter'] mt-1 leading-relaxed">
                  {activeWeapon.description}
                </p>
              </div>

              {/* Weapon Statistics Bars */}
              <div className="space-y-2 mb-6 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch'] mb-2">
                  BALLISTIC PERFORMANCE
                </div>

                {/* Damage */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 font-['Rajdhani']">DAMAGE</span>
                    <span className="text-white font-mono">{activeWeapon.damage}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, activeWeapon.damage * 0.8)}%` }} />
                  </div>
                </div>

                {/* Fire Rate */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 font-['Rajdhani']">FIRE RATE (RPM)</span>
                    <span className="text-white font-mono">{activeWeapon.fireRate * 60}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, activeWeapon.fireRate * 6)}%` }} />
                  </div>
                </div>

                {/* Range */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 font-['Rajdhani']">EFFECTIVE RANGE</span>
                    <span className="text-white font-mono">{activeWeapon.range}m</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${activeWeapon.range}%` }} />
                  </div>
                </div>

                {/* Recoil Control */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 font-['Rajdhani']">RECOIL CONTROL</span>
                    <span className="text-white font-mono">{100 - activeWeapon.recoil}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${100 - activeWeapon.recoil}%` }} />
                  </div>
                </div>
              </div>

              {/* Gunsmith Attachments */}
              <div className="space-y-3 mb-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch']">
                  GUNSMITH MODIFICATIONS
                </div>

                {/* Optic */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    OPTIC SYSTEM
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {activeWeapon.attachments.optics.map((opt, idx) => (
                      <button
                        key={opt.name}
                        onClick={() => {
                          sound.playUiClick();
                          setSelectedOpticIndex(idx);
                        }}
                        className={`p-1.5 rounded text-[10px] font-semibold text-center border truncate ${
                          selectedOpticIndex === idx
                            ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                        title={opt.bonus}
                      >
                        {opt.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Barrel */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    BARREL MUZZLE
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {activeWeapon.attachments.barrels.map((bar, idx) => (
                      <button
                        key={bar.name}
                        onClick={() => {
                          sound.playUiClick();
                          setSelectedBarrelIndex(idx);
                        }}
                        className={`p-1.5 rounded text-[10px] font-semibold text-center border truncate ${
                          selectedBarrelIndex === idx
                            ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                        title={bar.bonus}
                      >
                        {bar.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Magazine */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    AMMUNITION CALIBER
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {activeWeapon.attachments.magazines.map((mag, idx) => (
                      <button
                        key={mag.name}
                        onClick={() => {
                          sound.playUiClick();
                          setSelectedMagIndex(idx);
                        }}
                        className={`p-1.5 rounded text-[10px] font-semibold text-center border truncate ${
                          selectedMagIndex === idx
                            ? 'bg-slate-800 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                        title={mag.bonus}
                      >
                        {mag.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weapon Skin Selector */}
              <div className="mb-6">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch'] mb-2">
                  WEAPON CAMO / FINISH
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {activeWeapon.skins.map((skin, idx) => (
                    <button
                      key={skin.id}
                      onClick={() => {
                        sound.playUiClick();
                        setSelectedSkinIndex(idx);
                      }}
                      className={`p-2 rounded text-xs font-semibold text-center border transition-all ${
                        selectedSkinIndex === idx
                          ? 'bg-slate-800 border-cyan-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full mx-auto mb-1 border border-white/20"
                        style={{ backgroundColor: skin.accent }}
                      />
                      <span className="truncate block text-[9px]">{skin.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Equip Button */}
            <button
              onClick={() => {
                sound.playUiClick();
                onSelectWeapon(activeWeapon.id);
              }}
              disabled={isEquipped}
              className={`w-full py-3.5 rounded font-['Rajdhani'] font-extrabold text-base tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                isEquipped
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40 cursor-default'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              }`}
            >
              {isEquipped ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>CURRENTLY EQUIPPED</span>
                </>
              ) : (
                <span>EQUIP WEAPON</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
