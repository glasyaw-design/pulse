const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../public');
const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'keysounds.js'),'utf8')+';globalThis.Player=KeySoundPlayer',c);
function fixture(auto){const starts=[],nodes=[];const ctx={currentTime:.9,createBufferSource(){const src={connect(){},disconnect(){},stop(){this.stopped=true},start(at,offset,duration){starts.push({at,offset,duration})}};nodes.push(src);return src},createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}}};const p=new c.Player(ctx,{},{});p.autoPlay=auto;const n={time:1};p.prepare([n],{duration:3});return {ctx,p,n,starts,nodes}}
for(const delay of [0,.0083,.0167,.05,.25]){
 const f=fixture(true);f.p.schedule(.9,0);f.ctx.currentTime=1+delay;f.p.play(f.n,0);assert.equal(f.starts.length,2);assert.deepEqual(f.starts[0],f.starts[1]);f.p.stop();assert(f.nodes.every(n=>n.stopped));
 const m=fixture(false);m.p.schedule(.9,0);m.ctx.currentTime=1+delay;m.p.play(m.n,0);assert.equal(m.starts.length,2);assert(Math.abs(m.starts[1].offset-m.starts[1].at)<1e-9);m.p.play(m.n,0);assert.equal(m.starts.length,2);
}
const late=fixture(true);late.ctx.currentTime=1.1;late.p.schedule(1.1,0);assert.deepEqual(late.starts[0],late.starts[1]);assert.equal(late.starts[0].offset,1.1);
const paused=fixture(true);paused.p.schedule(.9,0);paused.p.stop();paused.ctx.currentTime=5;paused.p.reset(1.1);paused.p.schedule(1.1,3.9);assert.deepEqual(paused.starts[2],paused.starts[3]);assert.equal(paused.starts[2].at,5);
const early=fixture(false);early.ctx.currentTime=.95;early.p.play(early.n,0);assert.equal(early.starts[0].at,1);assert.equal(early.starts[0].offset,1);
console.log('PASS: AUTO paired scheduling, delayed manual phase alignment, deduplication, pause/resume, late scheduler and early inputs');
// Exercise the browser sprite-cache branch with a recording canvas.
let paints=0;const drawCtx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
const v=vm.createContext({HTMLCanvasElement:class{},devicePixelRatio:2,document:{createElement(){paints++;return {getContext:()=>drawCtx}}}});vm.runInContext(fs.readFileSync(path.join(root,'visuals.js'),'utf8'),v);v.ctx=drawCtx;
for(const skin of ['BAR','CIRCLE','DIAMOND']){for(let i=0;i<100;i++)vm.runInContext(`paintNoteHead(ctx,0,20,54,'#6fd5ff','${skin}')`,v)}assert.equal(paints,3);console.log('PASS: 300 note draws reuse 3 cached sprites');
