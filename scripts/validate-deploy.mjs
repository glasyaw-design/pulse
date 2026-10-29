import { existsSync,readFileSync } from 'node:fs';
for(const file of ['public/index.html','public/game.js','public/visuals.js','public/keysounds.js','public/rankings.js','public/tracks.js','netlify/functions/ranking.mjs','netlify/lib/ranking.mjs','netlify/lib/rank-catalog.mjs'])if(!existsSync(file))throw Error('Missing '+file);
const html=readFileSync('public/index.html','utf8');for(const match of html.matchAll(/<script src="([^"]+)"/g))if(!existsSync('public/'+match[1].split(/[?#]/)[0]))throw Error('Missing script '+match[1]);
console.log('PULSE FIVE static assets and Netlify ranking function are ready.');
