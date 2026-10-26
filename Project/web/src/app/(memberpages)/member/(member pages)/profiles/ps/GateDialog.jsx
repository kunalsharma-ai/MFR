"use client";
// The pop-up a LOCKED capsule, profile card or survey card opens: it says what is left to finish and lists the profiles to start.
//   - the four basic profiles are not complete -> they are listed (done ones ticked, the others with Start)
//   - the four are complete but other profiles are left (the surveys are still locked) -> the next of them are listed
// It is used by the Prize Machine (Profiles page) and by the Survey section, so a locked item looks and works the same everywhere.
// Start calls onStart(slug); the caller opens that profile.
import React from "react";
import { Dialog } from "@mui/material";
import { useMember } from "@/Context";
import { useI18n } from "./i18n.js";
import { themeOfProfile } from "./PsHub.jsx";
import { emojiUrl } from "./assets.js";
import { IArrow, ICheck, IClose, ILock } from "./Icons.jsx";
import "./ps.css";

const SHOW = 4; // rows listed when the other profiles are listed
const BOX = { minHeight: 0, width: "100%", margin: 0, background: "transparent", overflow: "visible" };

export default function GateDialog({ open, onClose, gate, onStart }) {
  const { t } = useI18n();
  const user = useMember();
  const first = user?.name?.first || user?.fullName?.split(" ")[0] || "";
  const core = gate?.core || [];
  const coreLeft = core.filter((p) => !p.done).length;
  const listCore = !gate?.coreDone && core.length > 0;
  const rows = listCore ? core : (gate?.pending || []).slice(0, SHOW).map((p) => ({ slug: p.slug, name: p.name, done: false }));
  const left = listCore ? coreLeft : (gate?.pending || []).length;
  const more = listCore ? 0 : Math.max(0, left - rows.length);
  const nameOf = (p) => { const k = "p." + p.slug; const v = t(k); return v === k ? p.name : v; };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      aria-labelledby="gate-title"
      slotProps={{ paper: { sx: { borderRadius: "26px", m: 2, width: "min(420px, 100%)", overflow: "hidden" } } }}
    >
      <div className="ps" data-theme="light" style={BOX}>
        <div className="gate">
          <button type="button" className="gate-x" onClick={onClose} aria-label={t("gate.close")}><IClose /></button>
          <span className="gate-lock" aria-hidden="true"><ILock /></span>
          <h2 id="gate-title">{t("gate.title", { name: first || "there" })}</h2>
          <p className="gate-msg">
            {listCore
              ? t("gate.core", { n: core.length, d: core.length - coreLeft, left: coreLeft })
              : t("gate.rest", { left })}
          </p>
          <ul className="gate-list">
            {rows.map((p) => (
              <li key={p.slug} className={"gate-row" + (p.done ? " is-done" : "")}>
                <span className="gate-ico"><img src={emojiUrl(themeOfProfile(p).icon)} alt="" width="26" height="26" /></span>
                <span className="gate-name">{nameOf(p)}</span>
                {p.done
                  ? <span className="gate-ok"><ICheck /> {t("gate.done")}</span>
                  : <button type="button" className="btn" onClick={() => onStart(p.slug)}>{t("gate.start")} <IArrow /></button>}
              </li>
            ))}
          </ul>
          {more > 0 && <p className="gate-more">{t("gate.more", { n: more })}</p>}
          <p className="gate-bonus">{t("gate.bonus")}</p>
        </div>
      </div>
    </Dialog>
  );
}
