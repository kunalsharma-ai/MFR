// Asset + data access. Paths are root-absolute so they work from any Next.js route
// (e.g. /profile). Static files live in the project `public/` folder.
const EMBED = typeof window !== 'undefined' ? window.__MFR_EMBED__ : null;

/** Ensure path is absolute from site root (Next.js public/). */
function rootPath(path) {
  if (!path) return path;
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return path.startsWith('/') ? path : '/' + path;
}

export function assetUrl(path) {
  if (EMBED && EMBED.assets && EMBED.assets[path]) return EMBED.assets[path];
  return rootPath(path);
}

const jsonCache = new Map();
export function getJSON(path) {
  if (jsonCache.has(path)) return jsonCache.get(path);
  let p;
  if (EMBED && EMBED.json) {
    p = EMBED.json(path).then((v) => {
      if (v === undefined) throw new Error('404 ' + path);
      return v;
    });
  } else {
    p = fetch(rootPath(path), { credentials: 'same-origin' }).then((r) => {
      if (!r.ok) throw new Error(r.status + ' ' + path);
      return r.json();
    });
  }
  p.catch(() => jsonCache.delete(path)); // allow retry after a failure
  jsonCache.set(path, p);
  return p;
}

export const flagUrl = (cc) => assetUrl(`flags/${String(cc || 'xx').toLowerCase()}.webp`);
export const emojiUrl = (name) => assetUrl(`images/emoji/${name}.webp`);
