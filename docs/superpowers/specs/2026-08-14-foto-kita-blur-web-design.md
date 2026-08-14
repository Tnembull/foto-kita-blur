# Design Document: Foto Kita Blur (Web Application)

**Date**: 2026-08-14  
**Status**: Approved  
**Target Domain**: `foto-blur.bulindev.tech`

---

## 1. Overview & Goals

**Foto Kita Blur Web** is a modern, interactive web application inspired by computer vision gesture detection and the viral aesthetic of "Foto Kita Blur". 

The application utilizes a live webcam stream and real-time hand landmark tracking via **MediaPipe Hands** to detect a "Peace" (✌️) hand sign. When the peace gesture is recognized:
- A smooth, adjustable Gaussian blur effect is dynamically applied over the video stream.
- An optional audio cue / ambient sound plays smoothly (*fade in/out*).
- Status indicators visually highlight the detection state.
- Users can capture high-quality snapshots with the applied blur effect, preview them, and download them immediately.

---

## 2. Architecture & Tech Stack

- **Build Tool / Runtime**: Vite (Vanilla JavaScript / HTML5 / CSS3)
- **Computer Vision**: `@mediapipe/camera_utils` & `@mediapipe/hands` (JS Client SDK)
- **Rendering Pipeline**: HTML5 2D Canvas API with hardware-accelerated CSS/Canvas filter blending & smooth linear interpolation (`lerp`)
- **Audio Subsystem**: Web Audio API for synthetic chimes / ambient sound playback
- **Styling & UI**: Vanilla CSS Design System featuring Glassmorphism, Dark Mode Slate Palette (`#0f172a`), smooth CSS animations, and modern typography (Inter/Outfit)
- **Deployment**: Static build served via lightweight HTTP server, connected to **Cloudflare Tunnel** bound to `foto-blur.bulindev.tech`

---

## 3. Core Components & User Interface

```
+-----------------------------------------------------------------------+
|  ✌️ Foto Kita Blur                     [ 🔍 Searching / ✌️ DETECTED ] |
+-----------------------------------------------------------------------+
|                                                                       |
|                       [ Real-Time Canvas Viewport ]                   |
|                        (Camera Feed + Blur Overlay)                   |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   | Glass Floating Control Dock                                   |   |
|   |  - Blur Radius (Slider 5px - 30px)                           |   |
|   |  - Gesture Sensitivity (Slider)                              |   |
|   |  - Audio Chime Toggle                                         |   |
|   |  - Camera Switcher (Select input)                             |   |
|   |  - [ 📸 CAPTURE PHOTO ]                                       |   |
|   +---------------------------------------------------------------+   |
|                                                                       |
+-----------------------------------------------------------------------+
| Modal: Photo Preview & Download (Triggers on Capture)                 |
+-----------------------------------------------------------------------+
```

### Key UI Features
1. **Header Bar**: Displays glowing status badge (`Mencari Gestur...` or `✌️ Peace Terdeteksi - BLUR ACTIVE!`).
2. **Main Viewport Canvas**: Renders mirrored webcam frames with dynamic lerped blur filters.
3. **Glass Control Dock**:
   - **Blur Intensity**: Range slider from `5px` to `35px` (default `18px`).
   - **Sensitivity**: Threshold adjustment for detection confidence.
   - **Audio Toggle**: Mute/unmute gesture activation sound.
   - **Camera Selector**: Dropdown to select video input device.
   - **Capture Button**: Shutter button to snapshot the canvas.
4. **Capture Preview Modal**: Modal window overlaying the captured image with "Download Photo" and "Close/Retake" buttons.

---

## 4. Gesture Detection Algorithm & Smoothness Logic

### MediaPipe Hand Landmarks Logic
- Hand detection checks 21 key points.
- **Peace Sign (✌️) Condition**:
  1. **Index Finger Extended**: `Landmark[8].y < Landmark[6].y`
  2. **Middle Finger Extended**: `Landmark[12].y < Landmark[10].y`
  3. **Ring Finger Folded**: `Landmark[16].y > Landmark[14].y`
  4. **Pinky Finger Folded**: `Landmark[20].y > Landmark[18].y`
  5. **Finger Separation**: Distance between Landmark 8 & 12 > Threshold (ensuring V-shape).

### Smooth Interpolation (Lerp)
To prevent sudden flickering when hand detection drops momentarily between frames:
$$\text{blur}_{\text{current}} = \text{blur}_{\text{current}} + (\text{blur}_{\text{target}} - \text{blur}_{\text{current}}) \times \alpha$$
Where $\alpha = 0.15$ for buttery smooth blur transitions.

---

## 5. File & Directory Structure

```text
foto-kita-blur/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.ico
├── src/
│   ├── style.css       # Design tokens, reset, glassmorphism, responsive UI
│   ├── main.js         # Main DOM controller & Event bindings
│   ├── gesture.js      # MediaPipe Hands initialization & gesture classification
│   ├── canvas.js       # Video rendering, lerp blur pipeline, snapshot capture
│   └── audio.js        # Web Audio API synthesizer for ambient chime
└── docs/
    └── cloudflare-tunnel.md  # Cloudflare Tunnel deployment documentation
```

---

## 6. Verification & Cloudflare Tunnel Deployment Plan

1. **Local Build Verification**:
   - Execute `npm run build` to verify clean bundle generation.
   - Test `npm run preview` to verify real-time webcam access, MediaPipe loading, blur response, audio generation, and image download.
2. **Cloudflare Tunnel Setup**:
   - Provide clear instructions for configuring `cloudflared` daemon:
     `cloudflared tunnel run --url http://localhost:3000 foto-blur`
   - Point DNS CNAME `foto-blur.bulindev.tech` to Cloudflare Tunnel UUID.
