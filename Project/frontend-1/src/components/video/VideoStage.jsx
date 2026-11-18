import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { askLiveHelp } from '../Common.jsx';
import { YT_CHANNEL } from '../../data/videos.js';

// One video "stage" (v3.0). The same component powers the in-page showcase and the pop-up behind the floating
// YouTube button. Each page passes its own `template`, so the frame, the decoration and the way the key points are
// drawn differ on every page (vault, metro map, receipt, phone, boardroom, passport, shield, film reel, stage,
// chat, on-air TV, magazine, QR scanner, spotlight). The player is "lite": only a poster loads until someone
// presses play, then a privacy-friendly youtube-nocookie iframe replaces it. Animation is transform/opacity only.

export function YtGlyph({ s = 26 }) {
  return (
    <svg viewBox="0 0 28 20" width={s} height={(s * 20) / 28} aria-hidden="true" focusable="false">
      <rect width="28" height="20" rx="5.5" fill="#FF0033" />
      <path d="M11 5.6v8.8l7.6-4.4z" fill="#fff" />
    </svg>
  );
}

function LitePlayer({ yt, title }) {
  const [on, setOn] = useState(false);
  if (on) {
    return (
      <iframe
        className="vs-frame"
        src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }
  return (
    <button type="button" className="vs-poster" onClick={() => setOn(true)} aria-label={`Play video: ${title}`}>
      <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" width="480" height="360" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(ev) => { ev.currentTarget.style.display = 'none'; }} />
      <span className="vs-shade" aria-hidden="true" />
      <span className="vs-play" aria-hidden="true">
        <i className="vs-ring" /><i className="vs-ring vs-ring--2" />
        <span className="vs-core"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg></span>
      </span>
      <span className="vs-cap" aria-hidden="true"><YtGlyph s={22} /> Watch on YouTube</span>
    </button>
  );
}

// Template-specific decoration around the screen. Purely visual (aria-hidden).
function Deco({ t, e }) {
  const pts = e.points || [];
  switch (t) {
    case 'vault':
      return <><i className="vd-ring" /><i className="vd-ring vd-ring--2" />{[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <i key={k} className="vd-coin" style={{ '--k': k }}>★</i>)}</>;
    case 'metro':
      return <svg className="vd-map" viewBox="0 0 600 120" preserveAspectRatio="none"><path className="vd-line" d="M10 90 C120 90 140 30 250 30 S400 95 590 60" /><circle className="vd-train" r="7"><animateMotion dur="7s" repeatCount="indefinite" path="M10 90 C120 90 140 30 250 30 S400 95 590 60" /></circle></svg>;
    case 'boardroom':
      return <><span className="vd-grid" />{[38, 62, 48, 80, 66, 92, 74].map((h, k) => <i key={k} className="vd-bar" style={{ '--h': h / 100, '--k': k }} />)}</>;
    case 'passport':
      return <>{['APAC', 'EUROPE', 'AMERICAS', 'MEA'].map((r, k) => <i key={r} className="vd-stamp" style={{ '--k': k }}><b>{r}</b><small>Welcome</small></i>)}</>;
    case 'shield':
      return <><i className="vd-hex" /><i className="vd-hex vd-hex--2" /><span className="vd-lock"><Icon name="lock" size={26} /></span></>;
    case 'reel':
      return <><i className="vd-spool" /><i className="vd-spool vd-spool--2" /></>;
    case 'stage':
      return <><i className="vd-beam" /><i className="vd-curtain l" /><i className="vd-curtain r" />{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} className="vd-star" style={{ '--k': k }}>★</i>)}</>;
    case 'onair':
      return <><i className="vd-antenna" /><i className="vd-antenna r" /></>;
    case 'qr':
      return <>{['youtube', 'instagram', 'linkedin', 'facebook', 'whatsapp', 'x'].map((ic, k) => <span key={ic} className="vd-orb" style={{ '--k': k }}><Icon name={ic} size={16} /></span>)}</>;
    case 'phone':
      return <>{['cart', 'basket', 'heart', 'mobile', 'card', 'star'].map((ic, k) => <span key={ic} className="vd-sticker" style={{ '--k': k }}><Icon name={ic} size={18} /></span>)}</>;
    case 'magazine':
      return <span className="vd-barcode">{Array.from({ length: 22 }, (_, k) => <i key={k} style={{ '--w': (k * 7) % 3 + 1 }} />)}</span>;
    case 'chat':
      return <span className="vd-typing"><i /><i /><i /></span>;
    case 'receipt':
      return <i className="vd-paper-glow" />;
    default:
      return pts.length ? null : null;
  }
}

// Frame chrome that sits ON the screen (bezels, perforations, finder corners …)
function Frame({ t }) {
  switch (t) {
    case 'reel':
      return <><span className="vf-perf top" /><span className="vf-perf bottom" /></>;
    case 'qr':
    case 'shield':
      return <><span className="vf-corners"><i /><i /><i /><i /></span><span className="vf-laser" /></>;
    case 'onair':
      return <span className="vf-lamp">● ON AIR</span>;
    case 'chat':
      return <span className="vf-bar"><i /><i /><i /><b>MyFrequentRewards · Live</b></span>;
    case 'magazine':
      return <span className="vf-mast">MFR <em>weekly</em></span>;
    case 'phone':
      return <span className="vf-notch" />;
    case 'vault':
      return <>{[0, 1, 2, 3].map((k) => <i key={k} className="vf-bolt" style={{ '--k': k }} />)}</>;
    default:
      return null;
  }
}

function Points({ t, points }) {
  if (!points || !points.length) return null;
  return (
    <ol className={`vs-pts vs-pts--${t}`}>
      {points.map((p, i) => (
        <li key={p} style={{ '--i': i }}>
          <span className="vs-pt-n" aria-hidden="true">{t === 'shield' ? <Icon name="check" size={14} /> : String(i + 1).padStart(2, '0')}</span>
          <span>{p}</span>
        </li>
      ))}
    </ol>
  );
}

function Cta({ cta }) {
  if (!cta) return null;
  if (cta.chat) return <button type="button" className="btn vs-btn" onClick={() => askLiveHelp()}>{cta.label} <Icon name="arrow" size={16} /></button>;
  if (cta.href) return <a className="btn vs-btn" href={cta.href} target="_blank" rel="noopener noreferrer">{cta.label} <Icon name="arrow" size={16} /></a>;
  return <Link className="btn vs-btn" to={cta.to}>{cta.label} <Icon name="arrow" size={16} /></Link>;
}

export default function VideoStage({ e, headingId, as: H = 'h2', inModal = false }) {
  const list = e.more && e.more.length ? e.more : null;
  const [cur, setCur] = useState(list ? list[0].yt : e.yt);
  const t = e.template || 'spotlight';
  const title = `${e.title} ${e.em}`.trim();
  return (
    <div className={`vs vs--${t}${inModal ? ' vs--modal' : ''}`} style={{ '--c1': e.c1, '--c2': e.c2 }}>
      <div className="vs-deco" aria-hidden="true"><Deco t={t} e={e} /></div>
      <div className="vs-info">
        <p className="vs-chip"><YtGlyph s={20} /> {e.eyebrow}</p>
        <H id={headingId} className="vs-title">{e.title} <em>{e.em}</em></H>
        {e.lede ? <p className="vs-lede">{e.lede}</p> : null}
        <Points t={t} points={e.points} />
        <div className="vs-acts">
          <Cta cta={e.cta} />
          <a className="btn vs-sub" href={YT_CHANNEL} target="_blank" rel="noopener noreferrer"><YtGlyph s={20} /> Subscribe</a>
        </div>
      </div>
      <div className="vs-screen-wrap">
        <div className="vs-screen">
          <div className="vs-media"><LitePlayer key={cur} yt={cur} title={title} /></div>
          <span className="vs-frame-deco" aria-hidden="true"><Frame t={t} /></span>
        </div>
        {list ? (
          <div className="vs-list" role="tablist" aria-label="More videos">
            {list.map((m) => (
              <button key={m.yt + m.label} type="button" role="tab" aria-selected={cur === m.yt} className={cur === m.yt ? 'is-on' : ''} onClick={() => setCur(m.yt)}>
                <Icon name="sparkle" size={13} /> {m.label}
              </button>
            ))}
          </div>
        ) : null}
        {t === 'receipt' ? (
          <div className="vs-receipt" aria-hidden="true">
            <b>REWARD RECEIPT</b>
            {(e.points || []).map((p) => <span key={p}><i>{p}</i><em>✓</em></span>)}
            <small>Thank you for your opinion</small>
          </div>
        ) : null}
      </div>
    </div>
  );
}
