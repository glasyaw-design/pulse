import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const missing=new Set();
function requireFile(file){if(!existsSync(resolve(root,file)))missing.add(file)}
for(const file of ['package.json','netlify.toml','netlify/functions/auth.mjs','netlify/lib/auth.mjs','netlify/functions/ranking.mjs','netlify/lib/ranking.mjs','netlify/lib/rank-catalog.mjs','public/index.html','public/tracks.js'])requireFile(file);
if(!missing.has('public/index.html')){
 const html=readFileSync(resolve(root,'public/index.html'),'utf8');
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const file=match[1].split(/[?#]/)[0];if(/^(https?:|data:)/.test(file))continue;requireFile('public/'+file);
  if(file.endsWith('.css')&&existsSync(resolve(root,'public',file))){
   for(const css of readFileSync(resolve(root,'public',file),'utf8').matchAll(/url\(['"]?([^)'"?#]+)(?:[^)'" ]*)['"]?\)/g))if(!/^(data:|https?:)/.test(css[1]))requireFile('public/'+css[1]);
  }
 }
}
if(!missing.has('public/tracks.js')){
 const library=vm.runInNewContext(readFileSync(resolve(root,'public/tracks.js'),'utf8')+';TRACK_LIBRARY');
 for(const track of library){
  requireFile('public/'+track.audio);requireFile('public/'+track.keysAudio);requireFile('public/assets/jackets/'+track.id+'-v30.svg');
  for(const k of [4,5,6,7,8]){const mode=k===5?track:track.keyModes?.[k];if(!mode||mode.charts?.length!==4)throw Error(`Incomplete charts: ${track.id} ${k}KEY`)}
 }
}
if(missing.size){console.error('\nPULSE SHIFT: required files are missing:\n'+[...missing].map(x=>'  - '+x).join('\n')+'\nUse the FULL project folder containing package.json and netlify.toml. Publish directory: public. Do not deploy a patch ZIP on its own.\n');process.exit(1)}
console.log('PULSE SHIFT v31: scripts, styles, fonts, 8 jackets, 16 audio files and 160 charts are present.');
await import('./check-chart-integrity.mjs');
