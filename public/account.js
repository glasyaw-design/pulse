'use strict';
(()=>{
 const $=s=>document.querySelector(s);let mode='pending',user=null,form='login',busy=false,sequence=0;
 const dialog=$('#accountDialog');
 async function api(action,body){
  const r=await fetch('/api/auth/'+action,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
  let data;try{data=await r.json()}catch{throw Error('계정 서버를 사용할 수 없습니다. 게스트로 시작해 주세요.')}
  if(!r.ok)throw Error(data.error||'계정 요청에 실패했습니다.');return data;
 }
 function notify(){window.dispatchEvent(new CustomEvent('pulse-account-change',{detail:{mode,user}}));$('#accountMenu').textContent=mode==='member'?'계정 · '+user.username:'로그인 / 회원가입'}
 function enter(next,data=null){mode=next;user=data;$('#accountPassword').value='';dialog.close();notify()}
 function show(){if(busy)return;sequence++;$('#accountPassword').value='';$('#accountStatus').textContent='';$('#accountLogout').hidden=mode!=='member';$('#accountGuest').hidden=mode==='member';$('#accountContinue').hidden=mode!=='member';if(!dialog.open)dialog.showModal()}
 function tab(next){form=next;$('#accountSubmit').textContent=next==='register'?'회원가입하고 시작':'로그인';$('#accountPassword').autocomplete=next==='register'?'new-password':'current-password';document.querySelectorAll('[data-account-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.accountTab===next)));$('#accountStatus').textContent=next==='register'?'가입 후 게임에서 랭킹 닉네임을 설정합니다.':''}
 function lock(on){busy=on;$('#accountSubmit').disabled=on;$('#accountGuest').disabled=on;$('#accountLogout').disabled=on;document.querySelectorAll('[data-account-tab]').forEach(b=>b.disabled=on)}
 $('#accountForm').onsubmit=async e=>{
  e.preventDefault();if(busy)return;sequence++;lock(true);$('#accountStatus').textContent='처리 중…';
  try{const data=await api(form,{username:$('#accountUsername').value,password:$('#accountPassword').value});enter('member',data)}
  catch(error){$('#accountStatus').textContent=error.message}
  finally{lock(false)}
 };
 $('#accountGuest').onclick=()=>{if(busy)return;sequence++;enter('guest')};
 $('#accountContinue').onclick=()=>dialog.close();
 $('#accountLogout').onclick=async()=>{if(busy)return;sequence++;lock(true);try{await api('logout',{});mode='pending';user=null;notify();$('#accountLogout').hidden=true;$('#accountContinue').hidden=true;$('#accountGuest').hidden=false;$('#accountStatus').textContent='로그아웃했습니다.'}catch(e){$('#accountStatus').textContent=e.message}finally{lock(false)}};
 $('#accountMenu').onclick=()=>{if(document.body.classList.contains('is-playing'))return;show()};
 document.querySelectorAll('[data-account-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.accountTab));
 dialog.addEventListener('cancel',e=>{if(mode==='pending'||busy)e.preventDefault()});
 window.PulseAccount={ready:()=>mode!=='pending',isMember:()=>mode==='member',scope:()=>mode==='member'?'member-'+user.playerId:'guest',show};
 show();tab('login');
 const request=sequence;
 api('session').then(data=>{if(request!==sequence||mode!=='pending')return;if(data.authenticated)enter('member',data)}).catch(()=>{if(request===sequence)$('#accountStatus').textContent='로그인 서버에 연결하지 못했어요. 게스트로 플레이할 수 있습니다.'});
})();
