export const DIRS = {
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 }
};

export const LEVELS = [
  {
    name: "Training Maze",
    theme: "classic",
    speed: 5.2,
    enemySpeed: 3.2,
    enemyCount: 1,
    energyDuration: 9,
    map: [
      "###################",
      "#........#........#",
      "#.###.##.#.##.###.#",
      "#o#.............#o#",
      "#.###.#.###.#.###.#",
      "#.....#..#..#.....#",
      "#####.##.#.##.#####",
      "#.................#",
      "#.###.#######.###.#",
      "#...#....P....#...#",
      "###.#.##.#.##.#.###",
      "#.....#..#..#.....#",
      "#.#####.###.#####.#",
      "#o...............o#",
      "###################"
    ]
  },
  {
    name: "Maze Runner",
    theme: "classic",
    speed: 5.7,
    enemySpeed: 3.8,
    enemyCount: 2,
    energyDuration: 8,
    map: [
      "###################",
      "#......#...#......#",
      "#.####.#.#.#.####.#",
      "#o.....#.#.#.....o#",
      "#####.##.#.##.#####",
      "#.....#.....#.....#",
      "#.###.#.###.#.###.#",
      "#...#.........#...#",
      "###.#.#######.#.###",
      "#.....#..P..#.....#",
      "#.#####.#.#.#####.#",
      "#.......#.#.......#",
      "#.###.###.###.###.#",
      "#.................#",
      "###################"
    ]
  },
  {
    name: "Ghost Hunt",
    theme: "classic",
    speed: 6.1,
    enemySpeed: 4.25,
    enemyCount: 3,
    energyDuration: 6.6,
    map: [
      "###################",
      "#....#.......#....#",
      "#.##.#.#####.#.##.#",
      "#o...............o#",
      "###.###.#.#.###.###",
      "#.....#.#.#.#.....#",
      "#.###.#.....#.###.#",
      "#...#...###...#...#",
      "###.#.###.###.#.###",
      "#.....#..P..#.....#",
      "#.#####.#.#.#####.#",
      "#.......#.#.......#",
      "#.###.###.###.###.#",
      "#.................#",
      "###################"
    ]
  },
  {
    name: "Chaos Maze",
    theme: "classic",
    speed: 6.35,
    enemySpeed: 4.75,
    enemyCount: 4,
    energyDuration: 5.8,
    star: true,
    map: [
      "###################",
      "#.....#.....#.....#",
      "#.###.#.###.#.###.#",
      "#o#.............#o#",
      "#.#.###.#.#.###.#.#",
      "#.....#.#.#.#.....#",
      "#####.#.....#.#####",
      "#.................#",
      "#.###.#######.###.#",
      "#...#....P....#...#",
      "###.#.##.##.##.#.##",
      "#.....#.....#.....#",
      "#.###.#.###.#.###.#",
      "#.................#",
      "###################"
    ]
  },
  {
    name: "AI LAB",
    theme: "ai",
    speed: 6.8,
    enemySpeed: 5.25,
    enemyCount: 4,
    energyDuration: 5,
    star: true,
    surge: true,
    map: [
      "###################",
      "#..#.....#.....#..#",
      "#..#.###.#.###.#..#",
      "#o...#.......#...o#",
      "###.#.##.#.##.#.###",
      "#...#....#....#...#",
      "#.#####..#..#####.#",
      "#.................#",
      "#.###.#######.###.#",
      "#...#....P....#...#",
      "###.#.##.#.##.#.###",
      "#.....#..#..#.....#",
      "#.###.#.###.#.###.#",
      "#.................#",
      "###################"
    ]
  }
];

const MAX_LIVES = 3;
const STARTING_LIVES = 2;

const PRIZES = {
  speed: { label: "SPEED BOOST", symbol: "⚡", color: "#ff4d4d", duration: 6, weight: 20 },
  freeze: { label: "FREEZE!", symbol: "❄", color: "#55d6ff", duration: 4, weight: 18 },
  shield: { label: "SHIELD", symbol: "🛡", color: "#50e878", duration: 8, weight: 16 },
  hunter: { label: "HUNTER MODE", symbol: "👻", color: "#b077ff", duration: 7, weight: 15 },
  double: { label: "2X SCORE", symbol: "⭐", color: "#ffd447", duration: 8, weight: 18 },
  life: { label: "EXTRA LIFE", symbol: "♥", color: "#ff6b8b", duration: 0, weight: 5 }
};

const ENEMY_BLUEPRINTS = [
  { name: "Chaser", color: "#ff5577", behavior: "chase", x: 9, y: 7 },
  { name: "Wanderer", color: "#ffb84d", behavior: "wander", x: 17, y: 1 },
  { name: "Predictor", color: "#55d6ff", behavior: "predict", x: 1, y: 1 },
  { name: "Sprinter", color: "#ff7df2", behavior: "sprint", x: 17, y: 13 },
  { name: "Guardian", color: "#50e878", behavior: "guard", x: 1, y: 13 },
  { name: "Chaser", color: "#ff335f", behavior: "chase", x: 9, y: 1 }
];

export class MazeGame {
  constructor() {
    this.levelIndex = 0;
    this.score = 0;
    this.highScore = Number(localStorage.getItem("handMazeHighScore") || 0);
    this.lives = STARTING_LIVES;
    this.state = "READY";
    this.requestedDirection = "RIGHT";
    this.currentDirection = "RIGHT";
    this.player = { x: 9, y: 9, px: 9, py: 9, progress: 0, facingDirection: "RIGHT" };
    this.enemies = [];
    this.map = [];
    this.remainingDots = 0;
    this.energyTimer = 0;
    this.powerTimer = 0;
    this.activePower = null;
    this.shieldTimer = 0;
    this.invincibleTimer = 0;
    this.combo = 0;
    this.prizes = [];
    this.prizeTimer = Infinity;
    this.surgeTimer = 20;
    this.surgeActiveTimer = 0;
    this.message = "";
    this.messageTimer = 0;
    this.events = [];
    this.loadLevel(0, true);
  }

  get level() {
    const base = LEVELS[Math.min(this.levelIndex, LEVELS.length - 1)];
    if (this.levelIndex < LEVELS.length) return base;

    const extra = this.levelIndex - LEVELS.length + 1;
    return {
      ...base,
      name: `Arcade Rush ${this.levelIndex + 1}`,
      speed: base.speed + extra * 0.18,
      enemySpeed: base.enemySpeed + extra * 0.28,
      enemyCount: Math.min(6, base.enemyCount + Math.floor((extra + 1) / 2)),
      prizeInterval: Math.max(7, 13 - extra * 0.8),
      energyDuration: Math.max(4.2, base.energyDuration - extra * 0.18),
      star: true,
      surge: true
    };
  }

  get levelNumber() {
    return this.levelIndex + 1;
  }

  start() {
    if (this.state === "READY") this.state = "PLAYING";
  }

  togglePause() {
    if (this.state === "PLAYING") this.state = "PAUSED";
    else if (this.state === "PAUSED") this.state = "PLAYING";
  }

  restartGame() {
    this.levelIndex = 0;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.loadLevel(0, true);
    this.state = "PLAYING";
  }

  loadLevel(index, keepScore = false) {
    this.levelIndex = index;
    if (!keepScore) this.score += 0;
    this.map = this.level.map.map((row) => row.split(""));
    this.remainingDots = 0;
    this.energyTimer = 0;
    this.powerTimer = 0;
    this.activePower = null;
    this.shieldTimer = 0;
    this.invincibleTimer = 0;
    this.combo = 0;
    this.prizes = [];
    this.prizeTimer = this.prizesEnabled() ? this.nextPrizeDelay() : Infinity;
    this.surgeTimer = this.level.surge ? 20 : Infinity;
    this.surgeActiveTimer = 0;
    this.message = `${this.level.name.toUpperCase()}`;
    this.messageTimer = 2.2;
    this.state = "PLAYING";
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        if (this.map[y][x] === "." || this.map[y][x] === "o") this.remainingDots += 1;
        if (this.map[y][x] === "P") {
          this.player = { x, y, px: x, py: y, progress: 0, facingDirection: "RIGHT" };
          this.playerStart = { x, y };
          this.map[y][x] = " ";
        }
      }
    }
    this.currentDirection = "RIGHT";
    this.requestedDirection = "RIGHT";
    this.resetEnemies();
    this.pushEvent("levelStart", { level: this.levelNumber });
  }

  setRequestedDirection(direction) {
    if (DIRS[direction]) this.requestedDirection = direction;
  }

  update(dt) {
    this.messageTimer = Math.max(0, this.messageTimer - dt);
    if (this.state !== "PLAYING") return;
    if (this.remainingDots <= 0) {
      this.completeLevel();
      return;
    }

    this.updatePowerTimers(dt);
    this.updateSurge(dt);
    this.updatePrizes(dt);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.checkEnemyCollision();
    this.checkPrizeCollision();
  }

  updatePowerTimers(dt) {
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    this.energyTimer = Math.max(0, this.energyTimer - dt);
    this.powerTimer = Math.max(0, this.powerTimer - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);

    if (this.energyTimer === 0) this.combo = 0;
    if (this.shieldTimer === 0 && this.activePower === "shield") this.activePower = null;
    if (this.powerTimer === 0 && this.activePower && this.activePower !== "shield") this.activePower = null;
  }

  updateSurge(dt) {
    if (!this.level.surge) return;
    if (this.surgeActiveTimer > 0) {
      this.surgeActiveTimer = Math.max(0, this.surgeActiveTimer - dt);
      if (this.surgeActiveTimer === 0) {
        this.message = "SURGE CLEARED";
        this.messageTimer = 1.2;
      }
      return;
    }
    this.surgeTimer -= dt;
    if (this.surgeTimer <= 0) {
      this.surgeActiveTimer = 5;
      this.surgeTimer = 20;
      this.message = "AI SURGE";
      this.messageTimer = 1.8;
      this.pushEvent("surge");
    }
  }

  updatePrizes(dt) {
    if (!this.prizesEnabled()) return;
    for (const prize of this.prizes) prize.life -= dt;
    this.prizes = this.prizes.filter((prize) => prize.life > 0);

    if (this.prizes.length >= this.maxActivePrizes()) return;
    this.prizeTimer -= dt;
    if (this.prizeTimer <= 0) {
      this.spawnPrize();
      this.prizeTimer = this.nextPrizeDelay();
    }
  }

  updatePlayer(dt) {
    const player = this.player;
    if (player.progress === 0) this.tryTurn();
    if (!this.canMove(player, this.currentDirection)) {
      player.progress = 0;
      return;
    }

    const speedBoost = this.activePower === "speed" && this.powerTimer > 0 ? 1.45 : 1;
    player.progress += dt * this.level.speed * speedBoost;
    while (player.progress >= 1) {
      player.progress -= 1;
      const dir = DIRS[this.currentDirection];
      const nextX = player.x + dir.x;
      const nextY = player.y + dir.y;
      if (!this.isWall(nextX, nextY)) {
        player.px = player.x;
        player.py = player.y;
        player.x = nextX;
        player.y = nextY;
        this.collectAt(player.x, player.y);
      } else {
        player.progress = 0;
        break;
      }

      const previousDirection = this.currentDirection;
      this.tryTurn();
      if (this.currentDirection !== previousDirection) {
        player.progress = 0;
        break;
      }
      if (!this.canMove(player, this.currentDirection)) {
        player.progress = 0;
        break;
      }
    }
  }

  // STEM CONCEPT: Simple Enemy AI
  // Enemies choose directions at intersections using different target formulas.
  updateEnemies(dt) {
    if (this.activePower === "freeze" && this.powerTimer > 0) return;

    const surgeBoost = this.surgeActiveTimer > 0 ? 1.45 : 1;
    const difficultyBoost = 1 + Math.max(0, this.levelNumber - 5) * 0.04;
    for (const enemy of this.enemies) {
      if (enemy.defeatedTimer > 0) {
        enemy.defeatedTimer -= dt;
        if (enemy.defeatedTimer <= 0) this.resetEnemy(enemy);
        continue;
      }
      if (enemy.progress === 0) this.chooseEnemyDirection(enemy);
      if (!this.canMove(enemy, enemy.direction)) {
        enemy.progress = 0;
        continue;
      }

      const sprintBoost = enemy.behavior === "sprint" && this.distanceToPlayer(enemy) < 5 ? 1.65 : 1;
      enemy.progress += dt * enemy.speed * surgeBoost * sprintBoost * difficultyBoost;
      while (enemy.progress >= 1) {
        enemy.progress -= 1;
        const dir = DIRS[enemy.direction];
        const nextX = enemy.x + dir.x;
        const nextY = enemy.y + dir.y;
        if (!this.isWall(nextX, nextY)) {
          enemy.px = enemy.x;
          enemy.py = enemy.y;
          enemy.x = nextX;
          enemy.y = nextY;
        } else {
          enemy.direction = this.validDirections(enemy)[0] || enemy.direction;
          enemy.progress = 0;
          break;
        }

        this.chooseEnemyDirection(enemy);
        if (!this.canMove(enemy, enemy.direction)) {
          enemy.progress = 0;
          break;
        }
      }
    }
  }

  // STEM CONCEPT: Grid Collision Detection
  isWall(x, y) {
    if (x < 0 || y < 0 || y >= this.map.length) return true;
    if (x >= this.map[y].length) return true;
    return this.map[y][x] === "#";
  }

  canMove(actor, direction) {
    const dir = DIRS[direction];
    return Boolean(dir) && !this.isWall(actor.x + dir.x, actor.y + dir.y);
  }

  // STEM CONCEPT: Buffered Turning
  tryTurn() {
    const requested = DIRS[this.requestedDirection];
    if (!this.isWall(this.player.x + requested.x, this.player.y + requested.y)) {
      this.currentDirection = this.requestedDirection;
      this.player.facingDirection = this.currentDirection;
    }
  }

  collectAt(x, y) {
    const tile = this.map[y][x];
    if (tile !== "." && tile !== "o") return;
    const points = tile === "o" ? 50 : 10;
    this.addScore(points);
    this.remainingDots -= 1;
    this.map[y][x] = " ";
    this.pushEvent(tile === "o" ? "energy" : "dot", { x, y, points });
    if (tile === "o") {
      this.energyTimer = this.level.energyDuration;
      this.activePower = "hunter";
      this.powerTimer = this.level.energyDuration;
      this.combo = 0;
      this.message = PRIZES.hunter.label;
      this.messageTimer = 1.2;
    }
  }

  completeLevel() {
    this.state = "LEVEL_COMPLETE";
    this.message = "LEVEL COMPLETE";
    this.messageTimer = 1.3;
    this.pushEvent("levelComplete");
    setTimeout(() => {
      if (this.state === "LEVEL_COMPLETE") this.loadLevel(this.levelIndex + 1, true);
    }, 1300);
  }

  resetEnemies() {
    const available = this.enemyBlueprintsForLevel();
    const enemyCount = this.levelNumber >= 5 ? Math.max(this.level.enemyCount, 5) : this.level.enemyCount;
    this.enemies = Array.from({ length: enemyCount }, (_, index) => {
      const blueprint = available[index % available.length];
      const start = this.nearestOpenTile(blueprint.x, blueprint.y);
      return {
        ...blueprint,
        x: start.x,
        y: start.y,
        startX: start.x,
        startY: start.y,
        px: start.x,
        py: start.y,
        progress: 0,
        direction: index % 2 ? "DOWN" : "LEFT",
        speed: this.level.enemySpeed * (0.92 + index * 0.07),
        defeatedTimer: 0,
        thinkTimer: 0
      };
    });
  }

  enemyBlueprintsForLevel() {
    if (this.levelNumber === 1) return [ENEMY_BLUEPRINTS[0]];
    if (this.levelNumber === 2) return ENEMY_BLUEPRINTS.slice(0, 2);
    if (this.levelNumber === 3) return ENEMY_BLUEPRINTS.slice(0, 3);
    if (this.levelNumber === 4) return ENEMY_BLUEPRINTS.slice(0, 4);
    return ENEMY_BLUEPRINTS;
  }

  nearestOpenTile(startX, startY) {
    if (!this.isWall(startX, startY)) return { x: startX, y: startY };
    for (let radius = 1; radius < 8; radius++) {
      for (let y = startY - radius; y <= startY + radius; y++) {
        for (let x = startX - radius; x <= startX + radius; x++) {
          if (!this.isWall(x, y)) return { x, y };
        }
      }
    }
    return { x: this.player.x, y: this.player.y - 1 };
  }

  resetEnemy(enemy) {
    enemy.x = enemy.startX;
    enemy.y = enemy.startY;
    enemy.px = enemy.startX;
    enemy.py = enemy.startY;
    enemy.progress = 0;
    enemy.direction = "LEFT";
    enemy.defeatedTimer = 0;
  }

  chooseEnemyDirection(enemy) {
    const valid = this.validDirections(enemy);
    if (!valid.length) return;
    const reverse = opposite(enemy.direction);
    const options = valid.length > 1 ? valid.filter((direction) => direction !== reverse) : valid;
    if (enemy.behavior === "wander" || Math.random() < 0.1) {
      enemy.direction = options[Math.floor(Math.random() * options.length)];
      return;
    }

    const target = this.enemyTarget(enemy);
    enemy.direction = options.reduce((best, direction) => {
      const dir = DIRS[direction];
      const bestDir = DIRS[best];
      const candidateDistance = Math.hypot((enemy.x + dir.x) - target.x, (enemy.y + dir.y) - target.y);
      const bestDistance = Math.hypot((enemy.x + bestDir.x) - target.x, (enemy.y + bestDir.y) - target.y);
      return candidateDistance < bestDistance ? direction : best;
    }, options[0]);
  }

  enemyTarget(enemy) {
    const playerDir = DIRS[this.currentDirection];
    if (enemy.behavior === "predict") {
      return { x: this.player.x + playerDir.x * 4, y: this.player.y + playerDir.y * 4 };
    }
    if (enemy.behavior === "guard") {
      if (this.distanceToPlayer(enemy) < 6) return { x: this.player.x, y: this.player.y };
      const prize = this.prizes[0] || this.nearestCorner(enemy);
      return { x: prize.x, y: prize.y };
    }
    if (enemy.behavior === "sprint") {
      if (this.distanceToPlayer(enemy) < 5) return { x: this.player.x, y: this.player.y };
      return { x: enemy.startX, y: enemy.startY };
    }
    return { x: this.player.x, y: this.player.y };
  }

  validDirections(actor) {
    return Object.keys(DIRS).filter((direction) => {
      const dir = DIRS[direction];
      return !this.isWall(actor.x + dir.x, actor.y + dir.y);
    });
  }

  checkEnemyCollision() {
    if (this.invincibleTimer > 0) return;

    const player = this.getInterpolatedPlayer();
    for (const enemy of this.enemies) {
      if (enemy.defeatedTimer > 0) continue;
      const enemyPos = this.getInterpolatedEnemy(enemy);
      if (Math.hypot(player.x - enemyPos.x, player.y - enemyPos.y) > 0.62) continue;
      if (this.energyTimer > 0) {
        enemy.defeatedTimer = 2;
        this.combo += 1;
        const bonus = 100 * Math.pow(2, this.combo);
        this.addScore(bonus);
        this.message = `+${bonus} ${enemy.name.toUpperCase()}`;
        this.messageTimer = 1;
        this.pushEvent("enemyDefeated", { x: enemy.x, y: enemy.y, points: bonus });
      } else if (this.shieldTimer > 0) {
        this.shieldTimer = 0;
        if (this.activePower === "shield") this.activePower = null;
        this.invincibleTimer = 1.1;
        this.message = "SHIELD BLOCK";
        this.messageTimer = 1;
        this.pushEvent("shieldBlock", { x: this.player.x, y: this.player.y });
      } else {
        this.loseLife();
      }
      break;
    }
  }

  checkPrizeCollision() {
    if (!this.prizes.length) return;
    const player = this.getInterpolatedPlayer();
    const prize = this.prizes.find((item) => Math.hypot(player.x - item.x, player.y - item.y) <= 0.65);
    if (!prize) return;
    this.applyPrize(prize);
    this.prizes = this.prizes.filter((item) => item !== prize);
  }

  spawnPrize() {
    const open = [];
    const fallback = [];
    for (let y = 1; y < this.map.length - 1; y++) {
      for (let x = 1; x < this.map[y].length - 1; x++) {
        if (this.map[y][x] === " " && this.isSafePrizeSpot(x, y)) open.push({ x, y });
        else if (this.map[y][x] !== "#" && this.isSafePrizeSpot(x, y)) fallback.push({ x, y });
      }
    }
    const spots = open.length ? open : fallback;
    if (!spots.length) return;
    const type = this.randomPrizeType();
    this.prizes.push({ ...spots[Math.floor(Math.random() * spots.length)], type, life: 6 });
    this.message = `${PRIZES[type].symbol} PRIZE`;
    this.messageTimer = 1;
  }

  applyPrize(prize) {
    const config = PRIZES[prize.type];
    if (prize.type === "life") {
      this.lives = Math.min(MAX_LIVES, this.lives + 1);
      this.message = config.label;
      this.messageTimer = 1.2;
      this.pushEvent("extraLife", { x: prize.x, y: prize.y });
      return;
    }

    this.activePower = prize.type;
    this.powerTimer = config.duration;
    if (prize.type === "hunter") {
      this.energyTimer = config.duration;
      this.combo = 0;
    } else if (prize.type === "shield") {
      this.shieldTimer = config.duration;
    }
    this.message = config.label;
    this.messageTimer = 1.4;
    this.pushEvent("powerUp", { x: prize.x, y: prize.y, color: config.color });
  }

  randomPrizeType() {
    const entries = Object.entries(PRIZES).filter(([type]) => type !== "life" || this.lives < MAX_LIVES);
    const total = entries.reduce((sum, [, prize]) => sum + prize.weight, 0);
    let roll = Math.random() * total;
    for (const [type, prize] of entries) {
      roll -= prize.weight;
      if (roll <= 0) return type;
    }
    return "speed";
  }

  isSafePrizeSpot(x, y) {
    if (Math.hypot(this.player.x - x, this.player.y - y) < 4) return false;
    return this.enemies.every((enemy) => Math.hypot(enemy.x - x, enemy.y - y) > 2);
  }

  prizesEnabled() {
    return this.levelNumber >= 2;
  }

  maxActivePrizes() {
    return this.levelNumber >= 5 ? 2 : 1;
  }

  nextPrizeDelay() {
    const base = this.level.prizeInterval || 14;
    const min = Math.max(7, base - 4);
    const max = Math.max(min + 2, base + 3);
    return min + Math.random() * (max - min);
  }

  loseLife() {
    this.lives -= 1;
    this.message = this.lives > 0 ? "LIFE LOST" : "GAME OVER";
    this.messageTimer = 1.7;
    this.pushEvent("lifeLost");
    if (this.lives <= 0) {
      this.state = "GAME_OVER";
      return;
    }
    const start = this.playerStart || { x: 9, y: 9 };
    this.player = { x: start.x, y: start.y, px: start.x, py: start.y, progress: 0, facingDirection: "RIGHT" };
    this.currentDirection = "RIGHT";
    this.requestedDirection = "RIGHT";
    this.energyTimer = 0;
    this.powerTimer = 0;
    this.activePower = null;
    this.shieldTimer = 0;
    this.invincibleTimer = 1.5;
    this.combo = 0;
  }

  addScore(points) {
    this.score += this.activePower === "double" && this.powerTimer > 0 ? points * 2 : points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("handMazeHighScore", String(this.highScore));
    }
  }

  getPlayerColor() {
    if (this.activePower && (this.powerTimer > 0 || this.shieldTimer > 0)) return PRIZES[this.activePower].color;
    return "#ffe44d";
  }

  getPowerStatus() {
    if (this.shieldTimer > 0 && this.activePower === "shield") {
      return { label: PRIZES.shield.label, timer: this.shieldTimer, duration: PRIZES.shield.duration, color: PRIZES.shield.color };
    }
    if (!this.activePower || this.powerTimer <= 0) return null;
    const config = PRIZES[this.activePower];
    return { label: config.label, timer: this.powerTimer, duration: config.duration, color: config.color };
  }

  distanceToPlayer(actor) {
    return Math.hypot(actor.x - this.player.x, actor.y - this.player.y);
  }

  nearestCorner(enemy) {
    const corners = [
      { x: 1, y: 1 },
      { x: this.map[0].length - 2, y: 1 },
      { x: 1, y: this.map.length - 2 },
      { x: this.map[0].length - 2, y: this.map.length - 2 }
    ];
    return corners.reduce((best, corner) => {
      const bestDistance = Math.hypot(enemy.x - best.x, enemy.y - best.y);
      const distance = Math.hypot(enemy.x - corner.x, enemy.y - corner.y);
      return distance < bestDistance ? corner : best;
    }, corners[0]);
  }

  getInterpolatedPlayer() {
    const dir = DIRS[this.currentDirection];
    if (!dir || this.player.progress <= 0 || !this.canMove(this.player, this.currentDirection)) {
      return { x: this.player.x, y: this.player.y };
    }
    return {
      x: this.player.x + dir.x * this.player.progress,
      y: this.player.y + dir.y * this.player.progress
    };
  }

  getInterpolatedEnemy(enemy) {
    const dir = DIRS[enemy.direction];
    if (!dir || enemy.progress <= 0 || !this.canMove(enemy, enemy.direction)) {
      return { x: enemy.x, y: enemy.y };
    }
    return {
      x: enemy.x + dir.x * enemy.progress,
      y: enemy.y + dir.y * enemy.progress
    };
  }

  pushEvent(type, detail = {}) {
    this.events.push({ type, ...detail });
  }

  consumeEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}

function opposite(direction) {
  if (direction === "LEFT") return "RIGHT";
  if (direction === "RIGHT") return "LEFT";
  if (direction === "UP") return "DOWN";
  return "UP";
}
