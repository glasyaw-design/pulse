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

for(const m of html.matchAll(/<script src="([^"]+)"/g)){const f=m[1].split('?')[0];vm.runInContext(fs.readFileSync(root+f,'utf8'),c,{filename:f});}
const run=code=>vm.runInContext(code,c);el('#accountGuest').onclick();
for(const hz of [60,120,144,165,240])for(const cap of [0,60,120,144,165,240]){
 c.hz=hz;c.cap=cap;const count=run(`(()=>{const p=new FramePacer();let n=0;for(let i=0;i<hz*10;i++)if(p.shouldDraw(i*1000/hz,cap)){n++;p.rendered(i*1000/hz)}return n})()`);
 assert(Math.abs(count-(cap?Math.min(hz,cap):hz)*10)<=2,JSON.stringify({hz,cap,count}));
}
console.log('PASS: 30 refresh-rate/cap combinations over 10 seconds');
run("frameLimit=60;framePacer.reset();showFPS=true;state='playing';sessionAuto=false;notes=[];keyPlayer=null;ctxAudio={currentTime:0};startAt=0;var simCalls=0;var oldUpdate=updateGame;updateGame=(...args)=>{simCalls++;return oldUpdate(...args)};");
for(let i=0;i<240;i++)run('ctxAudio.currentTime='+i/240+';draw('+i*1000/240+')');assert.equal(run('simCalls'),240);assert(/FPS 60/.test(el('#fpsDisplay').textContent));
console.log('PASS: 60 FPS drawing still runs 240 simulation/audio updates on 240 callbacks');
el('#frameLimit').onchange({target:{value:'144'}});el('#showFPS').onchange({target:{checked:true}});run('frameLimit=0;showFPS=false;loadPrefs();syncFrameSettings()');assert.equal(run('frameLimit'),144);assert.equal(run('showFPS'),true);assert.equal(el('#fpsDisplay').hidden,false);
console.log('PASS: frame preferences persist and FPS toggle reflects setting');
