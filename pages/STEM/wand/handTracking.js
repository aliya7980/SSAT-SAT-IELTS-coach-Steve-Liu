import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

export class HandTracking {
  constructor({ video, canvas }) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.lastFrameAt = performance.now();
    this.fps = 0;
    this.debugVisible = false;
    this.lastState = null;
  }

  async initCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("No webcam API is available in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: "user" },
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
      minHandDetectionConfidence: 0.48,
      minHandPresenceConfidence: 0.48,
      minTrackingConfidence: 0.48
    });
  }

  resize(width, height) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(width * ratio);
    this.canvas.height = Math.floor(height * ratio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  detect(screenWidth, screenHeight) {
    const now = performance.now();
    const frameMs = Math.max(now - this.lastFrameAt, 1);
    this.fps = Math.round(1000 / frameMs);
    this.lastFrameAt = now;

    const empty = {
      hasHand: false,
      indexBase: null,
      indexTip: null,
      landmarks: null,
      normalizedTip: null,
      fps: this.fps
    };

    if (!this.landmarker || !this.video.videoWidth) {
      this.draw(null, screenWidth, screenHeight);
      return empty;
    }

    if (this.video.currentTime === this.lastVideoTime && this.lastState) {
      return { ...this.lastState, fps: this.fps };
    }

    this.lastVideoTime = this.video.currentTime;
    const results = this.landmarker.detectForVideo(this.video, now);
    const landmarks = results?.landmarks?.[0];
    if (!landmarks) {
      this.draw(null, screenWidth, screenHeight);
      this.lastState = empty;
      return empty;
    }

    const indexBase = this.mapVideoPoint(landmarks[5], screenWidth, screenHeight);
    const indexTip = this.mapVideoPoint(landmarks[8], screenWidth, screenHeight);
    this.draw(landmarks, screenWidth, screenHeight);
    this.lastState = {
      hasHand: true,
      indexBase,
      indexTip,
      landmarks,
      normalizedTip: landmarks[8],
      fps: this.fps
    };
    return this.lastState;
  }

  mapVideoPoint(point, screenWidth, screenHeight) {
    const videoW = this.video.videoWidth || 16;
    const videoH = this.video.videoHeight || 9;
    const scale = Math.max(screenWidth / videoW, screenHeight / videoH);
    const renderedW = videoW * scale;
    const renderedH = videoH * scale;
    const offsetX = (screenWidth - renderedW) / 2;
    const offsetY = (screenHeight - renderedH) / 2;
    return {
      x: offsetX + (1 - point.x) * renderedW,
      y: offsetY + point.y * renderedH
    };
  }

  draw(landmarks, width, height) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    if (!this.debugVisible || !landmarks) return;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(138, 249, 255, .8)";
    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = this.mapVideoPoint(landmarks[a], width, height);
      const pb = this.mapVideoPoint(landmarks[b], width, height);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      const point = this.mapVideoPoint(landmarks[i], width, height);
      ctx.fillStyle = i === 8 ? "#ffe27a" : "#b98cff";
      ctx.beginPath();
      ctx.arc(point.x, point.y, i === 8 ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  stop() {
    const stream = this.video.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    this.video.srcObject = null;
  }
}
