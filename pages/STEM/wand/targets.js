export class TargetField {
  constructor() {
    this.targets = [];
    this.score = 0;
    this.hits = 0;
    this.spellsCast = 0;
  }

  reset(width, height) {
    this.targets = [];
    this.score = 0;
    this.hits = 0;
    this.spellsCast = 0;
    for (let i = 0; i < 7; i++) this.targets.push(this.createTarget(width, height, i));
  }

  createTarget(width, height, index = 0) {
    const marginX = Math.max(90, width * 0.1);
    const marginY = Math.max(110, height * 0.18);
    return {
      x: marginX + Math.random() * Math.max(width - marginX * 2, 120),
      y: marginY + Math.random() * Math.max(height - marginY * 2, 120),
      radius: 32 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      driftX: 26 + Math.random() * 32,
      driftY: 18 + Math.random() * 24,
      hue: 185 + index * 24,
      alive: true,
      respawnAt: 0,
      aim: 0,
      collapse: 0
    };
  }

  update(dt, width, height) {
    const now = performance.now();
    for (const target of this.targets) {
      if (!target.alive && now > target.respawnAt) {
        Object.assign(target, this.createTarget(width, height, Math.floor(Math.random() * 7)));
      }
      if (!target.alive) continue;
      target.phase += dt;
      target.x += Math.sin(target.phase * 0.75) * target.driftX * dt;
      target.y += Math.cos(target.phase * 0.9) * target.driftY * dt;
      target.x = clamp(target.x, target.radius + 50, width - target.radius - 50);
      target.y = clamp(target.y, target.radius + 90, height - target.radius - 70);
      target.aim += (0 - target.aim) * 0.08;
      target.collapse += (0 - target.collapse) * 0.08;
    }
  }

  findAimedTarget(rayOrigin, rayDirection) {
    if (!rayOrigin || !rayDirection) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const target of this.targets) {
      if (!target.alive) continue;
      const distance = distanceFromRay(target, rayOrigin, rayDirection);
      const forward = (target.x - rayOrigin.x) * rayDirection.x + (target.y - rayOrigin.y) * rayDirection.y;
      if (forward > 0 && distance < target.radius + 34 && distance < bestDistance) {
        best = target;
        bestDistance = distance;
      }
    }
    if (best) best.aim = 1;
    return best;
  }

  registerSpellCast() {
    this.spellsCast += 1;
  }

  hitTarget(target) {
    if (!target || !target.alive) return false;
    target.alive = false;
    target.collapse = 1;
    target.respawnAt = performance.now() + 1000;
    this.hits += 1;
    this.score += 1;
    return true;
  }

  get accuracy() {
    if (this.spellsCast === 0) return 0;
    return Math.round((this.hits / this.spellsCast) * 100);
  }
}

function distanceFromRay(target, origin, direction) {
  const px = target.x - origin.x;
  const py = target.y - origin.y;
  const projection = px * direction.x + py * direction.y;
  const closestX = origin.x + direction.x * Math.max(projection, 0);
  const closestY = origin.y + direction.y * Math.max(projection, 0);
  return Math.hypot(target.x - closestX, target.y - closestY);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
