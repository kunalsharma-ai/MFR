"use client";
// Help centre (Nov 2026): search, topic cards, step-by-step guides, FAQs and "Still need help?" for every member type.
//
//   content.js (what we say)  →  data.js (who sees what, live values, search)  →  this screen
//   RaiseQuery.jsx sends a ticket to the existing support API (PUT /api/v1/support) and lists the member's tickets.
//
// Deep links: /member/help?topic=rewards, ?q=payout, ?ask=account (opens the form on that topic), #faq-<id>, #raise.
import React from "react";
import Link from "next/link";
import Icon from "../icons.jsx";
import { Reveal } from "../ui.jsx";
import { play } from "../sound";
import { t } from "../strings";
import { useHelpContext, useHelpContent, searchHelp, answerBlocks, Highlight } from "./data";
import RaiseQuery from "./RaiseQuery.jsx";
import "./help.css";

const POPULAR = {
  consumer: ["payout", "missing-points", "find-surveys", "why-profile", "q-improve", "ma-close"],
  professional: ["pro-work", "payout", "missing-points", "find-surveys", "pro-kpi", "q-improve"],
  teen: ["teen-safe", "teen-why-guardian", "teen-levels", "teen-skip", "find-surveys", "st-password"],
};

// guides shown on the "Top answers" view (only those this member can see)
const FEATURED = ["g-teen-tour", "g-tour", "g-pro", "g-profile", "g-survey", "g-rewards", "g-teen-rewards", "g-teen-safe"];

function Answer({ a, ctx, query }) {
  const blocks = answerBlocks(a, ctx);
  return (
    <div className="hp-ans">
      {blocks.map((b, i) => {
        if (typeof b === "string") return <p key={i}><Highlight text={b} query={query} /></p>;
        if (b.ul) return <ul key={i}>{b.ul.map((x, j) => <li key={j}><Highlight text={x} query={query} /></li>)}</ul>;
        if (b.ol) return <ol key={i}>{b.ol.map((x, j) => <li key={j}><Highlight text={x} query={query} /></li>)}</ol>;
        if (b.note) return <p key={i} className="hp-note"><Icon name="spark" size={16} /> <span><Highlight text={b.note} query={query} /></span></p>;
        return null;
      })}
    </div>
  );
}

function Faq({ f, ctx, open, onToggle, query, topic }) {
  const id = `faq-${f.id}`;
  return (
    <div className={`hp-faq ${open ? "is-open" : ""}`} id={id}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`${id}-a`} onClick={onToggle}>
          {topic ? <span className="hp-faq-tp" style={{ "--c1": topic.c1, "--c2": topic.c2 }}><Icon name={topic.icon} size={16} /></span> : null}
          <span className="hp-faq-q"><Highlight text={f.q} query={query} /></span>
          <span className="hp-faq-chev" aria-hidden="true"><Icon name="plus" size={18} /></span>
        </button>
      </h3>
      <div className="hp-faq-a" id={`${id}-a`} role="region" aria-labelledby={id} hidden={!open}>
        <Answer a={f.a} ctx={ctx} query={query} />
      </div>
    </div>
  );
}

function Guide({ g, topic, open, onToggle, query }) {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => { if (!open) setStep(0); }, [open]);
  const isHash = g.cta?.href?.startsWith("#");
  return (
    <article className={`hp-guide ${open ? "is-open" : ""}`} id={`guide-${g.id}`} style={{ "--c1": topic?.c1, "--c2": topic?.c2 }}>
      <button type="button" className="hp-guide-head" aria-expanded={open} onClick={onToggle}>
        <span className="hp-guide-ic"><Icon name={g.icon || topic?.icon} size={24} /></span>
        <span className="hp-guide-tx">
          <small>{t("hp.guide")} · {t("hp.steps", { n: g.steps.length })} · {t("c.minutes", { n: g.mins })}</small>
          <b><Highlight text={g.title} query={query} /></b>
        </span>
        <span className="hp-guide-go" aria-hidden="true"><Icon name="chevron" size={18} /></span>
      </button>
      {open ? (
        <div className="hp-guide-body">
          <ol className="hp-steps">
            {g.steps.map((s, i) => (
              <li key={i} className={i < step ? "done" : i === step ? "now" : ""}>
                <button type="button" onClick={() => { setStep(i); play("tap"); }} aria-current={i === step ? "step" : undefined}>
                  <span className="hp-step-n">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
                  <span className="hp-step-tx">
                    <b><Highlight text={s.t} query={query} /></b>
                    <span><Highlight text={s.d} query={query} /></span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="hp-guide-foot">
            <div className="hp-guide-nav">
              <button type="button" className="h-btn h-btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>{t("hp.back")}</button>
              {step < g.steps.length - 1 ? (
                <button type="button" className="h-btn h-btn-soft" onClick={() => { setStep((s) => s + 1); play("tap"); }}>{t("hp.next")}</button>
              ) : (
                <span className="hp-guide-done"><Icon name="check" size={16} /> {t("hp.allSet")}</span>
              )}
            </div>
            {g.cta ? (
              isHash ? (
                <a className="h-btn h-btn-primary" href={g.cta.href}>{g.cta.label} <Icon name="arrow" size={16} /></a>
              ) : (
                <Link className="h-btn h-btn-primary" href={g.cta.href}>{g.cta.label} <Icon name="arrow" size={16} /></Link>
              )
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function HeroArt({ type }) {
  return (
    <div className={`hp-art art-${type}`} aria-hidden="true">
      <span className="hp-orb o1"><Icon name="help" size={44} /></span>
      <span className="hp-orb o2"><Icon name="book" size={26} /></span>
      <span className="hp-orb o3"><Icon name="support" size={24} /></span>
      <span className="hp-orb o4"><Icon name="spark" size={20} /></span>
      <span className="hp-ring r1" />
      <span className="hp-ring r2" />
    </div>
  );
}

export default function HelpCentre() {
  const ctx = useHelpContext();
  const content = useHelpContent(ctx);
  const { topics, faqs, guides } = content;
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState("all");
  const [openFaq, setOpenFaq] = React.useState(null);
  const [openGuide, setOpenGuide] = React.useState(null);
  const [askTopic, setAskTopic] = React.useState(null);
  const bodyRef = React.useRef(null);
  const results = React.useMemo(() => searchHelp(query, content, ctx), [query, content, ctx]);
  const topicOf = React.useMemo(() => Object.fromEntries(topics.map((tp) => [tp.id, tp])), [topics]);

  // deep links
  React.useEffect(() => {
    const apply = () => {
      const sp = new URLSearchParams(window.location.search);
      const tp = sp.get("topic");
      const q = sp.get("q");
      const ask = sp.get("ask");
      if (q) setQuery(q);
      if (tp) setActive(tp);
      if (ask) setAskTopic(ask);
      const h = window.location.hash.slice(1);
      if (h.startsWith("faq-")) {
        const id = h.slice(4);
        const f = faqs.find((x) => x.id === id);
        if (f) { setActive(f.topic); setOpenFaq(id); }
      } else if (h.startsWith("guide-")) {
        const id = h.slice(6);
        const g = guides.find((x) => x.id === id);
        if (g) { setActive(g.topic); setOpenGuide(id); }
      }
      if (h || ask || tp) {
        setTimeout(() => {
          const el = h ? document.getElementById(h) : ask ? document.getElementById("raise") : bodyRef.current;
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    window.addEventListener("hub-help-nav", apply);
    return () => {
      window.removeEventListener("hashchange", apply);
      window.removeEventListener("hub-help-nav", apply);
    };
  }, [faqs.length, guides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickTopic = (id) => {
    setActive(id);
    setQuery("");
    setOpenFaq(null);
    setOpenGuide(null);
    play("tap");
    requestAnimationFrame(() => bodyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const toggleFaq = (id) => { setOpenFaq((o) => (o === id ? null : id)); play("tap"); };
  const toggleGuide = (id) => { setOpenGuide((o) => (o === id ? null : id)); play("tap"); };

  const shown = active === "all" ? null : topicOf[active];
  const listGuides = shown ? shown.guides : guides.filter((g) => FEATURED.includes(g.id));
  const listFaqs = shown ? shown.faqs : POPULAR[ctx.type].map((id) => faqs.find((f) => f.id === id)).filter(Boolean);
  const popular = POPULAR[ctx.type].map((id) => faqs.find((f) => f.id === id)).filter(Boolean).slice(0, 4);
  const searching = query.trim().length > 0;
  const hello = ctx.firstname ? t(ctx.type === "teen" ? "hp.helloTeen" : "hp.hello", { name: ctx.firstname }) : t("hp.helloAnon");

  return (
    <div className={`pg pg-help hp-type-${ctx.type}`}>
      <section className="hp-hero" aria-labelledby="hp-title">
        <div className="hp-hero-tx">
          <p className="h-eyebrow">{t(ctx.type === "teen" ? "hp.eyebrowTeen" : "hp.eyebrow")}</p>
          <h1 className="h-display" id="hp-title">{hello}</h1>
          <p className="h-lead">{t(ctx.type === "teen" ? "hp.subTeen" : "hp.sub")}</p>
          <form className="hp-search" role="search" onSubmit={(e) => { e.preventDefault(); bodyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            <Icon name="search" size={22} />
            <label className="h-sr" htmlFor="hp-q">{t("hp.searchLabel")}</label>
            <input
              id="hp-q"
              type="search"
              value={query}
              autoComplete="off"
              placeholder={t(ctx.type === "teen" ? "hp.searchPhTeen" : "hp.searchPh")}
              onChange={(e) => { setQuery(e.target.value); setOpenFaq(null); setOpenGuide(null); }}
            />
            {query ? (
              <button type="button" className="hp-search-x" aria-label={t("hp.clear")} onClick={() => setQuery("")}><Icon name="close" size={18} /></button>
            ) : null}
          </form>
          <div className="hp-popular" aria-label={t("hp.popular")}>
            <span>{t("hp.popular")}:</span>
            {popular.map((f) => (
              <a key={f.id} href={`#faq-${f.id}`} onClick={() => { setQuery(""); }}>{f.q}</a>
            ))}
          </div>
          <ul className="hp-stats" aria-label={t("hp.inside")}>
            <li><b>{guides.length}</b> {t("hp.statGuides")}</li>
            <li><b>{faqs.length}</b> {t("hp.statFaqs")}</li>
            <li><b>{topics.length}</b> {t("hp.statTopics")}</li>
          </ul>
        </div>
        <HeroArt type={ctx.type} />
      </section>

      {!searching ? (
        <section className="hp-topics" aria-labelledby="hp-topics-t">
          <h2 className="h-h2" id="hp-topics-t">{t("hp.browse")}</h2>
          <div className="hp-tgrid">
            {topics.map((tp, i) => (
              <Reveal key={tp.id} delay={Math.min(i, 8) * 40}>
                <button type="button" className={`hp-tcard ${active === tp.id ? "on" : ""}`} style={{ "--c1": tp.c1, "--c2": tp.c2 }} onClick={() => pickTopic(tp.id)} aria-pressed={active === tp.id}>
                  <span className="hp-tcard-ic"><Icon name={tp.icon} size={26} /></span>
                  <b>{tp.title}</b>
                  <small>{tp.blurb}</small>
                  <span className="hp-tcard-n">
                    {tp.guides.length ? <em>{tp.guides.length === 1 ? t("hp.nGuide") : t("hp.nGuides", { n: tp.guides.length })}</em> : null}
                    <em>{tp.faqs.length === 1 ? t("hp.nFaq") : t("hp.nFaqs", { n: tp.faqs.length })}</em>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section className="hp-body" ref={bodyRef} aria-label={t("hp.answers")}>
        {searching ? (
          <div className="hp-results">
            <h2 className="h-h2">{results.length ? t("hp.results", { n: results.length, q: query }) : t("hp.noResults", { q: query })}</h2>
            {results.length ? (
              <div className="hp-list">
                {results.map((r) => r.kind === "faq" ? (
                  <Faq key={`f-${r.item.id}`} f={r.item} ctx={ctx} query={query} topic={topicOf[r.item.topic]} open={openFaq === r.item.id} onToggle={() => toggleFaq(r.item.id)} />
                ) : (
                  <Guide key={`g-${r.item.id}`} g={r.item} topic={topicOf[r.item.topic]} query={query} open={openGuide === r.item.id} onToggle={() => toggleGuide(r.item.id)} />
                ))}
              </div>
            ) : (
              <div className="hp-none">
                <p>{t("hp.noResultsText")}</p>
                <a href="#raise" className="h-btn h-btn-primary" onClick={() => setAskTopic("other")}>{t("hp.askUs")} <Icon name="arrow" size={16} /></a>
              </div>
            )}
          </div>
        ) : (
          <div className="hp-layout">
            <nav className="hp-rail" aria-label={t("hp.topics")}>
              <button type="button" className={active === "all" ? "on" : ""} onClick={() => pickTopic("all")} aria-pressed={active === "all"}>
                <span className="hp-rail-ic" style={{ "--c1": "#ff6a13", "--c2": "#ec4899" }}><Icon name="star" size={16} /></span> {t("hp.top")}
              </button>
              {topics.map((tp) => (
                <button key={tp.id} type="button" className={active === tp.id ? "on" : ""} onClick={() => pickTopic(tp.id)} aria-pressed={active === tp.id}>
                  <span className="hp-rail-ic" style={{ "--c1": tp.c1, "--c2": tp.c2 }}><Icon name={tp.icon} size={16} /></span> {tp.title}
                </button>
              ))}
            </nav>
            <div className="hp-main">
              <header className="hp-main-head" style={shown ? { "--c1": shown.c1, "--c2": shown.c2 } : undefined}>
                <span className="hp-main-ic"><Icon name={shown ? shown.icon : "star"} size={28} /></span>
                <div>
                  <h2 className="h-h2">{shown ? shown.title : t("hp.topTitle")}</h2>
                  <p className="h-sub">{shown ? shown.blurb : t("hp.topSub")}</p>
                </div>
                {shown?.href ? <Link href={shown.href} className="h-btn h-btn-soft hp-goto">{t("hp.goTo", { s: shown.title })} <Icon name="arrow" size={16} /></Link> : null}
              </header>
              {listGuides.length ? (
                <>
                  <h3 className="hp-h"><Icon name="book" size={18} /> {t("hp.guides")}</h3>
                  <div className="hp-guides">
                    {listGuides.map((g) => (
                      <Guide key={g.id} g={g} topic={topicOf[g.topic]} query="" open={openGuide === g.id} onToggle={() => toggleGuide(g.id)} />
                    ))}
                  </div>
                </>
              ) : null}
              <h3 className="hp-h"><Icon name="help" size={18} /> {shown ? t("hp.faqs") : t("hp.topFaqs")}</h3>
              <div className="hp-list">
                {listFaqs.map((f) => (
                  <Faq key={f.id} f={f} ctx={ctx} query="" topic={shown ? null : topicOf[f.topic]} open={openFaq === f.id} onToggle={() => toggleFaq(f.id)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <RaiseQuery topics={topics} askTopic={askTopic} onAskTopicUsed={() => setAskTopic(null)} type={ctx.type} />
    </div>
  );
}
