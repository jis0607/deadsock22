// Procedural Web Audio Engine for DEAD//RECKONING
// Generates tactical shooter sound effects, weapon audio, and atmospheric game feedback.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.ambientGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.ambientGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playShoot(category: string = 'Assault Rifle') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Noise buffer for punchy gunshot transient
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    filter.type = 'lowpass';
    if (category === 'Shotgun') {
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.18);
      filter.frequency.setValueAtTime(1400, t);
      gain.gain.setValueAtTime(1.0, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
    } else if (category === 'Sniper') {
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
      filter.frequency.setValueAtTime(2600, t);
      gain.gain.setValueAtTime(1.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);
    } else if (category === 'SMG') {
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
      filter.frequency.setValueAtTime(1800, t);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);
    } else {
      // Assault rifle
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.13);
      filter.frequency.setValueAtTime(2200, t);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    }

    noise.connect(filter);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.4);
    noise.stop(t + 0.4);
  }

  public playHit(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isHeadshot) {
      // High-pitched tactical critical ding
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(2800, t + 0.08);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    } else {
      // Dull meaty hit tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playChronoEcho() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Sci-fi time warp / reverse whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.Q.value = 8;

    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.4);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.7);

    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.7);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.7, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  public playReload() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Mag eject and lock
    const playClick = (time: number, freq: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.04);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.06);
    };

    playClick(t, 900);
    playClick(t + 0.25, 600);
    playClick(t + 0.5, 1200);
  }

  public playZombieGroan() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.linearRampToValueAtTime(55, t + 0.5);
    osc.frequency.linearRampToValueAtTime(45, t + 1.0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.linearRampToValueAtTime(200, t + 1.0);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.2);
  }

  public playUiClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.035);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playUiHover() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.linearRampToValueAtTime(520, t + 0.03);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public startAtmosphere() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.ambientGain || this.ambientOsc1) return;

    try {
      const t = this.ctx.currentTime;
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc2 = this.ctx.createOscillator();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 240;

      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc1.frequency.setValueAtTime(55, t); // A1 note drone

      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(58.2, t); // Slight detune for sinister pulse

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
    } catch {
      // Audio autoplay policy handled smoothly
    }
  }

  public stopAtmosphere() {
    if (this.ambientOsc1) {
      try {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      } catch {}
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      try {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      } catch {}
      this.ambientOsc2 = null;
    }
  }
}

export const sound = new SoundEngine();
