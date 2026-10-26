"use client";
import { emojiUrl } from './assets.js';

/** Ambient, category-specific background: drifting motif, light blobs and floating 3D icons. */
export default function ThemeScene({ theme }) {
  return (
    <div className={`scene scene-${theme.id}`} aria-hidden="true">
      <span className="scene-motif" />
      <span className="scene-blob sb1" /><span className="scene-blob sb2" />
      {theme.icons.map((ic, i) => (
        <span key={ic + i} className={`scene-float sf${i + 1}`}>
          <img src={emojiUrl(ic)} alt="" width="64" height="64" loading="lazy" decoding="async" />
        </span>
      ))}
    </div>
  );
}
