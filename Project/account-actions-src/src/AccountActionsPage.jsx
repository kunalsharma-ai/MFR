import { useEffect, useMemo, useRef, useState } from 'react';
import './styles/index.css';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { AccountProvider, useAccount } from './context/AccountContext.jsx';
import { Background } from './components/Background.jsx';
import { Header } from './components/Header.jsx';
import { DangerZone, FlowRail, GoneState, Hero, OptionsSection, ReactivateBanner } from './components/Sections.jsx';
import { RequestTracker } from './components/tracker/RequestTracker.jsx';
import { ActionModal } from './components/modal/ActionModal.jsx';
import { Icon } from './components/Icon.jsx';
import { runFx } from './lib/fx.js';
import { useReducedMotion } from './hooks/index.js';

const DEFAULT_LINKS = { dashboard: '/dashboard', account: '/dashboard/account', support: '/contact' };

/**
 * Delete / Deactivate My Account page.
 *
 * @param {object}  props.api            createHttpApi() for production or createMockApi() for preview
 * @param {object}  props.user           { name, email, id, points?, pointsValue? }
 * @param {object}  [props.links]        { dashboard, account, support, onNavigate?(event, key) } for SPA routers
 * @param {boolean} [props.showDevTools] show the preview-only "Demo" Support simulator
 * @param {boolean} [props.showInternalPreviews] show Support-ticket and email tabs in the tracker (preview only)
 * @param {'light'|'dark'} [props.theme] force a theme (otherwise: saved choice → system preference)
 * @param {boolean} [props.fullPage]     render the page header/background (false = embed inside an existing dashboard shell)
 */
export default function AccountActionsPage({ api, user, links, showDevTools = false, showInternalPreviews = false, theme, fullPage = true, showHeader = true, soundDefault = true }) {
  const rootRef = useRef(null);
  const l = useMemo(() => ({ ...DEFAULT_LINKS, ...links }), [links]);
  return (
    <AppProvider rootRef={rootRef} forcedTheme={theme} soundDefault={soundDefault}>
      <AccountProvider api={api} user={user}>
        <Root rootRef={rootRef} links={l} showDevTools={showDevTools} showInternalPreviews={showInternalPreviews} fullPage={fullPage} showHeader={showHeader} />
      </AccountProvider>
    </AppProvider>
  );
}

function Root({ rootRef, links, showDevTools, showInternalPreviews, fullPage, showHeader }) {
  const { theme, lockMood, setBaseMood } = useApp();
  const { account, loading, error, refresh, requestKey } = useAccount();
  const [open, setOpen] = useState(null);
  const fxRef = useRef(null);
  const rm = useReducedMotion();

  // Base mood follows the account state (green when on hold, red when deleted).
  useEffect(() => { setBaseMood(account.status === 'hold' ? 'react' : account.status === 'deleted' ? 'del' : 'mfr'); }, [account.status, setBaseMood]);

  // Keep the host page background in step with the theme when rendered full page.
  useEffect(() => {
    if (!fullPage) return;
    const b = document.body; const prev = b.style.background;
    b.style.background = theme === 'light' ? '#FFFFFF' : '#050B2C';
    document.documentElement.style.colorScheme = theme;
    return () => { b.style.background = prev; };
  }, [theme, fullPage]);

  // Celebrate when Support completes a request (fired by the demo tools, or by your realtime layer).
  useEffect(() => {
    let stop = () => {};
    const on = (e) => { if (!rm) { stop(); stop = runFx(fxRef.current, e.detail || requestKey, null); } };
    window.addEventListener('mfr:completed', on);
    return () => { window.removeEventListener('mfr:completed', on); stop(); };
  }, [requestKey, rm]);

  const select = (k) => { setOpen(k); lockMood(k); };
  const closeModal = () => { setOpen(null); lockMood(null); };
  const track = () => requestAnimationFrame(() => document.getElementById('mfr-tracker')?.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' }));

  const gone = account.status === 'deleted';

  return (
    <div className={`mfr ${fullPage ? 'full' : 'embedded'}`} data-theme={theme} ref={rootRef}>
      <Background />
      {fullPage && showHeader && <Header links={links} showDevTools={showDevTools} />}
      <main className="wrap" id="mfr-main">
        <Hero />
        {error && (
          <div className="load-err" role="alert"><Icon name="alert" /><span>{error}</span><button type="button" className="btn ghost sm" onClick={refresh}><Icon name="refresh" />Try again</button></div>
        )}
        <RequestTracker showInternal={showInternalPreviews} />
        {gone ? <GoneState /> : (
          <>
            <ReactivateBanner onSelect={select} />
            <OptionsSection onSelect={select} />
            <DangerZone onSelect={select} />
          </>
        )}
        <FlowRail />
      </main>
      <footer className="foot">
        <div className="wrap foot-in">
          <span>© {new Date().getFullYear()} MyFrequentRewards · Rewarding loyalty. Enriching everyday.</span>
          <span>Changed your mind? <a href={links.dashboard} onClick={links.onNavigate ? (e) => links.onNavigate(e, 'dashboard') : undefined}>Return to your dashboard</a> · <a href={links.support} onClick={links.onNavigate ? (e) => links.onNavigate(e, 'support') : undefined}>Contact Support</a></span>
        </div>
      </footer>
      {loading && <span className="sr-only" role="status">Loading your account…</span>}
      {open && <ActionModal k={open} onClose={closeModal} onTrack={track} links={links} showDemoHint={showDevTools} />}
      <canvas ref={fxRef} className="fx page-fx" aria-hidden="true" />
    </div>
  );
}
