import { useEffect, useState } from 'react';
import { setSound, soundOn, SOUND_EVENT, tick } from '../../utils/sound.js';

// Sound on/off switch (v3.0). Every copy on the page — footer, spin wheel, video section, chat, review screen —
// shares one setting (remembered on this device) and updates together.
export default function SoundToggle({ className = '', label = true }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(soundOn());
    const sync = () => setOn(soundOn());
    window.addEventListener(SOUND_EVENT, sync);
    return () => window.removeEventListener(SOUND_EVENT, sync);
  }, []);
  const flip = () => { const n = !on; setSound(n); setOn(n); if (n) tick(); };
  return (
    <button type="button" className={`snd-tg${on ? ' is-on' : ''} ${className}`} onClick={flip} aria-pressed={on} aria-label={on ? 'Sound is on. Turn sound off' : 'Sound is off. Turn sound on'}>
      <span className="snd-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          {on ? <><path className="snd-w1" d="M15.5 9.2a4 4 0 010 5.6" /><path className="snd-w2" d="M18.2 6.6a7.6 7.6 0 010 10.8" /></> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
        </svg>
      </span>
      {label ? <span className="snd-txt">{on ? 'Sound on' : 'Sound off'}</span> : null}
    </button>
  );
}
