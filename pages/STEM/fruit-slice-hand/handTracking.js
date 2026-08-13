import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

export class FruitHandTracker {
  constructor({ video, overlay, gestureText, fpsText }) {
    this.video = video;
    this.overlay = overlay;
    this.ctx = overlay.getContext("2d");
    this.gestureText = gestureText;
    this.fpsText = fpsText;
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.lastFrameTime = performance.now();
    this.smoothedTip = null;
    this.previousTip = null;
  }

  async initCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false
    });
    this.video.srcObject = stream;
    await this.video.play();
  }

  async initHandTracking() {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.45,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.45
    });
  }

  update(canvasWidth, canvasHeight) {
    const now = performance.now();
    const empty = {
      hasHand: false,
      isSliceGesture: false,
      indexTip: null,
      previousTip: null,
      speed: 0,
      landmarks: null
    };

    if (!this.landmarker || !this.video.videoWidth) {
      this.drawOverlay(null, null);
      return empty;
    }

    let results = null;
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      results = this.landmarker.detectForVideo(this.video, now);
    }

    const hand = results?.landmarks?.[0];
    if (!hand) {
      this.smoothedTip = null;
      this.previousTip = null;
      this.drawOverlay(null, null);
      this.gestureText.textContent = "Gesture: no hand";
      return empty;
    }

    const fingerStates = detectFingerStates(hand);
    const rawTip = {
      // MediaPipe gives normalized x from the camera's view. The preview is mirrored,
      // so the x-coordinate is flipped to match what students see on the screen.
      x: (1 - hand[8].x) * canvasWidth,
      y: hand[8].y * canvasHeight
    };
    const previousTip = this.smoothedTip ? { ...this.smoothedTip } : null;
    const indexTip = this.smoothTip(rawTip);
    const frameMs = Math.max(now - this.lastFrameTime, 1);
    const dt = frameMs / 1000;
    const speed = previousTip ? distance(indexTip, previousTip) / dt : 0;
    this.lastFrameTime = now;

    const isSliceGesture = detectSliceGesture(fingerStates);
    this.drawOverlay(hand, indexTip);
    this.updateLabels(isSliceGesture, frameMs);

    return {
      hasHand: true,
      isSliceGesture,
      indexTip,
      previousTip,
      speed,
      landmarks: hand,
      fingerStates
    };
  }

  smoothTip(rawTip) {
    if (!this.smoothedTip) {
      this.smoothedTip = rawTip;
      return rawTip;
    }
    this.smoothedTip = {
      x: this.smoothedTip.x + (rawTip.x - this.smoothedTip.x) * 0.38,
      y: this.smoothedTip.y + (rawTip.y - this.smoothedTip.y) * 0.38
    };
    return this.smoothedTip;
  }

  updateLabels(isSliceGesture, frameMs) {
    this.gestureText.textContent = isSliceGesture ? "Gesture: slicing" : "Gesture: hand";
    const fps = Math.round(1000 / frameMs);
    this.fpsText.textContent = `FPS: ${fps}`;
  }

  drawOverlay(landmarks, indexTip) {
    const ctx = this.ctx;
    const width = this.overlay.width;
    const height = this.overlay.height;
    ctx.clearRect(0, 0, width, height);
    if (!landmarks) return;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(144, 255, 122, .8)";
    for (const [a, b] of CONNECTIONS) {
      const pa = landmarks[a];
      const pb = landmarks[b];
      ctx.beginPath();
      ctx.moveTo((1 - pa.x) * width, pa.y * height);
      ctx.lineTo((1 - pb.x) * width, pb.y * height);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      const point = landmarks[i];
      ctx.fillStyle = i === 8 ? "#ffdd55" : "#7df8ff";
      ctx.beginPath();
      ctx.arc((1 - point.x) * width, point.y * height, i === 8 ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (indexTip) {
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(indexTip.x / window.innerWidth * width, indexTip.y / window.innerHeight * height, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function detectSliceGesture(fingerStates) {
  return fingerStates.index && !fingerStates.middle && !fingerStates.ring && !fingerStates.pinky;
}

export function detectFingerStates(landmarks) {
  // Each non-thumb finger is "extended" when its fingertip is above its middle joint
  // and the finger angle is fairly straight. This is simple enough for students to read.
  return {
    index: isFingerExtended(landmarks, 5, 6, 8),
    middle: isFingerExtended(landmarks, 9, 10, 12),
    ring: isFingerExtended(landmarks, 13, 14, 16),
    pinky: isFingerExtended(landmarks, 17, 18, 20)
  };
}

function isFingerExtended(landmarks, base, middle, tip) {
  const fingerLength = distance(landmarks[base], landmarks[tip]);
  const foldedLength = distance(landmarks[base], landmarks[middle]);
  return landmarks[tip].y < landmarks[middle].y && fingerLength > foldedLength * 1.45;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
