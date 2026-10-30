'use strict';
const FRAME_LIMITS=[0,60,120,144,165,240];
class FramePacer{
 constructor(){this.reset()}
 reset(){this.last=null;this.windowStart=null;this.frames=0;this.fps=null}
 shouldDraw(now,limit){
  if(!Number.isFinite(now))return false;
  if(!limit||this.last===null||now<this.last){this.last=now;return true}
  const interval=1000/limit,delta=now-this.last;
  if(delta+1e-6<interval)return false;
  // Carry fractional refresh intervals, but never perform catch-up renders.
  this.last+=Math.max(1,Math.floor((delta+1e-6)/interval))*interval;return true;
 }
 rendered(now){
  if(this.windowStart===null){this.windowStart=now;this.frames=0;return null}
  this.frames++;const span=now-this.windowStart;
  if(span<500)return null;
  this.fps=Math.round(this.frames*1000/span);this.frames=0;this.windowStart=now;return this.fps;
 }
}
