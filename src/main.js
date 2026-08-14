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
  try {
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
  } catch (err) {
    console.error('Gagal mengakses kamera:', err);
    statusText.textContent = 'Akses Kamera Ditolak / Tidak Tersedia';
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
