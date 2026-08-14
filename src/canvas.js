import { VisionShaders } from './shaders.js';
import { PortalEngine } from './portal.js';
import { SciFiHUD } from './hud.js';

export class CanvasRenderer {
  constructor(canvasElement, videoElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.video = videoElement;
    
    this.targetBlur = 0;
    this.currentBlur = 0;
    this.maxBlurRadius = 18;
    this.isPeaceActive = false;
    
    this.handLandmarks = null;
    this.allHandsLandmarks = [];
    this.activeProp = 'hearts'; // 'hearts' | 'cat' | 'thug' | 'polaroid' | 'none'
    this.activeShader = 'normal'; // 'normal' | 'thermal' | 'xray' | 'matrix' | 'neon' | 'pixelate' | 'nightvision' | 'vaporwave'
    this.activeGesture = 'peace';

    this.portalEngine = new PortalEngine();
    this.hud = new SciFiHUD();

    // Floating particles (Hearts & Stars)
    this.particles = [];
    this.initParticles();
  }

  initParticles() {
    this.particles = Array.from({ length: 15 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 20 + Math.random() * 20,
      speedY: 0.002 + Math.random() * 0.003,
      char: ['💖', '✨', '🌸', '✌️', '💕', '⭐'][Math.floor(Math.random() * 6)]
    }));
  }

  setHandLandmarks(landmarks, allHands = []) {
    this.handLandmarks = landmarks;
    this.allHandsLandmarks = allHands;
  }

  setActiveProp(propName) {
    this.activeProp = propName;
  }

  setActiveShader(shaderName) {
    this.activeShader = shaderName;
  }

  setActiveGesture(gestureName) {
    this.activeGesture = gestureName;
  }

  setTargetBlur(isActive) {
    this.isPeaceActive = isActive;
    this.targetBlur = isActive ? this.maxBlurRadius : 0;
  }

  setMaxBlurRadius(radius) {
    this.maxBlurRadius = Number(radius);
    if (this.isPeaceActive) {
      this.targetBlur = this.maxBlurRadius;
    }
  }

  renderFrame(onSlingshotLaunch) {
    if (!this.video.videoWidth || !this.video.videoHeight) return;

    const width = this.video.videoWidth;
    const height = this.video.videoHeight;

    if (this.canvas.width !== width) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.currentBlur += (this.targetBlur - this.currentBlur) * 0.15;
    if (Math.abs(this.currentBlur) < 0.1) this.currentBlur = 0;

    this.ctx.save();
    
    // Mirror the video canvas display
    this.ctx.translate(width, 0);
    this.ctx.scale(-1, 1);

    if (this.currentBlur > 0) {
      this.ctx.filter = `blur(${this.currentBlur.toFixed(1)}px)`;
    } else {
      this.ctx.filter = 'none';
    }

    this.ctx.drawImage(this.video, 0, 0, width, height);
    this.ctx.restore();

    const time = performance.now();

    // 1. Vision Shader (Applied on Active Gesture or Shader selected)
    if ((this.isPeaceActive || this.activeShader !== 'normal') && this.activeShader !== 'normal') {
      VisionShaders.applyFilter(this.ctx, width, height, this.activeShader, time);
    }

    // 2. Render Hand Portal Framing (2-Hand Quad Warp)
    const portalQuad = this.portalEngine.getPortalQuad(this.allHandsLandmarks, width, height);
    if (portalQuad) {
      this.portalEngine.renderPortalFrame(this.ctx, portalQuad, time);
    }

    // 3. Render Slingshot Mechanics (✌️👌)
    if (this.allHandsLandmarks && this.allHandsLandmarks.length >= 2) {
      this.portalEngine.processSlingshot(this.ctx, this.allHandsLandmarks, width, height, onSlingshotLaunch);
    }

    // 4. Render Pinch Lens (🤏)
    if (this.handLandmarks) {
      this.portalEngine.renderPinchLens(this.ctx, this.handLandmarks, width, height);
    }

    // 5. Render Cute Props & Overlay Effects strictly ONLY when Gesture is active!
    if (this.isPeaceActive && this.activeProp !== 'none') {
      this.renderProps();
    }

    // 6. Render Sci-Fi Telemetry HUD
    this.hud.render(this.ctx, width, height, {
      handCount: this.allHandsLandmarks.length,
      activeShader: this.activeShader,
      activeGesture: this.activeGesture,
      portalActive: this.isPeaceActive || !!portalQuad
    });
  }

  renderProps() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // 1. Polaroid Aesthetic Frame & Sticker Caption
    if (this.activeProp === 'polaroid' || this.isPeaceActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      ctx.fillStyle = 'rgba(236, 72, 153, 0.85)';
      ctx.shadowColor = 'rgba(236, 72, 153, 0.6)';
      ctx.shadowBlur = 15;
      
      const badgeW = 360;
      const badgeH = 46;
      const badgeX = (width - badgeW) / 2;
      const badgeY = height - 70;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 24);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨ Foto Kita Blur — Sal Priadi 🎶 ✌️', width / 2, badgeY + badgeH / 2);
      ctx.restore();
    }

    // 2. Floating Hearts & Sparkles near Finger Tips
    if (this.activeProp === 'hearts' || (this.isPeaceActive && this.activeProp !== 'none')) {
      ctx.save();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';

      this.particles.forEach((p) => {
        p.y -= p.speedY;
        if (p.y < -0.1) p.y = 1.1;

        const px = p.x * width;
        const py = p.y * height;
        ctx.fillText(p.char, px, py);
      });

      if (this.handLandmarks && this.handLandmarks[8] && this.handLandmarks[12]) {
        const indexX = (1 - this.handLandmarks[8].x) * width;
        const indexY = this.handLandmarks[8].y * height;
        const middleX = (1 - this.handLandmarks[12].x) * width;
        const middleY = this.handLandmarks[12].y * height;

        ctx.font = '36px sans-serif';
        ctx.fillText('💖', indexX, indexY - 20);
        ctx.fillText('✨', middleX, middleY - 20);
      }
      ctx.restore();
    }

    // 3. Cute Cat Ears & Whiskers 🐱
    if (this.activeProp === 'cat') {
      ctx.save();
      const headX = width / 2;
      const headY = height * 0.22;

      ctx.font = '72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐱', headX, headY);
      
      ctx.font = '36px sans-serif';
      ctx.fillText('🐾', headX - 140, headY + 50);
      ctx.fillText('🐾', headX + 140, headY + 50);
      ctx.restore();
    }

    // 4. Funny Thug Life Sunglasses 🕶️
    if (this.activeProp === 'thug') {
      ctx.save();
      ctx.font = '84px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🕶️', width / 2, height * 0.38);

      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText('🔥 TOO COOL FOR BLUR 🔥', width / 2, height * 0.38 + 65);
      ctx.restore();
    }
  }

  captureSnapshot() {
    return this.canvas.toDataURL('image/png');
  }
}
