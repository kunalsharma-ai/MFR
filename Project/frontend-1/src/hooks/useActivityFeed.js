import { useEffect, useState } from 'react';
import { DEMO_MODE } from '../data/site.js';
import { STATS, SURVEY_CATEGORIES } from '../data/community.js';
import { sanitizeActivity } from '../utils/payouts.js';


const FEED = import.meta.env.VITE_ACTIVITY_FEED_URL || '/api/activity';

let cache = null;

export function agoFrom(at) {
  const t = Date.parse(at);
  if (!t) return '';
  const m = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  return d < 8 ? `${d} day${d > 1 ? 's' : ''} ago` : new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const PULSE = [
  { kind: 'pulse', icon: 'coins', big: `$${STATS.rewardsPaidUsd.toLocaleString('en-US')}+`, line: 'in rewards paid to our members', tone: '#14C9B5' },
  { kind: 'pulse', icon: 'clipboard', big: STATS.surveysCompletedThisMonth.toLocaleString('en-US'), line: 'surveys completed this month', tone: '#14C9B5' },
  { kind: 'pulse', icon: 'user', big: STATS.membersRegistered.toLocaleString('en-US'), line: 'members registered worldwide', tone: '#8B5CF6' },
  ...SURVEY_CATEGORIES.map((s) => ({ kind: 'pulse', icon: s.icon, big: `$${s.reward}`, line: `${s.title} surveys · about ${s.mins} min · open now`, tone: s.tone })),
];

export default function useActivityFeed() {
  const [items, setItems] = useState(cache || []);
  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    (async () => {
      try {
        // Sample activity only — no /api/activity call.
        const m = await import('../data/activityPreview.js');
        const data = m.previewActivity();
        cache = sanitizeActivity(Array.isArray(data) ? data : []).map((it) => ({ ...it, ago: it.ago || agoFrom(it.at) }));
        if (alive) setItems(cache);
      } catch {
        cache = [];
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, []);
  return { items, isPreview: DEMO_MODE, pulse: PULSE };
}

export const initials = (name = '') =>
  name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
