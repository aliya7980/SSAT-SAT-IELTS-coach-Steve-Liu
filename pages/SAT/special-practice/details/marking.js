/* Temporary drawing layer: separate from student responses and grading. */
(() => {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const number = Number(new URLSearchParams(location.search).get('q') || 1);
  const key = 'hd_details_ink_' + (Number.isInteger(number) && number >= 1 && number <= 34 ? number : 1);
  const regions = new Map();
  let strokes = [], active = null, mode = 'off';
  try { const saved = JSON.parse(sessionStorage.getItem(key)); if (Array.isArray(saved)) strokes = saved.filter(s => ['passage','question'].includes(s.region) && ['pen','highlight'].includes(s.mode) && Array.isArray(s.points) && s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && v >= 0 && v <= 1))); } catch {}
  const pen = document.getElementById('inkPen'), highlight = document.getElementById('inkHighlight');
  const undo = document.getElementById('inkUndo'), clear = document.getElementById('inkClear');
  function save() { try { sessionStorage.setItem(key, JSON.stringify(strokes)); } catch {} }
  function finish() { if (!active) return; const {svg, id} = active; active = null; if (svg.hasPointerCapture(id)) svg.releasePointerCapture(id); save(); }
  function paint() {
    for (const [name, {host, svg}] of regions) {
      const w = host.clientWidth, h = host.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.replaceChildren();
      for (const s of strokes.filter(s => s.region === name)) {
        const shape = document.createElementNS(ns, s.points.length === 1 ? 'circle' : 'polyline');
        const color = s.mode === 'highlight' ? '#eab308' : '#dc2626', size = s.mode === 'highlight' ? 18 : 3;
        if (s.points.length === 1) { shape.setAttribute('cx', s.points[0][0]*w); shape.setAttribute('cy', s.points[0][1]*h); shape.setAttribute('r', size/2); shape.setAttribute('fill', color); }
        else { shape.setAttribute('points', s.points.map(([x,y]) => `${x*w},${y*h}`).join(' ')); shape.setAttribute('fill', 'none'); shape.setAttribute('stroke', color); shape.setAttribute('stroke-width', size); shape.setAttribute('stroke-linecap', 'round'); shape.setAttribute('stroke-linejoin', 'round'); }
        shape.setAttribute('opacity', s.mode === 'highlight' ? '.3' : '1'); svg.append(shape);
      }
      svg.classList.toggle('ink-enabled', mode !== 'off');
    }
    pen.setAttribute('aria-pressed', String(mode === 'pen')); highlight.setAttribute('aria-pressed', String(mode === 'highlight'));
    undo.disabled = clear.disabled = !strokes.length;
    document.getElementById('inkStatus').textContent = mode === 'off' ? 'Drawing off · choose answers normally.' : (mode === 'pen' ? 'Red pen' : 'Highlighter') + ' on · drag to mark. Select the tool again to answer or scroll.';
  }
  function setMode(next) { finish(); mode = mode === next ? 'off' : next; paint(); }
  pen.addEventListener('click', () => setMode('pen')); highlight.addEventListener('click', () => setMode('highlight'));
  undo.addEventListener('click', () => { finish(); strokes.pop(); save(); paint(); });
  clear.addEventListener('click', () => { finish(); strokes = []; save(); paint(); });
  for (const name of ['passage','question']) {
    const host = document.querySelector('[data-ink-region="' + name + '"]');
    host.classList.add('ink-surface'); const svg = document.createElementNS(ns, 'svg'); svg.classList.add('practice-ink'); svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false');host.append(svg); regions.set(name,{host,svg});
    function point(e) { const r=svg.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]; }
    svg.addEventListener('pointerdown', e => { if(mode === 'off' || active || !e.isPrimary || e.button !== 0)return;e.preventDefault();const stroke={region:name,mode,points:[point(e)]};strokes.push(stroke);active={svg,id:e.pointerId,stroke};svg.setPointerCapture(e.pointerId);paint(); });
    svg.addEventListener('pointermove',e=>{if(!active||active.svg!==svg||active.id!==e.pointerId)return;e.preventDefault();const samples=e.getCoalescedEvents?.()||[];for(const sample of samples.length?samples:[e])active.stroke.points.push(point(sample));paint();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(event,finish);
    svg.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  }
  new ResizeObserver(()=>{finish();paint();}).observe(document.querySelector('.question-layout'));
  window.addEventListener('blur',finish);window.addEventListener('pagehide',finish);paint();
})();
