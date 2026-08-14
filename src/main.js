import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { isGestureActive } from './gesture.js';
import { CanvasRenderer } from './canvas.js';
import { AudioController } from './audio.js';

// DOM Elements
const videoEl = document.getElementById('webcam-video');
const canvasEl = document.getElementById('output-canvas');
const countdownOverlay = document.getElementById('countdown-overlay');
const statusBadge = document.getElementById('status-badge');
const statusText = document.getElementById('status-text');
const gestureSelect = document.getElementById('gesture-select');
const shaderSelect = document.getElementById('shader-select');
const blurSlider = document.getElementById('blur-slider');
const blurValText = document.getElementById('blur-val');
const audioModeSelect = document.getElementById('audio-mode-select');
const audioFileInput = document.getElementById('audio-file-input');
const audioStartInput = document.getElementById('audio-start-input');
const audioStartVal = document.getElementById('audio-start-val');
const propSelect = document.getElementById('prop-select');
const cameraSelect = document.getElementById('camera-select');
const captureBtn = document.getElementById('capture-btn');
const captureGridBtn = document.getElementById('capture-grid-btn');
const previewModal = document.getElementById('preview-modal');
const modalTitle = document.getElementById('modal-title');
const capturedImg = document.getElementById('captured-img');
const closeModalBtn = document.getElementById('close-modal-btn');
const downloadBtn = document.getElementById('download-btn');

// Controllers
const renderer = new CanvasRenderer(canvasEl, videoEl);
const audio = new AudioController();
let activePattern = 'peace'; // default gesture pattern

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
  let gestureDetected = false;

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    renderer.setHandLandmarks(results.multiHandLandmarks[0], results.multiHandLandmarks);
    for (const landmarks of results.multiHandLandmarks) {
      if (isGestureActive(landmarks, activePattern)) {
        gestureDetected = true;
        break;
      }
    }
  } else {
    renderer.setHandLandmarks(null, []);
  }

  // Update UI & Renderers
  renderer.setTargetBlur(gestureDetected);

  if (gestureDetected) {
    statusBadge.classList.add('active');
    statusText.textContent = `✨ GESTUR TERDETEKSI (${activePattern.toUpperCase()}) - BLUR ACTIVE!`;
    audio.start(); // Triggers music once, plays continuously until end!
  } else {
    statusBadge.classList.remove('active');
    statusText.textContent = 'Mencari Gestur...';
  }
});

// Animation Loop
function loop() {
  renderer.renderFrame(() => audio.playSlingshotLaunchSFX());
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Initialize Camera
async function setupCamera() {
  try {
    const initialStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    initialStream.getTracks().forEach((track) => track.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');

    cameraSelect.innerHTML = '';
    if (videoDevices.length === 0) {
      const option = document.createElement('option');
      option.text = 'Kamera Default';
      cameraSelect.appendChild(option);
    } else {
      videoDevices.forEach((device, idx) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Kamera ${idx + 1}`;
        cameraSelect.appendChild(option);
      });
    }

    const selectedDeviceId = videoDevices[0]?.deviceId;
    startCamera(selectedDeviceId);
  } catch (err) {
    console.error('Gagal mengakses kamera:', err);
    statusBadge.classList.remove('active');
    statusText.textContent = '⚠️ Izinkan Akses Kamera di Browser!';
  }
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

// Countdown Animation Helper
function triggerCountdown(num) {
  return new Promise((resolve) => {
    countdownOverlay.textContent = num;
    countdownOverlay.classList.add('show');
    setTimeout(() => {
      countdownOverlay.classList.remove('show');
      setTimeout(resolve, 150);
    }, 850);
  });
}

// Photobooth 4-Grid Strip Generator
async function startPhotoboothGridCapture() {
  captureGridBtn.disabled = true;
  captureBtn.disabled = true;
  const snapshots = [];

  for (let i = 1; i <= 4; i++) {
    await triggerCountdown(3);
    await triggerCountdown(2);
    await triggerCountdown(1);
    
    // Snap
    const snapUrl = renderer.captureSnapshot();
    snapshots.push(snapUrl);
  }

  // Create 2x2 Grid Collage Canvas
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = 1280;
  gridCanvas.height = 1380;
  const gCtx = gridCanvas.getContext('2d');

  // Background
  gCtx.fillStyle = '#0f172a';
  gCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

  // Load and draw 4 images in 2x2 layout
  const imgPromises = snapshots.map((url) => {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.src = url;
    });
  });

  const loadedImgs = await Promise.all(imgPromises);
  const w = 590;
  const h = 590;
  const padding = 30;

  // Grid positions: (top-left, top-right, bottom-left, bottom-right)
  const coords = [
    { x: padding, y: padding },
    { x: padding + w + padding, y: padding },
    { x: padding, y: padding + h + padding },
    { x: padding + w + padding, y: padding + h + padding }
  ];

  loadedImgs.forEach((img, idx) => {
    const { x, y } = coords[idx];
    gCtx.save();
    gCtx.fillStyle = '#1e293b';
    gCtx.fillRect(x - 5, y - 5, w + 10, h + 10);
    gCtx.drawImage(img, x, y, w, h);
    gCtx.restore();
  });

  // Footer Banner
  gCtx.save();
  gCtx.fillStyle = 'rgba(236, 72, 153, 0.9)';
  gCtx.beginPath();
  if (gCtx.roundRect) {
    gCtx.roundRect(padding, 1250, gridCanvas.width - (padding * 2), 70, 20);
  } else {
    gCtx.rect(padding, 1250, gridCanvas.width - (padding * 2), 70);
  }
  gCtx.fill();

  gCtx.fillStyle = '#ffffff';
  gCtx.font = 'bold 28px Inter, sans-serif';
  gCtx.textAlign = 'center';
  gCtx.textBaseline = 'middle';
  gCtx.fillText('✨ PHOTOBOOTH — FOTO KITA BLUR (SAL PRIADI) 🎶 ✌️', gridCanvas.width / 2, 1285);
  gCtx.restore();

  const finalDataUrl = gridCanvas.toDataURL('image/png');
  capturedImg.src = finalDataUrl;
  downloadBtn.href = finalDataUrl;
  downloadBtn.download = 'photobooth-foto-kita-blur.png';
  if (modalTitle) modalTitle.textContent = '🎞️ Photobooth 4-Grid Strip';
  previewModal.classList.add('open');

  captureGridBtn.disabled = false;
  captureBtn.disabled = false;
}

// Event Listeners
if (gestureSelect) {
  gestureSelect.addEventListener('change', (e) => {
    activePattern = e.target.value;
    renderer.setActiveGesture(activePattern);
  });
}

if (shaderSelect) {
  shaderSelect.addEventListener('change', (e) => {
    renderer.setActiveShader(e.target.value);
  });
}

blurSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  blurValText.textContent = val;
  renderer.setMaxBlurRadius(val);
});

audioModeSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'upload') {
    audioFileInput.click();
  } else {
    audio.setMode(val);
  }
});

audioFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const objectUrl = URL.createObjectURL(file);
    audio.setCustomAudioUrl(objectUrl);
    audio.setMode('song');
    audioModeSelect.value = 'song';
  }
});

if (audioStartInput) {
  audioStartInput.addEventListener('input', (e) => {
    const sec = e.target.value;
    if (audioStartVal) audioStartVal.textContent = sec;
    audio.setSongStartTime(sec);
  });
}

if (propSelect) {
  propSelect.addEventListener('change', (e) => {
    renderer.setActiveProp(e.target.value);
  });
}

cameraSelect.addEventListener('change', (e) => {
  startCamera(e.target.value);
});

captureBtn.addEventListener('click', () => {
  const dataUrl = renderer.captureSnapshot();
  capturedImg.src = dataUrl;
  downloadBtn.href = dataUrl;
  downloadBtn.download = 'foto-kita-blur.png';
  if (modalTitle) modalTitle.textContent = '📸 Single Photo';
  previewModal.classList.add('open');
});

if (captureGridBtn) {
  captureGridBtn.addEventListener('click', () => {
    startPhotoboothGridCapture();
  });
}

closeModalBtn.addEventListener('click', () => {
  previewModal.classList.remove('open');
});

// Boot app
setupCamera();
