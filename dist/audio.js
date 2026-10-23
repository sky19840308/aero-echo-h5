import {CHAPTER_MUSIC,BOSS_MUSIC,MENU_MUSIC,ENDING_MUSIC} from './music.js?v=30.1';
import {CombatAudio} from './combat-audio.js?v=30.1';
import {audioVolume} from './audio-levels.js?v=30.1';

export class AudioSynth {
 constructor(settings,{createMusic,onMusicIssue=()=>{},onSfxIssue=()=>{},sfxOptions={}}={}){
  this.settings=settings;this.context=null;this.mode='lobby';this.chapter=0;this.nextBeat=0;this.beat=0;this.last={};
  this.sfx=null;this.soundStage=null;this.soundShip='Dawn7';this.onSfxIssue=onSfxIssue;this.sfxOptions=sfxOptions;this.sfxIssue=null;this.resumeTimeoutMs=1500;
  this.createMusic=createMusic||(()=>{const Media=globalThis.Audio||globalThis.window?.Audio;return Media?new Media():null;});this.onMusicIssue=onMusicIssue;
  this.music=null;this.musicChapter=null;this.musicKind='chapter';this.chapterPosition=0;this.preparing=false;this.unlocked=false;this.pageActive=true;this.musicAttempted=false;this.musicPlaying=false;this.playPromise=null;this.musicRequest=0;this.previousEnabled=null;
 }
 ensureMusic(){
  if(this.music)return this.music;
  try{const media=this.createMusic();if(!media)return null;this.music=media;media.loop=true;media.preload='none';media.volume=audioVolume(this.settings,'musicVolume');media.controls=false;
   media.addEventListener('error',()=>{this.musicPlaying=false;this.musicAttempted=true;if(this.isAudibleMusic()&&this.isEnabled())this.onMusicIssue('load');});return media;
  }catch{return null;}
 }
 wantsMusic(){return this.preparing||['lobby','battle','boss','story','ending'].includes(this.mode);}
 isAudibleMusic(){return this.wantsMusic();}
 isEnabled(){return this.unlocked&&this.pageActive&&this.settings.sound&&this.settings.music;}
 pauseMusic(){this.musicRequest++;this.playPromise=null;this.musicPlaying=false;if(this.music&&!this.music.paused)this.music.pause();}
 selectTrack(chapter,reset=false,kind='chapter'){
  const track=kind==='ending'?ENDING_MUSIC:kind==='lobby'?MENU_MUSIC:(kind==='boss'?BOSS_MUSIC:CHAPTER_MUSIC)[chapter];if(!track)return false;const media=this.ensureMusic();if(!media)return false;chapter=kind==='lobby'?-1:chapter;media.loop=kind!=='ending';
  if(this.musicChapter!==chapter||this.musicKind!==kind){
   if(this.musicKind==='chapter'&&this.musicChapter===chapter)this.chapterPosition=media.currentTime||0;
   if(this.musicChapter!==chapter)this.chapterPosition=0;
   this.pauseMusic();this.musicChapter=chapter;this.musicKind=kind;media.src=track.src;media.preload='auto';media.load();
   try{media.currentTime=kind==='chapter'&&!reset?this.chapterPosition:0;}catch{}this.musicAttempted=false;
  }
  if(reset){this.pauseMusic();if(kind==='chapter')this.chapterPosition=0;try{media.currentTime=0;}catch{}this.musicAttempted=false;}return true;
 }
 prepareSounds(stage,ship){this.soundStage=stage;this.soundShip=ship;this.sfx?.prepare(stage,ship);}
 endBoss(){this.sfx?.stopBoss();}
 prepareStage(chapter){this.chapter=chapter;this.preparing=true;this.selectTrack(chapter,true);}
 playMusic(){
  if(!this.wantsMusic()||!this.isEnabled()){this.pauseMusic();return;}
  const media=this.music;if(!media||this.playPromise||!media.paused||this.musicAttempted)return;
  const request=++this.musicRequest;this.musicAttempted=true;media.muted=false;
  // Call play synchronously from Launch/Resume, before awaiting asset loads or AudioContext.resume.
  // Reuse the user-authorized element when switching between the two recordings.
  media.muted=!this.isAudibleMusic();
  try{const result=media.play();this.playPromise=Promise.resolve(result).then(()=>{
    if(request!==this.musicRequest)return;if(!this.wantsMusic()||!this.isEnabled()){this.pauseMusic();return;}this.musicPlaying=true;
   }).catch(error=>{if(request!==this.musicRequest||error?.name==='AbortError')return;this.musicPlaying=false;this.musicAttempted=true;if(this.wantsMusic()&&this.isEnabled())this.onMusicIssue(error?.name==='NotAllowedError'?'blocked':'load');
   }).finally(()=>{if(request===this.musicRequest)this.playPromise=null;});
  }catch(error){if(error?.name!=='AbortError')this.onMusicIssue(error?.name==='NotAllowedError'?'blocked':'load');}
 }
 async unlock(){
  this.unlocked=true;this.musicAttempted=false;this.syncSettings();
  if(!this.settings.sound||!this.pageActive)return;
  let timer;
  try{
   // Use the device's media playback session when supported (not microphone).
   try{if(globalThis.navigator?.audioSession)globalThis.navigator.audioSession.type='playback';}catch{}
   if(this.context?.state==='closed'){this.sfx?.dispose();this.sfx=null;this.context=null;}
   if(!this.context){const Context=globalThis.window?.AudioContext||globalThis.window?.webkitAudioContext;if(!Context){this.reportSfxIssue('unsupported');return;}this.context=new Context();this.master=this.context.createGain();this.master.gain.value=this.settings.music?.19*audioVolume(this.settings,'musicVolume'):0;this.master.connect(this.context.destination);if(this.context.createBufferSource&&this.context.decodeAudioData){this.sfx=new CombatAudio(this.context,this.settings,{...this.sfxOptions,onIssue:kind=>this.reportSfxIssue(kind)});this.sfx.prepare(this.soundStage,this.soundShip);}}
   const interrupted=this.context.state&&this.context.state!=='running';
   // Start a silent buffer synchronously inside the trusted gesture, before
   // awaiting resume/decode; this opens the audio output on mobile WebKit.
   if(this.context.createBuffer&&this.context.createBufferSource){const source=this.context.createBufferSource();source.buffer=this.context.createBuffer(1,1,22050);source.connect(this.context.destination);source.onended=()=>source.disconnect();source.start(0);}
   if(interrupted){this.sfx?.stopAll();this.sfx?.last.clear();const resumed=this.context.resume();await Promise.race([resumed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('resume-timeout')),this.resumeTimeoutMs);})]);}
   if(this.context.state&&this.context.state!=='running')throw Error('not-running');
   this.sfxIssue=null;this.nextBeat=this.context.currentTime+.05;
  }catch{this.reportSfxIssue('blocked');}finally{clearTimeout(timer);}
 }
 reportSfxIssue(kind){if(this.sfxIssue===kind)return;this.sfxIssue=kind;if(this.settings.sound&&this.settings.effects)this.onSfxIssue(kind);}
 recoverGesture(){if(this.settings.sound&&this.pageActive&&(!this.context||this.context.state&&this.context.state!=='running'||this.wantsMusic()&&this.music?.paused&&!this.playPromise))void this.unlock();}
 async previewEffect(ship=this.soundShip){
  await this.unlock();if(!this.sfx||!this.settings.sound||!this.settings.effects)return false;
  const id=`${{Dawn7:'P01_DAWN7',WraithX:'P02_WRAITHX',Bastion3:'P03_BASTION3'}[ship]}_MAIN_FIRE_VAR01`,bank=this.sfx,buffer=await bank.request(id,{urgent:true});
  if(!buffer||bank!==this.sfx||!this.pageActive)return false;return Boolean(bank.play(id,buffer,{name:'shot',ship}));
 }
 syncSettings(){
  if(this.wantsMusic()&&!this.music)this.selectTrack(this.chapter,false,this.mode==='ending'?'ending':this.mode==='lobby'?'lobby':this.mode==='boss'?'boss':'chapter');
  const enabled=this.isEnabled();if(enabled&&!this.previousEnabled)this.musicAttempted=false;this.previousEnabled=enabled;
  this.sfx?.syncSettings(this.pageActive);
  if(this.master)this.master.gain.value=(this.settings.sound&&this.settings.music&&this.pageActive)?.19*audioVolume(this.settings,'musicVolume'):0;
  if(this.music){this.music.volume=audioVolume(this.settings,'musicVolume');this.music.muted=!enabled||!this.isAudibleMusic();}
  if(this.wantsMusic()&&enabled)this.playMusic();else this.pauseMusic();
 }
 setPageActive(active){this.pageActive=Boolean(active);this.syncSettings();if(this.pageActive&&this.unlocked&&this.context?.state&&this.context.state!=='running')void this.unlock();}
 tone(freq,duration=.15,type='sine',gain=.15,start=0,endFreq=null){if(!this.context||!this.settings.sound)return;const t=start||this.context.currentTime;const o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
 effect(event){if(!this.context||!this.settings.sound||!this.settings.effects||!this.pageActive)return;this.sfx?.effect(typeof event==='string'?{name:event,ship:this.soundShip,chapter:this.chapter}:event);}
 setMode(mode,chapter=0){
  const previousMode=this.mode,changed=previousMode!==mode||this.chapter!==chapter,previouslyWanted=this.wantsMusic();this.mode=mode;this.chapter=chapter;this.preparing=false;
  if(this.wantsMusic()){this.selectTrack(chapter,(mode==='boss'&&previousMode!=='boss'&&previousMode!=='paused')||(mode==='ending'&&previousMode!=='ending'&&previousMode!=='ending-paused'),mode==='ending'?'ending':mode==='lobby'?'lobby':mode==='boss'?'boss':'chapter');if(!previouslyWanted)this.musicAttempted=false;}
  else this.pauseMusic();
  if(['paused','lobby','ending','ending-paused','silent'].includes(mode))this.sfx?.stopAll();
  if(changed){if(this.context)this.nextBeat=this.context.currentTime+.08;this.beat=0;}this.syncSettings();
 }
 update(game=null){
  this.syncSettings();this.sfx?.syncGame(game);
  // The one authorized media element owns lobby, chapter and Boss playback.
 }
}
