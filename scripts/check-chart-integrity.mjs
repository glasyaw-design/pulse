import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {RANK_CATALOG} from '../netlify/lib/rank-catalog.mjs';
const tracks=vm.runInNewContext(readFileSync(new URL('../public/tracks.js',import.meta.url),'utf8')+';TRACK_LIBRARY');
let checked=0;const ids=new Set();
for(const track of tracks)for(const keys of [4,5,6,7,8]){
 const mode=keys===5?track:track.keyModes[keys];let previousCount=0;
 for(let difficulty=0;difficulty<4;difficulty++){
  const chart=mode.charts[difficulty],id=mode.chartIds[difficulty],last=Array(keys).fill(null);
  assert(!ids.has(id),'Duplicate chart ID');ids.add(id);
  assert(chart.length>=previousCount,'Difficulty counts must increase');previousCount=chart.length;
  let total=0,previousTime=-1,previousLane=-1;
  for(const n of chart){
   const [time,lane,duration]=n;assert(Number.isFinite(time)&&Number.isFinite(duration)&&duration>=0);
   assert(Number.isInteger(lane)&&lane>=0&&lane<keys);assert(time>.5&&time+duration<track.duration-.5);
   assert(time>previousTime||time===previousTime&&lane>previousLane,'Unsorted or duplicate notes');previousTime=time;previousLane=lane;
   const prev=last[lane];assert(!prev||time-prev[0]-prev[2]>=.0949,'Overlapping/too-close lane notes');last[lane]=n;
   for(const segment of track.editSegments.slice(1))assert(!(time<segment.gameStart&&segment.gameStart<time+duration),'Hold crosses splice');
   total+=1+(duration>0?1:0);
  }
  const caps=keys===4?[5,8,12,16]:keys===5?[5,9,13,18]:keys===6?[5,10,15,20]:keys===7?[5,10,15,21]:[5,11,16,22];
  const halfCaps=keys===4?[3,5,7,9]:keys===5?[3,5,8,10]:keys===6||keys===7?[3,6,9,12]:[3,6,10,13];
  for(const [width,limit] of [[1,caps[difficulty]],[.5,halfCaps[difficulty]]]){
   let right=0;
   for(let left=0;left<chart.length;left++){
    while(right<chart.length&&chart[right][0]<chart[left][0]+width-1e-6)right++;
    assert(right-left<=limit,`Completed-chart density exceeded: ${id} at ${chart[left][0]}s (${width}s)`);
   }
  }
  if(keys===7){const center=chart.filter(n=>n[1]===3);for(let i=1;i<center.length;i++)assert(center[i][0]-center[i-1][0]>=[.26,.23,.20,.18][difficulty]-.0015,'7KEY thumb repeated too fast')}
  const spec=RANK_CATALOG[id];assert(spec,'Missing ranking chart');assert.equal(spec.total,total);assert.equal(spec.duration,track.duration);assert.equal(spec.keyCount,keys);checked++;
 }
}
assert.equal(checked,160);assert.equal(Object.keys(RANK_CATALOG).length,160);
console.log('PASS: 160 charts, unique IDs, lane/hold timing, splice boundaries, final density bounds and ranking totals.');
