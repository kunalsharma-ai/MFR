"use client";
// Round 9: the screen a member lands on after a survey (complete, not a match, quota full, under review, unavailable).
// One centred card in the MFR look, its own colour and 3D art per outcome, nothing layered on top of anything else.
// The rating starts empty (nothing is answered for the member) and is sent only when they pick a star.
import React from "react";
import Link from "next/link";
import { api, loadData } from "@/util";
import { useQuery } from "@/Context";
import "./status.css";

const OUTCOMES = {
  complete: { tone: "ok", art: "trophy", chip: "Survey complete", title: "Thank you, your answers are in!", info: "Your points are added to your balance once the survey team confirms the response." },
  terminate: { tone: "soft", art: "compass", chip: "Not a match this time", title: "This survey was looking for a different group", info: "That happens to everyone, and it has no effect on your quality score. Your next match could be one tap away." },
  overquota: { tone: "soft", art: "ballot", chip: "Survey full", title: "This survey already has all the answers it needs", info: "Thank you for your time. Surveys fill up fast, so try the ones below while they are open." },
  speeder: { tone: "warn", art: "mag", chip: "Under review", title: "We are taking a closer look at this response", info: "Some answers came in faster or more alike than usual. Our team will review them and get back to you." },
  unavailable: { tone: "warn", art: "wrench", chip: "Survey unavailable", title: "This survey is not available right now", info: "Please try the same link again a little later. In the meantime, there are other surveys waiting for you." },
};
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function SurveyStatusPage() {
  const query = useQuery();
  const [state, setState] = React.useState({ loading: true, type: null, points: 0 });
  const [more, setMore] = React.useState([]);
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [thanks, setThanks] = React.useState(false);

  React.useEffect(() => {
    setState((s) => ({ ...s, loading: true }));
    loadData(
      api.patch(`/api/v1/survey/response`, query),
      (resp) => { const d = resp?.data; if (d) setState({ loading: false, type: d.status, points: Number(d.points) || 0 }); },
      () => setState((s) => ({ ...s, loading: false })),
    );
  }, [query]);
  React.useEffect(() => {
    loadData(api.post("/api/v1/me/survey", { status: "new" }), (resp) => setMore(Array.isArray(resp?.data) ? resp.data : []), () => {});
  }, []);

  const rate = (v) => { setRating(v); setThanks(true); api.put(`/api/v1/survey/response`, { sid: query?.sid, rating: v }); };
  const o = OUTCOMES[state.type] || OUTCOMES.terminate;
  const shown = hover || rating;

  return (
    <main className="sv9">
      <span className="sv9-sky" aria-hidden="true"><i /><i /><i /></span>
      <header className="sv9-top"><Link href="/member/dashboard" aria-label="My Frequent Rewards home"><img src="/images/logo/mfr-logo.png" alt="My Frequent Rewards" width="176" height="44" /></Link></header>
      <section className={`sv9-card t-${o.tone}`} aria-live="polite" aria-busy={state.loading}>
        {state.loading ? (
          <div className="sv9-load"><span className="sv9-spin" aria-hidden="true" /><p>Checking your response…</p></div>
        ) : (
          <>
            <div className="sv9-stage" aria-hidden="true">
              <span className="sv9-halo" />
              <img src={`/hub/3d/${o.art}.webp`} alt="" width="120" height="120" />
              {state.type === "complete" ? <><i className="sv9-c c1" /><i className="sv9-c c2" /><i className="sv9-c c3" /></> : null}
            </div>
            <p className="sv9-chip">{o.chip}</p>
            <h1>{o.title}</h1>
            {state.type === "complete" && state.points > 0 ? (
              <p className="sv9-pts"><span className="sv9-coin" aria-hidden="true" /><b>+{new Intl.NumberFormat().format(state.points)}</b> points</p>
            ) : null}
            <p className="sv9-info">{o.info}</p>

            <div className="sv9-rate">
              <p id="sv9-rate-l">{thanks ? "Thanks, your rating was sent." : "How was this survey?"}</p>
              <div className="sv9-stars" role="radiogroup" aria-labelledby="sv9-rate-l" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={rating === v} aria-label={`${v} of 5, ${LABELS[v]}`} className={v <= shown ? "on" : ""} onMouseEnter={() => setHover(v)} onFocus={() => setHover(v)} onBlur={() => setHover(0)} onClick={() => rate(v)}>★</button>
                ))}
              </div>
              <span className="sv9-rate-t">{shown ? LABELS[shown] : "Tap a star"}</span>
            </div>

            <div className="sv9-actions">
              <Link className="sv9-btn" href="/member/surveys">Find another survey <span aria-hidden="true">→</span></Link>
              <Link className="sv9-btn ghost" href="/member/dashboard">Go to dashboard</Link>
            </div>
          </>
        )}
      </section>

      {!state.loading && more.length ? (
        <section className="sv9-more" aria-labelledby="sv9-more-h">
          <h2 id="sv9-more-h">More surveys waiting for you</h2>
          <ul>
            {more.slice(0, 6).map((s) => (
              <li key={s.slug || s._id || s.name}>
                <span className="sv9-m-n">{s.name}</span>
                <span className="sv9-m-meta">{s.loi ? `~${s.loi} min` : null}{s.points ? <b>+{s.points} pts</b> : null}</span>
                <a className="sv9-btn sm" href={`/survey?name=${encodeURIComponent(s.slug || "")}`}>Start</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
