import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Icon from './Icon.jsx';

// CAPTCHA
// • If VITE_TURNSTILE_SITE_KEY is set → Cloudflare Turnstile (token MUST be verified on the server).
// • Otherwise → built-in visual code (with an accessible text-question alternative).
//   The built-in check deters casual bots only; production should verify a server-side CAPTCHA (README → Security).
//
// Behaviour (Nov 2026 audit):
//   • Typing NEVER verifies or submits anything. onChange(filled) only says whether an answer has been typed.
//   • The parent calls ref.verify() when the member presses Submit / Continue / Log in. A wrong answer shows an error
//     and loads a new challenge; a challenge older than EXPIRE_MS is rejected as expired.
//   • The image code is case-insensitive (it only uses capital letters and digits; the answer is upper-cased).
//   • After MAX_FAILS wrong answers in a row, verify() is refused for LOCK_MS.
//   • Enter inside the CAPTCHA box does not submit the form.

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const EXPIRE_MS = 3 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 30 * 1000;

const randCode = () => Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
const randMath = () => {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 9);
  return { q: `What is ${a} plus ${b}?`, a: String(a + b) };
};

const Captcha = forwardRef(function Captcha({ onChange, error }, ref) {
  const canvas = useRef(null);
  const [code, setCode] = useState('');
  const [math, setMath] = useState({ q: '', a: '' });
  const [mode, setMode] = useState('visual');
  const [value, setValue] = useState('');
  const [token, setToken] = useState('');
  const tsRef = useRef(null);
  const bornAt = useRef(0);
  const fails = useRef(0);
  const lockUntil = useRef(0);
  const [ownError, setOwnError] = useState('');

  const draw = useCallback((c) => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width;
    const H = cv.height;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#EEF2FF');
    g.addColorStop(1, '#FFF4E5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `hsla(${Math.random() * 360},70%,55%,.45)`;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.bezierCurveTo(Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H);
      ctx.stroke();
    }
    c.split('').forEach((ch, i) => {
      ctx.save();
      ctx.translate(18 + i * 30, 30 + Math.random() * 8);
      ctx.rotate((Math.random() - 0.5) * 0.6);
      ctx.font = `700 ${24 + Math.random() * 6}px "Manrope", system-ui, sans-serif`;
      ctx.fillStyle = ['#0B1E5B', '#FF8A00', '#2F6BFF', '#8B5CF6', '#E1306C'][i % 5];
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(11,30,91,.25)';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
  }, []);

  const refresh = useCallback(() => {
    const c = randCode();
    setCode(c);
    setMath(randMath());
    setValue('');
    bornAt.current = Date.now();
    onChange && onChange(false);
    setTimeout(() => draw(c), 0);
  }, [draw, onChange]);

  // Called by the form on submit. Returns true only for a correct, unexpired answer.
  const verify = useCallback(() => {
    if (SITE_KEY) return Boolean(token);
    const now = Date.now();
    if (lockUntil.current > now) {
      setOwnError(`Too many wrong answers. Try again in ${Math.ceil((lockUntil.current - now) / 1000)} seconds.`);
      return false;
    }
    if (now - bornAt.current > EXPIRE_MS) {
      refresh();
      setOwnError('That check expired. We’ve loaded a new one, please answer it.');
      return false;
    }
    const ok = mode === 'visual' ? value.trim().toUpperCase() === code : value.trim() === math.a;
    if (ok) {
      fails.current = 0;
      setOwnError('');
      return true;
    }
    fails.current += 1;
    if (fails.current >= MAX_FAILS) {
      fails.current = 0;
      lockUntil.current = now + LOCK_MS;
    }
    refresh();
    setOwnError(mode === 'visual' ? 'That code didn’t match. Here’s a new one: type the characters you see.' : 'That answer wasn’t right. Here’s a new question.');
    return false;
  }, [token, mode, value, code, math.a, refresh]);

  useEffect(() => {
    if (SITE_KEY) {
      const render = () => {
        if (window.turnstile && tsRef.current && !tsRef.current.dataset.done) {
          tsRef.current.dataset.done = '1';
          window.turnstile.render(tsRef.current, {
            sitekey: SITE_KEY,
            callback: (t) => {
              setToken(t);
              onChange && onChange(true, t);
            },
            'expired-callback': () => {
              setToken('');
              onChange && onChange(false);
            },
          });
        }
      };
      if (!document.getElementById('cf-turnstile')) {
        const s = document.createElement('script');
        s.id = 'cf-turnstile';
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true;
        s.onload = render;
        document.head.appendChild(s);
      } else render();
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({ refresh, verify, token: () => token }));

  const check = (v) => {
    setValue(v);
    setOwnError('');
    const filled = mode === 'visual' ? v.trim().length >= code.length : v.trim().length > 0;
    onChange && onChange(filled);
  };

  if (SITE_KEY) return <div className="captcha-ts" ref={tsRef} />;

  return (
    <div className={`captcha ${error || ownError ? 'has-error' : ''}`}>
      <div className="captcha-row">
        {mode === 'visual' ? (
          <canvas ref={canvas} width="170" height="50" className="captcha-canvas" role="img" aria-label="Security code image. Use the text question option if you cannot read it." />
        ) : (
          <p className="captcha-q" id="captcha-q">{math.q}</p>
        )}
        <button type="button" className="captcha-refresh" onClick={refresh} aria-label="Get a new security challenge"><Icon name="refresh" size={18} /></button>
      </div>
      <label htmlFor="captcha-input" className="f-label">{mode === 'visual' ? 'Type the code shown (not case-sensitive)' : 'Your answer'}</label>
      <input
        id="captcha-input"
        className="f-input"
        value={value}
        onChange={(e) => check(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode={mode === 'visual' ? 'text' : 'numeric'}
        aria-invalid={Boolean(error || ownError)}
        aria-describedby={error || ownError ? 'captcha-err' : mode === 'math' ? 'captcha-q' : undefined}
        maxLength={6}
      />
      <button
        type="button"
        className="captcha-mode"
        onClick={() => {
          setMode((m) => (m === 'visual' ? 'math' : 'visual'));
          setValue('');
          setOwnError('');
          bornAt.current = Date.now();
          onChange && onChange(false);
          setTimeout(() => draw(code), 0);
        }}
      >
        {mode === 'visual' ? 'Can’t read it? Use a text question' : 'Use the image code instead'}
      </button>
      {ownError || error ? <p className="f-err" id="captcha-err" role="alert">{ownError || error}</p> : null}
    </div>
  );
});

export default Captcha;
