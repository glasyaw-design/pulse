'use strict';
// A mixed-song approximation: subtract a shared harmonic slice from the song
// at chart time and restore that same slice when its owning note is played.
class KeySoundPlayer {
 constructor(context,backgroundBus,keyBus){this.context=context;this.backgroundBus=backgroundBus;this.keyBus=keyBus;this.buffer=null;this.sprites=[];this.index=0;this.sources=new Set();this.enabled=true;this.autoPlay=false}
 prepare(notes,buffer){
  this.buffer=buffer;this.sprites=[];
  const groups=new Map();for(const n of notes){n.sound=null;if(!groups.has(n.time))groups.set(n.time,[]);groups.get(n.time).push(n)}
  const entries=[...groups.entries()].sort((a,b)=>a[0]-b[0]);
  entries.forEach(([time,heads],i)=>{
   const next=entries[i+1]?.[0]??time+.38,duration=Math.min(.38,next-time,buffer.duration-time);
   if(duration<.018)return;
   const sprite={time,offset:time,duration,owners:[],resumeGain:0};
   for(const note of heads){const voice={time,offset:time,duration,volume:1/heads.length,fired:false};note.sound=voice;sprite.owners.push(voice)}this.sprites.push(sprite);
  });
  this.reset(0);
 }
 reset(position){this.stop();this.index=0;while(this.index<this.sprites.length&&this.sprites[this.index].time+this.sprites[this.index].duration<=position)this.index++;for(const s of this.sprites){s.resumeGain=0;for(const voice of s.owners){if(voice.fired&&voice.time<position&&voice.time+voice.duration>position)s.resumeGain+=voice.volume;voice.fired=voice.time<position}}}
 stop(){for(const s of this.sources){try{s.stop()}catch{}try{s.disconnect()}catch{}}this.sources.clear()}
 slice(sprite,when,polarity,bus){
  if(!this.buffer||sprite.duration<.008)return null;
  const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffer;
  const at=Math.max(this.context.currentTime,when),duration=sprite.duration,fade=Math.min(.004,duration/4);
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(polarity,at+fade);gain.gain.setValueAtTime(polarity,at+duration-fade);gain.gain.linearRampToValueAtTime(0,at+duration);
  source.connect(gain);gain.connect(bus);this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect()};
  source.start(at,sprite.offset,duration);return source;
 }
 schedule(songTime,startAt){
  if(!this.enabled||!this.buffer)return;
  while(this.index<this.sprites.length&&this.sprites[this.index].time<songTime+.18){
   const s=this.sprites[this.index++],trim=Math.max(0,songTime-s.time),duration=s.duration-trim;if(duration<=.008)continue;
   const clip={offset:s.offset+trim,duration},when=Math.max(this.context.currentTime,startAt+s.time+trim);
   this.slice(clip,when,-1,this.backgroundBus);
   if(this.autoPlay){this.slice(clip,when,1,this.keyBus);for(const voice of s.owners)voice.fired=true;continue}
   if(s.resumeGain>0){this.slice(clip,when,s.resumeGain,this.keyBus);for(const voice of s.owners)voice.fired=true;s.resumeGain=0}
  }
 }
 play(note,startAt){if(this.autoPlay)return;const s=note.sound;if(!this.enabled||!s||s.fired)return;s.fired=true;
  // Mixed-source restoration must stay phase-aligned with the backing song.
  const target=Number.isFinite(startAt)?startAt+s.time:this.context.currentTime;
  const when=Math.max(this.context.currentTime,target),trim=Math.max(0,when-target);
  this.slice({offset:s.offset+trim,duration:s.duration-trim},when,s.volume,this.keyBus);
 }
 audition(offset){return this.slice({offset,duration:Math.min(.36,this.buffer.duration-offset)},this.context.currentTime,1,this.keyBus)}
}
