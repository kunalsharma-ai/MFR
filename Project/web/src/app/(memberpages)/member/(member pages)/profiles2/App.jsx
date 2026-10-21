import { lazy, startTransition, Suspense, useCallback, useEffect, useState } from 'react';
import { useI18n } from './i18n/I18nProvider.jsx';
import { PROFILES } from './data/profiles.generated.js';
import { store } from './lib/storage.js';
import { ui } from './audio/sound.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Hub, { profileStatus } from './components/Hub.jsx';
import LanguagePicker from './components/LanguagePicker.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import FlowSkeleton from './components/FlowSkeleton.jsx';
import LangWipe from './components/LangWipe.jsx';

// The question flow (and its controls) is code-split: the first screen ships less JavaScript.
const loadFlow = () => import('./components/Flow.jsx');
const Flow = lazy(loadFlow);

const parse = () => {
  const m = (typeof location !== 'undefined' ? location.hash : '').match(/^#\/p\/([\w-]+)/);
  return m ? PROFILES.find((p) => p.id === m[1]) || null : null;
};

export default function App() {
  const { t, lang } = useI18n();
  const [route, setRoute] = useState(parse);
  const [langOpen, setLangOpen] = useState(false);
  const [dark, setDark] = useState(() => store.get('mfr:dark', false));
  const [cat, setCatState] = useState(() => store.get('mfr:cat', 'b2c'));
  const setCat = (c) => { setCatState(c); store.set('mfr:cat', c); };
  // The profile grid is rendered right after the first screen, in an interruptible (time-sliced)
  // transition - this keeps the main thread free while the page becomes interactive (low TBT).
  const [hubReady, setHubReady] = useState(false);
  useEffect(() => {
    startTransition(() => setHubReady(true));
    // fetch the question-flow chunk while the browser is idle, so opening a profile is instant
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
    idle(() => loadFlow().catch(() => {}));
    document.documentElement.classList.remove('boot-flow');
  }, []);

  useEffect(() => {
    const h = () => setRoute(parse());
    addEventListener('hashchange', h);
    return () => removeEventListener('hashchange', h);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    store.set('mfr:dark', dark);
  }, [dark]);
  useEffect(() => {
    document.title = route ? `${t('p.' + route.s)} · MyFrequentRewards` : `${t('hero.kicker')} · MyFrequentRewards`;
  }, [route, t]);

  const open = useCallback((p) => {
    ui('open');
    // module first, then route: the profile screen appears in one step (no blank frame in between)
    loadFlow().catch(() => {}).finally(() => {
      location.hash = '#/p/' + p.id;
      scrollTo({ top: 0 });
    });
  }, []);
  // returning from a profile lands on its tab (adults / under 18)
  useEffect(() => { if (route && route.c !== cat) setCat(route.c); }, [route]); // eslint-disable-line react-hooks/exhaustive-deps
  const home = useCallback((e) => {
    e?.preventDefault?.();
    if (location.hash) history.pushState(null, '', location.pathname + location.search);
    setRoute(null);
    requestAnimationFrame(() => document.getElementById('worlds')?.scrollIntoView({ block: 'start' }));
  }, []);
  const nextProfile = useCallback(() => {
    const list = PROFILES.filter((p) => p.c === (route?.c || cat));
    const at = list.findIndex((p) => p.id === route?.id);
    const nxt = [...list.slice(at + 1), ...list.slice(0, at)].find((p) => !profileStatus(p).done);
    if (nxt) open(nxt);
    else home();
  }, [route, cat, open, home]);

  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <Header onLang={() => setLangOpen(true)} dark={dark} onToggleDark={() => setDark(!dark)} onHome={home} />
      <ErrorBoundary resetKey={route?.id || 'home'} onHome={home} labels={{ title: t('err.crashTitle'), sub: t('err.crashSub'), retry: t('err.retry'), home: t('d.hub') }}>
        {route ? (
          <Suspense fallback={<FlowSkeleton meta={route} dark={dark} label={t('q.loading')} />}>
            <Flow key={route.id} meta={route} dark={dark} onHub={home} onNextProfile={nextProfile} />
          </Suspense>
        ) : (
          <main id="main" className="home">
            <Hero onStart={() => document.getElementById('worlds')?.scrollIntoView({ behavior: 'smooth' })} onLang={() => setLangOpen(true)} />
            {hubReady ? <Hub onOpen={open} cat={cat} setCat={setCat} /> : <div className="hub-placeholder" id="worlds" />}
          </main>
        )}
      </ErrorBoundary>
      <LangWipe lang={lang} />
      {/* <footer className="foot">
        <span>{t('foot')}</span>
        <span className="foot-tag">{t('brandTag')}</span>
      </footer> */}
      <LanguagePicker open={langOpen} onClose={() => setLangOpen(false)} />
    </>
  );
}
