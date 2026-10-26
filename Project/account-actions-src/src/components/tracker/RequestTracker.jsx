import { useRef, useState } from 'react';
import { ACTIONS, CANCELLABLE, FLOW, SLA_SENTENCE, SLA_TEXT, STATUS, TERMINAL, paletteVars } from '../../config/actions.js';
import { useAccount } from '../../context/AccountContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { fmtDate, fmtDateTime } from '../../lib/format.js';
import { sound } from '../../lib/sound.js';
import { Icon } from '../Icon.jsx';
import { Object3D } from '../Object3D.jsx';
import { CopyId } from '../CopyId.jsx';
import mono from '../../assets/mfr-monogram.webp';

const TABS = [
  { id: 'status', label: 'Status', icon: 'clock' },
  { id: 'ticket', label: 'Support ticket', icon: 'ticket' },
  { id: 'emails', label: 'Emails', icon: 'mail' },
];

export function RequestTracker({ showInternal = true }) {
  const { request, requestKey } = useAccount();
  const [tab, setTab] = useState('status');
  const tabRefs = useRef({});
  if (!request || !requestKey) return null;
  const A = ACTIONS[requestKey];
  const st = STATUS[request.status];
  const tabs = showInternal ? TABS : TABS.filter((t) => t.id === 'status');

  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === tab);
    let n = null;
    if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
    if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
    if (n) { e.preventDefault(); setTab(n.id); sound.play('tab'); tabRefs.current[n.id]?.focus(); }
  };

  return (
    <section className="sec" id="mfr-tracker" aria-labelledby="mfr-tr-h">
      <div className="tracker" style={paletteVars(requestKey)}>
        <div className="tr-head">
          <div className="tr-obj"><Object3D k={requestKey} size={46} /></div>
          <div className="tr-title">
            <span className="eyebrow">Your account request</span>
            <h2 id="mfr-tr-h">{A.label}</h2>
            <p>{st.desc}</p>
          </div>
          <div className="tr-id">
            <span className={`pill ${request.status}`}>{st.label}</span>
            <CopyId id={request.id} />
          </div>
        </div>
        {tabs.length > 1 && (
          <div className="tabs" role="tablist" aria-label="Request details" onKeyDown={onKey}>
            {tabs.map((t) => (
              <button key={t.id} ref={(el) => { tabRefs.current[t.id] = el; }} type="button" role="tab" id={`mfr-tab-${t.id}`} aria-controls={`mfr-panel-${t.id}`}
                aria-selected={tab === t.id} tabIndex={tab === t.id ? 0 : -1} className="tab" onClick={() => setTab(t.id)}>
                <Icon name={t.icon} />{t.label}
              </button>
            ))}
          </div>
        )}
        <div className="tabpanel" role="tabpanel" id={`mfr-panel-${tab}`} aria-labelledby={`mfr-tab-${tab}`}>
          {tab === 'status' && <StatusPanel />}
          {tab === 'ticket' && <TicketPanel />}
          {tab === 'emails' && <EmailsPanel />}
        </div>
      </div>
    </section>
  );
}

function StatusPanel() {
  const { request, requestKey, cancel } = useAccount();
  const { toast } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const A = ACTIONS[requestKey];
  const bad = request.status === 'unable_to_process' || request.status === 'cancelled';
  const flowHist = request.history.filter((h) => FLOW.includes(h.status));
  const reached = FLOW.indexOf((flowHist[flowHist.length - 1] || { status: 'submitted' }).status);
  const at = (s) => request.history.find((h) => h.status === s)?.at;

  const doCancel = async () => {
    setBusy(true); setErr('');
    try { await cancel(request.id); sound.play('close'); toast('Your request has been cancelled.', 'x'); setConfirming(false); }
    catch (e) { setErr(e.message || 'Could not cancel the request. Please try again.'); sound.play('error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <ol className="tl">
        {FLOW.map((s, i) => {
          const isBadStep = bad && i === reached + 1;
          const done = i < reached || (i === reached && (request.status === 'completed' || bad));
          const now = !bad && i === reached && request.status !== 'completed';
          const key = isBadStep ? request.status : s;
          const cls = isBadStep ? 'bad' : done ? 'done' : now ? 'now' : '';
          return (
            <li key={s} className={cls} aria-current={now ? 'step' : undefined}>
              <span className="node">{done ? <Icon name="check" /> : isBadStep ? <Icon name="x" /> : i + 1}</span>
              <div><b>{STATUS[key].label}</b><small>{STATUS[key].desc}</small>{at(key) && <time dateTime={at(key)}>{fmtDateTime(at(key))}</time>}</div>
            </li>
          );
        })}
      </ol>
      <dl className="tr-meta">
        <div><dt>Request</dt><dd>{A.type}</dd></div>
        <div><dt>{A.confirmDurationLabel || 'Duration'}</dt><dd>{A.confirmDuration || A.duration}</dd></div>
        <div><dt>Submitted</dt><dd>{fmtDate(request.submittedAt)}</dd></div>
        <div><dt>Estimated completion</dt><dd>{SLA_TEXT}</dd></div>
      </dl>
      <div className="alt-status">Other possible outcomes: <span className="pill unable_to_process">Unable to Process</span><span className="pill cancelled">Cancelled</span></div>
      <div className="tr-actions">
        {CANCELLABLE.includes(request.status) && !confirming && (
          <button type="button" className="btn ghost sm" onClick={() => setConfirming(true)}><Icon name="x" />Cancel request</button>
        )}
        {confirming && (
          <div className="inline-confirm" role="alertdialog" aria-label="Cancel this request?">
            <Icon name="alert" /><span>Cancel this request? No changes will be made to your account.</span>
            <div className="ic-btns">
              <button type="button" className="btn ghost sm" onClick={() => setConfirming(false)} disabled={busy} data-sfx="back">Keep request</button>
              <button type="button" className="btn fill sm danger-fill" onClick={doCancel} disabled={busy} data-sfx="none">{busy ? <span className="spin" /> : null}Yes, cancel it</button>
            </div>
          </div>
        )}
        {!TERMINAL.includes(request.status) && <p className="sla-line">{SLA_SENTENCE}</p>}
      </div>
      {err && <p className="err" role="alert"><Icon name="alert" />{err}</p>}
    </>
  );
}

function TicketPanel() {
  const { request, requestKey, user } = useAccount();
  const A = ACTIONS[requestKey];
  const st = STATUS[request.status];
  const rows = [
    ['Request Type', A.ticketType], ['Request', A.ticketRequest], ['Internal action', A.internal],
    ['User', user.name], ['Email', user.email], ['User ID', user.id],
    ['Password verification', <span className="ok" key="ok"><Icon name="check" />Successfully verified</span>],
    ['Requested Date', fmtDate(request.submittedAt)], ['SLA', '7 working days'], ['Status', st.ticket],
  ];
  return (
    <>
      <div className="ticket">
        <div className="ticket-main">
          <header><b><Icon name="ticket" />Support ticket · <span className="mono">{request.id}</span></b><span className={`pill ${request.status}`}>{st.ticket}</span></header>
          <dl className="kv">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </div>
        <div className="ticket-stub"><small>SLA</small><span className="big">7</span><b>working days</b><span>Created automatically on submission</span></div>
      </div>
      <p className="note"><Icon name="headset" />Internal preview: this is what the Support Team receives. Members never see this view.</p>
    </>
  );
}

function MailFrame({ label, to, subject, pending, children }) {
  return (
    <article className={`mail ${pending ? 'pending' : ''}`}>
      <div className="mail-bar"><i /><i /><i /><span>{label}</span></div>
      {pending && <div className="mail-wait"><Icon name="clock" />Preview. This is sent once Support completes the action.</div>}
      <div className="mail-meta"><span><b>To:</b> {to}</span><span><b>Subject:</b> {subject}</span></div>
      <div className="mail-body">
        <div className="mail-hero"><span className="mc"><img src={mono} alt="" /></span><b>Myfrequent<span>rewards</span></b></div>
        <div className="mail-content">{children}<p className="sig">MyFrequentRewards Support Team</p></div>
      </div>
    </article>
  );
}

function EmailsPanel() {
  const { request, requestKey, user } = useAccount();
  const A = ACTIONS[requestKey];
  const s = request.status;
  let heading = A.completedEmail.heading, rows = A.completedEmail.rows, note = A.completedEmail.note, subj = 'Request completed', label = 'Email 2 · Sent on completion';
  if (s === 'cancelled') { heading = 'Your MyFrequentRewards account request has been cancelled.'; rows = [['Status', 'Cancelled']]; note = 'No changes have been made to your account.'; subj = 'Request cancelled'; label = 'Email 2 · Sent on cancellation'; }
  if (s === 'unable_to_process') { heading = 'We were unable to process your MyFrequentRewards account request.'; rows = [['Status', 'Unable to Process']]; note = 'Our Support Team will contact you with more information.'; subj = 'Update on your request'; label = 'Email 2 · Sent if unable to process'; }
  const Table = ({ r }) => <table><tbody>{r.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>;
  return (
    <div className="emails">
      <MailFrame label="Email 1 · Sent immediately" to={user.email} subject={`Request Received: ${request.id}`}>
        <h4>Request Received</h4>
        <p>We have received your MyFrequentRewards account request.</p>
        <Table r={[['Request ID', request.id], ['Request type', A.emailType], ['Submitted', fmtDate(request.submittedAt)], ['Processing time', 'Up to 7 working days']]} />
        <p>Our Support Team will review and process your request. You will receive another email once the requested action has been completed.</p>
      </MailFrame>
      <MailFrame label={label} to={user.email} subject={`${subj}: ${request.id}`} pending={!TERMINAL.includes(s)}>
        <h4>{heading}</h4>
        <Table r={[['Request ID', request.id], ...rows]} />
        {note && <p>{note}</p>}
      </MailFrame>
    </div>
  );
}
