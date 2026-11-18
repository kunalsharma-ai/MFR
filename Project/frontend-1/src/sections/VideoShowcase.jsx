import { useLocation } from 'react-router-dom';
import VideoStage from '../components/video/VideoStage.jsx';
import { videoById, videoFor } from '../data/videos.js';

// In-page video showcase (v3.0). Drop <VideoShowcase /> into a page; it picks that page's entry from
// src/data/videos.js (or pass id="…"). Each page renders a different stage template.
export default function VideoShowcase({ id }) {
  const { pathname } = useLocation();
  const e = (id && videoById(id)) || videoFor(pathname);
  const hid = `vsx-${e.id}`;
  return (
    <section className={`section vsx vsx--${e.template}`} aria-labelledby={hid} style={{ '--c1': e.c1, '--c2': e.c2 }}>
      <div className="container reveal">
        <VideoStage e={e} headingId={hid} />
      </div>
    </section>
  );
}
