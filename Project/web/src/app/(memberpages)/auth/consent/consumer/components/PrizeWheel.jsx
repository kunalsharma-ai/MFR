// "Reward wheel": a glossy 3D prize wheel with six segments — one per chapter, in the chapter's colours — chasing
// marquee bulbs on the rim, a ticking gold pointer, and the MyFrequentRewards coin flipping on the hub. Every section
// the member reads gives the wheel a spin; a chapter's segment lights up (star badge) once all its sections are read.
// Coins pop out of the top now and then. Pure CSS 3D (transform/opacity only), paused off screen, still for
// reduced-motion visitors.
import { useEffect, useRef } from "react";
import Icon from "./Icons.jsx";
import { CHAPTERS } from "../content/terms.js";
import { useI18n } from "../i18n/I18n.jsx";
import { asset } from "../assets.js";

const SEG = 360 / CHAPTERS.length;
// segment colours as one conic gradient (each segment: chapter colour → its second colour)
const FACE = `conic-gradient(from ${-SEG / 2}deg, ${CHAPTERS.map((c, i) => `${c.grade[0]} ${i * SEG}deg, ${c.grade[1]} ${(i + 1) * SEG - 0.01}deg`).join(", ")})`;
const BULBS = 24;

export default function PrizeWheel({ read, total, done }) {
  const { t } = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      ([e]) => el.classList.toggle("is-paused", !e.isIntersecting),
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      className="wheel"
      ref={ref}
      role="img"
      aria-label={`${t("progress")}: ${t("read_count", read, total)}`}
      style={{ "--k": `${read * 137}deg` }}
    >
      <div className="wheel-glow" aria-hidden="true" />
      <div className="wheel-rays" aria-hidden="true" />
      <div className="wheel-scene" aria-hidden="true">
        <div className="wheel-sway">
          {[7, 6, 5, 4, 3, 2, 1].map((z) => (
            <i
              key={z}
              className="wheel-edge"
              style={{ "--z": `${-z * 2}px` }}
            />
          ))}
          <div className="wheel-kick">
            <div className="wheel-spin">
              <div className="wheel-face" style={{ background: FACE }} />
              <div className="wheel-lines" />
              {CHAPTERS.map((c, i) => (
                <div
                  key={c.id}
                  className={`wheel-slot ${done[c.id] >= c.sections.length ? "lit" : ""}`}
                  style={{
                    "--a": `${i * SEG}deg`,
                    "--g1": c.grade[0],
                    "--g2": c.grade[1],
                  }}
                >
                  <span className="wheel-chip">
                    <Icon name={c.icon} size={22} decorative />
                  </span>
                  <span className="wheel-star">
                    <Icon name="star" size={14} decorative />
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="wheel-rim" />
          <div className="wheel-bulbs">
            {Array.from({ length: BULBS }, (_, i) => (
              <i
                key={i}
                className="bulb"
                style={{
                  "--a": `${(360 / BULBS) * i}deg`,
                  "--d": `${(i % 3) * -0.4}s`,
                }}
              />
            ))}
          </div>
          <div className="wheel-hub">
            <div className="hub-coin">
              <span className="hub-face hub-front">
                <img
                  src={"/images/brand/mfr-monogram.webp"}
                  alt="MyFrequentRewards logo coin on the reward wheel"
                  width="56"
                  height="56"
                  decoding="async"
                />
              </span>
              <span className="hub-face hub-back">
                <Icon name="star" size={30} decorative />
              </span>
            </div>
          </div>
          <div className="wheel-pointer">
            <i />
          </div>
        </div>
      </div>
      <div className="wheel-stand" aria-hidden="true">
        <i />
      </div>
      <div className="wheel-coins" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>
      <p className="wheel-count">
        <Icon name="coins" size={18} decorative />
        <b>{read}</b>
        <span>/ {total}</span>
      </p>
    </div>
  );
}
