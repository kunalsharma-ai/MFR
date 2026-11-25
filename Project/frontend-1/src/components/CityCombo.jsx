import { useEffect, useMemo, useRef, useState } from 'react';

// Town / city field for the sign-up forms (Consumer, Professional and Teen). It replaces the browser's <datalist>,
// which opened as a tall dark panel over the form with every small town in alphabetical order. This one is a compact
// list inside the field: typing filters it, big cities come first, and whatever the member types is kept as their
// answer even when it is not on the list.

// Large cities, so "most relevant first" works without population data in public/data/geo.
const MAJOR = new Set([
  // India
  'mumbai', 'delhi', 'new delhi', 'bengaluru', 'bangalore', 'hyderabad', 'ahmedabad', 'chennai', 'kolkata', 'surat',
  'pune', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara',
  'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad',
  'dhanbad', 'amritsar', 'allahabad', 'prayagraj', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior',
  'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kota', 'guwahati', 'chandigarh', 'solapur', 'mysore', 'mysuru',
  'gurgaon', 'gurugram', 'noida', 'bhubaneswar', 'bhubaneshwar', 'thiruvananthapuram', 'kochi', 'cochin', 'dehradun',
  'guntur', 'tirupati', 'nellore', 'kurnool', 'kakinada', 'rajahmundry', 'anantapur', 'warangal', 'jammu', 'shimla',
  'panaji', 'mangalore', 'hubli', 'belgaum', 'tiruchirappalli', 'salem', 'kozhikode', 'thrissur', 'udaipur', 'ajmer',
  'bikaner', 'jalandhar', 'cuttack', 'siliguri', 'durgapur', 'asansol', 'jamshedpur', 'bokaro', 'gaya', 'imphal',
  'shillong', 'aizawl', 'agartala', 'kohima', 'itanagar', 'gangtok', 'puducherry', 'port blair',
  // elsewhere
  'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas',
  'san jose', 'austin', 'san francisco', 'seattle', 'boston', 'miami', 'atlanta', 'washington', 'denver',
  'london', 'manchester', 'birmingham', 'glasgow', 'edinburgh', 'liverpool', 'leeds', 'bristol',
  'toronto', 'montreal', 'vancouver', 'calgary', 'ottawa', 'edmonton', 'sydney', 'melbourne', 'brisbane', 'perth',
  'adelaide', 'auckland', 'wellington', 'dubai', 'abu dhabi', 'sharjah', 'riyadh', 'jeddah', 'doha', 'singapore',
  'kuala lumpur', 'jakarta', 'manila', 'bangkok', 'karachi', 'lahore', 'dhaka', 'kathmandu', 'colombo', 'tokyo',
  'osaka', 'seoul', 'beijing', 'shanghai', 'hong kong', 'paris', 'berlin', 'munich', 'hamburg', 'madrid',
  'barcelona', 'rome', 'milan', 'amsterdam', 'brussels', 'vienna', 'zurich', 'stockholm', 'lisbon', 'dublin',
  'warsaw', 'istanbul', 'cairo', 'lagos', 'nairobi', 'johannesburg', 'cape town', 'mexico city', 'sao paulo',
  'rio de janeiro', 'buenos aires', 'bogota', 'lima', 'santiago',
]);

const MAX_SHOWN = 60; // keep the list short; typing narrows it

export default function CityCombo({ id, value, onChange, onBlur, cities, invalid, describedBy, onOpenChange }) {
  const [open, setOpenRaw] = useState(false);
  const [hi, setHi] = useState(-1);
  const listRef = useRef(null);
  const setOpen = (o) => { setOpenRaw(o); onOpenChange?.(o); };

  const items = useMemo(() => {
    const t = String(value || '').trim().toLowerCase();
    const ranked = cities.map((c, i) => {
      const n = c.toLowerCase();
      if (t && !n.includes(t)) return null;
      const major = MAJOR.has(n) ? 0 : 1;
      const match = !t ? 0 : n === t ? 0 : n.startsWith(t) ? 1 : n.split(/[\s-]/).some((w) => w.startsWith(t)) ? 2 : 3;
      return [match, major, i, c];
    }).filter(Boolean);
    ranked.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    return ranked.slice(0, MAX_SHOWN).map((x) => x[3]);
  }, [value, cities]);

  useEffect(() => setHi(-1), [value]);
  useEffect(() => {
    const el = hi >= 0 && listRef.current && listRef.current.children[hi];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [hi]);

  const choose = (c) => { onChange(c); setOpen(false); };
  const hasList = cities.length > 0;
  const showList = open && hasList && items.length > 0 && !(items.length === 1 && items[0].toLowerCase() === String(value).trim().toLowerCase());

  const onKey = (e) => {
    if (!hasList) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); setHi((h) => Math.min(h + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && showList && hi >= 0) { e.preventDefault(); choose(items[hi]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <>
      <input
        id={id}
        placeholder=" "
        maxLength={80}
        value={value}
        role={hasList ? 'combobox' : undefined}
        aria-autocomplete={hasList ? 'list' : undefined}
        aria-expanded={hasList ? showList : undefined}
        aria-controls={hasList ? `${id}-list` : undefined}
        aria-activedescendant={showList && hi >= 0 ? `${id}-opt-${hi}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="address-level2"
        onFocus={() => hasList && setOpen(true)}
        onClick={() => hasList && setOpen(true)}
        onChange={(e) => { onChange(e.target.value); if (hasList) setOpen(true); }}
        onKeyDown={onKey}
        onBlur={() => { setOpen(false); onBlur?.(); }}
      />
      {showList ? (
        <ul className="cc-pop cp-list" role="listbox" id={`${id}-list`} ref={listRef}>
          {items.map((c, i) => (
            <li
              key={`${c}-${i}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={c === value}
              className={`${i === hi ? 'hi' : ''} ${c === value ? 'sel' : ''}`}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(c); }}
            >
              {c}
            </li>
          ))}
          {value.trim() ? <li className="cc-own" aria-hidden="true">Not here? Keep “{value.trim()}”.</li> : null}
        </ul>
      ) : null}
    </>
  );
}
