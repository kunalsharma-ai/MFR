"use client";
// Round 9: the lock banner shown above locked profiles and surveys until the basic profiles are complete.
// gate = useProfileGate(): gate.core lists the basic profiles this member has ({ slug, name, done }).
import React from "react";
import Link from "next/link";
import { t } from "../strings";
import { profileTopic } from "../topics";

const tx = (key, fallback) => { const s = t(key); return s === key ? fallback : s; };

export default function GateBanner({ gate, kind = "surveys", parent = null }) {
  const needParent = Boolean(parent && parent.applies && !parent.done);
  if (!gate || gate.loading || (gate.coreDone && !needParent)) return null;
  const core = gate.core || [];
  const done = core.filter((c) => c.done).length;
  return (
    <section className="gate9" aria-labelledby={`gate9-${kind}`}>
      <span className="gate9-pad" aria-hidden="true"><i /><img src="/hub/3d/lock.webp" alt="" width="76" height="76" /></span>
      <div>
        <h2 id={`gate9-${kind}`}>{t(`v9.gate.title.${kind}`)}</h2>
        <p>{needParent ? t("v9.gate.subParent") : t("v9.gate.sub", { n: core.length - done, m: core.length })}</p>
        <ol>
          {needParent ? [["onb", "v9.gate.parentOnb"], ["con", "v9.gate.parentCon"]].map(([k, label], i) => {
            const ok = parent[k] === "submitted" || parent[k] === "verified";
            return <li key={k} className={ok ? "ok" : ""}><Link href="/member/profiles#parent-section"><b>{ok ? "✓" : "P"}</b>{t(label)}</Link></li>;
          }) : null}
          {core.map((c, i) => {
            const tp = profileTopic(c);
            return (
              <li key={c.slug} className={c.done ? "ok" : ""}>
                <Link href={`/member/profiles?profile=${encodeURIComponent(c.slug)}`}><b>{c.done ? "✓" : i + 1}</b>{tx(`pf3.${tp.k}.title`, c.name)}</Link>
              </li>
            );
          })}
        </ol>
        <span className="gate9-bar" aria-hidden="true"><i style={{ "--w": `${core.length ? (done / core.length) * 100 : 0}%` }} /></span>
      </div>
    </section>
  );
}
