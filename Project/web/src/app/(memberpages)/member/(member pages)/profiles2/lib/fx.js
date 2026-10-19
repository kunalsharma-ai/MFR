// Micro-interaction particles. DOM + CSS transforms only, auto-cleaned, no rAF loop left running.
const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let layer = null;
function getLayer() {
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'fx-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}
export function burst(x, y, colors = ['#d88632', '#f0ac56', '#031d52', '#ffd27a'], n = 12) {
  if (RM || x == null) return;
  const L = getLayer();
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 26 + Math.random() * 34;
    s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;background:${colors[i % colors.length]};--sz:${4 + Math.random() * 5}px`;
    frag.appendChild(s);
  }
  L.appendChild(frag);
  setTimeout(() => { for (let i = 0; i < n && L.firstChild; i++) L.removeChild(L.firstChild); }, 700);
}
export function burstFrom(e, colors, n) {
  if (!e) return;
  if (e.clientX || e.clientY) return burst(e.clientX, e.clientY, colors, n);
  const r = e.currentTarget?.getBoundingClientRect?.();
  if (r) burst(r.left + r.width / 2, r.top + r.height / 2, colors, n);
}
export const reducedMotion = () => RM;
