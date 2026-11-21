import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Captcha from '../components/Captcha.jsx';
import { PageSeo } from '../components/PageHero.jsx';
import { PAGES } from '../data/pages.js';
import { BRAND, DEMO_MODE, MEMBER_PORTAL_URL } from '../data/site.js';
import { postJSON } from '../utils/api.js';
import { EMAIL_RE } from '../utils/validate.js';
import { loginMember } from '../utils/auth.js';
import SocialLogin from '../components/SocialLogin.jsx';
import AudienceSwitch from '../components/AudienceSwitch.jsx';
import { flushPendingProfile } from '../utils/signupMemo.js';
import WelcomeSurvey, { welcomeNeeded } from '../components/WelcomeSurvey.jsx';
const page = PAGES.login;

// Member log-in ("Member Pass").
// Two ways to connect it to the existing member application (README → Login):
//  • VITE_LOGIN_FORM_ACTION — the portal's own login URL. After client checks, the browser submits a normal
//    form POST there (works across domains; the portal sets its own session cookie and redirects).
//  • otherwise VITE_LOGIN_ENDPOINT (default /api/login) — JSON POST with credentials; the response may include
//    { redirect: "https://…" }. Falls back to VITE_MEMBER_PORTAL_URL.
// The server MUST verify the CAPTCHA token, rate-limit attempts and never reveal whether an email exists.
const FORM_ACTION = import.meta.env.VITE_LOGIN_FORM_ACTION || '';
const ENDPOINT = import.meta.env.VITE_LOGIN_ENDPOINT || '/api/login';
const RESET_URL = import.meta.env.VITE_PASSWORD_RESET_URL || '';
const MAX_TRIES = 5;
const LOCK_SECONDS = 30;

const maskEmail = (e) => {
  const [u = '', d = ''] = e.split('@');
  if (!u) return 'your@email.com';
  const vis = u.slice(0, Math.min(3, u.length));
  return `${vis}${u.length > 3 ? '•'.repeat(Math.min(6, u.length - 3)) : ''}${e.includes('@') ? '@' + d : ''}`;
};

const ORBIT = [['paypal', '#1E6FD9'], ['gift', '#1FAF7A'], ['upi', '#7B3FE4'], ['card', '#FF8A00'], ['bank', '#14B8A6'], ['cart', '#E8457A']];
function MemberPass({ email, pwLen, emailOk, pwOk, human, phase }) {
  const ref = useRef(null);
  const ready = emailOk && pwOk && human;
  const lights = [
    { k: 'Email', on: emailOk, icon: 'mail', v: emailOk ? maskEmail(email) : 'waiting' },
    { k: 'Password', on: pwOk, icon: 'lock', v: pwLen ? '•'.repeat(Math.min(pwLen, 8)) : 'waiting' },
    { k: 'Human check', on: human, icon: 'captcha', v: human ? 'verified' : 'waiting' },
  ];
  // pointer tilt — written straight to CSS variables (no re-render), eased by a CSS transition
  const move = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(x * 22).toFixed(1)}deg`);
    el.style.setProperty('--rx', `${(-y * 18).toFixed(1)}deg`);
    el.style.setProperty('--gx', `${Math.round((x + 0.5) * 100)}%`);
  };
  const leave = () => { const el = ref.current; if (el) { el.style.removeProperty('--ry'); el.style.removeProperty('--rx'); el.style.removeProperty('--gx'); } };
  return (
    <div className="mcd-stage" aria-hidden="true" ref={ref} onPointerMove={move} onPointerLeave={leave}>
      <span className="mcd-aura" />
      <div className="mcd-orbit">
        {ORBIT.map(([ic, c], i) => <span key={ic} className="mcd-sat" style={{ '--i': i, '--c': c }}><i><Icon name={ic} size={16} /></i></span>)}
      </div>
      <div className={`mcd ${ready ? 'is-ready' : ''} ${phase === 'success' ? 'is-open' : ''} ${phase === 'sending' ? 'is-busy' : ''}`}>
        <div className="mcd-front">
          <span className="mcd-holo" />
          <p className="mcd-top"><img src={BRAND.monogram} alt="MyFrequentRewards monogram" width="38" height="38" /><b>MEMBER PASS</b><em className={ready ? 'ok' : ''}>{ready ? 'UNLOCKED' : 'LOCKED'}</em></p>
          <span className="mcd-chip" />
          <p className="mcd-num">{emailOk ? maskEmail(email) : email ? email.slice(0, 22) : 'your@email.com'}</p>
          <p className="mcd-row">
            <span className="mcd-pin">{Array.from({ length: 6 }, (_, i) => <i key={i} className={i < Math.min(6, pwLen) ? 'on' : ''} />)}</span>
            <span className={`mcd-seal ${human ? 'on' : ''}`}><Icon name={human ? 'check' : 'shield'} size={14} stroke={human ? 3 : 2} /> {human ? 'Human' : 'Check'}</span>
          </p>
          <p className="mcd-foot"><span>MyFrequentRewards</span><span>Your Voice · Your Rewards</span></p>
        </div>
        <div className="mcd-back">
          {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className="mcd-coin" style={{ '--i': i }}>$</i>)}
          <b>Welcome back!</b>
          <small>Opening your dashboard…</small>
        </div>
      </div>
      <ul className="vd-checks">
        {lights.map((l) => (
          <li key={l.k} className={l.on ? 'on' : ''}><span><Icon name={l.on ? 'check' : l.icon} size={14} stroke={l.on ? 3 : 2} /></span><b>{l.k}</b><small>{l.v}</small></li>
        ))}
      </ul>
    </div>
  );
}

function Login() {
  const [f, setF] = useState({ email: '', password: '', remember: true, captchaOk: false });
  const [touched, setTouched] = useState({});
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | sending | welcome | success
  const [welcome, setWelcome] = useState(null); // { type, name, mail, demo } while the first-login welcome survey is open
  const [msg, setMsg] = useState('');
  const [tries, setTries] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const captchaRef = useRef(null);
  const formRef = useRef(null);
  const tokenRef = useRef(null);
  const { search } = useLocation();
  // Consumers, Professionals and Teens log in here alike; ?type= keeps the choice across a refresh
  const [aud, setAudState] = useState('consumer');
  useEffect(() => { const t = new URLSearchParams(search).get('type'); if (t === 'professional') setAudState('professional'); if (t === 'teen' || t === 'minor') setAudState('minor'); }, [search]);
  const setAud = (k) => {
    setAudState(k);
    try {
      const u = new URL(window.location.href);
      if (k === 'consumer') u.searchParams.delete('type'); else u.searchParams.set('type', k === 'minor' ? 'teen' : k);
      window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}${u.hash}`);
    } catch { /* not in a browser */ }
  };
  const pro = aud === 'professional';
  const teen = aud === 'minor';

  const emailOk = EMAIL_RE.test(f.email.trim());
  const pwOk = f.password.length >= 6;
  const errs = {
    email: !f.email.trim() ? 'Enter the email you joined with.' : !emailOk ? 'Enter a valid email address.' : '',
    password: !f.password ? 'Enter your password.' : !pwOk ? 'Passwords are at least 6 characters.' : '',
    captcha: !f.captchaOk ? 'Please complete the security check.' : '',
  };
  const err = (k) => (touched[k] || touched.submit ? errs[k] : '');
  const set = (k, val) => setF((s) => ({ ...s, [k]: val }));

  useEffect(() => {
    if (!lockLeft) return undefined;
    const t = setTimeout(() => setLockLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [lockLeft]);

  function openDashboard(res) {
    setWelcome(null);
    setPhase('success');
    const to = res.redirect || MEMBER_PORTAL_URL || '/member/dashboard';
    if (!res.demo && to) setTimeout(() => window.location.href="/member/dashboard", 1400);
    if (res.demo) setMsg('Preview mode: login simulated — no real account was accessed.');
  }

  async function submit(e) {
    e.preventDefault();
    setTouched((t) => ({ ...t, submit: true }));
    setMsg('');
    if (lockLeft) return;
    if (errs.email || errs.password || errs.captcha) {
      const first = errs.email ? 'login-email' : errs.password ? 'login-password' : 'captcha-input';
      const el = document.getElementById(first);
      if (el) el.focus();
      return;
    }
    const captchaToken = captchaRef.current?.token?.() || undefined;
    if (FORM_ACTION && !DEMO_MODE) {
      setPhase('sending');
      if (tokenRef.current) tokenRef.current.value = captchaToken || '';
      formRef.current.submit(); // classic POST to the member portal
      return;
    }
    setPhase('sending');
    try {
   const res = await loginMember({
  mail: f.email.trim().toLowerCase(),
  password: f.password,
  remember: f.remember ? 'on' : undefined,
});
    // login ke baad signup ke pending answers backend ko bhejo (kabhi throw nahi karta; 4s se zyada nahi rukega)
    if (!res.demo) await Promise.race([flushPendingProfile(), new Promise((r) => setTimeout(r, 4000))]);
    // First log in: a short welcome survey comes before the dashboard (the questions set-password used to ask).
    const mail = f.email.trim().toLowerCase();
    const need = await welcomeNeeded({ mail, fallback: pro ? 'professional' : teen ? 'teen' : 'consumer', demo: Boolean(res.demo) });
    if (need) {
      setWelcome({ ...need, mail, demo: Boolean(res.demo), redirect: res.redirect });
      setPhase('welcome');
      return;
    }
    openDashboard(res);
    } catch (ex) {
      setPhase('idle');
      const n = tries + 1;
      setTries(n);
      captchaRef.current?.refresh();
      set('captchaOk', false);
      setF((s) => ({ ...s, password: '' }));
      if (n >= MAX_TRIES) {
        setLockLeft(LOCK_SECONDS);
        setTries(0);
        setMsg(`Too many attempts. Please wait ${LOCK_SECONDS} seconds, or reset your password.`);
      } else setMsg(ex.message && ex.message !== 'Something went wrong. Please try again.' ? ex.message : 'That email and password don’t match our records. Please try again.');
    }
  }

  const aria = (k, id) => ({ 'aria-invalid': Boolean(err(k)), 'aria-describedby': err(k) ? `${id}-err` : undefined });

  return (
    <>
      <PageSeo page={page} />
      <section className={`lx ax-page ${pro ? 'aud-pro' : teen ? 'aud-min' : 'aud-con'}`} aria-labelledby="lx-title">
        <div className="lx-bg" aria-hidden="true">
          <span className="lx-mesh m1" /><span className="lx-mesh m2" /><span className="lx-mesh m3" />
          <span className="ax-alt" />
          <span className="lx-grid2" />
          <span className="ax-flash" />
        </div>
        <div className="container lx-row">
          {/* on phones the artwork sits below the form, so the switch gets its own spot above the card */}
          <div className="ax-mswitch"><AudienceSwitch value={aud} onChange={setAud} label="Log in as" /></div>
          <div className="lx-art">
            <div className="ax-dswitch"><AudienceSwitch value={aud} onChange={setAud} label="Log in as" /></div>
            <p className="lx-eyebrow"><span className="live-dot" /> {pro ? 'Secure area for professionals' : teen ? 'Teen members · parent approved' : 'Secure member area'}</p>
            <h2 className="lx-hero ax-swap" key={aud}>{pro ? <>Your expert surveys are <span>one tap away</span> — welcome back.</> : teen ? <>Your surveys and points are <span>one tap away</span> — welcome back.</> : <>Your rewards are <span>one tap away</span> — welcome back.</>}</h2>
            <MemberPass email={f.email} pwLen={Math.min(12, f.password.length)} emailOk={emailOk} pwOk={pwOk} human={f.captchaOk} phase={phase} />
            <ul className="lx-perks ax-swap" key={`p-${aud}`}>
              {teen ? (
                <>
                  <li style={{ '--c': '#2EE6CF' }}><Icon name="rocket" size={20} /><span><b>Surveys for your age</b> about games, apps, school and more</span></li>
                  <li style={{ '--c': '#FFC233' }}><Icon name="star" size={20} /><span><b>Reward points</b> for every survey you finish</span></li>
                  <li style={{ '--c': '#FF9BCB' }}><Icon name="shield" size={20} /><span><b>Parent approved</b>, and you can always skip a question or stop</span></li>
                </>
              ) : pro ? (
                <>
                  <li style={{ '--c': '#FFD166' }}><Icon name="briefcase" size={20} /><span><b>Expert B2B surveys</b> matched to your role and industry</span></li>
                  <li style={{ '--c': '#34D399' }}><Icon name="wallet" size={20} /><span><b>Higher rewards</b> for your professional insight, paid out the way you choose</span></li>
                  <li style={{ '--c': '#F5D08A' }}><Icon name="layers" size={20} /><span><b>Work profile</b> that unlocks better-matched studies</span></li>
                </>
              ) : (
                <>
                  <li style={{ '--c': '#FFC233' }}><Icon name="clipboard" size={20} /><span><b>New invitations</b> waiting in your dashboard</span></li>
                  <li style={{ '--c': '#2EE6CF' }}><Icon name="wallet" size={20} /><span><b>Track & redeem</b> as PayPal, bank transfer, vouchers or gift cards — UPI in India</span></li>
                  <li style={{ '--c': '#B49CFF' }}><Icon name="layers" size={20} /><span><b>Profile surveys</b> that unlock better matches</span></li>
                </>
              )}
            </ul>
          </div>

          <div className={`lx-card ${welcome ? 'is-welcome' : ''}`}>
            <div className="lx-card-head">
              <span className="lx-badge"><Icon name="lock" size={22} /></span>
              <div>
                <h1 id="lx-title">{page.h1}</h1>
                <p>{pro ? 'Log in to see your expert invitations, balance and rewards.' : teen ? 'Log in with the email you registered with. Your parent or guardian must have said yes first.' : 'Log in to see invitations, your balance and rewards.'}</p>
              </div>
            </div>

            {welcome ? <WelcomeSurvey type={welcome.type} name={welcome.name} mail={welcome.mail} demo={welcome.demo} onDone={() => openDashboard(welcome)} /> : null}
            <form ref={formRef} className="lx-form" hidden={Boolean(welcome)} onSubmit={submit} noValidate method="post" action={FORM_ACTION || undefined}>
              <div className={`lx-field ${err('email') ? 'bad' : ''} ${emailOk ? 'good' : ''}`}>
                <Icon name="mail" size={18} />
                <input id="login-email" name="email" type="email" placeholder=" " autoComplete="username" inputMode="email" value={f.email} onChange={(e) => set('email', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} {...aria('email', 'login-email')} />
                <label htmlFor="login-email">Email address</label>
                <span className="lx-tick" aria-hidden="true"><Icon name="check" size={13} stroke={3} /></span>
              </div>
              {err('email') ? <p className="f-err" id="login-email-err" role="alert">{err('email')}</p> : null}

              <div className={`lx-field ${err('password') ? 'bad' : ''} ${pwOk ? 'good' : ''}`}>
                <Icon name="lock" size={18} />
                <input id="login-password" name="password" type={show ? 'text' : 'password'} placeholder=" " autoComplete="current-password" value={f.password} onChange={(e) => set('password', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} {...aria('password', 'login-password')} />
                <label htmlFor="login-password">Password</label>
                <button type="button" className="lx-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}><Icon name="eye" size={18} /></button>
              </div>
              {err('password') ? <p className="f-err" id="login-password-err" role="alert">{err('password')}</p> : null}

              <div className="lx-row2">
                <label className="lx-check">
                  <input type="checkbox" name="remember" checked={f.remember} onChange={(e) => set('remember', e.target.checked)} />
                  <span aria-hidden="true" /> Keep me logged in
                </label>
                {RESET_URL ? <a href={RESET_URL} className="lx-forgot">Forgot password?</a> : <Link to="/forgot-password" className="lx-forgot">Forgot password?</Link>}
              </div>

              <div className={`lx-captcha ${err('captcha') ? 'bad' : ''} ${f.captchaOk ? 'good' : ''}`}>
                <p className="lx-cap-title"><Icon name="shield" size={16} /> Quick security check {f.captchaOk ? <b>Verified</b> : null}</p>
                <Captcha ref={captchaRef} error={err('captcha')} onChange={(ok) => set('captchaOk', ok)} />
              </div>
              <input type="hidden" name="captchaToken" ref={tokenRef} defaultValue="" />

              {msg ? <p className={`lx-msg ${phase === 'success' ? 'ok' : ''}`} role="status">{msg}</p> : null}

              <button type="submit" className={`btn btn-primary btn-lg btn-block lx-submit ${phase}`} disabled={phase === 'sending' || lockLeft > 0}>
                {phase === 'sending' ? <><span className="lx-spin" aria-hidden="true" /> Checking…</> : phase === 'success' ? <>Logged in <Icon name="check" size={18} /></> : lockLeft ? `Try again in ${lockLeft}s` : <>Log in securely <Icon name="arrow" size={18} /></>}
              </button>
            </form>
            <SocialLogin />

            <div className="lx-divider"><span>New to MyFrequentRewards?</span></div>

            
            <Link to={pro ? '/sign-up?type=professional' : teen ? '/sign-up?type=teen' : '/sign-up'} className="btn btn-ghost-dark btn-block lx-join"><Icon name="gift" size={18} /> Create your free account</Link>
            {teen ? <p className="lx-safe"><Icon name="clock" size={14} /> Still waiting for your parent, or need a new password link? <Link to="/forgot-password?type=teen">Get a new link</Link></p> : null}
            <p className="lx-safe"><Icon name="shield" size={14} /> We will never ask for your password by email, SMS or WhatsApp.</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Login;
