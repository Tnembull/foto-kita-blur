# Foto Kita Blur Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, interactive single-page web application inspired by "Foto Kita Blur" that detects the ✌️ peace hand gesture via webcam using MediaPipe Hands, applies a smooth lerped blur effect, plays ambient sound, supports image capture & download, and is ready for Cloudflare Tunnel deployment at `foto-blur.bulindev.tech`.

**Architecture:** Vite + Vanilla JS/TS architecture with HTML5 Canvas 2D rendering pipeline, `@mediapipe/hands` gesture classifier, Web Audio API chime synthesizer, and glassmorphic UI overlay.

**Tech Stack:** Vite, Vanilla JS, HTML5 Canvas API, MediaPipe Hands JS (`@mediapipe/camera_utils`, `@mediapipe/hands`), Web Audio API, Vanilla CSS (Glassmorphism & Dark Slate theme).

## Global Constraints
- All paths are relative to `/home/bulindev/Desktop/Portfolio/foto-kita-blur`.
- Use npm as package manager.
- Zero external framework overhead (pure Vite Vanilla JS).
- Clean, modular ES modules separation (`gesture.js`, `canvas.js`, `audio.js`, `main.js`).

---

### Task 1: Project Scaffolding & Design System

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/style.css`

**Interfaces:**
- Produces: CSS design variables, glassmorphism card styling, responsive grid layout, and DOM structure.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "foto-kita-blur",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 3000 --host"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  },
  "dependencies": {
    "@mediapipe/camera_utils": "^0.4.1614359085",
    "@mediapipe/hands": "^0.4.1635987138"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
});
```

- [ ] **Step 3: Create src/style.css with Design Tokens & Glassmorphism**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --bg-dark: #0b0f19;
  --panel-bg: rgba(15, 23, 42, 0.75);
  --panel-border: rgba(255, 255, 255, 0.12);
  --accent-indigo: #6366f1;
  --accent-pink: #ec4899;
  --accent-cyan: #06b6d4;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --radius-lg: 16px;
  --radius-md: 12px;
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-dark);
  color: var(--text-main);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  overflow-x: hidden;
}

header {
  width: 100%;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(11, 15, 25, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--panel-border);
  z-index: 10;
}

.logo-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-group h1 {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--panel-border);
  transition: all 0.3s ease;
}

.status-badge.active {
  background: rgba(236, 72, 153, 0.2);
  border-color: var(--accent-pink);
  color: #f472b6;
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.4);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.status-badge.active .dot {
  background: var(--accent-pink);
  box-shadow: 0 0 8px var(--accent-pink);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

main {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.viewport-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 70vh;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  border: 1px solid var(--panel-border);
  background: #000;
}

#webcam-video {
  display: none; /* Hidden, processed through Canvas */
}

#output-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.controls-dock {
  width: 100%;
  padding: 1rem 1.5rem;
  background: var(--panel-bg);
  backdrop-filter: blur(16px);
  border-radius: var(--radius-lg);
  border: 1px solid var(--panel-border);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: center;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.control-item label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
}

.control-item input[type="range"], .control-item select {
  width: 100%;
  padding: 0.4rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--panel-border);
  color: var(--text-main);
  outline: none;
}

.btn-primary {
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  border: none;
  background: linear-gradient(135deg, var(--accent-indigo), var(--accent-pink));
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.btn-secondary {
  padding: 0.6rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 100;
}

.modal-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.modal-card {
  background: var(--bg-dark);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.8);
}

.modal-card img {
  max-width: 100%;
  max-height: 60vh;
  border-radius: var(--radius-md);
  border: 1px solid var(--panel-border);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: flex-end;
}
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Foto Kita Blur ✌️ | Real-time Gesture Blur</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <header>
    <div class="logo-group">
      <h1>Foto Kita Blur ✌️</h1>
    </div>
    <div id="status-badge" class="status-badge">
      <span class="dot"></span>
      <span id="status-text">Mencari Gestur...</span>
    </div>
  </header>

  <main>
    <div class="viewport-container">
      <video id="webcam-video" playsinline></video>
      <canvas id="output-canvas"></canvas>
    </div>

    <div class="controls-dock">
      <div class="control-item">
        <label for="blur-slider">Kekuatan Blur (<span id="blur-val">18</span>px)</label>
        <input type="range" id="blur-slider" min="5" max="40" value="18" />
      </div>

      <div class="control-item">
        <label for="audio-toggle">Sound Ambient</label>
        <button id="audio-toggle" class="btn-secondary">🔊 Sound: Aktif</button>
      </div>

      <div class="control-item">
        <label for="camera-select">Pilih Kamera</label>
        <select id="camera-select"></select>
      </div>

      <div class="control-item">
        <label>&nbsp;</label>
        <button id="capture-btn" class="btn-primary">
          📸 Ambil Foto
        </button>
      </div>
    </div>
  </main>

  <div id="preview-modal" class="modal-overlay">
    <div class="modal-card">
      <h2>Foto Kita Blur</h2>
      <img id="captured-img" alt="Captured Photo" />
      <div class="modal-actions">
        <button id="close-modal-btn" class="btn-secondary">Tutup</button>
        <a id="download-btn" class="btn-primary" download="foto-kita-blur.png">Download Foto</a>
      </div>
    </div>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Run npm install**
Run: `npm install`
Expected: Node modules installed.

- [ ] **Step 6: Commit**
Run: `git add package.json vite.config.js index.html src/style.css`
Run: `git commit -m "feat: setup project scaffolding & design system css"`

---

### Task 2: Audio Synthesizer Module (`src/audio.js`)

**Files:**
- Create: `src/audio.js`

**Interfaces:**
- Produces: `AudioController` class with `playChime()`, `stopChime()`, `toggleMute()`.

- [ ] **Step 1: Create src/audio.js**

```js
export class AudioController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isPlaying = false;
    this.oscillator = null;
    this.gainNode = null;
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
```

- [ ] **Step 2: Commit**
Run: `git add src/audio.js`
Run: `git commit -m "feat: add Web Audio synth controller module"`

---

### Task 3: Peace Gesture Detector Module (`src/gesture.js`)

**Files:**
- Create: `src/gesture.js`

**Interfaces:**
- Produces: `isPeaceGesture(landmarks)` boolean function.

- [ ] **Step 1: Create src/gesture.js**

```js
/**
 * Detects if hand landmarks represent a Peace Sign (✌️)
 * @param {Array} landmarks - 21 MediaPipe hand landmark coordinates
 * @returns {boolean} true if peace sign is detected
 */
export function isPeaceGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  // Landmark IDs:
  // 8: Index Tip, 6: Index PIP
  // 12: Middle Tip, 10: Middle PIP
  // 16: Ring Tip, 14: Ring PIP
  // 20: Pinky Tip, 18: Pinky PIP

  const isFingerUp = (tip, pip) => landmarks[tip].y < landmarks[pip].y;

  const indexUp = isFingerUp(8, 6);
  const middleUp = isFingerUp(12, 10);
  const ringFolded = !isFingerUp(16, 14);
  const pinkyFolded = !isFingerUp(20, 18);

  // Check horizontal separation between Index and Middle finger tips to ensure "V" shape
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const distance = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);
  const isVSpread = distance > 0.03;

  return indexUp && middleUp && ringFolded && pinkyFolded && isVSpread;
}
```

- [ ] **Step 2: Commit**
Run: `git add src/gesture.js`
Run: `git commit -m "feat: implement MediaPipe peace gesture detection algorithm"`

---

### Task 4: Canvas & Rendering Pipeline (`src/canvas.js`)

**Files:**
- Create: `src/canvas.js`

**Interfaces:**
- Produces: `CanvasRenderer` class managing smooth lerped blur filtering, canvas mirroring, and snapshot capture.

- [ ] **Step 1: Create src/canvas.js**

```js
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
```

- [ ] **Step 2: Commit**
Run: `git add src/canvas.js`
Run: `git commit -m "feat: implement lerped blur canvas rendering engine"`

---

### Task 5: Main Application Controller & MediaPipe Integration (`src/main.js`)

**Files:**
- Create: `src/main.js`

**Interfaces:**
- Glues webcam video stream, MediaPipe Hands detector, `CanvasRenderer`, `AudioController`, and DOM UI elements.

- [ ] **Step 1: Create src/main.js**

```js
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { isPeaceGesture } from './gesture.js';
import { CanvasRenderer } from './canvas.js';
import { AudioController } from './audio.js';

// DOM Elements
const videoEl = document.getElementById('webcam-video');
const canvasEl = document.getElementById('output-canvas');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const blurSlider = document.getElementById('blur-slider');
const blurValText = document.getElementById('blur-val');
const audioToggleBtn = document.getElementById('audio-toggle');
const cameraSelect = document.getElementById('camera-select');
const captureBtn = document.getElementById('capture-btn');
const previewModal = document.getElementById('preview-modal');
const capturedImg = document.getElementById('captured-img');
const closeModalBtn = document.getElementById('close-modal-btn');
const downloadBtn = document.getElementById('download-btn');

// Controllers
const renderer = new CanvasRenderer(canvasEl, videoEl);
const audio = new AudioController();

// Init MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});

hands.onResults((results) => {
  let peaceDetected = false;

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      if (isPeaceGesture(landmarks)) {
        peaceDetected = true;
        break;
      }
    }
  }

  // Update UI & Renderers
  renderer.setTargetBlur(peaceDetected);

  if (peaceDetected) {
    statusBadge.classList.add('active');
    statusText.textContent = '✌️ PEACE TERDETEKSI - BLUR ACTIVE!';
    audio.startChime();
  } else {
    statusBadge.classList.remove('active');
    statusText.textContent = 'Mencari Gestur ✌️...';
    audio.stopChime();
  }
});

// Animation Loop
function loop() {
  renderer.renderFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Initialize Camera
async function setupCamera() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === 'videoinput');

  cameraSelect.innerHTML = '';
  videoDevices.forEach((device, idx) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || `Kamera ${idx + 1}`;
    cameraSelect.appendChild(option);
  });

  const selectedDeviceId = videoDevices[0]?.deviceId;
  startCamera(selectedDeviceId);
}

let activeCamera = null;

function startCamera(deviceId) {
  if (activeCamera) {
    activeCamera.stop();
  }

  activeCamera = new Camera(videoEl, {
    onFrame: async () => {
      await hands.send({ image: videoEl });
    },
    width: 1280,
    height: 720,
    deviceId: deviceId
  });

  activeCamera.start();
}

// Event Listeners
blurSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  blurValText.textContent = val;
  renderer.setMaxBlurRadius(val);
});

audioToggleBtn.addEventListener('click', () => {
  const isMuted = audio.toggleMute();
  audioToggleBtn.textContent = isMuted ? '🔇 Sound: Mute' : '🔊 Sound: Aktif';
});

cameraSelect.addEventListener('change', (e) => {
  startCamera(e.target.value);
});

captureBtn.addEventListener('click', () => {
  const dataUrl = renderer.captureSnapshot();
  capturedImg.src = dataUrl;
  downloadBtn.href = dataUrl;
  previewModal.classList.add('open');
});

closeModalBtn.addEventListener('click', () => {
  previewModal.classList.remove('open');
});

// Boot app
setupCamera();
```

- [ ] **Step 2: Commit**
Run: `git add src/main.js`
Run: `git commit -m "feat: connect main controller, mediapipe hands, renderer & UI events"`

---

### Task 6: Cloudflare Tunnel Deployment Documentation

**Files:**
- Create: `docs/cloudflare-tunnel.md`

- [ ] **Step 1: Create docs/cloudflare-tunnel.md**

```markdown
# Cloudflare Tunnel Setup for foto-blur.bulindev.tech

This guide outlines how to serve and connect **Foto Kita Blur Web** to `foto-blur.bulindev.tech` using Cloudflare Tunnels.

## 1. Production Build & Local Serve

First, build and run the production preview server locally on port `3000`:

```bash
npm run build
npm run preview
```

The application will be accessible locally at `http://localhost:3000`.

## 2. Cloudflare Tunnel Configuration

Assuming `cloudflared` CLI is installed on your Linux system:

### Step A: Authenticate & Create Tunnel (If not done)
```bash
cloudflared tunnel login
cloudflared tunnel create foto-blur-tunnel
```

### Step B: Configure Tunnel Routing
Create or edit `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-UUID>
credentials-file: /home/bulindev/.cloudflared/<YOUR-TUNNEL-UUID>.json

ingress:
  - hostname: foto-blur.bulindev.tech
    service: http://localhost:3000
  - service: http_status:404
```

### Step C: Add DNS CNAME Record
```bash
cloudflared tunnel route dns foto-blur-tunnel foto-blur.bulindev.tech
```

### Step D: Run Tunnel Daemon
```bash
cloudflared tunnel run foto-blur-tunnel
```

Now your site is securely available over HTTPS at `https://foto-blur.bulindev.tech`!
```

- [ ] **Step 2: Commit**
Run: `git add docs/cloudflare-tunnel.md`
Run: `git commit -m "docs: add cloudflare tunnel deployment guide"`

---

### Task 7: Build Verification & Testing

- [ ] **Step 1: Test Build**
Run: `npm run build`
Expected: `dist/` directory successfully created with index.html and bundled assets.

- [ ] **Step 2: Final Commit**
Run: `git add .`
Run: `git commit -m "chore: complete project verification"`
