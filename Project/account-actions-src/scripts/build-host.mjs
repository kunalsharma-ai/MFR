// Build the page for the member site → web/public/member/account-actions/ (index.html + assets/)
// Run:  node scripts/build-host.mjs <output dir>
import * as esbuild from 'esbuild';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { common, fontsLink } from './shared.mjs';

const out = path.resolve(process.argv[2] || 'dist-host');
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'assets'), { recursive: true });

const r = await esbuild.build({
  ...common,
  entryPoints: { app: 'src/main.host.jsx' },
  outdir: path.join(out, 'assets'),
  entryNames: '[name]-[hash]',
  assetNames: '[name]-[hash]',
  publicPath: './assets', // images are written as ./assets/<file>: relative to index.html
  minify: true,
  sourcemap: false,
  metafile: true,
  define: { 'process.env.NODE_ENV': '"production"' },
});
const files = Object.keys(r.metafile.outputs).map((f) => path.basename(f));
const js = files.find((f) => /^app-.*\.js$/.test(f));
const css = files.find((f) => /^app-.*\.css$/.test(f));

await writeFile(path.join(out, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Delete or Deactivate My Account | MyFrequentRewards</title>
<meta name="robots" content="noindex, nofollow">
${fontsLink}
${css ? `<link rel="stylesheet" href="./assets/${css}">` : ''}
<style>html,body{margin:0}</style>
<script>try{var t=new URLSearchParams(location.search).get('theme');document.documentElement.style.background=t==='dark'?'#050B2C':'#FFFFFF'}catch(e){}</script>
</head>
<body>
<div id="mfr-account-actions"></div>
<script src="./assets/${js}" defer></script>
</body>
</html>
`);
console.log('built', out, files.join(' '));
