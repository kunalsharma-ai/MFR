import { useEffect, useRef } from 'react';
import mono from '../assets/mfr-monogram.webp';
import { useFinePointer, usePauseOffscreen, useReducedMotion } from '../hooks/index.js';
import { Icon } from './Icon.jsx';

const LAYERS = Array.from({ length: 12 }, (_, i) => i - 5.5);

/**
 * Spinning 3D MFR coin built from stacked CSS layers (real edge thickness), with orbiting tokens.
 * Pure CSS transforms, so there's no WebGL and nothing to fail to load. It tilts toward the pointer on desktop.
 */
export function Coin3D() {
  const stage = usePauseOffscreen();
  const tilt = useRef(null);
  const fine = useFinePointer();
  const rm = useReducedMotion();

  useEffect(() => {
    const host = stage.current; const t = tilt.current;
    if (!host || !t || !fine || rm) return;
    let raf = 0, x = 0, y = 0;
    const move = (e) => {
      const r = host.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width - 0.5; y = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; t.style.transform = `rotateX(${(-y * 18).toFixed(2)}deg) rotateY(${(x * 22).toFixed(2)}deg)`; });
    };
    const leave = () => { t.style.transform = ''; };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => { host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, [fine, rm, stage]);

  return (
    <div className="coin-stage" ref={stage} aria-hidden="true">
      <div className="coin-halo" />
      <div className="coin-tilt" ref={tilt}>
        <div className="orbit o-a"><span className="tok t1" /><span className="tok t2" /><span className="tok t3" /></div>
        <div className="coin-bob">
          <div className="coin-spin">
            {LAYERS.map((z) => <i key={z} className="coin-layer" style={{ transform: `translateZ(${z}px)` }} />)}
            <div className="coin-face front"><img src={mono} alt="" draggable="false" /></div>
            <div className="coin-face back"><img src={mono} alt="" draggable="false" /></div>
          </div>
        </div>
        <div className="orbit o-b"><span className="tok t4" /><span className="tok t5" /></div>
      </div>
      <div className="coin-shadow" />
      <span className="float-chip c1"><Icon name="shield" />Verified requests only</span>
      <span className="float-chip c2"><Icon name="ticket" />Support ticket created instantly</span>
      <span className="float-chip c3"><Icon name="mail" />Email at every stage</span>
    </div>
  );
}
