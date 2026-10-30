import {belongs,THREE_YEARS} from '../netlify/lib/privacy.mjs';
import {randomBytes,scryptSync,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
const allowed=/^(auth\/users\/|players\/|names\/|scores\/|badges\/|deleted\/)/;
const hash=b=>createHash('sha256').update(b).digest('hex');
const canonical=o=>JSON.stringify(o);
export function validate(snapshot){
 if(snapshot?.format!=='pulse-backup-v1'||!snapshot.source?.siteID||!snapshot.source?.store||!Array.isArray(snapshot.records))throw Error('Invalid backup format');
 const keys=new Set();
 for(const r of snapshot.records){
  if(typeof r.key!=='string'||!allowed.test(r.key)||keys.has(r.key)||r.data===null||typeof r.data!=='object'||Array.isArray(r.data))throw Error('Invalid backup record');
  keys.add(r.key);if(hash(canonical(r.data))!==r.sha256)throw Error('Record integrity check failed');
 }
 return snapshot;
}
async function scan(store){
 const {blobs}=await store.list();const records=[];
 for(const {key} of blobs.filter(x=>allowed.test(x.key)).sort((a,b)=>a.key.localeCompare(b.key))){
  const result=await store.getWithMetadata(key,{type:'json'});
  if(!result?.data)throw Error('Source changed while reading; keep writes paused and retry');
  records.push({key,data:result.data,metadata:result.metadata||{},sha256:hash(canonical(result.data)),etag:result.etag});
 }
 return records;
}
export async function snapshotStore(store,source){
 const first=await scan(store),second=await scan(store);
 if(canonical(first)!==canonical(second))throw Error('Source changed during backup; pause writes and retry');
 return validate({format:'pulse-backup-v1',createdAt:new Date().toISOString(),source,excluded:['auth/sessions/','auth/rates/','rates/','runs/','claims/'],records:first});
}
export function encrypt(snapshot,password){
 validate(snapshot);if(typeof password!=='string'||password.length<20)throw Error('Use a unique backup passphrase of at least 20 characters');
 const salt=randomBytes(16),iv=randomBytes(12),key=scryptSync(password,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('pulse-encrypted-v1'));
 const data=Buffer.concat([cipher.update(canonical(snapshot),'utf8'),cipher.final()]);
 return JSON.stringify({format:'pulse-encrypted-v1',salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')});
}
export function decrypt(text,password){
 const e=JSON.parse(text);if(e.format!=='pulse-encrypted-v1')throw Error('Unknown encrypted backup format');
 const salt=Buffer.from(e.salt,'base64'),iv=Buffer.from(e.iv,'base64'),tag=Buffer.from(e.tag,'base64');
 if(salt.length!==16||iv.length!==12||tag.length!==16)throw Error('Invalid encryption parameters');
 const key=scryptSync(password,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(Buffer.from(e.format));decipher.setAuthTag(tag);
 return validate(JSON.parse(Buffer.concat([decipher.update(Buffer.from(e.data,'base64')),decipher.final()]).toString('utf8')));
}
export async function verifyRestore(store,snapshot){
 validate(snapshot);const {blobs}=await store.list();if(blobs.length!==snapshot.records.length)throw Error('Restored record count mismatch');
 for(const r of snapshot.records){const actual=await store.getWithMetadata(r.key,{type:'json'});if(!actual||hash(canonical(actual.data))!==r.sha256||canonical(actual.metadata||{})!==canonical(r.metadata||{}))throw Error('Restored content mismatch');}
 return {verified:snapshot.records.length};
}
export async function restoreEmpty(store,snapshot,target){
 validate(snapshot);
 if(target.siteID===snapshot.source.siteID&&target.store===snapshot.source.store)throw Error('Restore into a NEW isolated store; source overwrite is forbidden');
 if(!target.store?.startsWith('pulse-restore-'))throw Error('Recovery store must start with pulse-restore-');
 if((await store.list()).blobs.length)throw Error('Recovery store is not empty; nothing written');
 for(const r of snapshot.records){const made=await store.setJSON(r.key,r.data,{onlyIfNew:true,metadata:r.metadata||{}});if(!made.modified)throw Error('Concurrent write detected; recovery incomplete, do not activate this store');}
 return verifyRestore(store,snapshot);
}

export function applyDeletionLedger(snapshot,markers,now=Date.now()){
 validate(snapshot);
 if(!Number.isFinite(Date.parse(snapshot.createdAt))||Date.parse(snapshot.createdAt)<=now-THREE_YEARS)throw Error('Backup exceeds the three-year retention limit');
 const copy=structuredClone(snapshot),ids=new Set(markers.map(x=>x.playerId));
 copy.records=copy.records.filter(r=>r.key.startsWith('deleted/')||![...ids].some(id=>belongs(r.key,r.data,id)));
 for(const marker of markers){
  const key='deleted/'+marker.playerId;copy.records=copy.records.filter(r=>r.key!==key);
  copy.records.push({key,data:marker,metadata:{},sha256:hash(canonical(marker))});
 }
 return validate(copy);
}
