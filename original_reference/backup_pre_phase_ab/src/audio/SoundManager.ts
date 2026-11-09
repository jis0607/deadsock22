import { GameSettings } from '../types/game';

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  private isMuted: boolean = false;
  private rainNode: AudioBufferSourceNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private musicInterval: number | null = null;

  private settings: GameSettings = {
    masterVolume: 0.8,
    sfxVolume: 0.85,
    musicVolume: 0.5,
    mouseSensitivity: 1.0,
    fov: 65,
    graphicsQuality: 'HIGH',
    invertY: false,
    crosshairStyle: 'CROSS',
    lightingMode: 'DAY',
    showDamageNumbers: true,
  };

  constructor() {
    // Lazy initialize on first interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.settings.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startRainAmbience();
      this.startDarkSynthDrone();
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  public updateSettings(newSettings: Partial<GameSettings>) {
    Object.assign(this.settings, newSettings);
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain && newSettings.masterVolume !== undefined) {
      this.masterGain.gain.setTargetAtTime(newSettings.masterVolume, now, 0.05);
    }
    if (this.sfxGain && newSettings.sfxVolume !== undefined) {
      this.sfxGain.gain.setTargetAtTime(newSettings.sfxVolume, now, 0.05);
    }
    if (this.musicGain && newSettings.musicVolume !== undefined) {
      this.musicGain.gain.setTargetAtTime(newSettings.musicVolume, now, 0.05);
    }
  }

  // --- WEAPON SOUNDS ---
  public playPistolShot(isRemnant = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Fast noise crack + punchy square/sine transient
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isRemnant ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isRemnant ? 580 : 380, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);

    // Noise snap
    this.playNoiseSnap(0.08, 1200, 0.4, isRemnant);
  }

  public playRifleShot(isRemnant = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isRemnant ? 'sawtooth' : 'sawtooth';
    osc.frequency.setValueAtTime(isRemnant ? 620 : 420, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);

    this.playNoiseSnap(0.12, 1800, 0.65, isRemnant);
  }

  public playShotgunShot(isRemnant = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Sub-bass heavy thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.42);

    this.playNoiseSnap(0.25, 800, 0.9, isRemnant);
  }

  public playSMGShot(isRemnant = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isRemnant ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isRemnant ? 720 : 500, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);

    this.playNoiseSnap(0.06, 2400, 0.35, isRemnant);
  }

  public playLauncherShot() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playExplosion() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Heavy bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.95);

    // Rumble noise
    this.playNoiseSnap(0.8, 600, 0.95, false);
  }

  // --- RELOAD & INTERACTIONS ---
  public playReload() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Mag out click
    this.playClick(now, 1200, 0.04);
    // Mag in clack
    this.playClick(now + 0.35, 900, 0.05);
    // Bolt slide
    this.playClick(now + 0.7, 1600, 0.06);
  }

  public playDash() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playHitMarker(isHeadshot = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1600 : 950, now);
    osc.frequency.setValueAtTime(isHeadshot ? 2200 : 1200, now + 0.03);

    gain.gain.setValueAtTime(isHeadshot ? 0.45 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playPlayerHurt() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // --- ZOMBIE SFX ---
  public playZombieGroan(pitchMod = 1.0) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const baseFreq = 80 * pitchMod;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.6);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350 * pitchMod, now);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  public playZombieAttack() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.playNoiseSnap(0.18, 1400, 0.45, false);
  }

  public playZombieDeath() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playBossRoar() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.4);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.75, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.6);
  }

  // --- REMNANT SIGNATURE SOUND ---
  public playRemnantMaterialize() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Temporal reverse-sweep shimmer
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.8);
    osc.frequency.linearRampToValueAtTime(440, now + 1.3);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.5);

    // Glitch click burst
    for (let i = 0; i < 4; i++) {
      this.playClick(now + i * 0.15, 2400 + i * 200, 0.03);
    }
  }

  public playExtractionSiren() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);
    osc.frequency.linearRampToValueAtTime(440, now + 0.8);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  // --- AMBIENCE GENERATORS ---
  private startRainAmbience() {
    if (!this.ctx || !this.ambientGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.18;
      }

      this.rainNode = this.ctx.createBufferSource();
      this.rainNode.buffer = buffer;
      this.rainNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);

      this.rainNode.connect(filter);
      filter.connect(this.ambientGain);
      this.rainNode.start(0);
    } catch (e) {
      console.warn('Rain audio generation error:', e);
    }
  }

  private startDarkSynthDrone() {
    if (!this.ctx || !this.musicGain) return;
    try {
      this.ambientOsc = this.ctx.createOscillator();
      const droneGain = this.ctx.createGain();
      this.ambientOsc.type = 'triangle';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, this.ctx.currentTime);

      droneGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.ambientOsc.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.musicGain);
      this.ambientOsc.start();
    } catch (e) {
      console.warn('Drone error:', e);
    }
  }

  // --- VISCERAL COMBAT & REALISTIC BALLISTICS SFX ---
  public playFleshImpact(isHeadshot = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Meaty thump
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(isHeadshot ? 260 : 180, now);
    thump.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    thumpGain.gain.setValueAtTime(0.7, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    thump.connect(thumpGain);
    thumpGain.connect(this.sfxGain);
    thump.start(now);
    thump.stop(now + 0.15);

    // Wet squelch snap
    this.playNoiseSnap(0.09, isHeadshot ? 3200 : 1100, isHeadshot ? 0.65 : 0.4, false);
  }

  public playSkullCrunch() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Shattering bone crunch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);

    this.playNoiseSnap(0.18, 4200, 0.75, false);
  }

  public playMeleeKick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Whoosh + heavy impact blunt force
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);

    this.playNoiseSnap(0.2, 900, 0.6, false);
  }

  public playBulletShell() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + 0.18 + Math.random() * 0.1;

    // High pitch metallic brass clink
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400 + Math.random() * 800, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playRicochet() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Laser-like metallic whine
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- UTILS ---
  private playNoiseSnap(duration: number, cutoff: number, volume: number, isGlitch = false) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isGlitch ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);
  }

  public playClick(time = 0, freq = 1000, dur = 0.05) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const playTime = time || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, playTime);

    gain.gain.setValueAtTime(0.3, playTime);
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + dur);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(playTime);
    osc.stop(playTime + dur + 0.01);
  }
}

export const soundManager = new SoundManager();
