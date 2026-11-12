/* Teacher ink is deliberately memory-only: never put it in test state or storage. */
window.createSATTeacherInk = function () {
 const controls = document.querySelector('.q-tools');
 const drawings = new Map(), regions = new Map();
 const ns = 'http://www.w3.org/2000/svg';
 let unlocked = false, enabled = false, current = null, active = null;
 function button(label, action) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn secondary teacher-ink-control';
  b.textContent = label; b.hidden = true; b.addEventListener('click', action);
  controls.appendChild(b); return b;
 }
 const toggle = button('Mark', () => { finish(); enabled = !enabled; update(); });
 toggle.setAttribute('aria-label', 'Mark with a temporary red pen');
 toggle.setAttribute('aria-pressed', 'false');
 const undo = button('Undo', () => {
  finish(); const strokes = drawings.get(current); if (strokes) strokes.pop(); redraw();
 });
 undo.setAttribute('aria-label', 'Undo last red pen stroke on this question');
 const clear = button('Clear', () => { finish(); drawings.delete(current); redraw(); });
 clear.setAttribute('aria-label', 'Clear red pen marks on this question');
 function update() {
  toggle.hidden = !unlocked;
  toggle.setAttribute('aria-pressed', String(enabled));
  undo.hidden = clear.hidden = !unlocked || !enabled;
  undo.disabled = clear.disabled = !(drawings.get(current)?.length);
  for (const {svg} of regions.values()) svg.classList.toggle('teacher-ink-on', unlocked && enabled);
 }
 function finish() {
  if (!active) return;
  const {svg, pointerId} = active; active = null;
  if (svg.hasPointerCapture(pointerId)) svg.releasePointerCapture(pointerId);
 }
 function point(event, svg) {
  const rect = svg.getBoundingClientRect();
  return [Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
          Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))];
 }
 function paint(region) {
  const {svg, surface} = regions.get(region);
  const width = surface.clientWidth, height = surface.clientHeight;
  if (!width || !height) return;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.replaceChildren();
  for (const stroke of drawings.get(current) || []) {
   if (stroke.region !== region) continue;
   const dot = stroke.points.length === 1;
   const shape = document.createElementNS(ns, dot ? 'circle' : 'polyline');
   if (dot) {
    shape.setAttribute('cx', stroke.points[0][0] * width);
    shape.setAttribute('cy', stroke.points[0][1] * height);
    shape.setAttribute('r', '1.5'); shape.setAttribute('fill', '#dc2626');
   } else {
    shape.setAttribute('points', stroke.points.map(([x,y]) => `${x*width},${y*height}`).join(' '));
    shape.setAttribute('fill', 'none'); shape.setAttribute('stroke', '#dc2626');
    shape.setAttribute('stroke-width', '3'); shape.setAttribute('stroke-linecap', 'round');
    shape.setAttribute('stroke-linejoin', 'round');
   }
   svg.appendChild(shape);
  }
 }
 function redraw() { for (const region of regions.keys()) paint(region); update(); }
 const observer = new ResizeObserver(() => { finish(); redraw(); });
 function attach(region, host) {
  const surface = document.createElement('div'); surface.className = 'teacher-ink-surface';
  while (host.firstChild) surface.appendChild(host.firstChild);
  const svg = document.createElementNS(ns, 'svg'); svg.classList.add('teacher-ink-layer');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  surface.appendChild(svg); host.appendChild(surface); regions.set(region, {svg, surface});
  svg.addEventListener('pointerdown', event => {
   if (!unlocked || !enabled || active || !event.isPrimary || event.button !== 0) return;
   event.preventDefault();
   const stroke = {region, points: [point(event, svg)]};
   if (!drawings.has(current)) drawings.set(current, []);
   drawings.get(current).push(stroke);
   active = {svg, pointerId: event.pointerId, stroke};
   svg.setPointerCapture(event.pointerId); paint(region); update();
  });
  svg.addEventListener('pointermove', event => {
   if (!active || active.svg !== svg || active.pointerId !== event.pointerId) return;
   event.preventDefault();
   const samples = event.getCoalescedEvents?.() || [];
   for (const sample of samples.length ? samples : [event]) active.stroke.points.push(point(sample, svg));
   paint(region);
  });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) svg.addEventListener(name, event => {
   if (active?.pointerId === event.pointerId) finish();
  });
  svg.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); });
  observer.observe(surface);
 }
 function reset() { finish(); drawings.clear(); enabled = false; redraw(); }
 window.addEventListener('pagehide', reset);
 window.addEventListener('blur', finish);
 return {
  unlock() { unlocked = true; update(); },
  lock() { unlocked = false; reset(); update(); },
  render(key) {
   finish(); observer.disconnect(); regions.clear(); current = key;
   attach('passage', document.getElementById('passage'));
   attach('prompt', document.getElementById('prompt'));
   attach('options', document.getElementById('options'));
   redraw();
  }
 };
};
