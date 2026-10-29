'use strict';
const NOTE_SKINS=['BAR','CIRCLE'],HIT_STYLES=['LASER','RING','SPARK','OFF'];
let VISUAL_KEY_COUNT=5;
function laneColor(lane){return VISUAL_KEY_COUNT%2&&lane===Math.floor(VISUAL_KEY_COUNT/2)?'#f2da7b':Math.min(lane,VISUAL_KEY_COUNT-1-lane)%2?'#6fd5ff':'#e8eff9'}
function circleNoteRadius(width){return Math.max(2,width*.45)}
function paintNoteHead(c,x,y,w,color,skin){
 c.save();
 if(skin==='CIRCLE'){
  const cx=x+w/2,r=circleNoteRadius(w),g=c.createRadialGradient(cx-r*.25,y-r*.35,1,cx,y,r);
  g.addColorStop(0,'#ffffff');g.addColorStop(.28,color);g.addColorStop(.72,color);g.addColorStop(1,'#263f55');
  c.fillStyle='#02070e';c.beginPath();c.arc(cx,y,r+1.7,0,Math.PI*2);c.fill();c.fillStyle=g;c.beginPath();c.arc(cx,y,r,0,Math.PI*2);c.fill();
  c.strokeStyle='#ffffffc0';c.lineWidth=1;c.stroke();c.strokeStyle='#10263990';c.lineWidth=1.2;c.beginPath();c.arc(cx,y,r*.57,0,Math.PI*2);c.stroke();
  c.fillStyle='#ffffffb0';c.beginPath();c.arc(cx-r*.28,y-r*.32,r*.17,0,Math.PI*2);c.fill();
 }else{
  const g=c.createLinearGradient(0,y-3.5,0,y+3.5);g.addColorStop(0,'#ffffff');g.addColorStop(.25,color);g.addColorStop(.72,color);g.addColorStop(1,'#384858');
  c.fillStyle=g;c.beginPath();c.roundRect(x,y-3.5,w,7,2);c.fill();c.fillStyle='#ffffffb0';c.fillRect(x+3,y-2.7,w-6,.7);
 }
 c.restore();
}
function paintHitEffects(c,events,now,pad,lw,lineY,style,strength='NORMAL'){
 if(style==='OFF')return;
 const power=EFFECT_STRENGTHS[strength]??1;
 c.save();c.globalCompositeOperation='lighter';
 for(const hit of events){
  const age=now-hit.at,duration=style==='SPARK'?420:style==='RING'?340:240;
  if(age<0||age>=duration)continue;
  const p=age/duration,fade=Math.min(1,(1-p)**2*(hit.strength??1)*power),cx=pad+(hit.lane+.5)*lw,color=laneColor(hit.lane),width=lw*.76;
  c.globalAlpha=fade;c.strokeStyle=color;c.fillStyle=color;c.shadowColor=color;c.shadowBlur=5*power;
  if(style==='LASER'){
   const height=62*(1-p*.35)*Math.sqrt(power),g=c.createLinearGradient(0,lineY-height,0,lineY+5);g.addColorStop(0,color+'00');g.addColorStop(.8,color+'88');g.addColorStop(1,'#ffffff');
   c.fillStyle=g;c.fillRect(cx-width*.45,lineY-height,width*.9,height+5);c.fillStyle='#ffffff';c.fillRect(cx-1.1,lineY-height,2.2,height+7);c.fillRect(cx-width*.5,lineY-1.5,width,3);
  }else if(style==='RING'){
   for(let ring=0;ring<2;ring++){const q=Math.max(0,p-ring*.13),radius=3+q*Math.min(36,lw*.65)*Math.sqrt(power);c.lineWidth=2.2-ring*.7;c.globalAlpha=fade*(ring?.6:1);c.beginPath();c.ellipse(cx,lineY,radius,radius*.72,0,0,Math.PI*2);c.stroke()}
   c.globalAlpha=fade;c.fillStyle='#ffffff';c.beginPath();c.arc(cx,lineY,Math.max(1,5*(1-p)),0,Math.PI*2);c.fill();
  }else if(style==='SPARK'){
   const seconds=age/1000;
   for(let i=0;i<(strength==='LOW'?5:strength==='HIGH'?13:9);i++){
    const rand=(Math.sin((hit.seed+i*13.37)*91.173)*43758.5453)%1,u=rand-Math.floor(rand),vx=(u-.5)*150,vy=-75-(i%4)*34;
    const x=cx+vx*seconds,y=lineY+vy*seconds+180*seconds*seconds;c.lineWidth=i%3===0?2:1.2;
    c.beginPath();c.moveTo(x-vx*.018,y-(vy+360*seconds)*.018);c.lineTo(x,y);c.stroke();c.fillRect(x-1,y-1,i%3===0?2.5:1.6,i%3===0?2.5:1.6);
   }
   c.fillStyle='#ffffff';c.fillRect(cx-width*.35,lineY-1,width*.7,2);
  }
  if(hit.kind==='hold-end'){c.globalAlpha=fade;c.strokeStyle=color;c.lineWidth=2*Math.sqrt(power);c.beginPath();const radius=4+p*Math.min(42,lw*.62);c.ellipse(cx,lineY,radius,radius*.66,0,0,Math.PI*2);c.stroke()}
 }
 c.restore();
}

const EFFECT_STRENGTHS={LOW:.45,NORMAL:1,HIGH:1.4},CELEBRATION_MS=2600;
function achievementFor(judgments,total){if(!Number.isInteger(total)||total<=0||judgments.length!==5||judgments.reduce((a,b)=>a+b,0)!==total||judgments[3]+judgments[4]>0)return null;return judgments[0]===total?'ALL PERFECT':'FULL COMBO'}
function paintHoldBody(c,x,top,bottom,width,color,now,strength='NORMAL'){
 if(bottom<=top)return;const power=EFFECT_STRENGTHS[strength]??1,pulse=.65+Math.sin(now/135)*.15;
 c.save();c.beginPath();c.rect(x,top,width,bottom-top);c.clip();c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(.7,.32*power*pulse);c.fillStyle=color;c.fillRect(x,top,width,bottom-top);
 c.globalAlpha=Math.min(.9,.64*power);const phase=(now*.095)%30;
 for(let y=bottom-phase;y>top-6;y-=30){const g=c.createLinearGradient(0,y-5,0,y+3);g.addColorStop(0,color+'00');g.addColorStop(.7,'#ffffff');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x+1,y-5,Math.max(1,width-2),8)}
 c.globalAlpha=Math.min(.85,.48*power*pulse);c.fillStyle='#ffffff';c.fillRect(x+width/2-.7,top,1.4,bottom-top);c.restore();
}
function paintHoldAnchor(c,cx,y,width,color,now,skin,strength='NORMAL'){
 const power=EFFECT_STRENGTHS[strength]??1,pulse=(Math.sin(now/120)+1)/2;c.save();c.globalAlpha=Math.min(.7,(.22+pulse*.18)*power);c.strokeStyle=color;c.shadowColor=color;c.shadowBlur=8*power;c.lineWidth=1.2;
 c.beginPath();const rx=skin==='CIRCLE'?Math.min(width/2,circleNoteRadius(width)+2+pulse*2):width*.43,ry=skin==='CIRCLE'?rx:6+pulse*2;c.ellipse(cx,y,rx,ry,0,0,Math.PI*2);c.stroke();c.restore();
}
function paintCompletion(c,label,age,width,height,strength='NORMAL'){
 if(age<0||age>CELEBRATION_MS)return;const power=EFFECT_STRENGTHS[strength]??1,p=age/CELEBRATION_MS,reveal=Math.min(1,age/280),fade=Math.min(1,(CELEBRATION_MS-age)/350),gold=label==='ALL PERFECT',color=gold?'#ffe7a1':'#8fe6ff',cy=height*.46;
 c.save();c.globalAlpha=reveal*fade;
 // A single upward sweep, no repeated full-screen flashes.
 const beamY=height*(1.25-p*1.65),beamHeight=height*.32;
 for(const x of [2,width-5]){const g=c.createLinearGradient(0,beamY-beamHeight,0,beamY);g.addColorStop(0,color+'00');g.addColorStop(.75,color);g.addColorStop(1,'#ffffff');c.fillStyle=g;c.shadowColor=color;c.shadowBlur=12*power;c.fillRect(x,beamY-beamHeight,3,beamHeight)}
 c.shadowBlur=0;const band=c.createLinearGradient(0,0,width,0);band.addColorStop(0,'#06132000');band.addColorStop(.18,'#061320ec');band.addColorStop(.82,'#061320ec');band.addColorStop(1,'#06132000');c.fillStyle=band;c.fillRect(0,cy-43,width,93);
 c.strokeStyle=color;c.lineWidth=.8;c.globalAlpha=reveal*fade*.55;c.beginPath();c.moveTo(width*.12,cy-36);c.lineTo(width*.88,cy-36);c.moveTo(width*.12,cy+44);c.lineTo(width*.88,cy+44);c.stroke();
 c.globalAlpha=reveal*fade;c.fillStyle=color;c.shadowColor=color;c.shadowBlur=8*power;c.textAlign='center';c.font='800 italic '+Math.min(39,width*.105)+'px "Barlow Condensed",sans-serif';c.fillText(label,width/2,cy+8);c.shadowBlur=0;c.fillStyle='#c7dfed';c.font='700 '+Math.min(10,width*.028)+'px Rajdhani,sans-serif';c.fillText(gold?'EVERY NOTE. PERFECT.':'A FLAWLESS CONNECTION.',width/2,cy+29);
 c.globalAlpha=reveal*fade*Math.min(.75,.5*power);c.fillStyle=color;const count=strength==='LOW'?5:strength==='HIGH'?14:9;
 for(let i=0;i<count;i++){const x=width*(.13+(i*.618033)%1*.74),y=height-((age*.08+i*height/count)%(height+20));c.fillRect(x,y,i%3===0?2:1.2,i%3===0?5:3)}c.restore();
}
