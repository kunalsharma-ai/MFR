import { useEffect, useId, useMemo, useRef } from 'react';
import { coverSvg } from '../utils/blogCover.js';

// Animated, text-free cover for a blog post (art: utils/blogCover.js, motion: styles/v30-blogcover.css).
// A cover only moves while it is on screen: one shared IntersectionObserver adds .is-live, so a page full of
// covers costs nothing for the ones scrolled away.
let io = null;
const watch = (el) => {
  if (typeof IntersectionObserver === 'undefined') { el.classList.add('is-live'); return () => {}; }
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)), { rootMargin: '80px 0px' });
  io.observe(el);
  return () => io.unobserve(el);
};

export default function BlogCover({ slug, title, className = '', align }) {
  const ref = useRef(null);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const html = useMemo(() => {
    const svg = coverSvg(slug, `${slug}-${uid}`);
    return align ? svg.replace('xMidYMid slice', `${align} slice`) : svg; // e.g. xMaxYMid: art to the right of a wide hero
  }, [slug, uid, align]);
  useEffect(() => (ref.current ? watch(ref.current) : undefined), []);
  return (
    <span ref={ref} className={`bc ${className}`} role="img" aria-label={title ? `Cover illustration: ${title}` : 'Cover illustration'} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
