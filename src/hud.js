/**
 * Sci-Fi HUD Overlay System
 */

export class SciFiHUD {
  constructor() {
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
  }

  updateFPS() {
    const now = performance.now();
    this.frameCount++;
    if (now >= this.lastFrameTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  }

  /**
   * Renders Sci-Fi Telemetry HUD on Canvas
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   * @param {Object} options 
   */
  render(ctx, width, height, options = {}) {
    this.updateFPS();

    const {
      handCount = 0,
      activeShader = 'normal',
      activeGesture = 'peace',
      portalActive = false
    } = options;

    ctx.save();

    // Top Telemetry Bar
    ctx.fillStyle = 'rgba(8, 12, 21, 0.65)';
    ctx.fillRect(20, 20, 260, 90);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, 260, 90);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, monospace';
    ctx.fillText(`FPS: ${this.fps} | HANDS DETECTED: ${handCount}`, 32, 42);

    ctx.fillStyle = '#f472b6';
    ctx.fillText(`SHADER: ${activeShader.toUpperCase()}`, 32, 64);

    ctx.fillStyle = portalActive ? '#4ade80' : '#94a3b8';
    ctx.fillText(`PORTAL STATUS: ${portalActive ? 'ACTIVE ⚡' : 'STANDBY 🔍'}`, 32, 86);

    // Sci-Fi Crosshair in Center if Portal Active
    if (portalActive) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2);
      ctx.moveTo(width / 2 - 50, height / 2);
      ctx.lineTo(width / 2 + 50, height / 2);
      ctx.moveTo(width / 2, height / 2 - 50);
      ctx.lineTo(width / 2, height / 2 + 50);
      ctx.stroke();
    }

    ctx.restore();
  }
}
