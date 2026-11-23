"use client";
// Small building blocks shared by every hub screen: counters, rings, meters, skeletons, empty and error states.
import React from "react";
import Link from "next/link";
import Icon from "./icons.jsx";
import { t } from "./strings";

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Animated number: counts from the last shown value to the new one. */
export function Counter({ value, duration = 1100, format = (n) => new Intl.NumberFormat().format(Math.round(n)), className = "" }) {
  const [shown, setShown] = React.useState(0);
  const from = React.useRef(0);
  React.useEffect(() => {
    const to = Number(value) || 0;
    if (reduced()) {
      setShown(to);
      from.current = to;
      return undefined;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(a + (to - a) * e);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <span className={`h-num ${className}`}>
      {format(shown)}
    </span>
  );
}

/* Circular progress. pct 0..100 */
export function Ring({ pct = 0, size = 120, stroke = 10, className = "", children, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className={`h-ring ${className}`} style={{ width: size, height: size }} role={label ? "img" : undefined} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="h-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="h-ring-fg"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ "--dash": c, "--off": c - (c * p) / 100 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="h-ring-in">{children}</div>
    </div>
  );
}

/* Horizontal progress bar. pct 0..100 */
export function Meter({ pct = 0, className = "", label, ticks }) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div
      className={`h-meter ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      aria-label={label}
    >
      <span className="h-meter-fill" style={{ "--w": `${p}%` }} />
      {ticks ? ticks.map((x) => <i key={x} className="h-meter-tick" style={{ left: `${x}%` }} />) : null}
    </div>
  );
}

export function Skeleton({ h = 16, w = "100%", r = 10, className = "" }) {
  return <span className={`h-skel ${className}`} style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

/* A branded loading block that keeps the final layout's size (no layout shift). */
export function LoadingBlock({ lines = 3, h = 140 }) {
  return (
    <div className="h-loading" style={{ minHeight: h }} role="status" aria-live="polite">
      <span className="h-sr">{t("c.loading")}</span>
      <span className="h-loading-coin" aria-hidden="true" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} h={12} w={`${90 - i * 18}%`} />
      ))}
    </div>
  );
}

/* Empty-state art: a different small scene for each kind, drawn with the section's accent colour. */
function EmptyArt({ kind }) {
  const scenes = {
    rewards: (
      <>
        <rect x="26" y="40" width="68" height="44" rx="8" className="ea-a" />
        <rect x="22" y="32" width="76" height="14" rx="5" className="ea-b" />
        <path d="M60 32v52" className="ea-l" />
        <circle cx="92" cy="24" r="6" className="ea-c" />
        <circle cx="28" cy="18" r="4" className="ea-c" />
      </>
    ),
    surveys: (
      <>
        <rect x="34" y="18" width="52" height="68" rx="8" className="ea-a" />
        <path d="M46 40h28M46 52h22M46 64h16" className="ea-l" />
        <circle cx="88" cy="26" r="10" className="ea-b" />
        <path d="M84 26l3 3 5-6" className="ea-l2" />
      </>
    ),
    referrals: (
      <>
        <circle cx="60" cy="30" r="12" className="ea-b" />
        <circle cx="30" cy="74" r="10" className="ea-a" />
        <circle cx="90" cy="74" r="10" className="ea-a" />
        <path d="M52 40L36 64M68 40l16 24" className="ea-l dash" />
      </>
    ),
    activity: (
      <>
        <path d="M16 60h20l8-22 14 40 10-26h36" className="ea-l thick" />
        <circle cx="104" cy="52" r="6" className="ea-c" />
      </>
    ),
    quality: (
      <>
        <path d="M24 80a36 36 0 1 1 72 0" className="ea-l thick" />
        <path d="M60 80l18-22" className="ea-l2" />
        <circle cx="60" cy="80" r="5" className="ea-b" />
      </>
    ),
    profile: (
      <>
        <circle cx="60" cy="40" r="16" className="ea-a" />
        <path d="M30 88c4-16 16-24 30-24s26 8 30 24" className="ea-l thick" />
        <circle cx="88" cy="22" r="7" className="ea-c" />
      </>
    ),
    achievements: (
      <>
        <path d="M60 14l10 20 22 3-16 15 4 22-20-11-20 11 4-22-16-15 22-3z" className="ea-a" />
        <circle cx="96" cy="78" r="5" className="ea-c" />
      </>
    ),
  };
  return (
    <svg className="h-empty-art" width="120" height="96" viewBox="0 0 120 96" aria-hidden="true">
      {scenes[kind] || scenes.activity}
    </svg>
  );
}

export function EmptyState({ kind = "activity", title, text, action }) {
  return (
    <div className={`h-empty h-empty-${kind}`}>
      <EmptyArt kind={kind} />
      <p className="h-empty-t">{title}</p>
      {text ? <p className="h-empty-x">{text}</p> : null}
      {action || null}
    </div>
  );
}

export function ErrorState({ text, onRetry }) {
  return (
    <div className="h-error" role="alert">
      <span className="h-error-ic">
        <Icon name="bolt" size={22} />
      </span>
      <div>
        <p className="h-error-t">{t("c.errorTitle")}</p>
        {text ? <p className="h-error-x">{text}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" className="h-btn h-btn-soft" onClick={onRetry}>
          {t("c.retry")}
        </button>
      ) : null}
    </div>
  );
}

/* Adds .is-in when the element scrolls into view (page-entry and scroll animations). */
export function Reveal({ as: Tag = "div", className = "", children, delay = 0, ...rest }) {
  const ref = React.useRef(null);
  const [inView, setIn] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced() || typeof IntersectionObserver === "undefined") {
      setIn(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setIn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`h-reveal ${inView ? "is-in" : ""} ${className}`} style={{ "--d": `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionHead({ eyebrow, title, sub, icon, right }) {
  return (
    <div className="h-shead">
      <div className="h-shead-l">
        {icon ? (
          <span className="h-shead-ic">
            <Icon name={icon} size={22} />
          </span>
        ) : null}
        <div>
          {eyebrow ? <p className="h-eyebrow">{eyebrow}</p> : null}
          <h2 className="h-h2">{title}</h2>
          {sub ? <p className="h-sub">{sub}</p> : null}
        </div>
      </div>
      {right ? <div className="h-shead-r">{right}</div> : null}
    </div>
  );
}

/* ======================= v2 (Nov 2026 ground-up redesign) ======================= */

/* Tooltip: shows on hover and keyboard focus; the text is also the accessible description. */
export function Tip({ text, children, side = "bottom", className = "" }) {
  const id = React.useId();
  return (
    <span className={`h-tip-wrap ${className}`} data-side={side}>
      {React.isValidElement(children) ? React.cloneElement(children, { "aria-describedby": id }) : children}
      <span role="tooltip" id={id} className="h-tip">{text}</span>
    </span>
  );
}

/* Small sparkline from a list of numbers (oldest first). */
export function Spark({ values = [], w = 96, h = 28, className = "", label }) {
  const v = values.length ? values : [0, 0];
  const max = Math.max(1, ...v);
  const x = (i) => (i * (w - 4)) / Math.max(1, v.length - 1) + 2;
  const y = (n) => h - 3 - (n / max) * (h - 6);
  const d = v.map((n, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(n).toFixed(1)}`).join(" ");
  return (
    <svg className={`h-spark ${className}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={`${d} L${x(v.length - 1)},${h} L${x(0)},${h} Z`} className="h-spark-a" />
      <path d={d} className="h-spark-l" pathLength="1" />
      <circle cx={x(v.length - 1)} cy={y(v[v.length - 1])} r="2.6" className="h-spark-d" />
    </svg>
  );
}

/* A CSS 3D coin (two faces + rim), spins slowly; still when motion is reduced. */
export function Coin3D({ size = 96, label = "", className = "" }) {
  return (
    <span className={`h-coin3d ${className}`} style={{ "--cs": `${size}px` }} aria-hidden="true">
      <span className="h-coin3d-spin">
        <span className="h-coin3d-face f1"><b>{label}</b></span>
        {Array.from({ length: 10 }).map((_, i) => <i key={i} style={{ "--k": i }} />)}
        <span className="h-coin3d-face f2"><b>{label}</b></span>
      </span>
      <span className="h-coin3d-shadow" />
    </span>
  );
}

/* A short particle burst for completions and unlocks. Render it with a changing key to replay. */
export function Burst({ n = 14, className = "" }) {
  return (
    <span className={`h-burst ${className}`} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => <i key={i} style={{ "--a": `${(360 / n) * i}deg`, "--d": `${40 + ((i * 37) % 30)}px`, "--k": i % 4 }} />)}
    </span>
  );
}

/* Compact contextual hero used by every section. Each section passes its own art and status, and the skin + kind
   decide the composition, so heroes never repeat the same layout. */
export function Hero({ kind, crumbs = [], eyebrow, title, sub, status, art, actions, id, children }) {
  return (
    <section className={`hx hx-${kind}`} aria-labelledby={id}>
      <div className="hx-bg" aria-hidden="true"><i /><i /><i /></div>
      <div className="hx-main">
        {crumbs.length ? (
          <nav className="hx-crumbs" aria-label={t("c.breadcrumb")}>
            <ol>
              {crumbs.map((c, i) => (
                <li key={i}>{c.href && i < crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>}</li>
              ))}
            </ol>
          </nav>
        ) : null}
        {eyebrow ? <p className="hx-eyebrow">{eyebrow}</p> : null}
        <h1 className="hx-title" id={id}>{title}</h1>
        {sub ? <p className="hx-sub">{sub}</p> : null}
        {status ? <div className="hx-status">{status}</div> : null}
        {actions ? <div className="hx-actions">{actions}</div> : null}
        {children}
      </div>
      {art ? <div className="hx-art" aria-hidden="true">{art}</div> : null}
    </section>
  );
}

/* Status chip with a non-colour cue (icon + text). */
export function StatusChip({ state, label }) {
  const icon = { available: "play", progress: "hourglass", done: "check", pending: "clock", action: "alert", locked: "lock" }[state] || "spark";
  return (
    <span className={`h-state s-${state}`}>
      <Icon name={icon} size={14} /> {label}
    </span>
  );
}
