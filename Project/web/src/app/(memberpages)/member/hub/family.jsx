"use client";
// Teen profile: "Your family & registration" (Nov 2026). Shows a Teen what their parent or guardian submitted when
// they said YES: their profile, every onboarding answer, the consent and its choices, how rewards work for the teen,
// and the teen's own registration. Read only: nothing here asks the parent anything again.
//
// Data: GET /api/v1/teen/me/family (api/app/teen/family.js). The server answers only for the signed-in teen whose
// registration it is, and only once the guardian has approved, finished onboarding and given consent and the account
// is active; before that it returns { ready: false, steps } and this panel shows the steps, never partial answers.
// Anything the records do not hold is shown as "Not provided" / "Not recorded", never filled in.
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/util";
import { useMember } from "@/Context";
import Icon from "./icons.jsx";
import { LoadingBlock, ErrorState, Reveal } from "./ui.jsx";
import { useHub } from "./store";
import "./family.css";

/* ---------------- words ---------------- */
const S = {
  title: "Your family & registration",
  sub: "What your parent or guardian told us when they said yes, and how your Teen Panel account was set up.",
  private: "Only you can see this. Your parent's contact details are never shown to anyone else on the panel.",
  waitTitle: "Your parent or guardian's details appear here once everything is done",
  waitSub: "We show them after your parent or guardian has said yes, filled in their form and given consent, and your account is active.",
  step_approved: "Parent or guardian said yes",
  step_onboarding: "Parent or guardian form sent",
  step_consent: "Consent given",
  step_active: "Your account switched on",
  notProvided: "Not provided",
  notApplied: "Didn't apply",
  notRecorded: "Not recorded",
  show: "Show",
  hide: "Hide",
  expandAll: "Open all",
  collapseAll: "Close all",
  // status strip
  chipReg: "Registration",
  chipGuardian: "Guardian",
  chipConsent: "Consent",
  chipRewards: "Rewards",
  active: "Active",
  approved: "Approved",
  given: "Given",
  rewardsOpen: "Open, each one needs a yes",
  rewardsSoon: "Opening soon",
  // 1 guardian
  gTitle: "Parent / guardian profile",
  gSub: "Who gave permission for you to join.",
  gName: "Name",
  gRelation: "Relationship to you",
  gDob: "Date of birth",
  gGender: "Gender",
  gEmail: "Email",
  gPhone: "Mobile number",
  gVerified: "Email confirmed",
  gVerifiedVia: "by opening the secure link we emailed",
  gAuthority: "Legally able to give permission",
  // 2 onboarding
  oTitle: "Parent onboarding answers",
  oSub: "Every question on the parent and guardian form, with the answer they gave.",
  oSent: "Sent",
  oCount: "{a} of {b} answered",
  oHealthNote: "Your parent or guardian chose to skip this optional section. They can answer it later.",
  oHealthPrivate: "These answers are about your health. They are kept apart from everything else and only used to keep unsuitable studies away from you.",
  // 3 rewards
  rTitle: "Rewards & your reward journey",
  rSub: "How you earn, what your parent or guardian agreed to and every reward request they answered.",
  rHow: "How you earn",
  rHow1: "You earn points for profiles, surveys, polls and creative tasks. Teen Panel rewards are points only, never money.",
  rHow2: "Points unlock learning rewards. Every reward you ask for is emailed to your parent or guardian, and it only goes ahead after their yes.",
  rHow3: "Taking part is your choice. You can skip a survey or stop at any time.",
  rNow: "Where you are now",
  rPoints: "Points earned",
  rLevel: "Level",
  rStatus: "Rewards status",
  rAgreed: "What your parent or guardian agreed to about rewards",
  rRequests: "Reward requests and your parent's answers",
  rNoRequests: "No reward requests yet.",
  rViews: "Activity links sent to your parent",
  rViewsNone: "None sent yet",
  rViewsN: "{n} sent, last on {d}",
  rNoQuestions: "The parent form had no questions about reward preferences or expectations, so there are none on file.",
  rq_guardian_pending: "Waiting for your parent",
  rq_approved: "Approved",
  rq_fulfilled: "Delivered",
  rq_rejected: "Not this time",
  rq_cancelled: "Cancelled",
  rq_requested: "Requested",
  dec_yes: "Said yes",
  dec_no: "Said no",
  // 4 consent
  cTitle: "Parent consent & authorisation",
  cSub: "The permission your parent or guardian gave, exactly as recorded.",
  cStatus: "Status",
  cVersion: "Agreement version",
  cAt: "Given on",
  cLang: "Language",
  cRead: "Topics they opened",
  cReadN: "{n} sections",
  cRequired: "Required permissions",
  cOptional: "Extra permissions (optional)",
  cYes: "Agreed",
  cNo: "Not agreed",
  cView: "View the full consent",
  cYours: "Your own agreement at sign-up",
  cMissing: "Not kept by the system",
  nr_consent_receipt: "The receipt number shown on the consent page",
  nr_consent_timezone: "Your parent's time zone when they gave consent (the time is kept)",
  nr_consent_page_version: "The consent page version (the agreement version is kept)",
  dlgTitle: "Consent record",
  dlgDecl: "Declaration",
  dlgChoices: "Permissions",
  dlgPrint: "Print or save as PDF",
  dlgClose: "Close",
  dlgOld: "This consent was given on an earlier version of the agreement, so its declaration text is not shown here.",
  // 5 teen
  tTitle: "Your registration & participation",
  tSub: "The details you gave when you signed up, and each step of your registration.",
  tRef: "Registration reference",
  tName: "Your name",
  tDob: "Date of birth",
  tGender: "Gender",
  tEmail: "Email",
  tPhone: "Mobile number",
  tPlace: "Where you live",
  tLang: "Language",
  tSince: "Member since",
  tWelcome: "Welcome questions",
  tWelcomeDone: "Done",
  tWelcomeTodo: "Not done yet",
  tSteps: "Registration steps",
  by_teen: "you",
  by_guardian: "your parent or guardian",
  by_system: "automatic",
  by_support: "our support team",
  st_initial_registration: "You signed up",
  st_pending_guardian_approval: "Invitation emailed to your parent or guardian",
  st_guardian_approved: "Your parent or guardian said yes",
  st_pending_onboarding: "Parent or guardian form started",
  st_pending_consent: "Parent or guardian form sent",
  st_pending_password: "Consent given",
  st_active: "You set your password and your account switched on",
  st_expired: "Invitation expired",
  st_manual_review: "Checked by our support team",
  loadError: "We couldn't load your family details just now.",
};
const f = (k, v) => String(S[k] ?? k).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m));

const REL = { mother: "Mother", father: "Father", legal_guardian: "Legal guardian" };
const AUTH = { yes: "Yes", no: "No", unsure: "Not sure" };
const fmtDate = (d, withTime) => {
  if (!d) return "";
  const x = new Date(String(d).length === 10 ? `${d}T00:00:00Z` : d);
  if (Number.isNaN(x.getTime())) return String(d);
  return new Intl.DateTimeFormat(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "long", timeZone: String(d).length === 10 ? "UTC" : undefined }).format(x);
};
const langName = (code) => {
  if (!code) return "";
  try { return new Intl.DisplayNames([undefined].filter(Boolean).concat("en"), { type: "language" }).of(code) || code; } catch (e) { return code; }
};
const maskMail = (m = "") => { const [u, d] = String(m).split("@"); return d ? `${u.slice(0, 1)}${"•".repeat(Math.max(1, Math.min(6, u.length - 1)))}@${d}` : m; };
const maskPhone = (p = "") => (p.length > 4 ? `${"•".repeat(Math.max(2, p.length - 4))}${p.slice(-4)}` : p);

/* ---------------- data ---------------- */
function useFamily() {
  const member = useMember();
  return useQuery({
    queryKey: ["teen", "family", member?._id],
    enabled: Boolean(member?._id),
    queryFn: async () => {
      const r = await api.get("/api/v1/teen/me/family");
      if (!r || r.status === "error") throw new Error(r?.message || "request failed");
      return r.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

/* ---------------- small parts ---------------- */
function Field({ label, children, empty }) {
  return (
    <div className="fm-f">
      <dt>{label}</dt>
      <dd className={empty ? "is-empty" : ""}>{empty ? f("notProvided") : children}</dd>
    </div>
  );
}
function Chip({ ok, warn, icon, label, value }) {
  return (
    <li className={`fm-chip ${ok ? "ok" : warn ? "warn" : ""}`}>
      <span className="fm-chip-ic"><Icon name={icon} size={18} /></span>
      <span><small>{label}</small><b>{value}</b></span>
    </li>
  );
}
function Secret({ value, mask, kind }) {
  const [show, setShow] = React.useState(false);
  if (!value) return null;
  return (
    <span className="fm-secret">
      {kind === "mail" && show ? <a href={`mailto:${value}`}>{value}</a> : <span>{show ? value : mask(value)}</span>}
      <button type="button" className="h-link" onClick={() => setShow((s) => !s)} aria-pressed={show}>
        <Icon name={show ? "eyeOff" : "eye"} size={14} /> {show ? f("hide") : f("show")}
      </button>
    </span>
  );
}

// an expandable card: native <details>, so it works with keyboard and screen readers without extra code
function Card({ id, icon, tone, title, sub, status, open, onToggle, children }) {
  return (
    <details className={`fm-card t-${tone}`} id={id} open={open} onToggle={(e) => onToggle(id, e.currentTarget.open)}>
      <summary>
        <span className="fm-card-ic"><Icon name={icon} size={22} /></span>
        <span className="fm-card-tx"><b>{title}</b><small>{sub}</small></span>
        {status ? <span className={`h-state s-${status.state}`}><Icon name={status.state === "done" ? "check" : status.state === "pending" ? "clock" : "spark"} size={14} /> {status.label}</span> : null}
        <span className="fm-chev" aria-hidden="true"><Icon name="arrow" size={18} /></span>
      </summary>
      <div className="fm-body">{children}</div>
    </details>
  );
}

/* ---------------- 1 guardian ---------------- */
function GuardianCard({ d, ...card }) {
  const g = d.guardian;
  const name = [g.firstName, g.middleName, g.lastName].filter(Boolean).join(" ");
  return (
    <Card {...card} icon="users" tone="guardian" title={f("gTitle")} sub={f("gSub")} status={{ state: "done", label: f("approved") }}>
      <div className="fm-id">
        <span className="fm-av" aria-hidden="true">{(g.firstName || "?").slice(0, 1).toUpperCase()}</span>
        <div><b>{name || f("notProvided")}</b><small>{REL[g.relation] || g.relation}</small></div>
      </div>
      <dl className="fm-grid">
        <Field label={f("gName")} empty={!name}>{name}</Field>
        <Field label={f("gRelation")} empty={!g.relation}>{REL[g.relation] || g.relation}</Field>
        <Field label={f("gDob")} empty={!g.dob}>{fmtDate(g.dob)}</Field>
        <Field label={f("gGender")} empty={!g.gender}>{g.gender}</Field>
        <Field label={f("gEmail")} empty={!g.email}><Secret value={g.email} mask={maskMail} kind="mail" /></Field>
        <Field label={f("gPhone")} empty={!g.phone}><Secret value={g.phone ? `+${String(g.phone).replace(/^\+/, "")}` : ""} mask={maskPhone} /></Field>
        <Field label={f("gVerified")} empty={!g.verification?.emailVerifiedAt}>{fmtDate(g.verification?.emailVerifiedAt, true)} <small className="fm-note">{f("gVerifiedVia")}</small></Field>
        <Field label={f("gAuthority")} empty={!g.verification?.authority}>{AUTH[g.verification?.authority] || g.verification?.authority}</Field>
      </dl>
      <p className="fm-private"><Icon name="lock" size={14} /> {f("private")}</p>
    </Card>
  );
}

/* ---------------- 2 onboarding ---------------- */
function Answer({ q }) {
  if (!q.applies) return <dd className="is-empty">{f("notApplied")}</dd>;
  if (!q.answered) return <dd className="is-empty">{f("notProvided")}</dd>;
  const vals = q.format === "date" ? q.display.map((v) => fmtDate(v)) : q.format === "language" ? q.display.map(langName) : q.kind === "phone" ? q.display.map((v) => `+${String(v).replace(/^\+/, "")}`) : q.display;
  return vals.length > 1
    ? <dd><ul className="fm-tags">{vals.map((v) => <li key={v}>{v}</li>)}</ul></dd>
    : <dd>{vals[0]}</dd>;
}
function OnboardingCard({ d, ...card }) {
  const o = d.onboarding;
  const qs = o.sections.flatMap((s) => s.questions);
  const asked = qs.filter((q) => q.applies);
  const answered = asked.filter((q) => q.answered).length;
  const icons = { "About you": "user", "Your household": "home", "Staying in touch": "mail", "Your home": "home" };
  return (
    <Card {...card} icon="book" tone="onboarding" title={f("oTitle")} sub={f("oSub")} status={{ state: "done", label: f("oCount", { a: answered, b: asked.length }) }}>
      <p className="fm-meta"><Icon name="calendar" size={14} /> {f("oSent")} {fmtDate(o.submittedAt, true)}</p>
      <div className="fm-sections">
        {o.sections.map((s, i) => {
          const health = s.health ?? s.optional; // only the teen-health section (older API versions: the one optional section)
          const skipped = health && o.healthSkipped && !s.questions.some((q) => q.answered);
          return (
            <details key={s.name} className="fm-sec" open={i === 0}>
              <summary>
                <Icon name={icons[s.name] || (health ? "heart" : "spark")} size={18} />
                <b>{s.name}</b>
                <small>{f("oCount", { a: s.questions.filter((q) => q.applies && q.answered).length, b: s.questions.filter((q) => q.applies).length })}</small>
              </summary>
              {health ? <p className="fm-note fm-health"><Icon name="shield" size={14} /> {skipped ? f("oHealthNote") : f("oHealthPrivate")}</p> : null}
              <dl className="fm-qa">
                {s.questions.map((q) => (
                  <div key={q.n} className="fm-q">
                    <dt>{q.q}</dt>
                    <Answer q={q} />
                  </div>
                ))}
              </dl>
            </details>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- 3 rewards ---------------- */
function RewardsCard({ d, ...card }) {
  const hub = useHub();
  const tp = hub.teen?.data;
  const r = d.rewards;
  // the consent statements that talk about rewards, as they were recorded
  const decl = (d.consent.document?.declaration || []).filter((x) => /reward/i.test(x));
  const st = r.redemptionsOpen ? f("rewardsOpen") : f("rewardsSoon");
  return (
    <Card {...card} icon="gift" tone="rewards" title={f("rTitle")} sub={f("rSub")} status={{ state: r.redemptionsOpen ? "done" : "pending", label: st }}>
      <div className="fm-two">
        <section>
          <h4 className="fm-h4"><Icon name="target" size={16} /> {f("rHow")}</h4>
          <ol className="fm-journey">
            <li><span>1</span>{f("rHow1")}</li>
            <li><span>2</span>{f("rHow2")}</li>
            <li><span>3</span>{f("rHow3")}</li>
          </ol>
        </section>
        <section>
          <h4 className="fm-h4"><Icon name="trophy" size={16} /> {f("rNow")}</h4>
          <dl className="fm-grid one">
            <Field label={f("rPoints")} empty={!tp}>{tp ? new Intl.NumberFormat().format(tp.points?.earned || 0) : ""}</Field>
            <Field label={f("rLevel")} empty={!tp?.level}>{tp?.level ? `L${tp.level.level} · ${tp.level.name}` : ""}</Field>
            <Field label={f("rStatus")}>{st}</Field>
            <Field label={f("rViews")}>{r.viewLinks.sent ? f("rViewsN", { n: r.viewLinks.sent, d: fmtDate(r.viewLinks.lastAt) }) : f("rViewsNone")}</Field>
          </dl>
        </section>
      </div>
      {decl.length ? (
        <section>
          <h4 className="fm-h4"><Icon name="shield" size={16} /> {f("rAgreed")}</h4>
          <ul className="fm-quotes">{decl.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      ) : null}
      <section>
        <h4 className="fm-h4"><Icon name="stack" size={16} /> {f("rRequests")}</h4>
        {r.requests.length ? (
          <ul className="fm-reqs">
            {r.requests.map((q) => (
              <li key={q.reference}>
                <span className="fm-req-tx"><b>{q.title || q.reference}</b><small>{new Intl.NumberFormat().format(q.points)} pts · {fmtDate(q.requestedAt)}</small></span>
                <span className={`h-state s-${q.status === "fulfilled" || q.status === "approved" ? "done" : q.status === "guardian_pending" ? "pending" : "locked"}`}>{f(`rq_${q.status}`)}</span>
                {q.guardian.decision ? <small className="fm-note">{f(`dec_${q.guardian.decision}`)} · {fmtDate(q.guardian.at)}</small> : null}
              </li>
            ))}
          </ul>
        ) : <p className="fm-note">{f("rNoRequests")}</p>}
      </section>
      {d.notRecorded.includes("reward_questions") ? <p className="fm-missing"><Icon name="alert" size={14} /> {f("rNoQuestions")}</p> : null}
    </Card>
  );
}

/* ---------------- 4 consent ---------------- */
// a clean copy of the consent record in a new tab, for printing or saving as PDF (text escaped, no scripts)
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function printRecord(d) {
  const c = d.consent.guardian;
  const g = d.guardian;
  const row = (k, v) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(f("dlgTitle"))} ${esc(d.reference)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#111;max-width:760px;margin:32px auto;padding:0 16px}h1{font-size:20px}h2{font-size:15px;margin-top:22px}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;vertical-align:top}th{width:38%;color:#555;font-weight:600}
li{margin:4px 0}.y{color:#067a4a;font-weight:700}.n{color:#777;font-weight:700}</style></head><body>
<h1>${esc(f("dlgTitle"))}</h1><table>
${row(f("tRef"), d.reference)}${row(f("cVersion"), c.version)}${row(f("cAt"), fmtDate(c.acceptedAt, true))}
${row(f("gName"), [g.firstName, g.middleName, g.lastName].filter(Boolean).join(" ") + " (" + (REL[g.relation] || g.relation) + ")")}
${row(f("tName"), [d.teen.firstName, d.teen.lastName].filter(Boolean).join(" "))}${row(f("cLang"), langName(c.language) || f("notRecorded"))}
${row(f("cRead"), c.sectionsRead.length ? c.sectionsRead.join(", ") : f("notRecorded"))}</table>
<h2>${esc(f("dlgDecl"))}</h2>${d.consent.document?.declaration ? `<ol>${d.consent.document.declaration.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : `<p>${esc(f("dlgOld"))}</p>`}
<h2>${esc(f("dlgChoices"))}</h2><ul>${c.statements.map((s) => `<li><span class="${s.accepted ? "y" : "n"}">${esc(s.accepted ? f("cYes") : f("cNo"))}</span> ${s.title ? `<b>${esc(s.title)}</b>: ` : ""}${esc(s.text)}</li>`).join("")}</ul>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open(); w.document.write(html); w.document.close();
  w.focus(); setTimeout(() => w.print(), 250);
}
function ConsentDialog({ d, onClose }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal?.();
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  const c = d.consent.guardian;
  const g = d.guardian;
  return (
    <dialog ref={ref} className="fm-dlg" aria-labelledby="fm-dlg-t" onClose={onClose}>
      <header>
        <h3 id="fm-dlg-t"><Icon name="shield" size={20} /> {f("dlgTitle")}</h3>
        <button type="button" className="h-icon-btn" onClick={onClose} aria-label={f("dlgClose")}><Icon name="close" size={18} /></button>
      </header>
      <div className="fm-dlg-body">
        <dl className="fm-grid">
          <Field label={f("tRef")}>{d.reference}</Field>
          <Field label={f("cVersion")}>{c.version}{d.consent.document?.effective ? ` (${fmtDate(d.consent.document.effective)})` : ""}</Field>
          <Field label={f("cAt")}>{fmtDate(c.acceptedAt, true)}</Field>
          <Field label={f("gName")}>{[g.firstName, g.lastName].filter(Boolean).join(" ")} · {REL[g.relation] || g.relation}</Field>
          <Field label={f("cLang")} empty={!c.language}>{langName(c.language)}</Field>
          <Field label={f("cRead")}>{c.sectionsRead.length ? f("cReadN", { n: c.sectionsRead.length }) : f("notRecorded")}</Field>
        </dl>
        <h4 className="fm-h4">{f("dlgDecl")}</h4>
        {d.consent.document?.declaration ? <ol className="fm-decl">{d.consent.document.declaration.map((x) => <li key={x}>{x}</li>)}</ol> : <p className="fm-note">{f("dlgOld")}</p>}
        <h4 className="fm-h4">{f("dlgChoices")}</h4>
        <ul className="fm-perms">{c.statements.map((s) => <Perm key={s.id} s={s} />)}</ul>
      </div>
      <footer>
        <button type="button" className="h-btn h-btn-soft" onClick={() => printRecord(d)}><Icon name="book" size={16} /> {f("dlgPrint")}</button>
        <button type="button" className="h-btn h-btn-primary" onClick={onClose}>{f("dlgClose")}</button>
      </footer>
    </dialog>
  );
}
function Perm({ s }) {
  return (
    <li className={s.accepted ? "yes" : "no"}>
      <span className="fm-tick" aria-hidden="true"><Icon name={s.accepted ? "check" : "close"} size={14} /></span>
      <span>
        {s.title ? <b>{s.title}</b> : null}
        <small>{s.text}</small>
      </span>
      <em>{s.accepted ? f("cYes") : f("cNo")}</em>
    </li>
  );
}
function ConsentCard({ d, ...card }) {
  const [view, setView] = React.useState(false);
  const c = d.consent.guardian;
  const req = c.statements.filter((s) => s.required);
  const opt = c.statements.filter((s) => !s.required);
  const missing = d.notRecorded.filter((k) => k.startsWith("consent_"));
  const close = React.useCallback(() => setView(false), []);
  return (
    <Card {...card} icon="shield" tone="consent" title={f("cTitle")} sub={f("cSub")} status={{ state: "done", label: f("given") }}>
      <dl className="fm-grid">
        <Field label={f("cStatus")}><span className="h-state s-done"><Icon name="check" size={14} /> {f("given")}</span></Field>
        <Field label={f("cAt")}>{fmtDate(c.acceptedAt, true)}</Field>
        <Field label={f("cVersion")}>{c.version}</Field>
        <Field label={f("cLang")} empty={!c.language}>{langName(c.language)}</Field>
        <Field label={f("cRead")}>{c.sectionsRead.length ? f("cReadN", { n: c.sectionsRead.length }) : f("notRecorded")}</Field>
      </dl>
      <h4 className="fm-h4"><Icon name="lock" size={16} /> {f("cRequired")}</h4>
      <ul className="fm-perms">{req.map((s) => <Perm key={s.id} s={s} />)}</ul>
      {opt.length ? <><h4 className="fm-h4"><Icon name="sliders" size={16} /> {f("cOptional")}</h4><ul className="fm-perms">{opt.map((s) => <Perm key={s.id} s={s} />)}</ul></> : null}
      <div className="fm-actions">
        <button type="button" className="h-btn h-btn-primary" onClick={() => setView(true)}><Icon name="eye" size={16} /> {f("cView")}</button>
      </div>
      {d.consent.teen ? (
        <details className="fm-sec">
          <summary><Icon name="user" size={18} /><b>{f("cYours")}</b><small>{d.consent.teen.version} · {fmtDate(d.consent.teen.acceptedAt)}</small></summary>
          <ul className="fm-perms">{d.consent.teen.statements.map((s) => <Perm key={s.id} s={s} />)}</ul>
        </details>
      ) : null}
      {missing.length ? (
        <div className="fm-missing">
          <b><Icon name="alert" size={14} /> {f("cMissing")}</b>
          <ul>{missing.map((k) => <li key={k}>{f(`nr_${k}`)}</li>)}</ul>
        </div>
      ) : null}
      {view ? <ConsentDialog d={d} onClose={close} /> : null}
    </Card>
  );
}

/* ---------------- 5 teen ---------------- */
function TeenCard({ d, ...card }) {
  const t = d.teen;
  const name = [t.firstName, t.middleName, t.lastName].filter(Boolean).join(" ");
  const place = [t.location.city, t.location.state, t.location.countryName].filter(Boolean).join(", ") + (t.location.zip ? ` ${t.location.zip}` : "");
  const gender = t.gender === "Self-describe" && t.genderSelf ? t.genderSelf : t.gender;
  return (
    <Card {...card} icon="id" tone="teen" title={f("tTitle")} sub={f("tSub")} status={{ state: "done", label: f("active") }}>
      <dl className="fm-grid">
        <Field label={f("tRef")}>{d.reference}</Field>
        <Field label={f("tName")} empty={!name}>{name}</Field>
        <Field label={f("tDob")} empty={!t.dob}>{fmtDate(t.dob)}</Field>
        <Field label={f("tGender")} empty={!gender}>{gender}</Field>
        <Field label={f("tEmail")} empty={!t.email}>{t.email}</Field>
        <Field label={f("tPhone")} empty={!t.phone}>{t.phone ? `+${String(t.phone).replace(/^\+/, "")}` : ""}</Field>
        <Field label={f("tPlace")} empty={!place.trim()}>{place}</Field>
        <Field label={f("tLang")} empty={!t.language}>{langName(t.language)}</Field>
        <Field label={f("tSince")} empty={!d.registration.activatedAt}>{fmtDate(d.registration.activatedAt)}</Field>
        <Field label={f("tWelcome")}>{d.registration.welcomeDoneAt ? `${f("tWelcomeDone")} · ${fmtDate(d.registration.welcomeDoneAt)}` : f("tWelcomeTodo")}</Field>
      </dl>
      <h4 className="fm-h4"><Icon name="clock" size={16} /> {f("tSteps")}</h4>
      <ol className="fm-time">
        {d.registration.timeline.map((h, i) => (
          <li key={`${h.status}-${i}`} style={{ "--i": i }}>
            <span className="fm-dot" aria-hidden="true"><Icon name="check" size={12} /></span>
            <span><b>{f(`st_${h.status}`)}</b><small>{fmtDate(h.at, true)}{h.by ? ` · ${f(`by_${h.by}`)}` : ""}</small></span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ---------------- the panel ---------------- */
const CARDS = ["fm-guardian", "fm-onboarding", "fm-rewards", "fm-consent", "fm-teen"];
export default function FamilyPanel() {
  const q = useFamily();
  const [open, setOpen] = React.useState({ "fm-guardian": true });
  const toggle = React.useCallback((id, v) => setOpen((o) => (o[id] === v ? o : { ...o, [id]: v })), []);
  const all = CARDS.every((id) => open[id]);
  const head = (
    <header className="pf-sec-h fm-head">
      <h2 id="fm-t" className="pf-h"><Icon name="users" size={20} /> {f("title")}</h2>
      <p>{f("sub")}</p>
    </header>
  );
  if (q.isLoading) return <section className="fm" aria-labelledby="fm-t">{head}<LoadingBlock lines={4} h={220} /></section>;
  if (q.isError) return <section className="fm" aria-labelledby="fm-t">{head}<ErrorState text={f("loadError")} onRetry={q.refetch} /></section>;
  const d = q.data;
  if (!d?.ready) {
    const steps = d?.steps || {};
    return (
      <section className="fm" aria-labelledby="fm-t">
        {head}
        <div className="fm-wait">
          <span className="fm-card-ic"><Icon name="hourglass" size={22} /></span>
          <div>
            <b>{f("waitTitle")}</b>
            <p>{f("waitSub")}</p>
            <ul className="fm-steps">
              {["approved", "onboarding", "consent", "active"].map((k) => (
                <li key={k} className={steps[k] ? "ok" : ""}><Icon name={steps[k] ? "check" : "clock"} size={14} /> {f(`step_${k}`)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }
  const card = (id) => ({ id, open: Boolean(open[id]), onToggle: toggle });
  return (
    <section className="fm" aria-labelledby="fm-t">
      <div className="fm-top">
        {head}
        <button type="button" className="h-btn h-btn-soft" onClick={() => setOpen(all ? {} : Object.fromEntries(CARDS.map((id) => [id, true])))}>
          <Icon name="layers" size={16} /> {all ? f("collapseAll") : f("expandAll")}
        </button>
      </div>
      <ul className="fm-chips" aria-label={f("title")}>
        <Chip ok icon="id" label={f("chipReg")} value={f("active")} />
        <Chip ok icon="users" label={f("chipGuardian")} value={`${f("approved")} · ${fmtDate(d.registration.decision.at)}`} />
        <Chip ok icon="shield" label={f("chipConsent")} value={`${f("given")} · ${d.consent.guardian.version}`} />
        <Chip ok={d.rewards.redemptionsOpen} warn={!d.rewards.redemptionsOpen} icon="gift" label={f("chipRewards")} value={d.rewards.redemptionsOpen ? f("rewardsOpen") : f("rewardsSoon")} />
      </ul>
      <div className="fm-cards">
        <Reveal><GuardianCard d={d} {...card("fm-guardian")} /></Reveal>
        <Reveal delay={40}><OnboardingCard d={d} {...card("fm-onboarding")} /></Reveal>
        <Reveal delay={80}><RewardsCard d={d} {...card("fm-rewards")} /></Reveal>
        <Reveal delay={120}><ConsentCard d={d} {...card("fm-consent")} /></Reveal>
        <Reveal delay={160}><TeenCard d={d} {...card("fm-teen")} /></Reveal>
      </div>
    </section>
  );
}
