"use client";
// The hub's own duotone icon set: a soft filled shape (var(--ic-fill)) behind a rounded line drawing (currentColor).
// One set, drawn on the same 24px grid with the same 1.8 stroke, so every icon looks related.

const P = {
  dashboard: (
    <>
      <path className="f" d="M4 13a8 8 0 1 1 16 0v5H4z" />
      <path d="M4 18v-5a8 8 0 0 1 16 0v5M12 13l3.5-3.5M8 18h8" />
      <circle cx="12" cy="13" r="1.4" />
    </>
  ),
  profile: (
    <>
      <circle className="f" cx="12" cy="9" r="4" />
      <circle cx="12" cy="9" r="4" />
      <path d="M4.5 20c1.4-3.6 4.2-5 7.5-5s6.1 1.4 7.5 5" />
      <path d="M17.5 4.5l1 1 2-2" />
    </>
  ),
  surveys: (
    <>
      <rect className="f" x="5" y="4" width="14" height="17" rx="3" />
      <rect x="5" y="4" width="14" height="17" rx="3" />
      <path d="M9 4.5V3h6v1.5M8.5 10l1.5 1.5 3-3M8.5 16h7" />
    </>
  ),
  rewards: (
    <>
      <rect className="f" x="3.5" y="9" width="17" height="11" rx="2.5" />
      <rect x="3.5" y="9" width="17" height="11" rx="2.5" />
      <path d="M12 9v11M3.5 13h17M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9z" />
    </>
  ),
  quality: (
    <>
      <path className="f" d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
      <path d="M8.8 12.2l2.2 2.2 4.3-4.6" />
    </>
  ),
  referrals: (
    <>
      <circle className="f" cx="6" cy="17" r="2.6" />
      <circle className="f" cx="18" cy="17" r="2.6" />
      <circle cx="12" cy="6" r="2.8" />
      <circle cx="6" cy="17" r="2.6" />
      <circle cx="18" cy="17" r="2.6" />
      <path d="M10.4 8.3L7.4 14.6M13.6 8.3l3 6.3M8.6 17h6.8" />
    </>
  ),
  activity: (
    <>
      <path className="f" d="M3 12h4l2.5-6 5 13 2.5-7H21v8H3z" />
      <path d="M3 12h4l2.5-6 5 13 2.5-7H21" />
    </>
  ),
  account: (
    <>
      <rect className="f" x="3" y="5" width="18" height="14" rx="3" />
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.8 16c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14.5 10h4M14.5 13.5h3" />
    </>
  ),
  settings: (
    <>
      <circle className="f" cx="12" cy="12" r="6.5" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  support: (
    <>
      <path className="f" d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="6" rx="1.6" />
      <rect x="17" y="13" width="4" height="6" rx="1.6" />
      <path d="M19 19c0 1.4-1.6 2-4 2h-2" />
    </>
  ),
  bell: (
    <>
      <path className="f" d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  globe: (
    <>
      <circle className="f" cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.4 5.2 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.2-3.4-8.5s1-6.1 3.4-8.5z" />
    </>
  ),
  sun: (
    <>
      <circle className="f" cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7L5.3 5.3" />
    </>
  ),
  moon: (
    <>
      <path className="f" d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
      <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
    </>
  ),
  night: (
    <>
      <path className="f" d="M3 17h18v3H3z" />
      <path d="M16 11.5A5.5 5.5 0 0 1 9 4.5a5.5 5.5 0 1 0 7 7zM3 17h18M5 20.5h14" />
      <path d="M18.5 4v2M17.5 5h2" />
    </>
  ),
  soundOn: (
    <>
      <path className="f" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  soundOff: (
    <>
      <path className="f" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5" />
    </>
  ),
  palette: (
    <>
      <path className="f" d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 1.9-1 1.4-2.1-.6-1.3.2-2.4 1.6-2.4h1.6A4 4 0 0 0 20.5 12 8.5 8.5 0 0 0 12 3.5z" />
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 1.9-1 1.4-2.1-.6-1.3.2-2.4 1.6-2.4h1.6A4 4 0 0 0 20.5 12 8.5 8.5 0 0 0 12 3.5z" />
      <circle cx="7.8" cy="11" r="1" />
      <circle cx="10.5" cy="7.5" r="1" />
      <circle cx="14.8" cy="8" r="1" />
    </>
  ),
  shield: (
    <>
      <path className="f" d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
      <rect x="9.3" y="10.5" width="5.4" height="4.5" rx="1" />
      <path d="M10.4 10.5V9.4a1.6 1.6 0 0 1 3.2 0v1.1" />
    </>
  ),
  lock: (
    <>
      <rect className="f" x="5" y="10" width="14" height="10" rx="2.5" />
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2.5" />
    </>
  ),
  coin: (
    <>
      <circle className="f" cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.6" />
      <path d="M12 9v6M10.2 10.4c0-.8.8-1.4 1.8-1.4s1.8.6 1.8 1.3-1 1.1-1.8 1.4-1.8.7-1.8 1.4.8 1.3 1.8 1.3 1.8-.6 1.8-1.4" />
    </>
  ),
  clock: (
    <>
      <circle className="f" cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  bolt: (
    <>
      <path className="f" d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />
      <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />
    </>
  ),
  star: (
    <>
      <path className="f" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </>
  ),
  spark: (
    <>
      <path className="f" d="M12 3c.7 4.4 2.6 6.3 7 7-4.4.7-6.3 2.6-7 7-.7-4.4-2.6-6.3-7-7 4.4-.7 6.3-2.6 7-7z" />
      <path d="M12 3c.7 4.4 2.6 6.3 7 7-4.4.7-6.3 2.6-7 7-.7-4.4-2.6-6.3-7-7 4.4-.7 6.3-2.6 7-7zM18.5 16.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z" />
    </>
  ),
  stack: (
    <>
      <path className="f" d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
    </>
  ),
  id: (
    <>
      <rect className="f" x="3.5" y="5" width="17" height="14" rx="2.5" />
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6.4 15.5c.5-1.3 1.4-2 2.6-2s2.1.7 2.6 2M14 10h3.5M14 13h2.5" />
    </>
  ),
  gauge: (
    <>
      <path className="f" d="M3.5 16a8.5 8.5 0 1 1 17 0z" />
      <path d="M3.5 16a8.5 8.5 0 1 1 17 0M12 16l4-5.5" />
      <circle cx="12" cy="16" r="1.3" />
    </>
  ),
  calendar: (
    <>
      <rect className="f" x="3.5" y="5" width="17" height="15" rx="2.5" />
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 16.5h2" />
    </>
  ),
  network: (
    <>
      <circle className="f" cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="4.5" cy="6" r="1.8" />
      <circle cx="19.5" cy="6" r="1.8" />
      <circle cx="4.5" cy="18" r="1.8" />
      <circle cx="19.5" cy="18" r="1.8" />
      <path d="M6 7.2l3.6 3M18 7.2l-3.6 3M6 16.8l3.6-3M18 16.8l-3.6-3" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  mail: (
    <>
      <rect className="f" x="3" y="5.5" width="18" height="13" rx="2.5" />
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.8 7l8.2 6 8.2-6" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" />
    </>
  ),
  camera: (
    <>
      <path className="f" d="M3.5 8.5h4l1.5-2.5h6l1.5 2.5h4v11h-17z" />
      <path d="M3.5 8.5h4l1.5-2.5h6l1.5 2.5h4v11h-17z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </>
  ),
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  logout: <path d="M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h10" />,
  trophy: (
    <>
      <path className="f" d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4c0 3 1.3 4.6 3.3 5M17 6h3c0 3-1.3 4.6-3.3 5M12 14v3.5M8.5 20.5h7M9.5 17.5h5" />
    </>
  ),
  rocket: (
    <>
      <path className="f" d="M14.5 4c3 0 5.5 2.5 5.5 5.5L13 16.5 7.5 11z" />
      <path d="M14.5 4c3 0 5.5 2.5 5.5 5.5L13 16.5 7.5 11zM7.5 11L4 11.5l2.5-3.5h4M13 16.5l-.5 3.5 3.5-2.5v-4M7 17c-1.2.3-2.2 1.3-2.5 3 1.7-.3 2.7-1.3 3-2.5" />
      <circle cx="15" cy="9" r="1.5" />
    </>
  ),
  briefcase: (
    <>
      <rect className="f" x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M9 7.5V5.5h6v2M3.5 12.5h17M11 12.5v2h2v-2" />
    </>
  ),
  chart: (
    <>
      <path className="f" d="M4 20V12l4-3 4 4 8-7v14z" />
      <path d="M4 20h16M4 16l4-4 4 3 8-8M16 7h4v4" />
    </>
  ),
  users: (
    <>
      <circle className="f" cx="9" cy="8.5" r="3.2" />
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.8c1.5.6 2.6 2 3 4.2" />
    </>
  ),
  eye: (
    <>
      <path className="f" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  pin: (
    <>
      <path className="f" d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  wallet: (
    <>
      <path className="f" d="M4 7.5h15a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M4 7.5h15a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V6.5A2 2 0 0 1 6 4.5h11v3M16 13.8h4.5" />
    </>
  ),
  heart: (
    <>
      <path className="f" d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
    </>
  ),
  help: (
    <>
      <circle className="f" cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.2-2.6 3.9" />
      <circle cx="12" cy="17.2" r=".6" fill="currentColor" />
    </>
  ),
  search: (
    <>
      <circle className="f" cx="10.5" cy="10.5" r="6.5" />
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L20 20" />
    </>
  ),
  send: (
    <>
      <path className="f" d="M3.5 11.5L20 4l-5.5 16-3-6.5z" />
      <path d="M3.5 11.5L20 4l-5.5 16-3-6.5zM11.5 13.5L20 4" />
    </>
  ),
  services: (
    <>
      <rect className="f" x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <path d="M17 13.5v7M13.5 17h7" />
    </>
  ),
  inbox: (
    <>
      <path className="f" d="M3.5 13h5l1.5 2.5h4L15.5 13h5v5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M3.5 13l2.6-7.1A2 2 0 0 1 8 4.5h8a2 2 0 0 1 1.9 1.4L20.5 13v5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM3.5 13h5l1.5 2.5h4L15.5 13h5" />
    </>
  ),
  flame: (
    <>
      <path className="f" d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.6 3-5.6 3.6-9.4 2.4 1.4 3.7 3.6 3.9 5.6 1-.8 1.6-2 1.7-3.4 2 1.6 3.8 4.2 3.8 7.2 0 3.5-2.6 6.1-6.5 6.1z" />
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.6 3-5.6 3.6-9.4 2.4 1.4 3.7 3.6 3.9 5.6 1-.8 1.6-2 1.7-3.4 2 1.6 3.8 4.2 3.8 7.2 0 3.5-2.6 6.1-6.5 6.1zM12 21c-1.6 0-2.7-1.1-2.7-2.6 0-1.7 1.6-2.4 2.7-4.4 1.1 2 2.7 2.7 2.7 4.4 0 1.5-1.1 2.6-2.7 2.6z" />
    </>
  ),
  crown: (
    <>
      <path className="f" d="M4 8l4 4 4-7 4 7 4-4-1.5 10h-13z" />
      <path d="M4 8l4 4 4-7 4 7 4-4-1.5 10h-13zM5.5 21h13" />
    </>
  ),
  gift: (
    <>
      <rect className="f" x="4" y="10" width="16" height="10.5" rx="2" />
      <path d="M4 10h16v10.5a0 0 0 0 1 0 0H4zM3 7h18v3H3zM12 7v13.5M12 7c-1.5-3.5-5.5-3.5-5.5-1 0 1 1 1 5.5 1zM12 7c1.5-3.5 5.5-3.5 5.5-1 0 1-1 1-5.5 1z" />
    </>
  ),
  target: (
    <>
      <circle className="f" cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9M4 12h5M13 12h7" />
      <circle className="f" cx="15" cy="7" r="2" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
      <circle cx="11" cy="12" r="2" />
    </>
  ),
  text: (
    <>
      <path d="M4 7V5h10v2M9 5v14M7 19h4M14 12v-1.5h6V12M17 10.5V19M15.5 19h3" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path className="f" d="M12 3.5a8.5 8.5 0 0 1 0 17z" style={{ fill: "currentColor" }} />
    </>
  ),
  motion: (
    <>
      <circle className="f" cx="15" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
      <path d="M3 9h5M2 12h6M3 15h5" />
    </>
  ),
  keyboard: (
    <>
      <rect className="f" x="2.5" y="6" width="19" height="12" rx="2.5" />
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10" />
    </>
  ),
  device: (
    <>
      <rect className="f" x="3" y="4.5" width="13" height="10" rx="1.5" />
      <rect x="3" y="4.5" width="13" height="10" rx="1.5" />
      <path d="M6.5 18.5h6M9.5 14.5v4" />
      <rect x="17" y="9" width="4.5" height="10" rx="1.2" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.3 9.5 6-.5.9-1.6 2.4-3.1 3.7M6.3 7.6C4.5 8.9 3.2 10.7 2.5 12c1 1.7 4.5 6 9.5 6 1.6 0 3-.4 4.3-1.1M9.9 10a3 3 0 0 0 4.1 4.1" />
    </>
  ),
  alert: (
    <>
      <path className="f" d="M12 3.5l9 16H3z" />
      <path d="M12 3.5l9 16H3zM12 10v4M12 17h.01" />
    </>
  ),
  hourglass: (
    <>
      <path className="f" d="M7 4h10c0 4-5 6-5 8 0-2-5-4-5-8z" />
      <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
    </>
  ),
  play: (
    <>
      <circle className="f" cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 8.5l5 3.5-5 3.5z" />
    </>
  ),
  layers: (
    <>
      <path className="f" d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
    </>
  ),
  user: (
    <>
      <circle className="f" cx="12" cy="8" r="3.5" />
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" />
    </>
  ),
  globe2: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.6 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.6-3.5-8.5s1-5.9 3.5-8.5z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.6-4.2L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.6 4.2l1.4-1.7M20 20v-4.5h-4.5" />
    </>
  ),
  book: (
    <>
      <path className="f" d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" />
      <path d="M4 20.5v-15A1.5 1.5 0 0 1 5.5 4H11a1 1 0 0 1 1 1v15M20 20.5v-15A1.5 1.5 0 0 0 18.5 4H13a1 1 0 0 0-1 1M4 20.5A1.5 1.5 0 0 1 5.5 19H11M20 20.5a1.5 1.5 0 0 0-1.5-1.5H13" />
    </>
  ),
};

export default function Icon({ name, size = 22, className = "", title }) {
  const body = P[name] || P.spark;
  return (
    <svg
      className={`hi ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {body}
    </svg>
  );
}
