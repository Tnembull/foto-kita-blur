/**
 * Vision Shaders Engine for Hand Portal Lens Filters
 */

export class VisionShaders {
  /**
   * Applies selected vision filter inside target canvas or region
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   * @param {string} filterName 
   * @param {number} time 
   */
  static applyFilter(ctx, width, height, filterName, time = 0) {
    if (!filterName || filterName === 'normal') return;

    switch (filterName) {
      case 'thermal':
        this.applyThermal(ctx, width, height);
        break;

      case 'xray':
        this.applyXRay(ctx, width, height);
        break;

      case 'matrix':
        this.applyMatrix(ctx, width, height, time);
        break;

      case 'neon':
        this.applyNeonEdges(ctx, width, height);
        break;

      case 'pixelate':
        this.applyPixelate(ctx, width, height, 12);
        break;

      case 'nightvision':
        this.applyNightVision(ctx, width, height);
        break;

      case 'vaporwave':
        this.applyVaporwave(ctx, width, height, time);
        break;

      default:
        break;
    }
  }

  // 🔥 Thermal Vision Heatmap Shader
  static applyThermal(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Luminance / heat value
      const val = (r * 0.3 + g * 0.59 + b * 0.11) / 255;

      if (val < 0.25) {
        // Deep purple to blue
        data[i] = Math.floor(val * 4 * 100);
        data[i + 1] = 0;
        data[i + 2] = Math.floor(150 + val * 4 * 105);
      } else if (val < 0.5) {
        // Cyan / Teal
        data[i] = 0;
        data[i + 1] = Math.floor((val - 0.25) * 4 * 255);
        data[i + 2] = Math.floor(255 - (val - 0.25) * 4 * 150);
      } else if (val < 0.75) {
        // Yellow / Orange
        data[i] = Math.floor((val - 0.5) * 4 * 255);
        data[i + 1] = 255;
        data[i + 2] = 0;
      } else {
        // Red / Bright White
        data[i] = 255;
        data[i + 1] = Math.floor((1 - val) * 4 * 255);
        data[i + 2] = Math.floor((val - 0.75) * 4 * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // 🧪 X-Ray / Bio-Scan Shader
  static applyXRay(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Inverted blueish bone glow
      const inv = 255 - avg;
      data[i] = Math.floor(inv * 0.3);
      data[i + 1] = Math.floor(inv * 0.8);
      data[i + 2] = Math.min(255, Math.floor(inv * 1.3));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // 🌐 Cyberpunk Matrix Scanlines & Neon Grid
  static applyMatrix(ctx, width, height, time) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const scanlineOffset = Math.floor((time * 0.05) % 8);

    for (let y = 0; y < height; y++) {
      const isScanline = (y + scanlineOffset) % 6 < 2;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const g = data[i + 1];

        // Green matrix tint
        data[i] = Math.floor(data[i] * 0.2);
        data[i + 1] = Math.min(255, Math.floor(g * 1.4 + 30));
        data[i + 2] = Math.floor(data[i + 2] * 0.3);

        if (isScanline) {
          data[i + 1] = Math.min(255, data[i + 1] + 50);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // ⚡ Holographic Neon Edges Shader
  static applyNeonEdges(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4;
        const right = (y * width + (x + 1)) * 4;
        const down = ((y + 1) * width + x) * 4;

        const diffX = Math.abs(copy[i] - copy[right]) + Math.abs(copy[i + 1] - copy[right + 1]) + Math.abs(copy[i + 2] - copy[right + 2]);
        const diffY = Math.abs(copy[i] - copy[down]) + Math.abs(copy[i + 1] - copy[down + 1]) + Math.abs(copy[i + 2] - copy[down + 2]);
        const edge = Math.min(255, diffX + diffY);

        if (edge > 40) {
          data[i] = 0;
          data[i + 1] = Math.min(255, edge * 2); // Cyan edge
          data[i + 2] = 255;
        } else {
          data[i] = 10;
          data[i + 1] = 15;
          data[i + 2] = 30;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // 👾 Retro 8-Bit Pixelate Shader
  static applyPixelate(ctx, width, height, size = 12) {
    const w = Math.ceil(width / size);
    const h = Math.ceil(height / size);

    // Downscale offscreen and upscale back
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ctx.canvas, 0, 0, width, height, 0, 0, w, h);
    ctx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
  }

  // 🌑 Night Vision Goggles Shader
  static applyNightVision(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = Math.floor(avg * 0.1);
      data[i + 1] = Math.min(255, Math.floor(avg * 1.5 + 20)); // Bright phosphor green
      data[i + 2] = Math.floor(avg * 0.1);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // 🌈 Vaporwave Hue Cycle Shader
  static applyVaporwave(ctx, width, height, time) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const shift = (time * 0.05) % 255;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = (data[i] + shift) % 255; // Red shift
      data[i + 1] = Math.floor(data[i + 1] * 0.6);
      data[i + 2] = (data[i + 2] + shift * 0.5) % 255; // Blue shift
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
