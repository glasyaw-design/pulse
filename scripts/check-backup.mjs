import assert from 'node:assert/strict';
import {snapshotStore,encrypt,decrypt,restoreEmpty,verifyRestore} from '../operations/backup-core.mjs';
import {maintenanceResponse,dataStoreName} from '../netlify/lib/operations.mjs';
class MemoryStore{
 constructor(){this.rows=new Map()}
 async list(){return {blobs:[...this.rows.keys()].map(key=>({key}))}}
 async getWithMetadata(k){return this.rows.get(k)||null}
 async setJSON(k,data,options={}){if(options.onlyIfNew&&this.rows.has(k))return{modified:false};this.rows.set(k,{data:structuredClone(data),metadata:options.metadata||{},etag:'e'+this.rows.size});return{modified:true}}
}
const src=new MemoryStore();
for(const [k,v] of Object.entries({'auth/users/test':{hash:'scrypt-hash',salt:'salt',playerId:'id'},'players/id':{nickname:'tester'},'names/tester':{owner:'id'},'scores/chart/STANDARD/NORMAL/id':{score:100},'badges/id/chart':{value:3},'auth/sessions/secret':{expiresAt:999},'runs/run':{playerId:'id'},'rates/id':{count:2},'claims/run':{playerId:'id'}}))await src.setJSON(k,v);
const snapshot=await snapshotStore(src,{siteID:'test-site',store:'production'});assert.equal(snapshot.records.length,5);
const pass='test-only-passphrase-long-enough';const encrypted=encrypt(snapshot,pass);assert(!encrypted.includes('scrypt-hash'));
const recovered=decrypt(encrypted,pass);assert.deepEqual(recovered,snapshot);
assert.throws(()=>decrypt(encrypted,'wrong-password-at-least20'));
const changed=JSON.parse(encrypted);changed.data=(changed.data[0]==='A'?'B':'A')+changed.data.slice(1);assert.throws(()=>decrypt(JSON.stringify(changed),pass));
const dst=new MemoryStore();await restoreEmpty(dst,recovered,{siteID:'test-site',store:'pulse-restore-drill'});assert.equal((await verifyRestore(dst,snapshot)).verified,5);
assert(!dst.rows.has('auth/sessions/secret'));
await assert.rejects(restoreEmpty(dst,recovered,{siteID:'test-site',store:'pulse-restore-drill'}),/not empty/);
await assert.rejects(restoreEmpty(new MemoryStore(),recovered,{siteID:'test-site',store:'production'}),/overwrite/);
const mutated=structuredClone(recovered);mutated.records[0].data.extra=true;await assert.rejects(restoreEmpty(new MemoryStore(),mutated,{siteID:'test-site',store:'pulse-restore-drill'}),/integrity/);
const race=new MemoryStore();race.rows=new Map(src.rows);const list=race.list.bind(race);let scans=0;race.list=async()=>{if(++scans===2)race.rows.delete('players/id');return list()};await assert.rejects(snapshotStore(race,{siteID:'test',store:'test'}),/changed/);
process.env.PULSE_MAINTENANCE='1';assert.equal(maintenanceResponse().status,503);delete process.env.PULSE_MAINTENANCE;assert.equal(maintenanceResponse(),null);assert.equal(dataStoreName(),'pulse-five-ranking-v1');process.env.PULSE_DATA_STORE='pulse-restore-drill';assert.equal(dataStoreName(),'pulse-restore-drill');delete process.env.PULSE_DATA_STORE;
console.log('PASS encrypted backup round-trip, tampering/wrong password, recovery content, transient exclusion, overwrite protection, concurrent mutation and maintenance config (mock storage)');
