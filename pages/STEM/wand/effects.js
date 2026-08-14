import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export class EffectsRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.width = 1;
    this.height = 1;
    this.wandGroup = new THREE.Group();
    this.targetGroup = new THREE.Group();
    this.effectGroup = new THREE.Group();
    this.dust = null;
    this.particles = [];
    this.lightnings = [];
    this.shields = [];
  }

  init() {
    if (!window.WebGLRenderingContext) throw new Error("WebGL is not available in this browser.");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
    this.scene.add(this.wandGroup, this.targetGroup, this.effectGroup);
    this.createDust();
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = height;
    this.camera.updateProjectionMatrix();
  }

  createDust() {
    const geometry = new THREE.BufferGeometry();
    const count = 170;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = Math.random();
      positions[i * 3 + 1] = Math.random();
      positions[i * 3 + 2] = -40 - Math.random() * 30;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x9fefff,
      size: 3,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dust = new THREE.Points(geometry, material);
    this.scene.add(this.dust);
  }

  update(dt, wand, targets) {
    this.updateWand(wand);
    this.updateTargets(targets);
    this.updateDust();
    this.updateParticles(dt);
    this.updateLightnings(dt);
    this.updateShields(dt);
    this.renderer.render(this.scene, this.camera);
  }

  updateWand(wand) {
    clearGroup(this.wandGroup);
    if (!wand.visible) return;
    const glow = 0.55 + Math.min(wand.speed / 1300, 1) * 0.45;
    const beam = makeLine(
      [{ x: wand.originX, y: wand.originY }, { x: wand.x, y: wand.y }],
      new THREE.Color(0x8bf9ff),
      1 + glow * 2,
      0.88
    );
    this.wandGroup.add(beam);

    const blade = makeLine(
      [
        { x: wand.originX - wand.directionX * 28, y: wand.originY - wand.directionY * 28 },
        { x: wand.x + wand.directionX * (28 + wand.charge * 34), y: wand.y + wand.directionY * (28 + wand.charge * 34) }
      ],
      new THREE.Color(0xffffff),
      1,
      0.7 + wand.charge * 0.28
    );
    this.wandGroup.add(blade);

    const tip = new THREE.Mesh(
      createDiamondGeometry(10 + wand.charge * 10, 18 + wand.charge * 22),
      new THREE.MeshBasicMaterial({
        color: wand.charge > 0.65 ? 0xffffff : 0x8bf9ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    tip.position.set(wand.x, wand.y, 5);
    tip.rotation.z = Math.atan2(wand.directionY, wand.directionX) - Math.PI / 2;
    this.wandGroup.add(tip);

    if (wand.isCharging) {
      const tickCount = Math.ceil(wand.charge * 9);
      for (let i = 0; i < tickCount; i++) {
        const angle = -Math.PI / 2 + i * 0.44 + performance.now() * 0.003;
        const inner = 22 + i * 1.8;
        const outer = inner + 10 + wand.charge * 18;
        this.wandGroup.add(makeLine(
          [
            { x: wand.x + Math.cos(angle) * inner, y: wand.y + Math.sin(angle) * inner },
            { x: wand.x + Math.cos(angle + 0.18) * outer, y: wand.y + Math.sin(angle + 0.18) * outer }
          ],
          new THREE.Color(0xffe27a),
          1,
          0.35 + wand.charge * 0.48
        ));
      }
    }

    if (wand.charge > 0.4 && Math.random() < wand.charge * 0.34) {
      this.spawnSpark(wand.x, wand.y, 190, 0.5);
    }
  }

  updateTargets(targets) {
    clearGroup(this.targetGroup);
    for (const target of targets) {
      if (!target.alive) continue;
      const scale = 1 + Math.sin(target.phase * 4) * 0.06 + target.aim * 0.18;
      const color = new THREE.Color(`hsl(${target.hue}, 95%, ${62 + target.aim * 16}%)`);
      const core = new THREE.Mesh(
        createDiamondGeometry(target.radius * 0.82 * scale, target.radius * 1.45 * scale),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending })
      );
      core.position.set(target.x, target.y, 0);
      core.rotation.z = Math.sin(target.phase) * 0.18;
      this.targetGroup.add(core);
      const outline = makeLine(
        diamondPoints(target.x, target.y, target.radius * 1.35 * scale, target.radius * 2.05 * scale, core.rotation.z),
        color,
        2,
        0.82
      );
      this.targetGroup.add(outline);
      this.targetGroup.add(makeLine(
        [
          { x: target.x - target.radius * 1.15, y: target.y },
          { x: target.x - target.radius * 0.42, y: target.y },
          { x: target.x + target.radius * 0.42, y: target.y },
          { x: target.x + target.radius * 1.15, y: target.y }
        ],
        new THREE.Color(0xffffff),
        1,
        0.18 + target.aim * 0.38
      ));
      for (let i = 0; i < 4; i++) {
        const angle = target.phase * 2 + i * Math.PI / 2;
        const mote = new THREE.Mesh(
          createDiamondGeometry(5, 9),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending })
        );
        mote.position.set(target.x + Math.cos(angle) * target.radius * 1.25, target.y + Math.sin(angle) * target.radius * 1.25, 2);
        mote.rotation.z = angle;
        this.targetGroup.add(mote);
      }
    }
  }

  updateDust() {
    if (!this.dust) return;
    const pos = this.dust.geometry.attributes.position.array;
    const now = performance.now() * 0.00007;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] = ((pos[i * 3] + 0.0008) % 1);
      const x = pos[i * 3] * this.width;
      const y = ((pos[i * 3 + 1] + Math.sin(now + i) * 0.02) % 1) * this.height;
      pos[i * 3] = x / this.width;
      pos[i * 3 + 1] = y / this.height;
    }
    this.dust.scale.set(this.width, this.height, 1);
    this.dust.geometry.attributes.position.needsUpdate = true;
  }

  spawnLightning(start, end, large = false) {
    const points = jaggedBolt(start, end, large ? 18 : 11, large ? 42 : 22);
    const bolt = {
      age: 0,
      life: large ? 0.48 : 0.36,
      objects: [
        makeLine(points, new THREE.Color(0xffffff), large ? 7 : 5, 1),
        makeLine(points, new THREE.Color(0x8bf9ff), large ? 18 : 12, 0.42)
      ]
    };
    for (const object of bolt.objects) this.effectGroup.add(object);
    for (let i = 0; i < (large ? 9 : 5); i++) {
      const base = points[Math.floor(Math.random() * points.length)];
      const branchEnd = {
        x: base.x + (Math.random() - 0.5) * (large ? 180 : 100),
        y: base.y + (Math.random() - 0.5) * (large ? 180 : 100)
      };
      const branch = makeLine(jaggedBolt(base, branchEnd, 5, 18), new THREE.Color(0xd8f9ff), large ? 5 : 3, 0.62);
      bolt.objects.push(branch);
      this.effectGroup.add(branch);
    }
    this.lightnings.push(bolt);
  }

  spawnImpact(point, hue = 190, strength = 1) {
    const color = new THREE.Color(`hsl(${hue}, 100%, 68%)`);
    for (let i = 0; i < 46 * strength; i++) this.spawnSpark(point.x, point.y, hue, strength);
    const shockwave = makeStarburst(point, 22, 68 * strength, color, 0.86);
    this.shields.push({ mesh: shockwave, age: 0, life: 0.55, startScale: 1, endScale: 8 * strength });
    this.effectGroup.add(shockwave);
  }

  spawnShield(width, height) {
    const shield = makeLine(
      polygonPoints(0, 0, 150, 6, Math.PI / 6, 0.82, 1.18),
      new THREE.Color(0x9fffff),
      3,
      0.72
    );
    shield.position.set(width / 2, height / 2, 3);
    this.shields.push({ mesh: shield, age: 0, life: 1.7, startScale: 0.4, endScale: 1.55 });
    this.effectGroup.add(shield);
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 6 + i * Math.PI / 3;
      const spoke = makeLine(
        [
          { x: 0, y: 0 },
          { x: Math.cos(angle) * 150 * 0.82, y: Math.sin(angle) * 150 * 1.18 }
        ],
        new THREE.Color(0x9fffff),
        1,
        0.24
      );
      spoke.position.set(width / 2, height / 2, 3);
      this.shields.push({ mesh: spoke, age: 0, life: 1.7, startScale: 0.4, endScale: 1.55 });
      this.effectGroup.add(spoke);
    }
  }

  spawnSpark(x, y, hue = 190, strength = 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (90 + Math.random() * 340) * strength;
    const mesh = new THREE.Mesh(
      createDiamondGeometry(3 + Math.random() * 3.5, 9 + Math.random() * 10),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(`hsl(${hue + Math.random() * 40}, 100%, 72%)`),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    mesh.position.set(x, y, 6);
    mesh.rotation.z = angle;
    this.effectGroup.add(mesh);
    this.particles.push({ mesh, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0, life: 0.45 + Math.random() * 0.35 });
  }

  updateParticles(dt) {
    for (const particle of this.particles) {
      particle.age += dt;
      particle.mesh.position.x += particle.vx * dt;
      particle.mesh.position.y += particle.vy * dt;
      particle.vx *= 0.93;
      particle.vy *= 0.93;
      particle.mesh.material.opacity = Math.max(0, 1 - particle.age / particle.life);
    }
    this.particles = this.particles.filter((particle) => {
      if (particle.age < particle.life) return true;
      this.effectGroup.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
      return false;
    });
  }

  updateLightnings(dt) {
    for (const bolt of this.lightnings) {
      bolt.age += dt;
      const alpha = Math.max(0, 1 - bolt.age / bolt.life);
      for (const object of bolt.objects) object.material.opacity = alpha * (0.55 + Math.random() * 0.45);
    }
    this.lightnings = this.lightnings.filter((bolt) => {
      if (bolt.age < bolt.life) return true;
      for (const object of bolt.objects) {
        this.effectGroup.remove(object);
        object.geometry.dispose();
        object.material.dispose();
      }
      return false;
    });
  }

  updateShields(dt) {
    for (const shield of this.shields) {
      shield.age += dt;
      const t = Math.min(shield.age / shield.life, 1);
      const scale = shield.startScale + (shield.endScale - shield.startScale) * easeOut(t);
      shield.mesh.scale.set(scale, scale, 1);
      shield.mesh.rotation.z += dt * 1.4;
      shield.mesh.material.opacity = Math.max(0, 0.8 * (1 - t));
    }
    this.shields = this.shields.filter((shield) => {
      if (shield.age < shield.life) return true;
      this.effectGroup.remove(shield.mesh);
      shield.mesh.geometry.dispose();
      shield.mesh.material.dispose();
      return false;
    });
  }
}

function makeLine(points, color, width, opacity) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(point.x, point.y, 0)));
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: width,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  return new THREE.Line(geometry, material);
}

function createDiamondGeometry(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -height / 2);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height / 2);
  shape.lineTo(-width / 2, 0);
  shape.lineTo(0, -height / 2);
  return new THREE.ShapeGeometry(shape);
}

function diamondPoints(x, y, width, height, rotation = 0) {
  const raw = [
    { x: 0, y: -height / 2 },
    { x: width / 2, y: 0 },
    { x: 0, y: height / 2 },
    { x: -width / 2, y: 0 },
    { x: 0, y: -height / 2 }
  ];
  return raw.map((point) => rotatePoint(point, x, y, rotation));
}

function polygonPoints(x, y, radius, sides, rotation = 0, scaleX = 1, scaleY = 1) {
  const points = [];
  for (let i = 0; i <= sides; i++) {
    const angle = rotation + i / sides * Math.PI * 2;
    points.push({
      x: x + Math.cos(angle) * radius * scaleX,
      y: y + Math.sin(angle) * radius * scaleY
    });
  }
  return points;
}

function makeStarburst(center, innerRadius, outerRadius, color, opacity) {
  const points = [];
  const arms = 18;
  for (let i = 0; i <= arms; i++) {
    const angle = i / arms * Math.PI * 2;
    const radius = i % 2 ? innerRadius : outerRadius * (0.72 + Math.random() * 0.28);
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    });
  }
  const star = makeLine(points, color, 2, opacity);
  star.position.set(center.x, center.y, 4);
  return star;
}

function rotatePoint(point, x, y, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: x + point.x * cos - point.y * sin,
    y: y + point.x * sin + point.y * cos
  };
}

function jaggedBolt(start, end, segments, roughness) {
  const points = [];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const offset = (Math.random() - 0.5) * roughness * Math.sin(Math.PI * t);
    points.push({
      x: start.x + dx * t + nx * offset,
      y: start.y + dy * t + ny * offset
    });
  }
  return points;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clearGroup(group) {
  for (const child of group.children) {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }
  group.clear();
}
