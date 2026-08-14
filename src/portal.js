/**
 * Portal Engine: Dynamic Hand Portal Framing, Slingshot Physics, and Pinch Lens
 */

export class PortalEngine {
  constructor() {
    this.slingshotPull = false;
    this.slingshotOrigin = null;
    this.slingshotTarget = null;
    this.projectiles = [];
    this.lastPinchState = false;
  }

  /**
   * Calculates 2-Hand Portal Frame Polygon / Quad coordinates
   * @param {Array} handsLandmarks - Array of detected hands (up to 2 hands)
   * @param {number} width 
   * @param {number} height 
   * @returns {Object|null} Portal Quad bounds or null
   */
  getPortalQuad(handsLandmarks, width, height) {
    if (!handsLandmarks || handsLandmarks.length < 2) return null;

    const hand1 = handsLandmarks[0];
    const hand2 = handsLandmarks[1];

    // Identify left and right hands by x coordinate of wrist (landmark 0)
    let leftHand = hand1[0].x < hand2[0].x ? hand1 : hand2;
    let rightHand = hand1[0].x < hand2[0].x ? hand2 : hand1;

    // Mirrored coordinates for canvas display
    const p1 = { x: (1 - leftHand[4].x) * width, y: leftHand[4].y * height };   // Left Thumb
    const p2 = { x: (1 - leftHand[8].x) * width, y: leftHand[8].y * height };   // Left Index
    const p3 = { x: (1 - rightHand[8].x) * width, y: rightHand[8].y * height }; // Right Index
    const p4 = { x: (1 - rightHand[4].x) * width, y: rightHand[4].y * height }; // Right Thumb

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    // Ensure portal box has a minimum size
    if (maxX - minX < 80 || maxY - minY < 80) return null;

    return {
      points: [p1, p2, p3, p4],
      bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    };
  }

  /**
   * Renders glowing portal frame border, vertex nodes, and laser lines
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Object} portalQuad 
   * @param {number} time 
   */
  renderPortalFrame(ctx, portalQuad, time = 0) {
    if (!portalQuad) return;

    const { points, bounds } = portalQuad;

    ctx.save();

    // Pulsing Neon Border
    const glow = 15 + Math.sin(time * 0.005) * 8;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = glow;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner Portal Hatch Grid Lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x + 10, bounds.y + 10, bounds.w - 20, bounds.h - 20);

    // Glowing Vertex Nodes
    points.forEach((p, idx) => {
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Vertex Labels (NODE 01..04)
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 10px Inter, monospace';
      ctx.fillText(`P-${idx + 1}`, p.x + 10, p.y - 10);
    });

    ctx.restore();
  }

  /**
   * Process Slingshot (✌️👌) Mechanics
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Array} handsLandmarks 
   * @param {number} width 
   * @param {number} height 
   * @param {Function} onLaunchSfx 
   */
  processSlingshot(ctx, handsLandmarks, width, height, onLaunchSfx) {
    if (!handsLandmarks || handsLandmarks.length < 2) {
      this.slingshotPull = false;
      this.renderProjectiles(ctx, width, height);
      return;
    }

    const hand1 = handsLandmarks[0];
    const hand2 = handsLandmarks[1];

    // Left hand peace sign (anchor) + Right hand pinch (puller)
    const pAnchor = { x: (1 - hand1[8].x) * width, y: hand1[8].y * height };
    const pPuller = { x: (1 - hand2[8].x) * width, y: hand2[8].y * height };

    const dist = Math.hypot(pPuller.x - pAnchor.x, pPuller.y - pAnchor.y);

    if (dist > 60) {
      this.slingshotPull = true;
      this.slingshotOrigin = pAnchor;
      this.slingshotTarget = pPuller;

      // Draw Slingshot Band
      ctx.save();
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 5;

      ctx.beginPath();
      ctx.moveTo(pAnchor.x - 15, pAnchor.y);
      ctx.lineTo(pPuller.x, pPuller.y);
      ctx.lineTo(pAnchor.x + 15, pAnchor.y);
      ctx.stroke();

      // Energy Ball at Pinch Target
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(pPuller.x, pPuller.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (this.slingshotPull) {
      // Release Slingshot! Launch Projectile
      this.slingshotPull = false;
      const angle = Math.atan2(this.slingshotOrigin.y - this.slingshotTarget.y, this.slingshotOrigin.x - this.slingshotTarget.x);
      const speed = 18;

      this.projectiles.push({
        x: this.slingshotTarget.x,
        y: this.slingshotTarget.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0
      });

      if (onLaunchSfx) onLaunchSfx();
    }

    this.renderProjectiles(ctx, width, height);
  }

  /**
   * Renders active slingshot energy projectiles
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   */
  renderProjectiles(ctx, width, height) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;

      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(56, 189, 248, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12 * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * Renders localized Pinch Lens (🤏) Magnifying Warp Circle
   * @param {CanvasRenderingContext2D} ctx 
   * @param {Array} landmarks 
   * @param {number} width 
   * @param {number} height 
   */
  renderPinchLens(ctx, landmarks, width, height) {
    if (!landmarks || landmarks.length < 21) return;

    const thumb = landmarks[4];
    const index = landmarks[8];

    const cx = (1 - (thumb.x + index.x) / 2) * width;
    const cy = ((thumb.y + index.y) / 2) * height;
    const dist = Math.hypot((thumb.x - index.x) * width, (thumb.y - index.y) * height);

    if (dist < 80) {
      ctx.save();
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fill();
      ctx.restore();
    }
  }
}
