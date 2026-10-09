import {chapterCalibration} from './economy.js?v=14';
import {W,H,SHIPS,CHAPTERS,ENEMIES,DIFFICULTIES} from './data.js?v=14';
import {ITEM_BY_KIND,TIERS,tierIndex,containerLoot} from './items.js?v=14';
import {growthStats,weaponTier} from './progression.js?v=14';
import {BOSS_ARSENALS,BOSS_COLORS,bossShotArt,enemyShotArt,playerShotArt,playerEffectArt,enemyHazardArt,enemyBeamParts,enemyFireArt,enemyMuzzleArt,enemyImpactArt,bossHazardArt,bossTelegraphArt,bossImpactArt,bossBeamParts,hazardImpactArt} from './weapons.js?v=14';

export const BOSS_SKILLS=['潮汐夹击','熔岩封锁','螺旋追击','冰棱风暴','轨道清扫','雷狱连锁','双生交叉','棱镜折返','终焉递归'];
const TAU=Math.PI*2, clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function randomGenerator(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

class BulletPool {
 constructor(){this.free=[];this.created=0;}
 take(data){const b=this.free.pop()||{_poolId:++this.created};for(const k of Object.keys(b))if(k!=='_poolId')delete b[k];Object.assign(b,{alive:true,age:0,grazed:false,pierce:0,hit:new Set(),unclearable:false,bounce:0},data);return b;}
 release(b){b.alive=false;b.hit.clear();this.free.push(b);}
}

export class Game {
 constructor({stage,ship=0,profile={},difficulty='normal',pace='quick',seed=Date.now(),onEvent=()=>{}}){
  this.stage=stage;this.ship=SHIPS[ship];this.chapter=CHAPTERS[stage.chapter];this.difficulty=DIFFICULTIES.find(d=>d.id===difficulty)||DIFFICULTIES[1];this.pace=pace;this.emit=onEvent;this.random=randomGenerator(seed);this.pool=new BulletPool();this.bulletCounts={enemy:0,player:0};this.uid=0;
  this.state='ready';this.time=0;this.clock=0;this.nextWave=.7;this.wave=0;this.enemies=[];this.bullets=[];this.pickups=[];this.hazards=[];this.effects=[];this.weaponEffects=[];this.particles=[];this.texts=[];this.boss=null;this.bossAnnounced=false;this.bossDefeated=false;this.seen=new Set();this.score=0;this.combo=1;this.lastKill=0;this.kills=0;this.spawned=0;this.grazes=0;this.hits=0;this.coins=0;this.weaponXp=0;this.weaponLevel=1;this.bombFragments=0;this.lastSupply=0;this.energyAnnounced=false;this.nextHazard=24;this.shake=0;this.flash=0;this.ending=0;
  this.talents=profile.talents||{};this.level=clamp(profile.levels?.[this.ship.id]||1,1,50);
  this.materials={blueprint:0,data:0};this.lootBursts=[];this.growth=growthStats(profile,this.ship.id);this.weaponTier=weaponTier(profile,this.ship.id);
  const hp=this.ship.hp*(1+.035*(this.level-1));const shield=this.ship.shield*(1+.032*(this.level-1))*(1+.06*(this.talents.shield||0));
  this.dps=this.ship.dps*([180,260,380,520,700,900,1150,1450,1900][stage.chapter]/120)*(1+.030*(this.level-1)+.00055*(this.level-1)**2)*(1+.04*(this.talents.fire||0))*this.growth.weapon/chapterCalibration(stage.chapter);
  this.player={x:W/2,y:H*.77,targetX:W/2,targetY:H*.77,vx:0,vy:0,r:5.5,maxHp:hp,hp,maxShield:shield,shield,speed:this.ship.speed*4.5,energy:0,bombs:2+(this.talents.bomb>=2?1:0),maxBombs:2+(this.talents.bomb>=2?1:0),invulnerable:1.5,lastHit:-10,skillCd:0,skillTime:0,ultTime:0,bombTime:0,bombPending:0,fireTime:0,secondaryTime:0,ultTick:0,stacks:0,consecutive:0,lastShotHit:0,armorCd:0,bank:0};
 }
 start(){if(this.state!=='ready')return;this.state='playing';this.emit({type:'start'});this.combatSound('flyby');this.emit({type:'message',speaker:'回声七队 / RADIO',text:this.stage.mode==='boss'?`已锁定 ${this.chapter.boss}。保持航线。`:this.chapter.subtitle,duration:4});}
 combatSound(name,options={}){this.emit({type:'sound',name,ship:this.ship.id,chapter:this.stage.chapter,...options});}
 attackOwner(){return this.firingBoss?{boss:this.stage.chapter+1}:this.firingEnemy?{enemy:this.firingEnemy.type}:{environment:true};}
 pause(reason='manual'){if(this.state==='playing'){this.state='paused';this.emit({type:'pause',reason});}}
 resume(){if(this.state==='paused'){this.state='playing';this.emit({type:'resume'});}}
 moveTo(x,y){if(this.state!=='playing')return;this.player.targetX=clamp(x,20,W-20);this.player.targetY=clamp(y,155,H-93);}
 energy(amount){this.player.energy=clamp(this.player.energy+amount*(1+.05*(this.talents.energy||0))*this.growth.charge,0,1000);if(this.player.energy>=1000&&!this.energyAnnounced){this.energyAnnounced=true;this.combatSound('ready');this.emit({type:'toast',text:'终极技已就绪'});}}
 skill(){const p=this.player;if(this.state!=='playing'||p.skillCd>0)return false;p.skillCd=this.ship.cooldown*(1-.06*(this.talents.cooldown||0));p.skillTime=this.ship.id==='Dawn7'?7:this.ship.id==='Bastion3'?5:1.2;if(this.ship.id==='WraithX')p.invulnerable=Math.max(p.invulnerable,1.2);this.weaponEffect(this.ship.id==='WraithX'?'P_WRAITH_target':playerEffectArt(this.ship.id,'muzzle'),p.x,p.y,80,.5,-Math.PI/2);this.effect(this.ship.id==='Dawn7'?'Dawn7_Overclock':this.ship.id==='Bastion3'?'Bastion3_Magnetic_Dome':'WraithX_Phase_Dash',p.x,p.y,130,.7);this.combatSound('skill');this.emit({type:'toast',text:this.ship.skill+' · 已启动'});return true;}
 bomb(){const p=this.player;if(this.state!=='playing'||p.bombs<=0||p.bombPending>0||p.bombTime>0)return false;p.bombs--;p.bombPending=.25;p.invulnerable=1.5;this.weaponEffect(playerEffectArt(this.ship.id,'bomb'),p.x,p.y-35,35,.25);this.effect('Bomb_Clear_Ring',p.x,p.y,90,.3);this.combatSound('charge');return true;}
 ultimate(){const p=this.player;if(this.state!=='playing'||p.energy<1000||p.ultTime>0)return false;p.energy=0;this.energyAnnounced=false;p.ultTick=0;p.ultTime=this.ship.id==='Dawn7'?4:this.ship.id==='Bastion3'?5:3;p.invulnerable=Math.max(p.invulnerable,1.1);this.combatSound('ultimate');this.emit({type:'message',speaker:this.ship.english,text:this.ship.ultimate+' / 系统全功率',duration:2});
  if(this.ship.id==='WraithX'){const targets=this.enemies.filter(e=>e.alive).slice(0,6);if(this.boss&&!this.bossDefeated){this.damageBoss(this.dps*10.5,this.boss.x,this.boss.y);this.effect('WraithX_Singularity',this.boss.x,this.boss.y,310,1);for(let i=0;i<5;i++)this.hazards.push({type:'slash',x:this.boss.x+(i-2)*27,y:this.boss.y,age:0,warn:0,duration:.5,r:130,visual:true});}else for(const e of targets){this.damageEnemy(e,this.dps*10.5/Math.max(1,targets.length));this.effect('WraithX_Singularity',e.x,e.y,155,.8);}}
  return true;
 }
 weaponEffect(art,x,y,size=80,duration=.6,angle=0){if(art?.startsWith('CFX_'))this.combatSound('sprite',{art,x,boss:this.boss?this.stage.chapter+1:undefined});if(this.weaponEffects.length<50)this.weaponEffects.push({art,x,y,size,duration,age:0,angle});}
 effect(name,x,y,size=80,duration=.6,overrideArt=null){const playerArt=overrideArt||(['Bomb_Detonation','Bastion3_Gravity_Burst','WraithX_Singularity'].includes(name)?playerEffectArt(this.ship.id,'blast'):null);this.effects.push({name,art:playerArt,x,y,size,duration,age:0,rotation:(this.random()-.5)*.6});}
 sparks(x,y,color='#ffb374',count=12){const limit=Math.max(0,160-this.particles.length);for(let i=0;i<Math.min(count,limit);i++){const a=this.random()*TAU,v=40+this.random()*140;this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.3+this.random()*.4,age:0,color,size:1+this.random()*3});}}
 float(text,x,y,color='#b5ebff'){if(this.texts.length<24)this.texts.push({text,x,y,age:0,color});}
 shoot(x,y,angle,speed,damage,owner='enemy',options={}){const limit=owner==='enemy'?1000:280;if(this.bulletCounts[owner]>=limit)return;const b=this.pool.take({id:++this.uid,x,y,px:x,py:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,owner,r:owner==='enemy'?5:4,...options});b.art=options.art||(owner==='player'?playerShotArt(this.ship.id,b.kind):this.firingBoss?bossShotArt(this.stage.chapter,this.boss.pattern):enemyShotArt(this.firingEnemy?.type,this.firingEnemy?.salvo,b.kind));if(this.firingBoss&&!options.color)b.color=BOSS_COLORS[this.stage.chapter];this.bullets.push(b);this.bulletCounts[owner]++;return b;}
 fan(x,y,count,spread,speed,damage,angle=Math.PI/2,options={}){count=Math.max(2,Math.round(count*1.65*this.difficulty.density));for(let i=0;i<count;i++)this.shoot(x,y,angle-spread/2+(count===1?spread/2:spread*i/(count-1)),speed,damage,'enemy',options);}
 ring(x,y,count,speed,damage,offset=0,options={}){count=Math.max(2,Math.round(count*1.65*this.difficulty.density));for(let i=0;i<count;i++)this.shoot(x,y,offset+TAU*i/count,speed,damage,'enemy',options);}
 laser(x,y,damage,options={}){const owner=this.attackOwner(),art=owner.boss?bossHazardArt(this.stage.chapter,'laser'):enemyHazardArt(owner.enemy,'laser',this.uid++),parts=owner.boss?bossBeamParts(this.stage.chapter):enemyBeamParts(art);
  const h={art,type:'laser',x,y,warn:1.2,duration:.7,age:0,width:14,damage,soundOwner:owner,strip:parts.strip,emitter:parts.emitter,warnArt:owner.boss?bossTelegraphArt(this.stage.chapter):owner.enemy===24?'GSPEC_11':'GSPEC_10',...options};this.hazards.push(h);this.combatSound('lock',{...owner,art:h.warnArt,x});}
 zone(x,y,r,damage,type='blast',options={}){const owner=this.attackOwner(),h={art:owner.boss?bossHazardArt(this.stage.chapter,type):enemyHazardArt(owner.enemy,type,this.uid++),type,x,y,r,damage,warn:1.1,duration:type==='fire'?2.5:.4,age:0,soundOwner:owner,warnArt:owner.boss?bossTelegraphArt(this.stage.chapter):type==='time'?'GSPEC_06':type==='freeze'?'GSPEC_05':'GSPEC_13',impactArt:owner.boss?null:type==='fire'?'GSPEC_07':type==='mine'?'GFX_06':type==='blast'?'GFX_13':null,...options};this.hazards.push(h);if(owner.boss)this.combatSound('lock',{...owner,art:h.warnArt,x});}
 spawn(id,x,y=-45,extra={}){const cfg=ENEMIES[id-1];if(!this.stage.enemies.includes(id))throw new Error('Stage enemy constraint violated');if(this.enemies.filter(e=>e.alive).length>=34)return;const size=cfg.category==='heavy'?88:cfg.category==='bomber'?69:cfg.category==='elite'?61:cfg.category==='support'?54:51;const hp=cfg.hp*1.22**this.stage.chapter*this.difficulty.hp*1.12;
  const e={id:++this.uid,type:id,cfg,x,y,originX:x,originY:y,age:0,hp,maxHp:hp,size,r:size*.28,fireTimer:.65+this.random()*.4,phase:this.random()*TAU,alive:true,flash:0,phaseOut:false,dashWarning:0,chargeTime:0,shielded:false,...extra};this.enemies.push(e);this.spawned++;this.seen.add(id);return e;
 }
 spawnWave(){this.wave++;const t=this.time/this.stage.duration;const allowed=t<.18?1:t<.48?2:3;const id=this.stage.enemies[Math.floor(this.random()*allowed)];const type=ENEMIES[id-1].category;const count=type==='scout'?6:type==='intercept'?3:2;const formation=this.wave%3;
  for(let i=0;i<count;i++){let x=formation===0?45+i*(W-90)/Math.max(1,count-1):formation===1?W/2+(i-(count-1)/2)*58:50+this.random()*(W-100);this.spawn(id,clamp(x,35,W-35),-45-i*34,{formation});}
  this.nextWave=this.time+Math.max(.72,1.62-t*.62-this.stage.chapter*.045)/this.difficulty.rate;
 }
 spawnBoss(){if(this.boss)return;const hp=this.chapter.hp*this.difficulty.hp*2.35;const count=this.stage.chapter===4?3:this.stage.chapter===7?3:2;this.boss={x:W/2,y:-175,baseY:185,age:0,hp,maxHp:hp,w:Math.min(335,285+this.stage.chapter*6),h:242,phase:1,pattern:0,fireTimer:2.5,flash:0,weakTime:0,chargeTime:0,chargeWarning:0,armored:false,dead:false,teleport:0,lDamage:0,rDamage:0,parts:Array.from({length:count},(_,i)=>({x:(i-(count-1)/2)*.23,y:.28,hp:hp*.035,maxHp:hp*.035,dead:false}))};this.emit({type:'boss',name:this.chapter.boss});this.combatSound('boss-intro',{boss:this.stage.chapter+1});this.emit({type:'message',speaker:'WARNING / 巨型目标',text:this.chapter.boss,duration:3});}
 update(dt){if(this.state!=='playing'&&this.state!=='ending')return;dt=Math.min(dt,.05);this.time+=dt;this.clock+=dt;this.shake=Math.max(0,this.shake-dt*12);this.flash=Math.max(0,this.flash-dt*2.5);
  if(this.state==='playing'){
   this.updatePlayer(dt);
   if(this.stage.mode!=='boss'&&this.time<this.stage.duration-(this.stage.boss?8:4)&&this.time>=this.nextWave)this.spawnWave();
   if(this.stage.boss&&!this.bossAnnounced&&this.time>=this.stage.duration-3){this.bossAnnounced=true;this.emit({type:'message',speaker:'RADAR / 目标接近',text:'大型能量反应。准备迎战。',duration:2.8});this.combatSound('warning');}
   if(this.stage.boss&&this.time>=this.stage.duration&&!this.boss)this.spawnBoss();
   if(this.stage.mode!=='boss'&&this.stage.chapter>0&&this.time>=this.nextHazard&&this.time<this.stage.duration-9){this.environmentHazard();this.nextHazard=this.time+13;}
   this.updateEnemies(dt);this.updateBoss(dt);this.updateBullets(dt);this.updateHazards(dt);this.updatePickups(dt);
   if(this.player.hp<=0)this.finish(false);
   else if(!this.stage.boss&&this.time>this.stage.duration&&(this.enemies.every(e=>!e.alive)||this.time>this.stage.duration+7))this.finish(true);
   if(this.time-this.lastKill>2.5)this.combo=Math.max(1,this.combo-dt*.04);
  if(this.bossDefeated&&this.state==='playing'){this.state='ending';this.ending=2.3;}
  }else{this.updatePickups(dt);this.ending-=dt;if(this.ending<=0)this.finish(true);}
  this.updateVisuals(dt);
 }
 updatePlayer(dt){const p=this.player,oldX=p.x,oldY=p.y;let slow=this.hazards.some(h=>(h.type==='freeze'||h.type==='time')&&h.age>h.warn&&Math.hypot(h.x-p.x,h.y-p.y)<h.r)?.65:1;const dx=p.targetX-p.x,dy=p.targetY-p.y,len=Math.hypot(dx,dy);if(len>0){const step=Math.min(len,p.speed*slow*dt*1.5);p.x+=dx/len*step;p.y+=dy/len*step;}p.vx=dt>0?(p.x-oldX)/dt:0;p.vy=dt>0?(p.y-oldY)/dt:0;p.bank+=(clamp(dx/60,-1,1)-p.bank)*Math.min(1,dt*12);
  p.invulnerable=Math.max(0,p.invulnerable-dt);p.skillCd=Math.max(0,p.skillCd-dt);p.skillTime=Math.max(0,p.skillTime-dt);p.ultTime=Math.max(0,p.ultTime-dt);p.armorCd=Math.max(0,p.armorCd-dt);
  if(this.time-p.lastHit>4)p.shield=Math.min(p.maxShield,p.shield+p.maxShield*.07*dt);
  if(p.bombPending>0){p.bombPending-=dt;if(p.bombPending<=0){p.bombTime=1.2;this.effect('Bomb_Detonation',p.x,p.y-70,380,.85);this.effect('Bomb_Clear_Ring',p.x,p.y,750,1.2);this.shake=5;this.flash=.12;for(const e of this.enemies)if(e.alive)this.damageEnemy(e,this.dps*4.5*(this.talents.bomb>=3?1.2:1));if(this.boss&&!this.bossDefeated)this.damageBoss(this.dps*4.5*(this.talents.bomb>=3?1.2:1),this.boss.x,this.boss.y);this.combatSound('bomb');}}
  if(p.bombTime>0){p.bombTime-=dt;this.clearBullets();}
  if(this.ship.id==='Dawn7'&&this.time-p.lastShotHit>2&&p.consecutive>0)p.consecutive=Math.max(0,p.consecutive-dt*18);
  if(this.ship.id==='Bastion3'&&p.skillTime>0){for(const b of this.bullets)if(b.alive&&b.owner==='enemy'&&!b.unclearable&&dist(b,p)<71){b.alive=false;this.energy(Math.min(3,dt*55));}}
  if(this.ship.id==='WraithX'&&p.skillTime>0&&this.clock% .12<dt){this.effect('WraithX_Phase_Dash',p.x,p.y,90,.3,'P_WRAITH_target');for(const e of this.enemies)if(e.alive&&dist(e,p)<72)this.damageEnemy(e,this.dps*dt*2.5);}
  p.fireTime-=dt;if(p.fireTime<=0){const buff=(1+Math.min(3,Math.floor(p.consecutive/30))*.08)*(this.ship.id==='Dawn7'&&p.skillTime>0?1.45:1);p.fireTime+=this.ship.id==='Bastion3'?.22/buff:.14/buff;this.firePlayer();}
  p.secondaryTime-=dt;if(p.secondaryTime<=0){p.secondaryTime=1.1;this.secondaryFire();}
  if(p.ultTime>0){if(this.ship.id==='Dawn7'){this.clearBullets();for(const e of this.enemies)if(e.alive&&Math.abs(e.x-p.x)<e.size*.4+27&&e.y<p.y)this.damageEnemy(e,this.dps*2*dt);if(this.boss&&!this.bossDefeated&&Math.abs(this.boss.x-p.x)<this.boss.w*.45)this.damageBoss(this.dps*2*dt,p.x,this.boss.y);}
   else if(this.ship.id==='Bastion3'){p.ultTick-=dt;if(p.ultTick<=0){p.ultTick=.62;const y=this.boss?this.boss.y:Math.max(180,p.y-230);this.effect('Bastion3_Gravity_Burst',W/2,y,350,.6);this.clearBullets();for(const e of this.enemies)if(e.alive)this.damageEnemy(e,this.dps*1.12);if(this.boss&&!this.bossDefeated)this.damageBoss(this.dps*1.12,this.boss.x,this.boss.y);this.shake=3;}}
  }
 }
 firePlayer(){const p=this.player;const upgraded=1+(this.weaponLevel-1)*.13;const disturbed=this.enemies.some(e=>e.alive&&e.type===19)?.8:1;const damage=this.dps*upgraded;
  if(this.ship.id==='Bastion3'){for(let i=0;i<5;i++)this.shoot(p.x+(i-2)*5,p.y-28,-Math.PI/2+(i-2)*.16,510*disturbed,damage*.22/5,'player',{kind:'heavy',r:5});}
  else if(this.ship.id==='WraithX')this.shoot(p.x,p.y-34,-Math.PI/2,860*disturbed,damage*.14,'player',{kind:'needle',pierce:2,r:3,art:this.weaponLevel>1?'P_WRAITH_AP_round':'P_WRAITH_round'});
  else{for(const x of [-11,11])this.shoot(p.x+x,p.y-29,-Math.PI/2,660*disturbed,damage*.14/2,'player',{kind:'pulse',pierce:p.skillTime>0?1:0,art:p.skillTime>0?'P_DAWN_AP_round':undefined});if(this.weaponLevel>=3)for(const a of [-.17,.17])this.shoot(p.x,p.y-24,-Math.PI/2+a,640,damage*.035,'player',{kind:'pulse'});}
  this.weaponEffect(playerEffectArt(this.ship.id,'muzzle'),p.x,p.y-34,25,.08,-Math.PI/2);
  if(this.clock%.28<.15)this.combatSound('shot');
 }
 secondaryFire(){const p=this.player;const target=this.enemies.find(e=>e.alive&&e.y>10)||((this.boss&&!this.bossDefeated)?this.boss:null);if(!target)return;this.combatSound('secondary');
  if(this.ship.id==='Dawn7'){for(const dx of [-25,25])this.shoot(p.x+dx,p.y,-Math.PI/2,300,this.dps*.14,'player',{kind:'missile',homing:true,target,r:5});}
  else if(this.ship.id==='Bastion3')for(const dx of [-45,45])this.shoot(p.x+dx,p.y-5,Math.atan2(target.y-p.y,target.x-p.x-dx),510,this.dps*.1,'player',{kind:'drone'});
  else if(Math.hypot(target.x-p.x,target.y-p.y)<540){const targets=this.enemies.filter(e=>e.alive&&e.y>0).slice(0,3);if(this.boss&&!this.bossDefeated){this.damageBoss(this.dps*.18,this.boss.x,this.boss.y);this.hazards.push({type:'arc',x:p.x,y:p.y,tx:this.boss.x,ty:this.boss.y,age:0,warn:0,duration:.16,visual:true});}else for(let i=0;i<targets.length;i++){this.damageEnemy(targets[i],this.dps*.18*.8**i);this.hazards.push({type:'arc',x:i?targets[i-1].x:p.x,y:i?targets[i-1].y:p.y,tx:targets[i].x,ty:targets[i].y,age:0,warn:0,duration:.16,visual:true});}}
 }
 updateEnemies(dt){const p=this.player;for(const e of this.enemies){if(!e.alive)continue;e.age+=dt;e.flash=Math.max(0,e.flash-dt*8);e.shielded=this.enemies.some(s=>s!==e&&s.alive&&s.type===17&&dist(e,s)<92);const rate=e.cfg.speed*2.2*(e.type===28&&e.hp<e.maxHp*.4?1.25:1);
   if(e.type===1||e.type===5){e.y+=rate*dt;e.x=clamp(e.originX+Math.sin(e.age*2+e.phase)*38,25,W-25);}
   else if(e.type===2){if(e.age<1.7){e.y+=rate*dt;e.x+=Math.sin(e.phase)*rate*.45*dt;}else{if(e.chargeTime===0){e.chargeTime=.65;e.dashWarning=.65;e.dashX=p.x;e.dashY=p.y;}e.dashWarning=Math.max(0,e.dashWarning-dt);if(e.dashWarning===0){e.x+=(e.dashX-e.originX)*.6*dt;e.y+=rate*2*dt;}}}
   else if(e.type===3){e.y+=rate*.65*dt;e.x=clamp(e.originX+Math.sin(e.age*1.2+e.phase)*65,24,W-24);}
   else if(e.type===4){e.y+=rate*(e.age<1.2?.5:2.3)*dt;if(e.age<1.2)e.dashWarning=1.2-e.age;}
   else if(e.type===6){e.y+=rate*.65*dt;if(e.age>2.1&&!e.jumped){e.dashWarning=Math.max(0,2.9-e.age);if(e.age>2.9){e.x=clamp(p.x+(this.random()>.5?75:-75),30,W-30);e.originX=e.x;e.jumped=true;this.effect('WraithX_Phase_Dash',e.x,e.y,85,.4);}}}
   else if(e.type===10){e.y+=rate*.75*dt;e.x+=clamp(p.x-e.x,-60*dt,60*dt);}
   else if(e.type===16){e.y+=rate*dt;e.x=clamp(e.originX+Math.sin(e.age*1.3)*95,30,W-30);}
   else if([7,8,9,11,12,13,14,15,17,18,19,20,21,22,23,24,25].includes(e.type)){e.y+=rate*(e.age>2&&e.age<8?.25:1)*dt;e.x=clamp(e.originX+Math.sin(e.age+e.phase)*14,30,W-30);}
   else{e.y+=rate*.7*dt;e.x=clamp(e.originX+Math.sin(e.age*1.5+e.phase)*50,30,W-30);}
   if(e.type===26)e.phaseOut=e.age%2.2>1.5;
   if(e.type===18){for(const o of this.enemies)if(o.alive&&o!==e&&dist(e,o)<120)o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.03*dt);}
   if(e.type===20&&dist(e,p)<220){p.x+=clamp(e.x-p.x,-17*dt,17*dt);p.y+=clamp(e.y-p.y,-9*dt,9*dt);p.x=clamp(p.x,20,W-20);p.y=clamp(p.y,155,H-93);}
   if(e.y>25&&e.y<H-90){e.fireTimer-=dt;if(e.fireTimer<=0){e.fireTimer=(e.type===28&&e.hp<e.maxHp*.4?.75:1.35)/this.difficulty.rate;this.enemyFire(e);}}
   if(e.y>H+95||e.x<-90||e.x>W+90)e.alive=false;
   if(e.alive&&!e.phaseOut&&dist(e,p)<e.r+p.r){this.hurtPlayer(Math.max(65,e.cfg.damage*1.6));if(e.cfg.category==='scout')this.damageEnemy(e,e.hp+1);}
  }
  this.enemies=this.enemies.filter(e=>e.alive);
 }
 enemyFire(e){this.firingEnemy=e;e.salvo=(e.salvo||0)+1;const p=this.player,s=(165+this.stage.chapter*6)*this.difficulty.speed,flight=Math.min(.7,Math.hypot(p.x-e.x,p.y-e.y)/Math.max(1,s)),lead=flight*this.difficulty.aimLead,aimX=clamp(p.x+p.vx*lead,20,W-20),aimY=clamp(p.y+p.vy*lead,155,H-93),a=Math.atan2(aimY-e.y,aimX-e.x),d=e.cfg.damage*1.12**this.stage.chapter*this.difficulty.damage;
  if(e.type!==26||!e.phaseOut){this.weaponEffect(enemyMuzzleArt(e.type),e.x,e.y+12,30,.13,a);const art=enemyFireArt(e.type,e.salvo);if(art)this.weaponEffect(art,e.x,e.y+18,art.startsWith('GSPEC')?64:44,.28,art==='GSPEC_08'?a:0);}
  switch(e.type){
   case 1:case 2:case 4:case 6:this.fan(e.x,e.y,3,.23,s,d,a);break;
   case 3:for(let i=0;i<3;i++)this.fan(e.x,e.y-i*12,3,.18,s+i*18,d,a);break;
   case 5:this.ring(e.x,e.y,7,s*.8,d,e.phase);break;
   case 7:for(const x of [-15,15])this.fan(e.x+x,e.y,3,.25,s,d,a);break;
   case 8:this.fan(e.x,e.y,5,.65,s,d,a);break;
   case 9:for(const x of [p.x-34,p.x+34])this.laser(clamp(x,25,W-25),e.y,d,{width:10,duration:.45,warn:1.25});break;
   case 10:this.fan(e.x,e.y,3,.25,s,d,a);break;
   case 11:this.ring(e.x,e.y,9,s*.9,d,e.age*1.2,{kind:'diamond'});break;
   case 12:for(const x of [-52,0,52])this.zone(clamp(p.x+x,30,W-30),p.y,30,d,'blast',{warn:1.25});break;
   case 13:for(const x of [-45,45])this.zone(clamp(p.x+(p.targetX-p.x)*.6+x,35,W-35),clamp(p.y,180,H-95),34,d,'blast',{warn:1.35});break;
   case 14:this.zone(p.x,p.y,48,d*.35,'fire');this.fan(e.x,e.y,3,.6,s,d,a);break;
   case 15:for(const offset of [-.09,.09])this.shoot(e.x,e.y,a+offset,s*.65,d,'enemy',{kind:'orb',r:9,shock:true});break;
   case 16:for(let i=0;i<5;i++)this.zone(clamp(e.x+(i-2)*50,25,W-25),Math.min(H-110,e.y+170),22,d,'mine',{warn:1.3,duration:3});break;
   case 17:case 18:case 19:case 20:this.fan(e.x,e.y,2,.18,s*.8,d,a);break;
   case 21:for(const x of [-28,28])this.fan(e.x+x,e.y,3,.65,s,d);break;
   case 22:this.fan(e.x,e.y,5,.9,s,d,a);break;
   case 23:for(const x of [-25,0,25])this.fan(e.x+x,e.y,3,.3,s,d,a+x*.008);break;
   case 24:for(const x of [p.x-40,p.x+40])this.laser(clamp(x,22,W-22),e.y,d,{width:16,duration:.8,warn:1.4});break;
   case 25:if(this.enemies.length<24){const other=this.stage.enemies.filter(id=>id!==25);this.spawn(other[Math.floor(this.random()*other.length)],clamp(e.x+(this.random()-.5)*90,35,W-35),e.y+30);}this.fan(e.x,e.y,3,.3,s,d,a);break;
   case 26:if(!e.phaseOut)this.fan(e.x,e.y,3,.5,s,d,a,{kind:'diamond'});break;
   case 27:this.fan(e.x,e.y,3,.4,s,d,a,{kind:'diamond'});break;
   case 28:this.fan(e.x,e.y,7,.9,s*1.1,d,a);break;
   case 29:this.fan(e.x,e.y,5,1.5,s*.9,d,a,{bounce:1,kind:'diamond'});break;
   case 30:if(!this.hazards.some(h=>h.type==='time'))this.zone(e.x,Math.min(H-180,e.y+180),110,0,'time',{duration:4});this.ring(e.x,e.y,10,s,d,e.age);break;
  }
  if(e.type!==26||!e.phaseOut)this.combatSound('enemy-fire',{enemy:e.type,x:e.x,special:[9,11,12,13,14,15,16,20,24,25,27,29,30].includes(e.type)});this.firingEnemy=null;
 }
 environmentHazard(){const c=this.stage.chapter,p=this.player;if(c===1)this.zone(p.x,p.y,50,55,'fire');else if(c===3)this.zone(W/2,H*.64,145,0,'freeze',{duration:4,warn:1.3});else if(c===7){for(const x of [55,W-55])this.laser(x,80,80,{width:26});}else if(c===8)this.zone(W/2,H*.55,125,0,'time',{duration:4});else this.laser(clamp(p.x,35,W-35),40,65,{width:c===5?20:13,warn:1.35});}
 updateBoss(dt){const b=this.boss;if(!b||b.dead)return;b.age+=dt;b.flash=Math.max(0,b.flash-dt*8);b.weakTime=Math.max(0,b.weakTime-dt);b.teleport=Math.max(0,b.teleport-dt);
  const phase=this.stage.chapter===8?(b.hp>b.maxHp*.75?1:b.hp>b.maxHp*.5?2:b.hp>b.maxHp*.2?3:4):(b.hp>b.maxHp*.65?1:b.hp>b.maxHp*.3?2:3);
  if(phase>b.phase){b.phase=phase;this.weaponEffect(bossImpactArt(this.stage.chapter),b.x,b.y,220,.7);this.weaponEffect('CFX_08',b.x,b.y,170,.5);this.weaponEffect('CFX_09',b.x,b.y,240,.5);b.weakTime=2.5;this.clearBullets();this.shake=3;this.effect('Shield_Break',b.x,b.y,320,.6);this.emit({type:'phase',phase});this.combatSound('boss-phase',{boss:this.stage.chapter+1});this.emit({type:'message',speaker:`PHASE ${phase} / 能量重构`,text:phase===4?'时间崩坏。终止递归循环。':'敌方攻击结构改变，注意预警与弱点。',duration:2.5});this.combatSound('warning');}
  if(b.y<175){b.y+=95*dt;return;}
  if(b.chargeWarning>0){b.chargeWarning-=dt;if(b.chargeWarning<=0)b.chargeTime=1.2;}
  if(b.chargeTime>0){b.chargeTime-=dt;b.y=b.baseY+Math.sin((1.2-b.chargeTime)/1.2*Math.PI)*255;if(b.chargeTime<=0)b.weakTime=3;}
  else b.y+=(b.baseY+Math.sin(b.age*.9)*12-b.y)*dt*4;
  b.x=W/2+Math.sin(b.age*.57)*((this.stage.chapter===6)?75:48);
  b.armored=this.stage.chapter===1&&b.phase>=2&&b.age%8<3;
  if(this.stage.chapter===6&&b.age%9>7)b.weakTime=Math.max(b.weakTime,.1);
  b.fireTimer-=dt;if(b.fireTimer<=0){b.pattern++;b.fireTimer=Math.max(.65,1.8-b.phase*.25-this.stage.chapter*.025)/this.difficulty.rate;this.bossPattern();}
  if(Math.abs(this.player.x-b.x)<b.w*.32&&Math.abs(this.player.y-b.y)<b.h*.27)this.hurtPlayer(160*this.difficulty.damage);
 }
 bossPattern(){this.firingBoss=true;const b=this.boss,p=this.player,c=this.stage.chapter,a=Math.atan2(p.y-b.y,p.x-b.x),s=(158+c*8)*this.difficulty.speed,d=(55+c*8)*this.difficulty.damage,pattern=b.pattern,phase=b.phase;
  switch(c){
   case 0:if(pattern%3===0&&phase>1){b.chargeWarning=1.15;this.zone(b.x,H*.58,45,d,'blast',{warn:1.15});}else if(pattern%2===0){for(const x of [-60,60])this.fan(b.x+x,b.y+65,3,.35,s,d,a);}else this.fan(b.x,b.y+70,5+phase*2,.95,s,d,a);break;
   case 1:this.fan(b.x,b.y+65,9+phase*2,1.55,s,d);if(pattern%2===0)for(let i=0;i<phase+1;i++)this.zone(40+this.random()*(W-80),H*.6+this.random()*120,34,d,'fire');if(pattern%4===0){this.ring(b.x,b.y,20,s*.8,d);b.weakTime=2.5;}break;
   case 2:this.ring(b.x,b.y,20+phase*4,s*.8,d,b.age*.4,{kind:'diamond'});if(phase>1&&pattern%2===0)this.laser(clamp(p.x,30,W-30),b.y,d,{width:16,warn:1.25});if(phase>2&&pattern%3===0)this.wall(d,s,Math.floor(this.random()*7));break;
   case 3:this.fan(b.x,b.y+65,11,1.4,s,d,Math.PI/2,{kind:'diamond',color:'#a0e6ff'});if(pattern%3===0)this.zone(p.x,H*.66,95,0,'freeze',{duration:4});if(phase>1&&pattern%2===0)this.laser(clamp(p.x,35,W-35),b.y,d,{width:24,warn:1.4});if(pattern%4===0)b.weakTime=3.2;break;
   case 4:this.ring(b.x,b.y,18+phase*4,s,d,b.age,{kind:'diamond'});if(pattern%2===0){const safe=Math.floor(this.random()*4);for(let i=0;i<4;i++)if(i!==safe)this.laser(55+i*110,b.y,d,{width:30,warn:1.3});}if(b.parts.every(part=>part.dead))b.weakTime=8;break;
   case 5:{const heads=Math.min(5,1+Math.floor((1-b.hp/b.maxHp)*5));for(let i=0;i<heads;i++)this.fan(b.x+(i-(heads-1)/2)*30,b.y+60,3,.4,s,d,a);if(pattern%3===0){this.ring(b.x,b.y,24,s,d,b.age*.2,{kind:'orb',r:7});b.weakTime=2.5;}if(phase>1&&pattern%2===0)for(const x of [55,W-55])this.laser(x,b.y,d,{width:25});break;}
   case 6:for(const x of [-80,80])this.fan(b.x+x,b.y+60,4+phase,.9,s,d,a+(x<0?.12:-.12),{kind:'diamond'});if(pattern%3===0){for(const x of [p.x-50,p.x+50])this.laser(clamp(x,20,W-20),b.y,d,{width:17,warn:1.25});b.weakTime=3;}if(phase>1&&pattern%4===0){b.chargeWarning=1;this.zone(p.x,H*.57,35,d,'blast');}break;
   case 7:this.fan(b.x,b.y+60,7+phase*2,1.65,s,d,a,{kind:'diamond',bounce:1});if(pattern%3===0){for(let i=0;i<phase;i++)this.zone(50+this.random()*(W-100),220+this.random()*340,35,d,'blast',{warn:1.25});b.teleport=.8;b.weakTime=2;}if(b.parts.every(part=>part.dead))b.weakTime=Math.max(b.weakTime,6);break;
   case 8:if(phase===1)this.fan(b.x,b.y+65,7,1.1,s,d,a);else if(phase===2){if(this.ship.id==='Bastion3')this.fan(b.x,b.y,5,1.0,s*1.2,d,a);else if(this.ship.id==='WraithX')this.laser(p.x,b.y,d,{width:18,warn:1.3});else for(const x of [-25,25])this.fan(b.x+x,b.y,3,.45,s*1.2,d,a);}else if(phase===3){this.ring(b.x,b.y,24,s,d,b.age,{bounce:pattern%2,kind:'diamond'});if(pattern%2===0)this.laser(p.x,b.y,d,{width:20});}else{this.ring(b.x,b.y,22,s,d,b.age*.3,{unclearable:pattern%3===0,kind:'triangle',r:6});if(pattern%3===0)this.zone(W/2,H*.55,140,0,'time',{duration:3.5});}if(pattern%4===0)b.weakTime=2;break;
  }
  this.combatSound('boss-fire',{boss:c+1,art:bossShotArt(c,pattern),x:b.x});this.bossArsenal();this.firingBoss=false;
  const skillInterval=Math.max(2,(phase===1?4:3)-this.difficulty.skillBonus);if(pattern%skillInterval===0)this.bossSkill();
 }
 // Every approved exclusive asset is used by its own Boss. Sounds belong to
 // the attack's warning/activation, never to each individual bullet.
 bossArsenal(){
  const b=this.boss,c=this.stage.chapter,list=BOSS_ARSENALS[c],entry=list[(Math.max(1,b.pattern)-1)%list.length],id=entry.id;
  const p=this.player,x=b.x,y=b.y+65,s=(158+c*8)*this.difficulty.speed,d=(48+c*7)*this.difficulty.damage;
  const warn=this.difficulty.id==='easy'?1.8:this.difficulty.id==='hard'?1.2:1.5;
  const aim=Math.atan2(p.y-y,p.x-x),shot=bossShotArt(c,b.pattern),color=BOSS_COLORS[c],owner={boss:c+1};
  this.weaponEffect(c===1||c===6?'CFX_02':'CFX_01',x,y,48,.2);
  const volley=fire=>this.hazards.push({type:'barrage',art:bossTelegraphArt(c),x,y,r:32,age:0,warn,duration:.18,soundOwner:owner,activationArt:id,volley:()=>{this.weaponEffect(id,x,y,entry.kind==='projectile'?45:115,.55);fire();}});
  if(entry.kind==='projectile'){
   const options={art:id,color,r:6,hold:c===7&&id==='B08_W01'?.65:0};
   if(/boomerang/.test(entry.name))options.bounce=1;
   volley(()=>this.fan(x,y,2+b.phase,.3,s,d,aim,options));
  }else if(entry.kind==='weapon'){
   if(c===5)this.zone(p.x,clamp(p.y-70,200,H-130),36,d,'mine',{art:id,warn,duration:3});
   else if(c===8)this.zone(clamp(p.x,95,W-95),clamp(p.y-90,240,H-160),82,0,'time',{art:id,warn,duration:2.4});
   else volley(()=>{for(const dx of [-30,30])this.shoot(x+dx,y,aim,s*.75,d,'enemy',{art:id,r:8,homing:true,target:p,trackingRate:this.difficulty.id==='hard'?4:1.5,maxSpeed:s*1.5,color});});
  }else if(entry.kind==='pattern'){
   volley(()=>{if(/cluster|spread|barrage/.test(entry.name))for(const dx of [-52,0,52])this.fan(x+dx,y,3,.24,s,d,aim,{art:shot,color});else this.ring(x,y,12+b.phase*3,s*.85,d,b.age*.4,{art:shot,color,kind:'diamond'});});
  }else if(entry.kind==='beam'){
   this.laser(clamp(p.x,35,W-35),y,d,{art:id,strip:entry.strip,emitter:entry.emitter,warn,width:18+c,duration:.7});
  }else if(entry.kind==='telegraph'){
   this.zone(p.x,p.y,42,d,'blast',{art:id,warnArt:id,impactArt:bossImpactArt(c),warn,duration:.35});
  }else if(entry.kind==='impact'){
   this.zone(p.x,clamp(p.y-25,220,H-125),45,d,'blast',{art:id,warn,duration:.4});
  }else{
   const type=c===8?'time':c===3?'freeze':'fire';
   this.zone(clamp(p.x,95,W-95),clamp(p.y-90,240,H-160),type==='fire'?50:82,type==='fire'?d*.5:0,type,{art:id,warn,duration:2.4});
  }
 }
 // Every boss adds a telegraphed combination, escalating with its phase.
 bossSkill(){
  const previousBoss=this.firingBoss;this.firingBoss=true;const b=this.boss,p=this.player,c=this.stage.chapter,phase=b.phase,d=(65+c*9)*this.difficulty.damage,s=(170+c*8)*this.difficulty.speed;
  const volley=(x,y,warn,fire)=>this.hazards.push({type:'barrage',art:bossTelegraphArt(c),soundOwner:{boss:c+1},skill:true,x,y,r:26,age:0,warn,duration:.16,volley:()=>{const previous=this.firingBoss;this.firingBoss=true;try{fire();}finally{this.firingBoss=previous;}}});
  const aim=(x,y)=>Math.atan2(p.y-y,p.x-x),angle=aim(b.x,b.y),x=b.x,y=b.y+65;
  this.emit({type:'message',speaker:'WARNING / 巨型目标',text:BOSS_SKILLS[c]+' · 躲避预警区域',duration:2});
  this.combatSound('boss-skill-warning',{boss:c+1});this.weaponEffect(c===8?'CFX_14':c===1?'CFX_13':c===7?'CFX_15':'CFX_05',x,y,90,.5);
  switch(c){
   case 0:for(const side of [-1,1]){const xx=clamp(x+side*110,35,W-35),a=aim(xx,y);volley(xx,y,1.2,()=>this.fan(xx,y,6+phase,.62,s,d,a));}break;
   case 1:{const safe=Math.floor(this.random()*5);for(let lane=0;lane<5;lane++)if(lane!==safe)this.zone(45+lane*90,H*.71,35,d*.5,'fire',{warn:1.5,duration:2.3});volley(x,y,1.5,()=>this.ring(x,y,18+phase*4,s*.8,d,angle));break;}
   case 2:for(let n=0;n<2;n++)volley(x+(n-.5)*70,y,1.2+n*.38,()=>this.ring(x+(n-.5)*70,y,24+phase*4,s*.85,d,angle+n*.15,{kind:'diamond'}));break;
   case 3:{const gap=Math.floor(this.random()*7);volley(W/2,135,1.4,()=>this.wall(d,s,gap));this.zone(clamp(p.x,100,W-100),H*.63,82,0,'freeze',{warn:1.4,duration:3});break;}
   case 4:{const safe=Math.floor(this.random()*5);for(let lane=0;lane<6;lane++)if(lane!==safe&&lane!==safe+1)this.laser(35+lane*76,y,d,{width:25,warn:1.55,duration:.8});volley(x,y,1.55,()=>this.ring(x,y,16+phase*3,s*.82,d,angle));break;}
   case 5:for(let n=0;n<3;n++)this.laser(clamp(p.x+(n-1)*72,28,W-28),y,d,{width:18,warn:1.3+n*.35,duration:.55});volley(x,y,1.5,()=>this.ring(x,y,16+phase*4,s,d,angle,{kind:'orb',r:6}));break;
   case 6:for(const side of [-1,1]){const xx=x+side*85,a=aim(xx,y)+side*.18;volley(xx,y,1.35,()=>this.fan(xx,y,8+phase,.95,s,d,a,{kind:'diamond'}));}if(phase>1)this.zone(p.x,H*.67,42,d,'blast',{warn:1.6});break;
   case 7:for(const side of [-1,1]){const xx=side<0?24:W-24,a=aim(xx,175);volley(xx,175,1.35,()=>this.fan(xx,175,8+phase,1.3,s*.88,d,a,{kind:'diamond',bounce:1}));}break;
   case 8:for(let n=0;n<2;n++)volley(x,y,1.35+n*.4,()=>this.ring(x,y,18+phase*6,s*(.8+n*.14),d,angle+n*.11,{kind:'triangle',unclearable:phase===4&&n===1}));if(phase>1){const gap=Math.floor(this.random()*7);volley(W/2,135,1.6,()=>this.wall(d,s,gap));}if(phase===4)this.zone(W/2,H*.6,110,0,'time',{warn:1.6,duration:2.8});break;
  }this.firingBoss=previousBoss;
 }
 wall(damage,speed,gap){for(let i=0;i<23;i++)if(Math.abs(i-(4+gap*2))>2)this.shoot(16+i*19,135,Math.PI/2,speed,damage,'enemy',{kind:'diamond'});}
 updateBullets(dt){const p=this.player;for(const b of this.bullets){if(!b.alive)continue;b.age+=dt;b.px=b.x;b.py=b.y;let scale=1;if(b.owner==='enemy'&&this.ship.id==='WraithX'&&p.ultTime>0&&!b.unclearable)scale=.6;for(const h of this.hazards)if(h.type==='time'&&h.age>h.warn&&b.owner==='enemy'&&Math.hypot(h.x-b.x,h.y-b.y)<h.r)scale*=h.age-h.warn<2?.27:1.15;
   if(b.hold&&b.age<b.hold)scale=0;
   if(b.burstAt&&b.age>b.burstAt){this.weaponEffect(b.art,b.x,b.y,55,.3);this.ring(b.x,b.y,8,170*this.difficulty.speed,b.damage*.7,0,{art:b.burstArt,color:b.color});b.alive=false;continue;}
   if(b.homing&&b.target?.alive!==false&&!b.target?.dead){const a=Math.atan2(b.target.y-b.y,b.target.x-b.x),speed=b.maxSpeed||Math.min(550,300+b.age*220),t=Math.min(1,dt*(b.trackingRate||6));b.vx+=(Math.cos(a)*speed-b.vx)*t;b.vy+=(Math.sin(a)*speed-b.vy)*t;}
   b.x+=b.vx*dt*scale;b.y+=b.vy*dt*scale;
   if(b.bounce>0&&(b.x<b.r||b.x>W-b.r)){b.x=clamp(b.x,b.r,W-b.r);b.vx*=-1;b.bounce--;}
   if(b.x<-55||b.x>W+55||b.y<-70||b.y>H+65||b.age>10){if(b.shock&&b.owner==='enemy'&&b.y>H-130&&b.y<H+30)this.ring(b.x,Math.min(b.y,H-110),12,145,b.damage*.6);b.alive=false;continue;}
   if(b.owner==='player'){
    for(const e of this.enemies){if(!b.alive)break;if(!e.alive||e.phaseOut||b.hit.has(e.id))continue;if(Math.abs(b.x-e.x)<e.r+b.r&&Math.abs(b.y-e.y)<e.r+b.r){b.hit.add(e.id);this.damageEnemy(e,b.damage,b.x);p.consecutive++;p.lastShotHit=this.time;if(b.pierce>0)b.pierce--;else b.alive=false;}}
    const boss=this.boss;if(b.alive&&boss&&!boss.dead&&Math.abs(b.x-boss.x)<boss.w*.42&&Math.abs(b.y-boss.y)<boss.h*.3){this.damageBoss(b.damage,b.x,b.y);b.alive=false;p.consecutive++;p.lastShotHit=this.time;}
   }else{
    const d=dist(b,p);if(d<b.r+p.r){if(p.invulnerable<=0){this.hurtPlayer(b.damage);b.alive=false;if(b.shock)this.ring(b.x,b.y,12,140,b.damage*.6);}}
    else if(!b.grazed&&d<b.r+p.r+15){b.grazed=true;this.grazes++;this.score+=15;this.energy(this.ship.id==='WraithX'?11:5);if(this.ship.id==='WraithX')p.stacks=Math.min(20,p.stacks+1);if(this.grazes%5===0){this.combatSound('graze');this.float('擦弹 +',p.x,p.y-45,'#bba5ff');}}
   }
  }
  const remaining=[];for(const b of this.bullets)if(b.alive)remaining.push(b);else{this.bulletCounts[b.owner]--;this.pool.release(b);}this.bullets=remaining;
 }
 updateHazards(dt){const p=this.player;for(const h of this.hazards){h.age+=dt;if(h.age<h.warn||h.visual)continue;if(!h.activated){h.activated=true;const impact=hazardImpactArt(h);this.combatSound(h.skill?'boss-skill':h.soundOwner?.boss?'boss-weapon':h.soundOwner?.enemy?'enemy-special':'environment',{...h.soundOwner,art:h.activationArt||impact||h.art,x:h.x,hazard:h.type});if(impact&&['blast','fire','mine','cross'].includes(h.type))this.weaponEffect(impact,h.x,h.y,h.r*2,.35);}if(h.volley&&!h.triggered){h.triggered=true;h.volley();}let contact=false;if(h.type==='laser')contact=Math.abs(p.x-h.x)<h.width/2+p.r&&p.y>h.y;else if(h.type==='cross'){const dx=p.x-h.x,dy=p.y-h.y;contact=Math.max(Math.abs(dx),Math.abs(dy))<h.r&&Math.min(Math.abs(dx-dy),Math.abs(dx+dy))/Math.SQRT2<10+p.r;}else if(['blast','fire','mine'].includes(h.type))contact=Math.hypot(p.x-h.x,p.y-h.y)<h.r+p.r;
   if(contact)this.hurtPlayer(h.damage);if(h.type==='mine'&&contact)h.age=h.warn+h.duration;
  }this.hazards=this.hazards.filter(h=>h.age<h.warn+h.duration);}
 drop(kind,x,y,{tier='s',amount,container=null}={}){const pickup={id:++this.uid,kind,tier:TIERS.includes(tier)?tier:'s',x:clamp(x,18,W-18),y:clamp(y,12,H-45),age:0,container};if(Number.isFinite(amount)&&amount>0)pickup.amount=amount;this.pickups.push(pickup);return pickup;}
 lootBurst(name,x,y,size=62,duration=.5){if(this.lootBursts.length<28)this.lootBursts.push({name,x,y,size,duration,age:0});}
 updatePickups(dt){const p=this.player;for(const i of this.pickups.slice()){if(i.dead)continue;i.age+=dt;const d=dist(i,p);i.attracting=i.age>.2&&(d<this.growth.magnet||this.bossDefeated);if(i.attracting){const speed=this.bossDefeated?Math.min(1050,d/Math.max(dt,.001)):220+Math.max(0,this.growth.magnet-10-d)*4;const step=Math.min(d,speed*dt);i.x+=(p.x-i.x)/Math.max(1,d)*step;i.y+=(p.y-i.y)/Math.max(1,d)*step;}else i.y+=50*dt;if(i.age>.2&&dist(i,p)<19)this.collect(i);if(i.y>H+25||i.age>17)i.dead=true;}this.pickups=this.pickups.filter(i=>!i.dead);}
 collect(i){if(i.collected)return;i.collected=true;i.dead=true;const p=this.player,n=tierIndex(i.tier),units=n+1;
  if(i.kind==='container'){this.lootBurst('pickup_rare_gold',i.x,i.y,85,.65);const loot=containerLoot(i.container,i.tier,this.stage.chapter);loot.forEach((item,index)=>this.drop(item.kind,i.x+(index-(loot.length-1)/2)*27,i.y-48,{tier:item.tier,amount:item.amount}));this.float('补给箱已开启',p.x,p.y-55,'#ffd585');this.combatSound('pickup',{pickup:'container'});return;}
  const info=ITEM_BY_KIND[i.kind];if(!info)return;this.lootBurst(info.collect,p.x,p.y-12,65,.45);
  switch(i.kind){case 'coin':{const amount=i.amount??[8,16,32][n];this.coins+=amount;this.score+=amount*3;break;}
   case 'power':this.weaponXp+=units;this.weaponLevel=1+Math.min(4,Math.floor(this.weaponXp/3));this.float('火控 +',p.x,p.y-35);break;
   case 'shield':p.shield=Math.min(p.maxShield,p.shield+p.maxShield*[.25,.35,.5][n]*this.growth.supply);this.float('护盾 +',p.x,p.y-35);break;
   case 'repair':p.hp=Math.min(p.maxHp,p.hp+p.maxHp*[.12,.18,.25][n]*(1+.2*(this.talents.repair||0))*this.growth.supply);this.lastSupply=this.time;this.float('修复 +',p.x,p.y-35,'#88e3b3');break;
   case 'energy':this.energy(120*units);break;
   case 'fragment':this.bombFragments+=units;while(this.bombFragments>=4){this.bombFragments-=4;p.bombs=Math.min(p.maxBombs,p.bombs+1);this.float('爆弹 +1',p.x,p.y-35,'#ffb979');}break;
   case 'bomb':p.bombs=Math.min(p.maxBombs,p.bombs+1);this.float('爆弹 +1',p.x,p.y-35,'#ffb979');break;
   case 'score':{const amount=Math.round([100,250,600][n]*this.combo*this.difficulty.score);this.score+=amount;this.float('分数 +'+amount,p.x,p.y-35,'#83e9ff');break;}
   case 'blueprint':case 'data':this.materials[i.kind]+=units;this.score+=125*units;this.float((i.kind==='blueprint'?'蓝图 +':'数据核心 +')+units,p.x,p.y-35,info.color);break;
  }this.combatSound('pickup',{pickup:i.kind});
 }
 clearBullets(){for(const b of this.bullets)if(b.owner==='enemy'&&!b.unclearable)b.alive=false;}
 hurtPlayer(damage,art=''){const p=this.player;if(this.state!=='playing'||p.invulnerable>0)return;this.hits++;p.lastHit=this.time;p.invulnerable=.55;if(this.ship.id==='Bastion3'&&p.skillTime>0)damage*=.4;const old=p.shield,absorbed=Math.min(p.shield,damage);p.shield-=absorbed;damage-=absorbed;p.hp=Math.max(0,p.hp-damage*(1-this.ship.armor));if(this.ship.id==='WraithX')p.stacks=Math.max(0,p.stacks-5);if(old>0&&p.shield<=0){this.effect('Shield_Break',p.x,p.y,120,.55);this.combatSound('shield');if(this.ship.id==='Bastion3'&&p.armorCd<=0){p.invulnerable=1;p.armorCd=20;}}
  this.weaponEffect(old>0?'GFX_05':enemyImpactArt(art),p.x,p.y,60,.3);if(old<=0)this.weaponEffect('GFX_17',p.x,p.y,38,.18);this.shake=3;this.flash=.08;this.sparks(p.x,p.y,'#70cff6',10);if(old>0)this.combatSound('shield-hit');if(damage>0)this.combatSound('hit');this.emit({type:'haptic'});
 }
 damageEnemy(e,amount,hitX=e.x){if(!e.alive||e.phaseOut)return;let multiplier=e.shielded?.55:1;if(e.type===22&&Math.abs(hitX-e.x)<e.size*.20)multiplier*=.5;const crit=this.random()<(this.ship.id==='WraithX'?.12+this.player.stacks*.003:.05);if(crit)multiplier*=1.5+this.player.stacks*.025;e.hp-=amount*multiplier;e.flash=.45;this.combatSound('enemy-hit',{enemy:e.type,x:e.x});if(this.random()<.12)this.weaponEffect(playerEffectArt(this.ship.id,'hit'),hitX,e.y,28,.18);this.energy(amount/this.dps*7);if(this.random()<.08)this.float(Math.ceil(amount*multiplier),e.x,e.y-20,crit?'#ffcd8b':'#9ad7ee');if(e.hp<=0)this.killEnemy(e);}
 killEnemy(e){if(!e.alive)return;e.alive=false;this.kills++;this.lastKill=this.time;this.combo=Math.min(3,this.combo+.02);this.score+=Math.round((100+e.cfg.hp*.35)*this.combo*this.difficulty.score);this.energy(13+(e.cfg.category==='heavy'?25:0));this.effect(e.size>70?'Explosion_Large':e.size>56?'Explosion_Medium':'Explosion_Small',e.x,e.y,e.size*1.7,.55);if(e.size>70){this.weaponEffect('GFX_08',e.x,e.y,100,.8);this.weaponEffect('GFX_19',e.x+12,e.y+18,65,.7);}this.sparks(e.x,e.y,'#ffb577',9);this.combatSound('explosion',{enemy:e.type,x:e.x});
  const tier=['heavy','elite'].includes(e.cfg.category)?'l':['bomber','support'].includes(e.cfg.category)?'m':'s',bonusTier=TIERS[Math.floor(this.kills/8)%3];this.drop('coin',e.x,e.y,{tier,amount:8+Math.floor(e.cfg.hp/30)});
  if(this.player.hp<this.player.maxHp*.35&&this.time-this.lastSupply>25){this.drop('repair',e.x+14,e.y,{tier:'m'});this.lastSupply=this.time;}
  else if(this.kills%4===0){const kind=this.kills%20===0?'repair':this.kills%12===0?'shield':'power',resourceTier=kind==='shield'?TIERS[(Math.floor(this.kills/12)-1)%3]:bonusTier;this.drop(kind,e.x-14,e.y,{tier:resourceTier});}
  if(e.cfg.category==='heavy'||e.cfg.category==='elite')this.drop(this.random()>.55?'energy':'fragment',e.x+20,e.y,{tier:TIERS[this.kills%3]});
  if(this.kills%10===0)this.drop('score',e.x-25,e.y-8,{tier:TIERS[this.stage.chapter%3]});
  if(this.kills%24===0)this.drop('blueprint',e.x+25,e.y-8,{tier:TIERS[this.stage.chapter%3]});
  if(this.kills%16===0)this.drop('container',e.x,e.y-34,{container:'supply_'+TIERS[this.stage.chapter%3]});
  if(e.cfg.category==='elite'&&this.kills%3===0)this.drop('container',e.x,e.y-35,{tier:TIERS[this.stage.chapter%3],container:'elite'});
  if(e.cfg.category==='heavy'&&this.kills%7===0)this.drop('data',e.x-22,e.y,{tier:TIERS[this.stage.chapter%3]});
 }
 damageBoss(amount,x,y){const b=this.boss;if(!b||b.dead||b.y<100)return;let mod=b.weakTime>0?1.65:b.armored?.4:1;let partHit=false;for(const part of b.parts){if(part.dead)continue;const px=b.x+part.x*b.w,py=b.y+part.y*b.h;if(Math.hypot(x-px,y-py)<25){part.hp-=amount;partHit=true;if(part.hp<=0){part.dead=true;this.score+=Math.round(1000*this.difficulty.score);this.energy(100);b.weakTime=3;this.weaponEffect('CFX_08',px,py,100,.55);this.effect('Shield_Break',px,py,100,.55);this.float('部件破坏',px,py,'#ffe0a1');this.combatSound('boss-armor',{boss:this.stage.chapter+1});}}}
  if(this.stage.chapter===4&&b.parts.some(part=>!part.dead)&&!partHit)mod*=.35;if(this.stage.chapter===7&&b.parts.some(part=>!part.dead)&&!partHit)mod*=.7;
  if(this.stage.chapter===6){if(x<b.x)b.lDamage+=amount;else b.rDamage+=amount;const total=b.lDamage+b.rDamage;if(total>b.maxHp*.15&&Math.abs(b.lDamage-b.rDamage)/total>.28&&b.weakTime<=0)mod*=.75;}
  b.hp=Math.max(0,b.hp-amount*mod);b.flash=.25;this.combatSound('boss-hit',{boss:this.stage.chapter+1,x});if(this.random()<.06)this.weaponEffect(playerEffectArt(this.ship.id,'hit'),x,y,35,.18);this.energy(amount/this.dps*6);if(b.hp<=0){b.dead=true;this.bossDefeated=true;this.emit({type:'boss-end',result:'victory',chapter:this.stage.chapter});this.score+=Math.round((15000+this.stage.chapter*3000)*this.combo*this.difficulty.score);this.clearBullets();this.hazards=[];this.shake=7;for(let i=0;i<7;i++)this.effect('Explosion_Boss',b.x+(this.random()-.5)*b.w*.65,b.y+(this.random()-.5)*b.h*.6,160+i*20,1+i*.12);this.weaponEffect(bossImpactArt(this.stage.chapter),b.x,b.y,260,1.4);this.weaponEffect(this.stage.chapter===0?'CFX_04':this.stage.chapter===8?'CFX_14':'CFX_03',b.x,b.y,220,1);this.sparks(b.x,b.y,'#ffd39a',70);this.combatSound('boss-defeat',{boss:this.stage.chapter+1});for(const e of this.enemies)if(e.alive)this.killEnemy(e);this.drop('container',b.x,b.y,{tier:'l',container:'boss'});}
 }
 updateVisuals(dt){for(const f of this.weaponEffects)f.age+=dt;this.weaponEffects=this.weaponEffects.filter(f=>f.age<f.duration);for(const f of this.effects)f.age+=dt;this.effects=this.effects.filter(f=>f.age<f.duration);for(const f of this.lootBursts)f.age+=dt;this.lootBursts=this.lootBursts.filter(f=>f.age<f.duration);for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-dt*2;p.vy*=1-dt*2;}this.particles=this.particles.filter(p=>p.age<p.life);for(const t of this.texts){t.age+=dt;t.y-=22*dt;}this.texts=this.texts.filter(t=>t.age<.85);}
 finish(win){if(this.state==='finished')return;if(win&&this.bossDefeated){for(const item of this.pickups){if(!item.collected)this.collect(item);}this.pickups=[];}this.state='finished';const ratio=this.kills/Math.max(1,this.spawned);const stars=win?1+(ratio>=.65?1:0)+(this.hits===0?1:0):0;this.emit({type:'result',win,stage:this.stage,score:Math.round(this.score),kills:this.kills,grazes:this.grazes,hits:this.hits,coins:this.coins,materials:{...this.materials},time:this.time,stars,seen:[...this.seen],difficulty:this.difficulty.id,pace:this.pace,ship:this.ship.id,level:this.level});}
}

export {AssetStore} from './asset-loader.js?v=14';
