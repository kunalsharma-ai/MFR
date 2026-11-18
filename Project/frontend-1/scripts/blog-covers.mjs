// Renders the still versions of the blog covers (public/images/blog/<slug>.webp, 1200×675) from the same art as the
// animated covers (src/utils/blogCover.js). They are used for link previews (Open Graph / X cards) and the
// article image in search results. Run after adding a post:  node scripts/blog-covers.mjs
// Needs Playwright (npm i -D playwright, or a global install) and Python 3 with Pillow for the .webp step.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { coverSvg } from '../src/utils/blogCover.js';
import { BLOG_META } from '../src/data/blogs/meta.js';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright')); }

const css = readFileSync(new URL('../src/styles/v30-blogcover.css', import.meta.url), 'utf8');
const tmp = mkdtempSync(join(tmpdir(), 'covers-'));
const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
for (const { slug } of BLOG_META) {
  await page.setContent(`<!doctype html><style>html,body{margin:0}${css}.bc{width:1200px;height:675px;aspect-ratio:auto}</style><span class="bc">${coverSvg(slug)}</span>`);
  const png = join(tmp, `${slug}.png`);
  await page.screenshot({ path: png });
  const out = new URL(`../public/images/blog/${slug}.webp`, import.meta.url).pathname;
  execFileSync('python3', ['-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],"WEBP",quality=82,method=6)', png, out]);
  process.stdout.write('.');
}
await browser.close();
writeFileSync(join(tmp, 'done'), '');
console.log(`\n${BLOG_META.length} covers written to public/images/blog/`);
