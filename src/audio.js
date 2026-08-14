export class AudioController {
  constructor() {
    this.ctx = null;
    this.mode = 'song'; // 'song' | 'synth' | 'muted'
    this.isPlaying = false;
    this.oscillators = null;
    
    // HTML5 Audio Element for Sal Priadi - Foto Kita Blur or user custom audio
    this.audioElement = new Audio();
    this.audioElement.loop = true;
    this.audioElement.volume = 0;
    
    // Default audio track (Sal Priadi - Foto Kita Blur / Local or Fallback audio URL)
    this.audioElement.src = '/audio/foto-kita-blur.mp3';
    
    this.fadeInterval = null;
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

  setMode(mode) {
    this.mode = mode;
    if (mode === 'muted' && this.isPlaying) {
      this.stop();
    }
  }

  setCustomAudioUrl(url) {
    this.audioElement.src = url;
    if (this.isPlaying && this.mode === 'song') {
      this.audioElement.play().catch(() => {});
    }
  }

  start() {
    if (this.mode === 'muted' || this.isPlaying) return;
    this.init();
    this.isPlaying = true;

    if (this.mode === 'song') {
      this.startSong();
    } else if (this.mode === 'synth') {
      this.startChime();
    }
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.stopSong();
    this.stopChime();
  }

  startSong() {
    clearInterval(this.fadeInterval);
    this.audioElement.play().then(() => {
      let vol = this.audioElement.volume;
      this.fadeInterval = setInterval(() => {
        if (vol < 0.85) {
          vol += 0.05;
          this.audioElement.volume = Math.min(0.85, vol);
        } else {
          clearInterval(this.fadeInterval);
        }
      }, 50);
    }).catch((err) => {
      console.warn('Audio play auto-play blocked or source missing:', err);
    });
  }

  stopSong() {
    clearInterval(this.fadeInterval);
    this.fadeInterval = setInterval(() => {
      let vol = this.audioElement.volume;
      if (vol > 0.05) {
        vol -= 0.05;
        this.audioElement.volume = Math.max(0, vol);
      } else {
        this.audioElement.volume = 0;
        this.audioElement.pause();
        clearInterval(this.fadeInterval);
      }
    }, 50);
  }

  startChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [329.63, 415.30, 493.88, 659.25]; // E4, G#4, B4, E5
    
    this.oscillators = freqs.map((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      return { osc, gain };
    });
  }

  stopChime() {
    if (!this.ctx || !this.oscillators) return;
    const now = this.ctx.currentTime;
    this.oscillators.forEach(({ osc, gain }) => {
      gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
      osc.stop(now + 0.4);
    });
    this.oscillators = null;
  }
}
