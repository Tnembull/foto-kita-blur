export class CanvasRenderer {
  constructor(canvasElement, videoElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.video = videoElement;
    
    this.targetBlur = 0;
    this.currentBlur = 0;
    this.maxBlurRadius = 18;
    this.isPeaceActive = false;
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

  renderFrame() {
    if (!this.video.videoWidth || !this.video.videoHeight) return;

    // Match canvas dimensions to video aspect ratio
    if (this.canvas.width !== this.video.videoWidth) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
    }

    // Linear interpolation (lerp) for silky smooth blur transition
    this.currentBlur += (this.targetBlur - this.currentBlur) * 0.15;
    if (Math.abs(this.currentBlur) < 0.1) this.currentBlur = 0;

    this.ctx.save();
    
    // Mirror the video canvas display
    this.ctx.translate(this.canvas.width, 0);
    this.ctx.scale(-1, 1);

    // Apply Canvas CSS Filter Blur
    if (this.currentBlur > 0) {
      this.ctx.filter = `blur(${this.currentBlur.toFixed(1)}px)`;
    } else {
      this.ctx.filter = 'none';
    }

    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  captureSnapshot() {
    return this.canvas.toDataURL('image/png');
  }
}
