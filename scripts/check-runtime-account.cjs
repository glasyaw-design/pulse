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
for(const k of [4,5,6,7,8])vm.runInContext('setKeyMode('+k+');refresh();draw(100)',c);
vm.runInContext("initAudio=async()=>{ctxAudio={currentTime:0,decodeAudioData:async()=>({duration:123})}};loadKeys=async()=>{};playMusic=()=>{};stopMusic=()=>{};keysEnabled=false;",c);
sandbox.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});
await vm.runInContext('toggleSongPreview()',c);assert.equal(el('#songPreview')['textContent'],'■ 미리듣기 중지');
vm.runInContext('selectTrack(1)',c);assert(previewAudio.paused);assert.equal(el('#songPreview').textContent,'▶ 12초 미리듣기');
await vm.runInContext('toggleSongPreview()',c);previewAudio.currentTime+=12;previewAudio.ontimeupdate();assert(previewAudio.paused);
console.log('PASS: preview toggle, song-change stop and 12-second stop (media mocked)');
for(let song=0;song<vm.runInContext("tracks.length",c);song++)for(const k of [4,5,6,7,8])for(let d=0;d<4;d++){
 vm.runInContext('state="idle";selected='+song+';setKeyMode('+k+');diff='+d,c);
 await vm.runInContext('start()',c);
 assert.equal(vm.runInContext('state',c),'playing');
 assert(vm.runInContext('notes.length',c)>0);
 vm.runInContext('draw(100);press(0);release(0)',c);
 await vm.runInContext('togglePause()',c);assert.equal(vm.runInContext('state',c),'paused');
}
console.log('PASS: '+vm.runInContext('tracks.length',c)*20+' chart starts, draw/input/pause (audio mocked)');
// Regression: event creation time, delayed dispatch, tail release, repeat and resume boundaries.
sandbox.performance.now=()=>1000;sandbox.performance.timeOrigin=1700000000000;
const run=code=>vm.runInContext(code,c);
const fixture=()=>run("state='playing';keyCount=5;held=Array(5).fill(false);ctxAudio={currentTime:10.060};startAt=0;sessionOffset=0;sessionJudgeMode='STANDARD';life=100;failPending=false;inputEpoch=0;judges=[0,0,0,0,0];combo=earned=0;timingSamples=[];keyPlayer=null;notes=[{time:10,lane:0,dur:0,status:0}]");
fixture();run('press(0,{timeStamp:940})');assert.equal(run('judges[0]'),1);assert(Math.abs(run('timingSamples[0]'))<.0001);
run('press(0,{timeStamp:940,repeat:true})');assert.equal(run('judges.reduce((a,b)=>a+b,0)'),1);
fixture();run('press(0,{timeStamp:1700000000940})');assert.equal(run('judges[0]'),1);
fixture();run('ctxAudio.currentTime=10.2;updateGame(10.2,1000)');assert.equal(run('notes[0].status'),0);run('press(0,{timeStamp:940})');assert.equal(run('judges[3]'),1); // 140ms MISS, never widened to GOOD
fixture();run('ctxAudio.currentTime=10.24;updateGame(10.24,1000)');assert.equal(run('judges[4]'),1);
fixture();run('press(0,{timeStamp:800})');assert.equal(run('held[0]'),false);assert.equal(run('notes[0].status'),0);
fixture();run('notes[0].dur=1;notes[0].status=1;held[0]=true;ctxAudio.currentTime=10.94;release(0,{timeStamp:940})');assert.equal(run('judges[3]'),1); // actual release 10.88, before 10.90 tail threshold
fixture();run('notes[0].dur=1;notes[0].status=1;held[0]=true;ctxAudio.currentTime=10.98;release(0,{timeStamp:940});release(0,{timeStamp:940})');assert.equal(run('judges[0]'),1);
fixture();await run('togglePause()');assert.equal(run('held.some(Boolean)'),false);assert.equal(run('state'), 'paused');
run("state='playing';resetInputState();press(0,{timeStamp:990})");assert.equal(run('held[0]'),false);
run('held[0]=true;release(0,{timeStamp:990})');assert.equal(run('held[0]'),true);
assert.equal(run('inputEventTime({timeStamp:NaN},1000)'),1000);assert.equal(run('inputEventTime({timeStamp:2000},1000)'),1000);
console.log('PASS: delayed/epoch timestamps, repeat rejection, unchanged judgement windows, stale event rejection, hold tails, pause reset');

// Real keyboard handlers: auxiliary keys are independent press edges but share hold ownership.
const event=(code,extra={})=>({code,timeStamp:1000,preventDefault(){},...extra});
const down=(code,extra)=>handlers.get('keydown')(event(code,extra));
const up=(code,extra)=>handlers.get('keyup')(event(code,extra));
const auxFixture=()=>{fixture();run("keyCount=5;bindings=MODE_BINDINGS[5].slice();fiveAuxBindings=DEFAULT_FIVE_AUX.slice();inputOwners.clear();ctxAudio.currentTime=10;notes=[{time:10,lane:2,dur:0,status:0},{time:10.25,lane:2,dur:0,status:0}]")};
auxFixture();down('KeyG');assert.equal(run('judges[0]'),1);down('KeyG',{repeat:true});assert.equal(run('judges[0]'),1);
run('ctxAudio.currentTime=10.25');down('KeyH');assert.equal(run('judges[0]'),2);up('KeyG');assert.equal(run('held[2]'),true);up('KeyH');assert.equal(run('held[2]'),false);
auxFixture();run('notes=[{time:10,lane:2,dur:0,status:0}]');down('KeyG');down('KeyH');assert.equal(run('judges[0]'),1);
auxFixture();run('notes=[{time:10,lane:2,dur:1,status:0}]');down('Space');run('ctxAudio.currentTime=10.4');down('KeyH');up('Space');assert.equal(run('notes[0].status'),1);assert.equal(run('held[2]'),true);run('ctxAudio.currentTime=10.95');up('KeyH');assert.equal(run('judges[0]'),2);assert.equal(run('judges[3]'),0);
auxFixture();run('notes=[{time:10,lane:2,dur:1,status:0}]');down('KeyG');run("press(2,{timeStamp:1000},'pointer:7')");up('KeyG');assert.equal(run('held[2]'),true);run("ctxAudio.currentTime=10.95;release(2,{timeStamp:1000},'pointer:7')");assert.equal(run('held[2]'),false);assert.equal(run('judges[0]'),2);
auxFixture();down('KeyG');await run('togglePause()');assert.equal(run('inputOwners.size'),0);assert.equal(run('held.some(Boolean)'),false);
run("auxRemapping=0");assert.equal(run("assignFiveAux('KeyD')"),false);assert.equal(run("assignFiveAux('AltLeft')"),true);assert.equal(run("resolveInputLane('AltLeft',5,bindings,fiveAuxBindings)"),2);assert.equal(run("resolveInputLane('KeyG',7,MODE_BINDINGS[7],DEFAULT_FIVE_AUX)"),3);
assert.equal(JSON.parse(storage.get('pulse-prefs-v4')).fiveAuxBindings[0],'AltLeft');run("fiveAuxBindings=DEFAULT_FIVE_AUX.slice();loadPrefs()");assert.equal(run('fiveAuxBindings[0]'),'AltLeft');
run("state='idle';setKeyMode(4)");for(const count of [5,6,7,8,4]){down('Tab');assert.equal(run('keyCount'),count)}down('Tab',{shiftKey:true});assert.equal(run('keyCount'),8);
el('#settingsDialog').open=true;down('Tab');assert.equal(run('keyCount'),8);el('#settingsDialog').open=false;run("state='playing'");down('Tab');assert.equal(run('keyCount'),8);
run("state='idle';setKeyMode(7)");assert.equal(run('bindings.length'),7);assert.equal(run("bindings[3]"),'Space');assert.equal(el('#fiveAuxPanel').hidden,false);
for(const count of [4,5,6,7,8])for(const skin of ['BAR','CIRCLE','DIAMOND']){
 run('state="idle";setKeyMode('+count+');noteSkin="'+skin+'";draw(1000)');el('#settingsDialog').open=true;run('drawVisualPreview(1000)');el('#settingsDialog').open=false;
}
assert.equal(run("holdStemWidth(60,'CIRCLE')"),39.6);assert(run("NOTE_SKINS.includes('DIAMOND')"));
for(const count of [4,5,6,7,8])for(const mode of ['NORMAL','MIRROR','RANDOM']){
 const mapping=JSON.parse(run('JSON.stringify(createLaneMap("'+mode+'",123456,'+count+'))'));
 assert.deepEqual(mapping.slice().sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i));
 if(mode==='MIRROR'&&count===7)assert.equal(mapping[3],3);
}
run("state='idle';setKeyMode(7);sevenAuxBindings=DEFAULT_FIVE_AUX.slice();renderBindings()");assert.equal(run("$('#fiveAuxPanel').hidden"),false);
fixture();run("keyCount=7;bindings=MODE_BINDINGS[7].slice();sevenAuxBindings=DEFAULT_FIVE_AUX.slice();inputOwners.clear();ctxAudio.currentTime=10;notes=[{time:10,lane:3,dur:1,status:0}]");down('KeyG');run('ctxAudio.currentTime=10.4');down('KeyH');up('KeyG');assert.equal(run('held[3]'),true);run('ctxAudio.currentTime=10.95');up('KeyH');assert.equal(run('judges[0]'),2);
run("auxRemapping=0;assignFiveAux('AltLeft');savePrefs();sevenAuxBindings=[null,null];loadPrefs()");assert.equal(run('sevenAuxBindings[0]'),'AltLeft');
console.log('PASS: auxiliary alternating taps, repeat/single-note deduplication, shared keyboard/pointer holds, pause reset, remap collision/Alt/persistence, Tab cycling/modal guards, 7KEY and all skins');

let autoBegins=0,autoSubmits=0;sandbox.window.PulseRanking={beginRun:async()=>{autoBegins++;return {}},submit:async()=>{autoSubmits++}};
run("state='idle';autoMode=true");await run('start()');assert.equal(autoBegins,0);assert.equal(run('sessionAuto'),true);
run("notes=[{time:1,lane:0,dur:0,status:0},{time:2,lane:3,dur:1,status:0}];totalJudgements=3;updateGame(2.1,2100)");assert.equal(run('judges[0]'),2);assert.equal(run('held[3]'),true);run('updateGame(3.1,3100)');assert.equal(run('judges[0]'),3);assert.equal(run('held[3]'),false);
const beforeAutoRecords=JSON.stringify([...storage]);run('finish()');await run('submitRanking()');assert.equal(autoSubmits,0);assert.equal(JSON.stringify([...storage]),beforeAutoRecords);assert.match(el('#resultMode').textContent,/AUTO/);
console.log('PASS AUTO: taps/holds, no ranking begin/submit, no local best/badge writes');
console.log('PASS full HTML script boot, settings open/close, all key modes refresh');
})().catch(e=>{console.error(e);process.exitCode=1});
