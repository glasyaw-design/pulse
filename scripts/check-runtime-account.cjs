const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'../public')+'/';
const html=fs.readFileSync(root+'index.html','utf8'), els=new Map();
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
function el(sel){if(els.has(sel))return els.get(sel);const o={dataset:{},style:{setProperty(){}},classList:{contains(){return false},toggle(){},add(){},remove(){}},value:'',textContent:'',innerHTML:'',hidden:false,open:false,clientWidth:400,clientHeight:600,append(){},addEventListener(){},setAttribute(){},getContext:()=>ctx,getBoundingClientRect:()=>({width:400,height:600}),querySelector:s=>el(s),querySelectorAll:()=>[],showModal(){this.open=true},close(){this.open=false},scrollIntoView(){},focus(){}};els.set(sel,o);return o;}
const storage=new Map();
const sandbox={console,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},AbortSignal,performance:{now:()=>0},crypto:require('crypto').webcrypto,Uint32Array,Float32Array,Math,URLSearchParams,URL,fetch:async()=>({ok:false,status:503,json:async()=>({error:'offline'})}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{protocol:'http:',href:'http://localhost/'},document:{createElement:s=>el('new-'+s),documentElement:el('root'),body:el('body'),querySelector:s=>{if(/^#[\w-]+$/.test(s)&&!html.includes('id="'+s.slice(1)+'"'))return null;if(s==='dialog[open]')return [...els.values()].find(x=>x.open)||null;return el(s)},querySelectorAll:()=>[],addEventListener(){}},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},ResizeObserver:class{observe(){}},devicePixelRatio:1,window:{addEventListener(){},dispatchEvent(){}}};sandbox.window.window=sandbox.window;
let previewAudio;
sandbox.Audio=class{constructor(){previewAudio=this;this.duration=120;this.currentTime=0}async play(){this.onloadedmetadata?.()}pause(){this.paused=true}removeAttribute(){}load(){}};
const c=vm.createContext(sandbox);
(async()=>{
for(const m of html.matchAll(/<script src="([^"]+)"/g)){let f=m[1].split('?')[0];vm.runInContext((process.env.OLD_VISUALS&&f==='visuals.js'?fs.readFileSync('/workspace/scratch/21984a7cdd72/baseline/visuals.js','utf8'):fs.readFileSync(root+f,'utf8')),c,{filename:f});}
assert.equal(el('#accountDialog').open,true);
assert.equal(sandbox.window.PulseAccount.ready(),false);
el('#accountGuest').onclick();
assert.equal(sandbox.window.PulseAccount.ready(),true);assert.equal(sandbox.window.PulseAccount.isMember(),false);
assert.equal(el('#accountDialog').open,false);
vm.runInContext("var assertAlt=validBindings(['AltLeft','AltRight','KeyJ','KeyK'],4)",c);
assert.equal(c.assertAlt,true);
assert.equal(typeof el('#openSettings').onclick,'function');
await el('#openSettings').onclick();assert.equal(el('#settingsDialog').open,true);el('#closeSettings').onclick();assert.equal(el('#settingsDialog').open,false);
for(const k of [4,5,6,8])vm.runInContext('setKeyMode('+k+');refresh();draw(100)',c);
vm.runInContext("initAudio=async()=>{ctxAudio={currentTime:0,decodeAudioData:async()=>({duration:123})}};loadKeys=async()=>{};playMusic=()=>{};stopMusic=()=>{};keysEnabled=false;",c);
sandbox.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});
await vm.runInContext('toggleSongPreview()',c);assert.equal(el('#songPreview')['textContent'],'■ 미리듣기 중지');
vm.runInContext('selectTrack(1)',c);assert(previewAudio.paused);assert.equal(el('#songPreview').textContent,'▶ 12초 미리듣기');
await vm.runInContext('toggleSongPreview()',c);previewAudio.currentTime+=12;previewAudio.ontimeupdate();assert(previewAudio.paused);
console.log('PASS: preview toggle, song-change stop and 12-second stop (media mocked)');
for(let song=0;song<7;song++)for(const k of [4,5,6,8])for(let d=0;d<4;d++){
 vm.runInContext('state="idle";selected='+song+';setKeyMode('+k+');diff='+d,c);
 await vm.runInContext('start()',c);
 assert.equal(vm.runInContext('state',c),'playing');
 assert(vm.runInContext('notes.length',c)>0);
 vm.runInContext('draw(100);press(0);release(0)',c);
 await vm.runInContext('togglePause()',c);assert.equal(vm.runInContext('state',c),'paused');
}
console.log('PASS: 112 chart starts, draw/input/pause (audio mocked)');
console.log('PASS full HTML script boot, settings open/close, all key modes refresh');
})().catch(e=>{console.error(e);process.exitCode=1});
