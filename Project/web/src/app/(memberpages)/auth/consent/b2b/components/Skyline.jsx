// "Boardroom skyline": an isometric 3D city of business towers that breathe like live market data, a light scan
// sweeping across, data sparks rising — and, floating above, the member's 3D professional pass that turns from
// "Agreement pending" to "Agreement signed". Pure CSS 3D (transform/opacity), paused off screen.
import { useEffect, useRef } from "react";
import { useI18n } from "../i18n/I18n.jsx";
import { asset } from "../assets.js";
import Icon from "./Icons.jsx";

const TOWERS = [
  [0, 0, 70],
  [1, 0, 120],
  [2, 0, 90],
  [3, 0, 150],
  [0, 1, 110],
  [1, 1, 180],
  [2, 1, 130],
  [3, 1, 95],
  [0, 2, 85],
  [1, 2, 140],
  [2, 2, 200],
  [3, 2, 120],
  [0, 3, 60],
  [1, 3, 100],
  [2, 3, 125],
  [3, 3, 80],
];

export default function Skyline({ reviewed, total, signed, name, memberId }) {
  const { t } = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([e]) => el.classList.toggle("is-paused", !e.isIntersecting),
      { rootMargin: "60px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const p = total ? reviewed / total : 0;
  return (
    <div
      className="sky"
      ref={ref}
      role="img"
      aria-label={`${t("progress")}: ${t("reviewed", reviewed, total)}`}
    >
      <div className="sky-stage" aria-hidden="true">
        <div className="city">
          <div className="city-floor" />
          {TOWERS.map(([x, y, h], i) => (
            <div
              className="tower"
              key={i}
              style={{
                "--x": x,
                "--y": y,
                "--h": `${h}px`,
                "--d": `${(i % 5) * -0.9 - y * 0.4}s`,
                "--lit": i < Math.round(p * TOWERS.length) ? 1 : 0,
              }}
            >
              <i className="tw-top" />
              <i className="tw-front" />
              <i className="tw-side" />
            </div>
          ))}
          <div className="scan" />
        </div>
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className="spark" style={{ "--i": i }} />
        ))}
      </div>
      <div className={`pass ${signed ? "is-signed" : ""}`}>
        <div className="pass-in">
          <div className="pass-face">
            <div className="pass-top">
              <img
                src={"/images/brand/mfr-mark-192.webp"}
                alt="MyFrequentRewards logo on the professional pass"
                width="44"
                height="44"
              />
              <span className="pass-chip" aria-hidden="true" />
            </div>
            <p className="pass-role">{t("badge_role")}</p>
            <p className="pass-name" style={{ textTransform: "capitalize" }}>
              {name || ""}
            </p>
            {/* <p className="pass-id">
              <span>{t("badge_member")}</span>{" "}
              <b className="mono">{memberId || "••••••"}</b>
            </p> */}
            <div className="pass-meter" aria-hidden="true">
              <i style={{ transform: `scaleX(${p})` }} />
            </div>
            <p className={`pass-state ${signed ? "ok" : ""}`}>
              <Icon name={signed ? "check" : "clock"} size={14} decorative />
              {signed ? t("badge_signed") : t("badge_pending")}
              <span className="mono pass-count">
                {reviewed}/{total}
              </span>
            </p>
          </div>
          <span className="pass-holo" aria-hidden="true" />
        </div>
        <span className="pass-strap" aria-hidden="true" />
      </div>
    </div>
  );
}
