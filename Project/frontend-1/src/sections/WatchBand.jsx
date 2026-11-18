import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import VideoStage, { YtGlyph } from '../components/video/VideoStage.jsx';
import SoundToggle from '../components/ui/SoundToggle.jsx';
import { videoFor, YT_CHANNEL } from '../data/videos.js';
import { pop } from '../utils/sound.js';

// "Watch this page" band (v3.0) — the last section of every page, just above the footer. It shows the same video
// stage as the floating YouTube button (each page keeps its own design) and asks viewers to like, subscribe,
// share and comment on YouTube.
const NAMES = { home: 'MyFrequentRewards', how: 'How it works', rewards: 'Rewards & payouts', consumers: 'Surveys for consumers', pros: 'Surveys for professionals', who: 'Who can join', trust: 'Trust & safety', about: 'About us', reviews: 'Ratings & reviews', faq: 'The FAQ', contact: 'Contact & support', blog: 'Our blogs', connect: 'Scan & Connect', default: 'This page' };

export default function WatchBand() {
  const { pathname } = useLocation();
  const e = videoFor(pathname);
  const [shared, setShared] = useState(false);
  const yt = (e.more && e.more[0] && e.more[0].yt) || e.yt;
  const videoUrl = `https://youtu.be/${yt}`;
  const share = async () => {
    pop({ volume: 0.14 });
    try {
      if (navigator.share) { await navigator.share({ title: `${e.title} ${e.em}`, url: videoUrl }); return; }
      await navigator.clipboard.writeText(videoUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } catch { /* cancelled */ }
  };
  const acts = [
    { k: 'like', ic: '👍', t: 'Like', d: 'Tell us it helped', href: videoUrl, c: '#2F6BFF' },
    { k: 'sub', ic: '🔔', t: 'Subscribe', d: 'New tips every month', href: `${YT_CHANNEL}?sub_confirmation=1`, c: '#FF0033' },
    { k: 'share', ic: '↗', t: shared ? 'Link copied' : 'Share', d: 'Send it to a friend', onClick: share, c: '#14C9B5' },
    { k: 'comment', ic: '💬', t: 'Comment', d: 'Ask us anything', href: videoUrl, c: '#8B5CF6' },
  ];
  return (
    <section className={`wb wb--${e.template}`} aria-labelledby="wb-h" style={{ '--c1': e.c1, '--c2': e.c2 }}>
      <div className="container">
        <header className="wb-head">
          <p className="wb-kick"><span className="wb-live" aria-hidden="true" /> Short on time? Watch it instead</p>
          <h2 id="wb-h">{NAMES[e.id] || 'This page'}, <em>in one short video.</em></h2>
          <p className="wb-sub">Everything on this page, explained in a few minutes. Press play, then like, subscribe and share if it helped.</p>
          <SoundToggle className="wb-snd" />
        </header>
        <VideoStage e={e} as="h3" />
        <ul className="wb-acts" aria-label="Support us on YouTube">
          {acts.map((a, i) => (
            <li key={a.k} style={{ '--c': a.c, '--i': i }}>
              {a.href ? (
                <a href={a.href} target="_blank" rel="noopener noreferrer" onClick={() => pop({ volume: 0.14 })}>
                  <span className="wb-ic" aria-hidden="true">{a.ic}</span><b>{a.t}</b><small>{a.d}</small>
                </a>
              ) : (
                <button type="button" onClick={a.onClick}>
                  <span className="wb-ic" aria-hidden="true">{a.ic}</span><b>{a.t}</b><small>{a.d}</small>
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="wb-yt"><YtGlyph s={22} /> <a href={YT_CHANNEL} target="_blank" rel="noopener noreferrer">youtube.com/@MyFrequentRewards</a></p>
      </div>
    </section>
  );
}
