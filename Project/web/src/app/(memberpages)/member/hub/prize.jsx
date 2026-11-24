"use client";
// The Prize Machine on the Rewards page (v3, Nov 2026). The machine itself (profiles/ps/PrizeMachine.jsx: capsules,
// crank, chute, sounds, the +points flight to the header) is unchanged; it moved here from the profile studio.
// It needs the same reward data the Profiles page gives it (ps/rules.js setRewardData): every profile of the member's
// category, which of them are complete or already paid, and the member's points from GET /api/v1/me/points.
// This reads those same requests (same query keys, so the cache is shared) and never pays anything itself: paying
// stays with the Profiles page and useProfileGate.
import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/util";
import { useMember } from "@/Context";
import useProfileGate from "@/hooks/useProfileGate";
import { setRewardData } from "../(member pages)/profiles/ps/rules";
import { setProfileNames } from "../(member pages)/profiles/ps/i18n";
import { visibleProfiles, normalizeInterests, isCore } from "../(member pages)/profiles/ps/profileRules";
import GateDialog from "../(member pages)/profiles/ps/GateDialog";
import "../(member pages)/profiles/ps/ps.css";
import "./hub-machines.css";
import Icon from "./icons.jsx";
import { t } from "./strings";
import { LoadingBlock } from "./ui.jsx";
import { memberTypeOf, fmt } from "./data";
import { useHub } from "./store";
import { Ring, Counter } from "./ui.jsx";

// each segment has its own machine (round 6): Consumer the claw arcade, Professional the executive lift, Teen the spiral tower
const SKIN = { consumer: "claw", professional: "lift", teen: "spiral" };

const PrizeMachine = React.lazy(() => import("../(member pages)/profiles/ps/PrizeMachine"));
const MIN_STATUS = 1; // as the Profiles page

export function usePrizeData() {
  const user = useMember();
  const cat = user?.category === "minor" ? "minor" : "b2c";
  const profilesQ = useQuery({ queryKey: ["profiles", user?.category, "false"], queryFn: () => api.post("/api/v1/profile", { category: user.category }).then((r) => r.data), enabled: Boolean(user?.category) });
  const interestsQ = useQuery({
    queryKey: ["ps-interests", user?._id],
    queryFn: () => api.post("/api/v1/me", { questions: ["interests"] }).then((r) => normalizeInterests(r?.data?.interests)),
    enabled: Boolean(user?._id),
  });
  const pointsQ = useQuery({ queryKey: ["ps-points", user?._id], queryFn: () => api.get("/api/v1/me/points").then((r) => (r?.status === "error" ? null : r?.data ?? null)), enabled: Boolean(user?._id), retry: false });
  const gate = useProfileGate();
  const [ready, setReady] = React.useState(false);
  const profiles = Array.isArray(profilesQ.data) ? profilesQ.data : [];
  const interests = interestsQ.data || [];
  const shown = React.useMemo(() => visibleProfiles(profiles, interests, MIN_STATUS).filter((p) => isCore(p.slug)), [profiles, interests]);
  const loading = profilesQ.isLoading || interestsQ.isLoading || !pointsQ.isFetched || gate.loading;
  React.useEffect(() => {
    if (loading) return;
    const wonExtra = new Set(gate.extras.filter((e) => e.done).map((e) => e.slug));
    const pointsOf = {};
    gate.extras.forEach((e) => { pointsOf[e.slug] = (e.done && gate.paid?.[e.slug]) || Number(e.points) || 0; });
    setProfileNames(profiles);
    setRewardData({
      uid: user?._id,
      cat,
      profiles: [...shown, ...profiles.filter((p) => !isCore(p.slug))],
      completed: profiles.map((p) => (wonExtra.has(p.slug) ? { ...p, status: 100 } : p)),
      points: pointsQ.data,
      pointsOf,
    });
    setReady(true);
  }, [loading, profiles, shown, pointsQ.data, gate.extras, gate.paid, user?._id, cat]); // eslint-disable-line react-hooks/exhaustive-deps
  const prizeProfiles = React.useMemo(() => [...shown, ...profiles.filter((p) => !isCore(p.slug))], [shown, profiles]);
  return { ready, cat, gate, prizeProfiles, error: profilesQ.isError };
}

// the four things the machine runs on, from the member's real data: profile completion, surveys done, points and quality
function MachineStats({ hub }) {
  const { completion: c, pts, quality: q, completed, type } = hub;
  const items = [
    { k: "p", l: t("v7.m.profile"), pct: c ? c.pct : 0, v: c ? `${c.pct}%` : "…" },
    { k: "s", l: t("v7.m.surveys"), pct: completed ? Math.min(100, completed * 10) : 0, v: completed == null ? "…" : fmt(completed) },
    { k: "x", l: type === "teen" ? t("v7.m.xp") : t("v7.m.points"), pct: pts ? Math.min(100, (pts.total / pts.threshold) * 100) : 0, v: pts ? <Counter value={pts.total} /> : "…" },
    { k: "q", l: t("v7.m.quality"), pct: q ? q.pct : 0, v: q ? `${q.ten.toFixed(1)}` : "–" },
  ];
  return (
    <ul className="pmx-stats">
      {items.map((x, i) => (
        <li key={x.k} className={`k-${x.k}`} style={{ "--i": i }}>
          <Ring pct={x.pct} size={58} stroke={6}><b>{x.v}</b></Ring>
          <small>{x.l}</small>
        </li>
      ))}
    </ul>
  );
}

export default function PrizeHall() {
  const router = useRouter();
  const { ready, cat, gate, prizeProfiles, error } = usePrizeData();
  const [gateOpen, setGateOpen] = React.useState(false);
  const hub = useHub();
  const skin = SKIN[memberTypeOf(useMember())] || "claw";
  const canOpen = (slug) => isCore(slug) || gate.coreDone;
  // a capsule opens its profile in the Profiles page flow, exactly as it did there
  const onOpen = (p) => {
    const slug = p?.s;
    if (!slug) return;
    if (canOpen(slug)) router.push(`/member/profiles?profile=${encodeURIComponent(slug)}`);
    else setGateOpen(true);
  };
  return (
    <section className={`rw3-machine pmx-${skin}`} id="prize-machine" aria-labelledby="rw3-pm-t">
      <header className="rw3-head">
        <p className="k-eyebrow"><Icon name="gift" size={15} /> {t(`v7.m.title.${skin}`)}</p>
        <h2 className="sec-h" id="rw3-pm-t">{t("rw3.machineTitle")}</h2>
        <p className="k-note">{t("rw3.machineSub")}</p>
      </header>
      <MachineStats hub={hub} />
      <div className="ps rw3-ps" data-theme="dark" style={{ minHeight: 0, background: "transparent", overflow: "visible" }}>
        {error ? <p className="k-note"><Icon name="alert" size={16} /> {t("d2.profileError")}</p> : ready && prizeProfiles.length ? (
          <Suspense fallback={<div className="pm-ph" aria-hidden="true" />}>
            <PrizeMachine key={skin + cat + ":" + prizeProfiles.map((p) => p.slug).join(",")} skin={skin} cat={cat} cash={skin !== "spiral"} isLocked={(slug) => !canOpen(slug)} onOpen={onOpen} />
          </Suspense>
        ) : ready ? <p className="k-note">{t("pf.none")}</p> : <LoadingBlock lines={4} h={420} />}
        <GateDialog
          open={gateOpen}
          gate={gate}
          onClose={() => setGateOpen(false)}
          onStart={(slug) => { setGateOpen(false); router.push(`/member/profiles?profile=${slug}`); }}
        />
      </div>
    </section>
  );
}
