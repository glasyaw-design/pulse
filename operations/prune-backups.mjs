import fs from 'node:fs';
import path from 'node:path';
import {decrypt} from './backup-core.mjs';
import {THREE_YEARS} from '../netlify/lib/privacy.mjs';
const [directory,flag]=process.argv.slice(2);
try{
 if(!directory||flag&&!['--apply'].includes(flag))throw Error('Usage: node operations/prune-backups.mjs BACKUP_DIRECTORY [--apply]');
 const password=process.env.PULSE_BACKUP_PASSPHRASE;if(!password)throw Error('Set the backup passphrase locally');
 const expired=[];for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  if(!entry.isFile()||!entry.name.endsWith('.pulsebackup'))continue;
  const file=path.join(directory,entry.name),snapshot=decrypt(fs.readFileSync(file,'utf8'),password),created=Date.parse(snapshot.createdAt);
  if(!Number.isFinite(created))throw Error('Invalid backup timestamp; no files deleted');
  if(created<=Date.now()-THREE_YEARS)expired.push(file);
 }
 console.log(JSON.stringify({mode:flag==='--apply'?'delete-expired':'dry-run',expired:expired.map(f=>path.basename(f))}));
 if(flag==='--apply')for(const file of expired)fs.unlinkSync(file);
}catch(e){console.error(e.message);process.exitCode=1}
