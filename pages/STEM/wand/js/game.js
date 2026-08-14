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

const ENEMY_BLUEPRINTS = [
  { name: "Chaser", color: "#ff5577", behavior: "chase", x: 9, y: 7 },
  { name: "Predictor", color: "#55d6ff", behavior: "predict", x: 1, y: 1 },
  { name: "Ambusher", color: "#ffb84d", behavior: "ambush", x: 17, y: 1 },
  { name: "Random", color: "#b077ff", behavior: "random", x: 1, y: 13 }
];

export class MazeGame {
  constructor() {
    this.levelIndex = 0;
    this.score = 0;
    this.highScore = Number(localStorage.getItem("handMazeHighScore") || 0);
    this.lives = 3;
    this.state = "READY";
    this.requestedDirection = "RIGHT";
    this.currentDirection = "RIGHT";
    this.player = { x: 9, y: 9, px: 9, py: 9, progress: 0 };
    this.enemies = [];
    this.map = [];
    this.remainingDots = 0;
    this.energyTimer = 0;
    this.combo = 0;
    this.star = null;
    this.starTimer = 0;
    this.surgeTimer = 20;
    this.surgeActiveTimer = 0;
    this.message = "";
    this.messageTimer = 0;
    this.events = [];
    this.loadLevel(0, true);
  }

  get level() {
    return LEVELS[this.levelIndex];
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
    this.lives = 3;
    this.loadLevel(0, true);
    this.state = "PLAYING";
  }

  loadLevel(index, keepScore = false) {
    this.levelIndex = index;
    if (!keepScore) this.score += 0;
    this.map = this.level.map.map((row) => row.split(""));
    this.remainingDots = 0;
    this.energyTimer = 0;
    this.combo = 0;
    this.star = null;
    this.starTimer = this.level.star ? 6 + Math.random() * 5 : Infinity;
    this.surgeTimer = this.level.surge ? 20 : Infinity;
    this.surgeActiveTimer = 0;
    this.message = `${this.level.name.toUpperCase()}`;
    this.messageTimer = 2.2;
    this.state = "PLAYING";
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        if (this.map[y][x] === "." || this.map[y][x] === "o") this.remainingDots += 1;
        if (this.map[y][x] === "P") {
          this.player = { x, y, px: x, py: y, progress: 0 };
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

    this.energyTimer = Math.max(0, this.energyTimer - dt);
    if (this.energyTimer === 0) this.combo = 0;
    this.updateSurge(dt);
    this.updateStar(dt);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.checkEnemyCollision();
    this.checkStarCollision();
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

  updateStar(dt) {
    if (!this.level.star) return;
    if (this.star) {
      this.star.life -= dt;
      if (this.star.life <= 0) this.star = null;
      return;
    }
    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.spawnStar();
      this.starTimer = 11 + Math.random() * 7;
    }
  }

  updatePlayer(dt) {
    const player = this.player;
    player.progress += dt * this.level.speed;
    while (player.progress >= 1) {
      player.progress -= 1;
      this.tryTurn();
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
    }
  }

  // STEM CONCEPT: Simple Enemy AI
  // Enemies choose directions at intersections using different target formulas.
  updateEnemies(dt) {
    const surgeBoost = this.surgeActiveTimer > 0 ? 1.45 : 1;
    for (const enemy of this.enemies) {
      if (enemy.defeatedTimer > 0) {
        enemy.defeatedTimer -= dt;
        if (enemy.defeatedTimer <= 0) this.resetEnemy(enemy);
        continue;
      }
      enemy.progress += dt * enemy.speed * surgeBoost;
      while (enemy.progress >= 1) {
        enemy.progress -= 1;
        this.chooseEnemyDirection(enemy);
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
      }
    }
  }

  // STEM CONCEPT: Grid Collision Detection
  isWall(x, y) {
    return !this.map[y] || this.map[y][x] === "#";
  }

  // STEM CONCEPT: Buffered Turning
  tryTurn() {
    const requested = DIRS[this.requestedDirection];
    if (!this.isWall(this.player.x + requested.x, this.player.y + requested.y)) {
      this.currentDirection = this.requestedDirection;
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
      this.combo = 0;
      this.message = "ENERGY MODE";
      this.messageTimer = 1.2;
    }
  }

  completeLevel() {
    if (this.levelIndex >= LEVELS.length - 1) {
      this.state = "VICTORY";
      this.message = "VICTORY";
      this.messageTimer = 999;
      this.pushEvent("victory");
      return;
    }
    this.state = "LEVEL_COMPLETE";
    this.message = "LEVEL COMPLETE";
    this.messageTimer = 1.3;
    this.pushEvent("levelComplete");
    setTimeout(() => {
      if (this.state === "LEVEL_COMPLETE") this.loadLevel(this.levelIndex + 1, true);
    }, 1300);
  }

  resetEnemies() {
    this.enemies = ENEMY_BLUEPRINTS.slice(0, this.level.enemyCount).map((blueprint, index) => {
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
      speed: this.level.enemySpeed * (0.95 + index * 0.08),
      defeatedTimer: 0
      };
    });
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
    if (enemy.behavior === "random" || Math.random() < 0.14) {
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
    if (enemy.behavior === "ambush") {
      return { x: this.player.x - playerDir.y * 5, y: this.player.y + playerDir.x * 5 };
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
      } else {
        this.loseLife();
      }
      break;
    }
  }

  checkStarCollision() {
    if (!this.star) return;
    const player = this.getInterpolatedPlayer();
    if (Math.hypot(player.x - this.star.x, player.y - this.star.y) > 0.65) return;
    this.addScore(500);
    this.message = "+500 STEM STAR";
    this.messageTimer = 1.1;
    this.pushEvent("star", { x: this.star.x, y: this.star.y, points: 500 });
    this.star = null;
  }

  spawnStar() {
    const open = [];
    for (let y = 1; y < this.map.length - 1; y++) {
      for (let x = 1; x < this.map[y].length - 1; x++) {
        if (!this.isWall(x, y)) open.push({ x, y });
      }
    }
    this.star = { ...open[Math.floor(Math.random() * open.length)], life: 7 };
    this.message = "STEM STAR";
    this.messageTimer = 1;
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
    this.player = { x: 9, y: 9, px: 9, py: 9, progress: 0 };
    this.currentDirection = "RIGHT";
    this.requestedDirection = "RIGHT";
    this.energyTimer = 0;
    this.combo = 0;
    this.resetEnemies();
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("handMazeHighScore", String(this.highScore));
    }
  }

  getInterpolatedPlayer() {
    const dir = DIRS[this.currentDirection];
    return {
      x: this.player.x + dir.x * this.player.progress,
      y: this.player.y + dir.y * this.player.progress
    };
  }

  getInterpolatedEnemy(enemy) {
    const dir = DIRS[enemy.direction];
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
