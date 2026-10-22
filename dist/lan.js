import {CoopSession} from './coop.js?v=28';
import {CoopPeer} from './coop-peer.js?v=28';
import {packCoopSnapshot,unpackCoopSnapshot} from './coop-wire.js?v=28';
import {createProfile,normalizeProfile,STORAGE} from './profile.js?v=28';
import {settleEconomy,upgradeHull} from './economy.js?v=28';
import {upgradeWeapon,upgradeResearch} from './progression.js?v=28';
import {rememberClear,unlockAchievements} from './campaign.js?v=28';
import {SHIPS} from './data.js?v=28';
import {learnTalent} from './talent-tree.js?v=28';

export const LAN_STORAGE='aero-echo.lan.v1';
const CAPABILITY='aero-echo.lan-capability';
const API='https://aero-echo-sky.spy-liver.chatgpt.site';
const validSeq=n=>Number.isSafeInteger(n)&&n>=0;
const browserStorage=name=>{try{return globalThis[name];}catch{return undefined;}};
const boundedChoice=c=>({shipIndex:Math.max(0,Math.min(2,Math.floor(Number(c?.shipIndex)||0))),skin:Math.max(0,Math.min(3,Math.floor(Number(c?.skin)||0)))});
export class LanProgress {
 constructor({storage=browserStorage('localStorage'),onIssue=()=>{}}={}){
  this.storage=storage;this.onIssue=onIssue;this.profile=createProfile();this.blocked=false;this.saved=false;
  try{const existing=storage?.getItem(LAN_STORAGE),raw=existing??storage?.getItem(STORAGE);if(raw){const parsed=JSON.parse(raw);if(parsed?.version!==1)throw new Error('Invalid save');this.profile=normalizeProfile(parsed);}if(!existing)this.save();else this.saved=true;}catch{this.blocked=true;this.onIssue('read');}
 }
 save(){try{if(this.blocked||!this.storage)throw new Error('storage');this.storage.setItem(LAN_STORAGE,JSON.stringify(this.profile));this.saved=true;return true;}catch{this.saved=false;this.onIssue('write');return false;}}
 upgrade(type,node,shipIndex){
  const p=this.profile,ship=SHIPS[boundedChoice({shipIndex}).shipIndex].id;let changed=false;
  if(type==='hull')changed=upgradeHull(p,1)>0;
  if(type==='hull-five')changed=upgradeHull(p,5)>0;
  if(type==='weapon')changed=upgradeWeapon(p,ship);
  if(type==='research')changed=upgradeResearch(p,node);
  if(type==='talent')changed=!!learnTalent(p,node);
  if(changed)this.save();return changed;
 }
 settle(result){const reward=settleEconomy(this.profile,result);rememberClear(this.profile,result);this.profile.discovered=[...new Set([...this.profile.discovered,...(result.seen||[])])];unlockAchievements(this.profile);this.save();return reward;}
}

export class LanClient {
 constructor({fetcher=globalThis.fetch,storage=browserStorage('sessionStorage'),origin=API}={}){
  // Native browser fetch requires its Window/Worker receiver. Node's fetch
  // tolerates a client object receiver, which hid this error in API fixtures.
  this.fetcher=typeof fetcher==='function'?fetcher.bind(globalThis):null;this.origin=origin;let capability;
  try{capability=storage?.getItem(CAPABILITY);}catch{}
  if(!/^[A-Za-z0-9_-]{43}$/.test(capability||'')){capability=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');try{storage?.setItem(CAPABILITY,capability);}catch{}}
  Object.defineProperty(this,'capability',{value:capability});this.user={id:'local-pilot'};this.enabled=true;
 }
 async request(path,{body={},signal}={}){
  if(!/^\/api\/rooms(?:\/[A-HJ-NP-Z2-9]{8}\/(?:join|reconnect|status|start|signal|leave))?$/.test(path))throw new Error('LAN metadata route required');
  if(!this.fetcher)throw Object.assign(new Error('LAN network unavailable'),{code:'lan-network'});
  let timedOut=false;
  const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();const timer=setTimeout(()=>{timedOut=true;abort();},20000);timer?.unref?.();
  try{const response=await this.fetcher(this.origin+path.replace('/api/rooms','/api/lan/rooms'),{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','Authorization':'Bearer '+this.capability},body:JSON.stringify(body),signal:controller.signal});
   let data;try{data=await response.json();}catch{throw Object.assign(new Error('Invalid pairing response'),{code:'lan-response-invalid'});}
   if(!response.ok)throw Object.assign(new Error(data.error||'lan-unavailable'),{status:response.status,code:data.error});return data;
  }catch(error){if(timedOut)throw Object.assign(new Error('LAN pairing timeout'),{code:'lan-timeout'});if(!error.code&&error.name!=='AbortError')throw Object.assign(new Error('LAN network unavailable'),{code:'lan-network'});throw error;
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
}

// Only the pairing lobby uses HTTP. Live movement, readiness, pause, loadouts
// and world frames stay on the local data channel, even if the WAN stalls.
export class LanSession extends CoopSession {
 constructor({progress=new LanProgress(),account=new LanClient(),rtc=globalThis.RTCPeerConnection,...options}={}){
  super({...options,account,interval:1000});this.mode='lan';this.progress=progress;this.rtc=rtc;this.loadoutVersion=1;this.loadoutAck=0;this.remoteVersion=0;this.settlements=[];this.settled=new Set();this.lastLoadoutAt=-Infinity;this.lanSteps=0;this.lanPauseVersions={host:0,guest:0};this.terminalAck=false;this.lastTerminalAt=-Infinity;
 }
 get canStart(){return this.role==='host'&&!!this.room?.guest&&this.peerHealthy()&&this.remoteVersion>0&&this.loadoutAck===this.loadoutVersion;}
 get canReady(){return this.peerHealthy()&&this.loadoutAck===this.loadoutVersion;}
 diagnostics(){const p=this.peer;return {build:23,role:this.role,state:this.state,peer:p?.state||'off',ice:p?.pc?.iceConnectionState||'new',gathering:p?.pc?.iceGatheringState||'new',localCandidates:p?.localCandidates?.length||0,remoteCandidates:p?.remoteCandidates?.size||0,control:p?.control?.readyState||'closed',frames:p?.frames?.readyState||'closed',loadoutAck:this.loadoutAck,loadoutVersion:this.loadoutVersion,remoteVersion:this.remoteVersion,assets:this.game?.crew.map(p=>({role:p.role,ready:p.ack===this.mission}))||[],error:p?.lastError||''};}
 async connect(path,body){if(!this.rtc)throw Object.assign(new Error('WebRTC unavailable'),{code:'rtc-unavailable'});this.settlements=[];this.settled.clear();this.loadoutAck=0;this.remoteVersion=0;this.lanPauseVersions={host:0,guest:0};this.lanSteps=0;this.terminalAck=false;this.lastTerminalAt=-Infinity;return super.connect(path,body);}
 loadout(){const p=this.progress.profile;return {version:1,economyVersion:p.economyVersion,talentTreeVersion:p.talentTreeVersion,levels:{...p.levels},weapons:{...p.weapons},research:{...p.research},talents:{...p.talents}};}
 choice(){return boundedChoice(this.room?.[this.role]?.choice);}
 sendLoadout(){
  if(!this.room?.[this.role])return false;this.room[this.role].loadout=this.loadout();this.lastLoadoutAt=this.now();
  return this.peer?.send({type:'lan-loadout',version:this.loadoutVersion,choice:this.choice(),loadout:this.loadout()});
 }
 changedLoadout(choice=this.choice()){
  if(this.code&&!['waiting','intermission'].includes(this.baseState))return false;
  if(this.local?.ready)return false;
  if(this.room?.[this.role])this.room[this.role].choice=boundedChoice(choice);this.loadoutVersion++;this.sendLoadout();this.onChange(this);return true;
 }
 openPeer(){
  this.peer?.close();this.lastDirectSnapshotSeq=-1;this.lastDirectInputSeq=-1;this.directFrameSeq=0;this.directInputSeq=0;
  if(!this.autoSync||!this.rtc)return;
  const code=this.code;
  this.peer=new CoopPeer({role:this.role,code,now:this.now,rtc:this.rtc,trickle:true,iceServers:[{urls:'stun:stun.cloudflare.com:3478'}],request:body=>this.request(`/api/rooms/${code}/signal`,body),onState:state=>{if(state==='direct')this.sendLoadout();if(state==='relay')this.peer.state='unavailable';this.onChange(this);},onPacket:packet=>this.receivePeer(packet)});
  void this.peer.start().catch(()=>{if(this.code===code){this.peer.state='unavailable';this.onChange(this);}});
 }
 retryConnection(){if(this.baseState!=='waiting'||this.role!=='host')return false;this.loadoutAck=0;this.remoteVersion=0;this.lastLoadoutAt=-Infinity;this.lastPeerAt=this.now();this.openPeer();this.onChange(this);return true;}
 receivePeer(packet){
  if(!this.assertIdentity()||packet.code!==this.code)return;this.lastPeerAt=this.now();this.peerStale=false;
  if(packet.type==='leave'){this.fail('room-closed');return;}
  if(this.role==='guest'&&packet.type==='lan-start'&&packet.mission===0&&this.baseState==='waiting'){this.beginStage(0);this.refresh();return;}
  const remoteRole=this.role==='host'?'guest':'host';
  if(packet.type==='lan-pause'&&packet.role===remoteRole&&packet.mission===this.mission&&validSeq(packet.version)&&packet.version>=this.lanPauseVersions[remoteRole]&&typeof packet.paused==='boolean'){
   this.lanPauseVersions[remoteRole]=packet.version;this.pauseFlags[remoteRole]=packet.paused;this.refresh();return;
  }
  if(this.role==='host'&&packet.type==='lan-terminal-ack'&&packet.mission===this.mission&&packet.state===this.baseState){this.terminalAck=true;return;}
  if(packet.type==='lan-loadout'&&validSeq(packet.version)&&packet.version>0&&packet.loadout?.version===1){
   const remote=this.role==='host'?'guest':'host';
   if(!this.room[remote])return;
   if(packet.version>this.remoteVersion){
    // Preserve the active sortie's stats; new equipment is installed next sortie.
    this.room[remote].loadout=normalizeProfile(packet.loadout);this.room[remote].choice=boundedChoice(packet.choice);this.remoteVersion=packet.version;
    if(this.baseState==='intermission'){const pilot=this.game?.crew.find(p=>p.role===remote);if(pilot)pilot.ready=false;}
   }
   this.peer.send({type:'lan-loadout-ack',version:packet.version});this.onChange(this);return;
  }
  if(packet.type==='lan-loadout-ack'&&packet.version===this.loadoutVersion){this.loadoutAck=packet.version;this.onChange(this);return;}
  if(this.role==='host'&&packet.type==='input'&&packet.mission===this.mission&&validSeq(packet.seq)&&packet.seq>this.lastDirectInputSeq){this.lastDirectInputSeq=packet.seq;this.receiveInput(packet.input,'guest');}
  if(this.role==='guest'&&packet.type==='frame')this.applySnapshot(packet.snapshot,packet.seq,{source:'direct',age:Math.max(0,Math.min(.06,this.peer.rtt/2000))});
  this.refresh();
 }
 sendPeerInput(){return this.peer?.sendFrame({type:'input',seq:++this.directInputSeq,mission:this.mission,input:this.inputPacket()});}
 inputPacket(){return {...super.inputPacket(),loadoutVersion:this.loadoutVersion,lanPauseVersion:this.lanPauseVersions[this.role]};}
 receiveInput(input,role){
  if(input?.ready&&input.loadoutVersion!==this.remoteVersion)input={...input,ready:false};
  if(validSeq(input?.lanPauseVersion)&&input.lanPauseVersion>=this.lanPauseVersions[role])this.lanPauseVersions[role]=input.lanPauseVersion;
  else if(input)input={...input,pause:this.pauseFlags[role]};
  return super.receiveInput(input,role);
 }
 pause(){if(!this.code)return;this.lanPauseVersions[this.role]++;super.pause();this.sendPause();}
 resume(){if(!this.code)return;this.lanPauseVersions[this.role]++;super.resume();this.sendPause();}
 sendPause(){this.peer?.send({type:'lan-pause',mission:this.mission,role:this.role,version:this.lanPauseVersions[this.role],paused:this.pauseFlags[this.role]});}
 async start(){
  if(this.baseState!=='waiting'||!this.canStart)return false;
  this.room.status='playing';this.peer.send({type:'lan-start',mission:0});this.beginStage(0);this.refresh();
  // Pairing metadata is a best-effort update, never a gate on local gameplay.
  void this.request(`/api/rooms/${this.code}/start`).catch(()=>this.emit({type:'coop-issue',temporary:true}));return true;
 }
 async sync(){
  if(!this.code||this.baseState!=='waiting'||this.inflight)return null;
  const epoch=this.closedEpoch;
  this.inflight=this.request(`/api/rooms/${this.code}/status`).then(result=>{
   if(epoch!==this.closedEpoch)return null;
   // Metadata must not overwrite choices/loadouts already exchanged directly.
   for(const role of ['host','guest'])if(result.room?.[role]&&!this.room[role])this.room[role]=result.room[role];
   if(result.room?.status==='closed')this.fail('room-closed');this.refresh();return result;
  }).catch(error=>{if(error.status===404&&epoch===this.closedEpoch)this.fail('room-closed');return null;}).finally(()=>{this.inflight=null;});return this.inflight;
 }
 beginStage(mission){
  this.terminalAck=false;this.lastTerminalAt=-Infinity;
  this.room.mode='lan';if(this.room[this.role])this.room[this.role].loadout=this.loadout();
  super.beginStage(mission);
 }
 stageOver(win){
  if(this.role!=='host')return;
  const g=this.game,result={win,stage:{...g.stage,mode:'campaign'},coins:g.coins,materials:{...g.materials},stars:win?1+(g.kills/Math.max(1,g.spawned)>=.65?1:0)+(g.hits===0?1:0):0,seen:[...g.seen]};
  this.settlements.push({mission:this.mission,result});this.settlePending(this.settlements);
  super.stageOver(win);
 }
 settlePending(records){
  for(const record of (Array.isArray(records)?records:[]).slice(0,27)){
   if(!validSeq(record.mission)||record.mission>26||this.settled.has(record.mission)||!record.result?.stage||record.result.stage.id!==`${Math.floor(record.mission/3)+1}-${record.mission%3+1}`)continue;
   const r=record.result,stage={...r.stage,chapter:Math.floor(record.mission/3),substage:record.mission%3,mode:'campaign'};
   this.settled.add(record.mission);this.progress.settle({...r,stage,seen:(r.seen||[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=30)});
   this.emit({type:'lan-progress',mission:record.mission});
  }
 }
 snapshot(compact=false){const frame=super.snapshot(false);frame.lanResults=this.settlements;frame.lanPauseVersions={...this.lanPauseVersions};if(compact)frame.events=frame.events.filter(record=>record.serial>this.peerEventAck);return compact?packCoopSnapshot(frame):frame;}
 applySnapshot(snapshot,seq,options={}){
  const frame=unpackCoopSnapshot(snapshot);if(!frame||!validSeq(seq)||seq<=(options.source==='direct'?this.lastDirectSnapshotSeq:this.lastSnapshotSeq))return false;
  if(this.role==='guest'&&frame.pauseFlags){
   const version=frame.lanPauseVersions?.host;
   if(!validSeq(version)||version<this.lanPauseVersions.host)frame.pauseFlags={...frame.pauseFlags,host:this.pauseFlags.host};
   else this.lanPauseVersions.host=version;
  }
  const applied=super.applySnapshot(frame,seq,options);if(applied){this.settlePending(frame.lanResults);if(['finished','failed'].includes(this.baseState))this.peer?.send({type:'lan-terminal-ack',mission:this.mission,state:this.baseState});}return applied;
 }
 action(type,node){
  if(type==='ready'&&!this.canReady)return false;
  const used=super.action(type,node);
  if(used&&this.role==='guest'){
   if(type==='bomb')this.game.shake=Math.max(this.game.shake,4);
   if(type==='skill')this.game.effect(this.game.ship.id+'_LAN_Response',this.local.player.x,this.local.player.y,80,.18);
   this.sendPeerInput();
  }return used;
 }
 update(dt){
  if(this.peer?.open&&this.loadoutAck!==this.loadoutVersion&&this.now()-this.lastLoadoutAt>700)this.sendLoadout();
  // Fixed local simulation cadence; neither pilot waits for an HTTP response.
  if(this.role==='host'){
   this.lanSteps+=Math.max(0,Math.min(.05,Number(dt)||0));let steps=0;
   while(this.lanSteps>=1/60&&steps++<4){super.update(1/60);this.lanSteps-=1/60;}
   if(!steps)super.update(0);
  }else super.update(dt);
  // Credits deliberately call update(0); final state/rewards must still arrive.
  if(this.role==='host'&&['finished','failed'].includes(this.baseState)&&!this.terminalAck&&this.peer?.open&&this.now()-this.lastTerminalAt>=200){this.lastTerminalAt=this.now();void this.peer.sendFrame({type:'frame',seq:++this.directFrameSeq,snapshot:this.snapshot(true)});}
 }
 checkNetwork(){
  super.checkNetwork();
  if(this.baseState==='waiting'&&this.peer?.state==='connecting'&&this.now()-this.lastPeerAt>60000){this.peer.state='unavailable';this.onChange(this);}
 }
}
