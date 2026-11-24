"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { Grid, FormControl } from "@mui/material";
import { api, Page, getCurrency } from "@/util";
import { Form } from "@/components";
import PhoneElement from "@/app/(memberpages)/survey/components/Phone";
import CheckboxElement from "@/app/(memberpages)/survey/components/Checkbox";
import { useToast } from "@/hooks";
import { useI18n } from "./i18n.js";
import { themeOfProfile, progressOf, questionCount } from "./PsHub.jsx";
import { themeVars } from "./themes.js";
import { emojiUrl } from "./assets.js";
import { answerIcon } from "./answerIcons.js";
import { questionIcon } from "./optionIcons.js";
import ThemeScene from "./ThemeScene.jsx";
import MemberCard from "./MemberCard.jsx";
import ProgressRing from "./ProgressRing.jsx";
import Celebration from "./Celebration.jsx";
import { tap, ui } from "./sound.js";

// v4.1 click sounds play on the instrument of the member's language (mfr.lang); the hub's Sound setting mutes them
import { soundLang as sndLang } from "./useClickSounds.js";
import { Tiles, Chips, RadioList, Combo, TextInput } from "./Controls.jsx";
import { EXTRA_QUESTIONS, withAdditions } from "./v41Additions.js";
import { IArrow, ICheck, IEdit, IGrid, ILock } from "./Icons.jsx";
// a date question with no range of its own (date of birth) must allow past dates: Form.Date defaults to "from today"
const DOB_RANGE = ["1900-01-01T00:00:00", new Date().toISOString()];


const AUTO_ADVANCE = true; // as in the profile source: a single-answer question moves on by itself (multi-select keeps its Continue button)
const OPTION_TYPES = ["select", "multiselect", "checkbox", "radio"];
// every other type the database may hold (text, number, email, textarea, url…) is typed in, like "text"
const isTyped = (type) => Boolean(type) && !OPTION_TYPES.includes(type) && type !== "phone" && type !== "date";
const safeRe = (p) => { try { return new RegExp(p); } catch { return null; } };
const filled = (v) => !(v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0));
const lower = (x) => String(x ?? "").toLowerCase();
const isOthers = (o) => lower(o?.value) === "others" || lower(o?.label) === "others";
const isSkip = (o) => lower(o?.value) === "prefer_not_to_say" || lower(o?.label) === "prefer not to say";
const isNone = (o) => lower(o?.value) === "none_of_the_above" || lower(o?.label) === "none of the above";
// Questions the member cannot change here: the ones the database marks (isEditable: false, e.g. date of birth, gender) and the country, which
// is taken from the member's IP address at sign-up (the state, city and zip code follow it).
const SIGNUP_LOCKED = new Set(["country"]);
const isLockedDef = (def) => def?.isEditable === false || SIGNUP_LOCKED.has(def?.name);
// "2002-04-10T00:00:00.000Z" -> "10 Apr 2002" (UTC, so the day never shifts with the time zone)
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T|$)/;
const showDate = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); };

/** Income ranges are shown in the currency of the member's country (the same labels in the question and in the review). */
const moneyRanges = (list, country) => list.sortRange("asc").map((range) => ({ ...range, label: range.label.toMoneyRange(getCurrency(country), "en-IN") }));

/** Same option handling as survey/components/Select.jsx + MultiSelect.jsx. */
function normalizeOptions(raw, def, form, countryFb) {
  let list = Array.isArray(raw) ? raw : [];
  if (def.isMoney) {
    const country = form.watch("country") || countryFb; // the country chosen at sign-up (from the database)
    if (!country) return null;
    list = moneyRanges(list, country);
  }
  const out = list.map((o) => (typeof o === "string" ? { label: o, value: o } : { label: o.label, value: o.value, isExclusive: o.isExclusive, describeLabel: o.describeLabel ?? "", img: o.img }));
  if (def.type === "multiselect" || def.type === "select") {
    if (def.hasOthers && !out.some(isOthers)) out.push({ value: "others", label: "Others" });
    if (def.hasSkip && !out.some(isSkip)) out.push({ value: "prefer_not_to_say", label: "Prefer not to say" });
    if (def.hasNone && !out.some(isNone)) out.push({ value: "none_of_the_above", label: "None of the above" });
  }
  return out;
}


function toggleMulti(def, opts, current, value) {
  const cur = Array.isArray(current) ? current : [];
  const opt = opts.find((o) => o.value === value);
  if (cur.includes(value)) return cur.filter((v) => v !== value);
  const exclusiveOn = opts.find((o) => cur.includes(o.value) && o.isExclusive);
  if (exclusiveOn) return cur; // an exclusive answer is selected: nothing else can be added
  if (def.hasNone && isNone(opt)) return [value];
  if (def.hasSkip && isSkip(opt)) return [value];
  if (def.hasOthers && isOthers(opt)) return [value];
  if (opt?.isExclusive) return [value];
  const withoutSpecial = cur.filter((v) => { const o = opts.find((x) => x.value === v); return !(isNone(o) || isSkip(o) || isOthers(o)); });
  const next = [...withoutSpecial, value];
  const max = Number(def.maxSelections);
  return max > 0 ? next.slice(0, max) : next;
}

// the v4.1 questions that are not in the database's question list come from v41Additions.js
const extraArray = (n, v) => (EXTRA_QUESTIONS[n]?.type === "multiselect" && filled(v) && !Array.isArray(v) ? [v] : v);
const questionFn = (n) => async () => {
  if (EXTRA_QUESTIONS[n]) return EXTRA_QUESTIONS[n];
  const resp = await api.post("/api/v1/question", { name: n });
  if (resp.status === "error") throw new Error(resp.message);
  if (resp.data instanceof Array && resp.data.length === 1) return resp.data[0];
  return {};
};
const optionFn = (endpoint, name, parentValue, parent) => async () => {
  const extra = EXTRA_QUESTIONS[name];
  if (extra) {
    if (endpoint !== "option") return [];
    if (extra.optionsFrom) return (await api.get(`/api/v1/option/${extra.optionsFrom}`))?.data ?? []; // e.g. the country list
    return extra.options || [];
  }
  const method = typeof parent === "undefined" ? "get" : "post";
  if (![null, undefined, ""].includes(parent) && [null, "", [], undefined].includes(parentValue)) return [];
  const resp = method === "get" ? await api[method](`/api/v1/${endpoint}/${name}`) : await api[method](`/api/v1/${endpoint}/${name}`, { parentValue });
  return resp?.data ?? [];
};

/* ------------------------------------------------------------------------------------------------ question card */
function QuestionCard({ it, value, form, err, pos, total, secLabel, dir, onAnswer, onNext, onBack, showBack, nextLabel, specify, onSpecify, busy }) {
  const { t } = useI18n();
  const { def, opts } = it;
  const multi = def.type === "multiselect";
  const optLike = OPTION_TYPES.includes(def.type) && def.type !== "checkbox";
  const items = React.useMemo(() => {
    if (!opts) return [];
    const ctx = { q: def.name, text: def.label, fallback: questionIcon(def.label, def.name, opts.map((o) => [o.label, o.value])) };
    return opts.map((o) => { const x = { label: o.label, value: o.value }; Object.defineProperty(x, "icon", { get() { return this._ic || (this._ic = answerIcon(o.label, o.value, ctx)); }, enumerable: true }); return x; });
  }, [opts, def.name, def.label]);
  let control = null;
  if (optLike) {
    const filterPh = t("q.filter", { n: items.length });
    if (multi) {
      control = items.length <= 6
        ? <Tiles items={items} value={value} multi onToggle={(v) => onAnswer(it, toggleMulti(def, opts, value, v))} />
        : <Chips items={items} value={value} onToggle={(v) => onAnswer(it, toggleMulti(def, opts, value, v))} filterPh={filterPh}
            selectedLabel={t("q.selected", { n: (value || []).length })} noMatch={t("q.noMatch")} moreLabel={(a, b) => t("q.more", { n: a, t: b })} />;
    } else if (items.length <= 6) control = <Tiles items={items} value={value} onToggle={(v) => onAnswer(it, v, true)} />;
    else if (items.length <= 30) control = <RadioList items={items} value={value} onPick={(v) => onAnswer(it, v, true)} filterPh={filterPh} noMatch={t("q.noMatch")} />;
    else control = <Combo key={def.name} items={items} value={value} raw="" onPick={(v) => onAnswer(it, v, true)} onRaw={() => {}} placeholder={t("q.search")}
      noMatch={t("q.noMatch")} onEnter={onNext} moreLabel={(a, b) => t("q.more", { n: a, t: b })} />;
  } else if (isTyped(def.type)) {
    control = <TextInput spec={{ type: def.type === "number" ? "number" : "text" }} long={def.type === "textarea"} value={value} onChange={(v) => onAnswer(it, v)} onEnter={onNext} placeholder={t("q.type")} autoFocus />;
  } else if (def.type === "phone") {
    control = <div className="ps-embed"><PhoneElement disabled={false} form={form} question={def} /></div>;
  } else if (def.type === "date") {
    const errors = form?.formState?.errors;
    control = (
      <div className="ps-embed"><Grid size={12} sx={{ px: 0, py: 1 }}><FormControl fullWidth required={def.required}>
        <Form.Date {...form.register(def.name)} control={form.control} disabled={false} validations={{ required: def.required ? "This field is required" : false }} dateRange={def.dateRange || DOB_RANGE} errors={errors?.[def.name]} />
      </FormControl></Grid></div>
    );
  } else if (def.type === "checkbox") {
    control = <div className="ps-embed"><CheckboxElement disabled={false} form={form} options={opts} question={def} /></div>;
  }
  const hint = multi ? t("q.multi") : optLike && items.length <= 6 && items.length > 1 ? "" : !optLike && isTyped(def.type) ? t("q.enter") : "";
  return (
    <div className={`qcard ${dir > 0 ? "in-next" : "in-back"} ${err ? "has-err" : ""}`} data-q={def.name}>
      <div className="q-top">
        <span className="q-sec">{secLabel}</span>
        <span className="q-pos">{t("q.pos", { i: pos, n: total })}</span>
        {!def.required && <span className="q-opt">{t("q.optional")}</span>}
      </div>
      <h2 className="q-title" id="q-title" aria-live="polite">
        <img className="q-emoji" src={emojiUrl(questionIcon(def.label, def.name, opts ? opts.map((o) => [o.label, o.value]) : null))} alt="" aria-hidden="true" width="44" height="44" decoding="async" />
        <span>{def.label}</span>
      </h2>
      {hint && <p className="q-hint">{hint}</p>}
      <div className="q-control" aria-labelledby="q-title">{control}</div>
      {specify && (
        <div className="other-box">
          <label htmlFor="q-other">✍️ {specify.label || t("q.otherSpecify")}</label>
          <input id="q-other" className="field" value={specify.value || ""} maxLength={120} autoComplete="off" placeholder={t("q.otherPh")}
            onChange={(e) => onSpecify(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onNext(); } }} />
        </div>
      )}
      <p className="q-err" role="alert">{err || ""}</p>
      <div className="q-nav">
        <button type="button" className="btn btn-ghost" onClick={onBack} style={{ visibility: showBack ? "visible" : "hidden" }}><IArrow back /> {t("q.back")}</button>
        <button type="button" className="btn" onClick={onNext} disabled={busy}>{nextLabel} <IArrow /></button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- review screen */
function ReviewRow({ name, answers, onEdit }) {
  const def = useQuery({ queryKey: ["question", name], queryFn: questionFn(name), enabled: !!name }).data;
  const value = answers?.[name];
  const parent = def?.parent;
  // the parent can be a question of another profile (answered at sign-up): its saved answer is read on its own
  const parentSaved = useQuery({
    queryKey: ["answer-one", parent],
    queryFn: () => api.post("/api/v1/me", { questions: [parent] }).then((r) => r?.data?.[parent]),
    enabled: Boolean(parent) && answers !== undefined && answers?.[parent] === undefined,
  }).data;
  const pv = parent ? answers?.[parent] ?? parentSaved : null;
  const optLike = !!def?.name && OPTION_TYPES.includes(def.type);
  const opts = useQuery({ queryKey: ["option", name, pv, parent], queryFn: optionFn("option", name, pv, parent), enabled: optLike && (!parent || !!pv) }).data;
  if (!def?.name || !filled(value)) return null;
  const shown = def.isMoney && answers?.country && Array.isArray(opts) ? moneyRanges(opts, answers.country) : opts; // income: the member's currency
  const labelOf = (v) => { const o = Array.isArray(shown) ? shown.find((x) => (typeof x === "string" ? x : x.value) === v) : null; return o ? (typeof o === "string" ? o : o.label) : String(v); };
  const text = Array.isArray(value) ? value.map(labelOf).join(", ") : def.type === "date" || ISO_DATE.test(String(value)) ? showDate(value) : labelOf(value);
  const locked = isLockedDef(def);
  return (
    <li>
      <div><small>{def.label}</small><b>{text}</b></div>
      {locked ? <span className="lock"><ILock /> Locked</span> : <button type="button" className="btn-link edit-one" onClick={onEdit}><IEdit /> Edit</button>}
    </li>
  );
}

function Review({ survey, names, theme, onEdit, onEditOne, onHub, onNext, hasNext, asSurvey }) {
  const { t } = useI18n();
  const answers = useQuery({
    queryKey: ["answers-all", survey.slug],
    queryFn: async () => (await api.post("/api/v1/me", { questions: names })).data,
  }).data;
  return (
    <div className="review qcard in-next">
      <div className="rev-head">
        <span className="rev-badge" aria-hidden="true"><img src={emojiUrl("trophy")} alt="" width="64" height="64" /><span className="rev-tick"><ICheck /></span></span>
        <div>
          <p className="rev-kicker">🏆 {t("d.badge")}</p>
          <h2>{survey.name}</h2>
          <p className="muted">{t("d.sub")}</p>
        </div>
      </div>
      <div className="rev-cta">
        <button type="button" className="btn" onClick={onEdit}><IEdit /> {t("d.editNow")}</button>
        {hasNext && <button type="button" className="btn btn-ghost" onClick={onNext}>{t(asSurvey ? "d.next.survey" : "d.next")} <IArrow /></button>}
      </div>
      <h3 className="rev-h">{t("d.answers")}</h3>
      <ul className="rev-list">{names.map((n) => <ReviewRow key={n} name={n} answers={answers} onEdit={() => onEditOne(n)} />)}</ul>
      <div className="q-nav wrap">
        <button type="button" className="btn btn-ghost" onClick={onHub}><IGrid /> {t(asSurvey ? "d.hub.survey" : "d.hub")}</button>
        <button type="button" className="btn btn-ghost" onClick={onEdit}><IEdit /> {t("d.editAll")}</button>
        {hasNext && <button type="button" className="btn" onClick={onNext}>{t(asSurvey ? "d.next.survey" : "d.next")} <IArrow /></button>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------------------------------- flow */
// asSurvey: a profile filled from the Survey section: the wording says survey instead of profile (Next survey, Back to surveys)
export default function PsFlow({ survey, user, endpage = "/api/v1/me/profile", onHub, onNextProfile, hasNext, onSaved, asSurvey = false }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  // the profile's pages as the database has them, with the v4.1 questions added where the package puts them
  const extraCat = /minor/.test(String(user?.category || "")) ? "minor" : "b2c";
  const pages = React.useMemo(() => withAdditions(survey.pages || [], extraCat, survey.slug), [survey.pages, survey.slug, extraCat]);
  const th = React.useMemo(() => themeOfProfile(survey), [survey]);
  const vars = React.useMemo(() => themeVars(th, false), [th]);
  const wasDone = progressOf(survey).done;
  const [mode, setMode] = React.useState(wasDone ? "review" : "q");
  const [pageIdx, setPageIdx] = React.useState(0);
  const [curName, setCurName] = React.useState(null);
  const [dir, setDir] = React.useState(1);
  const [err, setErr] = React.useState("");
  const [party, setParty] = React.useState(false);
  const [specifyOpen, setSpecifyOpen] = React.useState({});
  const [editOne, setEditOne] = React.useState(null); // the review screen's Edit button: only this question is asked, and its button says Update
  const form = useForm({ mode: "onChange" });
  const nextRef = React.useRef(() => {});
  const [note, setNote] = React.useState(null); // v4.1 toast: "Section complete!"
  const toast = (text) => { const id = Date.now(); setNote({ id, text }); setTimeout(() => setNote((n) => (n?.id === id ? null : n)), 2200); };
  const asked = React.useRef(new Set()); // questions already shown on this page
  const resume = React.useRef(null); // while questions listed before their parent are asked: the question the member had reached
  const deferred = React.useRef(null); // Continue / an auto-advance that waits for a follow-up question still loading
  const top = React.useRef(null);

  // ---- names on the current page (Survey.jsx: phone-whatsapp pairs are added, duplicates removed)
  const page = pages[pageIdx] || [];
  const names = React.useMemo(() => {
    const q = [...page];
    if (q.includes("phone")) q.push("phone-whatsapp");
    if (q.includes("alternate-phone")) q.push("alternate-phone-whatsapp");
    return [...new Set(q)];
  }, [page]);
  const list = names.slice(1);
  const allNames = React.useMemo(() => [...new Set(pages.flatMap((p) => p.slice(1)))], [pages]);

  // ---- saved answers of the page go into the form (Survey.jsx)
  const meQ = useQuery({
    queryKey: ["answers", page?.[0], pageIdx],
    queryFn: async () => {
      // "country" is always asked for (not shown): state, city, zip code, currency options follow the country the
      // member picked at sign-up, whichever page of the profile they are on.
      const resp = await api.post("/api/v1/me", { questions: names.includes("country") ? names : [...names, "country"] });
      Object.entries(resp.data || {}).filter(([k]) => names.includes(k)).forEach(([k, v]) => { form.setValue(k, extraArray(k, v)); if (k === "age") form.setValue(k, ""); });
      return resp.data;
    },
    enabled: mode === "q" && Boolean(page?.length),
  });
  const phoneHas = Boolean(meQ.data?.phone);
  const countryFb = meQ.data?.country;

  // ---- question definitions + options (Question.jsx)
  const defQs = useQueries({ queries: list.map((n) => ({ queryKey: ["question", n], queryFn: questionFn(n), enabled: Boolean(n) && mode === "q" })) });
  // Piping: a question that depends on another one (its parent) is shown from the parent's answer. A parent that is not on this page - answered at
  // sign-up, or on another profile - is read from the member's saved answers, so the children follow what the member already answered.
  const outsideParents = [...new Set(defQs.map((q) => q.data?.parent).filter((p) => p && !names.includes(p)))];
  const parentsQ = useQuery({
    queryKey: ["answers-parents", outsideParents.join(",")],
    queryFn: async () => (await api.post("/api/v1/me", { questions: outsideParents })).data || {},
    enabled: mode === "q" && outsideParents.length > 0,
  });
  const watchOf = (name) => form.watch(name) ?? (name === "country" ? countryFb : undefined) ?? parentsQ.data?.[name];
  const optQs = useQueries({
    queries: list.map((n, i) => {
      const def = defQs[i]?.data;
      const parent = def?.parent;
      const pv = parent ? watchOf(parent) : null;
      const kind = def?.name && OPTION_TYPES.includes(def.type) ? "option" : def?.name && isTyped(def.type) ? "validation" : null;
      return { queryKey: [kind || "none", n, pv, parent], queryFn: optionFn(kind, n, pv, parent), enabled: Boolean(kind) && (!parent || Boolean(pv)) && mode === "q" };
    }),
  });
  const items = list.map((n, i) => {
    const dq = defQs[i]; const oq = optQs[i]; const def = dq?.data;
    let status = "hidden"; let opts = null; let pattern = null;
    if (n === "alternate-phone-whatsapp" || (n === "alternate-phone" && !phoneHas)) status = "hidden";
    else if (dq?.isLoading) status = "pending";
    else if (dq?.isError || !def?.name) status = "hidden";
    else {
      const parent = def.parent; const pv = parent ? watchOf(parent) : null;
      if (OPTION_TYPES.includes(def.type)) {
        if (parent && !pv) status = "hidden";
        else if (oq?.isLoading) status = "pending";
        else { opts = normalizeOptions(oq?.data, def, form, countryFb); status = !opts || (opts.length === 0 && def.type !== "checkbox") ? "hidden" : "visible"; }
      } else if (isTyped(def.type)) {
        // asked whether or not the database has a validation pattern for it (as the classic survey form does)
        if (parent && !pv) status = "hidden";
        else if (oq?.isLoading) status = "pending";
        else { pattern = oq?.data?.pattern ? safeRe(oq.data.pattern) : null; status = "visible"; }
      } else if (def.type === "phone" || def.type === "date") status = "visible";
    }
    return { name: n, def, opts, pattern, status, locked: isLockedDef(def) };
  });
  const waiting = items.some((x) => x.status === "pending");
  // Update on the review screen asks only the edited question and the questions that depend on it (children, grandchildren...)
  const descendantsOf = (name) => {
    const out = new Set();
    const walk = (n) => (items.find((x) => x.name === n)?.def?.children || []).forEach((c) => { if (!out.has(c)) { out.add(c); walk(c); } });
    walk(name);
    return out;
  };
  const editSet = editOne ? new Set([editOne, ...descendantsOf(editOne)]) : null;
  // a locked question the member already has an answer for (date of birth, gender; the country from sign-up) is never asked again
  const hasAnswer = (x) => filled(form.getValues(x.name)) || (x.name === "country" && filled(countryFb));
  const flow = items.filter((x) => x.status === "visible" && !(x.locked && hasAnswer(x)) && (!editSet || editSet.has(x.name)));
  let idx = curName === "__last" ? flow.length - 1 : flow.findIndex((x) => x.name === curName);
  if (idx < 0) idx = 0;
  const cur = flow[idx];

  // a page with nothing to ask (after everything loaded) moves on / finishes
  React.useEffect(() => {
    if (mode !== "q" || waiting || !defQs.length || defQs.some((q) => q.isLoading)) return;
    // the question of an Edit button is not on the page (nothing to ask any more): back to the answers
    if (editOne) { if (!flow.some((x) => x.name === editOne)) { setEditOne(null); setMode("review"); } return; }
    if (cur) return;
    if (pageIdx + 1 < pages.length) { setPageIdx(pageIdx + 1); setCurName(null); } else setMode("review");
  }, [mode, waiting, cur, pageIdx, pages.length, defQs, editOne]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { top.current?.scrollIntoView?.({ block: "start", behavior: "smooth" }); }, [cur?.name, mode]);

  // ---- saving (Survey.jsx)
  const save = useMutation({
    mutationFn: (data) => api.patch(endpage, { ...data, respID: survey.respID }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["answers-all", survey.slug] });
      // the API has just paid the profile's points: refresh the Prize Machine / balance before the pop-up shows them
      Promise.resolve(onSaved?.()).catch((e) => console.log(e)).finally(() => { if (editOne) { setEditOne(null); setMode("review"); } else if (wasDone) setMode("review"); else { ui("complete"); setParty(true); } });
    },
    onError: (e) => { console.log(e); ui("error"); useToast(e); },
  });
  const submit = () => form.handleSubmit((data) => save.mutate(data))();
  // Update on the review screen: only the edited answer and the answers under it are saved (PATCH takes any number of answers);
  // an answer that was cleared because its parent changed is saved empty, so no old child answer stays behind
  const saveEdited = () => {
    const data = {};
    (editSet ? [...editSet] : []).forEach((n) => {
      const v = form.getValues(n);
      if (v === undefined) return;
      data[n] = v;
      const specify = form.getValues(`${n}_specify`);
      if (filled(specify)) data[`${n}_specify`] = specify;
    });
    save.mutate(data);
  };
  const startEditOne = (name) => {
    const at = pages.findIndex((p) => p.slice(1).includes(name));
    setPageIdx(Math.max(0, at)); setCurName(name); setDir(1); setErr(""); setEditOne(name); setMode("q");
  };

  // ---- answering: children reset + "clear later questions on this page" (Survey.jsx / Select.jsx)
  const answer = (it, value, auto) => {
    const { def, name } = it;
    const prev = form.getValues(name); // before the change: tells a pick from an un-pick for the click sound
    form.setValue(name, value, { shouldDirty: true });
    (def.children || []).forEach((c) => form.setValue(c, null));
    if (editOne) descendantsOf(name).forEach((c) => form.setValue(c, null));
    // (a profile may list a question twice: the list is de-duplicated, and the answered question itself is never cleared)
    const order = [...new Set((pages[pageIdx] || []).slice(1))]; const at = order.indexOf(name);
    // (a question whose definition has not loaded yet is left alone: it may be a locked sign-up answer such as the e-mail)
    if (at >= 0 && !editOne && !resume.current) order.slice(at + 1).forEach((q) => { const d = items.find((x) => x.name === q)?.def; if (q !== name && d?.name && !isLockedDef(d)) form.setValue(q, null); }); // never a locked one (e.g. the sign-up country)
    setErr("");
    if (Array.isArray(it.opts) && it.opts.length) {
      const picked = Array.isArray(value) ? value.find((v) => !(Array.isArray(prev) && prev.includes(v))) : value;
      const removed = Array.isArray(value) && picked === undefined;
      tap(sndLang(), Math.max(0, it.opts.findIndex((o) => o.value === (removed ? (prev || []).find((v) => !value.includes(v)) : picked))), removed ? "unpick" : "pick");
    }
    const opt = (it.opts || []).find((o) => o.value === value);
    const needsSpecify = def.type === "select" && (value === "others" || filled(opt?.describeLabel));
    setSpecifyOpen((s) => ({ ...s, [name]: needsSpecify }));
    if (AUTO_ADVANCE && auto && !needsSpecify && !editOne) setTimeout(() => nextRef.current(), 420); // 420 ms like the source: the pick animation is seen first
  };
  const specifyFor = (it) => {
    const { def, name } = it; const value = form.getValues(name);
    if (def.type === "select") {
      const opt = (it.opts || []).find((o) => o.value === value);
      if (value === "others" || filled(opt?.describeLabel)) return { label: filled(opt?.describeLabel) ? opt.describeLabel : "Please Specify", value: form.getValues(`${name}_specify`) };
    }
    if (def.type === "multiselect") {
      const picked = (it.opts || []).filter((o) => (Array.isArray(value) ? value : []).includes(o.value) && filled(o.describeLabel));
      if (picked.length) return { label: picked[0].describeLabel, value: form.getValues(`${name}_specify`) };
    }
    return null;
  };

  // ---- Next / Back
  const validate = async (it) => {
    const { def, name } = it; const v = form.getValues(name);
    if (["phone", "date", "checkbox"].includes(def.type)) { const ok = await form.trigger(name); return ok ? "" : (form.formState.errors?.[name]?.message || "Please check this answer."); }
    if (def.required && !filled(v)) return "This field is required";
    if (isTyped(def.type) && it.pattern && filled(v) && !it.pattern.test(String(v))) return "Please enter a valid value";
    return "";
  };
  // A follow-up question (one that depends on the answer just given) is still loading when it sits between this question and the next
  // one shown: moving on now would skip it. The move waits for it instead and happens by itself once it has loaded.
  const loadingAhead = () => {
    const at = items.findIndex((x) => x.name === cur?.name);
    const nextShown = flow[idx + 1];
    const until = nextShown ? items.findIndex((x) => x.name === nextShown.name) : items.length;
    return items.slice(at + 1, until).some((x) => x.status === "pending");
  };
  const onNext = async () => {
    if (!cur) return;
    const msg = await validate(cur);
    if (msg) { setErr(msg); return; }
    if (loadingAhead()) { deferred.current = cur.name; setErr(""); return; }
    deferred.current = null;
    if (editOne) {
      if (idx < flow.length - 1) { setErr(""); setDir(1); setCurName(flow[idx + 1].name); return; } // the next question under the edited one
      saveEdited();
      return;
    }
    if (page.includes("age")) {
      const age = form.getValues("age"); const dob = new Date(user?.dob);
      if (age !== undefined && age !== null && age !== "" && new Date().getFullYear() - dob.getFullYear() !== Number(age)) { setErr("The age you entered doesn't match the information on your profile. Please check and correct it."); return; }
    }
    setErr(""); setDir(1);
    asked.current.add(cur.name);
    // A question listed before the one it depends on appears only once that one is answered: it is asked then (and any others like
    // it), and the flow goes on from where the member was. Answers given meanwhile clear nothing.
    const posIn = (n) => list.indexOf(n);
    const from = resume.current || cur.name;
    const missed = flow.find((x) => x.def?.parent && posIn(x.def.parent) > posIn(x.name) && posIn(x.name) < posIn(from) && !asked.current.has(x.name) && !filled(form.getValues(x.name)));
    if (missed) { resume.current = from; ui("next"); setCurName(missed.name); return; }
    if (resume.current) {
      const ahead = flow.find((x) => posIn(x.name) > posIn(from) && !asked.current.has(x.name));
      if (ahead) { resume.current = null; ui("next"); setCurName(ahead.name); return; }
      if (waiting) { deferred.current = cur.name; return; } // a question still loading may be the next one
      resume.current = null; // everything on the page was asked: the page ends
    } else if (idx < flow.length - 1) { ui("next"); setCurName(flow[idx + 1].name); return; }
    else if (waiting) { deferred.current = cur.name; return; } // last question shown, but one that depends on it is still loading
    if (pageIdx + 1 < pages.length) { asked.current = new Set(); ui("section"); toast(t("q.sectionDone")); setPageIdx(pageIdx + 1); setCurName(null); return; }
    submit();
  };
  nextRef.current = onNext;
  const pendingKey = items.map((x) => x.status[0]).join("");
  React.useEffect(() => {
    if (deferred.current && cur?.name === deferred.current && !loadingAhead()) { deferred.current = null; onNext(); }
  }, [pendingKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const onBack = () => {
    deferred.current = null; resume.current = null;
    ui("back");
    setErr(""); setDir(-1);
    if (editOne) { setEditOne(null); setMode("review"); return; }
    if (idx > 0) setCurName(flow[idx - 1].name);
    else if (pageIdx > 0) { setPageIdx(pageIdx - 1); setCurName("__last"); }
    else if (wasDone) setMode("review");
    else onHub();
  };

  const total = questionCount(survey);
  const done = progressOf(survey).done;
  const pct = done ? 100 : Math.max(0, Math.min(99, Math.round(((pageIdx + (flow.length ? idx / flow.length : 0)) / Math.max(1, pages.length)) * 100)));
  const lastQ = pageIdx + 1 >= pages.length && idx >= flow.length - 1 && !waiting;
  const colors = [...th.c.slice(5), "#ffd36a", "#ffa200"];
  return (
    <div className={`flow w-${th.id} card-${th.card} ${th.dark ? "is-dark" : ""}`} style={{ ...vars, minHeight: "calc(100vh - 70px)" }} ref={top}>
      <ThemeScene theme={th} />
      <div className="flow-in">
        <aside className="panel" aria-label={survey.name}>
          <button type="button" className="btn-link panel-back" onClick={onHub}><IArrow back /> {t(asSurvey ? "q.surveys" : "q.profiles")}</button>
          <h1 className="panel-name">{survey.name}</h1>
          <MemberCard theme={th} variant="panel" name={survey.name} done={mode === "review"}>
            <span className="mc-bar"><i style={{ transform: `scaleX(${(mode === "review" ? 100 : pct) / 100})` }} /></span>
          </MemberCard>
          <div className="panel-prog">
            <ProgressRing pct={mode === "review" ? 100 : pct} size={58} stroke={6} label={`${mode === "review" ? 100 : pct}%`}><b>{mode === "review" ? 100 : pct}%</b></ProgressRing>
            <div className="panel-bar">
              <b>{t("hub.progress", { p: mode === "review" ? 100 : pct })}</b>
              <small>{mode === "q" ? t("q.left", { n: Math.max(0, flow.length - idx) }) : t("hub.done")}</small>
            </div>
          </div>
          {pages.length > 1 && (
            <ol className="panel-secs">
              {pages.map((p, i) => (
                <li key={p[0] + i} className={`${i < pageIdx || mode === "review" ? "done" : ""} ${mode === "q" && i === pageIdx ? "cur" : ""}`}>
                  <span className="sec-dot" aria-hidden="true">{i < pageIdx || mode === "review" ? <ICheck /> : null}</span><span>{p[0]}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
        <main className="stage" id="main">
          {mode === "review" ? (
            <Review survey={survey} names={allNames} theme={th} hasNext={hasNext} asSurvey={asSurvey} onHub={onHub} onNext={onNextProfile}
              onEdit={() => { setPageIdx(0); setCurName(null); setEditOne(null); setMode("q"); }} onEditOne={startEditOne} />
          ) : cur ? (
            <QuestionCard key={cur.name + ":" + pageIdx} it={cur} form={form} value={form.watch(cur.name)} err={err} dir={dir}
              pos={idx + 1} total={flow.length + (waiting ? 1 : 0)} secLabel={pages.length > 1 ? page[0] : survey.name}
              onAnswer={answer} onNext={onNext} onBack={onBack} showBack={idx > 0 || pageIdx > 0 || wasDone || true}
              nextLabel={editOne ? (idx < flow.length - 1 || waiting ? t("q.next") : save.isPending ? "…" : t("q.update")) : lastQ ? (save.isPending ? "…" : "Finish") : t("q.next")} busy={save.isPending}
              specify={specifyOpen[cur.name] || specifyFor(cur) ? specifyFor(cur) : null}
              onSpecify={(v) => { form.setValue(`${cur.name}_specify`, v); setErr(""); }} />
          ) : (
            <div className="qcard in-next" aria-busy="true">
              <span className="sk sk-chip" /><span className="sk sk-h" /><span className="sk sk-h short" />
              <div className="sk-tiles"><span className="sk" /><span className="sk" /><span className="sk" /><span className="sk" /></div>
              <p className="sr-only">{t("q.loading")}</p>
            </div>
          )}
        </main>
      </div>
      {note && <div className="toasts" role="status" aria-live="polite"><div className="toast" key={note.id}>🎉 {note.text}</div></div>}
      {party && (
        <Celebration survey={asSurvey} meta={{ s: survey.slug, c: "b2c" }} theme={th} name={survey.name} icon={th.icon} colors={colors}
          onClose={() => { setParty(false); setMode("review"); }} onEdit={() => { setParty(false); setPageIdx(0); setCurName(null); setMode("q"); }}
          onNext={() => { setParty(false); hasNext ? onNextProfile() : onHub(); }} onHub={() => { setParty(false); onHub(); }} />
      )}
    </div>
  );
}
