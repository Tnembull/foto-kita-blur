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
