'use strict';
function drawMobileStage(now,t,track){
 const line=H*.84,top=H*.06,travel=3.9/speed;
 const edge=(u,p)=>W/2+(u-.5)*(W-18)*(.84+.16*p);
 const yy=p=>top+(line-top)*p;
 function quad(l,r,p1,p2,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(edge(l,p1),yy(p1));ctx.lineTo(edge(r,p1),yy(p1));ctx.lineTo(edge(r,p2),yy(p2));ctx.lineTo(edge(l,p2),yy(p2));ctx.closePath();ctx.fill()}
 ctx.clearRect(0,0,W,H);
 for(let lane=0;lane<4;lane++){quad(lane/4,(lane+1)/4,0,1.18,lane%2?'#152331e8':'#1b2d3ce8');if(held[lane])quad(lane/4,(lane+1)/4,.92,1.04,'#9cf5da25')}
 ctx.lineWidth=1;for(let i=0;i<=4;i++){ctx.strokeStyle=i===0||i===4?'#a8dace':'#b3d3e640';ctx.beginPath();ctx.moveTo(edge(i/4,0),top);ctx.lineTo(edge(i/4,1.18),yy(1.18));ctx.stroke()}
 for(let i=pendingNoteStart();i<notes.length;i++){const n=notes[i];if(n.time>t+travel)break;if(n.status===2)continue;const head=n.status===1?1:1-(n.time-t)/travel;if(head<0||head>1.15)continue;const tail=Math.max(0,1-(n.time+n.dur-t)/travel),l=(n.lane+.06)/4,r=(n.lane+.94)/4;
 if(n.dur)quad(l,r,tail,head,n.status===1?'#92f1cfa0':'#56bdb578');
 const y=yy(head),x=edge(l,head),w=edge(r,head)-x,h=18+2*Math.min(1,head),y0=y-h/2;
 const gloss=ctx.createLinearGradient(0,y0,0,y0+h);
 const palette=n.dur?['#edfff5','#b0f0d4','#64b99e','#408b80']:['#ffffff','#dde5ff','#a5b8e5','#718dbf'];
 gloss.addColorStop(0,palette[0]);gloss.addColorStop(.42,palette[1]);gloss.addColorStop(.48,palette[2]);gloss.addColorStop(1,palette[3]);
 ctx.fillStyle='#060e20a0';ctx.beginPath();ctx.roundRect(x,y0+2,w,h,4);ctx.fill();
 ctx.fillStyle=gloss;ctx.beginPath();ctx.roundRect(x,y0,w,h,4);ctx.fill();
 ctx.strokeStyle=n.dur?'#c4ffe5':'#e8efff';ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle='#ffffffa6';ctx.fillRect(x+5,y0+2,Math.max(1,w-10),2);
 }
 ctx.strokeStyle='#d6fff0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(9,line);ctx.lineTo(W-9,line);ctx.stroke();ctx.fillStyle='#9be5d830';ctx.fillRect(9,line+4,W-18,5);
 for(let lane=0;lane<4;lane++){const x=edge((lane+.5)/4,1);if(t<3){ctx.fillStyle='#d2e7e4';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(String(lane+1),x,line+24)}const hit=hitEffects.findLast(h=>h.lane===lane&&now-h.at<180);if(hit){const a=1-(now-hit.at)/180;ctx.globalAlpha=a;ctx.strokeStyle='#c1ffe9';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,line,24,7,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}}
 hitEffects=hitEffects.filter(h=>now-h.at<420);
 ctx.textAlign='center';if(combo>1){ctx.fillStyle='#e3f6ee';ctx.font='700 '+Math.round(Math.min(44,H*.13))+'px PulseMaple30,sans-serif';ctx.fillText(combo,W*.80,H*.29);ctx.font='10px sans-serif';ctx.fillStyle='#b5c9d3';ctx.fillText('COMBO',W*.80,H*.29+17)}
 if(now-judgeAt<400){ctx.fillStyle=['MISS','FAIL'].includes(judgement)?'#f6a598':'#d0ffea';ctx.font='700 20px PulseMaple30,sans-serif';ctx.fillText(judgement,W/2,line-42)}
 if(state==='celebrating'&&completion)paintCompletion(ctx,completion.label,now-completion.at,W,H,effectStrength);
 $('#countdown').hidden=t>=0;if(t<0)$('#countdown b').textContent=Math.ceil(-t);$('#progress').style.width=Math.max(0,Math.min(100,t/track.duration*100))+'%';setPlayText('#playTime',formatTime(t)+' / '+formatTime(track.duration));
}
