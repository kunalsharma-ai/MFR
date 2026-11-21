// Location data for the Teen registration (country -> state/province -> city, postcode format), split per country so
// a visitor downloads only the country they pick. Source: the API's own dataBank (api/app/dataBank/theworld.json),
// the same data the portal uses, so the browser and the server agree on every country and state code.
//   node scripts/build-teen-geo.mjs   ->  public/data/geo/index.json + public/data/geo/<ISO>.json
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../../api/app/dataBank/theworld.json');
const out = path.resolve(here, '../public/data/geo');
const world = JSON.parse(readFileSync(src, 'utf-8'));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const collator = new Intl.Collator('en');
const index = [];
let cities = 0;
for (const [iso, c] of Object.entries(world)) {
  const states = Object.values(c.states || {}).map((s) => ({ c: s.code, n: s.name, ci: [...new Set(s.cities || [])].sort(collator.compare) }));
  states.sort((a, b) => collator.compare(a.n, b.n));
  cities += states.reduce((a, s) => a + s.ci.length, 0);
  index.push({ i: iso, n: c.name, d: c.codes?.phone || '', z: c.zipFormat || '', s: states.length ? 1 : 0, tz: (c.timezones || []).map((t) => t.zoneName).slice(0, 6) });
  writeFileSync(path.join(out, `${iso}.json`), JSON.stringify({ i: iso, z: c.zipFormat || '', s: states }));
}
index.sort((a, b) => collator.compare(a.n, b.n));
writeFileSync(path.join(out, 'index.json'), JSON.stringify(index));
console.log(`teen geo: ${index.length} countries, ${cities} cities -> public/data/geo`);
