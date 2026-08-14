export class SpellEngine {
  constructor() {
    this.cooldownUntil = 0;
  }

  canFire() {
    return performance.now() > this.cooldownUntil;
  }

  fire(wand, targetField, effects, spellName = "LIGHTNING") {
    if (!this.canFire()) return null;
    this.cooldownUntil = performance.now() + (spellName === "STORM STRIKE" ? 1500 : 900);
    targetField.registerSpellCast();
    const target = targetField.findAimedTarget(
      { x: wand.originX, y: wand.originY },
      { x: wand.directionX, y: wand.directionY }
    );
    const end = target
      ? { x: target.x, y: target.y }
      : { x: wand.x + wand.directionX * 620, y: wand.y + wand.directionY * 620 };
    effects.spawnLightning({ x: wand.x, y: wand.y }, end, spellName === "STORM STRIKE");
    if (target) {
      targetField.hitTarget(target);
      effects.spawnImpact(end, target.hue);
    } else {
      effects.spawnImpact(end, 190, 0.45);
    }
    return { target, end };
  }
}
