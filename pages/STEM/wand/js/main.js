import { HandDirectionTracker } from "./handTracking.js";
import { MazeGame } from "./game.js";
import { GameAudio } from "./audio.js";

const els = {
  startButton: document.getElementById("startButton"),
  cameraToggle: document.getElementById("cameraToggle"),
  visionToggle: document.getElementById("visionToggle"),
  pauseButton: document.getElementById("pauseButton"),
  soundButton: document.getElementById("soundButton"),
  restartButton: document.getElementById("restartButton"),
  learnToggle: document.getElementById("learnToggle"),
  backButton: document.getElementById("backButton"),
  learnPanel: document.getElementById("learnPanel"),
  statusText: document.getElementById("statusText"),
  effectCanvas: document.getElementById("effectCanvas"),
  video: document.getElementById("cameraVideo"),
  landmarkCanvas: document.getElementById("landmarkCanvas"),
  cameraPanel: document.getElementById("cameraPanel"),
  directionText: document.getElementById("directionText"),
  directionName: document.getElementById("directionName"),
  trackingText: document.getElementById("trackingText"),
  stabilityText: document.getElementById("stabilityText"),
  scoreText: document.getElementById("scoreText"),
  levelText: document.getElementById("levelText"),
  stateText: document.getElementById("stateText"),
  livesText: document.getElementById("livesText"),
  energyText: document.getElementById("energyText"),
  dotsText: document.getElementById("dotsText"),
  highScoreText: document.getElementById("highScoreText"),
  vectorText: document.getElementById("vectorText"),
  angleText: document.getElementById("angleText"),
  candidateText: document.getElementById("candidateText"),
  acceptedText: document.getElementById("acceptedText"),
  fpsText: document.getElementById("fpsText")
};

const tracker = new HandDirectionTracker({
  video: els.video,
  canvas: els.landmarkCanvas
});

const ctx = els.effectCanvas.getContext("2d");
const mazeGame = new MazeGame();
const audio = new GameAudio();
let started = false;
let gameActive = false;
let lastState = tracker.emptyState();
let particles = [];
let pulse = 0;
let lastFrameTime = performance.now();

function resizeCanvas() {
  const rect = els.effectCanvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  els.effectCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
  els.effectCanvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

async function startCamera() {
  try {
    els.startButton.disabled = true;
    els.startButton.textContent = "LOADING...";
    els.statusText.textContent = "Loading MediaPipe and requesting camera permission...";
    audio.init();
    await tracker.initCamera();
    await tracker.initLandmarker();
    started = true;
    gameActive = true;
    mazeGame.start();
    els.startButton.textContent = "CAMERA ACTIVE";
    els.statusText.textContent = "Point your index finger left, right, up, or down.";
  } catch (error) {
    els.startButton.disabled = false;
    els.startButton.textContent = "START CAMERA";
    els.statusText.textContent = cameraError(error);
  }
}

function update() {
  const now = performance.now();
  const dt = Math.min((now - lastFrameTime) / 1000, 0.04);
  lastFrameTime = now;
  if (started) lastState = tracker.update();
  if (lastState.acceptedDirection !== "--") mazeGame.setRequestedDirection(lastState.acceptedDirection);
  if (gameActive) mazeGame.update(dt);
  handleGameEvents();
  updateUi(lastState);
  drawStage(lastState);
  requestAnimationFrame(update);
}

function updateUi(state) {
  els.directionText.textContent = state.arrow;
  els.directionName.textContent = state.acceptedDirection === "--" ? "WAITING" : state.acceptedDirection;
  els.trackingText.textContent = state.hasHand ? "ACTIVE" : "OFF";
  els.stabilityText.textContent = `${state.stability}%`;
  els.scoreText.textContent = mazeGame.score;
  els.levelText.textContent = `${mazeGame.levelNumber} · ${mazeGame.level.name}`;
  els.stateText.textContent = mazeGame.state;
  els.livesText.textContent = "●".repeat(Math.max(mazeGame.lives, 0)) || "none";
  els.energyText.textContent = `${mazeGame.energyTimer.toFixed(1)}s`;
  els.dotsText.textContent = mazeGame.remainingDots;
  els.highScoreText.textContent = mazeGame.highScore;
  els.vectorText.textContent = state.vector ? `${state.vector.x.toFixed(2)}, ${state.vector.y.toFixed(2)}` : "--";
  els.angleText.textContent = state.angle === null ? "--" : `${Math.round(state.angle)}°`;
  els.candidateText.textContent = state.candidateDirection;
  els.acceptedText.textContent = state.acceptedDirection;
  els.fpsText.textContent = state.fps;

  if (mazeGame.state === "PAUSED") {
    els.statusText.textContent = "Paused.";
  } else if (started && !state.hasHand) {
    els.statusText.textContent = "Show your hand to the camera.";
  } else if (mazeGame.state === "GAME_OVER") {
    els.statusText.textContent = "Game over. Press RESTART to try again.";
  } else if (mazeGame.state === "VICTORY") {
    els.statusText.textContent = "Victory. You cleared all five levels.";
  } else if (mazeGame.remainingDots <= 0) {
    els.statusText.textContent = "Level complete. Loading the next maze.";
  } else if (mazeGame.energyTimer > 0) {
    els.statusText.textContent = "Energy mode: touch the enemy for bonus points.";
  } else if (mazeGame.surgeActiveTimer > 0) {
    els.statusText.textContent = "AI SURGE: enemies are faster.";
  } else if (started) {
    els.statusText.textContent = "Point your index finger to buffer the next turn.";
  }
}

function drawStage(state) {
  const width = els.effectCanvas.clientWidth;
  const height = els.effectCanvas.clientHeight;
  pulse += 0.016;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#07122d");
  gradient.addColorStop(0.55, "#090d1d");
  gradient.addColorStop(1, "#050611");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const board = getBoardLayout(width, height);
  if (mazeGame.level.theme === "ai" || mazeGame.surgeActiveTimer > 0) drawAiPulse(width, height);
  drawMaze(board);
  drawStar(board);
  const player = mazeGame.getInterpolatedPlayer();
  drawPlayerGlyph(board.left + player.x * board.tile + board.tile / 2, board.top + player.y * board.tile + board.tile / 2, board.tile);
  drawEnemies(board);
  drawWallCaps(board);
  updateParticles(width, height, state);
  drawGameMessage(width, height);
  drawLevelComplete(width, height);
  drawGameOver(width, height);
  drawVictory(width, height);
}

function drawMaze(board) {
  ctx.save();
  ctx.translate(board.left, board.top);
  for (let y = 0; y < mazeGame.map.length; y++) {
    for (let x = 0; x < mazeGame.map[y].length; x++) {
      const tile = mazeGame.map[y][x];
      const px = x * board.tile;
      const py = y * board.tile;
      if (tile === "#") {
        ctx.fillStyle = mazeGame.level.theme === "ai" ? "#122054" : "#112a68";
        ctx.shadowColor = mazeGame.surgeActiveTimer > 0 ? "#ff5577" : "#2be7ff";
        ctx.shadowBlur = mazeGame.surgeActiveTimer > 0 ? 18 : 10;
        roundRect(px + 2, py + 2, board.tile - 4, board.tile - 4, 7);
        ctx.fill();
      } else {
        ctx.shadowBlur = 0;
        if (tile === "." || tile === "o") drawDot(px + board.tile / 2, py + board.tile / 2, tile === "o", board.tile);
      }
    }
  }
  ctx.restore();
}

function drawStar(board) {
  if (!mazeGame.star) return;
  const x = board.left + mazeGame.star.x * board.tile + board.tile / 2;
  const y = board.top + mazeGame.star.y * board.tile + board.tile / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(pulse * 2.2);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ffe44d";
  ctx.shadowBlur = 22;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? board.tile * 0.18 : board.tile * 0.36;
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDot(x, y, big, tile) {
  ctx.fillStyle = big ? "#77f7ff" : "#ffeeb0";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = big ? 16 : 8;
  ctx.beginPath();
  ctx.arc(x, y, big ? tile * 0.2 : tile * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayerGlyph(x, y, tile) {
  const mouth = Math.abs(Math.sin(pulse * 7)) * 0.35 + 0.18;
  const angle = directionAngle(mazeGame.player.facingDirection || mazeGame.currentDirection);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = "#ffe44d";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#ffe44d";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, tile * 0.32, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#151515";
  ctx.beginPath();
  ctx.arc(tile * 0.12, -tile * 0.18, Math.max(3, tile * 0.05), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWallCaps(board) {
  ctx.save();
  ctx.translate(board.left, board.top);
  ctx.shadowColor = mazeGame.surgeActiveTimer > 0 ? "#ff5577" : "#2be7ff";
  ctx.shadowBlur = mazeGame.surgeActiveTimer > 0 ? 18 : 10;
  ctx.fillStyle = mazeGame.level.theme === "ai" ? "#122054" : "#112a68";
  for (let y = 0; y < mazeGame.map.length; y++) {
    for (let x = 0; x < mazeGame.map[y].length; x++) {
      if (mazeGame.map[y][x] !== "#") continue;
      roundRect(x * board.tile + 2, y * board.tile + 2, board.tile - 4, board.tile - 4, 7);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawEnemies(board) {
  for (const enemy of mazeGame.enemies) {
    if (enemy.defeatedTimer > 0) continue;
    const pos = mazeGame.getInterpolatedEnemy(enemy);
    const x = board.left + pos.x * board.tile + board.tile / 2;
    const y = board.top + pos.y * board.tile + board.tile / 2;
    drawEnemyGlyph(x, y, enemy, board.tile);
  }
}

function drawEnemyGlyph(x, y, enemy, tile) {
  const vulnerable = mazeGame.energyTimer > 0;
  ctx.save();
  ctx.translate(x, y + Math.sin(pulse * 8) * 2);
  ctx.shadowColor = vulnerable ? "#77f7ff" : enemy.color;
  ctx.shadowBlur = 20;
  ctx.fillStyle = vulnerable ? "#315cfa" : enemy.color;
  const r = tile * 0.34;
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, r, Math.PI, 0);
  ctx.lineTo(r, r * 0.55);
  for (let i = 2; i >= -2; i--) {
    ctx.lineTo(i * r * 0.25, r * (i % 2 ? 0.25 : 0.55));
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.12, r * 0.18, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.12, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#12121a";
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.36, -r * 0.1, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAiPulse(width, height) {
  if (mazeGame.surgeActiveTimer <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.16 + Math.sin(pulse * 14) * 0.05;
  ctx.fillStyle = "#ff335f";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function updateParticles(width, height, state) {
  if (state.hasHand && state.acceptedDirection !== "--" && Math.random() < 0.35) {
    particles.push({
      x: width / 2,
      y: height / 2,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      age: 0,
      life: 0.55,
      color: "#ffe44d"
    });
  }

  for (const particle of particles) {
    particle.age += 0.016;
    particle.x += particle.vx * 0.016;
    particle.y += particle.vy * 0.016;
    const alpha = 1 - particle.age / particle.life;
    const color = particle.color || "#ffe44d";
    ctx.fillStyle = hexToRgba(color, Math.max(alpha, 0));
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3 + alpha * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  particles = particles.filter((particle) => particle.age < particle.life);
}

function directionAngle(direction) {
  if (direction === "RIGHT") return 0;
  if (direction === "DOWN") return Math.PI / 2;
  if (direction === "LEFT") return Math.PI;
  if (direction === "UP") return -Math.PI / 2;
  return 0;
}

function cameraError(error) {
  const message = String(error?.message || error || "");
  if (message.includes("Permission") || message.includes("denied")) {
    return "CAMERA ACCESS REQUIRED. Allow camera access so MediaPipe can track your hand.";
  }
  return "Camera or MediaPipe could not start. Open from localhost/HTTPS in Chrome and try again.";
}

function setDirectionFromKeyboard(direction) {
  lastState = {
    ...lastState,
      hasHand: false,
      acceptedDirection: direction,
      candidateDirection: direction,
    arrow: { LEFT: "←", RIGHT: "→", UP: "↑", DOWN: "↓" }[direction],
      stability: 100
  };
  mazeGame.setRequestedDirection(direction);
  mazeGame.start();
  gameActive = true;
}

function getBoardLayout(width, height) {
  const cols = mazeGame.map[0].length;
  const rows = mazeGame.map.length;
  const tile = Math.floor(Math.min((width - 44) / cols, (height - 44) / rows));
  return {
    tile,
    left: (width - cols * tile) / 2,
    top: (height - rows * tile) / 2
  };
}

function drawLevelComplete(width, height) {
  if (mazeGame.state !== "LEVEL_COMPLETE") return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.52)";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe44d";
  ctx.shadowColor = "#ffe44d";
  ctx.shadowBlur = 24;
  ctx.font = "900 56px system-ui, sans-serif";
  ctx.fillText("LEVEL COMPLETE", width / 2, height / 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.font = "700 20px system-ui, sans-serif";
  ctx.fillText("Loading the next maze...", width / 2, height / 2 + 42);
  ctx.restore();
}

function drawVictory(width, height) {
  if (mazeGame.state !== "VICTORY") return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.58)";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#77f7ff";
  ctx.shadowColor = "#77f7ff";
  ctx.shadowBlur = 28;
  ctx.font = "900 64px system-ui, sans-serif";
  ctx.fillText("VICTORY", width / 2, height / 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "700 22px system-ui, sans-serif";
  ctx.fillText("All five levels cleared.", width / 2, height / 2 + 44);
  ctx.restore();
}

function handleGameEvents() {
  for (const event of mazeGame.consumeEvents()) {
    audio.play(event.type);
    if (["energy", "enemyDefeated", "star", "levelComplete", "victory"].includes(event.type)) {
      burstAtEvent(event);
    }
  }
}

function burstAtEvent(event) {
  const board = getBoardLayout(els.effectCanvas.clientWidth, els.effectCanvas.clientHeight);
  const x = board.left + (event.x ?? mazeGame.player.x) * board.tile + board.tile / 2;
  const y = board.top + (event.y ?? mazeGame.player.y) * board.tile + board.tile / 2;
  const color = event.type === "star" ? "#ffffff" : event.type === "enemyDefeated" ? "#77f7ff" : "#ffe44d";
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (80 + Math.random() * 190),
      vy: Math.sin(angle) * (80 + Math.random() * 190),
      age: 0,
      life: 0.7,
      color
    });
  }
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawGameMessage(width, height) {
  if (!mazeGame.message || mazeGame.messageTimer <= 0) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = mazeGame.energyTimer > 0 ? "#77f7ff" : "#ffe44d";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 22;
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.fillText(mazeGame.message, width / 2, 64);
  ctx.restore();
}

function drawGameOver(width, height) {
  if (mazeGame.state !== "GAME_OVER") return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.62)";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff5577";
  ctx.shadowColor = "#ff5577";
  ctx.shadowBlur = 25;
  ctx.font = "900 64px system-ui, sans-serif";
  ctx.fillText("GAME OVER", width / 2, height / 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.font = "700 20px system-ui, sans-serif";
  ctx.fillText("Press RESTART to play again.", width / 2, height / 2 + 42);
  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

window.addEventListener("resize", resizeCanvas);
els.startButton.addEventListener("click", startCamera);
els.restartButton.addEventListener("click", () => {
  mazeGame.restartGame();
  gameActive = true;
  lastState = tracker.emptyState();
  els.statusText.textContent = "Restarted. Point your index finger to move.";
});
els.pauseButton.addEventListener("click", () => {
  mazeGame.togglePause();
  els.pauseButton.textContent = mazeGame.state === "PAUSED" ? "RESUME" : "PAUSE";
});
els.soundButton.addEventListener("click", () => {
  audio.init();
  const enabled = audio.toggle();
  els.soundButton.setAttribute("aria-pressed", String(enabled));
  els.soundButton.textContent = enabled ? "SOUND ON" : "SOUND OFF";
});
els.cameraToggle.addEventListener("click", () => {
  const hidden = !els.cameraPanel.hidden;
  els.cameraPanel.hidden = hidden;
  els.cameraToggle.setAttribute("aria-pressed", String(!hidden));
  els.cameraToggle.textContent = hidden ? "CAMERA VIEW OFF" : "CAMERA VIEW ON";
});
els.visionToggle.addEventListener("click", () => {
  tracker.showVision = !tracker.showVision;
  els.visionToggle.setAttribute("aria-pressed", String(tracker.showVision));
  els.visionToggle.textContent = tracker.showVision ? "SHOW AI VISION" : "AI VISION OFF";
});
els.learnToggle.addEventListener("click", () => {
  els.learnPanel.hidden = false;
});
els.backButton.addEventListener("click", () => {
  els.learnPanel.hidden = true;
});

window.addEventListener("keydown", (event) => {
  const map = {
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    ArrowUp: "UP",
    ArrowDown: "DOWN"
  };
  if (map[event.key]) setDirectionFromKeyboard(map[event.key]);
});

resizeCanvas();
requestAnimationFrame(update);
