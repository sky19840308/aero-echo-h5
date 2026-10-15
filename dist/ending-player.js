import {ENDING_TIMING,ENDING_UI,ENDING_TEASER,endingText,endingRollHtml,endingFinalHtml,endingTeaserHtml} from './ending-content.js?v=20';
import {EndingScene} from './ending-scene.js?v=20';

export function endingPhase(seconds){if(seconds<ENDING_TIMING.roll)return 'roll';if(seconds<ENDING_TIMING.credits)return 'finale';if(seconds<ENDING_TIMING.credits+ENDING_TIMING.blackout)return 'blackout';if(seconds<ENDING_TIMING.total)return 'teaser';return 'done';}
export function teaserIndex(seconds){let t=seconds-ENDING_TIMING.credits-ENDING_TIMING.blackout;for(let i=0;i<ENDING_TEASER.length;i++){t-=ENDING_TEASER[i].duration;if(t<0)return i;}return ENDING_TEASER.length-1;}
export class EndingPlayer {
 constructor({document:doc=globalThis.document,audio,onDone=()=>{},scene}={}){
  this.doc=doc;this.audio=audio;this.onDone=onDone;this.active=false;this.pageActive=true;this.elapsed=0;this.paused=false;this.lastNow=null;this.locale='zh';this.firstClear=false;this.previousPhase='';this.card=-1;
  this.el=id=>doc.getElementById(id);this.scene=scene||new EndingScene(this.el('ending-canvas'),{reducedMotion:Boolean(globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)});
  this.el('ending-pause').addEventListener('click',()=>this.togglePause());this.el('ending-skip').addEventListener('click',()=>this.skip());this.el('ending-return').addEventListener('click',()=>this.finish());
  this.el('ending-sound').addEventListener('click',()=>{if(!this.active||this.elapsed>=ENDING_TIMING.credits)return;this.audio.settings.sound=true;this.audio.settings.music=true;this.audio.musicAttempted=false;try{if(this.audio.music)this.audio.music.currentTime=this.elapsed;}catch{}void this.audio.unlock();});
  globalThis.window?.addEventListener('resize',()=>{if(this.active){this.scene.resize();this.measure();this.render();}});
 }
 start({locale='zh',firstClear=false,onDone=this.onDone,now=globalThis.performance?.now?.()||0}={}){
  if(this.active)this.cancel();this.locale=locale;this.firstClear=firstClear;this.onDone=onDone;this.elapsed=0;this.paused=false;this.lastNow=now;this.active=true;this.pageActive=!this.doc.hidden;this.previousPhase='';this.card=-1;this.lastDraw=-1;
  const t=v=>endingText(v,locale);this.el('ending-roll').innerHTML=endingRollHtml(locale);this.el('ending-finale').innerHTML=endingFinalHtml(locale);this.el('ending-hint').textContent=t(ENDING_UI.first);
  this.el('ending-title').textContent=t(ENDING_UI.title);this.el('ending-skip').textContent=t(ENDING_UI.skip);this.el('ending-return').textContent=t(ENDING_UI.return);this.el('ending-sound').textContent=t(ENDING_UI.sound);
  this.el('ending-screen').hidden=false;this.doc.body.classList.add('ending-running');this.scene.load();this.scene.resize();this.measure();this.audio.setMode('ending',8);this.render();this.el('ending-pause').focus({preventScroll:true});
  // Font loading can change total travel; measure again without restarting.
  this.doc.fonts?.ready?.then(()=>{if(this.active)this.measure();});
 }
 measure(){this.height=this.el('ending-screen').clientHeight||globalThis.window?.innerHeight||800;this.rollHeight=this.el('ending-roll').scrollHeight||6500;}
 update(now){if(!this.active)return;const dt=this.lastNow===null?0:Math.max(0,(now-this.lastNow)/1000);this.lastNow=now;if(this.pageActive&&!this.paused)this.elapsed=Math.min(ENDING_TIMING.total,this.elapsed+dt);this.render();if(this.elapsed>=ENDING_TIMING.total)this.finish();}
 setPageActive(active){this.pageActive=Boolean(active);this.lastNow=null;if(this.active)this.render();}
 togglePause(){if(!this.active||endingPhase(this.elapsed)==='blackout')return;this.paused=!this.paused;this.lastNow=null;this.audio.setMode(this.paused?'ending-paused':this.elapsed<ENDING_TIMING.credits?'ending':'silent',8);this.render();}
 skip(){if(!this.active||this.elapsed>=ENDING_TIMING.credits)return;this.elapsed=ENDING_TIMING.credits;this.paused=false;this.lastNow=null;this.render();}
 render(){if(!this.active)return;const phase=endingPhase(this.elapsed),screen=this.el('ending-screen');screen.dataset.phase=phase;screen.classList.toggle('ending-paused',this.paused||!this.pageActive);
  if(phase!==this.previousPhase){this.previousPhase=phase;if(phase==='blackout'){this.audio.setMode('silent',8);this.el('ending-screen').focus({preventScroll:true});}if(phase==='teaser')this.el('ending-return').focus({preventScroll:true});}
  this.el('ending-roll').hidden=phase!=='roll';this.el('ending-finale').hidden=phase!=='finale';this.el('ending-teaser').hidden=phase!=='teaser';this.el('ending-canvas').hidden=!['roll','finale'].includes(phase);
  this.el('ending-controls').hidden=phase==='blackout';this.el('ending-pause').hidden=phase==='blackout';this.el('ending-skip').hidden=!['roll','finale'].includes(phase);this.el('ending-sound').hidden=!['roll','finale'].includes(phase);this.el('ending-return').hidden=phase!=='teaser';
  this.el('ending-hint').hidden=!this.firstClear||this.elapsed>12||phase!=='roll';this.el('ending-pause').textContent=endingText(this.paused?ENDING_UI.resume:ENDING_UI.pause,this.locale);
  if(phase==='roll')this.el('ending-roll').style.transform=`translate3d(0,${this.height-(this.height+this.rollHeight)*this.elapsed/ENDING_TIMING.roll}px,0)`;
  if(phase==='teaser'){const card=teaserIndex(this.elapsed);if(card!==this.card){this.card=card;this.el('ending-teaser').innerHTML=endingTeaserHtml(card,this.locale);}}
  if(['roll','finale'].includes(phase)&&Math.abs(this.elapsed-this.lastDraw)>1/30){this.scene.draw(this.elapsed);this.lastDraw=this.elapsed;}
 }
 handleKey(event){if(!this.active)return false;const key=event.key.toLowerCase();if(key==='tab'){const items=['ending-pause','ending-skip','ending-sound','ending-return'].map(this.el).filter(e=>!e.hidden);if(items.length){const first=items[0],last=items.at(-1);if(event.shiftKey&&this.doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&this.doc.activeElement===last){event.preventDefault();first.focus();}}else event.preventDefault();}
  else if(['p',' '].includes(key)){event.preventDefault();if(!event.repeat)this.togglePause();}else if(key==='escape'){event.preventDefault();this.skip();}return true;
 }
 cancel(){this.active=false;this.lastNow=null;this.el('ending-screen').hidden=true;this.doc.body.classList.remove('ending-running');this.audio.setMode('silent',8);}
 finish(){if(!this.active)return;const done=this.onDone;this.cancel();done?.();}
}
