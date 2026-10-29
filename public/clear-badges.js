'use strict';
const CLEAR_BADGE_LABELS=['NO CLEAR','CLEAR','FULL COMBO','ALL PERFECT'];
function earnedClearBadge(judges,total,failed=false){
 if(failed||!Number.isInteger(total)||total<=0||!Array.isArray(judges)||judges.length!==5||judges.some(n=>!Number.isInteger(n)||n<0)||judges.reduce((a,b)=>a+b,0)!==total)return 0;
 return judges[0]===total?3:judges[3]+judges[4]===0?2:1;
}
function badgeRecordKey(chartId,mode,arrangement,scope='guest'){
 return 'pulse-clear-v1:'+scope+':'+chartId+':'+mode+':'+arrangement;
}
function readClearBadge(storage,key){try{const n=Number(storage.getItem(key));return Number.isInteger(n)&&n>=0&&n<=3?n:0}catch{return 0}}
function saveClearBadge(storage,key,value){const best=Math.max(readClearBadge(storage,key),value);try{storage.setItem(key,String(best))}catch{}return best}
