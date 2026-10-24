"use client";

import React from "react";
import { useI18n } from "./i18n.js";
import { themeOfProfile } from "./PsHub.jsx";
import MemberCard from "./MemberCard.jsx";
import { IArrow, ILock } from "./Icons.jsx";
import "./ps.css";

const BOX = { minHeight: 0, width: "100%", margin: 0, background: "transparent", overflow: "visible", font: "inherit", color: "inherit" };

export default function WorldTile({ slug, name, meta, pill, points, locked = false, onClick, title, index = 0 }) {
  const { t } = useI18n();
  const theme = themeOfProfile({ slug, name });
  return (
    <div className="ps ps-tile" data-theme="light" style={BOX}>
      <button
        type="button"
        className="world is-new cat-b2c"
        onClick={onClick}
        title={title}
        style={{ "--i": Math.min(index, 12), width: "100%", ...(locked ? { filter: "saturate(.55)", opacity: 0.9 } : {}) }}
        aria-label={`${name} - ${meta} - ${points ? t("rw.plus", { n: points }) : ""}`}
      >
        <MemberCard theme={theme} name={name} variant="hub">
          <span className="mc-meta">
            <span>{meta}</span>
            <span className="mc-pill">{locked ? <><ILock /> {t("hub.locked")}</> : <>{pill} <IArrow /></>}</span>
          </span>
          <span className="mc-bar"><i style={{ transform: "scaleX(0)" }} /></span>
          <span className="mc-prize" aria-hidden="true">{t("rw.plus", { n: points })}</span>
        </MemberCard>
      </button>
    </div>
  );
}
