// Inline SVG icons (no icon font, no extra requests)
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const IGlobe = (p) => (<svg width="20" height="20" viewBox="0 0 24 24" {...P} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></svg>);
export const ISound = ({ on, ...p }) => (<svg width="20" height="20" viewBox="0 0 24 24" {...P} {...p}><path d="M4 9v6h4l5 4V5L8 9z" />{on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M17 9l5 6M22 9l-5 6" />}</svg>);
export const ISun = (p) => (<svg width="20" height="20" viewBox="0 0 24 24" {...P} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const IMoon = (p) => (<svg width="20" height="20" viewBox="0 0 24 24" {...P} {...p}><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" /></svg>);
export const ISearch = (p) => (<svg width="18" height="18" viewBox="0 0 24 24" {...P} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const IClose = (p) => (<svg width="20" height="20" viewBox="0 0 24 24" {...P} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IArrow = ({ back, ...p }) => (<svg width="18" height="18" viewBox="0 0 24 24" {...P} {...p} className={`ico-arrow ${back ? 'back' : ''}`}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const ICheck = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" {...P} strokeWidth={3} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const IChevron = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" {...P} {...p}><path d="M6 9l6 6 6-6" /></svg>);
export const ILock = (p) => (<svg width="14" height="14" viewBox="0 0 24 24" {...P} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
export const IEdit = (p) => (<svg width="16" height="16" viewBox="0 0 24 24" {...P} {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>);
export const IGrid = (p) => (<svg width="18" height="18" viewBox="0 0 24 24" {...P} {...p}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>);
