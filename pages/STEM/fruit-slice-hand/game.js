import { FruitHandTracker } from "./handTracking.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const video = document.getElementById("cameraVideo");
const overlay = document.getElementById("handOverlay");
const startButton = document.getElementById("startButton");
const statusText = document.getElementById("statusText");
const scoreText = document.getElementById("scoreText");
const comboText = document.getElementById("comboText");
const missText = document.getElementById("missText");
const debugPanel = document.getElementById("debugPanel");

const debug = {
  hand: document.getElementById("debugHand"),
  tip: document.getElementById("debugTip"),
  gesture: document.getElementById("debugGesture"),
  speed: document.getElementById("debugSpeed"),
  fruit: document.getElementById("debugFruit")
};

const tracker = new FruitHandTracker({
  video,
  overlay,
  gestureText: document.getElementById("gestureText"),
  fpsText: document.getElementById("fpsText")
});

const sprites = new Image();
sprites.src = "../assets/fruit-sprites/fruits.png";

const FRUIT_TILES = [
  { name: "apple", sx: 0, sy: 0 },
  { name: "pear", sx: 32, sy: 0 },
  { name: "lemon", sx: 64, sy: 0 },
  { name: "orange", sx: 96, sy: 0 },
  { name: "grapes", sx: 0, sy: 64 },
  { name: "cherry", sx: 32, sy: 64 },
  { name: "peach", sx: 64, sy: 64 },
  { name: "watermelon", sx: 0, sy: 128 },
  { name: "melon", sx: 64, sy: 128 },
  { name: "pineapple", sx: 0, sy: 160 },
  { name: "banana", sx: 64, sy: 160 }
];

const game = {
  width: 1280,
  height: 720,
  started: false,
  lastTime: performance.now(),
  fruits: [],
  splashes: [],
  bladeTrail: [],
  score: 0,
  combo: 0,
  misses: 0,
  spawnTimer: 0,
  bombTimer: 3.2,
  gameOver: false,
  explosionFlash: 0,
  audio: null,
  mouseDown: false,
  mouseTip: null,
  mousePrevious: null,
  debugVisible: true
};

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  game.width = window.innerWidth;
  game.height = window.innerHeight;
  canvas.width = Math.floor(game.width * ratio);
  canvas.height = Math.floor(game.height * ratio);
  canvas.style.width = `${game.width}px`;
  canvas.style.height = `${game.height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function initAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  game.audio = { context: new AudioContext() };
}

function tone(freq, duration, type = "sine", gain = 0.06, delay = 0) {
  if (!game.audio) return;
  const { context } = game.audio;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, context.currentTime + delay);
  oscillator.frequency.exponentialRampToValueAtTime(freq * 1.25, context.currentTime + delay + duration);
  volume.gain.setValueAtTime(0.001, context.currentTime + delay);
  volume.gain.linearRampToValueAtTime(gain, context.currentTime + delay + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(context.currentTime + delay);
  oscillator.stop(context.currentTime + delay + duration + 0.03);
}

function playSliceSound() {
  tone(760, 0.07, "triangle", 0.045, 0);
  tone(1120, 0.09, "sine", 0.03, 0.035);
}

function playMissSound() {
  tone(130, 0.1, "sawtooth", 0.025, 0);
}

function playBombSound() {
  tone(85, 0.22, "sawtooth", 0.09, 0);
  tone(48, 0.36, "square", 0.08, 0.06);
  tone(310, 0.11, "triangle", 0.05, 0.18);
}

async function startGame() {
  if (game.started && game.gameOver) {
    resetRound();
    return;
  }

  try {
    startButton.disabled = true;
    startButton.textContent = "Starting...";
    statusText.textContent = "Loading camera and MediaPipe...";
    initAudio();
    await tracker.initCamera();
    await tracker.initHandTracking();
    game.started = true;
    resetRound();
    startButton.textContent = "Game Active";
    statusText.textContent = "Slice with one raised index finger.";
  } catch (error) {
    startButton.disabled = false;
    startButton.textContent = "Start Game";
    statusText.textContent = "Camera blocked. Open from localhost/HTTPS and allow camera permission.";
  }
}

function spawnFruit() {
  const tile = FRUIT_TILES[Math.floor(Math.random() * FRUIT_TILES.length)];
  const size = 66 + Math.random() * 28;
  game.fruits.push({
    type: "fruit",
    tile,
    x: game.width * (0.18 + Math.random() * 0.64),
    y: game.height + size,
    vx: -120 + Math.random() * 240,
    vy: -780 - Math.random() * 260,
    gravity: 980,
    rotation: Math.random() * Math.PI * 2,
    spin: -4 + Math.random() * 8,
    size,
    sliced: false
  });
}

function spawnBomb() {
  const size = 72 + Math.random() * 20;
  game.fruits.push({
    type: "bomb",
    x: game.width * (0.18 + Math.random() * 0.64),
    y: game.height + size,
    vx: -160 + Math.random() * 320,
    vy: -850 - Math.random() * 260,
    gravity: 980,
    rotation: Math.random() * Math.PI * 2,
    spin: -5 + Math.random() * 10,
    size,
    sliced: false,
    fuse: Math.random() * Math.PI * 2
  });
}

function resetRound() {
  game.fruits = [];
  game.splashes = [];
  game.bladeTrail = [];
  game.score = 0;
  game.combo = 0;
  game.misses = 0;
  game.spawnTimer = 0.2;
  game.bombTimer = randomBombInterval();
  game.gameOver = false;
  game.explosionFlash = 0;
  startButton.disabled = true;
  startButton.textContent = "Game Active";
  statusText.textContent = "Slice fruit. Avoid bombs.";
  updateScore();
}

function getPointer(handState) {
  if (handState.isSliceGesture && handState.indexTip) {
    return {
      active: true,
      tip: handState.indexTip,
      previous: handState.previousTip,
      speed: handState.speed
    };
  }
  if (game.mouseDown && game.mouseTip) {
    return {
      active: true,
      tip: game.mouseTip,
      previous: game.mousePrevious,
      speed: game.mousePrevious ? distance(game.mouseTip, game.mousePrevious) * 60 : 0
    };
  }
  return { active: false, tip: null, previous: null, speed: 0 };
}

function update(dt, handState) {
  if (!game.gameOver) {
    game.spawnTimer -= dt;
    game.bombTimer -= dt;
  }

  if (!game.gameOver && game.spawnTimer <= 0 && game.fruits.length < 8) {
    spawnFruit();
    game.spawnTimer = 0.45 + Math.random() * 0.35;
  }

  if (!game.gameOver && game.bombTimer <= 0 && game.fruits.filter((fruit) => fruit.type === "bomb").length < 2) {
    spawnBomb();
    game.bombTimer = randomBombInterval();
  }

  const pointer = getPointer(handState);
  if (pointer.active && pointer.tip) {
    game.bladeTrail.push({ x: pointer.tip.x, y: pointer.tip.y, age: 0, life: 0.22 });
    if (game.bladeTrail.length > 18) game.bladeTrail.shift();
    if (!game.gameOver) checkSlices(pointer);
  }

  for (const fruit of game.fruits) {
    fruit.x += fruit.vx * dt;
    fruit.y += fruit.vy * dt;
    fruit.vy += fruit.gravity * dt;
    fruit.rotation += fruit.spin * dt;
  }

  const missed = game.fruits.filter((fruit) => (
    fruit.type === "fruit" &&
    !fruit.sliced &&
    fruit.y >= game.height + 140
  )).length;
  game.fruits = game.fruits.filter((fruit) => fruit.y < game.height + 140 && !fruit.sliced);
  if (missed > 0) {
    if (!game.gameOver) {
      game.combo = 0;
      game.misses += missed;
      playMissSound();
    }
  }

  for (const splash of game.splashes) {
    splash.age += dt;
    splash.x += splash.vx * dt;
    splash.y += splash.vy * dt;
    splash.vy += 600 * dt;
    splash.rotation += splash.spin * dt;
  }
  game.splashes = game.splashes.filter((splash) => splash.age < splash.life);

  for (const point of game.bladeTrail) point.age += dt;
  game.bladeTrail = game.bladeTrail.filter((point) => point.age < point.life);
  game.explosionFlash += (0 - game.explosionFlash) * 0.08;

  updateScore();
  updateDebug(handState, pointer);
}

function checkSlices(pointer) {
  if (!pointer.previous || pointer.speed < 420) return;
  for (const fruit of game.fruits) {
    if (fruit.sliced) continue;
    const dist = distanceToSegment({ x: fruit.x, y: fruit.y }, pointer.previous, pointer.tip);
    if (dist < fruit.size * 0.55) {
      if (fruit.type === "bomb") {
        triggerGameOver(fruit);
        return;
      }
      fruit.sliced = true;
      game.score += 10 + game.combo * 2;
      game.combo += 1;
      createSliceBurst(fruit);
      playSliceSound();
    }
  }
}

function triggerGameOver(bomb) {
  bomb.sliced = true;
  game.gameOver = true;
  game.combo = 0;
  game.explosionFlash = 1;
  createBombExplosion(bomb);
  playBombSound();
  statusText.textContent = "GAME OVER - you sliced a bomb.";
  startButton.disabled = false;
  startButton.textContent = "Restart Game";
}

function createSliceBurst(fruit) {
  const colors = ["#ff3b43", "#ffef7a", "#8dff69", "#ff9d2e", "#a457ff"];
  for (let i = 0; i < 34; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 360;
    game.splashes.push({
      x: fruit.x,
      y: fruit.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 160,
      size: 3 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: -6 + Math.random() * 12,
      age: 0,
      life: 0.55 + Math.random() * 0.42
    });
  }

  for (const side of [-1, 1]) {
    game.splashes.push({
      x: fruit.x + side * 12,
      y: fruit.y,
      vx: side * (120 + Math.random() * 90),
      vy: -180 - Math.random() * 80,
      size: fruit.size * 0.42,
      color: "#ffe06b",
      rotation: fruit.rotation,
      spin: side * 5,
      age: 0,
      life: 0.9,
      half: true
    });
  }
}

function createBombExplosion(bomb) {
  const colors = ["#ffef7a", "#ff7a2e", "#ff3131", "#2b2b2b", "#f6f6f6"];
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 150 + Math.random() * 620;
    game.splashes.push({
      x: bomb.x,
      y: bomb.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 120,
      size: 4 + Math.random() * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: -10 + Math.random() * 20,
      age: 0,
      life: 0.9 + Math.random() * 0.75,
      smoke: Math.random() > 0.58
    });
  }
}

function draw() {
  drawBackground();
  drawFruit();
  drawSplashes();
  drawBladeTrail();
  drawCenterInstruction();
  drawGameOver();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, game.height);
  sky.addColorStop(0, "#151f37");
  sky.addColorStop(0.58, "#090a12");
  sky.addColorStop(1, "#030304");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, game.width, game.height);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#7ad5ff";
  for (let x = -80; x < game.width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(game.width * 0.5 + (x - game.width * 0.5) * 0.3, game.height);
    ctx.stroke();
  }
  for (let y = 80; y < game.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(game.width, y);
    ctx.stroke();
  }
  ctx.restore();

  const glow = ctx.createRadialGradient(game.width * 0.5, game.height * 0.65, 20, game.width * 0.5, game.height * 0.65, game.width * 0.45);
  glow.addColorStop(0, "rgba(255, 165, 51, .22)");
  glow.addColorStop(1, "rgba(255, 165, 51, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, game.width, game.height);
}

function drawFruit() {
  for (const fruit of game.fruits) {
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.rotate(fruit.rotation);
    if (fruit.type === "bomb") {
      drawBomb(fruit);
    } else {
      ctx.shadowColor = "rgba(255, 231, 124, .55)";
      ctx.shadowBlur = 18;
      ctx.drawImage(sprites, fruit.tile.sx, fruit.tile.sy, 32, 32, -fruit.size / 2, -fruit.size / 2, fruit.size, fruit.size);
    }
    ctx.restore();
  }
}

function drawBomb(bomb) {
  const radius = bomb.size * 0.38;
  ctx.shadowColor = "rgba(255, 72, 40, .75)";
  ctx.shadowBlur = 24;
  const body = ctx.createRadialGradient(-radius * 0.3, -radius * 0.42, 4, 0, 0, radius);
  body.addColorStop(0, "#747b8a");
  body.addColorStop(0.42, "#252936");
  body.addColorStop(1, "#050506");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#a9b0bf";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#2b2e36";
  ctx.fillRect(-radius * 0.2, -radius - 10, radius * 0.4, 13);
  ctx.strokeStyle = "#f2c15b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -radius - 8);
  ctx.quadraticCurveTo(18, -radius - 28, 30, -radius - 18);
  ctx.stroke();

  const flicker = 0.7 + Math.sin(performance.now() * 0.016 + bomb.fuse) * 0.3;
  ctx.fillStyle = `rgba(255, ${Math.round(150 + flicker * 80)}, 38, ${0.82 + flicker * 0.18})`;
  ctx.shadowColor = "#ffd950";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(32, -radius - 22);
  ctx.lineTo(43, -radius - 8);
  ctx.lineTo(27, -radius - 10);
  ctx.closePath();
  ctx.fill();
}

function drawSplashes() {
  for (const splash of game.splashes) {
    const alpha = 1 - splash.age / splash.life;
    ctx.save();
    ctx.globalAlpha = Math.max(alpha, 0);
    ctx.translate(splash.x, splash.y);
    ctx.rotate(splash.rotation);
    ctx.fillStyle = splash.color;
    ctx.shadowColor = splash.color;
    ctx.shadowBlur = splash.smoke ? 4 : 12;
    if (splash.smoke) ctx.globalAlpha *= 0.65;
    if (splash.half) {
      ctx.beginPath();
      ctx.arc(0, 0, splash.size, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(0, -splash.size);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, splash.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBladeTrail() {
  if (game.bladeTrail.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 1; i < game.bladeTrail.length; i++) {
    const a = game.bladeTrail[i - 1];
    const b = game.bladeTrail[i];
    const alpha = 1 - b.age / b.life;
    ctx.strokeStyle = `rgba(139, 245, 255, ${alpha})`;
    ctx.lineWidth = 24 * alpha + 4;
    ctx.shadowColor = "#a8f8ff";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCenterInstruction() {
  if (game.started || game.score > 0 || game.gameOver) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = "700 24px system-ui, sans-serif";
  ctx.fillText("Click START GAME, then slice fruit with one index finger.", game.width / 2, game.height * 0.52);
  ctx.restore();
}

function drawGameOver() {
  if (game.explosionFlash > 0.02) {
    ctx.save();
    ctx.globalAlpha = game.explosionFlash * 0.55;
    ctx.fillStyle = "#ffef9b";
    ctx.fillRect(0, 0, game.width, game.height);
    ctx.restore();
  }

  if (!game.gameOver) return;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, .58)";
  ctx.fillRect(0, 0, game.width, game.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff5bd";
  ctx.shadowColor = "#ff542e";
  ctx.shadowBlur = 28;
  ctx.font = "900 72px system-ui, sans-serif";
  ctx.fillText("GAME OVER", game.width / 2, game.height * 0.46);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "700 24px system-ui, sans-serif";
  ctx.fillText("You sliced a bomb. Press Restart Game to try again.", game.width / 2, game.height * 0.54);
  ctx.restore();
}

function updateScore() {
  scoreText.textContent = game.score;
  comboText.textContent = game.combo;
  missText.textContent = game.misses;
}

function updateDebug(handState, pointer) {
  debug.hand.textContent = handState.hasHand;
  debug.tip.textContent = pointer.tip ? `${Math.round(pointer.tip.x)}, ${Math.round(pointer.tip.y)}` : "none";
  debug.gesture.textContent = pointer.active;
  debug.speed.textContent = Math.round(pointer.speed);
  debug.fruit.textContent = game.fruits.length;
}

function randomBombInterval() {
  return 2.8 + Math.random() * 3.8;
}

function loop(now) {
  const dt = Math.min((now - game.lastTime) / 1000, 0.033);
  game.lastTime = now;
  const handState = tracker.update(game.width, game.height);
  if (game.started) update(dt, handState);
  draw();
  requestAnimationFrame(loop);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(point, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const lengthSq = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lengthSq));
  return Math.hypot(point.x - (a.x + abx * t), point.y - (a.y + aby * t));
}

window.addEventListener("resize", resizeCanvas);
startButton.addEventListener("click", startGame);

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") {
    game.debugVisible = !game.debugVisible;
    debugPanel.hidden = !game.debugVisible;
  }
});

canvas.addEventListener("pointerdown", (event) => {
  game.mouseDown = true;
  game.mouseTip = { x: event.clientX, y: event.clientY };
  game.mousePrevious = null;
});

canvas.addEventListener("pointermove", (event) => {
  if (!game.mouseDown) return;
  game.mousePrevious = game.mouseTip;
  game.mouseTip = { x: event.clientX, y: event.clientY };
});

window.addEventListener("pointerup", () => {
  game.mouseDown = false;
  game.mousePrevious = null;
});

resizeCanvas();
requestAnimationFrame(loop);
