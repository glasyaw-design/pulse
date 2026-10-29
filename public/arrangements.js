'use strict';
const ARRANGEMENT_MODES=['NORMAL','MIRROR','RANDOM'];
function createLaneMap(mode,seed=0,keyCount=5){
 if(mode==='MIRROR')return Array.from({length:keyCount},(_,i)=>keyCount-1-i);
 const map=Array.from({length:keyCount},(_,i)=>i);if(mode!=='RANDOM')return map;
 let value=(seed>>>0)||0x9e3779b9;
 const next=()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return (value>>>0)/4294967296};
 for(let i=keyCount-1;i>0;i--){const j=Math.floor(next()*(i+1));[map[i],map[j]]=[map[j],map[i]]}
 if(map.every((x,i)=>x===i)||map.every((x,i)=>x===keyCount-1-i))[map[0],map[1]]=[map[1],map[0]];
 return map;
}
function transformChart(source,mode,seed=0,keyCount=5){const map=createLaneMap(mode,seed,keyCount);return source.map(([time,lane,dur,pitch,kind])=>[time,map[lane],dur,pitch,kind]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])}
function newArrangementSeed(){return Math.floor(Math.random()*4294967296)>>>0}
function seedLabel(seed){return (seed>>>0).toString(16).toUpperCase().padStart(8,'0')}
