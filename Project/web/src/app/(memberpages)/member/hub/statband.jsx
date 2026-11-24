"use client";
// v4 (Kunal round 3): the row of colour stat cards members know from the MFR dashboard, rebuilt in 3D.
// Every number is real: survey counts from GET /me/statistics (useStats) and points from useHub(), the same
// source as the header. While a figure loads it shows "…", never a made-up value. Teens see XP, never cash.
import React from "react";
import Link from "next/link";
import { Counter } from "./ui.jsx";
import { t } from "./strings";

const IMG = {
  started: "/images/dashboard/totalsurveytaken.png",
  complete: "/images/dashboard/completedsurvey.png",
  disqualified: "/images/dashboard/disqualifiedsurvey.png",
  earned: "/images/dashboard/rewardpoint.png",
  balance: "/images/dashboard/claimedreward.png",
  balanceTeen: "/images/dashboard/currentreward.png",
};

export default function StatBand({ hub }) {
  const { type, stats, pts, earned } = hub;
  const s = stats?.data;
  const teen = type === "teen";
  const items = [
    { k: "started", v: s ? s.started : null, href: "/member/surveys" },
    { k: "complete", v: s ? s.complete : null, href: "/member/activity" },
    { k: "disqualified", v: s ? s.disqualified : null, href: "/member/activity" },
    { k: "earned", v: hub.points?.data || hub.bal ? earned : null, href: "/member/rewards" },
    { k: "balance", v: pts ? pts.total : null, href: "/member/rewards", img: teen ? IMG.balanceTeen : IMG.balance },
  ];
  return (
    <section className="v4-stats" aria-label={t("v4.statsTitle")}>
      {items.map((it, i) => (
        <Link key={it.k} href={it.href} className={`v4-stat st-${it.k}`} style={{ "--i": i }}>
          <span className="v4-stat-shine" aria-hidden="true" />
          <span className="v4-stat-art" aria-hidden="true"><img src={it.img || IMG[it.k]} alt="" loading="lazy" decoding="async" /></span>
          <b className="v4-stat-n">{it.v == null ? "…" : <Counter value={it.v} />}</b>
          <span className="v4-stat-l">{t(`v4.stat.${it.k}.${type}`)}</span>
        </Link>
      ))}
    </section>
  );
}
