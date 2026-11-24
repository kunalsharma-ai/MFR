"use client";
// Round 9b (Kunal, 24 Nov 2026): every survey stays locked until all basic profiles are done ("in an attractive
// manner"). The banner above locked profiles and surveys is a vault: a golden padlock inside a ring that fills as the
// basic profiles are finished, the steps as tickets (done ones stamped), and a bar. Teens see the parent steps first.
// gate = useProfileGate(): gate.core lists the basic profiles this member has ({ slug, name, done }).
import React from "react";
import Link from "next/link";
import { t } from "../strings";
import { profileTopic } from "../topics";
import Icon from "../icons.jsx";

const tx = (key, fallback) => { const s = t(key); return s === key ? fallback : s; };
const ART = { basic: "smile", education: "graduation", career: "briefcase2", money: "money" };

export default function GateBanner({ gate, kind = "surveys", parent = null }) {
  const needParent = Boolean(parent && parent.applies && !parent.done);
  if (!gate || gate.loading || (gate.coreDone && !needParent)) return null;
  const core = gate.core || [];
  const parentSteps = needParent ? [["onb", "v9.gate.parentOnb"], ["con", "v9.gate.parentCon"]].map(([k, label]) => ({ k, label: t(label), ok: parent[k] === "submitted" || parent[k] === "verified" })) : [];
  const steps = [...parentSteps.map((p) => ({ key: p.k, label: p.label, done: p.ok, href: "/member/profiles#parent-section", art: p.k === "onb" ? "family" : "pencil", who: "parent" })),
    ...core.map((c) => { const tp = profileTopic(c); return { key: c.slug, label: tx(`pf3.${tp.k}.title`, c.name), done: c.done, href: `/member/profiles?profile=${encodeURIComponent(c.slug)}`, art: ART[tp.k] || "sparkles", c1: tp.c1, c2: tp.c2 }; })];
  const done = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const next = steps.find((s) => !s.done);
  return (
    <section className="gate10" aria-labelledby={`gate10-${kind}`} style={{ "--p": pct }}>
      <span className="gate10-glow" aria-hidden="true" />
      <div className="gate10-vault" aria-hidden="true">
        <span className="gate10-ring" />
        <span className="gate10-pad"><img src="/hub/3d/lock.webp" alt="" width="72" height="72" /></span>
        <span className="gate10-count"><b>{done}</b>/{steps.length}</span>
      </div>
      <div className="gate10-main">
        <p className="gate10-eyebrow"><Icon name="lock" size={13} /> {t(`v9.gate.eyebrow.${kind}`)}</p>
        <h2 id={`gate10-${kind}`}>{t(`v9.gate.title.${kind}`)}</h2>
        <p className="gate10-sub">{needParent ? t("v9.gate.subParent") : t("v9.gate.sub", { n: steps.length - done, m: steps.length })}</p>
        <ol className="gate10-steps">
          {steps.map((s, i) => (
            <li key={s.key} className={s.done ? "ok" : s === next ? "next" : ""} style={s.c1 ? { "--c1": s.c1, "--c2": s.c2 } : undefined}>
              <Link href={s.href}>
                <span className="gate10-art"><img src={`/hub/3d/${s.art}.webp`} alt="" width="30" height="30" loading="lazy" />{s.done ? <i><Icon name="check" size={11} /></i> : null}</span>
                <span className="gate10-tx"><small>{s.who === "parent" ? t("v9.gate.parentStep") : t("v9.gate.step", { n: i + 1 - parentSteps.length })}</small><b>{s.label}</b></span>
                {s.done ? <em className="gate10-done">{t("c.done")}</em> : <em className="gate10-go">{s === next ? t("v9.gate.start") : null}<Icon name="arrow" size={13} /></em>}
              </Link>
            </li>
          ))}
        </ol>
        <span className="gate10-bar" aria-hidden="true"><i /></span>
      </div>
    </section>
  );
}
