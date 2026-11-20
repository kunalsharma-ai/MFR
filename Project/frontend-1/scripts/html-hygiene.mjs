// Post-processing for every prerendered page (used by scripts/prerender.mjs). Clean-ups that SEO auditors
// (SEOptimer "Inline Styles", "Email Privacy", "Image Alt Attributes") check in the raw HTML. None changes the look.
//
// 1. moveInlineStyles: React writes style props (mostly animation custom properties such as --i / --k) as style=""
//    attributes. Each distinct value becomes one rule in a single <style> block in <head>, and the element gets
//    data-s="<id>" instead. The rule uses :is(#_s, [data-s=…]) so it has ID-level specificity and still beats the
//    site's class selectors, like the inline style did.
//    Hydration is safe: React does not patch attributes of server HTML, and it only touches style later for keys whose
//    values change between renders (those are set inline again and win over the rule). data-s is never removed by React
//    because it is not a prop. Pages rendered in the browser after navigation keep normal inline styles.
// 2. protectEmails: e-mail addresses are written with an HTML entity (support&#64;…) in text and attributes, and with
//    @ inside JSON-LD. Browsers, screen readers and search engines read them exactly as before; simple scrapers
//    that grep the HTML for "name@domain" do not.

const decode = (v) =>
  v.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function moveInlineStyles(html) {
  const start = html.indexOf('<div id="root"');
  if (start < 0) return html;
  const ids = new Map();
  const body = html.slice(start).replace(/(<[a-zA-Z][\w:-]*\b[^<>]*?)\sstyle="([^"]*)"/g, (m, tag, raw) => {
    const css = decode(raw).trim().replace(/;+$/, '');
    if (!css || /<\/?style/i.test(css)) return m;
    if (!ids.has(css)) ids.set(css, ids.size.toString(36));
    return `${tag} data-s="${ids.get(css)}"`;
  });
  if (!ids.size) return html;
  const rules = [...ids].map(([css, id]) => `:is(#_s,[data-s="${id}"]){${css}}`).join('');
  return html.slice(0, start).replace('</head>', `<style id="mfr-s">${rules}</style>\n</head>`) + body;
}

const EMAIL = /([A-Za-z0-9._%+-]+)@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;

export function protectEmails(html) {
  return html
    .split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i)
    .map((part, i) => {
      if (i % 2 === 0) return part.replace(EMAIL, '$1&#64;$2'); // markup: text and attributes
      if (/^<script[^>]*application\/ld\+json/i.test(part)) return part.replace(EMAIL, '$1\\u0040$2'); // JSON string escape
      return part; // other scripts and styles are left alone
    })
    .join('');
}

// 3. fillEmptyAlts: decorative images (emoji stickers, flags, art) are written with alt="" in the components. SEO
//    auditors (SEOptimer "Image Alt Attributes") count an empty alt as missing, so the served HTML names each one
//    after its file: /images/minor/emoji/gift.webp → alt="gift emoji". React keeps the attribute when it hydrates.
export function fillEmptyAlts(html) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (!/\salt=""/.test(tag)) return tag;
    const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
    if (!src) return tag;
    const file = decodeURIComponent(src.split(/[?#]/)[0].split('/').pop() || '').replace(/\.[a-z0-9]+$/i, '');
    let name = file.replace(/[-_]+/g, ' ').trim();
    if (!name) return tag;
    if (/\/flags\//.test(src)) name = `${name.toUpperCase()} flag`;
    else if (/\/emoji\//.test(src)) name = `${name} emoji`;
    return tag.replace(/\salt=""/, ` alt="${name.replace(/"/g, '')}"`);
  });
}
