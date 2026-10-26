// Asset paths for the profile skin: images, flags and fonts live in /public/ps/ (copied from the profile design).
export const assetUrl = (path) => `/ps/${String(path).replace(/^\/+/, '')}`;
export const flagUrl = (cc) => assetUrl(`flags/${String(cc || 'xx').toLowerCase()}.webp`);
export const emojiUrl = (name) => assetUrl(`images/emoji/${name}.webp`);
