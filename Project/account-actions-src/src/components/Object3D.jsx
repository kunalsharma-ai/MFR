import { useId } from 'react';
import { Icon } from './Icon.jsx';
import { usePauseOffscreen } from '../hooks/index.js';
import mono from '../assets/mfr-monogram.webp';

/**
 * CSS-3D object for each option. GPU transforms only, no WebGL.
 * The stage clips its contents, so an object can never overlap nearby text.
 * Animations pause while the object is off screen.
 */
export function Object3D({ k, size = 92, className = '' }) {
  const ref = usePauseOffscreen();
  const rid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div ref={ref} className={`o3 o3-${k} ${className}`} style={{ '--s': `${size}px` }} aria-hidden="true">
      {k === 'd30' && (
        <div className="cube-in">
          <i className="ray" />
          <b className="f fr">30</b><b className="f bk">30</b>
          <b className="f lf s">DAYS</b><b className="f rt s">DAYS</b>
          <b className="f tp"><Icon name="sun" /></b><b className="f bt"><Icon name="sun" /></b>
        </div>
      )}
      {k === 'd60' && (
        <div className="hg-in">
          <i className="cap top" /><i className="post p3" /><i className="post p4" />
          <svg viewBox="0 0 60 90">
            <defs>
              <clipPath id={`${rid}t`}><path d="M8 4h44c0 18-14 26-20 41C26 30 8 22 8 4z" /></clipPath>
              <clipPath id={`${rid}b`}><path d="M32 45c6 15 20 23 20 41H8c0-18 14-26 24-41z" /></clipPath>
              <linearGradient id={`${rid}g`} x1="0" x2="1"><stop offset="0" stopColor="#FFE7A3" /><stop offset="1" stopColor="#FFB13B" /></linearGradient>
            </defs>
            <path d="M8 4h44c0 18-14 26-22 41C22 30 8 22 8 4zM30 45c8 15 22 23 22 41H8c0-18 14-26 22-41z" fill="rgba(124,245,228,.18)" stroke="rgba(255,255,255,.8)" strokeWidth="1.6" />
            <g clipPath={`url(#${rid}t)`}><rect className="sand-top" x="0" y="14" width="60" height="40" fill={`url(#${rid}g)`} /></g>
            <line className="stream" x1="30" y1="44" x2="30" y2="86" stroke="#FFC233" strokeWidth="1.6" />
            <g clipPath={`url(#${rid}b)`}><rect className="sand-bot" x="0" y="64" width="60" height="30" fill={`url(#${rid}g)`} /></g>
            <path d="M14 8c2 10 6 16 10 20" stroke="rgba(255,255,255,.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <i className="post p1" /><i className="post p2" /><i className="cap bot" />
        </div>
      )}
      {k === 'd90' && (
        <div className="pl-in"><i className="ring back" /><i className="sphere" /><i className="ring front" /><i className="moon" /></div>
      )}
      {k === 'hold' && (
        <div className="hd-in">
          <i className="slab s1" /><i className="slab s2" /><i className="slab s3" />
          <i className="bar b1" /><i className="bar b2" />
          <i className="spark k1" /><i className="spark k2" /><i className="spark k3" />
        </div>
      )}
      {k === 'del' && (
        <>
          <div className="dl-in">
            <i className="edge e1" /><i className="edge e2" /><i className="edge e3" /><i className="edge e4" />
            <i className="face front">
              <img src={mono} alt="" draggable="false" />
              <svg className="crack" viewBox="0 0 100 100"><path d="M62 6 54 30 66 42 50 58 58 74 46 96M54 30 40 34M66 42 82 46M50 58 34 62" fill="none" stroke="#9F1239" strokeWidth="2.2" strokeLinecap="round" /></svg>
            </i>
            <i className="face back"><Icon name="trash" /></i>
          </div>
          <i className="shard sh1" /><i className="shard sh2" /><i className="shard sh3" /><i className="shard sh4" />
        </>
      )}
      {k === 'react' && (
        <div className="rc-in"><i className="gy g2" /><i className="gy g1" /><i className="gy g3" /><i className="orb"><Icon name="power" /></i></div>
      )}
    </div>
  );
}
