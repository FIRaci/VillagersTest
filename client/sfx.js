/**
 * Procedural Web Audio SFX Engine for Villagers Tabletop
 * Generates tactile board game sound effects using Web Audio API synthesis.
 * 100% reliable, zero external sound files, works offline.
 */

class TabletopAudioEngine {
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

  // 1. Tactile Wooden / Mechanical Button Click
  playButtonClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // 2. Card Draw / Sliding Paper Whoosh & Flick
  playCardDraw() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Filtered noise for paper friction glide
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + 0.1);
    filter.Q.value = 3.0;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    // Subtle paper snap flick
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.09);

    oscGain.gain.setValueAtTime(0.001, t);
    oscGain.gain.setValueAtTime(0.2, t + 0.04);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.12);
    osc.stop(t + 0.1);
  }

  // 3. Card Placement Soft Thud on Felt Table
  playCardPlace() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // 4. Medieval Gold Coin Metallic Clink
  playCoinClink() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // First coin strike
    const freqs = [1980, 2640, 3520];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const dur = 0.25 - idx * 0.04;
      gain.gain.setValueAtTime(0.12 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + dur);
    });

    // Secondary clink offset by 45ms (two coins rattling)
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t2 = this.ctx.currentTime;
      [2200, 3100].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t2);
        gain.gain.setValueAtTime(0.09 / (idx + 1), t2);
        gain.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t2);
        osc.stop(t2 + 0.19);
      });
    }, 45);
  }

  // 5. Town Church Bell / Phase Transition Chime
  playPhaseBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreq = 587.33; // D5 warm medieval tavern tone
    const partials = [
      { ratio: 1.0, gain: 0.28, decay: 1.4 },
      { ratio: 2.0, gain: 0.16, decay: 1.1 },
      { ratio: 2.76, gain: 0.1, decay: 0.9 },
      { ratio: 4.07, gain: 0.06, decay: 0.7 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * p.ratio, t);

      gain.gain.setValueAtTime(p.gain, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + p.decay);
    });
  }
}

// Global Export
window.sfx = new TabletopAudioEngine();

// Auto-bind sound to buttons on load
document.addEventListener('click', (e) => {
  if (e.target.closest('button, .btn, .deck-stack-card, .villager-card, .nav-tab')) {
    window.sfx.init();
  }
});
