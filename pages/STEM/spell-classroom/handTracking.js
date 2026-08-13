import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const FINGER_JOINTS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20]
};

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export class HandTrackingController {
  constructor({ video, overlay, gestureBadge, fpsBadge }) {
    this.video = video;
    this.overlay = overlay;
    this.ctx = overlay.getContext("2d");
    this.gestureBadge = gestureBadge;
    this.fpsBadge = fpsBadge;
    this.handLandmarker = null;
    this.lastVideoTime = -1;
    this.lastFrameTime = performance.now();
    this.smoothedTip = null;
    this.state = this.emptyState();
  }

  emptyState() {
    return {
      detected: false,
      landmarks: null,
      fingerStates: {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false
      },
      gesture: "NONE",
      isPointing: false,
      indexTip: null,
      fps: 0
    };
  }

  async initCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      },
      audio: false
    });
    this.video.srcObject = stream;
    await new Promise((resolve) => {
      this.video.onloadedmetadata = resolve;
    });
    await this.video.play();
  }

  async initHandTracking() {
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    this.handLandmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.42,
      minHandPresenceConfidence: 0.42,
      minTrackingConfidence: 0.42
    });
  }

  updateFingerPosition(rawTip) {
    if (!this.smoothedTip) {
      this.smoothedTip = rawTip;
    } else {
      this.smoothedTip = {
        x: this.smoothedTip.x + (rawTip.x - this.smoothedTip.x) * 0.34,
        y: this.smoothedTip.y + (rawTip.y - this.smoothedTip.y) * 0.34
      };
    }
    return this.smoothedTip;
  }

  update(canvasWidth, canvasHeight) {
    if (!this.handLandmarker || !this.video.videoWidth || this.video.currentTime === this.lastVideoTime) {
      return this.state;
    }

    this.lastVideoTime = this.video.currentTime;
    const results = this.handLandmarker.detectForVideo(this.video, performance.now());
    const now = performance.now();
    const fps = 1000 / Math.max(now - this.lastFrameTime, 1);
    this.lastFrameTime = now;

    this.drawOverlay(results);

    if (!results.landmarks?.length) {
      this.state = this.emptyState();
      this.state.fps = fps;
      this.gestureBadge.textContent = "Gesture: none";
      this.fpsBadge.textContent = `FPS: ${Math.round(fps)}`;
      return this.state;
    }

    const landmarks = results.landmarks[0];
    const fingerStates = detectFingerStates(landmarks);
    const isPointing = detectPointGesture(fingerStates);
    const rawTip = {
      // The video preview is mirrored, so x is flipped before mapping onto the game canvas.
      x: (1 - landmarks[8].x) * canvasWidth,
      y: landmarks[8].y * canvasHeight
    };
    const indexTip = this.updateFingerPosition(rawTip);

    this.state = {
      detected: true,
      landmarks,
      fingerStates,
      gesture: isPointing ? "POINTING" : "HAND",
      isPointing,
      indexTip,
      fps
    };

    this.gestureBadge.textContent = `Gesture: ${this.state.gesture}`;
    this.fpsBadge.textContent = `FPS: ${Math.round(fps)}`;
    return this.state;
  }

  drawOverlay(results) {
    const { width, height } = this.overlay;
    this.ctx.clearRect(0, 0, width, height);
    if (!results.landmarks?.length) return;

    const landmarks = results.landmarks[0];
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "rgba(255, 215, 141, 0.95)";
    this.ctx.fillStyle = "#ffffff";

    for (const [a, b] of CONNECTIONS) {
      this.ctx.beginPath();
      this.ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height);
      this.ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height);
      this.ctx.stroke();
    }

    landmarks.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      this.ctx.beginPath();
      this.ctx.arc(x, y, index === 8 ? 6 : 3.5, 0, Math.PI * 2);
      this.ctx.fillStyle = index === 8 ? "#77d9ff" : "#ffffff";
      this.ctx.fill();
    });
  }
}

export async function initCamera(controller) {
  await controller.initCamera();
}

export async function initHandTracking(controller) {
  await controller.initHandTracking();
}

export function detectPointGesture(fingerStates) {
  return (
    fingerStates.index &&
    !fingerStates.middle &&
    !fingerStates.ring &&
    !fingerStates.pinky
  );
}

export function detectFingerStates(landmarks) {
  const palmSize = distance(landmarks[0], landmarks[9]) || 0.001;

  // For the four long fingers, the fingertip should be farther from the wrist
  // than the middle joint, and the finger should be relatively straight.
  const states = {};
  for (const [name, [mcp, pip, dip, tip]] of Object.entries(FINGER_JOINTS)) {
    if (name === "thumb") continue;
    const extension = distance(landmarks[0], landmarks[tip]) - distance(landmarks[0], landmarks[pip]);
    const angle = jointAngle(landmarks[mcp], landmarks[pip], landmarks[tip]);
    const tipHigh = landmarks[tip].y < landmarks[pip].y + palmSize * 0.08;
    states[name] = angle > 138 && (extension > palmSize * 0.08 || tipHigh);
  }

  // Thumb direction is less vertical than other fingers, so use its spread
  // away from the index knuckle plus its extension from the wrist.
  states.thumb =
    distance(landmarks[4], landmarks[5]) > palmSize * 0.36 &&
    distance(landmarks[0], landmarks[4]) > distance(landmarks[0], landmarks[2]) + palmSize * 0.08;

  return states;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

function jointAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magA = Math.hypot(ab.x, ab.y, ab.z);
  const magC = Math.hypot(cb.x, cb.y, cb.z);
  const cosine = dot / Math.max(magA * magC, 0.000001);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}
