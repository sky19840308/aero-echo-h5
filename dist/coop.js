import {Game} from './engine.js?v=30.1';
import {segmentHitsAabb,segmentPointDistance} from './combat-geometry.js?v=30.1';
import {W,H,SHIPS,ENEMIES,stageConfig} from './data.js?v=30.1';
import {hazardImpactArt} from './weapons.js?v=30.1';
import {packCoopSnapshot,unpackCoopSnapshot} from './coop-wire.js?v=30.1';
import {CoopPeer} from './coop-peer.js?v=30.1';
import {normalizeProfile} from './profile.js?v=30.1';

// One authoritative world, two independent, disposable pilots. This module never
// imports the campaign profile or emits the single-player settlement event.
const ROLES=['host','guest'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const advanceCrash=(player,dt,survivalCore=0)=>{const crash=player.hitCrash;if(!crash)return false;crash.age+=dt;player.x=clamp(crash.x+crash.vx*crash.age,22,W-22);player.y=Math.min(H+24,crash.y+crash.vy*crash.age+270*crash.age*crash.age);if(crash.age>=crash.duration){player.hitCrash=null;player.x=clamp(crash.x,35,W-35);player.y=H*.77;player.respawnTime=player.lives>0?5+.2*clamp(Number(survivalCore)||0,0,2):0;player.invulnerable=player.respawnTime;}return true;};
const PILOT_KEYS=['ship','player','talents','growth','dps','level','weaponLevel','weaponTier','weaponXp','bombFragments','energyAnnounced'];
const WORLD_KEYS=['state','time','clock','nextWave','wave','uid','bossAnnounced','bossDefeated','score','combo','lastKill','kills','spawned','grazes','hits','coins','lastSupply','nextHazard','shake','shock','flash','ending'];
const WORLD_ARRAYS=['enemies','bullets','pickups','hazards','effects','weaponEffects','particles','texts','lootBursts','wingmen'];
const RELAY_EVENTS=new Set(['boss','boss-end','phase','message','toast','haptic','sound','camera-impact','coop-death','coop-revive','coop-upgrades','wingman-charge']);
const NOISY_SOUNDS=new Set(['shot','enemy-hit','boss-hit','shield-hit','graze','sprite','enemy-fire']);
const OMIT=new Set(['cfg','target','hit','volley','ship','_poolId']);
const choiceOf=value=>({shipIndex:clamp(Math.floor(Number(value?.shipIndex??value?.ship)||0),0,2),skin:clamp(Math.floor(Number(value?.skin)||0),0,3)});
const plain=(value,depth=0)=>{
 if(value===null||typeof value==='boolean'||typeof value==='string')return typeof value==='string'?value.slice(0,160):value;
 if(typeof value==='number')return Number.isFinite(value)?value:0;
 if(depth>4||!value||typeof value!=='object'||value instanceof Set)return undefined;
 if(Array.isArray(value))return value.slice(0,1280).map(item=>plain(item,depth+1));
 const out={};for(const [key,item]of Object.entries(value)){if(OMIT.has(key)||key.startsWith('_'))continue;const safe=plain(item,depth+1);if(safe!==undefined)out[key]=safe;}return out;
};

export class CoopGame extends Game {
 constructor({mission=0,room,crew=null,localRole='host',onEvent=()=>{},seed=Date.now(),difficulty='normal',pace='quick',stageMode='coop'}){
  const stage=stageConfig(Math.floor(mission/3),mission%3,stageMode,pace);
  super({stage,ship:choiceOf(room?.host?.choice).shipIndex,profile:{},difficulty,pace,seed,onEvent});
  this.contextDepth=0;this.eventQueue=[];const dispatch=this.emit;this.emit=event=>{
   if(this.contextDepth)this.eventQueue.push({...event,role:event.role||this.activePilot?.role});else dispatch(event);
  };this.flushEvents=()=>{if(this.contextDepth)return;const queued=this.eventQueue.splice(0);for(const event of queued)dispatch(event);};
  this.mission=mission;this.localRole=localRole;this.coop=true;this.lan=room?.mode==='lan';this.local=room?.mode==='local';this.persistentLoadout=this.lan||this.local;this.crew=ROLES.map((role,index)=>{
   const member=room?.[role]||{},choice=choiceOf(member.choice),previous=crew?.find(pilot=>pilot.role===role);
   const fresh=new Game({stage,ship:choice.shipIndex,profile:this.persistentLoadout?normalizeProfile(member.loadout):{},difficulty,pace,seed:seed+index});
   // Campaign calibration assumes permanent hangar upgrades. Co-op has none,
   // so retain the stage's intrinsic firepower curve without that gear penalty.
   const baseDps=this.persistentLoadout?fresh.dps:fresh.ship.dps*([180,260,380,520,700,900,1150,1450,1900][stage.chapter]/120);
   const pilot={role,id:String(member.id||role),name:String(member.name||role).slice(0,72),...choice,ship:SHIPS[choice.shipIndex],alive:previous?previous.alive:true,points:previous?.points||0,upgrades:{fire:previous?.upgrades?.fire||0,shield:previous?.upgrades?.shield||0,cooldown:previous?.upgrades?.cooldown||0},ready:false,ack:-1,commandAck:previous?.commandAck||0,baseDps};
   for(const key of PILOT_KEYS)if(key!=='ship')pilot[key]=fresh[key];
   if(!this.persistentLoadout)pilot.talents={...pilot.upgrades};pilot.dps=pilot.baseDps*(1+.10*pilot.upgrades.fire);
   if(previous?.alive){
    for(const key of ['lives','energy','bombs','skillCd','armorCd','stacks','consecutive'])pilot.player[key]=previous.player[key];
    pilot.player.wingmanCharges=mission%3===0?3:clamp(Number(previous.player.wingmanCharges)||0,0,3);pilot.player.wingmanCall=null;
    pilot.player.lives=clamp(previous.player.lives||3,1,pilot.player.maxLives);pilot.player.bombs=Math.min(pilot.player.maxBombs,pilot.player.bombs);
    for(const key of ['weaponLevel','weaponXp','bombFragments','energyAnnounced'])pilot[key]=previous[key];
    if(previous.reviving){pilot.player.lives=pilot.player.maxLives;pilot.player.bombs=pilot.player.maxBombs;}
   }
   if(!pilot.alive){pilot.player.lives=0;pilot.player.bombs=0;}
   pilot.player.x=pilot.player.targetX=W*(index===0?.35:.65);pilot.player.y=pilot.player.targetY=H*.77;
   return pilot;
  });
  this.selectPilot(localRole);
 }
 selectPilot(role=this.localRole){const pilot=this.crew.find(item=>item.role===role)||this.crew[0];this.activePilot=pilot;for(const key of PILOT_KEYS)this[key]=pilot[key];return pilot;}
 withPilot(pilot,fn){const old=this.activePilot;this.selectPilot(pilot.role);this.contextDepth++;try{return fn();}finally{for(const key of PILOT_KEYS)pilot[key]=this[key];this.selectPilot(old?.role||this.localRole);this.contextDepth--;this.flushEvents();}}
  living(){return this.crew.filter(pilot=>pilot.alive&&pilot.player.lives>0);}
 energy(amount){if(this.activePilot?.alive!==false)super.energy(amount);}
 targetPilot(){const living=this.living();return living[Math.floor(this.clock*1.7)%Math.max(1,living.length)]||this.crew[0];}
 start(){super.start();this.selectPilot(this.localRole);}
 update(dt){
  if(this.state!=='playing'&&this.state!=='ending')return;dt=clamp(Number(dt)||0,0,.05);this.time+=dt;this.clock+=dt;this.shake=Math.max(0,this.shake-dt*18);this.shock=Math.max(0,(this.shock||0)-dt);this.flash=Math.max(0,this.flash-dt*2.5);
  if(this.state==='playing'){
   this.updatePlayer(dt);
   if(this.stage.mode!=='boss'&&this.time<this.stage.duration-(this.stage.boss?8:4)&&this.time>=this.nextWave)this.spawnWave();
   if(this.stage.boss&&!this.bossAnnounced&&this.time>=this.stage.duration-3){this.bossAnnounced=true;this.emit({type:'message',speaker:'RADAR / 目标接近',text:'大型能量反应。准备迎战。',duration:2.8});this.combatSound('warning');}
   if(this.stage.boss&&this.time>=this.stage.duration&&!this.boss)this.spawnBoss();
   if(this.stage.chapter>0&&this.time>=this.nextHazard&&this.time<this.stage.duration-9){this.withPilot(this.targetPilot(),()=>this.environmentHazard());this.nextHazard=this.time+13;}
   this.updateEnemies(dt);this.updateBoss(dt);this.updateWingmen(dt);this.updateBullets(dt);this.updateHazards(dt);this.updatePickups(dt);
   this.checkDeaths();this.updateDeadCrashes(dt);
   if(!this.living().length){if(!this.crew.some(pilot=>pilot.player.hitCrash))this.finish(false);}
   else if(!this.stage.boss&&this.time>this.stage.duration&&(this.enemies.every(enemy=>!enemy.alive&&!enemy.crashing)||this.time>this.stage.duration+7))this.finish(true);
   if(this.time-this.lastKill>2.5)this.combo=Math.max(1,this.combo-dt*.04);
   if(this.bossDefeated&&this.state==='playing'){this.state='ending';this.ending=2.3;}
  }else{this.updateEnemies(dt);this.updateCrashes(dt);this.updatePickups(dt);if(!this.living().length){if(!this.crew.some(pilot=>pilot.player.hitCrash))this.finish(false);}else{this.ending-=dt;if(this.ending<=0)this.finish(true);}}
  this.updateVisuals(dt);this.selectPilot(this.localRole);
 }
 updatePlayer(dt){for(const pilot of this.living())this.withPilot(pilot,()=>super.updatePlayer(dt));}
 updateDeadCrashes(dt){for(const pilot of this.crew){const p=pilot.player;if(pilot.alive)continue;advanceCrash(p,dt,pilot.talents?.survival_core);}}
 updateCrashes(dt){for(const pilot of this.crew)advanceCrash(pilot.player,dt,pilot.talents?.survival_core);}
 shoot(x,y,angle,speed,damage,owner='enemy',options={}){return super.shoot(x,y,angle,speed,damage,owner,owner==='player'?{...options,pilot:this.activePilot.role}:options);}
 use(role,type){const pilot=this.crew.find(item=>item.role===role);if(!pilot?.alive||this.state!=='playing')return false;return this.withPilot(pilot,()=>{
  if(type==='skill'){const used=super.skill();if(used&&!this.persistentLoadout)this.player.skillCd=this.ship.cooldown*(1-.05*pilot.upgrades.cooldown);return used;}
  if(type==='bomb')return super.bomb();if(type==='ultimate')return super.ultimate();if(type==='wingmen')return super.callWingmen();return false;
 });}
 updateEnemies(dt){const target=this.targetPilot();this.withPilot(target,()=>super.updateEnemies(dt));for(const pilot of this.living())if(pilot!==target)this.withPilot(pilot,()=>{
  const p=pilot.player;for(const enemy of this.enemies){
   if(!enemy.alive||enemy.phaseOut)continue;
   if(enemy.type===20&&distance(enemy,p)<220){p.x+=clamp(enemy.x-p.x,-17*dt,17*dt);p.y+=clamp(enemy.y-p.y,-9*dt,9*dt);p.x=clamp(p.x,20,W-20);p.y=clamp(p.y,155,H-93);}
   if(distance(enemy,p)<enemy.r+p.r){this.hurtPlayer(Math.max(65,enemy.cfg.damage*1.6));if(enemy.diveState==='diving'||enemy.diveState==='coasting'){enemy.hp=0;this.killEnemy(enemy);}else if(enemy.cfg.category==='scout')this.damageEnemy(enemy,enemy.hp+1);}
  }
 });}
 updateBoss(dt){const target=this.targetPilot();this.withPilot(target,()=>super.updateBoss(dt));const boss=this.boss;if(!boss||boss.dead)return;for(const pilot of this.living())if(pilot!==target&&Math.abs(pilot.player.x-boss.x)<boss.w*.32&&Math.abs(pilot.player.y-boss.y)<boss.h*.27)this.withPilot(pilot,()=>this.hurtPlayer(160*this.difficulty.damage));}
 updateBullets(dt){
  for(const b of this.bullets){
   if(!b.alive)continue;b.age+=dt;b.px=b.x;b.py=b.y;let scale=1;
   if(b.owner==='enemy'&&!b.unclearable&&this.living().some(pilot=>pilot.ship.id==='WraithX'&&pilot.player.ultTime>0))scale=.6;
   for(const h of this.hazards)if(h.type==='time'&&h.age>h.warn&&b.owner==='enemy'&&Math.hypot(h.x-b.x,h.y-b.y)<h.r)scale*=h.age-h.warn<2?.27:1.15;
   if(b.hold&&b.age<b.hold)scale=0;
   if(b.burstAt&&b.age>b.burstAt){this.weaponEffect(b.art,b.x,b.y,55,.3);this.ring(b.x,b.y,8,170*this.difficulty.speed,b.damage*.7,0,{art:b.burstArt,color:b.color});b.alive=false;continue;}
   if(b.homing&&b.target?.alive!==false&&!b.target?.dead){const a=Math.atan2(b.target.y-b.y,b.target.x-b.x),speed=b.maxSpeed||Math.min(550,300+b.age*220),t=Math.min(1,dt*(b.trackingRate||6));b.vx+=(Math.cos(a)*speed-b.vx)*t;b.vy+=(Math.sin(a)*speed-b.vy)*t;}
   b.x+=b.vx*dt*scale;b.y+=b.vy*dt*scale;
   if(b.bounce>0&&(b.x<b.r||b.x>W-b.r)){b.x=clamp(b.x,b.r,W-b.r);b.vx*=-1;b.bounce--;}
   if(b.x<-55||b.x>W+55||b.y<-70||b.y>H+65||b.age>10){if(b.shock&&b.owner==='enemy'&&b.y>H-130&&b.y<H+30)this.ring(b.x,Math.min(b.y,H-110),12,145,b.damage*.6);b.alive=false;continue;}
   if(b.owner==='player'){
    const owner=this.crew.find(pilot=>pilot.role===b.pilot)||this.crew[0];
    this.withPilot(owner,()=>{
     for(const enemy of this.enemies){if(!b.alive)break;if(!enemy.alive||enemy.phaseOut||b.hit.has(enemy.id))continue;const hit=b.accelerated?segmentHitsAabb(b.px,b.py,b.x,b.y,enemy.x-enemy.r-b.r,enemy.y-enemy.r-b.r,enemy.x+enemy.r+b.r,enemy.y+enemy.r+b.r):Math.abs(b.x-enemy.x)<enemy.r+b.r&&Math.abs(b.y-enemy.y)<enemy.r+b.r;if(hit){b.hit.add(enemy.id);this.damageEnemy(enemy,b.damage,b.x);if(!b.wingman){owner.player.consecutive++;owner.player.lastShotHit=this.time;}if(b.pierce>0)b.pierce--;else b.alive=false;}}
     const boss=this.boss,bossHit=boss&&b.accelerated?segmentHitsAabb(b.px,b.py,b.x,b.y,boss.x-boss.w*.42,boss.y-boss.h*.3,boss.x+boss.w*.42,boss.y+boss.h*.3):boss&&Math.abs(b.x-boss.x)<boss.w*.42&&Math.abs(b.y-boss.y)<boss.h*.3;if(b.alive&&boss&&!boss.dead&&bossHit){this.damageBoss(b.damage,b.x,b.y);b.alive=false;if(!b.wingman){owner.player.consecutive++;owner.player.lastShotHit=this.time;}}
    });
   }else{
    const wingman=this.wingmen.filter(unit=>['active','entering'].includes(unit.mode)&&!unit.crash).sort((a,c)=>distance(b,a)-distance(b,c)).find(unit=>distance(b,unit)<b.r+unit.r);
    if(wingman){this.withPilot(this.crew.find(pilot=>pilot.role===wingman.role)||this.crew[0],()=>this.damageWingman(wingman));b.alive=false;}
    else for(const pilot of this.living()){
     if(!b.alive)break;const p=pilot.player,d=segmentPointDistance(b.px,b.py,b.x,b.y,p.x,p.y);this.withPilot(pilot,()=>{
      if(d<b.r+p.r){if(p.invulnerable<=0){this.hurtPlayer(b.damage);b.alive=false;if(b.shock)this.ring(b.x,b.y,12,140,b.damage*.6);}}
      else if(!b.grazed&&d<b.r+p.r+15+5*(pilot.talents.mobility_graze||0)){b.grazed=true;this.grazes++;this.score+=15;this.energy((pilot.ship.id==='WraithX'?11:5)+3*(pilot.talents.mobility_feedback||0));if(pilot.ship.id==='WraithX')p.stacks=Math.min(20,p.stacks+1);if(this.grazes%5===0){this.combatSound('graze');this.float('擦弹 +',p.x,p.y-45,'#bba5ff');}}
     });
    }
   }
  }
  const remaining=[];for(const bullet of this.bullets)if(bullet.alive)remaining.push(bullet);else{this.bulletCounts[bullet.owner]--;this.pool.release(bullet);}this.bullets=remaining;
 }
 updateHazards(dt){
  for(const h of this.hazards){
   if(!h.talentWarningApplied){const warning=Math.max(0,...this.crew.map(pilot=>Number(pilot.talents?.survival_warning)||0));h.warn=(Number(h.warn)||0)+.15*warning;h.talentWarningApplied=true;}
   h.age+=dt;if(h.age<h.warn||h.visual)continue;
   if(!h.activated){h.activated=true;const impact=hazardImpactArt(h);this.combatSound(h.skill?'boss-skill':h.soundOwner?.boss?'boss-weapon':h.soundOwner?.enemy?'enemy-special':'environment',{...h.soundOwner,art:h.activationArt||impact||h.art,x:h.x,hazard:h.type});if(impact&&['blast','fire','mine','cross'].includes(h.type))this.weaponEffect(impact,h.x,h.y,h.r*2,.35);}
   if(h.volley&&!h.triggered){h.triggered=true;h.volley();}
   for(const pilot of this.living()){
    const p=pilot.player;let contact=false;
    if(h.type==='laser')contact=Math.abs(p.x-h.x)<h.width/2+p.r&&p.y>h.y;
    else if(h.type==='cross'){const dx=p.x-h.x,dy=p.y-h.y;contact=Math.max(Math.abs(dx),Math.abs(dy))<h.r&&Math.min(Math.abs(dx-dy),Math.abs(dx+dy))/Math.SQRT2<10+p.r;}
    else if(['blast','fire','mine'].includes(h.type))contact=Math.hypot(p.x-h.x,p.y-h.y)<h.r+p.r;
    if(contact){this.withPilot(pilot,()=>this.hurtPlayer(h.damage));if(h.type==='mine')h.age=h.warn+h.duration;}
   }
  }this.hazards=this.hazards.filter(h=>h.age<h.warn+h.duration);
 }
 updatePickups(dt){for(const item of this.pickups.slice()){
  if(item.dead)continue;item.age+=dt;const pilot=this.living().sort((a,b)=>distance(item,a.player)-distance(item,b.player))[0];if(!pilot){item.y+=50*dt;continue;}const p=pilot.player,d=distance(item,p);
  const talents=pilot.talents||{};item.attracting=item.age>.2&&(d<pilot.growth.magnet+35*(talents.mobility_magnet||0)||this.bossDefeated);if(item.attracting){const speed=this.bossDefeated?Math.min(1050,d/Math.max(dt,.001)):220+Math.max(0,pilot.growth.magnet-10-d)*4,step=Math.min(d,speed*dt*(1+.25*(talents.mobility_salvage||0)));item.x+=(p.x-item.x)/Math.max(1,d)*step;item.y+=(p.y-item.y)/Math.max(1,d)*step;}else item.y+=50*dt;
  if(item.age>.2&&distance(item,p)<19)this.withPilot(pilot,()=>super.collect(item));if(item.y>H+25||item.age>17)item.dead=true;
 }this.pickups=this.pickups.filter(item=>!item.dead);}
 hurtPlayer(damage,art=''){super.hurtPlayer(damage,art);if(this.player.lives<=0)this.killPilot(this.activePilot);}
 killPilot(pilot){
  if(!pilot.alive)return;pilot.alive=false;pilot.points=0;pilot.upgrades={fire:0,shield:0,cooldown:0};if(!this.persistentLoadout)pilot.talents={};pilot.dps=pilot.baseDps;pilot.weaponLevel=1;pilot.weaponXp=0;pilot.bombFragments=0;pilot.energyAnnounced=false;
  Object.assign(pilot.player,{lives:0,energy:0,bombs:0,skillCd:0,skillTime:0,ultTime:0,heroBomb:null,bombReturn:0,armorCd:0,stacks:0,consecutive:0});
  // withPilot's finally captures the current context, so reset both references.
  if(this.activePilot===pilot){this.talents=pilot.talents;this.dps=pilot.dps;this.weaponLevel=1;this.weaponXp=0;this.bombFragments=0;this.energyAnnounced=false;}
  this.emit({type:'coop-death',role:pilot.role,mission:this.mission});
 }
 checkDeaths(){for(const pilot of this.crew)if(pilot.alive&&pilot.player.lives<=0)this.killPilot(pilot);}
 upgrade(role,node){const pilot=this.crew.find(item=>item.role===role);if(this.persistentLoadout||!pilot?.alive||pilot.points<1||!['fire','shield','cooldown'].includes(node)||pilot.upgrades[node]>=8)return false;
  pilot.points--;pilot.upgrades[node]++;pilot.talents={...pilot.upgrades};pilot.dps=pilot.baseDps*(1+.10*pilot.upgrades.fire);this.selectPilot(this.localRole);return true;
 }
 finish(win){if(this.state==='finished')return;if(win&&this.bossDefeated){for(const item of this.pickups){const pilot=this.living().sort((a,b)=>distance(item,a.player)-distance(item,b.player))[0];if(pilot&&!item.collected)this.withPilot(pilot,()=>super.collect(item));}this.pickups=[];}this.state='finished';this.emit({type:'coop-stage-over',win,mission:this.mission});}
 snapshot(){
  const game={};for(const key of WORLD_KEYS)game[key]=plain(this[key]);for(const key of WORLD_ARRAYS)game[key]=this[key].slice(0,key==='bullets'?1280:key==='particles'?160:key==='texts'?24:120).map(item=>{
   const record=plain(item);if(key==='wingmen')record.ship=item.ship;if(key==='bullets'&&item.hit?.size)record.hitIds=[...item.hit].filter(id=>integer(id,0,Number.MAX_SAFE_INTEGER)).slice(0,120);if(key==='bullets'&&item.target){const pilot=this.crew.find(p=>p.player===item.target);if(pilot)record.targetPilot=pilot.role;else if(item.target===this.boss)record.targetBoss=true;else if(this.enemies.includes(item.target))record.targetEnemy=item.target.id;else record.targetPoint={x:item.target.x,y:item.target.y};}return record;
  });game.boss=this.boss?plain(this.boss):null;
  const crew=this.crew.map(pilot=>({role:pilot.role,shipIndex:pilot.shipIndex,skin:pilot.skin,alive:pilot.alive,points:pilot.points,upgrades:{...pilot.upgrades},ready:pilot.ready,ack:pilot.ack,commandAck:pilot.commandAck,weaponLevel:pilot.weaponLevel,weaponXp:pilot.weaponXp,bombFragments:pilot.bombFragments,energyAnnounced:pilot.energyAnnounced,player:plain(pilot.player)}));
  return {crew,game};
 }
 restore(snapshot){
  snapshot=unpackCoopSnapshot(snapshot);if(!snapshot)throw new Error('Invalid co-op frame');
  for(const key of WORLD_KEYS)if(snapshot.game?.[key]!==undefined)this[key]=snapshot.game[key];
  for(const key of WORLD_ARRAYS){const items=Array.isArray(snapshot.game?.[key])?snapshot.game[key]:[],reuse=this.localRole==='guest'&&['enemies','bullets','pickups','wingmen'].includes(key)?new Map(this[key].map(item=>[item.id,item])):null;this[key]=items.map(item=>{const old=reuse?.get(item.id);return old?Object.assign(old,item):{...item};});}
  for(const enemy of this.enemies)enemy.cfg=ENEMIES[enemy.type-1]||ENEMIES[0];for(const bullet of this.bullets){if(this.localRole==='host')bullet.hit=new Set((Array.isArray(bullet.hitIds)?bullet.hitIds:[]).filter(id=>integer(id,0,Number.MAX_SAFE_INTEGER)).slice(0,120));delete bullet.hitIds;}
  this.boss=snapshot.game?.boss?{...snapshot.game.boss,parts:(snapshot.game.boss.parts||[]).map(part=>({...part}))}:null;
  for(const incoming of snapshot.crew||[]){const pilot=this.crew.find(item=>item.role===incoming.role);if(!pilot)continue;for(const key of ['alive','points','ready','ack','commandAck','weaponLevel','weaponXp','bombFragments','energyAnnounced'])if(incoming[key]!==undefined)pilot[key]=incoming[key];
   pilot.upgrades={fire:clamp(incoming.upgrades?.fire||0,0,8),shield:clamp(incoming.upgrades?.shield||0,0,8),cooldown:clamp(incoming.upgrades?.cooldown||0,0,8)};if(!this.persistentLoadout)pilot.talents={...pilot.upgrades};pilot.dps=pilot.baseDps*(1+.10*pilot.upgrades.fire);Object.assign(pilot.player,incoming.player);pilot.player.maxBombs=5;pilot.player.bombs=clamp(Number(pilot.player.bombs)||0,0,5);
  }for(const bullet of this.bullets)if(bullet.homing){bullet.target=bullet.targetPilot?this.crew.find(p=>p.role===bullet.targetPilot)?.player:bullet.targetBoss?this.boss:bullet.targetEnemy?this.enemies.find(e=>e.id===bullet.targetEnemy):bullet.targetPoint;if(!bullet.target)bullet.homing=false;}
  this.bulletCounts={enemy:this.bullets.filter(b=>b.owner==='enemy').length,player:this.bullets.filter(b=>b.owner==='player').length};this.selectPilot(this.localRole);
 }
}

export class CoopSession {
 constructor({account,onEvent=()=>{},onChange=()=>{},onStage=async()=>{},now=()=>Date.now(),autoSync=true,interval=200}={}){
  if(!account)throw new Error('A signed-in account is required');this.account=account;this.emit=onEvent;this.onChange=onChange;this.onStage=onStage;this.now=now;this.autoSync=autoSync;this.interval=clamp(interval,100,2000);
  this.state='closed';this.baseState='closed';this.role=null;this.room=null;this.code='';this.game=null;this.local=null;this.mission=0;this.seq=0;this.lastSnapshotSeq=-1;this.lastGuestSeq=-1;this.commands=[];this.commandSeq=0;this.readyRequested=false;this.pauseFlags={host:false,guest:false};this.networkPaused=false;this.peerStale=false;this.remoteNetworkPaused=false;this.failureReason='';this.transitionLeft=0;this.target=null;this.identity=null;this.inflight=null;this.closedEpoch=0;this.stageEpoch=0;this.snapshotAge=0;this.interpolation=[];this.lastPeerAt=this.now();this.lastSuccessAt=this.now();this.stageLoading=null;this.lastStamp='';
  this.guestCompact=false;this.peerEventAck=0;this.serverSamples=new Map();this.rtt=0;this.inputTimer=null;this.lastInputSendAt=-Infinity;
  this.peer=null;this.lastHTTPAt=-Infinity;this.directFrameSeq=0;this.lastDirectSnapshotSeq=-1;this.directInputSeq=0;this.lastDirectInputSeq=-1;this.peerFrameTime=0;this.peerInputTime=0;
  this.eventSerial=0;this.lastEventSerial=0;this.eventLog=[];this.soundTimes=new Map();const dispatch=this.emit;this.localDispatch=dispatch;this.emit=event=>{
   if(this.role==='host'&&RELAY_EVENTS.has(event.type)){
    const key=event.type==='sound'&&NOISY_SOUNDS.has(event.name)?`${event.name}:${event.ship||event.boss||event.enemy||''}`:null,now=this.now();
    if(!key||now-(this.soundTimes.get(key)??-Infinity)>=120){
     if(key)this.soundTimes.set(key,now);const safe=plain(event);if(typeof event.ship==='string')safe.ship=event.ship;
     this.eventLog.push({serial:++this.eventSerial,mission:integer(event.mission,0,26)?event.mission:this.mission,event:safe});if(this.eventLog.length>64)this.eventLog.shift();
    }
   }dispatch(event);
  };
 }
 signedIn(){const id=this.account.user?.id;if(!id)throw Object.assign(new Error('Please sign in before online co-op'),{status:401});return String(id);}
 assertIdentity(){if(this.identity&&String(this.account.user?.id||'')!==this.identity){this.fail('identity-changed');this.stopTimer();return false;}return true;}
 async request(path,body={},options={}){return this.account.request(path,{method:'POST',body,accountId:this.identity,...options});}
 async create(choice){return this.connect('/api/rooms',{choice:choiceOf(choice)});}
 async join(code,choice){code=String(code||'').trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw new Error('Invalid room code');return this.connect(`/api/rooms/${code}/join`,{choice:choiceOf(choice)});}
 async reconnect(code){code=String(code||'').trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw new Error('Invalid room code');return this.connect(`/api/rooms/${code}/reconnect`,{});}
 async connect(path,body){
  if(this.code&&this.baseState!=='closed')await this.close();this.identity=this.signedIn();const epoch=++this.closedEpoch;const result=await this.request(path,body);if(epoch!==this.closedEpoch||!this.assertIdentity())return null;
  this.game=null;this.local=null;this.interpolation=[];++this.stageEpoch;
  this.guestCompact=false;this.peerEventAck=0;this.serverSamples.clear();
  this.eventSerial=0;this.lastEventSerial=0;this.eventLog=[];this.soundTimes.clear();
  this.room=result.room||result;this.role=this.room.role||((String(this.room.host?.id)===this.identity)?'host':'guest');this.code=this.room.code;this.mission=this.room.mission||0;this.baseState=this.room.status==='playing'?'loading':'waiting';this.state=this.baseState;this.failureReason='';this.pauseFlags={host:!!this.room.hostPaused,guest:!!this.room.guestPaused};this.seq=Number(this.room[this.role==='host'?'hostSeq':'guestSeq'])||0;this.lastSnapshotSeq=-1;this.lastGuestSeq=-1;this.commands=[];this.commandSeq=0;this.readyRequested=false;this.receivedFailed=false;this.receivedFinished=false;this.networkPaused=false;this.peerStale=false;this.remoteNetworkPaused=false;this.target=null;this.lastPeerAt=this.now();this.lastSuccessAt=this.now();this.refresh();this.startTimer();
  if(result.snapshot)this.applySnapshot(result.snapshot,result.snapshotSeq||0);if(this.role==='host'&&result.guestInput){this.lastGuestSeq=Number(result.guestSeq)||0;this.receiveInput(result.guestInput,'guest');}this.openPeer();return this.room;
 }
 openPeer(){
  this.peer?.close();this.lastDirectSnapshotSeq=-1;this.lastDirectInputSeq=-1;this.directFrameSeq=0;this.directInputSeq=0;
  if(!this.autoSync||!globalThis.RTCPeerConnection)return;
  this.peer=new CoopPeer({role:this.role,code:this.code,now:this.now,request:body=>this.request(`/api/rooms/${this.code}/signal`,body),onState:()=>this.onChange(this),onPacket:packet=>{
   if(!this.assertIdentity()||packet.code!==this.code)return;this.lastPeerAt=this.now();this.peerStale=false;
   if(packet.type==='leave'){this.fail('room-closed');return;}
   if(this.role==='host'&&packet.type==='input'&&packet.mission===this.mission&&integer(packet.seq,0,Number.MAX_SAFE_INTEGER)&&packet.seq>this.lastDirectInputSeq){this.lastDirectInputSeq=packet.seq;this.receiveInput(packet.input,'guest');}
   if(this.role==='guest'&&packet.type==='frame')this.applySnapshot(packet.snapshot,packet.seq,{source:'direct',age:clamp(this.peer.rtt/2000,0,.15)});
   this.refresh();
  }});void this.peer.start().catch(()=>{if(this.peer)this.peer.state='relay';});
 }
 peerHealthy(){return !!this.peer?.open&&this.now()-this.peer.lastSeen<2000;}
 inputPacket(){return {target:this.target?{...this.target}:null,commands:this.commands.slice(0,24).map(item=>({...item})),pause:!!this.pauseFlags[this.role],ready:this.readyRequested||!!this.local?.ready,ack:this.local?.ack??-1,protocol:2,eventAck:this.lastEventSerial};}
 sendPeerInput(){return this.peer?.send({type:'input',seq:++this.directInputSeq,mission:this.mission,input:this.inputPacket()});}
 async start(){if(this.role!=='host'||this.baseState!=='waiting')return false;const result=await this.request(`/api/rooms/${this.code}/start`);if(!this.assertIdentity())return false;this.room=result.room||result;this.beginStage(0);this.refresh();await this.sync();return true;}
 startTimer(){this.stopTimer();if(this.autoSync)this.timer=setInterval(()=>{this.checkNetwork();void this.sync().catch(()=>{});},this.interval);}
 stopTimer(){if(this.timer)clearInterval(this.timer);this.timer=null;if(this.inputTimer)clearTimeout(this.inputTimer);this.inputTimer=null;}
 beginStage(mission){
  const old=this.game?.crew;if(old&&mission%3===0){for(const pilot of old)if(!pilot.alive){pilot.alive=true;pilot.reviving=true;pilot.player.lives=pilot.player.maxLives;pilot.player.bombs=2;pilot.player.energy=0;pilot.player.skillCd=0;pilot.player.armorCd=0;this.emit({type:'coop-revive',role:pilot.role,mission});}}
  this.mission=mission;this.target=null;this.commands=[];this.readyRequested=false;this.interpolation=[];this.serverSamples.clear();this.snapshotAge=0;this.baseState='loading';this.transitionLeft=0;
  this.game=new CoopGame({mission,room:this.room,crew:old,localRole:this.role,onEvent:event=>this.gameEvent(event)});this.local=this.game.selectPilot(this.role);this.loadStage();this.refresh();
 }
 loadStage(){
  const epoch=++this.stageEpoch,mission=this.mission,game=this.game;this.stageLoading=Promise.resolve().then(()=>this.onStage(game.stage,{mission,crew:game.crew,room:this.room,role:this.role})).then(()=>{
   if(epoch!==this.stageEpoch||this.game!==game||this.baseState==='closed'||this.baseState==='failed')return;this.local.ack=mission;this.stageLoading=null;this.refresh();if(this.autoSync)void this.sync().catch(()=>{});
  }).catch(error=>{if(epoch===this.stageEpoch){this.stageLoading=null;this.fail('assets');this.emit({type:'coop-issue',message:String(error?.message||error)});}});
 }
 gameEvent(event){
  if(event.type==='coop-stage-over'){this.stageOver(event.win);return;}
  if(event.type==='result')return;this.emit({...event,role:event.role||this.game?.activePilot?.role});if(event.type==='coop-death')this.refresh();
 }
 stageOver(win){
  if(!win){this.fail('both-down');return;}
  if(this.mission%3!==2){this.baseState='transition';this.transitionLeft=1.4;}
  else{
   for(const pilot of this.game.crew){if(pilot.alive&&this.mode!=='lan')pilot.points+=2;pilot.ready=false;}
   this.emit({type:'coop-clear',mission:this.mission,chapter:Math.floor(this.mission/3)});
   if(this.mission===26){this.baseState='finished';this.emit({type:'coop-over',win:true,mission:this.mission});}
   else this.baseState='intermission';
  }this.refresh();
 }
 fail(reason){if(['failed','closed','finished'].includes(this.baseState))return;this.failureReason=reason;this.baseState='failed';if(this.game)this.game.state='finished';this.refresh();this.emit({type:'coop-over',win:false,reason,mission:this.mission});if(reason!=='both-down')this.emit({type:'coop-disconnected',reason});}
 refresh(){
  this.networkPaused=!!this.peerStale||!!this.remoteNetworkPaused;
  this.state=['loading','playing','transition','intermission'].includes(this.baseState)&&(this.pauseFlags.host||this.pauseFlags.guest||this.networkPaused)?'paused':this.baseState;
  if(this.game&&this.baseState==='playing'){
   if(this.state==='paused'&&this.game.state!=='paused'){this.game.combatState=this.game.state;this.game.state='paused';}
   else if(this.state==='playing'&&this.game.state==='paused')this.game.state=this.game.combatState==='ending'?'ending':'playing';
  }
  if(this.game)this.local=this.game.selectPilot(this.role);
  const stamp=JSON.stringify([this.state,this.mission,this.pauseFlags,this.networkPaused,this.failureReason,this.room?.status,this.room?.guest?.id,this.room?.guest?.name,this.room?.guest?.choice,this.game?.crew.map(p=>[p.alive,p.points,p.ready,p.ack,p.upgrades])]);
  if(stamp!==this.lastStamp){this.lastStamp=stamp;this.onChange(this);}
 }
 checkNetwork(){
  if(!this.code||['closed','finished','failed','waiting'].includes(this.baseState)||!this.room?.guest)return;
  if(this.peerHealthy()){this.lastPeerAt=this.now();this.peerStale=false;this.refresh();return;}
  const age=this.now()-this.lastPeerAt;this.peerStale=age>5000;if(age>45000)this.fail('peer-timeout');else this.refresh();
 }
 async sync(){
  if(this.inflight)return this.inflight;if(!this.code||this.baseState==='closed'||!this.assertIdentity())return null;
  if(this.peerHealthy()&&this.now()-this.lastHTTPAt<1800)return null;this.lastHTTPAt=this.now();
  const epoch=this.closedEpoch,seq=++this.seq,mission=this.mission;
  const sentAt=this.now();this.lastInputSendAt=sentAt;
  const input=this.inputPacket();
  const body={seq,mission,input};if(this.role==='guest')body.after=this.lastSnapshotSeq;if(this.role==='host'&&this.game)body.snapshot=this.snapshot(this.guestCompact);
  const controller=new AbortController();this.syncController=controller;const timeout=setTimeout(()=>controller.abort(),3500);timeout?.unref?.();
  const task=(async()=>{
   try{
    const result=await this.request(`/api/rooms/${this.code}/sync`,body,{signal:controller.signal});if(epoch!==this.closedEpoch||!this.assertIdentity())return null;
    if(result.room){this.room=result.room;if(this.room.status==='closed'){this.fail('room-closed');return result;}}
    const now=this.now(),roundTrip=Math.max(0,now-sentAt);this.rtt=this.rtt?this.rtt*.75+roundTrip*.25:roundTrip;this.lastSuccessAt=now;const serverTime=Number(result.serverTime),seen=Number(result.peerSeenAt);if(!this.peerHealthy()&&Number.isFinite(seen)&&seen>0){const age=Number.isFinite(serverTime)?Math.max(0,serverTime-seen):Math.max(0,now-seen);this.lastPeerAt=now-age;}
    if(this.role==='host'){
     if(!this.peerHealthy()&&this.game&&result.guestInput&&Number(result.guestSeq)>this.lastGuestSeq){this.lastGuestSeq=Number(result.guestSeq);if((this.room.mission??mission)===this.mission&&mission===this.mission)this.receiveInput(result.guestInput,'guest');}
    }else if(result.snapshot&&!this.peerHealthy())this.applySnapshot(result.snapshot,Number(result.snapshotSeq)||0,{age:Number.isFinite(serverTime)&&seen>0?clamp((Math.max(0,serverTime-seen)+roundTrip/2)/1000,0,.8):0});
    this.checkNetwork();this.refresh();if((this.role==='guest'&&['finished','failed'].includes(this.baseState))||(this.role==='host'&&['finished','failed'].includes(body.snapshot?.state)&&body.snapshot.state===this.baseState))this.stopTimer();return result;
   }catch(error){
    if(epoch!==this.closedEpoch)return null;
    if([401,419].includes(error?.status)){this.fail('identity-changed');this.stopTimer();}else if(error?.status===404){this.fail('room-closed');this.stopTimer();}else{this.checkNetwork();this.emit({type:'coop-issue',message:String(error?.message||error),temporary:true});}
    throw error;
   }finally{clearTimeout(timeout);if(this.syncController===controller)this.syncController=null;if(this.inflight===task)this.inflight=null;if(this.target&&(this.target.x!==input.target?.x||this.target.y!==input.target?.y))this.queueInput();}
  })();this.inflight=task;return task;
 }
 receiveInput(input,role){
  if(!input||typeof input!=='object'||Array.isArray(input))return;
  const pilot=this.game?.crew.find(item=>item.role===role);if(!pilot)return;
  if(role==='guest'){this.guestCompact=input.protocol===2;if(integer(input.eventAck,0,Number.MAX_SAFE_INTEGER))this.peerEventAck=Math.min(this.eventSerial,input.eventAck);}
  this.pauseFlags[role]=!!input.pause;if(input.ack===this.mission)pilot.ack=this.mission;if(this.baseState==='intermission')pilot.ready=!!input.ready;
  if(pilot.alive&&Number.isFinite(input.target?.x)&&Number.isFinite(input.target?.y)){pilot.player.targetX=clamp(input.target.x,20,W-20);pilot.player.targetY=clamp(input.target.y,155,H-93);}
  this.refresh();for(const command of (Array.isArray(input.commands)?input.commands:[]).slice(0,24)){
   if(!integer(command.seq,1,Number.MAX_SAFE_INTEGER)||command.seq<=pilot.commandAck)continue;
   pilot.commandAck=command.seq;if(command.type==='upgrade'&&this.baseState==='intermission'){if(this.game.upgrade(role,command.node))this.emit({type:'coop-upgrades',role,node:command.node});}
   else if(this.state==='playing')this.game.use(role,command.type);
  }
  this.refresh();
 }
 moveTo(x,y){if(this.state!=='playing'||!this.local?.alive||!Number.isFinite(x)||!Number.isFinite(y))return;const next={x:clamp(x,20,W-20),y:clamp(y,155,H-93)},changed=!this.target||next.x!==this.target.x||next.y!==this.target.y;this.target=next;this.local.player.targetX=next.x;this.local.player.targetY=next.y;if(changed)this.queueInput();}
 queueInput(){
  if(this.peerHealthy()){if(this.role==='guest')this.sendPeerInput();return;}
  if(!this.autoSync||this.role!=='guest'||this.inputTimer||this.inflight||this.state!=='playing')return;
  const epoch=this.closedEpoch;this.inputTimer=setTimeout(()=>{this.inputTimer=null;if(epoch===this.closedEpoch&&this.state==='playing')void this.sync().catch(()=>{});},Math.max(0,100-(this.now()-this.lastInputSendAt)));this.inputTimer?.unref?.();
 }
 action(type,node){
  if(!this.assertIdentity()||!this.game)return false;
  if(type==='ready'){if(this.baseState!=='intermission')return false;this.readyRequested=true;this.local.ready=true;this.refresh();return true;}
  if(type==='upgrade'){if(this.baseState!=='intermission'||!this.local.alive)return false;}
  else if(!['skill','bomb','ultimate','wingmen'].includes(type)||this.state!=='playing'||!this.local.alive)return false;
  if(this.role==='host'){const used=type==='upgrade'?this.game.upgrade(this.role,node):this.game.use(this.role,type);if(used&&type==='upgrade')this.emit({type:'coop-upgrades',role:this.role,node});this.refresh();return used;}
  if(this.commands.length>=24)return false;
  const seq=++this.commandSeq;this.commands.push({id:`${this.role}:${this.mission}:${seq}`,seq,type,...(type==='upgrade'?{node}:{})});this.queueInput();return true;
 }
 pause(){if(!this.code)return;this.pauseFlags[this.role]=true;this.sendPeerInput();this.refresh();if(this.autoSync)void this.sync().catch(()=>{});}
 resume(){if(!this.code)return;this.pauseFlags[this.role]=false;this.sendPeerInput();this.refresh();if(this.autoSync)void this.sync().catch(()=>{});}
 update(dt){
  if(!this.assertIdentity())return;this.checkNetwork();dt=clamp(Number(dt)||0,0,.05);
  if(this.role==='host'){
   if(this.baseState==='loading'&&this.game?.crew.every(pilot=>pilot.ack===this.mission)&&!this.pauseFlags.host&&!this.pauseFlags.guest&&!this.networkPaused){this.baseState='playing';this.game.start();this.refresh();}
   if(this.state==='playing')this.game?.update(dt);
   else if(this.baseState==='transition'&&!this.networkPaused&&!this.pauseFlags.host&&!this.pauseFlags.guest){this.transitionLeft-=dt;if(this.transitionLeft<=0)this.beginStage(this.mission+1);}
   else if(this.baseState==='intermission'&&this.game?.crew.every(pilot=>pilot.ready)&&!this.networkPaused&&!this.pauseFlags.host&&!this.pauseFlags.guest)this.beginStage(this.mission+1);
  }else if(this.game&&this.state==='playing')this.predict(dt);
  this.refresh();
  if(this.peer?.open){
   this.peerInputTime+=dt;this.peerFrameTime+=dt;
   if(this.role==='guest'&&this.peerInputTime>=(this.mode==='lan'?1/60:.05)){this.peerInputTime=0;this.sendPeerInput();}
   if(this.role==='host'&&this.game&&this.peerFrameTime>=(this.mode==='lan'?1/30:1/15)){this.peerFrameTime=0;void this.peer.sendFrame({type:'frame',seq:++this.directFrameSeq,snapshot:this.snapshot(true)});}
  }
 }
 predict(dt){
  this.snapshotAge=Math.min(1.25,this.snapshotAge+dt);this.game.clock+=dt;this.game.time+=dt;
  for(const entry of this.interpolation){
   if(entry.item===this.local.player&&this.target&&this.local.alive&&!this.local.player.hitCrash)continue;
   const {item,x,y,vx,vy}=entry,travel=Math.max(0,this.snapshotAge-(entry.hold||0));let nextX=x+vx*travel,nextY=y+vy*travel;
   if(entry.target){nextX=clamp(nextX,Math.min(x,entry.target.x),Math.max(x,entry.target.x));nextY=clamp(nextY,Math.min(y,entry.target.y),Math.max(y,entry.target.y));}
   entry.errorX*=Math.exp(-dt*18);entry.errorY*=Math.exp(-dt*18);item.x=nextX+entry.errorX;item.y=nextY+entry.errorY;
  }
  // Guests predict only the visible crash animation between authoritative
  // snapshots. Alive state, HP, damage, and crash creation remain host-owned.
  for(const enemy of this.game.enemies){const crash=enemy.crashing;if(!crash)continue;const nextAge=Math.max(0,(Number(crash.age)||0)+dt);crash.age=Number.isFinite(crash.duration)?Math.min(nextAge,Math.max(0,crash.duration)):nextAge;enemy.rotation=(Number(crash.rotation)||0)+crash.age*3.2;}
  for(const key of ['enemies','bullets','hazards'])for(const item of this.game[key])if(Number.isFinite(item.age))item.age+=dt;
  this.game.updateVisuals(dt);
  this.game.shake=Math.max(0,(this.game.shake||0)-dt*18);this.game.shock=Math.max(0,(this.game.shock||0)-dt);
  this.game.bullets=this.game.bullets.filter(b=>b.age<=10&&b.x>-100&&b.x<W+100&&b.y>-120&&b.y<H+100&&(!b.burstAt||b.age<b.burstAt));
  const crashing=new Set();for(const pilot of this.game.crew)if(advanceCrash(pilot.player,dt,pilot.talents?.survival_core))crashing.add(pilot.role);
  const p=this.local.player;if(this.target&&this.local.alive&&!crashing.has(this.local.role)&&!p.heroBomb&&!p.hitCrash){const dx=this.target.x-p.x,dy=this.target.y-p.y,len=Math.hypot(dx,dy),slow=this.game.hazards.some(h=>(h.type==='freeze'||h.type==='time')&&h.age>h.warn&&Math.hypot(h.x-p.x,h.y-p.y)<h.r)?.65:1,step=Math.min(len,p.speed*slow*dt*1.5),oldX=p.x,oldY=p.y;if(len>0){p.x+=dx/len*step;p.y+=dy/len*step;}p.vx=dt>0?(p.x-oldX)/dt:0;p.vy=dt>0?(p.y-oldY)/dt:0;p.targetX=this.target.x;p.targetY=this.target.y;p.bank+=(clamp(dx/60,-1,1)-p.bank)*Math.min(1,dt*12);}
  for(const unit of this.game.wingmen){if(unit.crash)unit.crash.age=Math.min(unit.crash.duration,unit.crash.age+dt);else unit.age+=dt;}for(const pilot of this.game.crew){if(pilot.player.heroBomb)pilot.player.heroBomb.age+=dt;if(pilot.player.wingmanCall)pilot.player.wingmanCall.age+=dt;if(crashing.has(pilot.role))continue;for(const key of ['invulnerable','respawnTime','bombReturn','skillCd','skillTime','ultTime','armorCd'])if(Number.isFinite(pilot.player[key]))pilot.player[key]=Math.max(0,pilot.player[key]-dt);}
 }
 snapshot(compact=false){
  const snapshot={v:1,mission:this.mission,state:this.baseState,pauseFlags:{...this.pauseFlags},networkPaused:this.networkPaused,failureReason:this.failureReason,transitionLeft:this.transitionLeft,...this.game.snapshot(),events:this.eventLog.map(record=>({...record,event:{...record.event}}))};
  // Keep the complete authoritative combat data below the relay's 400 KiB cap.
  // Only expendable cosmetic particles are discarded, never live projectiles.
  if(new TextEncoder().encode(JSON.stringify(snapshot)).byteLength>390000){snapshot.game.particles=[];snapshot.game.texts=[];snapshot.game.effects=snapshot.game.effects.slice(-24);snapshot.game.weaponEffects=snapshot.game.weaponEffects.slice(-24);snapshot.events=snapshot.events.filter(record=>record.event.type!=='sound').slice(-24);}
  if(compact)snapshot.events=snapshot.events.filter(record=>record.serial>this.peerEventAck);
  return compact?packCoopSnapshot(snapshot):snapshot;
 }
 applySnapshot(snapshot,seq,{age=0,source='relay'}={}){
  snapshot=unpackCoopSnapshot(snapshot);
  if(!snapshot||snapshot.v!==1||!integer(snapshot.mission,0,26)||!integer(seq,0,Number.MAX_SAFE_INTEGER)||seq<=(source==='direct'?this.lastDirectSnapshotSeq:this.lastSnapshotSeq)||!Array.isArray(snapshot.crew)||!snapshot.game)return false;
  const states=['loading','playing','transition','intermission','finished','failed'];if(!states.includes(snapshot.state))return false;if(source==='direct')this.lastDirectSnapshotSeq=seq;else this.lastSnapshotSeq=seq;
  const initial=!this.game,changed=initial||snapshot.mission!==this.mission,previousBoss=changed?null:this.game.boss&&{dead:this.game.boss.dead,phase:this.game.boss.phase};const oldPositions=new Map();if(!changed){for(const key of ['enemies','bullets','pickups','wingmen'])for(const item of this.game[key])oldPositions.set(`${key}:${item.id}`,{x:item.x,y:item.y});for(const pilot of this.game.crew)oldPositions.set(`pilot:${pilot.role}`,{x:pilot.player.x,y:pilot.player.y});if(this.game.boss)oldPositions.set('boss',{x:this.game.boss.x,y:this.game.boss.y});}
  const ownPause=this.pauseFlags[this.role];
  if(changed){this.mission=snapshot.mission;this.target=null;this.commands=[];this.readyRequested=false;this.interpolation=[];this.serverSamples.clear();this.game=new CoopGame({mission:this.mission,room:this.room,localRole:this.role,onEvent:this.role==='host'?event=>this.gameEvent(event):()=>{}});this.local=this.game.selectPilot(this.role);this.loadStage();}
  const ownAck=this.local.ack;this.game.restore(snapshot);this.local=this.game.selectPilot(this.role);if(ownAck===this.mission)this.local.ack=ownAck;
  if(changed)this.local.ack=-1;this.baseState=changed&&snapshot.state==='playing'?'loading':snapshot.state;this.failureReason=String(snapshot.failureReason||'');this.transitionLeft=Number(snapshot.transitionLeft)||0;this.pauseFlags={host:!!snapshot.pauseFlags?.host,guest:!!snapshot.pauseFlags?.guest};this.pauseFlags[this.role]=ownPause;this.remoteNetworkPaused=this.role==='guest'&&!!snapshot.networkPaused;
  if(this.readyRequested&&this.baseState==='intermission')this.local.ready=true;
  this.commands=this.commands.filter(command=>command.seq>this.local.commandAck);this.commandSeq=Math.max(this.commandSeq,this.local.commandAck||0);this.snapshotAge=clamp(Number(age)||0,0,.8);this.interpolation=[];
  const samples=new Map(),sampleTime=Number(snapshot.game.clock)||0;
  const track=(key,item,{vx,vy,target,hold=0}={})=>{
   if(!item||!Number.isFinite(item.x)||!Number.isFinite(item.y))return;
   const prior=this.serverSamples.get(key),elapsed=prior?sampleTime-prior.time:0,x=item.x,y=item.y;
   samples.set(key,{x,y,time:sampleTime});
   if(vx===undefined)vx=elapsed>.001&&Math.abs(x-prior.x)<250?clamp((x-prior.x)/elapsed,-900,900):0;
   if(vy===undefined)vy=elapsed>.001&&Math.abs(y-prior.y)<300?clamp((y-prior.y)/elapsed,-1200,1200):key.startsWith('pickups:')?50:0;
   const travel=Math.max(0,this.snapshotAge-hold),old=oldPositions.get(key),predictedX=x+vx*travel,predictedY=y+vy*travel;
   const entry={item,x,y,vx,vy,target,hold,errorX:old?old.x-predictedX:0,errorY:old?old.y-predictedY:0};this.interpolation.push(entry);item.x=old?.x??predictedX;item.y=old?.y??predictedY;
  };
  for(const key of ['enemies','bullets','pickups','wingmen'])for(const item of this.game[key])track(`${key}:${item.id}`,item,key==='bullets'?{vx:item.vx||0,vy:item.vy||0,hold:Math.max(0,(item.hold||0)-(item.age||0))}:{});
  if(this.game.boss)track('boss',this.game.boss);
  for(const pilot of this.game.crew){const old=oldPositions.get(`pilot:${pilot.role}`);if(pilot.player.hitCrash){advanceCrash(pilot.player,this.snapshotAge,pilot.talents?.survival_core);continue;}if(!pilot.alive)continue;
   // Only movement is predicted. Health, death, skill costs and damage always
   // come from the host. Never interpolate a local input back toward an old pose.
   if(pilot.role===this.role&&this.target&&old){pilot.player.x=old.x;pilot.player.y=old.y;pilot.player.targetX=this.target.x;pilot.player.targetY=this.target.y;}
   else track(`pilot:${pilot.role}`,pilot.player,{vx:pilot.player.vx||0,vy:pilot.player.vy||0,target:{x:pilot.player.targetX,y:pilot.player.targetY}});
  }
  this.serverSamples=samples;
  if(this.baseState==='playing'&&!this.pauseFlags.host&&!this.pauseFlags.guest&&!this.remoteNetworkPaused){this.game.clock+=this.snapshotAge;this.game.time+=this.snapshotAge;}
  this.deliverEvents(snapshot.events,initial,previousBoss);
  if(this.baseState==='finished'&&!this.receivedFinished){this.receivedFinished=true;this.emit({type:'coop-over',win:true,mission:this.mission});}
  if(this.baseState==='failed'&&!this.receivedFailed){this.receivedFailed=true;this.emit({type:'coop-over',win:false,reason:this.failureReason,mission:this.mission});}
  this.refresh();return true;
 }
 deliverEvents(records,initial,previousBoss){
  const events=(Array.isArray(records)?records:[]).slice(-64).filter(record=>integer(record.serial,1,Number.MAX_SAFE_INTEGER)&&record.event&&RELAY_EVENTS.has(record.event.type)).sort((a,b)=>a.serial-b.serial),delivered=new Set();
  if(this.role==='host'){this.eventSerial=Math.max(this.eventSerial,0,...events.map(record=>record.serial));this.eventLog=events.map(record=>({...record,event:{...record.event}}));}
  for(const record of events){if(record.serial<=this.lastEventSerial)continue;this.lastEventSerial=record.serial;if(this.role==='guest'&&!initial&&record.mission===this.mission){delivered.add(record.event.type);this.emit(record.event);}}
  // A joining/reloading guest must get the current boss HUD/audio even when
  // its introduction has fallen out of the bounded event history. Historical
  // sounds are deliberately not replayed on reconnect.
  const boss=this.game.boss,restoreLocal=event=>this.role==='host'?this.localDispatch(event):this.emit(event);
  if(boss&&!previousBoss&&!delivered.has('boss'))restoreLocal({type:'boss',name:this.game.chapter.boss});
  if(boss?.phase>1&&boss.phase>(previousBoss?.phase||0)&&!delivered.has('phase'))restoreLocal({type:'phase',phase:boss.phase});
  if(boss?.dead&&!previousBoss?.dead&&!delivered.has('boss-end'))restoreLocal({type:'boss-end',result:'victory',chapter:this.game.stage.chapter});
 }
 async close(){
  const code=this.code,owned=String(this.account.user?.id||'')===this.identity;this.peer?.send({type:'leave'});this.peer?.close();this.peer=null;this.stopTimer();++this.closedEpoch;++this.stageEpoch;this.syncController?.abort();this.syncController=null;this.inflight=null;this.stageLoading=null;this.code='';this.baseState='closed';this.state='closed';this.target=null;this.commands=[];this.interpolation=[];this.networkPaused=false;this.peerStale=false;this.remoteNetworkPaused=false;if(this.game)this.game.state='finished';this.refresh();
  if(code&&owned){try{await this.request(`/api/rooms/${code}/leave`);}catch(error){this.emit({type:'coop-issue',message:String(error?.message||error)});}}
 }
}
