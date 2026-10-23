// Email: syntax + normalisation + disposable/role/typo risk. Domain MX and OTP verification
// are done by checkEmailDomain() (DNS-over-HTTPS in the browser or /api/validate/email on the server).
import { ok, bad, flag, clean } from './result.js';
import { DISPOSABLE } from './disposable-domains.js';

const ROLE = /^(admin|administrator|info|support|sales|contact|office|hello|help|team|hr|jobs|careers|billing|accounts?|marketing|noreply|no-reply|postmaster|webmaster|abuse|enquiries|inquiries|service|mail)$/i;
const FREE = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.de', 'web.de', 'mail.ru', 'yandex.ru', 'yandex.com', 'qq.com', '163.com', '126.com', 'sina.com', 'rediffmail.com', 'zoho.com', 'naver.com', 'daum.net', 'hanmail.net', 'libero.it', 'orange.fr', 'free.fr', 'laposte.net', 't-online.de', 'seznam.cz', 'wp.pl', 'o2.pl', 'interia.pl', 'rambler.ru', 'bol.com.br', 'uol.com.br', 'terra.com.br']);
const TYPOS = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmal.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.cm': 'gmail.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'icloud.co': 'icloud.com', 'iclod.com': 'icloud.com', 'rediffmail.co': 'rediffmail.com' };

export const isFreeMail = (domain) => FREE.has(String(domain).toLowerCase());

export function validateEmail(raw, o = {}) {
  const v = clean(raw);
  if (!v) return o.optional ? ok('') : bad('e.required');
  if (/\s/.test(v)) return bad('e.emailSpace');
  if (v.length > 254) return bad('e.emailLong');
  const at = v.split('@');
  if (at.length !== 2) return bad('e.email');
  const [local, domainRaw] = at;
  const domain = domainRaw.toLowerCase().replace(/\.$/, '');
  if (!local || local.length > 64) return bad('e.email');
  // dot-atom local part (RFC 5322 without quoted strings) + Unicode (EAI / RFC 6531)
  if (!/^[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+(\.[\p{L}\p{N}!#$%&'*+/=?^_`{|}~-]+)*$/u.test(local)) return bad('e.email');
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((l) => !l || l.length > 63 || !/^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(l))) return bad('e.email');
  const tld = labels[labels.length - 1];
  if (!/^(\p{L}{2,63}|xn--[a-z0-9-]{2,59})$/u.test(tld)) return bad('e.email');
  if (TYPOS[domain]) return bad('e.emailTypo', { s: local + '@' + TYPOS[domain] });
  const flags = [];
  if (DISPOSABLE.has(domain) || [...DISPOSABLE].some((d) => domain.endsWith('.' + d))) {
    if (o.blockDisposable !== false) return bad('e.emailDisposable');
    flags.push(flag('email_disposable', -20));
  }
  if (ROLE.test(local)) flags.push(flag('email_role_based', o.b2b ? 0 : -3, local));
  if (/^\d{6,}$/.test(local) && !/^(qq\.com|163\.com|126\.com)$/.test(domain)) flags.push(flag('email_numeric_local', -2));
  if (/(.)\1{5,}/.test(local)) flags.push(flag('email_repeated_chars', -5));
  if (isFreeMail(domain)) flags.push(flag('email_free_provider', 0));
  const value = local + '@' + domain;
  return ok(value, flags);
}

/** Normalised key for duplicate detection (gmail dots/plus, lowercase). */
export function emailKey(email) {
  let [l, d] = String(email).toLowerCase().split('@');
  if (!d) return l;
  l = l.split('+')[0];
  if (d === 'gmail.com' || d === 'googlemail.com') { l = l.replace(/\./g, ''); d = 'gmail.com'; }
  return l + '@' + d;
}

/** Domain + MX check. Browser: DNS-over-HTTPS (Cloudflare/Google). Server: /api/validate/email. */
const mxCache = new Map();
export async function checkEmailDomain(email, { endpoint } = {}) {
  const domain = String(email).split('@')[1];
  if (!domain) return { status: 'invalid' };
  if (mxCache.has(domain)) return mxCache.get(domain);
  const p = (async () => {
    try {
      if (endpoint) {
        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (r.ok) return await r.json();
      }
      for (const url of [`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`]) {
        const ctl = new AbortController();
        const to = setTimeout(() => ctl.abort(), 3500);
        try {
          const r = await fetch(url, { headers: { accept: 'application/dns-json' }, signal: ctl.signal });
          clearTimeout(to);
          if (!r.ok) continue;
          const j = await r.json();
          if (j.Status === 3) return { status: 'no-domain' }; // NXDOMAIN
          if (j.Status === 2) return { status: 'unavailable' }; // SERVFAIL - temporary, never reject
          const mx = (j.Answer || []).filter((a) => a.type === 15);
          if (mx.length) return { status: 'ok', mx: mx.length };
          // RFC 5321: no MX -> A record is the implicit mail server
          const ra = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, { headers: { accept: 'application/dns-json' } }).then((x) => x.json()).catch(() => null);
          return ra && (ra.Answer || []).length ? { status: 'ok', mx: 0, implicit: true } : { status: 'no-mx' };
        } catch { clearTimeout(to); }
      }
    } catch { /* offline */ }
    return { status: 'unknown' };
  })();
  mxCache.set(domain, p);
  return p;
}
