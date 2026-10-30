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
sandbox.setTimeout=fn=>{queueMicrotask(fn);return 1};
await assert.rejects(run('bounded(new Promise(()=>{}),null,1)'),/load_timeout/);console.log('PASS: stalled request deadline');
})().catch(e=>{console.error(e);process.exitCode=1});
