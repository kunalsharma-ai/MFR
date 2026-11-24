"use client";
// Round 9 (Kunal, 24 Nov 2026): the Parent Section of the Teen's My Profile.
//
//   hero        "Two steps, and <teen> is in." in the look of Kunal's parent onboarding page, with the parent's progress
//   journey     who does what, in order: 1 parent onboarding, 2 parent consent, 3 the Teen's basic profiles, 4 surveys
//   three cards Parent onboarding form · Reward system · Parental consent, each with its own world art, animation and status
//   sheets      each card opens a full form in a dialog:
//                 onboarding  every question of the parent onboarding form (mfr-minor-suite v2.0.0), one section per
//                             step, with validation, save-and-continue, a review page and a sent confirmation
//                 rewards     how a Teen earns and uses rewards, from the platform's own rules and live settings, the
//                             Teen's live progress, and the parent's own reward questions (I01–I09)
//                 consent     the whole minor consent (agreement MINOR-2026.10): parts A to D, the six permissions, the
//                             Teen's own decision and a send checklist, then a confirmation
// Nothing is filled in for the parent. Drafts stay on this device (one record per Teen) until sent; once the parent has
// finished on the secure link we email them, the server's record (GET /teen/me/family) is shown instead.
import React from "react";
import Link from "next/link";
import Icon from "../icons.jsx";
import { useHub } from "../store";
import { useEngage } from "../engage/data";
import { fmt } from "../data";
import { play } from "../sound";
import { useMember } from "@/Context";
import { PARENT_ONBOARDING as PO, PARENT_REWARDS as PR, CONSENT as CS } from "./teenForms";
import { COUNTRIES, PHONE, LANGS } from "./parentGeo";
import { useFamily, useParentForms, useParentStatus, sendParentForm, PARENT_FORMS_LIVE } from "./parentStore";

/* ---------------- words ---------------- */
const S = {
  kicker: "For {name}'s parent or guardian",
  heroA: "Two steps, and",
  heroB: "is in.",
  heroSub: "{name} has asked to join the MyFrequentRewards research panel. Before anything starts we need to know who you are and we need your permission. About five minutes.",
  chipYou: "About you", chipPerm: "Your permission", chipTime: "About 5 minutes",
  heroNote: "Nothing is switched on until you say yes.",
  parentPart: "Parent or guardian", teenPart: "{name}",
  j1: "Parent onboarding", j1s: "Who you are and how to reach you",
  j2: "Parental consent", j2s: "Read the terms and give permission",
  j3: "Basic profiles", j3s: "{name} answers about themselves",
  j4: "Surveys open", j4s: "{name} can take part and earn",
  st_new: "Not started", st_draft: "In progress", st_submitted: "Sent", st_verified: "Verified", st_info: "Read any time",
  c1: "Parent onboarding form", c1s: "About you, your household and how to reach you. {n} questions in {m} parts.",
  c2: "Reward system", c2s: "How {name} earns, how rewards are worked out and credited, and your say in every reward.",
  c3: "Parental consent", c3s: "The full agreement: what is collected, how it is used and shared, and your permissions.",
  open: "Open", continue: "Continue", review: "Review", close: "Close",
  w1: "Hearth", w2: "Treasury", w3: "The seal",
  saved: "Saved on this device", savedAt: "Saved {t}",
  next: "Save and continue", back: "Back", toReview: "Review my answers", edit: "Edit", send: "Send", sending: "Sending…",
  stepOf: "Part {i} of {n}", required: "Required", optional: "Optional",
  errReq: "Please answer this question.", errEmail: "Please enter a valid email address.", errPhone: "Please enter a valid mobile number for {c}.",
  errAdult: "The parent or guardian must be 18 or older.", errDate: "Please pick a valid date.", errGate: "Only a parent or a legally authorised guardian can give this permission, so the form cannot continue.",
  errSection: "{n} question(s) still need an answer.", errSend: "We couldn't send it just now. Your answers are kept; please try again.",
  whoTitle: "Before you start", who: "I am {name}'s parent or legal guardian, and I am filling this in myself.",
  first: "First name", middle: "Middle name", last: "Last name", specify: "Please tell us",
  pickCountry: "Choose a country", pickRegion: "Choose a state or region", pickLang: "Choose a language", typeRegion: "Type your state or region",
  dial: "Code", number: "Mobile number", choose: "Choose as many as apply",
  healthStart: "Answer these questions", healthSkip: "Skip this optional part",
  reviewTitle: "Check everything before you send", reviewSub: "You can change any part. Nothing is sent until you press Send.",
  notAnswered: "Not answered", skipped: "Skipped (optional)",
  sentTitle: "Thank you, it's sent", sentSub: "Your onboarding form is saved as one record. If you change something later, the same record is updated.",
  sentConsentTitle: "Sent! One key to go", sentConsentSub: "We're confirming the parent or guardian's contact. The account unlocks as soon as permission is verified.",
  offTitle: "Sending from this page opens soon",
  offSub: "Your answers are saved on this device. Until sending opens here, please finish on the secure link we emailed you.",
  fromServer: "Received from your secure link on {d}. To change anything, contact support@myfrequentrewards.com.",
  // rewards
  rJourney: "The reward journey",
  rj1: "Take part", rj1s: "Profiles, surveys, the daily poll and monthly challenges",
  rj2: "Points added", rj2s: "Each finished activity adds its points",
  rj3: "Level up", rj3s: "Points add up into levels that never go down",
  rj4: "Choose a reward", rj4s: "From the reward list, once there are enough points",
  rj5: "You say yes", rj5s: "Every reward request is emailed to you first",
  rj6: "Delivered", rj6s: "Only after your yes",
  rNow: "{name} right now", rPts: "Points", rLevel: "Level", rNext: "To {name}", rReq: "Reward requests",
  rFaq: "Your questions, answered",
  rPrefs: "Your reward questions", rPrefsSub: "The parent's reward profile. Optional; answer what you like and send it with your onboarding.",
  rSave: "Save my reward answers", rSaved: "Saved",
  rFromConsent: "From the agreement you accept (section 14)",
  // consent
  cPartA: "Part A · Terms & conditions", cPartB: "Part B · Parent / guardian consent", cPartC: "Part C · {name}'s own decision", cPartD: "Part D · Before every survey",
  cInShort: "In short", cRead: "Read", cOpen: "Read the full section", cDecl: "Declaration", cDeclNote: "By sending, you confirm each point of this declaration.",
  cPerms: "Permissions", cTeenNote: "This part is for {name}. Hand over the device so they can answer it themselves.",
  cYes: "Yes, I understand the explanation and want to take part.", cNo: "No, I do not want to take part.",
  cNoNote: "That's completely okay. Nothing will start and {name} won't be invited to studies.",
  cCheck: "Ready to send?", chkRead: "Terms read", chkReq: "Required consents", chkTeen: "{name}'s decision",
  cSendBtn: "Send for verification", cSendNote: "The account stays locked until the parent or guardian's permission is verified.",
  cStudy: "Each study first shows a card like this. If it needs extra permission, we ask before it starts.",
  cVersion: "Agreement {v} · effective {d}", contact: "Questions about permission, privacy or withdrawal: {e}",
};
const f = (k, v) => String(S[k] ?? k).replace(/\{(\w+)\}/g, (m, n) => (v && v[n] != null ? v[n] : m));
const fmtDate = (d, time) => { if (!d) return ""; const x = new Date(d); return Number.isNaN(x.getTime()) ? String(d) : new Intl.DateTimeFormat(undefined, time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "long" }).format(x); };
const QS = PO.sections.flatMap((s) => s.qs);
const STATE = { new: "st_new", draft: "st_draft", submitted: "st_submitted", verified: "st_verified" };

/* ---------------- rules of the onboarding form ---------------- */
const asList = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
const filled = (v) => !(v == null || v === "" || (Array.isArray(v) && !v.length));
const applies = (q, a) => (q.n !== "HQ4" || ["primary", "shared"].includes(a.HQ2));
const isReq = (q, a) => (q.n === "P09" ? asList(a.P07).some((v) => ["sms", "call", "whatsapp"].includes(v)) : Boolean(q.req));
const ageOf = (d) => { const x = new Date(d); if (Number.isNaN(x.getTime())) return null; const n = new Date(); let y = n.getFullYear() - x.getFullYear(); if (n < new Date(n.getFullYear(), x.getMonth(), x.getDate())) y -= 1; return y; };
function errorOf(q, a) {
  if (!applies(q, a)) return null;
  const v = q.kind === "name" ? a["parent-first-name"] : a[q.n];
  if (!filled(v)) return isReq(q, a) ? f("errReq") : null;
  if (q.other && asList(v).includes(q.other) && !String(a[`${q.n}_specify`] || "").trim()) return f("errReq");
  if (q.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim())) return f("errEmail");
  if (q.kind === "phone") {
    const cc = a["P09_cc"] || a.P01; const m = PHONE[cc]; const digits = String(v).replace(/\D/g, "");
    if (!m || digits.length < m[1] || digits.length > m[2]) return f("errPhone", { c: COUNTRIES.find((c) => c[1] === cc)?.[0] || "" });
  }
  if (q.kind === "dob") { const y = ageOf(v); if (y == null || y > 120) return f("errDate"); if (y < 18) return f("errAdult"); }
  if (q.gate && v !== "yes") return f("errGate");
  return null;
}
const sectionErrors = (s, a) => s.qs.map((q) => [q.n, errorOf(q, a)]).filter(([, e]) => e);
const progressOf = (a) => {
  const need = QS.filter((q) => applies(q, a) && isReq(q, a));
  return need.length ? Math.round((need.filter((q) => !errorOf(q, a)).length / need.length) * 100) : 0;
};

/* ---------------- states / regions (the suite's list, loaded on demand) ---------------- */
let statesP = null;
function useStates(cc) {
  const [all, setAll] = React.useState(null);
  React.useEffect(() => {
    if (!cc) return;
    statesP = statesP || fetch("/hub/data/states.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    let live = true;
    statesP.then((j) => { if (live) setAll(j || {}); });
    return () => { live = false; };
  }, [cc]);
  return all ? all[cc] || [] : null;
}

/* ---------------- one field ---------------- */
function Choice({ q, value, onChange, multi }) {
  const vals = asList(value);
  const pick = (v) => {
    if (!multi) return onChange(v);
    const ex = q.exclusive || [];
    let next = vals.includes(v) ? vals.filter((x) => x !== v) : [...vals, v];
    if (ex.includes(v) && !vals.includes(v)) next = [v];
    else next = next.filter((x) => !ex.includes(x) || x === v);
    onChange(next);
  };
  return (
    <div className={`pf9-opts ${q.o.length > 6 ? "many" : ""}`} role={multi ? "group" : "radiogroup"} aria-label={q.q}>
      {q.o.map(([label, v, emoji]) => {
        const on = vals.includes(v);
        return (
          <button key={v} type="button" role={multi ? "checkbox" : "radio"} aria-checked={on} className={on ? "on" : ""} onClick={() => { pick(v); play("tap"); }}>
            {emoji ? <span className="e" aria-hidden="true">{emoji}</span> : null}<span>{label}</span>{on ? <Icon name="check" size={14} /> : null}
          </button>
        );
      })}
    </div>
  );
}

function Field({ q, a, set, err, showErr }) {
  const v = a[q.n];
  const id = `pf9-${q.n}`;
  const states = useStates(q.kind === "region" ? a.P01 : null);
  let input = null;
  if (q.kind === "name") {
    input = (
      <div className="pf9-row3">
        {[["parent-first-name", "first", true], ["parent-middle-name", "middle"], ["parent-last-name", "last"]].map(([k, l, r]) => (
          <label key={k} className="pf9-in"><span>{f(l)}{r ? " *" : ""}</span><input value={a[k] || ""} onChange={(e) => set({ [k]: e.target.value })} autoComplete={l === "first" ? "given-name" : l === "last" ? "family-name" : "additional-name"} /></label>
        ))}
      </div>
    );
  } else if (q.kind === "dob") {
    input = <input id={id} className="pf9-input" type="date" value={v || ""} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ [q.n]: e.target.value })} />;
  } else if (q.kind === "country") {
    input = (
      <select id={id} className="pf9-input" value={v || ""} onChange={(e) => set({ [q.n]: e.target.value, P02: "" })}>
        <option value="">{f("pickCountry")}</option>
        {COUNTRIES.map(([n, cc]) => <option key={cc} value={cc}>{n}</option>)}
      </select>
    );
  } else if (q.kind === "region") {
    input = states && states.length ? (
      <select id={id} className="pf9-input" value={v || ""} onChange={(e) => set({ [q.n]: e.target.value, [`${q.n}_name`]: e.target.selectedOptions[0]?.value ? e.target.selectedOptions[0].text : "" })} disabled={!a.P01}>
        <option value="">{f("pickRegion")}</option>
        {states.map(([n, code]) => <option key={code} value={code}>{n}</option>)}
      </select>
    ) : <input id={id} className="pf9-input" value={v || ""} placeholder={f("typeRegion")} onChange={(e) => set({ [q.n]: e.target.value })} disabled={!a.P01} />;
  } else if (q.kind === "language") {
    input = (
      <select id={id} className="pf9-input" value={v || ""} onChange={(e) => set({ [q.n]: e.target.value })}>
        <option value="">{f("pickLang")}</option>
        {LANGS.map(([code, native, name]) => <option key={code} value={code}>{native === name ? name : `${native} · ${name}`}</option>)}
      </select>
    );
  } else if (q.kind === "email") {
    input = <input id={id} className="pf9-input" type="email" inputMode="email" autoComplete="email" value={v || ""} onChange={(e) => set({ [q.n]: e.target.value })} />;
  } else if (q.kind === "phone") {
    const cc = a.P09_cc || a.P01 || "";
    input = (
      <div className="pf9-phone">
        <select aria-label={f("dial")} className="pf9-input" value={cc} onChange={(e) => set({ P09_cc: e.target.value })}>
          <option value="">{f("dial")}</option>
          {COUNTRIES.filter(([, c]) => PHONE[c]).map(([n, c]) => <option key={c} value={c}>{`+${PHONE[c][0]} ${n}`}</option>)}
        </select>
        <input id={id} className="pf9-input" type="tel" inputMode="tel" autoComplete="tel-national" aria-label={f("number")} value={v || ""} onChange={(e) => set({ [q.n]: e.target.value.replace(/[^\d\s-]/g, "") })} />
      </div>
    );
  } else if (q.o) {
    input = <Choice q={q} value={v} multi={q.multi} onChange={(x) => set({ [q.n]: x })} />;
  }
  const other = q.other && asList(v).includes(q.other);
  return (
    <div className={`pf9-q ${showErr && err ? "has-err" : ""}`} data-q={q.n}>
      <label className="pf9-q-h" htmlFor={q.kind === "name" || q.o ? undefined : id}>
        <b>{q.q}</b>
        <em className={isReq(q, a) ? "req" : ""}>{isReq(q, a) ? f("required") : f("optional")}</em>
      </label>
      {q.help ? <p className="pf9-help">{q.help}</p> : q.multi ? <p className="pf9-help">{f("choose")}</p> : null}
      {input}
      {other ? <label className="pf9-in pf9-spec"><span>{f("specify")}</span><input value={a[`${q.n}_specify`] || ""} onChange={(e) => set({ [`${q.n}_specify`]: e.target.value })} /></label> : null}
      <p className="pf9-err" role={showErr && err ? "alert" : undefined}>{showErr && err ? <><Icon name="alert" size={14} /> {err}</> : null}</p>
    </div>
  );
}

const shown = (q, a) => {
  const v = q.kind === "name" ? ["parent-first-name", "parent-middle-name", "parent-last-name"].map((k) => a[k]).filter(Boolean).join(" ") : a[q.n];
  if (!filled(v)) return null;
  if (q.kind === "country") return COUNTRIES.find((c) => c[1] === v)?.[0] || v;
  if (q.kind === "language") return LANGS.find((l) => l[0] === v)?.[2] || v;
  if (q.kind === "region") return a[`${q.n}_name`] || v;
  if (q.kind === "dob") return fmtDate(v);
  if (q.kind === "phone") return `+${PHONE[a.P09_cc || a.P01]?.[0] || ""} ${v}`;
  if (q.o) return asList(v).map((x) => (x === q.other && a[`${q.n}_specify`] ? `${q.o.find((o) => o[1] === x)?.[0]}: ${a[`${q.n}_specify`]}` : q.o.find((o) => o[1] === x)?.[0] || x)).join(", ");
  return String(v);
};

/* ---------------- the sheet (native dialog: above the header and menu, Esc closes) ---------------- */
function Sheet({ tone, world, title, sub, onClose, children, foot }) {
  const ref = React.useRef(null);
  React.useEffect(() => { const el = ref.current; if (el && !el.open) el.showModal?.(); }, []);
  return (
    <dialog ref={ref} className={`pc9-sheet t-${tone}`} aria-labelledby="pc9-sheet-t" onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <header className="pc9-sheet-h">
        <img src={`/hub/worlds/${world}.webp`} alt="" width="64" height="64" />
        <div><h3 id="pc9-sheet-t">{title}</h3><p>{sub}</p></div>
        <button type="button" className="pc9-x" onClick={onClose} aria-label={f("close")}><Icon name="close" size={18} /></button>
      </header>
      <div className="pc9-sheet-b">{children}</div>
      {foot ? <footer className="pc9-sheet-f">{foot}</footer> : null}
    </dialog>
  );
}

function Ring({ pct, size = 54, stroke = 6, children }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (
    <span className="pc9-ringp" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={r} className="bg" strokeWidth={stroke} /><circle cx={size / 2} cy={size / 2} r={r} className="fg" strokeWidth={stroke} style={{ strokeDasharray: `${(pct / 100) * c} ${c}` }} /></svg>
      <b style={size < 46 ? { fontSize: 9.5 } : undefined}>{children ?? (pct >= 100 ? <Icon name="check" size={Math.round(size / 3)} /> : `${pct}%`)}</b>
    </span>
  );
}

/* ---------------- 1 onboarding ---------------- */
function OnboardingSheet({ teen, onClose }) {
  const fam = useFamily();
  const [forms, update] = useParentForms();
  const o = forms.onb;
  const a = o.a || {};
  const server = fam.data?.ready ? fam.data : null;
  const [step, setStep] = React.useState(server || o.status === "submitted" ? PO.sections.length : Math.min(o.step || 0, PO.sections.length));
  const [showErr, setShowErr] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [who, setWho] = React.useState(Boolean(o.who));
  const [health, setHealth] = React.useState(o.health || null); // null: not decided, "yes", "skip"
  const body = React.useRef(null);
  const live = PARENT_FORMS_LIVE();
  const set = (patch) => update("onb", (cur) => ({ a: { ...cur.a, ...patch }, status: cur.status === "submitted" ? "submitted" : "draft" }));
  const go = (i) => { setStep(i); setShowErr(false); update("onb", { step: i }); body.current?.closest(".pc9-sheet")?.querySelector(".pc9-sheet-b")?.scrollTo({ top: 0, behavior: "smooth" }); };
  const sec = PO.sections[step];
  const pct = server ? 100 : progressOf(a);

  if (server) {
    return (
      <Sheet tone="a" world="hearth" title={f("c1")} sub={PO.blurb} onClose={onClose}>
        <p className="pc9-note ok"><Icon name="check" size={15} /> {f("fromServer", { d: fmtDate(server.onboarding.submittedAt) })}</p>
        {server.onboarding.sections.map((s) => (
          <section key={s.name} className="pc9-sec"><h4>{s.name}</h4>
            <dl className="pf9-review">{s.questions.map((q) => <div key={q.n}><dt>{q.q}</dt><dd>{q.answered ? (q.display || []).join(", ") : f("notAnswered")}</dd></div>)}</dl>
          </section>
        ))}
      </Sheet>
    );
  }

  const next = () => {
    const errs = sec.optional && health === "skip" ? [] : sectionErrors(sec, a);
    if (errs.length) { setShowErr(true); play("error"); body.current?.querySelector(`[data-q="${errs[0][0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    play("tap"); go(step + 1);
  };
  const submit = async () => {
    const bad = PO.sections.findIndex((s) => !(s.optional && health === "skip") && sectionErrors(s, a).length);
    if (bad >= 0) { go(bad); setShowErr(true); return; }
    setBusy(true); setErr("");
    try {
      const payload = { form: PO.id, answers: health === "skip" ? Object.fromEntries(Object.entries(a).filter(([k]) => !/^HQ/.test(k))) : a, healthSkipped: health === "skip" };
      await sendParentForm("onboarding", payload);
      update("onb", { status: "submitted", at: new Date().toISOString() });
      play("milestone");
    } catch (e) { setErr(f("errSend")); } finally { setBusy(false); }
  };

  const steps = (
    <ol className="pf9-steps" aria-label={f("c1")}>
      {PO.sections.map((s, i) => {
        const done = !sectionErrors(s, a).length || (s.optional && health === "skip");
        return (
          <li key={s.name} className={`${i === step ? "cur" : ""} ${done && i !== step ? "ok" : ""}`}>
            <button type="button" onClick={() => go(i)} disabled={!who}><span>{done && i !== step ? <Icon name="check" size={13} /> : s.icon}</span>{s.name}</button>
          </li>
        );
      })}
      <li className={step === PO.sections.length ? "cur" : ""}><button type="button" onClick={() => go(PO.sections.length)} disabled={!who}><span><Icon name="eye" size={13} /></span>{f("review")}</button></li>
    </ol>
  );

  let content;
  if (o.status === "submitted") {
    content = (
      <div className="pf9-done">
        <span className="pf9-done-art" aria-hidden="true"><img src="/hub/worlds/trust.webp" alt="" width="180" height="180" /><i /></span>
        <h4>{f("sentTitle")}</h4>
        <p>{f("sentSub")}</p>
        <p className="pc9-note ok"><Icon name="check" size={15} /> {f("st_submitted")} · {fmtDate(o.at, true)}</p>
        <dl className="pf9-review">{QS.filter((q) => applies(q, a)).map((q) => <div key={q.n}><dt>{q.q}</dt><dd>{shown(q, a) || (/^HQ/.test(q.n) && o.health === "skip" ? f("skipped") : f("notAnswered"))}</dd></div>)}</dl>
        <button type="button" className="h-btn h-btn-ghost" onClick={() => { update("onb", { status: "draft" }); go(0); }}><Icon name="text" size={16} /> {f("edit")}</button>
      </div>
    );
  } else if (!who) {
    content = (
      <div className="pf9-who">
        <img src="/hub/worlds/trust.webp" alt="" width="160" height="160" />
        <h4>{f("whoTitle")}</h4>
        <label className="pf9-check"><input type="checkbox" checked={who} onChange={(e) => { setWho(e.target.checked); update("onb", { who: e.target.checked }); }} /><span>{f("who", { name: teen })}</span></label>
      </div>
    );
  } else if (step === PO.sections.length) {
    content = (
      <div className="pf9-rev">
        <h4>{f("reviewTitle")}</h4>
        <p className="pc9-kind">{f("reviewSub")}</p>
        {PO.sections.map((s, i) => (
          <section key={s.name} className="pc9-sec">
            <h4><span>{i + 1}</span>{s.name}<button type="button" className="h-link" onClick={() => go(i)}><Icon name="text" size={14} /> {f("edit")}</button></h4>
            <dl className="pf9-review">{s.qs.filter((q) => applies(q, a)).map((q) => <div key={q.n} className={errorOf(q, a) && !(s.optional && health === "skip") ? "bad" : ""}><dt>{q.q}</dt><dd>{shown(q, a) || (s.optional && health === "skip" ? f("skipped") : f("notAnswered"))}</dd></div>)}</dl>
          </section>
        ))}
        {!live ? <p className="pc9-note"><Icon name="lock" size={15} /> <span><b>{f("offTitle")}</b> {f("offSub")}</span></p> : null}
        {err ? <p className="pc9-note bad" role="alert"><Icon name="alert" size={15} /> {err}</p> : null}
      </div>
    );
  } else if (sec.optional && !health) {
    const it = sec.intro || {};
    content = (
      <div className="pf9-intro">
        <img src={`/hub/worlds/${it.art || "care"}.webp`} alt="" width="150" height="150" />
        <p className="pf9-kick">{it.kicker}</p>
        <h4>{it.title}</h4>
        <p>{it.body}</p>
        <ul>{(it.reasons || []).map(([e, h, t]) => <li key={h}><span aria-hidden="true">{e}</span><div><b>{h}</b><small>{t}</small></div></li>)}</ul>
        <p className="pc9-note ok"><Icon name="shield" size={15} /> {it.assurance}</p>
        <div className="pf9-intro-go">
          <button type="button" className="h-btn h-btn-primary" onClick={() => { setHealth("yes"); update("onb", { health: "yes" }); }}>{it.startLabel || f("healthStart")}</button>
          <button type="button" className="h-btn h-btn-ghost" onClick={() => { setHealth("skip"); update("onb", { health: "skip" }); go(step + 1); }}>{f("healthSkip")}</button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="pf9-form" key={step}>
        <p className="pf9-kick">{f("stepOf", { i: step + 1, n: PO.sections.length })}</p>
        <h4 className="pf9-sec-h"><span aria-hidden="true">{sec.icon}</span>{sec.name}</h4>
        {showErr && sectionErrors(sec, a).length ? <p className="pc9-note bad" role="alert"><Icon name="alert" size={15} /> {f("errSection", { n: sectionErrors(sec, a).length })}</p> : null}
        {sec.qs.filter((q) => applies(q, a)).map((q) => <Field key={q.n} q={q} a={a} set={set} err={errorOf(q, a)} showErr={showErr} />)}
      </div>
    );
  }
  const foot = o.status === "submitted" || !who ? null : (
    <>
      <span className="pf9-saved"><Ring pct={pct} size={40} stroke={5} /> {o.savedAt ? f("savedAt", { t: fmtDate(o.savedAt, true) }) : f("saved")}</span>
      <span className="pf9-foot-go">
        {step > 0 ? <button type="button" className="h-btn h-btn-ghost" onClick={() => go(step - 1)} disabled={busy}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icon name="chevron" size={16} /></span> {f("back")}</button> : null}
        {step < PO.sections.length - 1 && !(sec?.optional && !health) ? <button type="button" className="h-btn h-btn-primary" onClick={next}>{f("next")} <Icon name="arrow" size={16} /></button> : null}
        {step === PO.sections.length - 1 && !(sec?.optional && !health) ? <button type="button" className="h-btn h-btn-primary" onClick={next}>{f("toReview")} <Icon name="arrow" size={16} /></button> : null}
        {step === PO.sections.length ? <button type="button" className="h-btn h-btn-primary" onClick={submit} disabled={busy || !live}>{busy ? f("sending") : f("send")} <Icon name="send" size={16} /></button> : null}
      </span>
    </>
  );
  return (
    <Sheet tone="a" world="hearth" title={f("c1")} sub={PO.blurb} onClose={onClose} foot={foot}>
      <div ref={body}>
        {who && o.status !== "submitted" ? steps : null}
        {content}
      </div>
    </Sheet>
  );
}

/* ---------------- 2 rewards ---------------- */
function RewardsSheet({ teen, onClose }) {
  const hub = useHub();
  const fam = useFamily();
  const cfg = useEngage("config", "/config");
  const rw = useEngage("rewards", "/rewards");
  const tp = hub.teen?.data;
  const [forms, update] = useParentForms();
  const ra = forms.rew.a || {};
  const c = cfg.data || {};
  const items = rw.data?.items || [];
  const lv = tp?.level;
  const poll = c.dailyPoll?.enabled ? c.dailyPoll.points : null;
  const streak = (c.streakBonuses || []).map((b) => `${b.days} days: +${b.points}`).join(" · ");
  const sec14 = CS.sections["14"];
  const faq = [
    ["How does the reward system work?", `${teen} earns points for activities on the panel. Points add up into levels, and points can later be used for a reward from the reward list. Teen rewards are points, and every reward request needs your yes.`],
    [`How can ${teen} earn rewards?`, `By finishing their profiles, taking eligible surveys${poll ? `, answering the daily poll (+${poll} points)` : ""} and completing monthly challenges.${streak ? ` Streak bonuses: ${streak}.` : ""}`],
    ["Which activities are eligible?", "Profiles, surveys invited for teens, the daily poll and monthly challenges. A survey is only shown when it is suitable for a teen, and some studies need extra permission from you first."],
    ["How are rewards calculated?", "Each profile and survey shows its points before it starts; that is the amount added when it is finished. A survey that ends early because it is looking for different people adds no points and does not count against your teen."],
    ["When and how are rewards credited?", `Points are added to ${teen}'s balance when the activity is finished${c.holdDays ? `, after a ${c.holdDays}-day check` : ""}. A reward from the list is only processed after you approve it by email.`],
    ["What conditions and restrictions apply?", `${sec14.short} Participation does not guarantee a reward; any reward follows the conditions disclosed for the survey (declaration point 8).`],
    ["How can I track my teen's rewards?", `${teen}'s points and level are shown below and on their Rewards page. Every reward request is emailed to you, and activity links we send you show what they have done.`],
  ];
  const sentLinks = fam.data?.ready ? fam.data.rewards?.viewLinks?.sent : null;
  const reqs = fam.data?.ready ? fam.data.rewards?.requests || [] : [];
  const steps = [["rj1", "rj1s", "target"], ["rj2", "rj2s", "coin"], ["rj3", "rj3s", "trophy"], ["rj4", "rj4s", "gift"], ["rj5", "rj5s", "family_mwg"], ["rj6", "rj6s", "package"]];
  return (
    <Sheet tone="b" world="treasury" title={f("c2")} sub={f("c2s", { name: teen })} onClose={onClose}>
      <h4 className="pc9-h">{f("rJourney")}</h4>
      <ol className="rw9-journey">
        {steps.map(([h, s, art], i) => (
          <li key={h} style={{ "--i": i }}>
            <span className="rw9-art"><img src={`/hub/3d/${art}.webp`} alt="" width="48" height="48" /><b>{i + 1}</b></span>
            <strong>{f(h)}</strong><small>{f(s)}</small>
          </li>
        ))}
      </ol>
      <div className="pc9-live">
        <h4>{f("rNow", { name: teen })}</h4>
        <ul>
          <li><b>{tp ? fmt(tp.points?.earned || 0) : hub.pts ? fmt(hub.pts.total) : "…"}</b><small>{f("rPts")}</small></li>
          <li><b>{lv ? `L${lv.level} · ${lv.name}` : "…"}</b><small>{f("rLevel")}</small></li>
          <li><b>{lv?.next ? fmt(lv.next.left) : "–"}</b><small>{lv?.next ? f("rNext", { name: lv.next.name }) : f("rLevel")}</small></li>
          <li><b>{fam.data?.ready ? reqs.length : "0"}</b><small>{f("rReq")}{sentLinks ? ` · ${sentLinks}` : ""}</small></li>
        </ul>
      </div>
      {items.length ? (
        <ul className="rw9-items">
          {items.slice(0, 4).map((x, i) => (
            <li key={x.key} style={{ "--i": i }}><img src={`/hub/3d/${x.kind === "learning" ? "book" : "gift"}.webp`} alt="" width="40" height="40" /><b>{x.title}</b><small>{fmt(x.points)} {f("rPts").toLowerCase()}{x.needsGuardian ? " · needs your yes" : ""}</small></li>
          ))}
        </ul>
      ) : null}
      {rw.data?.placeholder ? <p className="pc9-kind">These are example rewards while partners are finalised. The points needed are confirmed before anything is requested.</p> : null}
      <h4 className="pc9-h">{f("rFaq")}</h4>
      <dl className="pc9-faq">{faq.map(([q, ans], i) => <div key={q} style={{ "--i": i }}><dt><span>{i + 1}</span>{q}</dt><dd>{ans}</dd></div>)}</dl>
      <details className="pc9-cl rw9-sec14"><summary><b>{f("rFromConsent")}: {sec14.title}</b><span>{sec14.short}</span></summary><ul>{sec14.body.map((b) => <li key={b.slice(0, 30)}>{b}</li>)}</ul></details>
      <h4 className="pc9-h">{f("rPrefs")}</h4>
      <p className="pc9-kind">{f("rPrefsSub")}</p>
      {PR.sections.map((s) => (
        <section key={s.name} className="pc9-sec">
          <h4><span aria-hidden="true">{s.icon}</span>{s.name}</h4>
          {s.qs.map((q) => (
            <div key={q.n} className="pf9-q">
              <p className="pf9-q-h"><b>{q.q}</b><em>{f("optional")}</em></p>
              <Choice q={{ ...q, o: q.options.map((l) => [l, l, ""]) }} value={ra[q.n]} multi={q.multi} onChange={(v) => update("rew", (cur) => ({ a: { ...cur.a, [q.n]: v }, status: "draft" }))} />
            </div>
          ))}
        </section>
      ))}
      {forms.rew.savedAt ? <p className="pc9-note ok"><Icon name="check" size={15} /> {f("savedAt", { t: fmtDate(forms.rew.savedAt, true) })}</p> : null}
    </Sheet>
  );
}

/* ---------------- 3 consent ---------------- */
const ALL = Object.keys(CS.sections).map(Number);
function ConsentSheet({ teen, onClose }) {
  const fam = useFamily();
  const [forms, update] = useParentForms();
  const v = forms.con;
  const server = fam.data?.ready ? fam.data.consent?.guardian : null;
  const read = new Set(v.read || []);
  const sel = v.sel || {};
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [need, setNeed] = React.useState(false);
  const live = PARENT_FORMS_LIVE();
  const box = React.useRef(null);
  const set = (patch) => update("con", (cur) => ({ ...patch, status: cur.status === "submitted" ? "submitted" : "draft" }));
  const markRead = (n) => { if (!read.has(n)) update("con", (cur) => ({ read: [...new Set([...(cur.read || []), n])].sort((x, y) => x - y), status: cur.status === "submitted" ? "submitted" : "draft" })); };
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !box.current) return undefined;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) markRead(+e.target.dataset.sec); }), { threshold: 0.6 });
    box.current.querySelectorAll("[data-sec]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }); // eslint-disable-line react-hooks/exhaustive-deps
  const required = CS.selections.filter((s) => s.required);
  const reqDone = required.filter((s) => sel[s.id]).length;
  const readDone = ALL.filter((n) => read.has(n)).length;
  const teenDone = v.assent === "yes";
  const ready = readDone === ALL.length && reqDone === required.length && teenDone;
  const pct = server ? 100 : Math.round(((readDone / ALL.length) + (reqDone / required.length) + (teenDone ? 1 : 0)) / 3 * 100);
  const submit = async () => {
    if (!ready) { setNeed(true); play("error"); box.current?.querySelector(readDone < ALL.length ? `[data-sec="${ALL.find((n) => !read.has(n))}"]` : reqDone < required.length ? ".cs9-sel.req:not(.on)" : "#cs9-c")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setBusy(true); setErr("");
    try {
      await sendParentForm("consent", { version: CS.version, read: [...read], selections: sel, declaration: true, assent: v.assent });
      update("con", { status: "submitted", at: new Date().toISOString() });
      play("milestone");
    } catch (e) { setErr(f("errSend")); } finally { setBusy(false); }
  };
  const done = server || v.status === "submitted";
  const choice = (id) => (server ? server.statements.find((s) => s.id === id)?.accepted : sel[id]);
  const foot = done ? null : (
    <>
      <span className="pf9-saved"><Ring pct={pct} size={40} stroke={5} /><span className="cs9-chk">
        <i className={readDone === ALL.length ? "ok" : ""}>{f("chkRead")} {readDone}/{ALL.length}</i>
        <i className={reqDone === required.length ? "ok" : ""}>{f("chkReq")} {reqDone}/{required.length}</i>
        <i className={teenDone ? "ok" : ""}>{f("chkTeen", { name: teen })}</i>
      </span></span>
      <button type="button" className="h-btn h-btn-primary" onClick={submit} disabled={busy || !live}>{busy ? f("sending") : f("cSendBtn")} <Icon name="send" size={16} /></button>
    </>
  );
  return (
    <Sheet tone="c" world="consent" title={f("c3")} sub={f("cVersion", { v: CS.version, d: fmtDate(CS.effective) })} onClose={onClose} foot={foot}>
      <div ref={box} className="cs9">
        {done ? (
          <div className="pf9-done">
            <span className="pf9-done-art" aria-hidden="true"><img src="/hub/worlds/consent.webp" alt="" width="180" height="180" /><i /></span>
            <h4>{f("sentConsentTitle")}</h4>
            <p>{server ? f("fromServer", { d: fmtDate(server.acceptedAt) }) : f("sentConsentSub")}</p>
            <p className="pc9-note ok"><Icon name="check" size={15} /> {server ? f("st_verified") : `${f("st_submitted")} · ${fmtDate(v.at, true)}`}</p>
          </div>
        ) : null}
        {!done && need && !ready ? <p className="pc9-note bad" role="alert"><Icon name="alert" size={15} /> {f("cCheck")} {readDone < ALL.length ? `${f("chkRead")} ${readDone}/${ALL.length}. ` : ""}{reqDone < required.length ? `${f("chkReq")} ${reqDone}/${required.length}. ` : ""}{!teenDone ? f("chkTeen", { name: teen }) : ""}</p> : null}
        <section className="pc9-info">
          <h4>{CS.en.info_h}</h4>
          {CS.info.map((p) => <p key={p.slice(0, 30)}>{p}</p>)}
          <p className="pc9-rule"><Icon name="shield" size={15} /> {CS.infoRule}</p>
        </section>
        <h4 className="cs9-part"><b>A</b>{f("cPartA")}</h4>
        {CS.chapters.map((ch, ci) => (
          <section key={ch.id} className="pc9-ch" style={{ "--g1": ch.grade[0], "--g2": ch.grade[1], "--i": ci }}>
            <h4><span aria-hidden="true">{ch.emoji}</span>{ch.title}<small>{ch.tag}</small></h4>
            {ch.sections.map((n) => {
              const s = CS.sections[n];
              return (
                <details key={n} className={`pc9-cl ${read.has(n) || done ? "is-read" : ""}`} data-sec={n} onToggle={(e) => { if (e.currentTarget.open) markRead(n); }}>
                  <summary><b><span aria-hidden="true">{CS.sectionEmoji[n]}</span> {n}. {s.title}{read.has(n) || done ? <em><Icon name="check" size={12} /> {f("cRead")}</em> : null}</b><span><i>{f("cInShort")}:</i> {s.short}</span></summary>
                  <ul>{s.body.map((b) => <li key={b.slice(0, 40)}>{b}</li>)}{s.contact ? <li>{f("contact", { e: CS.company.supportEmail })}</li> : null}</ul>
                </details>
              );
            })}
          </section>
        ))}
        <h4 className="cs9-part"><b>B</b>{f("cPartB")}</h4>
        <section className="pc9-decl">
          <h4>{f("cDecl")}</h4>
          <ol>{CS.declaration.map((x) => <li key={x.slice(0, 40)}>{x}</li>)}</ol>
          <p className="pc9-kind">{f("cDeclNote")}</p>
        </section>
        <section className="pc9-perms">
          <h4>{f("cPerms")}</h4>
          <ul>
            {CS.selections.map((s) => {
              const on = choice(s.id);
              return (
                <li key={s.id} className={`cs9-sel ${s.required ? "req" : ""} ${on ? "on y" : ""}`}>
                  <button type="button" role="checkbox" aria-checked={Boolean(on)} disabled={done} onClick={() => { set({ sel: { ...sel, [s.id]: !sel[s.id] } }); play(sel[s.id] ? "tap" : "reward"); }}>
                    <span className="pc9-pe" aria-hidden="true">{s.emoji}</span>
                    <div><b>{s.title}</b><small className="cs9-kind">{s.kindLabel}</small><p>{s.text}</p></div>
                    <span className="cs9-box" aria-hidden="true">{on ? <Icon name="check" size={16} /> : null}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="pc9-kind">{CS.en.opt_note}</p>
        </section>
        <h4 className="cs9-part" id="cs9-c"><b>C</b>{f("cPartC", { name: teen })}</h4>
        <section className="pc9-decl cs9-teen">
          <p className="pc9-note"><Icon name="users" size={15} /> {f("cTeenNote", { name: teen })}</p>
          <p className="cs9-lead">{CS.en.c_lead} {CS.en.c_if}</p>
          <ul className="pc9-assent">{CS.assent.map((x, i) => <li key={x.slice(0, 30)}><span aria-hidden="true">{CS.assentEmoji[i]}</span> {x}</li>)}</ul>
          <p className="cs9-lead">{CS.en.c_decide}</p>
          <div className="cs9-yn" role="radiogroup" aria-label={CS.en.c_choose}>
            <button type="button" role="radio" aria-checked={v.assent === "yes"} className={v.assent === "yes" ? "on yes" : ""} disabled={done} onClick={() => { set({ assent: "yes" }); play("reward"); }}>✅ {f("cYes")}</button>
            <button type="button" role="radio" aria-checked={v.assent === "no"} className={v.assent === "no" ? "on no" : ""} disabled={done} onClick={() => { set({ assent: "no" }); play("tap"); }}>🙅 {f("cNo")}</button>
          </div>
          {v.assent === "no" ? <p className="pc9-note">{f("cNoNote", { name: teen })}</p> : null}
        </section>
        <h4 className="cs9-part"><b>D</b>{f("cPartD")}</h4>
        <section className="pc9-decl">
          <p className="pc9-kind">{f("cStudy")}</p>
          <ul className="cs9-study">{CS.studyFields.map(([k, e, ph]) => <li key={k}><span aria-hidden="true">{e}</span><b>{k}</b><small>{ph}</small></li>)}</ul>
        </section>
        {!done && !live ? <p className="pc9-note"><Icon name="lock" size={15} /> <span><b>{f("offTitle")}</b> {f("offSub")}</span></p> : null}
        {err ? <p className="pc9-note bad" role="alert"><Icon name="alert" size={15} /> {err}</p> : null}
        {!done ? <p className="pc9-kind">{f("cSendNote")}</p> : null}
      </div>
    </Sheet>
  );
}

/* ---------------- the section ---------------- */
export default function ParentSection() {
  const member = useMember();
  const hub = useHub();
  const st = useParentStatus();
  const [forms] = useParentForms();
  const [open, setOpen] = React.useState(null);
  const teen = member?.firstname || member?.name?.first || (member?.fullname || "").split(" ")[0] || "your teen";
  const c = hub.completion;
  const core = c ? c.items.filter((i) => i.kind === "profile") : [];
  const coreDone = core.filter((i) => i.done).length;
  const onbPct = st.server ? 100 : forms.onb.status === "submitted" ? 100 : progressOf(forms.onb.a || {});
  const readN = (forms.con.read || []).length;
  const reqN = CS.selections.filter((s) => s.required && forms.con.sel?.[s.id]).length;
  const conPct = st.server || forms.con.status === "submitted" ? 100 : Math.round(((readN / ALL.length) + (reqN / 3) + (forms.con.assent === "yes" ? 1 : 0)) / 3 * 100);
  const sent = (s) => s === "submitted" || s === "verified";
  const close = React.useCallback(() => setOpen(null), []);
  const statusOf = (s, pct) => (sent(s) ? s : pct > 0 || s === "draft" ? "draft" : "new");
  const onbS = statusOf(st.onb, onbPct);
  const conS = statusOf(st.con, conPct);
  const journey = [
    { k: "j1", who: "parent", s: onbS, pct: onbPct, act: () => setOpen("onb") },
    { k: "j2", who: "parent", s: conS, pct: conPct, act: () => setOpen("con") },
    { k: "j3", who: "teen", s: core.length && coreDone === core.length ? "submitted" : coreDone ? "draft" : "new", pct: core.length ? Math.round((coreDone / core.length) * 100) : 0, href: "#pf-g-basics", label: `${coreDone}/${core.length}` },
    { k: "j4", who: "teen", s: st.done && core.length && coreDone === core.length ? "submitted" : "new", pct: st.done && core.length && coreDone === core.length ? 100 : 0, href: "/member/surveys" },
  ];
  const cards = [
    { k: "onb", tone: "a", world: "hearth", wname: f("w1"), art: "clipboard", art2: "family_mwg", s: onbS, pct: onbPct, title: f("c1"), sub: f("c1s", { n: QS.length, m: PO.sections.length }) },
    { k: "rew", tone: "b", world: "treasury", wname: f("w2"), art: "coin", art2: "gift", s: "info", pct: null, title: f("c2"), sub: f("c2s", { name: teen }) },
    { k: "con", tone: "c", world: "consent", wname: f("w3"), art: "scroll", art2: "lockkey", s: conS, pct: conPct, title: f("c3"), sub: f("c3s") },
  ];
  return (
    <section className="pc9" aria-labelledby="pc9-t" id="parent-section">
      <div className="pc9-hero">
        <span className="pc9-hero-sky" aria-hidden="true"><i /><i /><i /></span>
        <div className="pc9-hero-copy">
          <p className="pc9-kicker"><span aria-hidden="true">🧑‍🍼</span> {f("kicker", { name: teen })}</p>
          <h2 id="pc9-t">{f("heroA")} <mark>{teen}</mark> {f("heroB")}</h2>
          <p className="pc9-hero-sub">{f("heroSub", { name: teen })}</p>
          <ul className="pc9-chips"><li>🧑‍🍼 {f("chipYou")}</li><li>🤝 {f("chipPerm")}</li><li>⏱️ {f("chipTime")}</li></ul>
          <div className="pc9-hero-go">
            <button type="button" className="pc9-cta" onClick={() => { play("tap"); setOpen(sent(onbS) ? "con" : "onb"); }}>{sent(onbS) && sent(conS) ? f("review") : onbPct > 0 || conPct > 0 ? f("continue") : "Let's begin"} <Icon name="arrow" size={18} /></button>
            <small>🔒 {f("heroNote")}</small>
          </div>
        </div>
        <div className="pc9-hero-art" aria-hidden="true">
          <i className="pc9-orbit" />
          <img className="core" src="/hub/worlds/trust.webp" alt="" width="300" height="300" />
          {["shield", "handshake", "gift", "heart", "star2", "family_mwg"].map((e, i) => <img key={e} className={`sat s${i}`} src={`/hub/3d/${e}.webp`} alt="" width="52" height="52" />)}
          <span className="pc9-mcard"><b>MyFrequentRewards</b><span><small>Member</small>{teen}</span><span><small>Status</small><em>{st.done ? "Ready" : "Waiting for you"}</em></span></span>
        </div>
      </div>

      <ol className="pc9-journey" aria-label="Who does what">
        {journey.map((j, i) => {
          const inner = (
            <>
              <Ring pct={j.pct} size={48} stroke={5}>{sent(j.s) ? <Icon name="check" size={16} /> : j.label || `${j.pct}%`}</Ring>
              <span className="pc9-j-tx"><em className={`who-${j.who}`}>{j.who === "parent" ? f("parentPart") : f("teenPart", { name: teen })}</em><b>{i + 1}. {f(j.k)}</b><small>{f(`${j.k}s`, { name: teen })}</small></span>
              <span className={`pc9-st s-${j.s}`}>{f(STATE[j.s] || "st_new")}</span>
            </>
          );
          return <li key={j.k} className={`who-${j.who} s-${j.s}`} style={{ "--i": i }}>{j.act ? <button type="button" onClick={j.act}>{inner}</button> : <Link href={j.href}>{inner}</Link>}</li>;
        })}
      </ol>

      <ul className="pc9-cards">
        {cards.map((x, i) => (
          <li key={x.k} className={`pc9-card t-${x.tone}`} style={{ "--i": i }}>
            <button type="button" onClick={() => { play("tap"); setOpen(x.k); }} aria-haspopup="dialog">
              <span className="pc9-art" aria-hidden="true">
                <img className="a0" src={`/hub/worlds/${x.world}.webp`} alt="" width="200" height="200" />
                <img className="a1" src={`/hub/3d/${x.art}.webp`} alt="" width="64" height="64" />
                <img className="a2" src={`/hub/3d/${x.art2}.webp`} alt="" width="52" height="52" />
                <i className="pc9-spark s1" /><i className="pc9-spark s2" /><i className="pc9-spark s3" />
                {x.k === "rew" ? <span className="pc9-coins">{[0, 1, 2, 3, 4].map((k) => <i key={k} style={{ "--k": k }} />)}</span> : null}
              </span>
              <span className="pc9-num">{i + 1}</span>
              <span className="pc9-world"><i />{x.wname}</span>
              <b className="pc9-title">{x.title}</b>
              <small className="pc9-sub">{x.sub}</small>
              <span className="pc9-foot">
                {x.pct != null ? <Ring pct={x.pct} size={46} stroke={5} /> : null}
                <span className={`pc9-st s-${x.s}`}>{f(x.s === "info" ? "st_info" : STATE[x.s])}</span>
                <span className="pc9-go">{x.s === "draft" ? f("continue") : sent(x.s) ? f("review") : f("open")} <Icon name="arrow" size={16} /></span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open === "onb" ? <OnboardingSheet teen={teen} onClose={close} /> : null}
      {open === "rew" ? <RewardsSheet teen={teen} onClose={close} /> : null}
      {open === "con" ? <ConsentSheet teen={teen} onClose={close} /> : null}
    </section>
  );
}
