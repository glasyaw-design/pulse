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
el('#accountGuest').onclick();const run=code=>vm.runInContext(code,c);
run(`function testEntireChart(song,k,d){
 state='idle';selected=song;setKeyMode(k);diff=d;sessionAuto=false;state='playing';keyPlayer=null;ctxAudio={currentTime:0};startAt=0;sessionOffset=0;sessionJudgeMode='STANDARD';sessionFailed=false;failPending=false;life=100;judges=[0,0,0,0,0];combo=earned=maxCombo=0;timingSamples=[];resetInputState();
 notes=chart('NORMAL',0);totalJudgements=notes.length+notes.filter(n=>n.dur>0).length;
 const events=[];for(const n of notes){events.push({time:n.time,lane:n.lane,type:'down'});events.push({time:n.time+(n.dur||.001),lane:n.lane,type:'up'})}events.sort((a,b)=>a.time-b.time||(a.type==='up'?-1:1));
 for(const e of events){ctxAudio.currentTime=e.time;if(e.type==='up')release(e.lane);else press(e.lane)}
 return {song:tracks[song].name,k,d,judges,total:totalJudgements,remaining:notes.filter(n=>n.status!==2).length};
}`);
let count=0;for(let song=0;song<run('tracks.length');song++)for(const k of [4,5,6,7,8])for(let d=0;d<4;d++){
 const result=run(`testEntireChart(${song},${k},${d})`);assert.equal(result.judges[0],result.total,JSON.stringify(result));assert.equal(result.remaining,0);count++;
}
console.log('PASS: '+count+' complete charts through manual press/release paths, all heads/tails accounted for, zero unexpected MISS/FAIL (audio mocked)');
