'use strict';
const $=s=>document.querySelector(s),tracks=TRACK_LIBRARY.map(t=>({...t}));
const DIFF=['EASY','NORMAL','HARD','EXPERT'],DIFF_KO=['쉬움','보통','어려움','최상급'];
const JUDGE_LABELS={BASIC:'Basic',STANDARD:'Standard'};
const AUDIO_LATENCY_MODES={LOW:'interactive',STABLE:'playback'};
const GEAR_SKINS=['ORIGINAL','CARBON','NEON','IVORY'];
let gearSkin='ORIGINAL';
let backgroundBrightness=60,gearWidthPercent=100,judgePosition=82;
const DEFAULT_KEYS=MODE_BINDINGS[5];
let keyCount=5,bindingsByMode={};
let arrangementMode='NORMAL',sessionArrangement='NORMAL',randomSeed=newArrangementSeed(),sessionSeed=0,sessionChartId='';
let selected=0,diff=1,state='idle',speed=3,volume=.6,offset=0,keysEnabled=true;
let bindings=DEFAULT_KEYS.slice(),remapping=null,notes=[],held=Array(5).fill(false),flashes=Array(5).fill(-9999);
let combo=0,maxCombo=0,earned=0,judges=[0,0,0,0,0],judgement='',judgeAt=-9999,life=100;
let rankedRun=null,rankSubmission=null;
let audioMode='LOW',audioReconfigure=null;
let effectStrength='NORMAL',completion=null,visualPreviewMode='PLAY';
let noteSkin='BAR',hitStyle='LASER',hitEffects=[],hitSerial=0,previewAt=-9999;
let judgeMode='STANDARD',sessionJudgeMode='STANDARD';
let judgementTiming=false,timingSamples=[],timingSide='',timingError=0,sessionOffset=0,sessionFailed=false,failPending=false,resultOffset=null,calibration=null,calibrationOffset=null;
let keysVolume=1,keyPlayer=null,keyAudioBuffer=null,keyBufferId='',backgroundBus,keyBus;
let ctxAudio,master,musicSource=null,musicBuffer=null,bufferId='',startAt=0,pauseAt=0;
let W=350,H=500,dpr=1,totalJudgements=0;
const canvas=$('#game'),ctx=canvas.getContext('2d');
function formatTime(seconds){const t=Math.max(0,Math.floor(seconds));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function keyName(code){if(code==='Space')return 'SPACE';if(code.startsWith('Key'))return code.slice(3);if(code.startsWith('Digit'))return code.slice(5);if(code.startsWith('Numpad'))return 'NUM '+code.slice(6);return ({ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backslash:'\\',BracketLeft:'[',BracketRight:']',Minus:'-',Equal:'=',Backquote:'`'})[code]||code.replace(/(Left|Right)$/,'')}
function loadPrefs(){try{const p=JSON.parse(localStorage.getItem('pulse-prefs-v4')||'{}');if(Number.isFinite(p.backgroundBrightness))backgroundBrightness=Math.max(0,Math.min(100,p.backgroundBrightness));if(Number.isFinite(p.gearWidthPercent))gearWidthPercent=Math.max(75,Math.min(125,p.gearWidthPercent));if(Number.isFinite(p.judgePosition))judgePosition=Math.max(35,Math.min(90,p.judgePosition));if(GEAR_SKINS.includes(p.gearSkin))gearSkin=p.gearSkin;if(validEightColors(p.eightNoteColors))eightNoteColors=p.eightNoteColors.map(c=>c.toLowerCase());if(KEY_MODES.includes(p.keyCount))keyCount=p.keyCount;bindingsByMode={};for(const k of KEY_MODES)if(validBindings(p.bindingsByMode?.[k],k))bindingsByMode[k]=p.bindingsByMode[k];if(validBindings(p.bindings,5)&&!bindingsByMode[5])bindingsByMode[5]=p.bindings;bindings=(bindingsByMode[keyCount]||MODE_BINDINGS[keyCount]).slice();applyKeyCharts();if(Number.isFinite(p.speed))speed=Math.max(1,Math.min(10,p.speed));if(Number.isFinite(p.volume))volume=Math.max(0,Math.min(1,p.volume));if(Number.isFinite(p.offset))offset=Math.max(-.2,Math.min(.2,p.offset));if(Object.hasOwn(AUDIO_LATENCY_MODES,p.audioMode))audioMode=p.audioMode;if(Object.hasOwn(EFFECT_STRENGTHS,p.effectStrength))effectStrength=p.effectStrength;if(NOTE_SKINS.includes(p.noteSkin))noteSkin=p.noteSkin;if(HIT_STYLES.includes(p.hitStyle))hitStyle=p.hitStyle;if(JUDGE_PRESETS[p.judgeMode])judgeMode=p.judgeMode;if(ARRANGEMENT_MODES.includes(p.arrangementMode))arrangementMode=p.arrangementMode;keysEnabled=p.keysEnabled!==false;if(Number.isFinite(p.keysVolume))keysVolume=Math.max(0,Math.min(1.5,p.keysVolume))}catch{}}
function savePrefs(){bindingsByMode[keyCount]=bindings.slice();try{localStorage.setItem('pulse-prefs-v4',JSON.stringify({bindings:bindingsByMode[5]||MODE_BINDINGS[5],keyCount,bindingsByMode,speed,volume,offset,keysEnabled,keysVolume,arrangementMode,judgeMode,noteSkin,hitStyle,effectStrength,audioMode,eightNoteColors,gearSkin,backgroundBrightness,gearWidthPercent,judgePosition}))}catch{}}
function applyKeyCharts(){tracks.forEach((t,i)=>Object.assign(t,TRACK_LIBRARY[i],keyChartSet(TRACK_LIBRARY[i],keyCount)));held=Array(keyCount).fill(false);flashes=Array(keyCount).fill(-9999);VISUAL_KEY_COUNT=keyCount;document.documentElement.style.setProperty('--key-count',keyCount);applyReadability()}
function setKeyMode(count){if(state!=='idle'||!KEY_MODES.includes(count))return;bindingsByMode[keyCount]=bindings.slice();keyCount=count;bindings=(bindingsByMode[count]||MODE_BINDINGS[count]).slice();remapping=null;applyKeyCharts();savePrefs();renderBindings();refresh()}
function renderKeyMode(){document.querySelectorAll('[data-keymode]').forEach(b=>{const on=+b.dataset.keymode===keyCount;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('.top-mid strong').textContent=keyCount;$('.key-mode strong').textContent=keyCount;$('#keyConfigTitle').textContent=keyCount+' KEY CONFIGURATION';$('#playKeyCount').textContent=keyCount+' KEY';$('#gearKeyCount').textContent='PULSE / '+keyCount+'KEY';$('#game').setAttribute('aria-label',keyCount+'키 리듬게임 플레이 영역');$('#keyModeHint').textContent=keyCount===4?'4KEY · 압축된 리듬과 양손 교대':keyCount===5?'5KEY · 중앙 리듬을 잇는 선율':keyCount===6?'6KEY · 선율과 반주의 양손 분업':'8KEY · 넓은 음역과 다층 복합 연주'}
function bestKey(mode=arrangementMode){return 'pulse-rules-v7-'+tracks[selected].chartIds[diff]+'-'+judgeMode.toLowerCase()+'-'+mode.toLowerCase()}
function readLegacyBest(){try{const prior=tracks[selected].previousChartIds?.[diff];if(prior){const r=JSON.parse(localStorage.getItem('pulse-rules-v7-'+prior+'-'+judgeMode.toLowerCase()+'-'+arrangementMode.toLowerCase())||'null');if(r&&Number.isFinite(r.score))return r}if(keyCount!==5||arrangementMode!=='NORMAL')return null;if(prior){const r=JSON.parse(localStorage.getItem('pulse-chart-'+prior+'-normal')||localStorage.getItem('pulse-chart-'+prior)||'null');if(r&&Number.isFinite(r.score))return r}const old=tracks[selected].legacyDifficulty[diff];if(old===null)return null;const r=JSON.parse(localStorage.getItem('pulse-5key-v4-'+tracks[selected].id+'-'+old)||'null');return r&&Number.isFinite(r.score)?r:null}catch{return null}}
function readBest(){try{const r=JSON.parse(localStorage.getItem(bestKey())||'null');return r&&Number.isFinite(r.score)?r:null}catch{return null}}
function gradeFor(acc){return acc>=99?'S+':acc>=97?'S':acc>=90?'A':acc>=80?'B':acc>=65?'C':'D'}
function setView(play){$('#selectScreen').hidden=play;$('#playScreen').hidden=!play;document.body.classList.toggle('is-playing',play);if(play)resize()}
function waveSVG(values,color){return '<svg viewBox="0 0 480 36" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" fill="'+color+'">'+(values||[]).map((v,i)=>'<rect x="'+(i*3)+'" y="'+(36-v*33)+'" width="1.8" height="'+Math.max(2,v*33)+'"/>').join('')+'</svg>'}
function renderBindings(){
 $('#bindingGrid').innerHTML='';
 bindings.forEach((code,i)=>{const b=document.createElement('button');b.className='bind-button'+(remapping===i?' capturing':'');b.dataset.binding=i;b.innerHTML='<small>LANE 0'+(i+1)+'</small><b>'+(remapping===i?'…':keyName(code))+'</b>';b.onclick=()=>{remapping=i;$('#bindingMessage').textContent='레인 '+(i+1)+'에 사용할 키를 누르세요. Esc로 취소할 수 있어요.';renderBindings()};$('#bindingGrid').append(b)});
 $('#bindingsLabel').textContent=bindings.map(keyName).join('  ');$('#keyConfig b').textContent=bindings.map(k=>k==='Space'?'␣':keyName(k)).join(' ');
 $('#touchPads').innerHTML=bindings.map((k,i)=>'<button data-key="'+i+'">'+keyName(k)+'</button>').join('');bindTouchPads();
}
function assignBinding(code){
 if(['Enter','Escape','F2'].includes(code)){$('#bindingMessage').textContent='Enter·Esc·F2는 메뉴 조작에 사용해요. 다른 키를 선택해 주세요.';return false}
 if(/^(Shift|Control|Alt|Meta)/.test(code)||!code)return false;
 const i=remapping,old=bindings[i],other=bindings.indexOf(code);if(other>=0)bindings[other]=old;bindings[i]=code;remapping=null;savePrefs();renderBindings();$('#bindingMessage').textContent=other>=0?'중복 키를 서로 교환했어요. 설정이 저장됐습니다.':'키 배치를 저장했어요.';return true;
}
function refresh(){
 const t=tracks[selected],current=readBest(),legacy=readLegacyBest(),best=current||legacy,chart=t.charts[diff];
 document.documentElement.style.setProperty('--accent',t.color);document.body.classList.toggle('expert-mode',diff===3);document.documentElement.style.setProperty('--jacket',([0,48,170,215,320,30,265][selected]||0)+'deg');
 $('#jacketIndex').textContent=String(selected+1).padStart(2,'0');$('#jacketWord').innerHTML=t.short;
 $('#trackTitle').textContent=t.name;$('#bpm').textContent=t.bpmLabel;$('#genre').textContent=t.genre.toUpperCase();$('#songLength').textContent=formatTime(t.duration);
 $('#chartDescription').textContent=keyCount+'KEY / '+DIFF[diff]+' / LV.'+t.levels[diff];
 $('#best').textContent=best?String(best.score).padStart(7,'0'):'NO RECORD';$('#bestGrade').textContent=current?current.grade:legacy?'이전 배치':'—';$('#bestLabel').textContent=current||!legacy?'PERSONAL BEST / '+JUDGE_LABELS[judgeMode]+' / '+arrangementMode:'PREVIOUS CHART';$('#bestCombo').textContent=best?best.maxCombo:'—';$('#bestRate').textContent=best?best.accuracy.toFixed(2)+'%':'—';
 document.querySelectorAll('.song').forEach((b,i)=>{b.classList.toggle('active',i===selected);b.querySelectorAll('.song-level').forEach((n,d)=>(n.classList.toggle('selected-diff',d===diff),n.textContent=tracks[i].levels[d]))});
 ['easyLevel','normalLevel','hardLevel','expertLevel'].forEach((id,i)=>$('#'+id).textContent=String(t.levels[i]).padStart(2,'0'));
 document.querySelectorAll('[data-diff]').forEach((b,i)=>b.classList.toggle('active',i===diff));
 $('#noteCount').textContent=chart.length.toLocaleString();$('#holdCount').textContent=chart.filter(n=>n[2]>0).length;
 let peak=0,right=0;for(let left=0;left<chart.length;left++){while(right<chart.length&&chart[right][0]<chart[left][0]+2)right++;peak=Math.max(peak,(right-left)/2)}$('#peakDensity').textContent=peak.toFixed(1)+'/s';
 $('#densityPreview').innerHTML=waveSVG(t.waveform,t.color);$('#chartHint').textContent=['멜로디의 흐름과 반복되는 리듬을 따라 연주하세요.','계단과 반복음, 동시치기를 프레이즈에 맞춰 연결하세요.','빠른 선율과 반복음, 롱노트의 연결을 느껴보세요.','복합 선율·연속 동시 치기·연타·롱노트 복합.'][diff];
 $('#speedText').textContent=speed.toFixed(2);$('#speedReadout').textContent='HI-SPEED '+speed.toFixed(2);
 renderArrangement();renderJudgeMode();renderKeyMode();
 $('#message').textContent='';
}
function renderArrangement(){
 document.querySelectorAll('[data-arrangement]').forEach(b=>b.classList.toggle('active',b.dataset.arrangement===arrangementMode));
 $('#shuffleSeed').hidden=arrangementMode!=='RANDOM';
}
function renderJudgeMode(){const w=JUDGE_PRESETS[judgeMode];$('#topJudgeLabel').textContent=JUDGE_LABELS[judgeMode];document.querySelectorAll('[data-judge]').forEach(b=>b.classList.toggle('active',b.dataset.judge===judgeMode));$('#judgeInfo').textContent='PERFECT ±'+w.perfect+' · GREAT ±'+w.great+' · GOOD ±'+w.good+' ms';$('#judgeHelp').textContent=judgeMode==='BASIC'?'넓은 타이밍 허용 범위와 완만한 게이지 감소':'정확한 입력과 안정적인 연주에 도전하세요';$('#judgeWindowsHelp').textContent='현재 '+JUDGE_LABELS[judgeMode]+': PERFECT ±'+w.perfect+' / GREAT ±'+w.great+' / GOOD ±'+w.good+' / MISS ±'+w.miss+' ms. 범위 밖으로 놓치면 FAIL입니다.'}
function setJudgeMode(mode){if(state!=='idle'||!JUDGE_PRESETS[mode])return;judgeMode=mode;savePrefs();refresh()}
function setArrangement(mode){if(state!=='idle'||!ARRANGEMENT_MODES.includes(mode))return;arrangementMode=mode;if(mode==='RANDOM')randomSeed=newArrangementSeed();savePrefs();refresh()}
function selectTrack(i){if(state!=='idle')return;selected=(i+tracks.length)%tracks.length;refresh();document.querySelectorAll('.song')[selected]?.scrollIntoView?.({block:'nearest'})}
function selectDifficulty(i){if(state!=='idle')return;diff=(i+DIFF.length)%DIFF.length;refresh()}
tracks.forEach((t,i)=>{const b=document.createElement('button');b.className='song';b.innerHTML='<span class="song-num">0'+(i+1)+'</span><div class="thumb '+['','b','c'][i]+'"></div><div class="song-copy"><span class="song-name">'+t.name+'</span><small>'+t.genre+' · '+formatTime(t.duration)+'</small></div><span class="song-bpm">'+t.bpmLabel+'</span>'+t.levels.map((l,d)=>'<span class="song-level'+(d===3?' expert-level':'')+'">'+l+'</span>').join('');b.onclick=()=>selectTrack(i);$('#songs').append(b)});
function lockControls(locked){document.querySelectorAll('.song,[data-keymode],[data-diff],[data-arrangement],[data-judge],#shuffleSeed,#start,#keyConfig').forEach(b=>b.disabled=locked)}
function createAudioEngine(){ctxAudio=new (window.AudioContext||window.webkitAudioContext)({latencyHint:AUDIO_LATENCY_MODES[audioMode]});master=ctxAudio.createGain();master.gain.value=volume;master.connect(ctxAudio.destination);backgroundBus=ctxAudio.createGain();backgroundBus.connect(master);keyBus=ctxAudio.createGain();keyBus.gain.value=keysVolume;keyBus.connect(master);keyPlayer=new KeySoundPlayer(ctxAudio,backgroundBus,keyBus);refreshAudioInfo()}
async function initAudio(){if(audioReconfigure)await audioReconfigure;if(!ctxAudio)createAudioEngine();await ctxAudio.resume();refreshAudioInfo()}
function refreshAudioInfo(){const metric=(value,suffix)=>Number.isFinite(value)?value.toFixed(1)+suffix:'미지원';$('#audioLatencyInfo').textContent=ctxAudio?'샘플레이트 '+metric(ctxAudio.sampleRate/1000,' kHz')+' · 처리 '+metric(ctxAudio.baseLatency*1000,' ms')+' · 출력 '+metric(ctxAudio.outputLatency*1000,' ms'):'오디오를 재생하면 장치 정보를 표시합니다.'}
async function changeAudioMode(mode){if(!Object.hasOwn(AUDIO_LATENCY_MODES,mode)||audioReconfigure)return;audioMode=mode;savePrefs();if(!ctxAudio){$('#audioModeMessage').textContent='다음 오디오 재생부터 적용됩니다.';return}stopCalibration();const old=ctxAudio,played=notes.map(n=>n.sound?.fired===true);$('#audioMode').disabled=true;audioReconfigure=(async()=>{stopMusic();await old.close();ctxAudio=null;createAudioEngine();if(keyAudioBuffer&&keyBufferId===tracks[selected].id){keyPlayer.prepare(notes,keyAudioBuffer);notes.forEach((n,i)=>{if(n.sound)n.sound.fired=played[i]})}$('#audioModeMessage').textContent='설정을 적용했어요. 재생을 시작하거나 일시정지를 해제해 주세요.'})().catch(error=>{ctxAudio=null;keyPlayer=null;$('#audioModeMessage').textContent='오디오를 다시 시작할 때 설정을 적용합니다.';console.error(error)}).finally(()=>{audioReconfigure=null;$('#audioMode').disabled=false;refreshAudioInfo()});await audioReconfigure}
async function loadKeys(){const track=tracks[selected];if(keyBufferId===track.id&&keyAudioBuffer)return keyAudioBuffer;const r=await fetch(track.keysAudio);if(!r.ok)throw Error('keys_fetch');keyAudioBuffer=await ctxAudio.decodeAudioData(await r.arrayBuffer());keyBufferId=track.id;return keyAudioBuffer}
function tone(freq,at,dur,type='sine',gain=.1){const o=ctxAudio.createOscillator(),g=ctxAudio.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);g.gain.setValueAtTime(.001,at);g.gain.exponentialRampToValueAtTime(gain,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+dur);o.connect(g);g.connect(master);o.start(at);o.stop(at+dur+.02);return o}
function stopMusic(){if(keyPlayer)keyPlayer.stop();if(musicSource){try{musicSource.stop()}catch{}musicSource.disconnect();musicSource=null}}
function playMusic(position){stopMusic();musicSource=ctxAudio.createBufferSource();musicSource.buffer=musicBuffer;musicSource.connect(backgroundBus||master);if(keyPlayer){keyPlayer.enabled=keysEnabled;keyPlayer.reset(position);keyPlayer.schedule(position,startAt)}musicSource.start(Math.max(ctxAudio.currentTime,startAt),Math.max(0,position))}
function chart(mode=arrangementMode,seed=randomSeed){return transformChart(tracks[selected].charts[diff],mode,seed,keyCount).map(([time,lane,dur,pitch,kind])=>({time,lane,dur,pitch,kind,status:0}))}
async function start(options={}){
 if(state!=='idle')return;state='loading';lockControls(true);$('#start>span').textContent='LOADING';$('#message').textContent='음원을 준비하고 있습니다…';
 try{
  await initAudio();const track=tracks[selected];
  if(bufferId!==track.id){musicBuffer=null;bufferId='';const r=await fetch(track.audio);if(!r.ok)throw Error('audio_fetch');musicBuffer=await ctxAudio.decodeAudioData(await r.arrayBuffer());bufferId=track.id}
  if(keysEnabled)await loadKeys();
  const replay=options?.reuseSeed===true&&sessionArrangement===arrangementMode&&sessionChartId===track.chartIds[diff];sessionArrangement=arrangementMode;sessionSeed=replay?sessionSeed:arrangementMode==='RANDOM'?randomSeed:0;sessionChartId=track.chartIds[diff];randomSeed=sessionSeed||randomSeed;
  rankedRun=null;rankSubmission=null;if(window.PulseRanking){try{rankedRun=await window.PulseRanking.beginRun({chartId:track.chartIds[diff],judgeMode,arrangement:arrangementMode})}catch(error){console.info('Ranking unavailable:',error.message)}}
  notes=chart(sessionArrangement,sessionSeed);if(keyPlayer&&keyAudioBuffer&&keyBufferId===track.id)keyPlayer.prepare(notes,keyAudioBuffer);totalJudgements=notes.length+notes.filter(n=>n.dur).length;held.fill(false);flashes.fill(-9999);combo=maxCombo=earned=0;judges=[0,0,0,0,0];judgement='';life=100;completion=null;$('.gear').classList.remove('is-celebrating');hitEffects=[];timingSamples=[];timingSide='';timingError=0;sessionOffset=offset;sessionJudgeMode=judgeMode;sessionFailed=false;failPending=false;
  $('#playDifficulty').textContent=DIFF[diff];$('#playTitle').textContent=track.name;$('#bgaTitle').innerHTML=track.short;$('#playBest').textContent=readBest()?String(readBest().score).padStart(7,'0'):'NO RECORD';$('#gearLevel').textContent='LV.'+String(track.levels[diff]).padStart(2,'0');$('#sessionType').textContent=keyCount+'KEY · '+JUDGE_LABELS[sessionJudgeMode]+' · '+sessionArrangement+(rankedRun?'':' · LOCAL');$('#pauseOverlay').hidden=true;$('#playTime').textContent='00:00 / '+formatTime(track.duration);
  startAt=ctxAudio.currentTime+2.5;pauseAt=-2.5;state='playing';setView(true);syncHUD();playMusic(0);$('#start>span').textContent='PLAY';$('#message').textContent='';
 }catch(e){stopMusic();state='idle';lockControls(false);setView(false);$('#start>span').textContent='RETRY';$('#message').textContent='음원을 불러오지 못했어요. 연결을 확인하고 다시 시작해 주세요.';console.error(e)}
}
function elapsed(){return state==='paused'?pauseAt:ctxAudio?ctxAudio.currentTime-startAt:0}
function score(){return totalJudgements?Math.round(earned/totalJudgements*1000000):0}
function syncHUD(){const count=judges.reduce((a,b)=>a+b,0);$('#score').textContent=String(score()).padStart(7,'0');$('#liveAccuracy').textContent=(count?earned/count*100:100).toFixed(2)+'%';['jPerfect','jGreat','jGood','jMiss','jFail'].forEach((id,i)=>$('#'+id).textContent=judges[i]);$('#lifeFill').style.height=life+'%';$('#lifeValue').textContent=Math.round(life);$('.life-rail').classList.toggle('danger',life<=25);$('#timingLabel').textContent=timingSide||'—';$('#timingDelta').textContent=timingSide?(timingError>0?'+':'')+Math.round(timingError)+' ms':'0 ms';$('.timing-live').dataset.side=timingSide;$('#fastCount').textContent=timingSamples.filter(x=>x< -5).length;$('#slowCount').textContent=timingSamples.filter(x=>x>5).length;$('#offsetLive').textContent='OFFSET '+(offset>=0?'+':'')+Math.round(offset*1000)+' ms'}
function give(n,q,holdEnd=false){if(q<3&&state==='playing')addHitEffect(n.lane,holdEnd?.9:q===0?1:q===1?.85:.65,holdEnd?'hold-end':'tap');judgementTiming=!holdEnd&&q<3;if(!holdEnd)n.status=n.dur&&q<3?1:2;if(q>=3){combo=0;judgement=q===4?'FAIL':'MISS';timingSide='';const w=JUDGE_PRESETS[sessionJudgeMode];life=Math.max(0,life-(holdEnd?w.holdDamage:q===4?w.failDamage:w.missDamage));if(life<=0&&state==='playing')failPending=true}else{combo++;maxCombo=Math.max(combo,maxCombo);earned+=[1,.75,.4][q];judgement=['PERFECT','GREAT','GOOD'][q];life=Math.min(100,life+JUDGE_PRESETS[sessionJudgeMode].recovery)}if(!holdEnd&&q<3&&keyPlayer)keyPlayer.play(n);judges[q]++;judgeAt=performance.now();syncHUD()}
function recordTiming(error){timingError=error;timingSide=Math.abs(error)<=5?'CENTER':error<0?'FAST':'SLOW';timingSamples.push(error)}
function press(l){if(held[l])return;held[l]=true;if(state!=='playing'||failPending)return;updateGame(elapsed(),performance.now());if(state!=='playing')return;const t=elapsed()-sessionOffset,window=JUDGE_PRESETS[sessionJudgeMode].miss/1000+.0000001;let n=null,distance=Infinity;for(const candidate of notes){if(candidate.lane!==l||candidate.status!==0)continue;const delta=Math.abs(candidate.time-t);if(delta<=window&&delta<distance){n=candidate;distance=delta}}if(n){const error=(t-n.time)*1000;const q=classifyTiming(error,sessionJudgeMode);if(q<3)recordTiming(error);give(n,q);if(q>=3&&n.dur)give(n,q,true);resolveFailure()}}
function release(l){held[l]=false;if(state!=='playing'||failPending)return;notes.filter(n=>n.lane===l&&n.status===1).forEach(n=>{n.status=2;give(n,elapsed()-sessionOffset>=n.time+n.dur-.10?0:3,true)});resolveFailure()}
function resolveFailure(){if(failPending&&state==='playing'){sessionFailed=true;failPending=false;finish(false,true)}}
async function togglePause(){
 if(state==='celebrating'){finish();return}
 if(state==='playing'){pauseAt=elapsed();state='paused';stopMusic();held.fill(false);$('#pauseOverlay').hidden=false}
 else if(state==='paused'){if(pauseAt>=tracks[selected].duration){state='playing';updateGame(pauseAt+.401,performance.now());return}await initAudio();startAt=ctxAudio.currentTime-pauseAt;playMusic(Math.max(0,pauseAt));state='playing';$('#pauseOverlay').hidden=true}
}
function completeTrack(){
 if(state!=='playing')return;const label=achievementFor(judges,totalJudgements);if(!label){finish();return}
 stopMusic();state='celebrating';held.fill(false);completion={label,at:performance.now()};$('#countdown').hidden=true;$('#pauseOverlay').hidden=true;$('.gear').classList.add('is-celebrating');$('.gear').dataset.achievement=label==='ALL PERFECT'?'perfect':'combo';$('.gear').style.setProperty('--effect-power',EFFECT_STRENGTHS[effectStrength]);$('#achievementAnnouncement').textContent=label;$('#pauseButton').innerHTML='▶ <span>RESULT</span>';
}
function updateCompletion(now){if(state==='celebrating'&&completion&&now-completion.at>=CELEBRATION_MS)finish()}
function finish(aborted=false,failed=false){
 completion=null;$('.gear').classList.remove('is-celebrating');$('#achievementAnnouncement').textContent='';$('#pauseButton').innerHTML='Ⅱ <span>ENTER</span>';
 sessionFailed=failed;failPending=false;
 stopMusic();state='idle';held.fill(false);$('#pauseOverlay').hidden=true;$('#countdown').hidden=true;lockControls(false);setView(false);$('#start>span').textContent='PLAY';
 $('#retryRankSubmit').hidden=true;$('#rankSubmitState').textContent='';
 if(aborted){if(arrangementMode==='RANDOM')randomSeed=newArrangementSeed();refresh();return}
 const s=score(),count=judges.reduce((a,b)=>a+b,0),accuracy=count?earned/count*100:0,grade=gradeFor(accuracy),prev=readBest();
 if(!failed&&(!prev||s>prev.score)){try{localStorage.setItem(bestKey(),JSON.stringify({score:s,accuracy,maxCombo,grade,judgeMode:sessionJudgeMode,arrangement:sessionArrangement,seed:sessionSeed,laneMap:createLaneMap(sessionArrangement,sessionSeed)}))}catch{}}
 $('#resultTitle').textContent=tracks[selected].name+' / '+keyCount+'KEY '+DIFF[diff]+' / '+JUDGE_LABELS[sessionJudgeMode]+' / '+sessionArrangement;$('.result-content').classList.toggle('failed',failed);$('#resultMode').textContent=failed?'STAGE FAILED':'RESULT';$('#grade').textContent=failed?'F':grade;$('#resultScore').textContent=String(s).padStart(7,'0');$('#resultClear').textContent=failed?'FAILED · 게이지 소진':achievementFor(judges,totalJudgements)||'TRACK CLEAR';
 $('#resultDetails').innerHTML='<div><small>ACCURACY</small><b>'+accuracy.toFixed(2)+'%</b></div><div><small>MAX COMBO</small><b>'+maxCombo+'</b></div><div><small>PERFECT / GREAT</small><b>'+judges[0]+' / '+judges[1]+'</b></div><div><small>GOOD / MISS / FAIL</small><b>'+judges[2]+' / '+judges[3]+' / '+judges[4]+'</b></div>';
 $('#rankSubmitState').textContent=failed?'실패 기록은 랭킹에 등록되지 않습니다.':rankedRun?'클리어 기록을 등록하고 있어요…':'개인 기록만 저장한 플레이입니다. 온라인 랭킹에는 등록되지 않았어요.';if(!failed&&rankedRun){rankSubmission={run:rankedRun,judges:judges.slice(),maxCombo};submitRanking()}
 const summary=summarizeTiming(timingSamples);resultOffset=summary&&summary.count>=8?clampOffset(sessionOffset*1000+summary.median):null;
 $('#resultTiming').innerHTML=summary?'<span>FAST <b>'+summary.fast+'</b> / SLOW <b>'+summary.slow+'</b> / CENTER <b>'+summary.center+'</b></span><span>중앙 오차 <b>'+(summary.median>=0?'+':'')+summary.median.toFixed(1)+' ms</b></span><span>입력 편차 <b>'+summary.spread.toFixed(1)+' ms</b></span>':'입력 타이밍 데이터가 없습니다.';
 $('#applyResultOffset').hidden=resultOffset===null;$('#applyResultOffset').textContent='권장 보정 '+(resultOffset>=0?'+':'')+resultOffset+' ms 적용';
 if(arrangementMode==='RANDOM')randomSeed=newArrangementSeed();refresh();$('#resultDialog').showModal();
}
function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}new ResizeObserver(resize).observe(canvas);
function addHitEffect(lane,strength=1,kind='tap'){if(hitStyle==='OFF')return;hitEffects.push({lane,at:performance.now(),strength,kind,seed:++hitSerial});if(hitEffects.length>80)hitEffects.splice(0,hitEffects.length-80)}
function setVisualPreview(mode){if(!['PLAY','FULL COMBO','ALL PERFECT'].includes(mode))return;visualPreviewMode=mode;previewAt=performance.now();const canvas=$('#visualPreview');canvas.height=mode==='PLAY'?200:320;canvas.classList.toggle('finish-preview',mode!=='PLAY');canvas.setAttribute('aria-label',mode==='PLAY'?'타격·롱노트 유지 이펙트 미리보기':mode+' 마무리 연출 미리보기');document.querySelectorAll('[data-effect-preview]').forEach(button=>{const active=button.dataset.effectPreview===mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});$('#visualPreviewCaption').textContent=mode==='PLAY'?'롱노트 유지와 타격 연출 미리보기 · 설정은 자동 저장됩니다.':mode+' 연출 미리보기 · 플레이 기록에는 반영되지 않습니다.'}
function drawVisualPreview(now){
 if(!$('#settingsDialog').open)return;const c=$('#visualPreview').getContext('2d'),height=visualPreviewMode==='PLAY'?100:160;c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,330,height);c.fillStyle='#050d17';c.fillRect(0,0,330,height);const pad=5,lw=320/keyCount,line=68;
 for(let lane=0;lane<keyCount;lane++){c.fillStyle=centerLane(lane,keyCount)?'#211e17':lane%2?'#102033':'#0a1726';c.fillRect(pad+lane*lw,0,lw-1,height)}
 if(visualPreviewMode!=='PLAY'){const age=(now-previewAt)%(CELEBRATION_MS+450);paintCompletion(c,visualPreviewMode,age,330,height,effectStrength);return}
 for(let lane=0;lane<keyCount;lane++){const color=laneColor(lane),noteY=lane===Math.floor(keyCount/2)?line:noteSkin==='CIRCLE'?35+(lane%3)*3:25+(lane%3)*9;if(lane===Math.floor(keyCount/2)){const stem=lw*.28,x=pad+lane*lw+(lw-stem)/2;c.fillStyle=color+'55';c.fillRect(x,2,stem,line-2);paintHoldBody(c,x,2,line,stem,color,now,effectStrength)}paintNoteHead(c,pad+lane*lw+4,noteY,lw-8,color,noteSkin);if(lane===Math.floor(keyCount/2))paintHoldAnchor(c,pad+(lane+.5)*lw,line,lw-8,color,now,noteSkin,effectStrength)}
 c.fillStyle='#91b2cb';c.fillRect(5,line,320,1);const age=now-previewAt,at=age>=0&&age<1800?previewAt+Math.floor(age/600)*600:previewAt;paintHitEffects(c,[0,Math.floor(keyCount/2),keyCount-1].map(lane=>({lane,at,strength:1,seed:lane*7,kind:lane===Math.floor(keyCount/2)?'hold-end':'tap'})),now,pad,lw,line,hitStyle,effectStrength);
}
function drawJudgementLine(lineY,pad,lw){ctx.fillStyle='#334c5e';ctx.fillRect(pad,lineY+4,W-pad*2,4);ctx.save();ctx.shadowColor='#88dcff';ctx.shadowBlur=7;for(let l=0;l<keyCount;l++){ctx.fillStyle=laneColor(l);ctx.fillRect(pad+l*lw+3,lineY,lw-6,1.5)}ctx.restore();ctx.fillStyle='#ffffff33';ctx.fillRect(pad,lineY-1,W-pad*2,1);}
function updateGame(t,now){
 if(state!=='playing')return;
 if(keyPlayer)keyPlayer.schedule(t,startAt);
 for(const n of notes){
  if(n.status===0&&t-sessionOffset>n.time+JUDGE_PRESETS[sessionJudgeMode].miss/1000){give(n,4);if(n.dur){n.status=2;give(n,4,true)}}
  else if(n.status===1&&t-sessionOffset>=n.time+n.dur){n.status=2;give(n,held[n.lane]?0:3,true)}
  if(failPending){resolveFailure();return}
 }
 if(t>=tracks[selected].duration+.4)completeTrack();
}
function draw(now){
 requestAnimationFrame(draw);updateCalibration();drawVisualPreview(now);updateCompletion(now);if(!['playing','paused','celebrating'].includes(state))return;
 const track=tracks[selected],t=elapsed(),travel=3.9/speed,pad=9,lw=(W-pad*2)/keyCount;
 // Full-size Circle heads need room below their timing center; keep the key
 // deck fixed while moving only the Circle judgment field up by its radius.
 const headRadius=noteSkin==='CIRCLE'?circleNoteRadius(lw-6):0,lineY=H-64-(headRadius?Math.ceil(headRadius)+2:0),keyTop=H-54,headMargin=Math.max(14,headRadius+4);
 updateGame(t,now);if(state==='idle')return;
 ctx.clearRect(0,0,W,H);ctx.fillStyle='#040810';ctx.fillRect(0,0,W,H);
 for(let l=0;l<keyCount;l++){
  const x=pad+l*lw,laneDepth=ctx.createLinearGradient(0,0,0,H);laneDepth.addColorStop(0,centerLane(l,keyCount)?'#11130f':l%2?'#0d1722':'#080f18');laneDepth.addColorStop(1,centerLane(l,keyCount)?'#28261d':l%2?'#142b3c':'#10202e');ctx.fillStyle=laneDepth;ctx.fillRect(x,0,lw,H);ctx.strokeStyle=centerLane(l,keyCount)||l===Math.ceil(keyCount/2)?'#7f826455':'#56748a44';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
  if(held[l]){const g=ctx.createLinearGradient(0,lineY-150,0,lineY);g.addColorStop(0,laneColor(l)+'00');g.addColorStop(1,laneColor(l)+'55');ctx.fillStyle=g;ctx.fillRect(x+1,lineY-150,lw-2,150)}
 }
 if(noteSkin==='CIRCLE')drawJudgementLine(lineY,pad,lw);
 ctx.save();ctx.beginPath();ctx.rect(pad,0,W-pad*2,lineY+headRadius+5);ctx.clip();const beat=60/track.bpm;
 for(let i=Math.floor(t/beat);i<(t+travel)/beat+1;i++){const y=lineY-(i*beat-t)*lineY/travel;ctx.fillStyle=i%4===0?'#91bdd920':'#91bdd907';ctx.fillRect(pad,y,W-pad*2,1)}
 for(const n of notes){
  if(n.status===2)continue;const y=lineY-(n.time-t)*lineY/travel,tailY=lineY-(n.time+n.dur-t)*lineY/travel;if(y< -headMargin||tailY>lineY+headMargin)continue;
  const x=pad+n.lane*lw+3,w=lw-6,c=laneColor(n.lane);
  if(n.dur){const bottom=n.status===1?lineY:y,stemWidth=w*(noteSkin==='CIRCLE'?.28:.56),stemX=x+(w-stemWidth)/2;ctx.fillStyle=c+'44';ctx.fillRect(stemX,tailY,stemWidth,Math.max(0,bottom-tailY));if(n.status===1&&held[n.lane]&&state==='playing')paintHoldBody(ctx,stemX,Math.max(0,tailY),bottom,stemWidth,c,now,effectStrength);ctx.fillStyle=c+'88';ctx.fillRect(stemX,tailY,stemWidth,2);if(noteSkin==='CIRCLE'){ctx.beginPath();ctx.arc(x+w/2,tailY,circleNoteRadius(w)*.38,0,Math.PI*2);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=1;ctx.stroke()}}paintNoteHead(ctx,x,n.status===1?lineY:y,w,c,noteSkin);if(n.status===1&&held[n.lane]&&state==='playing')paintHoldAnchor(ctx,x+w/2,lineY,w,c,now,noteSkin,effectStrength);
 }
 ctx.restore();if(noteSkin!=='CIRCLE')drawJudgementLine(lineY,pad,lw);
 for(let l=0;l<keyCount;l++){
  const x=pad+l*lw+3,w=lw-6,cx=x+w/2,active=held[l];
  const g=ctx.createLinearGradient(0,keyTop,0,H);g.addColorStop(0,active?'#d6f6ff':centerLane(l,keyCount)?'#88794b':'#405f75');g.addColorStop(.16,active?'#88cce7':centerLane(l,keyCount)?'#3c3625':'#1c3447');g.addColorStop(1,centerLane(l,keyCount)?'#17160f':'#0a1622');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,keyTop,w,H-keyTop-6,4);ctx.fill();ctx.strokeStyle=centerLane(l,keyCount)?'#e4d09a66':'#b2ddf866';ctx.lineWidth=.7;ctx.stroke();ctx.globalAlpha=active?1:.4;ctx.fillStyle=laneColor(l);ctx.fillRect(x+5,keyTop+3,w-10,2);ctx.globalAlpha=1;
  ctx.fillStyle=active?'#1b2d3b':'#c3d9e8';ctx.textAlign='center';ctx.font='700 '+(bindings[l]==='Space'?8:11)+'px Rajdhani,sans-serif';ctx.fillText(keyName(bindings[l]),cx,H-22);

 }
 hitEffects=hitEffects.filter(hit=>now-hit.at<420);paintHitEffects(ctx,hitEffects,now,pad,lw,lineY,hitStyle,effectStrength);
 ctx.textAlign='center';if(combo>1&&state!=='celebrating'){ctx.fillStyle='#95bbd280';ctx.font='700 12px Rajdhani,sans-serif';ctx.fillText('COMBO',W/2,H*.27);ctx.fillStyle='#e6f4ffc4';ctx.font='800 italic 55px "Barlow Condensed",sans-serif';ctx.fillText(combo,W/2,H*.27+49)}
 if(now-judgeAt<500){ctx.globalAlpha=Math.min(1,(500-now+judgeAt)/150);ctx.fillStyle=['MISS','FAIL'].includes(judgement)?'#f19785':judgement==='PERFECT'?'#e9ff85':'#8ddaff';ctx.font='800 italic 28px "Barlow Condensed",sans-serif';ctx.fillText(judgement,W/2,Math.max(50,Math.min(lineY-30,lineY*judgePosition/100)));if(judgementTiming&&timingSide&&!['MISS','FAIL'].includes(judgement)){ctx.fillStyle=timingSide==='FAST'?'#71d7ff':timingSide==='SLOW'?'#ffac86':'#e9ff85';ctx.font='700 12px Rajdhani,sans-serif';ctx.fillText(timingSide+' '+(timingError>=0?'+':'')+Math.round(timingError)+' ms',W/2,Math.max(50,Math.min(lineY-30,lineY*judgePosition/100))+19)}ctx.globalAlpha=1}
 if(state==='celebrating'&&completion)paintCompletion(ctx,completion.label,now-completion.at,W,H,effectStrength);
 $('#countdown').hidden=t>=0;if(t<0)$('#countdown b').textContent=Math.ceil(-t);
 $('#progress').style.width=(Math.max(0,Math.min(1,t/track.duration))*100)+'%';$('#playTime').textContent=formatTime(t)+' / '+formatTime(track.duration);
 const section=(track.sections||[]).filter(s=>s.time<=t).at(-1);$('#sectionName').textContent=section?section.name:'OPENING';
}
function applyReadability(){
 const root=document.documentElement;
 root.style.setProperty('--background-brightness',backgroundBrightness/100);
 root.style.setProperty('--gear-width',Math.round((keyCount*64+48)*gearWidthPercent/100)+'px');
 root.style.setProperty('--gear-scale',gearWidthPercent/100);
 for(const [id,value,suffix] of [['backgroundBrightness',backgroundBrightness,'%'],['gearWidthPercent',gearWidthPercent,'%'],['judgePosition',judgePosition,'%']]){
  $('#'+id).value=value;$('#'+id+'Value').textContent=value+suffix;
 }
 $('#readabilityJudge').style.top=judgePosition+'%';
 $('#readabilityMini').style.width=(gearWidthPercent*.6)+'%';
 $('#readabilityPreview').style.backgroundColor='rgb('+[12,25,40].map(v=>Math.round(v*backgroundBrightness/60)).join(',')+')';
}
for(const id of ['backgroundBrightness','gearWidthPercent','judgePosition']){
 $('#'+id).oninput=e=>{
  const n=Number(e.target.value);if(!Number.isFinite(n))return;
  if(id==='backgroundBrightness')backgroundBrightness=Math.max(0,Math.min(100,n));
  if(id==='gearWidthPercent')gearWidthPercent=Math.max(75,Math.min(125,n));
  if(id==='judgePosition')judgePosition=Math.max(35,Math.min(90,n));
  applyReadability();savePrefs();
 };
}
$('#resetReadability').onclick=()=>{backgroundBrightness=60;gearWidthPercent=100;judgePosition=82;applyReadability();savePrefs()};
function applyGearSkin(){
 document.documentElement.dataset.gearSkin=gearSkin;
 document.querySelectorAll('[data-gear-choice]').forEach(button=>{
  const on=button.dataset.gearChoice===gearSkin;
  button.setAttribute('aria-pressed',String(on));
 });
}
document.querySelectorAll('[data-gear-choice]').forEach(button=>button.onclick=()=>{
 if(!GEAR_SKINS.includes(button.dataset.gearChoice))return;
 gearSkin=button.dataset.gearChoice;applyGearSkin();savePrefs();
});
function syncEightColorSettings(){
 const preset=Object.keys(EIGHT_COLOR_PRESETS).find(k=>EIGHT_COLOR_PRESETS[k].colors.every((c,i)=>c===eightNoteColors[i]));
 $('#eightColorPreset').value=preset||'CUSTOM';
 document.querySelectorAll('[data-eight-color]').forEach(input=>{input.value=eightNoteColors[+input.dataset.eightColor]});
 document.querySelectorAll('[data-eight-lane]').forEach(cell=>{cell.style.setProperty('--note-color',eightNoteColors[EIGHT_COLOR_GROUPS[+cell.dataset.eightLane]])});
}
async function openSettings(){if(state==='loading'||state==='celebrating')return;if(state==='playing')await togglePause();remapping=null;syncEightColorSettings();setVisualPreview('PLAY');$('#effectStrength').value=effectStrength;$('#audioMode').value=audioMode;refreshAudioInfo();$('#noteSkin').value=noteSkin;$('#hitStyle').value=hitStyle;$('#bindingMessage').textContent='Enter: 일시정지 / Esc: 뒤로 가기';renderBindings();$('#settingsDialog').showModal()}
document.querySelectorAll('[data-judge]').forEach(b=>b.onclick=()=>setJudgeMode(b.dataset.judge));
document.querySelectorAll('[data-arrangement]').forEach(b=>b.onclick=()=>setArrangement(b.dataset.arrangement));$('#shuffleSeed').onclick=()=>{if(state!=='idle')return;randomSeed=newArrangementSeed();renderArrangement()};

async function submitRanking(){const submission=rankSubmission;if(!submission||!window.PulseRanking)return;$('#retryRankSubmit').hidden=true;$('#rankSubmitState').textContent='클리어 기록을 등록하고 있어요…';try{const result=await window.PulseRanking.submit(submission.run,submission.judges,submission.maxCombo);if(rankSubmission!==submission)return;$('#rankSubmitState').textContent='랭킹 등록 완료 · 개인 최고 '+result.mine.position+'위 / '+result.total+'명'}catch(error){if(rankSubmission!==submission)return;$('#rankSubmitState').textContent=error.message;$('#retryRankSubmit').hidden=false}}
function openRankings(){if(state==='loading'||state==='celebrating')return;window.PulseRanking?.open({selected,diff,keyCount,judgeMode,arrangement:arrangementMode})}
$('#openRankings').onclick=openRankings;$('#resultRanking').onclick=openRankings;$('#retryRankSubmit').onclick=submitRanking;

$('#start').onclick=start;$('#pauseButton').onclick=togglePause;$('#resume').onclick=togglePause;$('#restart').onclick=()=>{finish(true);start({reuseSeed:true})};$('#exitPlay').onclick=()=>finish(true);
$('#openSettings').onclick=openSettings;$('#keyConfig').onclick=openSettings;$('#closeSettings').onclick=()=>$('#settingsDialog').close();$('#settingsDialog').addEventListener('close',()=>{remapping=null;stopCalibration()});
$('#resetKeys').onclick=()=>{bindings=MODE_BINDINGS[keyCount].slice();remapping=null;savePrefs();renderBindings();$('#bindingMessage').textContent='기본 키 배치로 초기화했어요.'};
$('#speed').oninput=e=>{speed=+e.target.value;savePrefs();refresh()};$('#volume').oninput=e=>{volume=+e.target.value/100;$('#volText').textContent=e.target.value+'%';if(master&&ctxAudio)master.gain.setTargetAtTime(volume,ctxAudio.currentTime,.02);savePrefs()};$('#offset').oninput=e=>setOffset(+e.target.value);$('#keySound').onchange=async e=>{keysEnabled=e.target.checked;savePrefs();if(keysEnabled){try{await initAudio();await loadKeys();if(state==='paused'||state==='playing')keyPlayer.prepare(notes,keyAudioBuffer);else keyPlayer.buffer=keyAudioBuffer;$('#keyAudioMessage').textContent='키음 연주 모드가 준비됐어요.'}catch{keysEnabled=false;e.target.checked=false;savePrefs();$('#keyAudioMessage').textContent='키음을 불러오지 못했어요. 원곡 모드로 재생합니다.'}}if(keyPlayer)keyPlayer.enabled=keysEnabled};$('#keysVolume').oninput=e=>{keysVolume=+e.target.value/100;$('#keysVolText').textContent=e.target.value+'%';if(keyBus&&ctxAudio)keyBus.gain.setTargetAtTime(keysVolume,ctxAudio.currentTime,.02);savePrefs()};
$('#soundTest').onclick=async()=>{try{await initAudio();await loadKeys();keyPlayer.buffer=keyAudioBuffer;const sample=tracks[selected].charts[diff][Math.min(25,tracks[selected].charts[diff].length-1)];keyPlayer.audition(sample[0]);$('#keyAudioMessage').textContent='선택한 곡에서 근사 분리한 키음을 재생했어요.'}catch{$('#keyAudioMessage').textContent='키음을 불러오지 못했어요. 다시 시도해 주세요.'}};
$('#retry').onclick=()=>{$('#resultDialog').close();start({reuseSeed:true})};$('#back').onclick=()=>$('#resultDialog').close();document.querySelectorAll('[data-diff]').forEach(b=>b.onclick=()=>selectDifficulty(+b.dataset.diff));
document.addEventListener('keydown',e=>{
 if(calibration&&e.code==='Space'){e.preventDefault();if(!e.repeat)tapCalibration();return}
 if(remapping!==null){e.preventDefault();if(e.repeat)return;if(e.code==='Escape'){remapping=null;renderBindings();$('#bindingMessage').textContent='키 변경을 취소했어요.';return}assignBinding(e.code);return}
 if(document.querySelector('dialog[open]'))return;
 if(e.code==='F2'){e.preventDefault();if(!e.repeat)openSettings();return}
 if(e.code==='Enter'){e.preventDefault();if(e.repeat)return;if(state==='idle')start();else togglePause();return}
 if(e.code==='Escape'){e.preventDefault();if(state==='celebrating'){finish();return}if(state==='playing')togglePause();else if(state==='paused')finish(true);return}
 if(state==='idle'){if(e.code==='ArrowUp'||e.code==='ArrowDown'){e.preventDefault();selectTrack(selected+(e.code==='ArrowUp'?-1:1))}if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();selectDifficulty(diff+(e.code==='ArrowLeft'?-1:1))}return}
 const lane=bindings.indexOf(e.code);if(lane>=0){e.preventDefault();if(!e.repeat)press(lane)}
});
document.addEventListener('keyup',e=>{const lane=bindings.indexOf(e.code);if(lane>=0)release(lane)});
function bindTouchPads(){document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('down');press(+b.dataset.key)};b.onpointerup=b.onpointercancel=()=>{b.classList.remove('down');release(+b.dataset.key)}})}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')togglePause()});window.addEventListener('blur',()=>{if(state==='playing')togglePause()});

function setOffset(ms){offset=clampOffset(ms)/1000;$('#offset').value=Math.round(offset*1000);$('#offsetText').textContent=(offset>=0?'+':'')+Math.round(offset*1000)+' ms';if(state==='paused'){sessionOffset=offset;timingSamples=[];timingSide='';syncHUD()}savePrefs()}
function stopCalibration(){if(!calibration)return;for(const source of calibration.sources){try{source.stop()}catch{}}calibration=null;$('#calibrateStart').textContent='타이밍 다시 측정';$('#calibrateTap').hidden=true}
async function startCalibration(){stopCalibration();await initAudio();calibrationOffset=null;$('#applyCalibration').hidden=true;const first=ctxAudio.currentTime+.8,ticks=Array.from({length:20},(_,i)=>first+i*.5),sources=[];calibration={ticks,samples:[],used:new Set(),sources,lastBeat:-1};for(let i=0;i<ticks.length;i++)sources.push(tone(i%4===0?1000:750,ticks[i],.055,'sine',.16));$('#calibrateStart').textContent='처음부터 다시 측정';$('#calibrateTap').hidden=false;$('#calibrationMessage').textContent='2박을 들은 뒤 소리에 맞춰 눌러주세요.'}
function tapCalibration(){if(!calibration)return;const c=calibration,now=ctxAudio.currentTime;let index=0;for(let i=1;i<c.ticks.length;i++)if(Math.abs(c.ticks[i]-now)<Math.abs(c.ticks[index]-now))index=i;if(index<2||Math.abs(c.ticks[index]-now)>.24||c.used.has(index))return;c.used.add(index);c.samples.push((now-c.ticks[index])*1000);$('#calibrationMessage').textContent=c.samples.length+' / 18회 측정 · 클릭 소리에 맞춰 계속 눌러주세요.'}
function updateCalibration(){if(!calibration||!ctxAudio)return;const c=calibration,t=ctxAudio.currentTime;$('#calibrateTap').classList.toggle('beat',c.ticks.some(x=>t>=x&&t<x+.1));if(t<c.ticks.at(-1)+.3)return;const summary=summarizeTiming(c.samples);stopCalibration();if(!summary||summary.count<8){$('#calibrationMessage').textContent='측정이 부족해요. 8회 이상 눌러 다시 측정해 주세요.';return}calibrationOffset=clampOffset(summary.median);$('#calibrationMessage').textContent=summary.count+'회 측정 · 권장 '+(calibrationOffset>=0?'+':'')+calibrationOffset+' ms · 입력 편차 '+summary.spread.toFixed(1)+' ms';$('#applyCalibration').hidden=false}
$('#noteSkin').onchange=e=>{if(!NOTE_SKINS.includes(e.target.value))return;noteSkin=e.target.value;setVisualPreview('PLAY');savePrefs()};$('#hitStyle').onchange=e=>{if(!HIT_STYLES.includes(e.target.value))return;hitStyle=e.target.value;hitEffects=[];setVisualPreview('PLAY');savePrefs()};$('#previewHit').onclick=()=>{previewAt=performance.now()};$('#audioMode').onchange=e=>changeAudioMode(e.target.value);$('#effectStrength').onchange=e=>{if(!Object.hasOwn(EFFECT_STRENGTHS,e.target.value))return;effectStrength=e.target.value;previewAt=performance.now();savePrefs()};document.querySelectorAll('[data-effect-preview]').forEach(button=>button.onclick=()=>setVisualPreview(button.dataset.effectPreview));
$('#offsetMinus').onclick=()=>setOffset(offset*1000-1);$('#offsetPlus').onclick=()=>setOffset(offset*1000+1);$('#offsetReset').onclick=()=>setOffset(0);$('#calibrateStart').onclick=startCalibration;$('#calibrateTap').onpointerdown=e=>{e.preventDefault();tapCalibration()};$('#applyCalibration').onclick=()=>{if(calibrationOffset===null)return;setOffset(calibrationOffset);$('#calibrationMessage').textContent='보정값을 저장했어요. 실제 플레이의 FAST/SLOW도 확인해 주세요.';$('#applyCalibration').hidden=true};$('#applyResultOffset').onclick=()=>{if(resultOffset===null)return;setOffset(resultOffset);$('#applyResultOffset').textContent='보정 '+(resultOffset>=0?'+':'')+resultOffset+' ms 저장 완료';$('#applyResultOffset').hidden=true};

document.querySelectorAll('[data-keymode]').forEach(b=>b.onclick=()=>setKeyMode(+b.dataset.keymode));
$('#eightColorPreset').onchange=e=>{
 const preset=EIGHT_COLOR_PRESETS[e.target.value];if(!preset)return;
 eightNoteColors=preset.colors.slice();syncEightColorSettings();savePrefs();previewAt=performance.now();
};
document.querySelectorAll('[data-eight-color]').forEach(input=>input.oninput=e=>{
 const colors=eightNoteColors.slice();colors[+input.dataset.eightColor]=e.target.value;
 if(!validEightColors(colors))return;eightNoteColors=colors;syncEightColorSettings();savePrefs();
});
$('#resetEightColors').onclick=()=>{eightNoteColors=EIGHT_COLOR_PRESETS.CLASSIC.colors.slice();syncEightColorSettings();savePrefs()};
loadPrefs();applyReadability();applyGearSkin();syncEightColorSettings();$('#effectStrength').value=effectStrength;$('#audioMode').value=audioMode;refreshAudioInfo();$('#noteSkin').value=noteSkin;$('#hitStyle').value=hitStyle;$('#speed').value=speed;$('#volume').value=volume*100;$('#offset').value=offset*1000;$('#keySound').checked=keysEnabled;$('#keysVolume').value=keysVolume*100;$('#keysVolText').textContent=Math.round(keysVolume*100)+'%';$('#volText').textContent=Math.round(volume*100)+'%';$('#offsetText').textContent=Math.round(offset*1000)+' ms';renderBindings();refresh();requestAnimationFrame(draw);
