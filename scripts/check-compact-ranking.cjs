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
el('#accountGuest').onclick();const rows=el('#rankingRows');rows.children=[];rows.replaceChildren=()=>rows.children=[];rows.append=n=>rows.children.push(n);
sandbox.document.createElement=()=>({children:[],textContent:'',append(n){this.children.push(n)}});
const requests=[];sandbox.fetch=async url=>{requests.push(String(url));return {ok:true,json:async()=>({total:1,entries:[{position:1,nickname:'Test',score:987654,accuracy:98.76,max_combo:100,mine:true}],mine:{position:1,score:987654,accuracy:98.76}})}};
await sandbox.window.PulseRanking.open({selected:8,diff:2,keyCount:7,judgeMode:'STANDARD',arrangement:'MIRROR'});
assert.equal(rows.children.length,1);assert.equal(rows.children[0].children.length,3);assert.equal(el('#rankTrackTitle').textContent,'A Little Further');assert.equal(el('#rankFilterDetails').open,false);assert.match(el('#rankContextLabel').textContent,/7KEY.*Hard.*Standard.*미러/);assert.equal(requests.length,1);assert(requests[0].includes('board?'));
el('#rankDifficulty').value='0';await el('#rankDifficulty').onchange();assert.match(el('#rankContextLabel').textContent,/Easy/);
console.log('PASS: compact 3-column board, selection context, collapsed filters, guest browsing without nickname prompt, condition changes');
})().catch(e=>{console.error(e);process.exitCode=1});
