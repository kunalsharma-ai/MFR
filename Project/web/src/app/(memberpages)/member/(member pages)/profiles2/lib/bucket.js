// Shared by the data build script and the browser loader - keep both in sync.
export function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}
export function bucketOf(mode, key) {
  if (key === '') return '_';
  if (mode === 'prefix') return String(key).split('-')[0].replace(/[^A-Za-z0-9]/g, '') || '_';
  return fnv(String(key));
}
