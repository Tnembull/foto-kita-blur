export class AudioController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isPlaying = false;
    this.oscillators = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startChime() {
    if (this.isMuted || this.isPlaying) return;
    this.init();
    
    this.isPlaying = true;
    const now = this.ctx.currentTime;

    // Create dual oscillator synth chord (E Major 7th vibe)
    const freqs = [329.63, 415.30, 493.88, 659.25]; // E4, G#4, B4, E5
    this.oscillators = freqs.map((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.3); // Smooth fade in

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      
      return { osc, gain };
    });
  }

  stopChime() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    if (this.oscillators) {
      this.oscillators.forEach(({ osc, gain }) => {
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4); // Smooth fade out
        osc.stop(now + 0.4);
      });
      this.oscillators = null;
    }
    this.isPlaying = false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isPlaying) {
      this.stopChime();
    }
    return this.isMuted;
  }
}
