"use client";
// Rewards page additions: bonus offers, the reward goal, the redemption catalogue with "you can afford this now",
// the redeem dialog and the member's own requests. Teens see points only (no money) and every reward needs their
// guardian's OK.
import React from "react";
import { useMember } from "@/Context";
import Icon from "../icons.jsx";
import { t } from "../strings";
import { Reveal, LoadingBlock, ErrorState, EmptyState } from "../ui.jsx";
import { fmt, memberTypeOf } from "../data";
import { useEngage, useEngageMutation } from "./data";
import { play } from "../sound";
import "./engage.css";

const KIND_ICON = { giftcard: "rewards", upi: "wallet", paypal: "wallet", charity: "heart", learning: "star" };
const cash = (v, cur = "USD") => (v == null ? "" : new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v));
const inr = (v) => (v == null ? "" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v));
const when = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const useRewardsData = () => useEngage("rewards", "/rewards");

function Offers({ offers }) {
  if (!offers?.length) return null;
  return (
    <ul className="eg-offers" aria-label={t("of.title")}>
      {offers.map((o) => (
        <li key={o.id} className="eg-offer">
          <span className="eg-offer-x" aria-hidden="true">{o.multiplier}×</span>
          <span>
            <b>{o.title}</b>
            <small>{o.weekend ? t("of.weekend", { m: o.multiplier }) : o.description || t("of.generic", { m: o.multiplier })}{o.endsAt ? ` · ${t("of.until", { d: when(o.endsAt) })}` : ""}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Goal({ data, onPick }) {
  const g = data.goal;
  const clear = useEngageMutation("put", "/rewards/goal");
  if (!g) {
    return (
      <section className="eg-card eg-goal is-empty" aria-labelledby="gl-title">
        <h2 className="h-h3" id="gl-title"><Icon name="trophy" size={20} /> {t("gl.title")}</h2>
        <p className="h-sub">{t("gl.empty")}</p>
        <button type="button" className="h-btn h-btn-soft" onClick={onPick}>{t("gl.pick")}</button>
      </section>
    );
  }
  return (
    <section className={`eg-card eg-goal${g.reached ? " is-reached" : ""}`} aria-labelledby="gl-title">
      <h2 className="h-h3" id="gl-title"><Icon name="trophy" size={20} /> {t("gl.title")}</h2>
      <p className="eg-goal-name"><Icon name={KIND_ICON[g.item.kind]} size={18} /> {g.item.title}{g.item.value != null ? ` · ${cash(g.item.value)}` : ""}</p>
      <div className="eg-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={g.pct} aria-label={t("gl.title")}><i style={{ "--w": `${g.pct}%` }} /></div>
      <p className="eg-goal-meta">
        <b>{fmt(g.available)} / {fmt(g.points)}</b> {t("c.points")}
        {g.reached ? <span className="eg-pill ok">{t("gl.reached")}</span> : <span className="eg-pill muted">{t("gl.left", { n: fmt(g.left) })}</span>}
      </p>
      <div className="eg-actions">
        <button type="button" className="h-btn h-btn-ghost" onClick={onPick}>{t("gl.change")}</button>
        <button type="button" className="h-btn h-btn-ghost" disabled={clear.isPending} onClick={() => clear.mutate({ item: null })}>{t("gl.clear")}</button>
      </div>
    </section>
  );
}

function RedeemDialog({ item, open, onClose }) {
  const [upi, setUpi] = React.useState("");
  const [paypal, setPaypal] = React.useState("");
  const m = useEngageMutation("post", "/rewards/redeem");
  const ref = React.useRef(null);
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item && !d.open) d.showModal?.();
    if (!item && d.open) d.close?.();
  }, [item]);
  if (!item) return <dialog ref={ref} className="eg-dialog" />;
  const submit = (e) => {
    e.preventDefault();
    m.mutate({ item: item.key, upi, paypal }, { onSuccess: () => play("reward") });
  };
  return (
    <dialog ref={ref} className="eg-dialog" onClose={onClose} aria-labelledby="rd-title">
      <form method="dialog" onSubmit={submit}>
        <h2 className="h-h3" id="rd-title"><Icon name={KIND_ICON[item.kind]} size={20} /> {item.title}</h2>
        <p className="h-sub">{item.subtitle} · <b>{fmt(item.points)} {t("c.points")}</b>{item.value != null ? ` · ${cash(item.value)}` : ""}{item.valueInr ? ` (${inr(item.valueInr)})` : ""}</p>
        {m.isSuccess ? (
          <div className="eg-done">
            <p className="eg-ok"><Icon name="check" size={18} /> {item.needsGuardian ? t("rd.sentGuardian") : t("rd.sent")}</p>
            <p className="eg-note">{t("rd.ref", { r: m.data.reference })}</p>
            <button type="button" className="h-btn h-btn-primary" onClick={onClose}>{t("c.done")}</button>
          </div>
        ) : !open ? (
          <>
            <p className="eg-note">{item.needsGuardian ? t("rd.closedTeen") : t("rd.closed")}</p>
            <button type="button" className="h-btn h-btn-primary" onClick={onClose}>{t("c.done")}</button>
          </>
        ) : (
          <>
            {item.kind === "upi" ? (
              <label className="eg-field"><span>{t("rd.upi")}</span><input required value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" autoComplete="off" /></label>
            ) : item.kind === "paypal" ? (
              <label className="eg-field"><span>{t("rd.paypal")}</span><input required type="email" value={paypal} onChange={(e) => setPaypal(e.target.value)} autoComplete="email" /></label>
            ) : (
              <p className="eg-note">{item.kind === "charity" ? t("rd.charity") : t("rd.email")}</p>
            )}
            <p className="eg-note">{item.needsGuardian ? t("rd.guardianNote") : t("rd.holdNote")}</p>
            {m.isError ? <p className="eg-err" role="alert">{m.error.message}</p> : null}
            <div className="eg-actions">
              <button type="submit" className="h-btn h-btn-primary" disabled={m.isPending}>{m.isPending ? t("c.saving") : item.needsGuardian ? t("rd.askGuardian") : t("rd.confirm")}</button>
              <button type="button" className="h-btn h-btn-ghost" onClick={onClose}>{t("c.cancel")}</button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}

function Catalogue({ data, picking, onPicked }) {
  const [kind, setKind] = React.useState("");
  const [redeem, setRedeem] = React.useState(null);
  const goal = useEngageMutation("put", "/rewards/goal");
  const kinds = [...new Set(data.items.map((x) => x.kind))];
  const list = data.items.filter((x) => !kind || x.kind === kind);
  return (
    <section className="eg-card eg-cat" aria-labelledby="ct-title" id="catalogue">
      <div className="eg-ledger-head">
        <div>
          <h2 className="h-h3" id="ct-title"><Icon name="rewards" size={20} /> {t("ct.title")}</h2>
          <p className="h-sub">{picking ? t("gl.pickHint") : t("ct.sub")}</p>
        </div>
        {kinds.length > 1 ? (
          <div className="eg-chips" role="group" aria-label={t("lg.type")}>
            <button type="button" aria-pressed={!kind} onClick={() => setKind("")}>{t("ct.all")}</button>
            {kinds.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{t(`ct.k.${k}`)}</button>)}
          </div>
        ) : null}
      </div>
      {data.placeholder ? <p className="eg-note"><Icon name="clock" size={16} /> {t("ct.placeholder")}</p> : null}
      {!list.length ? <EmptyState kind="rewards" title={t("ct.none")} text="" /> : (
        <ul className="eg-items">
          {list.map((x) => (
            <li key={x.key} className={`eg-item k-${x.kind}${x.affordable ? " can" : ""}`}>
              {x.affordable ? <span className="eg-can">{t("ct.can")}</span> : null}
              <span className="eg-item-ic" aria-hidden="true"><Icon name={KIND_ICON[x.kind]} size={24} /></span>
              <b className="eg-item-t">{x.title}</b>
              <small className="eg-item-s">{x.subtitle}</small>
              <span className="eg-item-p">{fmt(x.points)} {t("c.pts")}{x.value != null ? <em> · {cash(x.value)}</em> : null}</span>
              {!x.affordable ? <small className="eg-item-left">{t("ct.left", { n: fmt(x.left) })}</small> : null}
              <div className="eg-actions">
                {picking ? (
                  <button type="button" className="h-btn h-btn-primary" disabled={goal.isPending} onClick={() => goal.mutate({ item: x.key }, { onSuccess: onPicked })}>{t("gl.this")}</button>
                ) : (
                  <>
                    <button type="button" className="h-btn h-btn-primary" disabled={!x.affordable} onClick={() => setRedeem(x)}>{x.needsGuardian ? t("ct.ask") : t("ct.redeem")}</button>
                    {data.goal?.item?.key !== x.key ? <button type="button" className="h-btn h-btn-ghost" disabled={goal.isPending} onClick={() => goal.mutate({ item: x.key })}>{t("gl.set")}</button> : <span className="eg-pill">{t("gl.yours")}</span>}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <RedeemDialog item={redeem} open={data.open} onClose={() => setRedeem(null)} />
    </section>
  );
}

const STATUS_TONE = { requested: "warn", guardian_pending: "warn", approved: "", fulfilled: "ok", rejected: "muted", cancelled: "muted" };
function Requests({ list }) {
  const cancel = useEngageMutation("post", (b) => `/rewards/redemptions/${b.id}/cancel`);
  if (!list?.length) return null;
  return (
    <section className="eg-card" aria-labelledby="rq-title">
      <h2 className="h-h3" id="rq-title"><Icon name="clock" size={20} /> {t("rq.title")}</h2>
      <ul className="eg-reqs">
        {list.map((r) => (
          <li key={r.id}>
            <span>
              <b>{r.item?.title}</b> · {fmt(r.points)} {t("c.pts")}
              <small className="eg-name">{r.reference} · {when(r.createdAt)}{r.payout?.masked ? ` · ${r.payout.masked}` : ""}{r.note ? ` · ${r.note}` : ""}</small>
            </span>
            <span className={`eg-pill ${STATUS_TONE[r.status] || ""}`}>{t(`rq.s.${r.status}`)}</span>
            {["requested", "guardian_pending"].includes(r.status) ? (
              <button type="button" className="h-btn h-btn-ghost" disabled={cancel.isPending} onClick={() => cancel.mutate({ id: r.id })}>{t("c.cancel")}</button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RewardsExtras() {
  const member = useMember();
  const teen = memberTypeOf(member) === "teen";
  const R = useRewardsData();
  const [picking, setPicking] = React.useState(false);
  if (R.isLoading) return <LoadingBlock lines={4} h={260} />;
  if (R.isError) return <ErrorState onRetry={R.refetch} />;
  const d = R.data;
  const pick = () => { setPicking(true); document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div className={`eg-rewards${teen ? " is-teen" : ""}`}>
      <Reveal><Offers offers={d.offers} /></Reveal>
      <div className="eg-grid2">
        <Reveal><Goal data={d} onPick={pick} /></Reveal>
        <Reveal delay={80}>
          <section className="eg-card" aria-labelledby="rb-title">
            <h2 className="h-h3" id="rb-title"><Icon name="wallet" size={20} /> {t("bal.available")}</h2>
            <p className="eg-big">{fmt(d.balances.available)} <small>{t("c.points")}</small></p>
            <p className="eg-note">
              {d.balances.pending ? `${t("bal.pending")}: ${fmt(d.balances.pending)} · ` : ""}
              {d.balances.onHold ? `${t("bal.onHold")}: ${fmt(d.balances.onHold)} · ` : ""}
              {d.balances.spent ? `${t("bal.spent")}: ${fmt(d.balances.spent)}` : ""}
            </p>
            {!teen ? <p className="eg-note">{t("ct.min", { n: fmt(d.minRedemption) })}</p> : <p className="eg-note">{t("ct.teenNote")}</p>}
          </section>
        </Reveal>
      </div>
      <Reveal><Catalogue data={d} picking={picking} onPicked={() => setPicking(false)} /></Reveal>
      <Reveal><Requests list={d.redemptions} /></Reveal>
    </div>
  );
}
