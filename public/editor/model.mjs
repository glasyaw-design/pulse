export const FORMAT='pulse-studio';
export function blank(keyCount=5){return{format:FORMAT,version:2,keyCount,title:'Untitled Session',bpm:120,offset:0,duration:120,music:null,samples:[{id:'tone',name:'기준음 · C5',builtin:'tone'}],notes:[]}}
export function step(project,snap){return snap?60/project.bpm/snap:0}
export function quantize(time,project,snap){const s=step(project,snap);return Math.max(0,s?Math.round((time-project.offset)/s)*s+project.offset:time)}
export function overlaps(notes,n,ignore=new Set()){return notes.some(x=>!ignore.has(x.id)&&x.lane===n.lane&&Math.max(x.time,n.time)<Math.min(x.time+Math.max(.012,x.duration),n.time+Math.max(.012,n.duration))-.0001)}
export function validate(raw){
 if(!raw||raw.format!==FORMAT||![1,2].includes(raw.version))throw Error('PULSE Studio 프로젝트 파일이 아닙니다.');
 const keyCount=raw.keyCount??5;if(![4,5,6,8].includes(keyCount))throw Error('지원하지 않는 키 모드입니다.');
 const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 if(!finite(raw.bpm,20,400)||!finite(raw.offset,-30,600)||!finite(raw.duration,1,3600))throw Error('BPM 또는 곡 길이가 올바르지 않습니다.');
 if(!Array.isArray(raw.notes)||raw.notes.length>30000||!Array.isArray(raw.samples)||raw.samples.length>256)throw Error('노트 또는 키음 개수가 허용 범위를 넘었습니다.');
 const asset=a=>a&&typeof a.name==='string'&&a.name.length<=200&&(typeof a.data==='string'&&/^data:(audio\/[a-z0-9.+-]+|application\/octet-stream);base64,[a-z0-9+/=]*$/i.test(a.data)||typeof a.url==='string'&&/^\/audio\/[a-zA-Z0-9_-]+\.mp3$/.test(a.url));
 if(raw.music&&!asset(raw.music))throw Error('배경음악 데이터가 올바르지 않습니다.');
 const ids=new Set();for(const s of raw.samples){if(typeof s.id!=='string'||ids.has(s.id)||!(s.id==='tone'&&s.builtin==='tone'||asset(s)))throw Error('키음 데이터가 올바르지 않습니다.');ids.add(s.id)}
 const noteIds=new Set();for(const n of raw.notes){if(typeof n.id!=='string'||noteIds.has(n.id)||!finite(n.time,0,3600)||!Number.isInteger(n.lane)||!finite(n.lane,0,keyCount-1)||!finite(n.duration,0,120)||n.time+n.duration>3600||!finite(n.pitch,-24,24)||!Number.isInteger(n.pitch)||!finite(n.gain,0,2)||n.sample!==null&&!ids.has(n.sample))throw Error('노트 데이터가 올바르지 않습니다.');noteIds.add(n.id)}
 if(typeof raw.title!=='string'||raw.title.length>100)throw Error('곡 제목이 올바르지 않습니다.');
 // Reconstruct only known fields; imported data never becomes markup or executable code.
 const assetCopy=a=>a?{name:a.name,...(a.data?{data:a.data}:{url:a.url})}:null;
 return{format:FORMAT,version:2,keyCount,title:raw.title,bpm:raw.bpm,offset:raw.offset,duration:raw.duration,music:assetCopy(raw.music),samples:raw.samples.map(s=>s.builtin==='tone'?{id:'tone',name:'기준음 · C5',builtin:'tone'}:{id:s.id,...assetCopy(s)}),notes:raw.notes.map(n=>({id:n.id,time:n.time,lane:n.lane,duration:n.duration,sample:n.sample,pitch:n.pitch,gain:n.gain})).sort((a,b)=>a.time-b.time||a.lane-b.lane)}
}
export function move(notes,selected,dt,dl,keyCount=5){const chosen=notes.filter(n=>selected.has(n.id));if(!chosen.length)return notes;const timeDelta=Math.max(dt,-Math.min(...chosen.map(n=>n.time))),laneDelta=Math.max(-Math.min(...chosen.map(n=>n.lane)),Math.min(dl,keyCount-1-Math.max(...chosen.map(n=>n.lane))));const next=notes.map(n=>selected.has(n.id)?{...n,time:Math.round((n.time+timeDelta)*1e6)/1e6,lane:n.lane+laneDelta}:n);if(next.some(n=>n.time+n.duration>3600)||next.some(n=>selected.has(n.id)&&overlaps(next,n,new Set([n.id]))))throw Error('다른 노트와 겹치는 위치로 이동할 수 없습니다.');return next}
