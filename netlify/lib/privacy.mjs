export const THREE_YEARS=3*365*86400000;
export const expired=(createdAt,now=Date.now())=>Number.isFinite(createdAt)&&createdAt<=now-THREE_YEARS;
export async function isDeleted(store,id){return id?!!await store.get('deleted/'+id,{type:'json'}):false}
export function belongs(key,data,id){return key==='players/'+id||key==='rates/'+id||key.startsWith('badges/'+id+'/')||key.startsWith('scores/')&&key.endsWith('/'+id)||data?.playerId===id||data?.player_id===id||key.startsWith('names/')&&data?.owner===id}
export async function markDeletion(store,id,now=Date.now()){
 await store.setJSON('deleted/'+id,{playerId:id,createdAt:now,expiresAt:now+THREE_YEARS},{onlyIfNew:true});
}
export async function erasePlayer(store,id,{limit=100,deadline=Date.now()+15000}={}){
 let removed=0,complete=true;const {blobs}=await store.list({prefix:''});
 for(const {key} of blobs){
  if(key.startsWith('deleted/'))continue;
  if(Date.now()>deadline){complete=false;break}
  const data=await store.get(key,{type:'json'});
  if(belongs(key,data,id)){if(removed>=limit){complete=false;break}await store.delete(key);removed++}
 }
 return {removed,complete};
}
export async function cleanupPrivacy(store,{now=Date.now(),budgetMs=20000}={}){
 const deadline=Date.now()+budgetMs;let removed=0,marked=0;const {blobs}=await store.list({prefix:''});
 // Continue unfinished account deletion before routine expiration.
 for(const {key} of blobs.filter(x=>x.key.startsWith('deleted/'))){
  if(Date.now()>deadline)return {removed,marked,partial:true};
  const id=key.slice(8),r=await erasePlayer(store,id,{limit:100,deadline});removed+=r.removed;
  if(!r.complete)return {removed,marked,partial:true};
  const marker=await store.get(key,{type:'json'});if(marker?.expiresAt<=now){await store.delete(key);removed++}
 }
 // Rotate the scan cursor so a large store does not starve later entries.
 const progress=await store.get('ops/privacy-cursor',{type:'json'});const ordered=blobs.filter(x=>!x.key.startsWith('deleted/')&&!x.key.startsWith('ops/')).sort((a,b)=>a.key.localeCompare(b.key));
 let last='';for(const {key} of ordered.filter(x=>!progress?.after||x.key.localeCompare(progress.after)>0)){
  if(Date.now()>deadline){await store.setJSON('ops/privacy-cursor',{after:last||progress?.after||''});return{removed,marked,partial:true}}
  const data=await store.get(key,{type:'json'});last=key;if(!data)continue;
  if((key.startsWith('auth/users/')||key.startsWith('players/'))&&expired(data.createdAt,now)){
   await markDeletion(store,data.playerId||data.id,now);marked++;continue;
  }
  const shouldDelete=key.startsWith('auth/sessions/')&&(data.revoked||data.expiresAt<=now)||
   /^(auth\/rates\/|rates\/)/.test(key)&&data.since<now-86400000||
   key.startsWith('runs/')&&data.expiresAt<=now||key.startsWith('claims/')&&data.at<now-7200000||
   key.startsWith('scores/')&&expired(data.achieved_at,now)||key.startsWith('names/')&&!data.owner;
  if(shouldDelete){await store.delete(key);removed++}
 }
 await store.setJSON('ops/privacy-cursor',{after:''});return {removed,marked,partial:marked>0};
}
