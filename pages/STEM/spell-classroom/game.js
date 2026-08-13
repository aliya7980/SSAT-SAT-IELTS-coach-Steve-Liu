import { HandTrackingController, initCamera, initHandTracking } from "./handTracking.js";

const STATES = {
  IDLE: "IDLE",
  TARGETING: "TARGETING",
  SPELL_HIT: "SPELL_HIT",
  PANIC: "PANIC"
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("cameraVideo");
const overlay = document.getElementById("handOverlay");
const startButton = document.getElementById("startButton");
const statusEl = document.getElementById("gameStatus");
const debugPanel = document.getElementById("debugPanel");
const debug = {
  hand: document.getElementById("debugHand"),
  tip: document.getElementById("debugTip"),
  fingers: document.getElementById("debugFingers"),
  gesture: document.getElementById("debugGesture"),
  state: document.getElementById("debugState"),
  collision: document.getElementById("debugCollision")
};

const hand = new HandTrackingController({
  video,
  overlay,
  gestureBadge: document.getElementById("gestureBadge"),
  fpsBadge: document.getElementById("fpsBadge")
});

const game = {
  state: STATES.IDLE,
  width: 1280,
  height: 720,
  started: false,
  lastTime: performance.now(),
  spellCooldownUntil: 0,
  stateStartedAt: performance.now(),
  particles: [],
  magicTrail: [],
  shake: 0,
  flash: 0,
  collision: false,
  debugVisible: true,
  audio: null,
  dudley: {
    x: 900,
    y: 505,
    w: 180,
    h: 330,
    blinkTimer: 0,
    blink: false,
    look: 0,
    jump: 0,
    shake: 0,
    trouserDrop: 0
  }
};

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  game.width = width;
  game.height = height;
  game.dudley.x = width * 0.72;
  game.dudley.y = height * 0.72;
}

function setGameState(nextState) {
  game.state = nextState;
  game.stateStartedAt = performance.now();
}

function initAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  game.audio = { context };
}

function tone(freq, duration, type = "sine", gain = 0.08, delay = 0) {
  if (!game.audio) return;
  const { context } = game.audio;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, context.currentTime + delay);
  oscillator.frequency.exponentialRampToValueAtTime(freq * 1.8, context.currentTime + delay + duration);
  volume.gain.setValueAtTime(0, context.currentTime + delay);
  volume.gain.linearRampToValueAtTime(gain, context.currentTime + delay + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(context.currentTime + delay);
  oscillator.stop(context.currentTime + delay + duration + 0.03);
}

function playSpellSound() {
  tone(520, 0.18, "triangle", 0.09, 0);
  tone(860, 0.16, "sine", 0.07, 0.05);
}

function playImpactSound() {
  tone(110, 0.18, "sawtooth", 0.09, 0);
  tone(980, 0.28, "triangle", 0.08, 0.03);
}

function playPanicSound() {
  tone(340, 0.09, "square", 0.045, 0);
  tone(290, 0.09, "square", 0.04, 0.12);
  tone(260, 0.09, "square", 0.035, 0.24);
}

function playSuccessSound() {
  tone(720, 0.12, "sine", 0.04, 0);
  tone(980, 0.16, "triangle", 0.035, 0.12);
}

async function startGame() {
  try {
    startButton.disabled = true;
    startButton.textContent = "Starting...";
    statusEl.textContent = "Loading MediaPipe and requesting camera...";
    initAudio();
    await initCamera(hand);
    await initHandTracking(hand);
    game.started = true;
    startButton.textContent = "Game Active";
    statusEl.textContent = "Point one index finger at Dudley to cast.";
  } catch (error) {
    startButton.disabled = false;
    startButton.textContent = "Start Game";
    statusEl.textContent = "Camera blocked. Open this page from localhost/HTTPS and allow camera permission.";
  }
}

function updateFingerPosition(handState) {
  if (!handState.indexTip) return;
  game.magicTrail.push({
    x: handState.indexTip.x,
    y: handState.indexTip.y,
    age: 0,
    life: 0.48
  });
  if (game.magicTrail.length > 34) game.magicTrail.shift();
}

function getDudleyHitbox() {
  const d = game.dudley;
  return {
    x: d.x - d.w * 0.48,
    y: d.y - d.h * 0.98,
    w: d.w * 0.96,
    h: d.h * 0.95
  };
}

function checkSpellCollision(tip) {
  if (!tip) return false;
  const box = getDudleyHitbox();
  return tip.x >= box.x && tip.x <= box.x + box.w && tip.y >= box.y && tip.y <= box.y + box.h;
}

function castSpell(tip) {
  game.spellCooldownUntil = performance.now() + 1200;
  game.flash = 1;
  game.shake = 18;
  setGameState(STATES.SPELL_HIT);
  playSpellSound();
  playImpactSound();
  spawnSpellParticles(tip || { x: game.dudley.x, y: game.dudley.y - 170 });
  statusEl.textContent = "SPELL HIT!";
}

function spawnSpellParticles(origin) {
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 430;
    game.particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 5,
      age: 0,
      life: 0.55 + Math.random() * 0.55,
      color: Math.random() > 0.45 ? "#91e9ff" : "#ffe18c"
    });
  }
}

function updateGame(handState, dt) {
  const now = performance.now();
  game.collision = checkSpellCollision(handState.indexTip);

  if (handState.isPointing) {
    updateFingerPosition(handState);
  }

  if (game.state === STATES.IDLE && handState.isPointing) {
    setGameState(STATES.TARGETING);
  } else if (game.state === STATES.TARGETING && !handState.isPointing) {
    setGameState(STATES.IDLE);
  }

  if (
    handState.isPointing &&
    game.collision &&
    now > game.spellCooldownUntil &&
    (game.state === STATES.IDLE || game.state === STATES.TARGETING)
  ) {
    castSpell(handState.indexTip);
  }

  if (game.state === STATES.SPELL_HIT && now - game.stateStartedAt > 650) {
    setGameState(STATES.PANIC);
    playPanicSound();
  }

  if (game.state === STATES.PANIC && now - game.stateStartedAt > 3000) {
    setGameState(STATES.IDLE);
    playSuccessSound();
    statusEl.textContent = "Point one index finger at Dudley to cast.";
  }

  updateDudley(dt);
  updateParticles(dt);
  updateDebugPanel(handState);
}

function updateDudley(dt) {
  const d = game.dudley;
  d.blinkTimer -= dt;
  if (d.blinkTimer <= 0) {
    d.blink = !d.blink;
    d.blinkTimer = d.blink ? 0.12 : 2 + Math.random() * 2.4;
  }

  if (game.state === STATES.PANIC || game.state === STATES.SPELL_HIT) {
    const t = (performance.now() - game.stateStartedAt) / 1000;
    d.look = Math.sin(t * 10) * 1.2;
    d.jump = Math.abs(Math.sin(t * 9)) * 24;
    d.shake = Math.sin(t * 28) * 8;
    d.trouserDrop += (1 - d.trouserDrop) * 0.12;
  } else {
    d.look += (0 - d.look) * 0.06;
    d.jump += (0 - d.jump) * 0.08;
    d.shake += (0 - d.shake) * 0.1;
    d.trouserDrop += (0 - d.trouserDrop) * 0.04;
  }
}

function updateParticles(dt) {
  for (const particle of game.particles) {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.95;
    particle.vy = particle.vy * 0.95 + 160 * dt;
  }
  game.particles = game.particles.filter((particle) => particle.age < particle.life);

  for (const point of game.magicTrail) point.age += dt;
  game.magicTrail = game.magicTrail.filter((point) => point.age < point.life);

  game.flash += (0 - game.flash) * 0.08;
  game.shake += (0 - game.shake) * 0.12;
}

function draw() {
  const shakeX = (Math.random() - 0.5) * game.shake;
  const shakeY = (Math.random() - 0.5) * game.shake;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawClassroom();
  drawMagicTrail();
  drawDudley();
  drawParticles();
  if (game.collision && game.state === STATES.TARGETING) drawTargetLock();
  if (game.state === STATES.SPELL_HIT) drawSpellHitText();
  ctx.restore();

  if (game.flash > 0.02) {
    ctx.save();
    ctx.globalAlpha = game.flash * 0.42;
    ctx.fillStyle = "#e9fbff";
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.restore();
  }
}

function drawClassroom() {
  const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
  gradient.addColorStop(0, "#2a1c17");
  gradient.addColorStop(0.55, "#120d0d");
  gradient.addColorStop(1, "#070606");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, game.width, game.height);

  drawStoneWall();
  drawTorches();
  drawWindowGlow();
  drawFloor();
}

function drawStoneWall() {
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = "#5f5047";
  ctx.lineWidth = 1;
  const blockH = 54;
  const blockW = 118;
  for (let y = 80; y < game.height * 0.72; y += blockH) {
    const offset = Math.floor(y / blockH) % 2 ? blockW / 2 : 0;
    for (let x = -blockW; x < game.width + blockW; x += blockW) {
      ctx.strokeRect(x + offset, y, blockW, blockH);
    }
  }
  ctx.restore();
}

function drawTorches() {
  for (const x of [game.width * 0.18, game.width * 0.82]) {
    ctx.save();
    ctx.translate(x, game.height * 0.26);
    ctx.fillStyle = "#28170f";
    ctx.fillRect(-10, 30, 20, 60);
    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 120);
    glow.addColorStop(0, "rgba(255, 212, 112, 0.55)");
    glow.addColorStop(1, "rgba(255, 99, 32, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 8, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffce62";
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(26, 3, 0, 35);
    ctx.quadraticCurveTo(-23, 3, 0, -34);
    ctx.fill();
    ctx.fillStyle = "#ff7137";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(12, 6, 0, 24);
    ctx.quadraticCurveTo(-12, 6, 0, -18);
    ctx.fill();
    ctx.restore();
  }
}

function drawWindowGlow() {
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = "#182338";
  roundRect(game.width * 0.42, game.height * 0.15, game.width * 0.16, game.height * 0.28, 90);
  ctx.fill();
  ctx.strokeStyle = "rgba(220,230,255,0.22)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
}

function drawFloor() {
  const y = game.height * 0.72;
  ctx.fillStyle = "#1c1110";
  ctx.fillRect(0, y, game.width, game.height - y);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 12; i++) {
    const py = y + i * 42;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(game.width, py + i * 10);
    ctx.stroke();
  }
}

function drawDudley() {
  const d = game.dudley;
  const panic = game.state === STATES.PANIC || game.state === STATES.SPELL_HIT;
  const x = d.x + d.shake;
  const y = d.y - d.jump;
  const trouserDrop = d.trouserDrop;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 92, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLegs(trouserDrop);
  drawBody(panic);
  drawArms(panic);
  drawHead(panic);
  drawTrousers(trouserDrop);

  ctx.restore();
}

function drawLegs(drop) {
  ctx.fillStyle = "#f5c98e";
  roundRect(-42, -78 + drop * 34, 32, 110, 12);
  ctx.fill();
  roundRect(10, -78 + drop * 34, 32, 110, 12);
  ctx.fill();

  ctx.fillStyle = "#7bd3ff";
  roundRect(-56, -92 + drop * 20, 112, 50, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -88 + drop * 20);
  ctx.lineTo(0, -42 + drop * 20);
  ctx.stroke();
}

function drawBody(panic) {
  ctx.fillStyle = "#f7d16d";
  roundRect(-72, -250, 144, 150, 34);
  ctx.fill();
  ctx.fillStyle = panic ? "#ffefd0" : "#ffe08c";
  roundRect(-56, -238, 112, 118, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(73, 42, 18, 0.32)";
  ctx.lineWidth = 5;
  ctx.stroke();
}

function drawArms(panic) {
  ctx.strokeStyle = "#f0bd78";
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  if (panic) {
    ctx.beginPath();
    ctx.moveTo(-62, -205);
    ctx.quadraticCurveTo(-92, -155, -56, -100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(62, -205);
    ctx.quadraticCurveTo(92, -155, 56, -100);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-66, -210);
    ctx.quadraticCurveTo(-104, -166, -88, -116);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(66, -210);
    ctx.quadraticCurveTo(104, -166, 88, -116);
    ctx.stroke();
  }
}

function drawHead(panic) {
  ctx.fillStyle = "#f3c184";
  ctx.beginPath();
  ctx.ellipse(0, -306, 62, 64, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#8d5a2b";
  ctx.beginPath();
  ctx.ellipse(0, -358, 56, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  if (panic) {
    ctx.beginPath();
    ctx.ellipse(-24 + game.dudley.look * 4, -310, 13, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(24 + game.dudley.look * 4, -310, 13, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e1715";
    ctx.beginPath();
    ctx.arc(-24 + game.dudley.look * 8, -308, 5, 0, Math.PI * 2);
    ctx.arc(24 + game.dudley.look * 8, -308, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1e1715";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, -278, 18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (game.dudley.blink) {
    ctx.strokeStyle = "#1e1715";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-36, -308);
    ctx.lineTo(-16, -308);
    ctx.moveTo(16, -308);
    ctx.lineTo(36, -308);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -280, 16, 0.12, Math.PI - 0.12);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(-24, -310, 10, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(24, -310, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e1715";
    ctx.beginPath();
    ctx.arc(-24, -308, 4, 0, Math.PI * 2);
    ctx.arc(24, -308, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1e1715";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -282, 15, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }
}

function drawTrousers(drop) {
  const y = -112 + drop * 56;
  const width = 116 + drop * 42;
  const height = 118 + drop * 20;
  ctx.fillStyle = "#4d3428";
  roundRect(-width / 2, y, width, height, 18);
  ctx.fill();
  ctx.fillStyle = "#6b4836";
  roundRect(-width / 2 - 6, y - 12, width + 12, 24, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, y + 16);
  ctx.lineTo(0, y + height - 10);
  ctx.stroke();
}

function drawMagicTrail() {
  if (!game.magicTrail.length) return;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < game.magicTrail.length; i++) {
    const point = game.magicTrail[i];
    const alpha = Math.max(0, 1 - point.age / point.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#8eeaff";
    ctx.shadowColor = "#8eeaff";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7 + alpha * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  for (const p of game.particles) {
    const alpha = Math.max(0, 1 - p.age / p.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTargetLock() {
  const box = getDudleyHitbox();
  ctx.save();
  ctx.strokeStyle = "#8eeaff";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#8eeaff";
  ctx.shadowBlur = 18;
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawSpellHitText() {
  ctx.save();
  ctx.translate(game.width / 2, game.height * 0.42);
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#8eeaff";
  ctx.shadowBlur = 28;
  ctx.font = "900 72px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("SPELL HIT!", 0, 0);
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function updateDebugPanel(handState) {
  debug.hand.textContent = String(handState.detected);
  debug.tip.textContent = handState.indexTip ? `${Math.round(handState.indexTip.x)}, ${Math.round(handState.indexTip.y)}` : "none";
  debug.fingers.textContent = Object.entries(handState.fingerStates).map(([name, value]) => `${name}:${value ? "up" : "down"}`).join(" · ");
  debug.gesture.textContent = handState.gesture;
  debug.state.textContent = game.state;
  debug.collision.textContent = String(game.collision);
}

function loop(time) {
  const dt = Math.min((time - game.lastTime) / 1000, 0.04);
  game.lastTime = time;
  const handState = hand.update(game.width, game.height);
  updateGame(handState, dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") {
    game.debugVisible = !game.debugVisible;
    debugPanel.classList.toggle("hidden", !game.debugVisible);
  }
});
startButton.addEventListener("click", startGame);

resizeCanvas();
requestAnimationFrame(loop);
