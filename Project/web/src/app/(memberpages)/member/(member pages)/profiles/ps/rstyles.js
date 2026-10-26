// Prize Machine styles: the board, capsules, effects and the prize ticket in the completion pop-up.
// Injected once when the board or the completion pop-up loads (both are lazy chunks), so none of this is
// in the first paint. The header points pill, LED counter and card chips are in src/styles/app.css.
// Machine sizes are in units of --u (1px on desktop, smaller on phones). Language palette: --L1 --L2 --L3.
const CSS = String.raw`
.pm { position: relative; display: grid; grid-template-columns: minmax(0, 360px) minmax(0, 1fr); grid-template-areas: 'm h' 'm s'; grid-template-rows: auto 1fr; gap: 14px 34px; margin: 30px 0 6px; padding: 26px 30px 30px; border-radius: 28px; color: #fff; isolation: isolate; overflow: clip; scroll-margin-top: 90px;
  background: radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, var(--L1) 42%, #0a1240), #070c2a 62%), #070c2a; box-shadow: var(--shadow-l); }
.pm::before { content: ""; position: absolute; inset: auto 0 0 0; height: 45%; z-index: -1; pointer-events: none; opacity: .5;
  background: linear-gradient(to top, color-mix(in oklab, var(--L2) 26%, transparent), transparent), repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 1px, transparent 1px 44px); mask: linear-gradient(to top, #000, transparent); }
.pm::after { content: ""; position: absolute; width: 380px; height: 380px; left: -60px; top: 40px; z-index: -1; border-radius: 50%; background: radial-gradient(circle, color-mix(in oklab, var(--L3) 32%, transparent), transparent 65%); pointer-events: none; }
.pm-machine-wrap { grid-area: m; display: grid; place-items: center; }
.pm-head { grid-area: h; display: grid; gap: 10px; justify-items: start; }
.pm-machine { --u: 1px; position: relative; width: calc(320 * var(--u)); height: calc(560 * var(--u)); }
.pm-sign { position: absolute; left: calc(35 * var(--u)); top: 0; width: calc(250 * var(--u)); height: calc(46 * var(--u)); display: grid; place-items: center; border-radius: calc(14 * var(--u)); background: #0d1336; border: calc(3 * var(--u)) solid var(--L3); outline: calc(3 * var(--u)) dotted #ffe9a6; outline-offset: calc(4 * var(--u)); z-index: 3; }
.pm-sign b { font: 800 calc(14.5 * var(--u))/1 var(--ff-h); letter-spacing: .16em; text-transform: uppercase; color: var(--L3); text-shadow: 0 0 calc(10 * var(--u)) var(--L3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 92%; }
.pm-globe { position: absolute; left: calc(20 * var(--u)); top: calc(60 * var(--u)); width: calc(280 * var(--u)); height: calc(280 * var(--u)); border-radius: 50%; overflow: hidden; z-index: 2;
  border: calc(8 * var(--u)) solid color-mix(in oklab, var(--L1) 35%, #d8e0ff); background: radial-gradient(circle at 50% 110%, color-mix(in oklab, var(--L2) 30%, transparent), transparent 60%), radial-gradient(circle at 50% 45%, rgba(170,200,255,.10), rgba(10,18,60,.55)); box-shadow: 0 calc(14 * var(--u)) calc(34 * var(--u)) rgba(0,0,0,.45), inset 0 calc(-18 * var(--u)) calc(40 * var(--u)) rgba(0,0,0,.35); }
.pm-glass { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; background: radial-gradient(ellipse 38% 26% at 32% 22%, rgba(255,255,255,.55), rgba(255,255,255,0) 70%), radial-gradient(circle at 50% 50%, transparent 62%, rgba(255,255,255,.16) 70%, transparent 76%); }
.cap.in-globe { position: absolute; left: calc((var(--x) - 28) * var(--u)); top: calc((var(--y) - 68) * var(--u)); rotate: var(--r); transition: opacity .2s; }
.cap.in-globe.gone { opacity: 0; }
.pm-machine.is-running .cap.in-globe { animation: pm-jig .16s ease-in-out 4 alternate; animation-delay: calc(var(--i) * -37ms); }
@keyframes pm-jig { to { translate: calc(2 * var(--u)) calc(-6 * var(--u)); } }
.pm-neck { position: absolute; left: calc(100 * var(--u)); top: calc(332 * var(--u)); width: calc(120 * var(--u)); height: calc(24 * var(--u)); z-index: 1; border-radius: calc(6 * var(--u)); background: linear-gradient(90deg, #6f7a96, #eef2fb 40%, #8a95b0 70%, #59627a); }
.pm-body { position: absolute; left: calc(10 * var(--u)); top: calc(350 * var(--u)); width: calc(300 * var(--u)); height: calc(168 * var(--u)); z-index: 3; border-radius: calc(22 * var(--u)) calc(22 * var(--u)) calc(28 * var(--u)) calc(28 * var(--u));
  background: linear-gradient(165deg, color-mix(in oklab, var(--L1) 88%, #fff), var(--L1) 35%, color-mix(in oklab, var(--L1) 55%, #000)); border: calc(3 * var(--u)) solid color-mix(in oklab, var(--L3) 70%, #fff); box-shadow: inset 0 calc(10 * var(--u)) calc(18 * var(--u)) rgba(255,255,255,.18), inset 0 calc(-14 * var(--u)) calc(22 * var(--u)) rgba(0,0,0,.3), 0 calc(16 * var(--u)) calc(30 * var(--u)) rgba(0,0,0,.4); }
.pm-bulbrow { position: absolute; left: calc(18 * var(--u)); right: calc(18 * var(--u)); top: calc(6 * var(--u)); display: flex; justify-content: space-between; }
.pm-bulbrow i { width: calc(8 * var(--u)); height: calc(8 * var(--u)); border-radius: 50%; background: #ffe7a0; box-shadow: 0 0 calc(6 * var(--u)) #ffd36a; }
.pm-machine.is-running .pm-bulbrow i, .pm-machine.is-party .pm-bulbrow i { animation: pm-chase .5s steps(2, jump-none) infinite; animation-delay: calc(var(--i) * -90ms); }
.pm-machine.is-party .pm-sign { animation: pm-signflash .35s steps(2, jump-none) infinite; }
@keyframes pm-chase { 50% { opacity: .25; } }
@keyframes pm-signflash { 50% { outline-color: var(--L2); border-color: #fff; } }
.pm-led { position: absolute; left: calc(16 * var(--u)); top: calc(20 * var(--u)); width: calc(268 * var(--u)); height: calc(58 * var(--u)); display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto 1fr; align-items: center; column-gap: calc(10 * var(--u)); padding: calc(6 * var(--u)) calc(12 * var(--u)); border-radius: calc(12 * var(--u));
  background: radial-gradient(circle at 1px 1px, rgba(255,255,255,.07) 1px, transparent 1.5px) 0 0 / calc(4 * var(--u)) calc(4 * var(--u)), #05081c; border: calc(2 * var(--u)) solid rgba(0,0,0,.5); box-shadow: inset 0 0 calc(14 * var(--u)) rgba(0,0,0,.8); }
.pm-led-l { grid-column: 1 / -1; font: 700 calc(9.5 * var(--u))/1 var(--ff-b); letter-spacing: .14em; text-transform: uppercase; color: color-mix(in oklab, var(--L3) 60%, #fff); opacity: .75; }
.pm-led-v { display: flex; align-items: baseline; gap: calc(5 * var(--u)); font: 800 calc(28 * var(--u))/1 var(--ff-h); color: #ffcf4a; text-shadow: 0 0 calc(8 * var(--u)) rgba(255,190,40,.8); }
.pm-led-v small { font: 700 calc(11 * var(--u))/1 var(--ff-b); opacity: .8; text-shadow: none; }
.pm-led-usd { font: 800 calc(16 * var(--u))/1 var(--ff-h); color: #8dffb9; text-shadow: 0 0 calc(8 * var(--u)) rgba(80,255,160,.7); }
.pm-chute { position: absolute; left: calc(38 * var(--u)); top: calc(86 * var(--u)); width: calc(84 * var(--u)); height: calc(46 * var(--u)); border-radius: calc(12 * var(--u)) calc(12 * var(--u)) calc(6 * var(--u)) calc(6 * var(--u)); background: linear-gradient(#020414, #141a3a); box-shadow: inset 0 calc(6 * var(--u)) calc(10 * var(--u)) rgba(0,0,0,.8), 0 0 0 calc(3 * var(--u)) rgba(255,255,255,.25); }
.pm-chute i { position: absolute; left: calc(6 * var(--u)); right: calc(6 * var(--u)); top: 0; height: calc(16 * var(--u)); border-radius: 0 0 calc(6 * var(--u)) calc(6 * var(--u)); background: linear-gradient(rgba(255,255,255,.35), rgba(255,255,255,.08)); transform-origin: top; transition: transform .3s; }
.pm-machine.is-running .pm-chute i { transform: rotateX(70deg); }
.pm-tray { position: absolute; left: calc(32 * var(--u)); top: calc(134 * var(--u)); width: calc(96 * var(--u)); height: calc(20 * var(--u)); border-radius: 0 0 calc(30 * var(--u)) calc(30 * var(--u)); background: linear-gradient(#cfd6ea, #7a84a0); box-shadow: inset 0 calc(4 * var(--u)) calc(6 * var(--u)) rgba(0,0,0,.35); }
.pm-crank { position: absolute; left: calc(198 * var(--u)); top: calc(84 * var(--u)); width: calc(66 * var(--u)); height: calc(66 * var(--u)); padding: 0; border: 0; border-radius: 50%; cursor: pointer; background: radial-gradient(circle at 35% 30%, #ffffff, #cdd5ea 42%, #6e7894); box-shadow: 0 calc(6 * var(--u)) calc(12 * var(--u)) rgba(0,0,0,.45), inset 0 calc(-4 * var(--u)) calc(6 * var(--u)) rgba(0,0,0,.25); }
.pm-crank:disabled { cursor: default; }
.pm-crank:focus-visible { outline: 3px solid var(--L3); outline-offset: 3px; }
.pm-crank-k { position: absolute; inset: 0; border-radius: 50%; transform: rotate(calc(var(--turns, 0) * 360deg)); transition: transform .7s cubic-bezier(.3,.7,.2,1); }
.pm-crank-k::before { content: ""; position: absolute; left: calc(50% - 7 * var(--u)); top: calc(50% - 7 * var(--u)); width: calc(14 * var(--u)); height: calc(14 * var(--u)); border-radius: 50%; background: #3b4560; }
.pm-crank-k i { position: absolute; left: calc(50% - 5 * var(--u)); top: calc(6 * var(--u)); width: calc(10 * var(--u)); height: calc(28 * var(--u)); border-radius: calc(5 * var(--u)); background: linear-gradient(90deg, #8a95b0, #fff, #8a95b0); }
.pm-crank-k i::after { content: ""; position: absolute; left: calc(-5 * var(--u)); top: calc(-6 * var(--u)); width: calc(20 * var(--u)); height: calc(20 * var(--u)); border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff, var(--L2)); box-shadow: 0 calc(2 * var(--u)) calc(4 * var(--u)) rgba(0,0,0,.4); }
@media (hover: hover) { .pm-crank:not(:disabled):hover .pm-crank-k { transform: rotate(calc(var(--turns, 0) * 360deg + 25deg)); } }
.pm-base { position: absolute; left: calc(30 * var(--u)); top: calc(514 * var(--u)); width: calc(260 * var(--u)); height: calc(42 * var(--u)); z-index: 2; clip-path: polygon(6% 0, 94% 0, 100% 100%, 0 100%); background: linear-gradient(#2a3150, #0d1126); }
.pm-flyer { position: absolute; left: 0; top: 0; z-index: 6; width: calc(40 * var(--u)); height: calc(40 * var(--u)); pointer-events: none; }
.pm-pick { position: absolute; left: calc(26 * var(--u)); top: calc(120 * var(--u)); width: calc(268 * var(--u)); z-index: 8; display: grid; gap: 4px; padding: 14px 16px 12px; border-radius: 18px; text-align: center; background: #fff; color: var(--ink); box-shadow: 0 24px 60px -18px rgba(0,0,0,.6); animation: pm-pop .45s var(--spring) both; }
.pm-pick small { font: 800 11px var(--ff-b); letter-spacing: .14em; text-transform: uppercase; color: var(--ember, #e8590c); }
.pm-pick b { font: 800 19px/1.2 var(--ff-h); color: var(--navy); }
.pm-pick > span { font-size: 13px; color: var(--muted); }
.pm-pick div { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px 12px; margin-top: 6px; }
.pm-go { min-height: 42px; }
.pm-x { position: absolute; right: 6px; top: 4px; width: 30px; height: 30px; border: 0; background: none; font-size: 22px; line-height: 1; color: var(--muted); cursor: pointer; }
@keyframes pm-pop { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }

/* capsules */
.cap { --cs: calc(40 * var(--u, 1px)); position: relative; display: inline-block; width: var(--cs); height: var(--cs); flex: none; }
.cap-emo { position: absolute; left: 17%; top: 6%; width: 66%; height: 66%; z-index: 1; object-fit: contain; transition: transform .5s var(--spring); }
.cap-bot { position: absolute; left: 0; right: 0; bottom: 0; height: 50%; z-index: 2; border-radius: 0 0 999px 999px; background: radial-gradient(circle at 35% 15%, color-mix(in oklab, var(--k1) 55%, #fff), var(--k1) 45%, color-mix(in oklab, var(--k1) 55%, #000)); box-shadow: inset 0 calc(var(--cs) * -.06) calc(var(--cs) * .12) rgba(0,0,0,.25); }
.cap-top { position: absolute; left: 0; right: 0; top: 0; height: 50%; z-index: 3; border-radius: 999px 999px 0 0; background: radial-gradient(circle at 34% 34%, rgba(255,255,255,.8), rgba(255,255,255,.2) 34%, rgba(200,225,255,.16) 70%, rgba(255,255,255,.4)); border: 1px solid rgba(255,255,255,.55); border-bottom: 0; transition: transform .5s var(--spring), opacity .4s; }
.cap-band { position: absolute; left: -1px; right: -1px; top: calc(50% - var(--cs) * .05); height: calc(var(--cs) * .1); z-index: 4; border-radius: 3px; background: var(--k2); box-shadow: 0 1px 2px rgba(0,0,0,.3); transition: opacity .3s; }
.cap.is-open .cap-top { transform: translate(-38%, -95%) rotate(-42deg); }
.cap.is-open .cap-emo { z-index: 5; transform: translateY(-60%) scale(1.25); }
.cap.is-open .cap-band { opacity: 0; }
.cap.mini { --cs: 34px; }
.cap.mini.is-open .cap-top { display: none; }
.cap.mini.is-open .cap-emo { transform: translateY(-34%) scale(1.05); transition: none; }

/* side panel */
.pm-side { grid-area: s; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.pm-kicker { display: inline-flex; align-self: flex-start; align-items: center; gap: 8px; margin: 0; padding: 5px 12px; border-radius: 999px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); font: 800 12px/1.2 var(--ff-h); letter-spacing: .08em; text-transform: uppercase; }
.pm-stars { color: var(--L3); letter-spacing: 1px; }
.pm h3 { margin: 0; font: 800 clamp(24px, 2.8vw, 34px)/1.1 var(--ff-h); color: #fff; }
.pm-sub { margin: 0; max-width: 560px; font-size: 15px; line-height: 1.5; color: rgba(255,255,255,.82); }
.pm-coll-h { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px; margin-top: 4px; }
.pm-coll-h b { font: 800 16px var(--ff-h); }
.pm-coll-h span { font-size: 13.5px; color: rgba(255,255,255,.75); }
.pm-slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
.pm-slot { width: 100%; height: 54px; display: grid; place-items: center; padding: 0; cursor: pointer; border-radius: 14px; background: rgba(255,255,255,.05); border: 1.5px dashed rgba(255,255,255,.24); color: #fff; transition: transform .2s var(--ease), border-color .2s; }
.pm-slot:hover { transform: translateY(-2px); border-color: var(--L3); }
.pm-slot:focus-visible { outline: 3px solid var(--L3); outline-offset: 2px; }
.pm-slot.got { border-style: solid; border-color: color-mix(in oklab, var(--L3) 55%, transparent); background: radial-gradient(circle at 50% 80%, color-mix(in oklab, var(--L3) 22%, transparent), rgba(255,255,255,.06)); padding-top: 10px; }
.pm-empty { font: 800 10.5px var(--ff-b); color: rgba(255,255,255,.55); direction: ltr; }
.pm-slot.locked { opacity: .6; }
.pm-slot.locked:hover { transform: none; border-color: rgba(255,255,255,.24); }
.pm-slot .pm-lock { width: 16px; height: 16px; stroke: currentColor; opacity: .8; }
.pm-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.pm-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; font: 700 13px/1.2 var(--ff-b); background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.18); }
.pm-chip.gold { background: color-mix(in oklab, var(--L3) 30%, transparent); }
.pm-chip.soft { color: rgba(255,255,255,.72); }
.pm-ranks { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin: 0; padding: 0; list-style: none; }
.pm-ranks li { display: grid; justify-items: center; gap: 2px; padding: 8px 4px; border-radius: 12px; text-align: center; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12); }
.pm-ranks span { font-size: 9px; letter-spacing: 1px; color: rgba(255,255,255,.4); }
.pm-ranks b { font: 800 12.5px var(--ff-h); }
.pm-ranks small { font-size: 11px; color: rgba(255,255,255,.6); }
.pm-ranks li.past span, .pm-ranks li.cur span { color: var(--L3); }
.pm-ranks li.cur { background: linear-gradient(160deg, color-mix(in oklab, var(--L1) 45%, transparent), color-mix(in oklab, var(--L3) 25%, transparent)); border-color: var(--L3); box-shadow: 0 8px 20px -12px var(--L3); }
.pm-ctas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
.pm-cta { max-width: 100%; white-space: normal; text-align: start; }
.pm-luck { color: #fff !important; border-color: rgba(255,255,255,.35) !important; background: rgba(255,255,255,.06) !important; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.35) !important; }
.pm-hint { margin: 0; font-size: 12.5px; color: rgba(255,255,255,.6); }

/* effects */
.pm-spark { position: absolute; z-index: 9; font-size: 17px; line-height: 1; pointer-events: none; text-shadow: 0 0 8px currentColor; }
.pm-ring { position: absolute; z-index: 9; width: 54px; height: 54px; border: 2px solid; border-radius: 50%; pointer-events: none; }
.pm-float { position: absolute; z-index: 10; white-space: nowrap; pointer-events: none; font: 900 22px/1 var(--ff-h); color: #fff; text-shadow: 0 0 10px var(--L3), 0 2px 0 rgba(0,0,0,.4); }
.pm-fly { position: fixed; z-index: 96; display: flex; align-items: center; gap: 6px; padding: 4px 11px 4px 4px; border-radius: 999px; pointer-events: none; white-space: nowrap; background: linear-gradient(135deg, var(--k1), var(--k2)); color: #fff; font: 800 14px/1 var(--ff-h); box-shadow: 0 0 0 3px rgba(255,255,255,.4), 0 12px 30px rgba(0,0,0,.35); }
.pm-fly i { width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(180deg, rgba(255,255,255,.95) 0 46%, var(--k2) 46% 54%, var(--k1) 54%); box-shadow: 0 0 10px rgba(255,255,255,.6); }

/* prize ticket in the completion pop-up */
.pm-ticket { position: relative; display: flex; align-items: center; gap: 12px; margin: 12px auto 0; max-width: 340px; padding: 9px 16px 9px 14px; text-align: start; color: #3a2400; border-radius: 10px;
  background: linear-gradient(135deg, #fff6d6, var(--gold, #ffc23d) 70%, #ffbf3f); box-shadow: 0 10px 24px -14px rgba(120,70,0,.7);
  -webkit-mask: radial-gradient(circle 7px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 7px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;
  mask: radial-gradient(circle 7px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 7px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat;
  animation: pm-print .7s 1s cubic-bezier(.2,.9,.3,1.2) both; transform-origin: top; }
.pm-ticket::after { content: ""; position: absolute; inset-inline-start: 62px; top: 8px; bottom: 8px; border-inline-start: 2px dashed rgba(90,58,0,.3); }
.pm-ticket .cap { --cs: 38px; margin-top: 6px; }
.pm-ticket-t { display: grid; gap: 1px; padding-inline-start: 12px; }
.pm-ticket-t small { font: 800 10px var(--ff-b); letter-spacing: .14em; text-transform: uppercase; opacity: .7; }
.pm-ticket-t b { font: 900 17px/1.15 var(--ff-h); }
.pm-ticket-t span { font: 600 12.5px/1.3 var(--ff-b); }
.pm-ticket .led { color: #3a2400; }
@keyframes pm-print { from { transform: translateY(-10px) scaleY(.15); opacity: 0; } to { transform: none; opacity: 1; } }
@media (max-height: 640px) { .pm-ticket { margin-top: 8px; padding-block: 6px; } .pm-ticket .cap { --cs: 30px; } .pm-ticket-t b { font-size: 15px; } }

@media (max-width: 900px) {
  .pm { grid-template-columns: 1fr; grid-template-areas: 'h' 'm' 's'; padding: 20px 16px 22px; border-radius: 22px; }
  .pm-machine { --u: .88px; }
  .pm-slots { grid-template-columns: repeat(auto-fill, minmax(38px, 1fr)); gap: 6px; }
  .pm-slot { height: 44px; border-radius: 11px; }
  .pm-slot.got { padding-top: 8px; }
  .pm-slot .cap.mini { --cs: 28px; }
  .pm-ranks { grid-template-columns: repeat(5, minmax(60px, 1fr)); overflow-x: auto; scrollbar-width: none; }
}
@media (max-width: 380px) { .pm-machine { --u: .8px; } }
@media (prefers-reduced-motion: reduce) {
  .pm-machine.is-running .cap.in-globe, .pm-machine.is-running .pm-bulbrow i, .pm-machine.is-party .pm-bulbrow i, .pm-machine.is-party .pm-sign, .pm-ticket, .pm-pick { animation: none !important; }
  .cap-top, .cap-emo, .pm-crank-k { transition: none !important; }
}
`;

export function ensureRewardStyles() {
  if (typeof document === 'undefined' || document.getElementById('mfr-rewards-css')) return;
  const s = document.createElement('style');
  s.id = 'mfr-rewards-css';
  s.textContent = CSS.replace(/\s+/g, ' ');
  document.head.append(s);
}
export const REWARD_CSS = CSS;
