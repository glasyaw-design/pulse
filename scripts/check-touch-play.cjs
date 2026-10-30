const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'../public')+'/';
const html=fs.readFileSync(root+'index.html','utf8'), els=new Map();
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
function el(sel){if(els.has(sel))return els.get(sel);const o={dataset:{},style:{setProperty(){}},classList:{contains(){return false},toggle(){},add(){},remove(){}},value:'',textContent:'',innerHTML:'',hidden:false,open:false,clientWidth:400,clientHeight:600,append(){},addEventListener(){},setAttribute(){},getContext:()=>ctx,getBoundingClientRect:()=>({width:400,height:600}),querySelector:s=>el(s),querySelectorAll:()=>[],showModal(){this.open=true},close(){this.open=false},scrollIntoView(){},focus(){}};els.set(sel,o);return o;}
const storage=new Map(),handlers=new Map();
const sandbox={console,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},AbortSignal,AbortController,performance:{now:()=>0},crypto:require('crypto').webcrypto,Uint32Array,Float32Array,Math,URLSearchParams,URL,fetch:async()=>({ok:false,status:503,json:async()=>({error:'offline'})}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{protocol:'http:',href:'http://localhost/'},document:{createElement:s=>el('new-'+s),documentElement:el('root'),body:el('body'),querySelector:s=>{if(/^#[\w-]+$/.test(s)&&!html.includes('id="'+s.slice(1)+'"'))return null;if(s==='dialog[open]')return [...els.values()].find(x=>x.open)||null;return el(s)},querySelectorAll:()=>[],addEventListener:(type,fn)=>handlers.set(type,fn)},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},ResizeObserver:class{observe(){}},devicePixelRatio:1,window:{addEventListener(){},dispatchEvent(){}}};sandbox.window.window=sandbox.window;
let previewAudio;
sandbox.Audio=class{constructor(){previewAudio=this;this.duration=120;this.currentTime=0}async play(){this.onloadedmetadata?.()}pause(){this.paused=true}removeAttribute(){}load(){}};
const c=vm.createContext(sandbox);
(async()=>{
for(const m of html.matchAll(/<script src="([^"]+)"/g)){const f=m[1].split('?')[0];vm.runInContext(fs.readFileSync(root+f,'utf8'),c,{filename:f});}
el('#accountGuest').onclick();
const run=code=>vm.runInContext(code,c);
sandbox.window.PulseRanking=null;
sandbox.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});
run("initAudio=async()=>{ctxAudio={currentTime:0,decodeAudioData:async()=>({duration:123})}};playMusic=()=>{};stopMusic=()=>{};keysEnabled=true;loadKeys=async()=>{throw Error('keys unavailable')}");
await run('start()');assert.equal(run('state'),'playing');assert.equal(run('keysEnabled'),false);assert(run('musicBuffer!==null'));run("state='idle'");console.log('PASS: keysound failure falls back to full music');
let resume;sandbox.pendingInit=new Promise(r=>resume=r);
run("keysEnabled=false;initAudio=async()=>{await pendingInit;ctxAudio={currentTime:0}};");
const pending=run('start()');assert.equal(run('state'),'loading');sandbox.document.hidden=true;handlers.get('visibilitychange')();resume();await pending;assert.equal(run('state'),'paused');sandbox.document.hidden=false;console.log('PASS: hidden tab loading waits paused');
run("sessionAuto=false;state='playing';keyCount=5;held=Array(5).fill(false);held[0]=true;ctxAudio={currentTime:10.5};startAt=0;sessionOffset=0;life=100;failPending=false;judges=[0,0,0,0,0];combo=earned=0;timingSamples=[];keyPlayer=null;notes=[{time:10,lane:0,dur:1,status:1}];initAudio=async()=>{};");
await run('togglePause()');await run('togglePause()');assert.equal(run('state'),'paused');run('press(0)');await run('togglePause()');assert.equal(run('state'),'playing');run('updateGame(11.2,1000)');assert.equal(run('judges[3]'),0);assert.equal(run('judges[0]'),1);console.log('PASS: active hold requires reacquisition and completes without MISS');

run("state='idle';bufferId='';initAudio=async()=>{};");let releaseFetch;sandbox.fetch=()=>new Promise(r=>releaseFetch=r);
const cancelled=run('start()');await Promise.resolve();run('cancelLoading()');await cancelled;assert.equal(run('state'),'idle');releaseFetch({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});await Promise.resolve();assert.equal(run('state'),'idle');console.log('PASS: cancellation unlocks and late completion cannot start');
run("continueInBackground=true;savePrefs();continueInBackground=false;loadPrefs()");assert.equal(run('continueInBackground'),true);
run("state='playing';sessionAuto=false;held[0]=true");run('handleFocusLoss()');assert.equal(run('state'),'playing');assert.equal(run('held.some(Boolean)'),false);
sandbox.document.hidden=true;run("state='loading';loadingBlurred=false;handleFocusLoss()");assert.equal(run('loadingBlurred'),false);
run("state='playing';sessionAuto=false;ctxAudio={currentTime:3};startAt=0;notes=[{time:1,lane:0,dur:0,status:0}];judges=[0,0,0,0,0];life=100;failPending=false;keyPlayer=null;backgroundTick()");assert.equal(run('judges[4]'),1);
run("state='idle';bufferId=tracks[selected].id;initAudio=async()=>{};keysEnabled=false");await run('start()');assert.equal(run('state'),'playing');
run("continueInBackground=false;state='playing';handleFocusLoss()");assert.equal(run('state'),'paused');sandbox.document.hidden=false;
console.log('PASS: background preference persists, focus loss clears held keys without pause, hidden loading starts, background tick judges missed notes, default pause retained');

el('#game').getBoundingClientRect=()=>({left:100,width:400,height:600});
const finger=(id,x)=>({pointerId:id,clientX:x,pointerType:'touch',timeStamp:0,preventDefault(){}});
run("state='playing';sessionAuto=false;keyCount=5;held=Array(5).fill(false);resetInputState();ctxAudio={currentTime:10};startAt=0;sessionOffset=0;failPending=false;life=100;judges=[0,0,0,0,0];notes=[{time:10,lane:0,dur:1,status:0},{time:10,lane:4,dur:0,status:0}];keyPlayer=null");
el('#game').onpointerdown(finger(1,110));el('#game').onpointerdown(finger(2,490));
assert.equal(run('judges[0]'),2);assert.equal(run('held[0]&&held[4]'),true);
el('#game').onpointerup(finger(2,490));assert.equal(run('held[0]'),true);
run('ctxAudio.currentTime=11');el('#game').onpointerup(finger(1,490));assert.equal(run('judges[0]'),3);assert.equal(run('held.some(Boolean)'),false);
for(const count of [4,5,6,7,8]){
 run('keyCount='+count+';held=Array(keyCount).fill(false);notes=[];resetInputState()');
 for(let i=0;i<count;i++){el('#game').onpointerdown(finger(i+10,109+(i+.5)*382/count));assert.equal(run('inputOwners.get("pointer:'+ (i+10)+'")'),i)}
 el('#game').onpointercancel(finger(10,0));assert.equal(run('held[0]'),false);
 el('#game').onlostpointercapture(finger(11,0));assert.equal(run('held[1]'),false);
 run('resetInputState()');assert.equal(run('inputOwners.size'),0);
}
run('keyCount=5;held=Array(5).fill(false);notes=[]');
el('#game').onpointerdown(finger(1,110));el('#game').onpointerdown(finger(2,110));
el('#game').onpointerup(finger(1,110));assert.equal(run('held[0]'),true);
el('#game').onpointerup(finger(2,110));assert.equal(run('held[0]'),false);
console.log('PASS: direct lane multitouch, real hold judgement, drift-safe release, all key modes, cancellation and duplicate lane ownership');
sandbox.setTimeout=fn=>{queueMicrotask(fn);return 1};
await assert.rejects(run('bounded(new Promise(()=>{}),null,1)'),/load_timeout/);console.log('PASS: stalled request deadline');
})().catch(e=>{console.error(e);process.exitCode=1});
