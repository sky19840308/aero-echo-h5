import {SFX,SPRITE_SOUNDS} from './sfx-catalog.js?v=27';
import {audioVolume} from './audio-levels.js?v=27';

// Bind by the approved aircraft identity. The supplied audio README swaps the
// two pilot names, but P02 is Wraith-X and P03 is Bastion-3 in its actual files.
export const PLAYER_SOUND_PREFIX={Dawn7:'P01_DAWN7',WraithX:'P02_WRAITHX',Bastion3:'P03_BASTION3'};
const pad=n=>String(n).padStart(2,'0');
const env=['AE_ENV_SPACE_STATION_HUM','AE_ENV_ALIEN_PLANET_WIND','AE_ENV_RADAR_INTERFERENCE','AE_ENV_METEOR_WHOOSH','AE_ENV_POWER_GENERATOR','AE_ENV_STORM_ARC','AE_ENV_ORBITAL_DEBRIS','AE_ENV_METEOR_WHOOSH','AE_ENV_CORE_PULSE'];
const ui={close:'AE_UI_CANCEL',home:'AE_UI_CANCEL',resume:'AE_UI_RESUME',pause:'AE_UI_PAUSE',talent:'AE_UI_TALENT_LEARN',upgrade:'AE_UI_LEVEL_UP',forge:'AE_UI_UNLOCK',research:'AE_UI_UNLOCK',launch:'AE_UI_CONFIRM',restart:'AE_UI_CONFIRM',next:'AE_UI_CONFIRM'};
export function soundForEvent(event,variation=0){
 const e=typeof event==='string'?{name:event}:event,p=PLAYER_SOUND_PREFIX[e.ship]||PLAYER_SOUND_PREFIX.Dawn7,b=`B${pad(e.boss||e.chapter+1||1)}`,enemy=`E${pad(e.enemy)}`;
 if(e.name==='sprite'||e.name==='boss-weapon')return SPRITE_SOUNDS[e.art]||`${b}_PRIMARY_VARIANT`;
 if(e.name==='enemy-fire')return e.special?`${enemy}_SPECIAL`:`${enemy}_FIRE_VAR${pad(variation%2+1)}`;
 if(e.name==='enemy-special')return `${enemy}_SPECIAL`;
 if(e.name==='enemy-hit')return `${enemy}_HIT`;
 if(e.name==='boss-fire')return SPRITE_SOUNDS[e.art]||`${b}_PRIMARY_VARIANT`;
 const bosses={'boss-intro':'INTRO','boss-phase':'PHASE_CHANGE','boss-skill-warning':'SKILL_WARNING','boss-skill':'SKILL_EXECUTE','boss-armor':'ARMOR_BREAK','boss-defeat':'DEFEAT'};
 if(bosses[e.name])return `${b}_${bosses[e.name]}`;
 switch(e.name){
  case 'shot':return `${p}_MAIN_FIRE_VAR${pad(variation%4+1)}`;
  case 'secondary':return `${p}_SECONDARY_VAR${pad(variation%2+1)}`;
  case 'skill':return `${p}_ACTIVE_CAST`;
  case 'charge':return `${p}_BOMB_DROP`;
  case 'bomb':return `${p}_BOMB_DETONATE`;
  case 'ultimate':return `${p}_ULTIMATE_RELEASE`;
  case 'flyby':return `${p}_FLYBY`;
  case 'hit':return `${p}_HIT_ARMOR`;
  case 'shield':return `${p}_SHIELD_BREAK`;
  case 'shield-hit':return 'AE_SHIELD_HIT';
  case 'boss-hit':return 'AE_HEAVY_IMPACT';
  case 'explosion':return e.enemy?`${enemy}_DESTROY`:'AE_MEDIUM_EXPLOSION';
  case 'ready':return 'AE_ULTIMATE_READY';
  case 'pickup':return e.pickup==='shield'||e.pickup==='repair'?'AE_PICKUP_SHIELD':e.pickup==='power'?'AE_PICKUP_WEAPON':['bomb','fragment'].includes(e.pickup)?'AE_PICKUP_BOMB':'AE_PICKUP_COIN';
  case 'lock':return e.boss?SPRITE_SOUNDS[e.art]||`${b}_LOCK_ON`:'AE_LASER_LOCK_WARNING';
  case 'warning':return 'AE_MISSILE_WARNING';
  case 'clear':return 'AE_BULLET_CLEAR';
  case 'graze':return 'AE_BULLET_GRAZE';
  case 'environment':return e.hazard==='laser'?'AE_ENV_STORM_ARC':env[e.chapter||0];
  case 'win':return 'AE_UI_RESULT_SUCCESS';
  case 'lose':return 'AE_UI_RESULT_FAIL';
  case 'ui':return ui[e.action]||'AE_UI_NAVIGATE';
  default:return e.id&&SFX[e.id]?e.id:null;
 }
}

export class CombatAudio {
 constructor(context,settings,{fetchAudio=globalThis.fetch,onIssue=()=>{},timeoutMs=8000,budget=24*1024*1024,maxVoices=24}={}){
  // Browser fetch brand-checks its receiver. Never call a stored native fetch
  // as a CombatAudio method: that throws before making any network request.
  this.context=context;this.settings=settings;this.fetchAudio=(...args)=>fetchAudio.call(globalThis,...args);this.onIssue=onIssue;this.timeoutMs=timeoutMs;this.budget=budget;this.maxVoices=maxVoices;
  this.buffers=new Map();this.bytes=0;this.pending=new Map();this.queue=[];this.active=0;this.epoch=0;this.keep=new Set();this.voices=new Set();this.loops=new Map();this.last=new Map();this.variation=new Map();this.failed=new Map();this.pageActive=true;this.issueReported=false;
  this.bus=context.createGain();this.bus.gain.value=this.enabled()?1.35*audioVolume(this.settings,'effectsVolume'):0;
  this.compressor=context.createDynamicsCompressor?.();
  this.limiter=context.createWaveShaper?.();
  if(this.limiter){this.limiter.curve=Float32Array.from({length:4096},(_,i)=>{const x=i/4095*2-1,a=Math.abs(x);return Math.sign(x)*(a<=.85?a:.85+.04*Math.tanh((a-.85)/.04));});this.limiter.oversample='2x';this.limiter.connect(context.destination);}
  const output=this.limiter||context.destination;
  if(this.compressor){for(const [k,v] of Object.entries({threshold:-8,knee:4,ratio:20,attack:.001,release:.12}))this.compressor[k].value=v;this.bus.connect(this.compressor);this.compressor.connect(output);}else this.bus.connect(output);
  this.wasEnabled=this.enabled();
 }
 enabled(){return this.pageActive&&this.settings.sound&&this.settings.effects;}
 syncSettings(active=this.pageActive){const previous=this.wasEnabled;this.pageActive=active;const enabled=this.enabled();this.wasEnabled=enabled;this.bus.gain.value=enabled?1.35*audioVolume(this.settings,'effectsVolume'):0;if(!enabled)this.stopAll();else if(!previous)for(const id of this.keep)void this.request(id);}
 prepare(stage=null,ship='Dawn7'){
  this.epoch++;this.issueReported=false;this.stopAll();this.last.clear();this.failed.clear();
  for(const job of this.pending.values()){job.controller.abort();if(!job.started)job.resolve(null);}this.pending.clear();this.queue=[];
  const p=PLAYER_SOUND_PREFIX[ship],boss=stage?.boss?`B${pad(stage.chapter+1)}_`:null,enemy=new Set((stage?.enemies||[]).map(n=>`E${pad(n)}_`));
  const ids=Object.keys(SFX).filter(id=>id.startsWith('AE_UI_')||stage&&(id.startsWith(p+'_')||id.startsWith('AE_')&&!id.startsWith('AE_COOP_')&&!id.startsWith('AE_ENV_')||id===env[stage.chapter]||boss&&(id.startsWith(boss)||id.startsWith('BCOM_'))||[...enemy].some(prefix=>id.startsWith(prefix))));
  ids.sort((a,b)=>this.loadPriority(a)-this.loadPriority(b));this.keep=new Set(ids);this.trim();
  if(this.enabled())for(const id of ids)void this.request(id);
 }
 loadPriority(id){return /MAIN_FIRE|_FIRE_VAR|INTRO|BOMB_|RESULT|ACTIVE_CAST/.test(id)?0:/SPRITE|ULTIMATE|SHIELD|WARNING/.test(id)?1:2;}
 request(id,{urgent=false}={}){
  if(!SFX[id]||!this.enabled())return Promise.resolve(null);
  const stored=this.buffers.get(id);if(stored){this.buffers.delete(id);this.buffers.set(id,stored);return Promise.resolve(stored.buffer);}
  const old=this.pending.get(id);if(old){if(urgent&&!old.started){this.queue=this.queue.filter(x=>x!==old);this.queue.unshift(old);}return old.promise;}
  if((this.failed.get(id)||0)>Date.now())return Promise.resolve(null);
  let resolve;const promise=new Promise(r=>resolve=r),job={id,promise,resolve,controller:new AbortController(),epoch:this.epoch,started:false};this.pending.set(id,job);urgent?this.queue.unshift(job):this.queue.push(job);this.pump();return promise;
 }
 pump(){while(this.active<4&&this.queue.length){const job=this.queue.shift();if(job.epoch!==this.epoch){job.resolve(null);continue;}job.started=true;this.active++;void this.load(job).finally(()=>{this.active--;this.pump();});}}
 async load(job){
  const {id,controller}=job;let timer,abort;
  const deadline=new Promise((_,reject)=>{abort=()=>reject(new Error('cancelled'));controller.signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{controller.abort();reject(new Error('timeout'));},this.timeoutMs);});
  try{
   const buffer=await Promise.race([(async()=>{const r=await this.fetchAudio(new URL(SFX[id].src,import.meta.url),{credentials:'same-origin',cache:'force-cache',signal:controller.signal});if(!r.ok)throw new Error('http');const bytes=await r.arrayBuffer();if(controller.signal.aborted)throw new Error('cancelled');return this.context.decodeAudioData(bytes);})(),deadline]);
   if(job.epoch!==this.epoch||controller.signal.aborted)return;
   const size=buffer.length*buffer.numberOfChannels*4;if(size>this.budget)throw new Error('oversize');
   this.buffers.set(id,{buffer,size});this.bytes+=size;this.trim();job.resolve(buffer);
  }catch{if(job.epoch===this.epoch){this.failed.set(id,Date.now()+15000);if(!this.issueReported){this.issueReported=true;this.onIssue('load');}}}
  finally{clearTimeout(timer);controller.signal.removeEventListener('abort',abort);if(this.pending.get(id)===job)this.pending.delete(id);job.resolve(null);}
 }
 trim(){
  for(const [id,v] of this.buffers)if(!this.keep.has(id)&&this.bytes>this.budget*.65){this.buffers.delete(id);this.bytes-=v.size;}
  for(const [id,v] of this.buffers){if(this.bytes<=this.budget)break;this.buffers.delete(id);this.bytes-=v.size;}
 }
 effect(event){
  if(!this.enabled()||this.context.state&&this.context.state!=='running')return null;const e=typeof event==='string'?{name:event}:event,key=`${e.name}:${e.enemy||e.boss||e.ship||''}`,variation=this.variation.get(key)||0,id=soundForEvent(e,variation),meta=SFX[id];if(!meta)return null;
  const t=this.context.currentTime,rate=e.name==='shot'?.13:e.name==='enemy-fire'?.26:e.name==='enemy-hit'?.2:e.name==='boss-hit'?.17:e.name==='explosion'?.08:e.name==='sprite'?.35:e.name==='lock'?.22:e.name==='boss-skill'?.45:.09;
  const group=e.name==='shot'?key:e.name==='enemy-hit'?'enemy-hit':e.name==='explosion'?'explosion':e.name==='boss-weapon'?`weapon:${id}`:key;
  if(t-(this.last.get(group)??-10)<rate)return null;this.last.set(group,t);this.variation.set(key,variation+1);
  const sample=this.buffers.get(id);if(!sample){void this.request(id,{urgent:true});return null;}
  this.buffers.delete(id);this.buffers.set(id,sample);return this.play(id,sample.buffer,e);
 }
 play(id,buffer,event={},loop=false){
  if(!this.enabled()||this.context.state&&this.context.state!=='running')return null;const meta=SFX[id],same=[...this.voices].filter(v=>v.group===meta.group),maximum=Math.min(meta.voices,loop?1:meta.kind.includes('explosion')?8:5);
  if(same.length>=maximum)this.stopVoice(same[0]);
  if(this.voices.size>=this.maxVoices){const expendable=[...this.voices].filter(v=>!v.loop).sort((a,b)=>b.priority-a.priority)[0];if(!expendable||expendable.priority<meta.priority)return null;this.stopVoice(expendable);}
  const source=this.context.createBufferSource(),gain=this.context.createGain(),pan=this.context.createStereoPanner?.();source.buffer=buffer;source.loop=loop;
  source.playbackRate.value=loop?1:.97+Math.random()*.06;
  gain.gain.value=Math.min(1.6,10**((meta.volume+6)/20))*(event.enemy?.65:event.name==='boss-hit'?.7:loop?.8:1);
  source.connect(gain);if(pan){pan.pan.value=Number.isFinite(event.x)?Math.max(-.55,Math.min(.55,(event.x-225)/450)):0;gain.connect(pan);pan.connect(this.bus);}else gain.connect(this.bus);
  const voice={id,source,gain,pan,group:meta.group,priority:meta.priority,loop,boss:event.boss,enemy:event.enemy};this.voices.add(voice);
  source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();pan?.disconnect();};source.start();return voice;
 }
 stopVoice(v){if(!v)return;this.voices.delete(v);try{v.gain.gain.setTargetAtTime?.(0,this.context.currentTime,.005);v.source.stop(this.context.currentTime+.025);}catch{};}
 stopAll(){for(const v of [...this.voices])this.stopVoice(v);this.loops.clear();}
 dispose(){this.epoch++;this.stopAll();for(const job of this.pending.values()){job.controller.abort();job.resolve(null);}this.pending.clear();this.queue=[];this.bus.disconnect();this.compressor?.disconnect();this.limiter?.disconnect();}
 stopBoss(){for(const v of [...this.voices])if(v.boss)this.stopVoice(v);}
 syncGame(game){
  const playing=game?.state==='playing'&&this.enabled()&&(!this.context.state||this.context.state==='running'),wanted=new Set();
  if(playing&&game.player.ultTime>0&&['Dawn7','Bastion3'].includes(game.ship.id))wanted.add(PLAYER_SOUND_PREFIX[game.ship.id]+'_LASER_LOOP');
  for(const [id,v] of this.loops)if(!wanted.has(id)){this.stopVoice(v);this.loops.delete(id);if(playing)this.effect({id:id.replace('_LOOP','_END')});}
  for(const id of wanted)if(!this.loops.get(id)){
   const sample=this.buffers.get(id);if(!sample){void this.request(id,{urgent:true});continue;}
   this.effect({id:id.replace('_LOOP','_START'),ship:game.ship.id});const voice=this.play(id,sample.buffer,{ship:game.ship.id},true);if(voice)this.loops.set(id,voice);
  }
 }
}
