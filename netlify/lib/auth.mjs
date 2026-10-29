import {randomBytes,scrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt),TTL=7*86400000,COOKIE='__Host-pulse-session';
const digest=v=>createHash('sha256').update(v).digest('hex');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const reply=(data,status=200,cookie)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
const cookie=(token,age=TTL/1000)=>COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+age;
function tokenOf(request){return request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)}
export async function accountSession(request,store){
 const token=tokenOf(request);if(!/^[a-f0-9]{64}$/.test(token||''))return null;
 const session=await store.get('auth/sessions/'+digest(token),{type:'json'});
 return session&&session.expiresAt>Date.now()&&!session.revoked?session:null;
}
async function rate(store,key,max){
 const path='auth/rates/'+digest(key),now=Date.now();
 for(let i=0;i<10;i++){
  const old=await store.getWithMetadata(path,{type:'json'}),r=old?.data?.since>now-600000?old.data:{since:now,count:0};
  if(r.count>=max)fail('시도가 많아요. 10분 후 다시 시도해 주세요.',429);
  const result=await store.setJSON(path,{since:r.since,count:r.count+1},old?{onlyIfMatch:old.etag}:{onlyIfNew:true});
  if(result.modified)return;
 }fail('잠시 후 다시 시도해 주세요.',503);
}
async function passwordHash(password,salt){return Buffer.from(await derive(password,salt,32,{N:32768,r:8,p:3,maxmem:64*1024*1024})).toString('hex')}
export async function handleAuth(request,store){
 try{
  const url=new URL(request.url),action=url.pathname.split('/').at(-1);
  if(action==='session'&&request.method==='GET'){
   const session=await accountSession(request,store);if(!session)return reply({authenticated:false});
   const player=await store.get('players/'+session.playerId,{type:'json'});
   return reply({authenticated:true,username:session.username,playerId:session.playerId,nickname:player?.nickname||''});
  }
  if(request.method!=='POST')fail('지원하지 않는 요청입니다.',405);
  if(request.headers.get('origin')!==url.origin)fail('게임 홈페이지에서 다시 시도해 주세요.',403);
  if(action==='logout'){
   const token=tokenOf(request);
   if(/^[a-f0-9]{64}$/.test(token||''))await store.setJSON('auth/sessions/'+digest(token),{revoked:true,expiresAt:0});
   return reply({ok:true},200,cookie('',0));
  }
  if(!['login','register'].includes(action))fail('요청을 찾을 수 없습니다.',404);
  const text=await request.text();if(text.length>2048)fail('요청이 너무 큽니다.',413);
  let body;try{body=JSON.parse(text)}catch{fail('입력을 확인해 주세요.')}
  const username=typeof body.username==='string'?body.username.toLowerCase().trim():'',password=body.password;
  if(!/^[a-z0-9_]{3,24}$/.test(username))fail('아이디는 영문 소문자·숫자·_로 3~24자입니다.');
  if(typeof password!=='string'||password.length<10||password.length>128)fail('비밀번호는 10~128자로 입력해 주세요.');
  const ip=request.headers.get('x-nf-client-connection-ip')||'unknown';
  await rate(store,'ip:'+ip,60);await rate(store,'account:'+username,12);
  const path='auth/users/'+username;let user=await store.get(path,{type:'json'});
  if(action==='register'){
   if(user)fail('사용할 수 없는 아이디입니다.',409);
   const salt=randomBytes(16).toString('hex'),hash=await passwordHash(password,salt),playerId=randomBytes(32).toString('hex');
   user={username,salt,hash,playerId,createdAt:Date.now()};
   const made=await store.setJSON(path,user,{onlyIfNew:true});if(!made.modified)fail('사용할 수 없는 아이디입니다.',409);
  }else{
   const actual=await passwordHash(password,user?.salt||'00000000000000000000000000000000');
   const expected=user?.hash||'0'.repeat(64);
   if(!timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'))||!user)fail('아이디 또는 비밀번호가 맞지 않습니다.',401);
  }
  // Idempotent repair if a prior signup stopped after creating the credential.
  await store.setJSON('players/'+user.playerId,{id:user.playerId,nickname:'',nicknameKey:null,createdAt:user.createdAt,account:true},{onlyIfNew:true});
  const token=randomBytes(32).toString('hex');
  await store.setJSON('auth/sessions/'+digest(token),{playerId:user.playerId,username,expiresAt:Date.now()+TTL},{onlyIfNew:true});
  const player=await store.get('players/'+user.playerId,{type:'json'});
  return reply({authenticated:true,username,playerId:user.playerId,nickname:player?.nickname||''},200,cookie(token));
 }catch(e){if(!e.status)console.error('auth_failed',e.name);return reply({error:e.status?e.message:'계정 서버에 연결하지 못했어요. 게스트로 플레이할 수 있습니다.'},e.status||500)}
}
