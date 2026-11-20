import { Suspense } from 'react';

// Hydrate-later boundary for blocks below the first screen.
//
// The prerendered HTML of these blocks is shown from the first paint (search engines and visitors see it at once),
// but React only wakes them up (hydration: event handlers, timers) after the visitor first interacts with the page
// (scroll, wheel, touch, pointer or key), after an in-app navigation, or once the page has been idle for a while.
// That keeps the long hydration tasks out of the loading window, which is what PageSpeed's Total Blocking Time and
// real-user INP measure. React keeps the server HTML of a suspended boundary untouched and hydrates it when the gate
// opens, so nothing re-renders or flashes. A click on a block that is still asleep opens the gate first (pointerdown),
// so the click still works.
//
// Only the first, server-rendered page is gated: on the server and after the gate has opened (every later
// navigation) the children render normally.

const isClient = typeof window !== 'undefined';
let open = !isClient;
let release = () => {};
const gate = isClient ? new Promise((r) => { release = r; }) : null;

export function openHydrationGate() {
  if (open) return;
  open = true;
  release();
}

if (isClient) {
  const opts = { passive: true, capture: true, once: true };
  ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach((e) => window.addEventListener(e, openHydrationGate, opts));
  // Visitors who just look: wake the blocks up anyway a few seconds after the page has loaded, while it is idle.
  const later = () => setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(openHydrationGate, { timeout: 3000 }) : openHydrationGate()), 7000);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}

function Gate() {
  if (!open) throw gate;
  return null;
}

export default function HydrateLater({ children }) {
  return (
    <Suspense fallback={null}>
      <Gate />
      {children}
    </Suspense>
  );
}
