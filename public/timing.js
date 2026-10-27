'use strict';
// EZ2ON-inspired mode separation; these are PULSE's own complete presets.
const JUDGE_PRESETS={BASIC:{perfect:40,great:80,good:140,miss:180,missDamage:2.5,failDamage:3,holdDamage:1.5,recovery:.35},STANDARD:{perfect:22,great:55,good:110,miss:150,missDamage:4,failDamage:5,holdDamage:2,recovery:.22}};
function classifyTiming(ms,mode='STANDARD'){const w=JUDGE_PRESETS[mode],d=Math.abs(ms)+1e-8;return d<=w.perfect+1e-7?0:d<=w.great+1e-7?1:d<=w.good+1e-7?2:d<=w.miss+1e-7?3:4}
function summarizeTiming(samples){
 const median=a=>{const s=a.slice().sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2};
 if(!samples.length)return null;
 const mid=median(samples),mad=median(samples.map(x=>Math.abs(x-mid))),clean=samples.filter(x=>Math.abs(x-mid)<=Math.max(12,mad*3));
 return {median:median(clean),spread:Math.sqrt(clean.reduce((s,x)=>s+(x-median(clean))**2,0)/clean.length),count:samples.length,fast:samples.filter(x=>x< -5).length,slow:samples.filter(x=>x>5).length,center:samples.filter(x=>Math.abs(x)<=5).length};
}
function clampOffset(ms){return Math.max(-200,Math.min(200,Math.round(ms)))}
