export class WandController {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.originX = 0;
    this.originY = 0;
    this.directionX = 1;
    this.directionY = 0;
    this.speed = 0;
    this.visible = false;
    this.isCharging = false;
    this.charge = 0;
    this.history = [];
    this.previousTip = null;
    this.stablePoint = null;
    this.stableTime = 0;
    this.cooldownUntil = 0;
  }

  update(handState, dt, paused = false) {
    if (!handState.hasHand || paused) {
      this.visible = false;
      this.isCharging = false;
      this.charge = Math.max(0, this.charge - dt * 1.6);
      this.previousTip = null;
      return;
    }

    const base = handState.indexBase;
    const tip = handState.indexTip;
    const rawDirection = normalize(tip.x - base.x, tip.y - base.y);
    const virtualTip = {
      x: tip.x + rawDirection.x * 205,
      y: tip.y + rawDirection.y * 205
    };

    const lerp = this.visible ? 0.25 : 1;
    this.originX += (tip.x - this.originX) * lerp;
    this.originY += (tip.y - this.originY) * lerp;
    this.x += (virtualTip.x - this.x) * lerp;
    this.y += (virtualTip.y - this.y) * lerp;
    this.directionX += (rawDirection.x - this.directionX) * 0.22;
    this.directionY += (rawDirection.y - this.directionY) * 0.22;
    const cleanDirection = normalize(this.directionX, this.directionY);
    this.directionX = cleanDirection.x;
    this.directionY = cleanDirection.y;

    const currentTip = { x: this.x, y: this.y, time: performance.now() };
    this.speed = this.previousTip ? distance(currentTip, this.previousTip) / Math.max(dt, 0.001) : 0;
    this.previousTip = currentTip;
    this.visible = true;
    this.history.push(currentTip);
    if (this.history.length > 60) this.history.shift();
  }

  updateCharge(isAiming, dt) {
    const now = performance.now();
    if (!this.visible || now < this.cooldownUntil || !isAiming) {
      this.isCharging = false;
      this.charge = Math.max(0, this.charge - dt * 1.9);
      this.stableTime = 0;
      this.stablePoint = null;
      return false;
    }

    const current = { x: this.x, y: this.y };
    if (!this.stablePoint || distance(current, this.stablePoint) > 76) {
      this.stablePoint = current;
      this.stableTime = 0;
    } else {
      this.stableTime += dt;
    }

    this.isCharging = true;
    this.charge = Math.min(this.stableTime / 2, 1);
    if (this.charge >= 1) {
      this.cooldownUntil = now + 900;
      this.charge = 0;
      this.stableTime = 0;
      this.stablePoint = null;
      return true;
    }
    return false;
  }
}

function normalize(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
