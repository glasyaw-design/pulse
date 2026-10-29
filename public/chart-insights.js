'use strict';
function chartProfile(chart,duration){
 const bins=Array(80).fill(0),span=duration/80;
 for(const n of chart)bins[Math.min(79,Math.max(0,Math.floor(n[0]/span)))]++;
 const peak=Math.max(1,...bins),values=bins.map(n=>n/peak);
 let busiest=0;for(let i=1;i<bins.length;i++)if(bins[i]>bins[busiest])busiest=i;
 const groups=new Map();for(const n of chart)groups.set(n[0],(groups.get(n[0])||0)+1);
 return {values,peakAt:busiest*span,chords:[...groups.values()].filter(n=>n>1).length,holds:chart.filter(n=>n[2]>0).length};
}
function sessionInsight(notes,duration){
 const buckets=Array.from({length:Math.ceil(duration/10)},(_,i)=>({start:i*10,end:Math.min(duration,(i+1)*10),count:0,lost:0,miss:0}));
 for(const n of notes)for(const [q,time] of [[n.headJudge,n.time],[n.tailJudge,n.time+n.dur]]){
  if(!Number.isInteger(q))continue;const b=buckets[Math.min(buckets.length-1,Math.max(0,Math.floor(time/10)))];
  b.count++;b.lost+=1-([1,.75,.4,0,0][q]??0);if(q>=3)b.miss++;
 }
 return buckets.filter(b=>b.count>=5).sort((a,b)=>b.lost/b.count-a.lost/a.count||b.miss-a.miss)[0]||null;
}
