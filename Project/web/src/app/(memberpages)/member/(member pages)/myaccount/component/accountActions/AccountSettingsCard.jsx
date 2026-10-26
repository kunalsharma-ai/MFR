import './account-settings-card.css';

const LABELS = { active: 'Active', hold: 'On hold', deactivated: 'Deactivated', pending: 'Request in progress' };

/**
 * "Account Settings" section for the dashboard profile sidebar (place under "Social Contacts").
 * Self-contained styles (prefixed .mfr-acct). Works on the dark sidebar; pass theme="light" for a light sidebar.
 *
 * @param {'active'|'hold'|'deactivated'|'pending'} status
 * @param {string} href          route of the Delete / Deactivate page
 * @param {function} [onNavigate] (event, 'manage'|'reactivate') for SPA routers
 */
export function AccountSettingsCard({ status = 'active', href = '/account/delete-or-deactivate', onNavigate, theme = 'dark' }) {
  const nav = (key) => (onNavigate ? (e) => onNavigate(e, key) : undefined);
  return (
    <div className="mfr-acct" data-status={status} data-theme={theme}>
      <p className="mfr-acct__head">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
        Account Settings
      </p>
      <div className="mfr-acct__status"><span>Account status</span><span className="mfr-acct__state">{LABELS[status] || 'Active'}</span></div>
      {status === 'hold' && (
        <a className="mfr-acct__btn mfr-acct__btn--react" href={`${href}#reactivate`} onClick={nav('reactivate')}>
          <span className="mfr-acct__chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v10M18.36 6.64a9 9 0 1 1-12.73 0" /></svg></span>
          <span className="mfr-acct__txt"><b>Reactivate My Account</b><small>Your account is currently on hold</small></span>
          <svg className="mfr-acct__go" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </a>
      )}
      <a className="mfr-acct__btn mfr-acct__btn--del" href={href} onClick={nav('manage')}>
        <span className="mfr-acct__chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg></span>
        <span className="mfr-acct__txt"><b>Delete or Deactivate Account</b><small>Take a break, hold or delete · Password required</small></span>
        <svg className="mfr-acct__go" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </a>
      {status === 'pending' && <p className="mfr-acct__pending">You have an account request in progress. Track it on the account page.</p>}
    </div>
  );
}
