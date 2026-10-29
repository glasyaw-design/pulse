'use strict';
const KEY_MODES=[4,5,6,7,8];
const MODE_BINDINGS={4:['KeyD','KeyF','KeyJ','KeyK'],5:['KeyD','KeyF','Space','KeyJ','KeyK'],6:['KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL'],7:['KeyS','KeyD','KeyF','Space','KeyJ','KeyK','KeyL'],8:['KeyA','KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL','Semicolon']};
function keyChartSet(track,count=5){return count===5?track:track.keyModes?.[count]||track}
function centerLane(lane,count){return count%2===1&&lane===Math.floor(count/2)}
function validBindings(value,count){return Array.isArray(value)&&value.length===count&&new Set(value).size===count&&value.every(k=>typeof k==='string'&&k.length>0&&!['Enter','Escape','F2'].includes(k)&&!/^(Shift|Control|Meta)/.test(k))}

const DEFAULT_FIVE_AUX=['KeyG','KeyH'];
function validFiveAux(value){return Array.isArray(value)&&value.length===2&&value.every(k=>k===null||typeof k==='string'&&k.length>0&&!['Enter','Escape','F2'].includes(k)&&!/^(Shift|Control|Meta)/.test(k))&&new Set(value.filter(Boolean)).size===value.filter(Boolean).length}
function resolveInputLane(code,count,primary,aux){const lane=primary.indexOf(code);if(lane>=0)return lane;return [5,7].includes(count)&&aux.includes(code)?Math.floor(count/2):-1}
