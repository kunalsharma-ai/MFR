"use client";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* Prize Machine LED counter: every digit is a slot-machine reel that spins a full turn before it stops on its
   new value, over a dim "ghost 8" like a real LED display. Digits are the language's own numerals
   (Latin, Arabic-Indic, Devanagari, Bengali, Thai…), separators stay put. aria-hidden: callers label it. */
const DIGITS = new Map();
const digitsFor = (lang) => {
  let d = DIGITS.get(lang);
  if (!d) {
    let f;
    try { f = new Intl.NumberFormat(lang); } catch { f = new Intl.NumberFormat('en'); }
    d = { f, list: Array.from({ length: 10 }, (_, i) => f.format(i)) };
    DIGITS.set(lang, d);
  }
  return d;
};

function Reel({ d, list, spin }) {
  const ref = useRef(null), last = useRef(d);
  useIso(() => { if (ref.current) ref.current.style.transform = `translateY(${-d * 5}%)`; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = ref.current;
    if (!el || last.current === d) return undefined;
    last.current = d;
    if (!spin || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches)) { el.style.transition = 'none'; el.style.transform = `translateY(${-d * 5}%)`; return undefined; }
    // spin one full turn (row d+10 of the doubled strip), then snap back to row d without a transition
    el.style.transition = 'transform .9s cubic-bezier(.15,.85,.25,1.04)';
    el.style.transform = `translateY(${-(d + 10) * 5}%)`;
    const tm = setTimeout(() => { el.style.transition = 'none'; el.style.transform = `translateY(${-d * 5}%)`; }, 950);
    return () => clearTimeout(tm);
  }, [d, spin]);
  return (
    <span className="led-c">
      <span className="led-ghost">{list[8]}</span>
      <span className="led-r" ref={ref} style={{ '--d0': d }}>
        {list.concat(list).map((x, j) => <span key={j}>{x}</span>)}
      </span>
      <span className="led-w">{list[d]}</span>
    </span>
  );
}

export default function LedCount({ value, lang = 'en', className = '', spin = true }) {
  const { f, list } = digitsFor(lang);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const chars = [...f.format(value)];
  return (
    <span className={'led ' + className} aria-hidden="true">
      {chars.map((ch, i) => {
        const k = chars.length - i, d = list.indexOf(ch);
        return d < 0 ? <span key={'s' + k} className="led-s">{ch}</span> : <Reel key={'d' + k} d={d} list={list} spin={spin && mounted} />;
      })}
    </span>
  );
}
