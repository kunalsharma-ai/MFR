// Lock & key graphics used across the page (all inline SVG + CSS 3D, transform/opacity animations only):
//   VaultSky   floating 3D keys and padlocks drifting behind the page (decorative, tinted by the language colours)
//   Dial       the combination dial around the activation lock — one notch per section, lit as sections are read
//   MiniLock   a small padlock that springs open (each section card: locked → unlocked once read)
//   KeyBlank   a key being "cut": one tooth per step completed (parent key in Part B, teen key in Part C)
import { memo } from 'react';

const KEY_PATH = 'M14 4a10 10 0 100 20 10 10 0 000-20zm0 6a4 4 0 110 8 4 4 0 010-8zM23 12h29v4h-4v6h-4v-6h-4v4h-4v-4h-13z';
const LOCK_BODY = 'M6 18h28a3 3 0 013 3v17a3 3 0 01-3 3H6a3 3 0 01-3-3V21a3 3 0 013-3z';
const LOCK_SHACKLE = 'M11 18v-6a9 9 0 0118 0v6';

/** Floating keys & padlocks (fixed layer behind the content). */
export const VaultSky = memo(function VaultSky() {
  const items = [
    ['key', 6, 18, 1.1, -24], ['lock', 88, 12, 1, 10], ['key', 92, 58, .8, 32],
    ['lock', 4, 70, .85, -12], ['key', 52, 92, .7, 70], ['lock', 70, 36, .6, 6],
  ];
  return (
    <div className="vsky" aria-hidden="true">
      {items.map(([k, x, y, s, r], i) => (
        <span key={i} className={`vs vs-${k}`} style={{ '--x': `${x}%`, '--y': `${y}%`, '--s': s, '--r': `${r}deg`, '--i': i }}>
          {k === 'key'
            ? <svg viewBox="0 0 56 28" width="112" height="56"><path d={KEY_PATH} /></svg>
            : <svg viewBox="0 0 40 44" width="80" height="88"><path className="vs-sh" d={LOCK_SHACKLE} /><path d={LOCK_BODY} /><circle className="vs-kh" cx="20" cy="28" r="3.2" /></svg>}
        </span>
      ))}
    </div>
  );
});

/** Combination dial: 19 notches (one per section, in its own colour) + a ring that turns as reading progresses. */
export const Dial = memo(function Dial({ sections, read }) {
  const n = sections.length;
  const done = sections.filter((s) => read.has(s.n)).length;
  return (
    <svg className="dial" viewBox="0 0 320 320" aria-hidden="true">
      <circle className="dial-track" cx="160" cy="160" r="146" />
      <g className="dial-spin" style={{ transform: `rotate(${(done / n) * 360}deg)` }}>
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} className={i % 5 ? 'dial-mm' : 'dial-m5'} x1="160" y1="6" x2="160" y2={i % 5 ? 13 : 18} transform={`rotate(${i * 6} 160 160)`} />
        ))}
      </g>
      {sections.map((s, i) => {
        const on = read.has(s.n);
        return (
          <g key={s.n} transform={`rotate(${(i / n) * 360 - 90} 160 160)`}>
            <rect className={`dial-n ${on ? 'on' : ''}`} x="282" y="155" width="22" height="10" rx="5" style={{ '--h': s.hue }} />
          </g>
        );
      })}
      <circle className="dial-pointer" cx="160" cy="22" r="5" />
    </svg>
  );
});

/** Small padlock: closed until `open`, then the shackle springs up and turns. */
export const MiniLock = memo(function MiniLock({ open, size = 18 }) {
  return (
    <svg className={`ml ${open ? 'is-open' : ''}`} viewBox="0 0 40 44" width={size} height={size * 1.1} aria-hidden="true" focusable="false">
      <path className="ml-sh" d={LOCK_SHACKLE} />
      <path className="ml-body" d={LOCK_BODY} />
      <circle className="ml-kh" cx="20" cy="28" r="3.4" />
    </svg>
  );
});

/** A key being cut: `teeth` = array of booleans (one tooth per completed step). `turned` = the key is complete. */
export const KeyBlank = memo(function KeyBlank({ teeth, tone = 'parent', turned = false, label, status }) {
  const w = 22 + teeth.length * 16;
  return (
    <div className={`kb kb-${tone} ${turned ? 'is-turned' : ''}`}>
      <svg className="kb-svg" viewBox={`0 0 ${70 + w} 64`} width={70 + w} height="64" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`kbg-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="kb-s1" />
            <stop offset="1" className="kb-s2" />
          </linearGradient>
        </defs>
        <g className="kb-key">
          <circle cx="30" cy="26" r="22" fill={`url(#kbg-${tone})`} />
          <circle cx="30" cy="26" r="8" className="kb-hole" />
          <rect x="48" y="20" width={w + 10} height="12" rx="3" fill={`url(#kbg-${tone})`} />
          {teeth.map((on, i) => (
            <rect key={i} className={`kb-t ${on ? 'on' : ''}`} x={58 + i * 16} y="32" width="10" height={10 + ((i * 7) % 3) * 5} rx="2" fill={`url(#kbg-${tone})`} style={{ '--i': i }} />
          ))}
        </g>
        <g className="kb-glint"><path d={`M${54} 23h${w}`} /></g>
      </svg>
      {label ? <span className="kb-l"><b>{label}</b><small>{status}</small></span> : null}
    </div>
  );
});
