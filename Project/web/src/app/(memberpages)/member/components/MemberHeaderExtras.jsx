"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMember } from "@/Context";
import { useRewardsTick, fetchRewardBalance } from "@/hooks/useRewardsRefresh";
import useProfileDark from "@/hooks/useProfileDark";
import LedCount from "../(member pages)/profiles/ps/LedCount.jsx";
import { ISun, IMoon } from "../(member pages)/profiles/ps/Icons.jsx";
import "../(member pages)/profiles/ps/ps.css"; // every rule in it starts with .ps, so it cannot touch the other pages
import { Page } from "@/util/index.js";

const INV = "filter:invert(1) hue-rotate(180deg)";
const NIGHT_CSS = `
html.mfr-night{background:#fff;${INV}}
html.mfr-night img,html.mfr-night video,html.mfr-night picture,html.mfr-night canvas,html.mfr-night iframe,html.mfr-night [style*="background-image"],html.mfr-night .rwp,html.mfr-night .ps-tile{${INV}}
html.mfr-night-ps .MuiAppBar-root,html.mfr-night-ps div:has(+ div > main),html.mfr-night-ps .MuiPopover-paper{${INV}}
html.mfr-night-ps .MuiAppBar-root img,html.mfr-night-ps div:has(+ div > main) img,html.mfr-night-ps .rwp{${INV}}
html.mfr-night-ps div:has(> main){background:#070f2b !important}
`;

export default function MemberHeaderExtras({ setIsDark }) {
  const pathname = usePathname();
  const router = useRouter();
  const member = useMember();
  const rewardsTick = useRewardsTick();
  const [dark, toggleDark] = useProfileDark();
  const [points, setPoints] = React.useState(null);
  const onProfiles =
    typeof pathname === "string" && pathname.startsWith("/member/profiles");

  React.useEffect(() => {
    if (!member?._id) return undefined;
    let live = true;
    fetchRewardBalance(member)
      .then((r) => {
        if (live) setPoints(Number(r?.data?.totalPoints) || 0);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [member?._id, rewardsTick]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("mfr-night", "mfr-night-ps");
    if (dark) el.classList.add(onProfiles ? "mfr-night-ps" : "mfr-night");
    return () => el.classList.remove("mfr-night", "mfr-night-ps");
  }, [dark, onProfiles]);

  React.useEffect(() => {
    setIsDark(dark);
  }, [dark]);

  const pts = points ?? 0; // 0 until the balance is there, then the LED reels count up (as in the source)
  const nf = new Intl.NumberFormat("en");
  const goRewards = () => {
    const machine = document.getElementById("rewards"); // the Prize Machine on the profiles hub
    if (machine) machine.scrollIntoView({ behavior: "smooth", block: "start" });
    else router.push("/member/rewards");
  };
  const pointsStyles = dark
    ? {
        background: "linear-gradient(135deg, #3d3118 0%, #2a2212 100%)",
        border: "1.5px solid rgba(255, 220, 150, 0.25)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
      }
    : {
        background: "linear-gradient(135deg, #fdf6e9 0%, #f8efe0 100%)",
        border: "1.5px solid rgba(255,255,255,0.85)",
        boxShadow: "0 4px 14px rgba(180, 140, 60, 0.12)",
      };

  const labelColor = dark ? "#e8d5a3" : "#5a6b7d";
  const numberColor = dark ? "#fff4d6" : "#1a2d40";
  return (
    <>
      {dark ? <style>{NIGHT_CSS}</style> : null}
      {/* .ps only brings the source's CSS variables and classes: its page-sized box is switched off here */}
      <span
        className="ps"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          minHeight: 0,
          width: "auto",
          margin: 0,
          background: "transparent",
          overflow: "visible",
          font: "inherit",
          color: "inherit",
        }}
      >
        <button
          type="button"
          className="icon-btn"
          onClick={toggleDark}
          aria-pressed={dark}
          aria-label={dark ? "Light mode" : "Dark mode"}
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <ISun /> : <IMoon />}
        </button>
        <Page.Box sx={{ display: { xs: "none", md: "inline-block" } }}>
          <button
            type="button"
            id="rw-pts"
            className="rwp"
            onClick={goRewards}
            aria-label={`${nf.format(pts)} points`}
            title={`$${(pts * 0.001).toFixed(2)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              height: 70,
              padding: "10px 18px 10px 12px",
              minWidth: 160,
              borderRadius: 100,
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
              ...pointsStyles,
            }}
          >
            {/* Gold coin with + */}
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "radial-gradient(circle at 35% 30%, #ffe9ae, #e5bd69 75%, #d5a94e)",
                boxShadow:
                  "inset 0 2px 5px rgba(255,255,255,0.7), 0 3px 8px rgba(151,106,30,0.18)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#9b7131",
                  transform: "translateY(-1px)",
                }}
              >
                +
              </span>
            </span>

            {/* Label + number */}
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.1,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1.4,
                  color: labelColor,
                  textTransform: "uppercase",
                }}
              >
                POINTS
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: numberColor,
                  letterSpacing: "-0.5px",
                }}
              >
                <LedCount value={pts} lang="en" />
              </span>
            </span>
          </button>
        </Page.Box>
      </span>
    </>
  );
}
