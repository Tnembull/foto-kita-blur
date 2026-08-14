/**
 * Detects hand gestures based on selected pattern
 * @param {Array} landmarks - 21 MediaPipe hand landmark coordinates
 * @param {string} pattern - Gesture pattern key ('peace' | 'fist' | 'open' | 'love' | 'point')
 * @returns {boolean} true if target gesture pattern is detected
 */
export function isGestureActive(landmarks, pattern = 'peace') {
  if (!landmarks || landmarks.length < 21) return false;

  const isFingerUp = (tip, pip) => landmarks[tip].y < landmarks[pip].y;

  const indexUp = isFingerUp(8, 6);
  const middleUp = isFingerUp(12, 10);
  const ringUp = isFingerUp(16, 14);
  const pinkyUp = isFingerUp(20, 18);

  switch (pattern) {
    case 'peace': {
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const distance = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);
      return indexUp && middleUp && !ringUp && !pinkyUp && distance > 0.03;
    }
    case 'fist':
      return !indexUp && !middleUp && !ringUp && !pinkyUp;

    case 'open':
      return indexUp && middleUp && ringUp && pinkyUp;

    case 'love':
      return indexUp && !middleUp && !ringUp && pinkyUp;

    case 'point':
      return indexUp && !middleUp && !ringUp && !pinkyUp;

    default:
      return indexUp && middleUp && !ringUp && !pinkyUp;
  }
}

// Backward compatibility export
export function isPeaceGesture(landmarks) {
  return isGestureActive(landmarks, 'peace');
}
