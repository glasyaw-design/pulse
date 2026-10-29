const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../public/chart-insights.js'),'utf8'),c);
assert.equal(vm.runInContext('chartProfile([[2,0,0],[2,1,0],[3,0,1]],20).chords',c),1);
assert.equal(vm.runInContext('chartProfile([[2,0,0],[2,1,0],[3,0,1]],20).holds',c),1);
assert.equal(vm.runInContext('sessionInsight([],120)',c),null);
assert.equal(vm.runInContext('sessionInsight(Array.from({length:6},(_,i)=>({time:i+10,dur:0,headJudge:3})),120).start',c),10);
assert.equal(vm.runInContext('sessionInsight(Array.from({length:6},(_,i)=>({time:i,dur:0,headJudge:0})),120).lost',c),0);
assert.equal(vm.runInContext('sessionInsight(Array.from({length:6},(_,i)=>({time:i,dur:12,headJudge:0,tailJudge:3})),120).start',c),10);
console.log('PASS density/chord counts, unplayed-note exclusion, weak section, all perfect, hold tails');
