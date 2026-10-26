"use client";
// "Account Settings" card of My Account (below Social Contacts): the account status and the button "Delete or Deactivate Account".
//
// The button opens the full page (deactivate for 30 / 60 / 90 days, hold, delete, request status, how it works) over My Account, in
// the SAME tab: a full-screen layer with the page in an iframe. The page is a static build kept in public/member/account-actions/
// (source: account-actions-src/, see its README). It is under /member on purpose: the gateway sends only /member, /admin, /auth,
// /survey and /_next to this app, so a path outside them would reach the public site instead.
// The page is opened with the member id: /member/account-actions/index.html?id=<member id>&theme=light|dark&points=..&usd=..
// It runs on the same origin, so the session cookie goes with its requests (POST /api/v1/auth/delete) and nothing is shared in the URL
// except the id, the theme and the balance shown in its status card.
// The page talks back with postMessage: { source: "mfr-account-actions", type: "close" | "navigate", key }.
import React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useMember } from "@/Context";
import { fetchRewardBalance } from "@/hooks/useRewardsRefresh";
import { AccountSettingsCard } from "./AccountSettingsCard.jsx";

const PAGE = "/member/account-actions/index.html";
const NAVY = "linear-gradient(90deg, #0B1B4D, #12307A)"; // a background-image: the site's night mode keeps those in their own colours

export default function DeleteAccountSection() {
  const member = useMember();
  const router = useRouter();
  const [src, setSrc] = React.useState(null); // the page's address while it is open
  const [loaded, setLoaded] = React.useState(false);
  const close = React.useCallback(() => setSrc(null), []);

  const open = async () => {
    let points = 0;
    let usd = "";
    try {
      const balance = (await fetchRewardBalance(member))?.data;
      points = Number(balance?.totalPoints) || 0;
      usd = `$${(points * (Number(balance?.conversionRate) || 0.001)).toFixed(2)}`;
    } catch (e) {
      /* the balance is only a detail of the page's status card */
    }
    const night = document.documentElement.classList.contains("mfr-night");
    const query = new URLSearchParams({ id: member?._id || "", theme: night ? "dark" : "light", points: String(points), usd });
    setLoaded(false);
    setSrc(`${PAGE}?${query}`);
  };

  React.useEffect(() => {
    if (!src) return undefined;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.source !== "mfr-account-actions") return;
      if (e.data.type === "close") close();
      if (e.data.type === "navigate") {
        close();
        if (e.data.key === "dashboard") router.push("/member/dashboard");
        if (e.data.key === "support") router.push("/member/support");
      }
    };
    const onKey = (e) => e.key === "Escape" && close();
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = scroll;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
    };
  }, [src, close, router]);

  return (
    <>
      <div style={{ padding: "6px 0 10px" }}>
        <AccountSettingsCard status="active" href="#delete-account" onNavigate={(e) => { e.preventDefault(); open(); }} />
      </div>
      {src && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete or Deactivate My Account"
          style={{ position: "fixed", inset: 0, zIndex: 1500, display: "flex", flexDirection: "column", background: "#050B2C" }}
        >
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, minHeight: 52, padding: "6px 14px", color: "#fff", backgroundImage: NAVY }}>
            <button type="button" onClick={close} style={barButton}>← Back to My Account</button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Delete or Deactivate My Account
            </span>
            <button type="button" onClick={close} aria-label="Close" style={{ ...barButton, width: 36, padding: 0, fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
            {!loaded && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", fontSize: 14 }}>Loading…</div>}
            <iframe
              title="Delete or Deactivate My Account"
              src={src}
              onLoad={() => setLoaded(true)}
              style={{ display: "block", width: "100%", height: "100%", border: 0, background: "transparent" }}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

const barButton = {
  height: 36,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.35)",
  background: "rgba(255,255,255,.1)",
  color: "#fff",
  font: "inherit",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
