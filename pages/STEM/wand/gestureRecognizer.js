export class GestureRecognizer {
  constructor() {
    this.lastGestureAt = 0;
  }

  detect(history) {
    const now = performance.now();
    if (now - this.lastGestureAt < 1300 || history.length < 28) return null;
    if (isCircle(history)) return this.finish("PROTEGO");
    if (isZGesture(history)) return this.finish("STORM STRIKE");
    return null;
  }

  finish(name) {
    this.lastGestureAt = performance.now();
    return name;
  }
}

function isCircle(history) {
  const recent = history.slice(-50);
  const bounds = getBounds(recent);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width < 90 || height < 90) return false;
  if (width / height > 1.8 || height / width > 1.8) return false;
  const start = recent[0];
  const end = recent[recent.length - 1];
  if (distance(start, end) > Math.max(width, height) * 0.48) return false;
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  let rotation = 0;
  for (let i = 1; i < recent.length; i++) {
    const a = Math.atan2(recent[i - 1].y - center.y, recent[i - 1].x - center.x);
    const b = Math.atan2(recent[i].y - center.y, recent[i].x - center.x);
    let delta = b - a;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    rotation += delta;
  }
  return Math.abs(rotation) > Math.PI * 1.45;
}

function isZGesture(history) {
  const recent = simplify(history.slice(-45), 12);
  if (recent.length < 4) return false;
  const moves = [];
  for (let i = 1; i < recent.length; i++) {
    const dx = recent[i].x - recent[i - 1].x;
    const dy = recent[i].y - recent[i - 1].y;
    if (Math.hypot(dx, dy) > 25) moves.push({ dx, dy });
  }
  const labels = moves.map(labelMove).filter(Boolean).join("");
  return labels.includes("RDLR") || labels.includes("RDR");
}

function labelMove(move) {
  if (move.dx > 35 && Math.abs(move.dy) < 70) return "R";
  if (move.dx < -25 && move.dy > 25) return "DL";
  if (move.dx < -15 && move.dy > 15) return "D";
  return "";
}

function simplify(points, step) {
  const output = [];
  for (let i = 0; i < points.length; i += step) output.push(points[i]);
  output.push(points[points.length - 1]);
  return output;
}

function getBounds(points) {
  return points.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxY: Math.max(bounds.maxY, point.y)
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
