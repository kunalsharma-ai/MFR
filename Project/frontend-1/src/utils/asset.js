// Public-file URL helper. Production: returns the path unchanged (/flags/in.svg is served from /public).
// The single-file preview (scripts/build-preview.mjs) registers window.__MFR_ASSETS = { '/flags/in.svg': 'data:…' }
// so runtime-built paths (flags, blog covers) still work when the preview is opened from disk.
export const asset = (p) => (typeof window !== 'undefined' && window.__MFR_ASSETS && window.__MFR_ASSETS[p]) || p;
