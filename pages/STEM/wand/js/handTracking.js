import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const REQUIRED_STABLE_FRAMES = 5;

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

const ARROWS = {
  LEFT: "←",
  RIGHT: "→",
  UP: "↑",
  DOWN: "↓"
};

export class HandDirectionTracker {
  constructor({ video, canvas }) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.lastFrameTime = performance.now();
    this.fps = 0;
    this.showVision = true;
    this.candidateDirection = null;
    this.acceptedDirection = null;
    this.stableFrames = 0;
    this.lastState = this.emptyState();
  }

  emptyState() {
    return {
      hasHand: false,
      candidateDirection: "--",
      acceptedDirection: "--",
      arrow: "--",
      vector: null,
      angle: null,
      stability: 0,
      fps: this.fps
    };
  }

  async initCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API is not available in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 960, height: 720, facingMode: "user" },
      audio: false
    });
    this.video.srcObject = stream;
    await this.video.play();
  }

  async initLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  update() {
    const now = performance.now();
    this.fps = Math.round(1000 / Math.max(now - this.lastFrameTime, 1));
    this.lastFrameTime = now;

    if (!this.landmarker || !this.video.videoWidth) {
      this.draw(null, null);
      return this.emptyState();
    }

    if (this.video.currentTime === this.lastVideoTime) {
      return { ...this.lastState, fps: this.fps };
    }

    this.lastVideoTime = this.video.currentTime;
    const results = this.landmarker.detectForVideo(this.video, now);
    const landmarks = results?.landmarks?.[0];
    if (!landmarks) {
      this.stableFrames = 0;
      this.draw(null, null);
      this.lastState = this.emptyState();
      return this.lastState;
    }

    const directionData = detectIndexDirection(landmarks);
    this.smoothDirection(directionData.direction);
    const stability = Math.round(Math.min(this.stableFrames / REQUIRED_STABLE_FRAMES, 1) * 100);
    this.draw(landmarks, directionData);

    this.lastState = {
      hasHand: true,
      candidateDirection: directionData.direction,
      acceptedDirection: this.acceptedDirection || "--",
      arrow: ARROWS[this.acceptedDirection] || "--",
      vector: directionData.vector,
      angle: directionData.angle,
      stability,
      fps: this.fps
    };
    return this.lastState;
  }

  // STEM CONCEPT: Gesture Smoothing
  // The app waits for the same direction across several frames before accepting it.
  smoothDirection(direction) {
    if (direction === this.candidateDirection) {
      this.stableFrames += 1;
    } else {
      this.candidateDirection = direction;
      this.stableFrames = 1;
    }
    if (this.stableFrames >= REQUIRED_STABLE_FRAMES) {
      this.acceptedDirection = direction;
    }
  }

  draw(landmarks, directionData) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);
    if (!this.showVision || !landmarks) return;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(100, 243, 255, .92)";
    for (const [a, b] of CONNECTIONS) {
      const pa = mapPoint(landmarks[a], width, height);
      const pb = mapPoint(landmarks[b], width, height);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      const point = mapPoint(landmarks[i], width, height);
      ctx.fillStyle = i === 8 ? "#ffe44d" : "#ffffff";
      ctx.beginPath();
      ctx.arc(point.x, point.y, i === 8 ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (directionData) {
      const base = mapPoint(landmarks[6], width, height);
      const tip = mapPoint(landmarks[8], width, height);
      const end = {
        x: tip.x + directionData.vector.x * 92,
        y: tip.y + directionData.vector.y * 92
      };
      drawArrow(ctx, base, end);
      ctx.fillStyle = "#ffe44d";
      ctx.font = "700 18px system-ui";
      ctx.fillText(directionData.direction, end.x + 8, end.y - 8);
    }
    ctx.restore();
  }
}

// STEM CONCEPT: Direction Vector
// MediaPipe returns normalized points. We use PIP -> fingertip as the pointing vector.
export function detectIndexDirection(landmarks) {
  const pip = landmarks[6];
  const tip = landmarks[8];
  const dx = -(tip.x - pip.x);
  const dy = tip.y - pip.y;
  const length = Math.hypot(dx, dy) || 1;
  const vector = { x: dx / length, y: dy / length };
  const angle = Math.atan2(vector.y, vector.x) * 180 / Math.PI;

  let direction;
  if (angle >= -45 && angle <= 45) direction = "RIGHT";
  else if (angle > 45 && angle <= 135) direction = "DOWN";
  else if (angle < -45 && angle >= -135) direction = "UP";
  else direction = "LEFT";

  return { direction, vector, angle };
}

function mapPoint(point, width, height) {
  return {
    x: (1 - point.x) * width,
    y: point.y * height
  };
}

function drawArrow(ctx, start, end) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  ctx.strokeStyle = "#ffe44d";
  ctx.fillStyle = "#ffe44d";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#ffe44d";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - Math.cos(angle - 0.45) * 22, end.y - Math.sin(angle - 0.45) * 22);
  ctx.lineTo(end.x - Math.cos(angle + 0.45) * 22, end.y - Math.sin(angle + 0.45) * 22);
  ctx.closePath();
  ctx.fill();
}
