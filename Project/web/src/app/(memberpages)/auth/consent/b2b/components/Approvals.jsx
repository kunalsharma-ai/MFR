// Clause 23 — the approvals board (each approval gets an "APPROVED" rubber stamp), slide-to-sign, the decline
// dialog and the certificate of consent.
import { useEffect, useRef, useState } from "react";
import Icon from "./Icons.jsx";
import { Body } from "./Clause.jsx";
import { CONSENTS } from "../content/terms.js";
import { useI18n } from "../i18n/I18n.jsx";
import { play } from "../sound.js";
import { asset } from "../assets.js";

function SlideToSign({ ready, busy, onSign, onBlocked }) {
  const { t } = useI18n();
  const track = useRef(null);
  const [x, setX] = useState(0); // 0..1
  const drag = useRef(null);
  const ticks = useRef(0);
  const finish = () => {
    if (!ready) {
      onBlocked();
      setX(0);
      return;
    }
    setX(1);
    onSign();
  };
  const onDown = (e) => {
    if (busy) return;
    const r = track.current.getBoundingClientRect();
    drag.current = { left: r.left, w: r.width - 64 };
    ticks.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    play("tap");
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const v = Math.max(
      0,
      Math.min(1, (e.clientX - drag.current.left - 32) / drag.current.w),
    );
    const tk = Math.floor(v * 8);
    if (tk > ticks.current) {
      ticks.current = tk;
      play("tick");
    }
    setX(v);
  };
  const onUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (x > 0.86) finish();
    else setX(0);
  };
  useEffect(() => {
    if (!busy && x === 1) setX(0);
  }, [busy]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      className={`slide ${ready ? "ready" : ""} ${busy ? "busy" : ""}`}
      ref={track}
      style={{ "--x": x }}
    >
      <span className="slide-fill" aria-hidden="true" />
      <span className="slide-label" aria-hidden="true">
        {busy ? t("signing") : t("slide")}
        <small>{busy ? "" : t("slide_kb")}</small>
      </span>
      <button
        type="button"
        className="slide-knob"
        role="slider"
        aria-label={t("slide")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(x * 100)}
        aria-disabled={!ready || busy}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === "Enter" || e.key === " " || e.key === "End") {
            e.preventDefault();
            finish();
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            setX((v) => {
              const n = Math.min(1, v + 0.25);
              if (n === 1) setTimeout(finish, 0);
              return n;
            });
            play("tick");
          }
        }}
      >
        {busy ? (
          <span className="spin" />
        ) : (
          <img
            src={"/images/brand/mfr-mark-192.webp"}
            alt="Signing handle with the MyFrequentRewards logo"
            width="40"
            height="40"
            draggable="false"
          />
        )}
      </button>
    </div>
  );
}

export function Approvals({
  cfg,
  values,
  onChange,
  status,
  onSign,
  onDecline,
  reviewed,
  total,
  error,
  goto,
}) {
  const { t } = useI18n();
  const left = CONSENTS.filter((c) => c.required && !values[c.id]).length;
  const ready = left === 0;
  const busy = status === "saving";
  const blocked = (root) => {
    play("warn");
    const first = root && root.querySelector(".ap.req:not(.on)");
    if (first) {
      first.classList.remove("nudge");
      void first.offsetWidth;
      first.classList.add("nudge");
      first.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };
  const ref = useRef(null);
  const tile = (c, i) => {
    const on = !!values[c.id];
    return (
      <li key={c.id} style={{ "--i": i }}>
        <label className={`ap ${on ? "on" : ""} ${c.required ? "req" : "opt"}`}>
          <input
            type="checkbox"
            checked={on}
            disabled={busy}
            aria-describedby={`h-${c.id}`}
            onChange={(e) => {
              play(e.target.checked ? "stamp" : "unstamp");
              onChange(c.id, e.target.checked);
            }}
          />
          <span className="ap-box" aria-hidden="true">
            <Icon name="check" size={16} decorative />
          </span>
          <span className="ap-ico" aria-hidden="true">
            <Icon name={c.icon} size={22} decorative />
          </span>
          <span className="ap-text">
            <b>{t(`c_${c.id}`)}</b>
            <small id={`h-${c.id}`}>
              {c.refs.map((r) => (
                <a
                  key={r}
                  href={`#s${r}`}
                  className="ref mono"
                  onClick={(e) => {
                    e.preventDefault();
                    goto(r);
                  }}
                >
                  §{r}
                </a>
              ))}
              <span>{t(`c_${c.id}_hint`)}</span>
            </small>
          </span>
          <span className="stamp" aria-hidden="true">
            {t("approved")}
          </span>
        </label>
      </li>
    );
  };
  return (
    <section className="board" id="approvals" aria-labelledby="ap-h" ref={ref}>
      <div className="board-grid" aria-hidden="true" />
      <header className="board-head">
        <span className="clause-no mono">
          {t("clause", "23")} · {t("t23")}
        </span>
        <h2 id="ap-h">{t("approvals_h")}</h2>
        <p>{t("approvals_lead")}</p>
      </header>
      <div className="board-legal" lang="en" dir="ltr">
        <Body n={23} cfg={cfg} t={t} />
      </div>
      <h3 className="group-h">
        <span className="tag req">{t("required")}</span>
        <span className="mono need">
          {ready ? t("all_required") : t("need_n", left)}
        </span>
      </h3>
      <ul className="aps">{CONSENTS.filter((c) => c.required).map(tile)}</ul>
      <h3 className="group-h">
        <span className="tag opt">{t("optional")}</span>
      </h3>
      <ul className="aps">{CONSENTS.filter((c) => !c.required).map(tile)}</ul>
      <p className="review-note">
        <Icon name="clipboard" size={18} decorative />
        {t("review_note", reviewed, total)}
      </p>
      {error ? (
        <p className="err" role="alert">
          {t("err_save")}
        </p>
      ) : null}
      <div className="sign-row">
        <SlideToSign
          ready={ready}
          busy={busy}
          onSign={onSign}
          onBlocked={() => blocked(ref.current)}
        />
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            play("tap");
            onDecline();
          }}
          disabled={busy}
        >
          {t("not_now")}
        </button>
      </div>
    </section>
  );
}

export function DeclineDialog({ open, onBack, onLogout }) {
  const { t } = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const b = ref.current && ref.current.querySelector("button");
    if (b) b.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onBack]);
  if (!open) return null;
  return (
    <div
      className="veil"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onBack();
      }}
    >
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dc-h"
        aria-describedby="dc-p"
        ref={ref}
      >
        <span className="hex big warn" aria-hidden="true">
          <Icon name="exit" size={30} decorative />
        </span>
        <h2 id="dc-h">{t("decline_h")}</h2>
        <p id="dc-p">{t("decline_p")}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              play("tap");
              onBack();
            }}
          >
            {t("decline_back")}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              play("dark");
              onLogout();
            }}
          >
            {t("decline_out")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Certificate({
  record,
  name,
  onDownload,
  onContinue,
  hasContinue,
}) {
  const { t, languages } = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    const b = ref.current && ref.current.querySelector(".btn.primary, .btn");
    if (b) b.focus({ preventScroll: true });
  }, []);
  if (!record) return null;
  const langName =
    (languages.find((l) => l.code === record.language) || {}).native ||
    record.language;
  return (
    <div className="veil cert-veil">
      <div
        className="cert"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ct-h"
        ref={ref}
      >
        <div className="cert-foil" aria-hidden="true" />
        <div className="cert-in">
          <svg
            className="guilloche"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <path
                key={i}
                d={`M0 ${60 + i * 2} C 60 ${10 + i * 6} 120 ${110 - i * 6} 200 ${60 - i * 2} S 340 ${10 + i * 6} 400 ${60 + i * 2}`}
              />
            ))}
          </svg>
          <div className="seal">
            <img
              src={"/images/brand/mfr-mark-192.webp"}
              alt="MyFrequentRewards certificate seal"
              width="72"
              height="72"
              loading="lazy"
              decoding="async"
            />
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="55" />
            </svg>
          </div>
          <p className="cert-kicker mono">{t("cert")}</p>
          <h2 id="ct-h">{t("done_h")}</h2>
          <p className="cert-p">{t("done_p")}</p>
          <dl className="cert-dl">
            {name ? (
              <div>
                <dt>{t("r_name")}</dt>
                <dd>{name}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t("r_id")}</dt>
              <dd className="mono">{record.consentId}</dd>
            </div>
            <div>
              <dt>{t("r_date")}</dt>
              <dd>
                {new Date(record.acceptedAt).toLocaleString(record.language)}
              </dd>
            </div>
            <div>
              <dt>{t("r_version")}</dt>
              <dd className="mono">{record.termsVersion}</dd>
            </div>
            <div>
              <dt>{t("r_lang")}</dt>
              <dd>{langName}</dd>
            </div>
          </dl>
          <h3>{t("r_choices")}</h3>
          <ul className="cert-list">
            {CONSENTS.map((c) => (
              <li key={c.id} className={record.consents[c.id] ? "y" : "n"}>
                <span className="yn mono">
                  {record.consents[c.id] ? t("yes") : t("no")}
                </span>
                <span>{t(`c_${c.id}`)}</span>
              </li>
            ))}
          </ul>
          <div className="dialog-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                play("tap");
                onDownload();
              }}
            >
              <Icon name="download" size={18} decorative />
              {t("download")}
            </button>
            {hasContinue ? (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  play("tap");
                  onContinue();
                }}
              >
                {t("continue")}
                <Icon name="arrow" size={18} decorative />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
