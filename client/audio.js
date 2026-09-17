// Procedural Web Audio Sound Synthesizer for Villagers Digital Tabletop
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('villagers_sfx_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('villagers_sfx_muted', this.isMuted ? 'true' : 'false');
    if (!this.isMuted) {
      this.playButtonClick();
    }
    return !this.isMuted;
  }

  playButtonClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  playCoinSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Two high-frequency metallic sines
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1980, now);
    osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.08);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2640, now);
    osc2.frequency.exponentialRampToValueAtTime(4400, now + 0.06);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);

    // Secondary clink
    setTimeout(() => {
      if (this.isMuted || !this.ctx) return;
      const t2 = this.ctx.currentTime;
      const osc3 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(2200, t2);
      gain2.gain.setValueAtTime(0.15, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.18);
      osc3.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc3.start(t2);
      osc3.stop(t2 + 0.18);
    }, 45);
  }

  playCardSlideSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Filtered pink noise for card slide
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playCardPlaceSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playPhaseBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const baseFreq = 587.33; // D5 warm medieval tavern tone
    const partials = [
      { ratio: 1.0, gain: 0.28, decay: 1.4 },
      { ratio: 2.0, gain: 0.16, decay: 1.1 },
      { ratio: 2.76, gain: 0.1, decay: 0.9 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * p.ratio, now);
      gain.gain.setValueAtTime(p.gain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + p.decay);
    });
  }

  playCardSnapSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Woody tactile thump (base)
    const oscThud = this.ctx.createOscillator();
    const gainThud = this.ctx.createGain();
    oscThud.type = 'triangle';
    oscThud.frequency.setValueAtTime(120, now);
    oscThud.frequency.exponentialRampToValueAtTime(35, now + 0.07);
    gainThud.gain.setValueAtTime(0.4, now);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    oscThud.connect(gainThud);
    gainThud.connect(this.ctx.destination);
    oscThud.start(now);
    oscThud.stop(now + 0.07);

    // Magnetic snap click (transient)
    const oscSnap = this.ctx.createOscillator();
    const gainSnap = this.ctx.createGain();
    oscSnap.type = 'square';
    oscSnap.frequency.setValueAtTime(2400, now);
    oscSnap.frequency.exponentialRampToValueAtTime(600, now + 0.025);
    gainSnap.gain.setValueAtTime(0.2, now);
    gainSnap.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    oscSnap.connect(gainSnap);
    gainSnap.connect(this.ctx.destination);
    oscSnap.start(now);
    oscSnap.stop(now + 0.025);
  }

  playLockUnlockSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // 2 Quick mechanical tumbler clicks + 1 brass resonance
    [0, 0.04].forEach((offset, idx) => {
      const t = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800 + idx * 400, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.035);
    });

    // Brass key chime
    const tChime = this.ctx.currentTime + 0.08;
    const oscPing = this.ctx.createOscillator();
    const gainPing = this.ctx.createGain();
    oscPing.type = 'sine';
    oscPing.frequency.setValueAtTime(1760, tChime); // A6
    gainPing.gain.setValueAtTime(0.25, tChime);
    gainPing.gain.exponentialRampToValueAtTime(0.001, tChime + 0.28);
    oscPing.connect(gainPing);
    gainPing.connect(this.ctx.destination);
    oscPing.start(tChime);
    oscPing.stop(tChime + 0.28);
  }

  playMarketBellSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Grand celebratory tavern bell chime (C5 + G5 + C6 harmonics)
    const tones = [523.25, 783.99, 1046.50];
    tones.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.28 / (i + 1), now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 1.25);
    });
  }

  playCoinRattleSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Rattle of 4 coins tumbling into pouch
    [0, 0.035, 0.075, 0.12].forEach((offset) => {
      setTimeout(() => {
        this.playCoinSound();
      }, offset * 1000);
    });
  }

  playShuffleSound() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => this.playCardSlideSound(), i * 35);
    }
  }

  triggerHaptic(pattern = [30]) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }
}

export const audio = new AudioManager();
window.audio = audio;
