import { Navigate } from 'react-router-dom';

// v2.5 — a page that no longer exists (e.g. /who-can-join). Hosts answer with a 301 (vercel.json, public/_redirects,
// public/web.config, server/index.mjs); this client-side fallback covers any host without that rule.
export default function Moved({ to = '/' }) {
  return <Navigate to={to} replace />;
}
