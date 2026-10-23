import { themeFor, themeVars } from '../themes/themes.js';
import MemberCard from './MemberCard.jsx';

/** Shown while the question flow (or a profile's questions) loads: already in the profile's colours,
 *  with the same layout as the real screen - so opening a profile never flashes an empty white page. */
export default function FlowSkeleton({ meta, dark, label }) {
  const th = themeFor(meta?.s || 'basic');
  return (
    <div className={`flow w-${th.id} card-${th.card} ${th.dark ? 'is-dark' : ''} flow-skel`} style={themeVars(th, dark)} aria-busy="true">
      <div className="flow-in">
        <aside className="panel">
          <span className="sk sk-back" />
          <MemberCard theme={th} variant="panel" />
          <span className="sk sk-bar" />
        </aside>
        <main className="stage">
          <div className="qcard in-next">
            <span className="sk sk-chip" />
            <span className="sk sk-h" /><span className="sk sk-h short" />
            <div className="sk-tiles"><span className="sk" /><span className="sk" /><span className="sk" /><span className="sk" /></div>
            <p className="sr-only">{label}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
