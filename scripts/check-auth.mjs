import assert from 'node:assert/strict';
import {handleAuth} from '../netlify/lib/auth.mjs';
import {handleBlobRanking} from '../netlify/lib/ranking.mjs';
const data=new Map();let v=0;
const store={async get(k){return structuredClone(data.get(k)?.data??null)},async getWithMetadata(k){return structuredClone(data.get(k)??null)},async setJSON(k,d,o={}){const old=data.get(k);if(o.onlyIfNew&&old||o.onlyIfMatch&&old?.etag!==o.onlyIfMatch)return{modified:false};data.set(k,{data:structuredClone(d),etag:String(++v)});return{modified:true}},async list({prefix}){return{blobs:[...data.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))}}};
async function call(action,body,cookie='',origin='https://pulse.test'){
 const r=await handleAuth(new Request('https://pulse.test/api/auth/'+action,{method:body?'POST':'GET',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),store);
 return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};
}
const cred={username:'player_19',password:'test-password-long'};
const a=await call('register',cred);assert.equal(a.status,200);
assert(!JSON.stringify(a.data).includes('hash'));assert(!JSON.stringify([...data.values()]).includes(cred.password));
for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/'])assert(a.headers.get('set-cookie').includes(flag));
assert.equal((await call('session',null,a.cookie)).data.authenticated,true);
assert.equal((await call('session')).data.authenticated,false);
assert.equal((await call('register',cred)).status,409);
assert.equal((await call('login',{...cred,password:'incorrect-password'})).status,401);
assert.equal((await call('login',cred,'','https://evil.test')).status,403);
const b=await call('login',cred);assert.equal(b.data.playerId,a.data.playerId);assert.notEqual(b.cookie,a.cookie);
const profile=await handleBlobRanking(new Request('https://pulse.test/api/ranking/profile',{method:'POST',headers:{Origin:'https://pulse.test',Cookie:b.cookie},body:JSON.stringify({nickname:'회원테스트'})}),store);assert.equal(profile.status,200);assert.equal((await profile.json()).playerId,a.data.playerId);
assert.equal((await call('session',null,b.cookie)).data.nickname,'회원테스트');
assert.equal((await handleBlobRanking(new Request('https://pulse.test/api/ranking/profile',{method:'POST',headers:{Cookie:b.cookie},body:'{"nickname":"공격테스트"}'}),store)).status,403);
await call('logout',{},b.cookie);assert.equal((await call('session',null,b.cookie)).data.authenticated,false);
const old=Date.now;Date.now=()=>old()+8*86400000;assert.equal((await call('session',null,a.cookie)).data.authenticated,false);Date.now=old;
for(let i=0;i<13;i++)await call('login',{username:'rate_user',password:'test-password-long'});
assert.equal((await call('login',{username:'rate_user',password:'test-password-long'})).status,429);
console.log('PASS account signup/login, wrong credentials, secure cookie, stable ranking identity, nickname, CSRF, logout, expiry, rate limits, no plaintext passwords');
