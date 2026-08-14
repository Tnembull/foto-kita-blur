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
const audioModeSelect = document.getElementById('audio-mode-select');
const audioFileInput = document.getElementById('audio-file-input');
const audioStartInput = document.getElementById('audio-start-input');
const audioStartVal = document.getElementById('audio-start-val');
const propSelect = document.getElementById('prop-select');
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
    renderer.setHandLandmarks(results.multiHandLandmarks[0]);
    for (const landmarks of results.multiHandLandmarks) {
      if (isPeaceGesture(landmarks)) {
        peaceDetected = true;
        break;
      }
    }
  } else {
    renderer.setHandLandmarks(null);
  }

  // Update UI & Renderers
  renderer.setTargetBlur(peaceDetected);

  if (peaceDetected) {
    statusBadge.classList.add('active');
    statusText.textContent = '✌️ PEACE TERDETEKSI - BLUR ACTIVE!';
    audio.start();
  } else {
    statusBadge.classList.remove('active');
    statusText.textContent = 'Mencari Gestur ✌️...';
    audio.stop();
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
    // Request permission first to populate device labels & trigger browser prompt
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

// Event Listeners
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
  previewModal.classList.add('open');
});

closeModalBtn.addEventListener('click', () => {
  previewModal.classList.remove('open');
});

// Boot app
setupCamera();
