import fs from 'node:fs';
import path from 'node:path';
import {snapshotStore,encrypt,decrypt,restoreEmpty,verifyRestore,applyDeletionLedger} from './backup-core.mjs';
const [command,file,targetName]=process.argv.slice(2),env=process.env;
const password=env.PULSE_BACKUP_PASSPHRASE;
try{
 if(!['backup','inspect','restore','verify'].includes(command)||!file)throw Error('Usage: node operations/data-tool.mjs backup|inspect|restore|verify FILE [pulse-restore-NAME]. See OPERATIONS.html');
 if(!password||password.length<20)throw Error('Set PULSE_BACKUP_PASSPHRASE (20+ characters) locally, never in source control');
 const absolute=path.resolve(file),root=path.resolve('public');
 if(absolute===root||absolute.startsWith(root+path.sep))throw Error('Backup files must stay OUTSIDE the public directory');
 let snapshot=command==='backup'?null:decrypt(fs.readFileSync(absolute,'utf8'),password);
 if(command==='inspect'){console.log(JSON.stringify({format:snapshot.format,createdAt:snapshot.createdAt,records:snapshot.records.length,excluded:snapshot.excluded}));process.exit(0)}
 if(!env.NETLIFY_SITE_ID||!env.NETLIFY_AUTH_TOKEN)throw Error('Configure NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN locally');
 const {getStore}=await import('@netlify/blobs');
 const name=command==='backup'?(env.PULSE_DATA_STORE||'pulse-five-ranking-v1'):targetName;
 if(!name)throw Error('Specify an isolated recovery store name');
 const store=getStore({name,siteID:env.NETLIFY_SITE_ID,token:env.NETLIFY_AUTH_TOKEN,consistency:'strong'});
 if(command==='backup'){
  if(env.PULSE_WRITES_PAUSED!=='yes')throw Error('Pause ALL sites/contexts using this store; then set PULSE_WRITES_PAUSED=yes locally');
  const data=await snapshotStore(store,{siteID:env.NETLIFY_SITE_ID,store:name});
  fs.writeFileSync(absolute,encrypt(data,password),{flag:'wx',mode:0o600});
  const check=decrypt(fs.readFileSync(absolute,'utf8'),password);console.log('Encrypted backup verified:',check.records.length,'records');
 }else if(command==='restore'){
  if(env.PULSE_RESTORE_CONFIRM!==name)throw Error('Set PULSE_RESTORE_CONFIRM to the exact NEW recovery store name');
  const live=getStore({name:snapshot.source.store,siteID:snapshot.source.siteID,token:env.NETLIFY_AUTH_TOKEN,consistency:'strong'});
  const markers=[];for(const {key} of (await live.list({prefix:'deleted/'})).blobs){const marker=await live.get(key,{type:'json'});if(marker)markers.push(marker)}
  snapshot=applyDeletionLedger(snapshot,markers);
  console.log(await restoreEmpty(store,snapshot,{siteID:env.NETLIFY_SITE_ID,store:name}));
 }else {
  const live=getStore({name:snapshot.source.store,siteID:snapshot.source.siteID,token:env.NETLIFY_AUTH_TOKEN,consistency:'strong'});const markers=[];for(const {key} of (await live.list({prefix:'deleted/'})).blobs){const marker=await live.get(key,{type:'json'});if(marker)markers.push(marker)}
  console.log(await verifyRestore(store,applyDeletionLedger(snapshot,markers)));
 }
}catch(error){console.error('Operation failed:',error.message);process.exitCode=1}
