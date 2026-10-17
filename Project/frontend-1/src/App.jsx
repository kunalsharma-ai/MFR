import { useContext, useEffect, useReducer } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { PAGE_ROUTES, PagesContext } from './router/pages.js';
import { useGuestRedirect } from './utils/session.js';


function RoutePage({ name, props }) {
  const reg = useContext(PagesContext);
  const [, force] = useReducer((x) => x + 1, 0);
  const C = reg.get(name);
  // Logged-in members never see Log in / Sign up (incl. via browser Back/Forward) — they go to the dashboard.
  useGuestRedirect(name === 'Login' || name === 'SignUp');
  useEffect(() => {
    if (!C) reg.load(name).then(force).catch(() => window.location.reload());
  }, [name, C, reg]);
  if (!C) return <div className="page-loading" role="status" aria-label="Loading page"><span /><span /><span /></div>;
  return <C {...props} />;
}


function useLegacyEntryLinks() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (pathname !== '/' || !search) return;
    const q = new URLSearchParams(search);
    if (q.has('signup')) {
      q.delete('signup');
      const rest = q.toString();
      navigate(`/sign-up${rest ? `?${rest}` : ''}`, { replace: true });
    } else if (q.has('login')) {
      navigate('/login', { replace: true });
    }
  }, [pathname, search, navigate]);
}

export default function App() {
  useLegacyEntryLinks();
  return (
    <Layout>
      <Routes>
        {PAGE_ROUTES.map((r) => (
          <Route key={r.path} path={r.path} element={<RoutePage key={r.path} name={r.page} props={r.props} />} />
        ))}
      </Routes>
    </Layout>
  );
}
