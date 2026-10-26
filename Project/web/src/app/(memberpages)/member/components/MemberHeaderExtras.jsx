"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMember } from "@/Context";
import { useRewardsTick, fetchRewardBalance } from "@/hooks/useRewardsRefresh";
import useProfileDark from "@/hooks/useProfileDark";
import LedCount from "../(member pages)/profiles/ps/LedCount.jsx";
import { ISun, IMoon } from "../(member pages)/profiles/ps/Icons.jsx";
import "../(member pages)/profiles/ps/ps.css"; // every rule in it starts with .ps, so it cannot touch the other pages

const INV = "filter:invert(1) hue-rotate(180deg)";
const NIGHT_CSS = `
html.mfr-night{background:#fff;${INV}}
html.mfr-night img,html.mfr-night video,html.mfr-night picture,html.mfr-night canvas,html.mfr-night iframe,html.mfr-night [style*="background-image"],html.mfr-night .rwp,html.mfr-night .ps-tile{${INV}}
html.mfr-night-ps .MuiAppBar-root,html.mfr-night-ps div:has(+ div > main),html.mfr-night-ps .MuiPopover-paper{${INV}}
html.mfr-night-ps .MuiAppBar-root img,html.mfr-night-ps div:has(+ div > main) img,html.mfr-night-ps .rwp{${INV}}
html.mfr-night-ps div:has(> main){background:#070f2b !important}
`;

export default function MemberHeaderExtras() {
  const pathname = usePathname();
  const router = useRouter();
  const member = useMember();
  const rewardsTick = useRewardsTick();
  const [dark, toggleDark] = useProfileDark();
  const [points, setPoints] = React.useState(null);
  const onProfiles = typeof pathname === "string" && pathname.startsWith("/member/profiles");

  React.useEffect(() => {
    if (!member?._id) return undefined;
    let live = true;
    fetchRewardBalance(member)
      .then((r) => { if (live) setPoints(Number(r?.data?.totalPoints) || 0); })
      .catch(() => {});
    return () => { live = false; };
  }, [member?._id, rewardsTick]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("mfr-night", "mfr-night-ps");
    if (dark) el.classList.add(onProfiles ? "mfr-night-ps" : "mfr-night");
    return () => el.classList.remove("mfr-night", "mfr-night-ps");
  }, [dark, onProfiles]);

  const pts = points ?? 0; // 0 until the balance is there, then the LED reels count up (as in the source)
  const nf = new Intl.NumberFormat("en");
  const goRewards = () => {
    const machine = document.getElementById("rewards"); // the Prize Machine on the profiles hub
    if (machine) machine.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push("/member/rewards");
  };
  return (
    <>
      {dark ? <style>{NIGHT_CSS}</style> : null}
      {/* .ps only brings the source's CSS variables and classes: its page-sized box is switched off here */}
      <span className="ps" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 0, width: "auto", margin: 0, background: "transparent", overflow: "visible", font: "inherit", color: "inherit" }}>
        <button type="button" id="rw-pts" className="rwp" onClick={goRewards} aria-label={`${nf.format(pts)} points`} title={`$${(pts * 0.001).toFixed(2)}`}>
          <svg className="rwp-cap" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 18 0z" fill="rgba(255,255,255,.85)" /><path d="M3 12a9 9 0 0 0 18 0z" fill="currentColor" /><rect x="2.5" y="11" width="19" height="2.2" rx="1" fill="#fff" opacity=".9" /><circle cx="8.5" cy="7.5" r="1.6" fill="#fff" /></svg>
          <LedCount value={pts} lang="en" /><small>pts</small>
        </button>
        <button type="button" className="icon-btn" onClick={toggleDark} aria-pressed={dark}
          aria-label={dark ? "Light mode" : "Dark mode"} title={dark ? "Light mode" : "Dark mode"}>
          {dark ? <ISun /> : <IMoon />}
        </button>
      </span>
    </>
  );
}
