// Content protection (Round 12). Discourages casual copying of the website's text and images:
// no text selection, no copy/cut, no right-click menu and no image dragging on page content.
// It never touches form fields (input, textarea, select, contenteditable) or anything marked
// [data-allow-copy], so people can still type, edit, paste and copy their own details.
// This is a deterrent only: browser-side code cannot stop someone determined from reading the page source.

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-allow-copy]';

const allowed = (node) => {
  const el = node && node.nodeType === 1 ? node : node && node.parentElement;
  return Boolean(el && el.closest && el.closest(EDITABLE));
};

// A selection that starts or ends in a form field belongs to the person typing.
const selectionAllowed = () => {
  const sel = window.getSelection && window.getSelection();
  if (!sel || sel.isCollapsed) return true;
  return allowed(sel.anchorNode) || allowed(sel.focusNode) || allowed(document.activeElement);
};

export function startContentGuard() {
  if (typeof document === 'undefined' || window.__mfrGuard) return;
  window.__mfrGuard = true;
  document.documentElement.classList.add('guarded');

  const block = (e) => { if (!allowed(e.target)) e.preventDefault(); };
  document.addEventListener('contextmenu', block);
  document.addEventListener('dragstart', (e) => { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('selectstart', block);
  ['copy', 'cut'].forEach((type) => document.addEventListener(type, (e) => {
    if (!selectionAllowed()) e.preventDefault();
  }));
  // Save page and view source shortcuts. Copy (Ctrl/Cmd+C) is already covered by the copy event above,
  // and every other shortcut (find, zoom, select inside a field, screen readers) keeps working.
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || allowed(e.target)) return;
    const k = (e.key || '').toLowerCase();
    if (k === 's' || k === 'u') e.preventDefault();
  });
}
