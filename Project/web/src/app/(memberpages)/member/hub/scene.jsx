"use client";
// v4 (Kunal round 3): the 3D stage every section banner carries on its right-hand side.
// Each section has its own artwork (the MFR HD illustrations in public/images) and its own motion:
//   dashboard  orbit    planets circle the reward star          profile   cards    profile cards fan in 3D
//   surveys    rise     ticks rise off the survey board         rewards   coins    coins spin and drop
//   quality    gauge    a 3D dial sweeps                        activity  bars     3D bars pulse like a wave
//   referrals  network  friends link up across the stage        messages  mail     envelopes fly in
//   account    shield   a shield turns on its podium            settings  gears    two gears turn together
//   help       bubbles  chat bubbles float up                   services  clock    the clock hand sweeps
// Everything is decorative (aria-hidden) and holds no numbers, so it never shows anything the data does not.
// The stage tilts with the pointer; reduced motion stops the movement and the tilt.
import React from "react";
import { useMember } from "@/Context";
import { usePrefs, motionReduced } from "./prefs";
import { memberTypeOf } from "./data";

const SCENES = {
  dashboard: { img: "/images/dashboard/rewardpoint.png", motif: "orbit" },
  profile: { img: "/images/myaccount/totalprofilecompletion.png", motif: "cards" },
  surveys: { img: "/images/dashboard/totalsurveytaken.png", motif: "rise" },
  rewards: { img: "/images/dashboard/currentreward.png", motif: "coins" },
  quality: { img: "/images/myaccount/profilestatus.png", motif: "gauge" },
  activity: { img: "/images/myaccount/approvedsurvey.png", motif: "bars" },
  referrals: { img: "/images/home/profiling/real.png", motif: "network" },
  messages: { img: "/images/home/profiling/postal.png", motif: "mail" },
  account: { img: "/images/home/profiling/unique-recruitment.png", motif: "shield" },
  settings: { img: "/images/home/profiling/advanced-technology.png", motif: "gears" },
  help: { img: "/images/home/profiling/client-satisfaction.png", motif: "bubbles" },
  services: { img: "/images/home/profiling/quick-turnaround.png", motif: "clock" },
};
// teens get the trophy on the dashboard and never the money bag
const TEEN = { dashboard: { img: "/images/dashboard/currentreward.png", motif: "orbit" }, rewards: { img: "/images/myaccount/profilestatus.png", motif: "coins" } };

const KIND_TO_SCENE = { "dash-c": "dashboard", "dash-p": "dashboard", "dash-t": "dashboard" };
export const sceneKey = (kind) => KIND_TO_SCENE[kind] || kind;

function Motif({ motif }) {
  switch (motif) {
    case "orbit":
      return <><i className="m-orb p1" /><i className="m-orb p2" /><i className="m-orb p3" /><i className="m-track t1" /><i className="m-track t2" /></>;
    case "cards":
      return <><i className="m-card c1" /><i className="m-card c2" /><i className="m-card c3" /></>;
    case "rise":
      return <><i className="m-tick k1">✓</i><i className="m-tick k2">✓</i><i className="m-tick k3">✓</i><i className="m-tick k4">✓</i></>;
    case "coins":
      return <><i className="m-coin n1" /><i className="m-coin n2" /><i className="m-coin n3" /><i className="m-coin n4" /></>;
    case "gauge":
      return <><i className="m-dial" /><i className="m-needle" /></>;
    case "bars":
      return <span className="m-bars">{Array.from({ length: 6 }).map((_, i) => <i key={i} style={{ "--i": i }} />)}</span>;
    case "network":
      return <><svg className="m-net" viewBox="0 0 200 140"><path d="M20 110 L70 40 L130 90 L180 30 M70 40 L180 30 M20 110 L130 90" /></svg><i className="m-node d1" /><i className="m-node d2" /><i className="m-node d3" /><i className="m-node d4" /></>;
    case "mail":
      return <><i className="m-env e1" /><i className="m-env e2" /><i className="m-env e3" /></>;
    case "shield":
      return <><i className="m-halo" /><i className="m-lock" /></>;
    case "gears":
      return <><i className="m-gear g1" /><i className="m-gear g2" /></>;
    case "bubbles":
      return <><i className="m-bub b1" /><i className="m-bub b2" /><i className="m-bub b3" /></>;
    case "clock":
      return <><i className="m-sweep" /><i className="m-spark s1" /><i className="m-spark s2" /></>;
    default:
      return null;
  }
}

export default function Scene3D({ kind, children }) {
  const member = useMember();
  const type = memberTypeOf(member);
  const key = sceneKey(kind);
  const sc = (type === "teen" && TEEN[key]) || SCENES[key] || SCENES.dashboard;
  const prefs = usePrefs();
  const still = motionReduced(prefs);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    const host = el?.closest("section") || el;
    if (!el || !host || still || typeof window === "undefined" || !window.matchMedia?.("(pointer: fine)").matches) return undefined;
    let raf = 0;
    const move = (e) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--ry", `${(x * 16).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-y * 12).toFixed(2)}deg`);
      });
    };
    const leave = () => { el.style.setProperty("--ry", "0deg"); el.style.setProperty("--rx", "0deg"); };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); };
  }, [still]);

  return (
    <div ref={ref} className={`s3 s3-${sc.motif} s3-k-${key}`} data-still={still ? "1" : undefined}>
      <div className="s3-stage" aria-hidden="true">
        <span className="s3-floor" />
        <span className="s3-ring r1" />
        <span className="s3-ring r2" />
        <span className="s3-orb o1" />
        <span className="s3-orb o2" />
        <span className="s3-orb o3" />
        <span className="s3-cube"><i /><i /><i /><i /><i /><i /></span>
        <span className="s3-podium"><i /></span>
        <span className="s3-hero"><img src={sc.img} alt="" loading="lazy" decoding="async" /></span>
        <span className="s3-motif"><Motif motif={sc.motif} /></span>
        <span className="s3-glint" />
      </div>
      {children ? <div className="s3-front">{children}</div> : null}
    </div>
  );
}
