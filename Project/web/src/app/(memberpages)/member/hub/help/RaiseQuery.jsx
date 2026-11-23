"use client";
// "Still need help?": raise a query (a support ticket) and follow the member's own tickets.
// Uses the existing support API: PUT /api/v1/support creates the ticket and e-mails the member and the support team;
// replies are read on the existing ticket page (/member/support/open?ticket=…).
import React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/util";
import Icon from "../icons.jsx";
import { play } from "../sound";
import { t } from "../strings";
import { relDay } from "../data";
import { useMyQueries } from "./data";

const MAX_IMG = 5 * 1024 * 1024;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// plain text → the simple HTML the support team's ticket screen shows
const toHtml = (txt) => txt.trim().split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");

function MyQueries() {
  const q = useMyQueries();
  const list = q.data || [];
  return (
    <section className="hp-mine" aria-labelledby="hp-mine-t">
      <header>
        <h3 className="h-h3" id="hp-mine-t"><Icon name="mail" size={20} /> {t("hp.mine")}</h3>
        {list.length ? <Link href="/member/support" className="h-link">{t("c.viewAll")} <Icon name="arrow" size={14} /></Link> : null}
      </header>
      {q.isLoading ? (
        <p className="hp-mine-empty">{t("c.loading")}</p>
      ) : q.isError ? (
        <p className="hp-mine-empty">{t("hp.mineError")} <button type="button" className="h-link" onClick={() => q.refetch()}>{t("c.retry")}</button></p>
      ) : list.length ? (
        <ul>
          {list.slice(0, 5).map((x) => (
            <li key={x.id}>
              <Link href={`/member/support/open?ticket=${encodeURIComponent(x.id)}`}>
                <span className={`hp-st st-${x.status}`}>{t(`hp.status.${x.status}`) === `hp.status.${x.status}` ? x.status : t(`hp.status.${x.status}`)}</span>
                <span className="hp-mine-s">
                  <b>{x.subject || t("hp.noSubject")}</b>
                  <small>#{x.no}{x.at ? ` · ${relDay(x.at, t)}` : ""}</small>
                </span>
                <Icon name="chevron" size={16} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hp-mine-empty">{t("hp.mineEmpty")}</p>
      )}
    </section>
  );
}

export default function RaiseQuery({ topics, askTopic, onAskTopicUsed, type }) {
  const qc = useQueryClient();
  const [topic, setTopic] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [phase, setPhase] = React.useState("idle"); // idle | sending | sent | error
  const [msg, setMsg] = React.useState("");
  const [ticket, setTicket] = React.useState(null);
  const subjectRef = React.useRef(null);

  React.useEffect(() => {
    if (!askTopic) return;
    setTopic(askTopic === "other" || topics.some((tp) => tp.id === askTopic) ? askTopic : "other");
    setPhase("idle");
    onAskTopicUsed?.();
    setTimeout(() => subjectRef.current?.focus({ preventScroll: true }), 400);
  }, [askTopic]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const choices = [...topics.filter((tp) => tp.id !== "support"), { id: "other", title: t("hp.other"), icon: "spark", c1: "#64748b", c2: "#ec4899" }];
  const ready = topic && subject.trim().length >= 3 && details.trim().length >= 10 && phase !== "sending";

  function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setMsg(t("hp.imgType")); return; }
    if (f.size > MAX_IMG) { setMsg(t("av.tooBig")); return; }
    setMsg("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!ready) return;
    setPhase("sending");
    setMsg("");
    try {
      const attachments = [];
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await api.post("/api/v1/upload/image", fd);
        const url = up?.file?.url;
        if (up?.status !== "success" || !url) throw new Error(t("hp.imgFail"));
        attachments.push(url);
      }
      const tp = choices.find((c) => c.id === topic);
      const r = await api.put("/api/v1/support", {
        subject: subject.trim(),
        description: toHtml(details),
        category: topic,
        department: "member-help-centre",
        tags: ["help-centre", type, topic],
        attachments,
      });
      if (!r || r.status !== "success") throw new Error(r?.message || t("hp.sendFail"));
      setTicket({ no: r.data?.ticketNo || String(r.data?._id || "").slice(-6).toUpperCase(), id: r.data?._id, topic: tp?.title });
      setPhase("sent");
      play("complete");
      setSubject("");
      setDetails("");
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["hub", "help", "queries"] });
    } catch (err) {
      setPhase("error");
      setMsg(err?.message || t("hp.sendFail"));
    }
  }

  return (
    <section className="hp-raise" id="raise" aria-labelledby="hp-raise-t">
      <div className="hp-raise-l">
        <span className="hp-raise-badge" aria-hidden="true"><Icon name="support" size={34} /></span>
        <p className="h-eyebrow">{t("hp.raiseEyebrow")}</p>
        <h2 className="h-h2" id="hp-raise-t">{t(type === "teen" ? "hp.raiseTitleTeen" : "hp.raiseTitle")}</h2>
        <p className="h-sub">{t(type === "teen" ? "hp.raiseSubTeen" : "hp.raiseSub")}</p>
        <ol className="hp-how">
          <li><span>1</span> {t("hp.how1")}</li>
          <li><span>2</span> {t("hp.how2")}</li>
          <li><span>3</span> {t("hp.how3")}</li>
        </ol>
        <MyQueries />
      </div>

      <div className="hp-raise-r">
        {phase === "sent" && ticket ? (
          <div className="hp-sent" role="status">
            <span className="hp-sent-ic" aria-hidden="true"><Icon name="check" size={40} /></span>
            <h3 className="h-h2">{t("hp.sentTitle")}</h3>
            <p>{t("hp.sentText", { no: ticket.no })}</p>
            <div className="h-ctas">
              {ticket.id ? <Link className="h-btn h-btn-primary" href={`/member/support/open?ticket=${encodeURIComponent(ticket.id)}`}>{t("hp.openTicket")} <Icon name="arrow" size={16} /></Link> : null}
              <button type="button" className="h-btn h-btn-ghost" onClick={() => { setPhase("idle"); setTopic(""); }}>{t("hp.another")}</button>
            </div>
          </div>
        ) : (
          <form className="hp-form" onSubmit={submit} noValidate>
            <fieldset>
              <legend>{t("hp.fTopic")} <i aria-hidden="true">*</i></legend>
              <div className="hp-chips" role="radiogroup" aria-label={t("hp.fTopic")}>
                {choices.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={topic === c.id}
                    className={`hp-chip ${topic === c.id ? "on" : ""} ${c.id === "other" ? "is-other" : ""}`}
                    style={{ "--c1": c.c1, "--c2": c.c2 }}
                    onClick={() => { setTopic(c.id); play("tap"); }}
                  >
                    <Icon name={c.icon} size={16} /> {c.title}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="hp-field">
              <span>{t("hp.fSubject")} <i aria-hidden="true">*</i></span>
              <input ref={subjectRef} value={subject} maxLength={140} onChange={(e) => setSubject(e.target.value)} placeholder={t(topic === "other" ? "hp.fSubjectPhOther" : "hp.fSubjectPh")} required />
            </label>
            <label className="hp-field">
              <span>{t("hp.fDetails")} <i aria-hidden="true">*</i></span>
              <textarea value={details} rows={5} maxLength={4000} onChange={(e) => setDetails(e.target.value)} placeholder={t(type === "teen" ? "hp.fDetailsPhTeen" : "hp.fDetailsPh")} required />
              <small className="hp-count">{details.length} / 4000</small>
            </label>
            <div className="hp-attach">
              {preview ? (
                <span className="hp-thumb">
                  <img src={preview} alt={t("hp.fShot")} />
                  <button type="button" aria-label={t("av.remove")} onClick={() => { setFile(null); setPreview(null); }}><Icon name="close" size={14} /></button>
                </span>
              ) : null}
              <label className="h-btn h-btn-ghost hp-attach-btn">
                <Icon name="camera" size={18} /> {preview ? t("av.replace") : t("hp.fShotAdd")}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="h-sr" />
              </label>
              <small>{t("hp.fShotHint")}</small>
            </div>
            {type === "teen" ? <p className="hp-note"><Icon name="shield" size={16} /> <span>{t("hp.teenNote")}</span></p> : null}
            {msg ? <p className="st-err" role="alert">{msg}</p> : null}
            <div className="hp-form-end">
              <button type="submit" className="h-btn h-btn-primary h-btn-lg" disabled={!ready}>
                <Icon name="send" size={18} /> {phase === "sending" ? t("hp.sending") : t("hp.send")}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
