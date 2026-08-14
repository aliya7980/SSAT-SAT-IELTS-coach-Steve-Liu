import { HandTracking } from "./handTracking.js";
import { WandController } from "./wandController.js";
import { TargetField } from "./targets.js";
import { SpellEngine } from "./spellEngine.js";
import { GestureRecognizer } from "./gestureRecognizer.js";
import { EffectsRenderer } from "./effects.js";

const els = {
  video: document.getElementById("cameraVideo"),
  threeCanvas: document.getElementById("threeCanvas"),
  landmarkCanvas: document.getElementById("landmarkCanvas"),
  startScreen: document.getElementById("startScreen"),
  startButton: document.getElementById("startButton"),
  startError: document.getElementById("startError"),
  learnButton: document.getElementById("learnButton"),
  backToMagicButton: document.getElementById("backToMagicButton"),
  learningOverlay: document.getElementById("learningOverlay"),
  debugButton: document.getElementById("debugButton"),
  fullscreenButton: document.getElementById("fullscreenButton"),
  debugHud: document.getElementById("debugHud"),
  statusText: document.getElementById("statusText"),
  spellText: document.getElementById("spellText"),
  scoreText: document.getElementById("scoreText"),
  spellsText: document.getElementById("spellsText"),
  hitsText: document.getElementById("hitsText"),
  accuracyText: document.getElementById("accuracyText"),
  handText: document.getElementById("handText"),
  indexXText: document.getElementById("indexXText"),
  indexYText: document.getElementById("indexYText"),
  speedText: document.getElementById("speedText"),
  fpsText: document.getElementById("fpsText"),
  learnTipText: document.getElementById("learnTipText"),
  learnSpeedText: document.getElementById("learnSpeedText")
};

const handTracking = new HandTracking({ video: els.video, canvas: els.landmarkCanvas });
const wand = new WandController();
const targets = new TargetField();
const spellEngine = new SpellEngine();
const gestures = new GestureRecognizer();
const effects = new EffectsRenderer(els.threeCanvas);

const app = {
  started: false,
  paused: false,
  debug: false,
  width: window.innerWidth,
  height: window.innerHeight,
  lastTime: performance.now(),
  aimedTarget: null,
  spellMessageUntil: 0
};

function resize() {
  app.width = window.innerWidth;
  app.height = window.innerHeight;
  handTracking.resize(app.width, app.height);
  if (effects.renderer) effects.resize(app.width, app.height);
}

async function start() {
  try {
    els.startButton.disabled = true;
    els.startButton.textContent = "LOADING MAGIC...";
    els.startError.textContent = "";
    effects.init();
    resize();
    await handTracking.initCamera();
    await handTracking.initHandTracking();
    targets.reset(app.width, app.height);
    app.started = true;
    els.startScreen.hidden = true;
    els.statusText.textContent = "POINT AT A TARGET TO CHARGE";
  } catch (error) {
    els.startButton.disabled = false;
    els.startButton.textContent = "START MAGIC CAMERA";
    els.startError.textContent = readableError(error);
    console.warn(error);
  }
}

function update(now) {
  const dt = Math.min((now - app.lastTime) / 1000, 0.033);
  app.lastTime = now;

  if (!app.started || document.hidden) {
    requestAnimationFrame(update);
    return;
  }

  const handState = handTracking.detect(app.width, app.height);
  wand.update(handState, dt, app.paused);
  targets.update(dt, app.width, app.height);

  app.aimedTarget = wand.visible
    ? targets.findAimedTarget(
      { x: wand.originX, y: wand.originY },
      { x: wand.directionX, y: wand.directionY }
    )
    : null;

  if (wand.updateCharge(Boolean(app.aimedTarget), dt) && spellEngine.canFire()) {
    castLightning("LIGHTNING");
  }

  if (wand.visible && !app.paused) {
    const spell = gestures.detect(wand.history);
    if (spell === "PROTEGO") castShield();
    if (spell === "STORM STRIKE") castLightning("STORM STRIKE");
  }

  effects.update(dt, wand, targets.targets);
  updateHud(handState);
  requestAnimationFrame(update);
}

function castLightning(name) {
  const result = spellEngine.fire(wand, targets, effects, name);
  if (!result) return;
  showSpell(name === "STORM STRIKE" ? "STORM STRIKE" : "FULGUR");
}

function castShield() {
  effects.spawnShield(app.width, app.height);
  showSpell("PROTEGO");
}

function showSpell(text) {
  els.spellText.textContent = text;
  app.spellMessageUntil = performance.now() + 850;
}

function updateHud(handState) {
  if (performance.now() > app.spellMessageUntil) els.spellText.textContent = "";

  if (!handState.hasHand) {
    els.statusText.textContent = "SHOW YOUR WAND HAND";
  } else if (app.aimedTarget && wand.charge > 0) {
    els.statusText.textContent = chargeStatus(wand.charge);
  } else if (app.aimedTarget) {
    els.statusText.textContent = "HOLD STEADY TO CHARGE";
  } else {
    els.statusText.textContent = "POINT AT A TARGET";
  }

  els.scoreText.textContent = targets.score;
  els.spellsText.textContent = targets.spellsCast;
  els.hitsText.textContent = targets.hits;
  els.accuracyText.textContent = `${targets.accuracy}%`;
  els.handText.textContent = handState.hasHand ? "DETECTED" : "NOT DETECTED";
  els.indexXText.textContent = handState.indexTip ? Math.round(handState.indexTip.x) : "--";
  els.indexYText.textContent = handState.indexTip ? Math.round(handState.indexTip.y) : "--";
  els.speedText.textContent = Math.round(wand.speed);
  els.fpsText.textContent = handState.fps;
  els.learnTipText.textContent = handState.normalizedTip
    ? `x ${handState.normalizedTip.x.toFixed(2)}, y ${handState.normalizedTip.y.toFixed(2)}`
    : "--";
  els.learnSpeedText.textContent = Math.round(wand.speed);
}

function chargeStatus(charge) {
  if (charge > 0.86) return "ELECTRICAL ARCS FORMING";
  if (charge > 0.65) return "ENERGY RING STABLE";
  if (charge > 0.4) return "PARTICLES SPIRALING IN";
  return "WAND TIP GLOWING";
}

function readableError(error) {
  const text = String(error?.message || error || "");
  if (text.includes("Permission")) return "Camera permission was denied. Allow camera access and try again.";
  if (text.includes("Requested device not found") || text.includes("NotFound")) return "No webcam was found.";
  if (text.includes("WebGL")) return "WebGL is unavailable in this browser.";
  return "The camera or MediaPipe model could not start. Try localhost or a modern browser.";
}

function toggleLearning(show) {
  app.paused = show;
  els.learningOverlay.hidden = !show;
}

function toggleDebug() {
  app.debug = !app.debug;
  handTracking.debugVisible = app.debug;
  els.debugHud.hidden = !app.debug;
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch (error) {
    els.statusText.textContent = "FULLSCREEN WAS BLOCKED";
  }
}

window.addEventListener("resize", resize);
window.addEventListener("beforeunload", () => handTracking.stop());
els.startButton.addEventListener("click", start);
els.learnButton.addEventListener("click", () => toggleLearning(true));
els.backToMagicButton.addEventListener("click", () => toggleLearning(false));
els.debugButton.addEventListener("click", toggleDebug);
els.fullscreenButton.addEventListener("click", toggleFullscreen);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") toggleDebug();
});

resize();
els.debugHud.hidden = true;
requestAnimationFrame(update);
