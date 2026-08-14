export class AudioController {
  constructor() {
    this.ctx = null;
    this.mode = 'song'; // 'song' | 'synth' | 'muted'
    this.isPlaying = false;
    this.oscillators = null;
    
    // HTML5 Audio Element for Sal Priadi - Foto Kita Blur
    this.audioElement = new Audio();
    this.audioElement.loop = false; // Plays until the end of the song
    this.audioElement.volume = 0;
    
    // Default audio track (Sal Priadi - Foto Kita Blur)
    this.audioElement.src = '/audio/foto-kita-blur.mp3';
    
    this.songStartTime = 25; // Default start timestamp in seconds
    this.fadeInterval = null;

    // Reset playing state when song finishes so next gesture can trigger again
    this.audioElement.onended = () => {
      this.isPlaying = false;
    };
  }

  setSongStartTime(seconds) {
    this.songStartTime = Number(seconds) || 0;
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
    try {
      if (this.songStartTime >= 0) {
        this.audioElement.currentTime = this.songStartTime;
      }
    } catch (e) {
      console.warn('Could not set currentTime:', e);
    }

    this.audioElement.play().then(() => {
      let vol = 0;
      this.audioElement.volume = 0;
      this.fadeInterval = setInterval(() => {
        if (vol < 0.9) {
          vol += 0.1;
          this.audioElement.volume = Math.min(0.9, vol);
        } else {
          clearInterval(this.fadeInterval);
        }
      }, 40);
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
