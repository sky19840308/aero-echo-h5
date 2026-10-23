import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {Game} from '../dist/engine.js?v=30';
import {CoopGame,CoopSession} from '../dist/coop.js?v=30';
import {Renderer} from '../dist/renderer.js?v=30';
import {stageConfig} from '../dist/data.js?v=30';
import {packCoopSnapshot,unpackCoopSnapshot} from '../dist/coop-wire.js?v=30';
import {bastionSatellitePosition,bastionUltimateTarget,segmentHitsAabb} from '../dist/combat-geometry.js?v=30';
import {WINGMEN} from '../dist/wingmen.js?v=30';

const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.window={devicePixelRatio:1};
globalThis.ResizeObserver=class{observe(){}};
const manifest={
 players:Object.fromEntries(['Dawn7','Bastion3','WraithX'].map(id=>[id,[{src:'ship.png',width:1,height:1}]])),
 enemies:Object.fromEntries(Array.from({length:30},(_,i)=>[i+1,{src:'enemy.png',width:1,height:1}])),
 playerWeapons:{sprites:{}},weapons:{sprites:{}}
};
const canvas=createCanvas(450,800);canvas.getBoundingClientRect=()=>({width:450,height:800});
const renderer=new Renderer(canvas,{manifest,get:()=>null},{detail:false,shake:false,flash:false,numbers:false});
const stage=stageConfig(0,0,'campaign','quick');
assert.match(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),/YujiSyuku-bombs\.ttf/,'the compact brush font is bundled locally and preloaded for bomb callouts');

const bombCallouts=[['三段撃','織田信長'],['風林火山','武田信玄'],['忍術皆伝','服部半蔵']];
for(const [ship,action,name] of bombCallouts.map(([action,name],index)=>[index,action,name])){
 const events=[],game=new Game({stage,ship,seed:801+ship,onEvent:event=>events.push(event)});game.start();assert.equal(game.skill(),true);
 assert.ok(!game.effects.some(effect=>effect.name==='SkillCallout'),'first skills do not create a title callout');
 assert.ok(!events.some(event=>event.type==='toast'&&/三段击|风林火山|忍术皆传/.test(event.text||'')),'first skills do not show skill-title toast text');
 const bombGame=new Game({stage,ship,seed:811+ship});bombGame.start();assert.equal(bombGame.bomb(),true);assert.equal(bombGame.player.heroBomb.action,action,'the bomb stores its own art-title animation');assert.equal(bombGame.player.heroBomb.name,name,'the summoned hero carries its Japanese name');
}
{
 const expected=[['織田信長',0],['武田信玄',1],['服部半蔵',2]];
 for(const [name,index] of expected){
  const room={mode:'online',host:{id:'host',choice:{shipIndex:index}},guest:{id:'guest',choice:{shipIndex:0}}},game=new CoopGame({mission:0,room,seed:821+index});game.start();assert.equal(game.use('host','skill'),true);
  assert.ok(!game.effects.some(effect=>effect.name==='SkillCallout'),'co-op skills do not create title callouts');
  assert.equal(game.use('host','bomb'),true);const transported=unpackCoopSnapshot(packCoopSnapshot(game.snapshot())),restored=new CoopGame({mission:0,room,seed:831+index});restored.restore(transported);
  assert.equal(restored.crew.find(pilot=>pilot.role==='host').player.heroBomb?.name,name,'co-op snapshots preserve the correct summoned-hero name');
 }
}
{
 const game=new Game({stage,seed:820});game.start();assert.equal(game.bomb(),true);
 const names=[],fonts=[],fill=renderer.ctx.fillText.bind(renderer.ctx),stroke=renderer.ctx.strokeText.bind(renderer.ctx);let inkStrokes=0;renderer.ctx.fillText=(text,...args)=>{names.push(String(text));fonts.push(renderer.ctx.font);return fill(text,...args);};renderer.ctx.strokeText=(text,...args)=>{inkStrokes++;return stroke(text,...args);};
 game.player.heroBomb.age=.55;renderer.bombCinematics(game,1);assert.equal(names.join(''),'三段','the bomb title reveals its first brush glyphs in sequence');
 names.length=0;game.player.heroBomb.age=1.1;renderer.bombCinematics(game,1);renderer.ctx.fillText=fill;renderer.ctx.strokeText=stroke;
 assert.equal(names.join(''),'三段撃織田信長','the bomb title and summoned hero name reveal one Japanese glyph at a time');
 assert.ok(fonts.some(font=>font.includes('Yuji Syuku')),'the summon uses a Japanese brush-calligraphy font stack');
 assert.ok(inkStrokes>=24,'both calligraphy lines receive layered ink and glow strokes per glyph');
}
{
 const game=new Game({stage,ship:0,seed:901});game.start();const enemy=game.spawn(1,225,230),hp=enemy.hp;
 game.skill();game.player.fireTime=5;game.player.secondaryTime=5;game.updatePlayer(.02);
 assert.ok(enemy.hp<hp,'Dawn plasma skill damages enemies in its vertical lane');
 const shot=game.shoot(225,600,-Math.PI/2,100,1,'player');
 assert.ok(shot.accelerated);assert.ok(Math.hypot(shot.vx,shot.vy)>=161,'Dawn primary rounds accelerate by at least 1.6x');
 const crossing=game.spawn(1,225,425),crossingHp=crossing.hp;game.shoot(225,475,-Math.PI/2,2000,2,'player');game.updateBullets(.03);assert.ok(crossing.hp<crossingHp,'accelerated Dawn rounds hit enemies crossed between frames');
 assert.ok(!game.effects.some(effect=>effect.name==='SkillCallout'),'Dawn first skill has no rendered title effect');
 renderer.dawnSkillBeam(game.player,1.25);
}
{
 const game=new Game({stage,ship:1,seed:902});game.start();game.skill();game.player.invulnerable=0;const lives=game.player.lives;
 game.hurtPlayer(999);assert.equal(game.player.lives,lives,'Bastion shield blocks direct damage while active');
 const charged=game.player.energy;game.hurtPlayer(999);game.hurtPlayer(999);assert.equal(game.player.energy,charged,'repeated contact cannot bypass the shield impact charge cooldown');assert.equal(game.effects.filter(effect=>effect.name==='Bastion3_ShieldImpact').length,1,'shield feedback is rate limited during repeated contact');
 game.updatePlayer(.12);game.hurtPlayer(999);assert.equal(game.effects.filter(effect=>effect.name==='Bastion3_ShieldImpact').length,2,'shield feedback can trigger again after its short cooldown');
 renderer.bastionSatellites(game.player,1);renderer.bastionShield(game.player,1);
 game.spawn(1,250,190);game.player.x=170;game.player.targetX=170;game.player.targetY=game.player.y;game.secondaryFire();const drones=game.bullets.filter(b=>b.owner==='player'&&b.kind==='drone');assert.equal(drones.length,2);for(let i=0;i<2;i++){const orbit=bastionSatellitePosition(game.player,game.clock,i);assert.equal(drones[i].x,orbit.x);assert.equal(drones[i].y,orbit.y,'Bastion drones launch from the displayed rotating satellites');}
 const pulseTarget=bastionUltimateTarget(game.player,null);game.player.energy=1000;assert.equal(game.ultimate(),true);game.player.fireTime=5;game.player.secondaryTime=5;game.player.ultTick=0;game.updatePlayer(.01);
 const burst=game.effects.find(effect=>effect.name==='Bastion3_Gravity_Burst');assert.ok(burst&&burst.duration<=.3&&burst.size<=240,'Bastion ultimate is a shorter, smaller explosion');assert.equal(burst.x,pulseTarget.x);assert.equal(burst.y,pulseTarget.y,'Bastion gravity pulse uses the same target as its guided beam');
 const weapon=renderer.weapon.bind(renderer),drawnWeapons=[];renderer.weapon=(...args)=>{drawnWeapons.push(args);return true;};renderer.ultimate(game,1);renderer.weapon=weapon;const beam=drawnWeapons.find(args=>args[0]==='P_BASTION_laser_strip');assert.equal(beam[1],(game.player.x+pulseTarget.x)/2);assert.equal(beam[2],(game.player.y+pulseTarget.y)/2);
 renderer.shieldImpact({x:225,y:600,size:132,age:.1,duration:.42},1);
}
{
 const room={mode:'online',host:{id:'host',choice:{shipIndex:1}},guest:{id:'guest',choice:{shipIndex:0}}},game=new CoopGame({mission:0,room,seed:9021});game.start();game.clock=.37;game.spawn(1,225,230);
 const translated=[],translate=renderer.ctx.translate.bind(renderer.ctx),sprite=renderer.sprite;renderer.ctx.translate=(x,y)=>{translated.push({x,y});return translate(x,y);};renderer.sprite=()=>{};
 try{renderer.player(game,0,89);}finally{renderer.ctx.translate=translate;renderer.sprite=sprite;}
 game.selectPilot('host');game.secondaryFire();const shots=game.bullets.filter(b=>b.owner==='player'&&b.kind==='drone');assert.equal(translated.length,2,'both Bastion satellites are rendered');assert.equal(shots.length,2,'the paired orbital shots launch from the satellites');
 for(let i=0;i<2;i++){const expected=bastionSatellitePosition(game.crew[0].player,game.clock,i);assert.ok(Math.abs(translated[i].x-expected.x)<1e-9&&Math.abs(translated[i].y-expected.y)<1e-9,'satellite render orbit follows game simulation time, not the app page clock');assert.equal(shots[i].x,translated[i].x);assert.equal(shots[i].y,translated[i].y,'satellites and their shots stay aligned after menu/pause clock drift');}
}
{
 const game=new Game({stage,ship:2,seed:903});game.start();game.skill();game.player.invulnerable=0;const lives=game.player.lives;
 game.hurtPlayer(999);assert.equal(game.player.lives,lives,'Wraith stealth blocks damage even without the ordinary invulnerability timer');
 const enemy=game.spawn(1,225,235),hp=enemy.hp;game.secondaryFire();assert.ok(enemy.hp<hp,'Wraith chained slash deals damage');assert.ok(game.effects.some(effect=>effect.name==='WraithX_SlashBurst'),'Wraith chained slash creates its own cinematic effect');
 renderer.slashBurst({x:225,y:235,size:100,duration:.42,age:.12,seed:.3});
 game.effects=[];game.enemies=[];game.spawn(1,225,235);game.player.energy=1000;assert.equal(game.ultimate(),true);assert.ok(game.effects.some(effect=>effect.name==='WraithX_SlashBurst'),'Wraith space ultimate creates the multi-slash effect');
 renderer.ultimate(game,1);assert.ok(game.effects.some(effect=>effect.name==='WraithX_Singularity'));
}
{
 const game=new Game({stage,ship:0,seed:9031});game.start();game.player.energy=1000;assert.equal(game.ultimate(),true);let plume=0;renderer.dawnSkillBeam=(p,clock)=>{plume++;};renderer.ultimate(game,1);assert.equal(plume,1,'Dawn space ultimate uses the erupting laser treatment');
}
assert.ok(segmentHitsAabb(225,475,225,378,210,405,240,435),'line-segment collision detects a fast shot crossing an enemy hitbox');
assert.equal(segmentHitsAabb(225,475,225,450,210,405,240,435),false,'line-segment collision ignores shots that stop short of an enemy');
{
 const room={mode:'online',host:{id:'host',name:'Host',choice:{shipIndex:0}},guest:{id:'guest',name:'Guest',choice:{shipIndex:2}}};const game=new CoopGame({mission:0,room,seed:9032});game.start();const host=game.crew.find(pilot=>pilot.role==='host'),enemy=game.spawn(1,225,425),hp=enemy.hp;host.player.skillTime=1;
 const bullet=game.withPilot(host,()=>game.shoot(225,475,-Math.PI/2,2000,2,'player'));assert.ok(bullet.accelerated);game.updateBullets(.03);assert.ok(enemy.hp<hp,'co-op accelerated Dawn rounds also hit enemies crossed between frames');
}
{
 const game=new Game({stage,seed:904});game.start();game.player.invulnerable=0;game.hurtPlayer(99);
 assert.equal(game.player.lives,2);assert.ok(game.player.hitCrash,'a hit starts a burning crash sequence');renderer.playerCrash(game,{src:'ship.png',width:1,height:1},1);
 game.updatePlayer(.94);assert.equal(game.player.hitCrash,null,'the pilot returns after the crash animation');
}
{
 const room={mode:'online',host:{id:'host',choice:{shipIndex:0}},guest:{id:'guest',choice:{shipIndex:2}}};
 const game=new CoopGame({mission:0,room,seed:90401});game.start();const host=game.crew.find(pilot=>pilot.role==='host');host.player.invulnerable=0;
 game.withPilot(host,()=>game.hurtPlayer(99));for(let i=0;i<19;i++)game.update(.05);
 assert.equal(host.player.hitCrash,null,'co-op re-entry follows the same crash animation');assert.equal(host.player.invulnerable,5,'co-op re-entry starts a full five-second immunity window');assert.equal(host.player.respawnTime,5,'the co-op shield visual starts with the full immunity window');
 const lives=host.player.lives;game.withPilot(host,()=>game.hurtPlayer(999));assert.equal(host.player.lives,lives,'co-op damage cannot bypass the re-entry shield');
 const predicted=new CoopGame({mission:0,room,localRole:'guest',seed:90402}),remote=predicted.crew.find(pilot=>pilot.role==='host');remote.player.lives=2;remote.player.hitCrash={x:remote.player.x,y:remote.player.y,vx:0,vy:-12,age:.8,duration:.82};
 const session=new CoopSession({account:{user:{id:'guest'}},autoSync:false});session.role='guest';session.state='playing';session.baseState='playing';session.room=room;session.mission=0;session.game=predicted;session.local=predicted.selectPilot('guest');session.predict(.02);
 assert.equal(remote.player.invulnerable,5,'remote crash prediction does not consume the first frame of immunity');assert.equal(remote.player.respawnTime,5,'remote crash prediction preserves the full shield display duration');
}
{
 const result=[];const game=new Game({stage,seed:9041,onEvent:event=>{if(event.type==='result')result.push(event);}});game.start();game.player.lives=0;game.player.hitCrash={x:game.player.x,y:game.player.y,vx:0,vy:-12,age:0,duration:.2};game.time=stage.duration+1;game.nextWave=Infinity;game.update(.05);
 assert.equal(game.state,'playing','zero-life crash blocks the stage-clear branch');
 for(let i=0;i<5&&game.state!=='finished';i++)game.update(.05);
 assert.equal(game.state,'finished');assert.equal(result.at(-1)?.win,false,'single-player crash resolves as failure, not an accidental win');
}
{
 const result=[];const game=new Game({stage,seed:90411,onEvent:event=>{if(event.type==='result')result.push(event);}});game.start();game.state='ending';game.ending=.01;game.player.lives=0;game.player.hitCrash={x:game.player.x,y:game.player.y,vx:0,vy:-12,age:0,duration:.2};game.update(.05);
 assert.equal(game.state,'ending','zero-life crash keeps the victory ending pending');for(let i=0;i<5&&game.state!=='finished';i++)game.update(.05);
 assert.equal(result.at(-1)?.win,false,'ending resolves as failure only after the zero-life crash clears');
}
{
 const room={mode:'online',host:{id:'host',name:'Host',choice:{shipIndex:0}},guest:{id:'guest',name:'Guest',choice:{shipIndex:2}}};const results=[];
 const game=new CoopGame({mission:0,room,seed:9042,onEvent:event=>{if(event.type==='coop-stage-over')results.push(event);}});game.start();game.time=game.stage.duration+1;game.enemies=[];
 for(const pilot of game.crew){pilot.alive=false;pilot.player.lives=0;pilot.player.hitCrash={x:pilot.player.x,y:pilot.player.y,vx:0,vy:-12,age:0,duration:.2};}
 game.update(.05);assert.equal(game.state,'playing','co-op holds victory while the last pilots crash');
 for(let i=0;i<5&&game.state!=='finished';i++)game.update(.05);
 assert.equal(game.state,'finished');assert.equal(results.at(-1)?.win,false,'co-op crash resolves as failure, not an accidental win');
}
{
 const room={mode:'online',host:{id:'host',choice:{shipIndex:1}},guest:{id:'guest',choice:{shipIndex:2}}},game=new CoopGame({mission:2,room,seed:90422});game.start();
 for(const pilot of game.crew)pilot.player.hitCrash={x:pilot.player.x,y:pilot.player.y,vx:0,vy:-12,age:0,duration:1.2};
 game.bossDefeated=true;game.state='ending';game.ending=2.3;
 for(let frame=0;frame<20;frame++)game.update(.05);
 for(const pilot of game.crew){assert.equal(pilot.alive,true,'the simulated mission 2 pilots remain alive');assert.ok(Math.abs(pilot.player.hitCrash.age-1)<1e-9,'boss victory ending advances each alive pilot crash once per frame');}
}
{
 const room={mode:'online',host:{id:'host',name:'Host',choice:{shipIndex:0}},guest:{id:'guest',name:'Guest',choice:{shipIndex:2}}};const results=[];
 const game=new CoopGame({mission:0,room,seed:90421,onEvent:event=>{if(event.type==='coop-stage-over')results.push(event);}});game.start();game.state='ending';game.ending=.01;
 for(const pilot of game.crew){pilot.alive=false;pilot.player.lives=0;pilot.player.hitCrash={x:pilot.player.x,y:pilot.player.y,vx:0,vy:-12,age:0,duration:.2};}
 game.update(.05);assert.equal(game.state,'ending','co-op victory ending waits for the last crash');for(let i=0;i<5&&game.state!=='finished';i++)game.update(.05);
 assert.equal(results.at(-1)?.win,false,'co-op ending resolves as failure only after both crashes clear');
}
{
 const room={mode:'online',host:{id:'host',name:'Host',choice:{shipIndex:0}},guest:{id:'guest',name:'Guest',choice:{shipIndex:2}}};
 const hostGame=new CoopGame({mission:0,room,seed:9043});hostGame.start();const hostGuest=hostGame.crew.find(pilot=>pilot.role==='guest'),crash={x:210,y:590,vx:30,vy:-12,age:.2,duration:.92};hostGuest.player.hitCrash=crash;hostGuest.player.x=crash.x+crash.vx*crash.age;hostGuest.player.y=crash.y+crash.vy*crash.age+270*crash.age*crash.age;
 const snap={v:1,mission:0,state:'playing',pauseFlags:{host:false,guest:false},networkPaused:false,failureReason:'',transitionLeft:0,...hostGame.snapshot(),events:[]};
 const session=new CoopSession({account:{user:{id:'guest'}},autoSync:false,now:()=>1000});session.role='guest';session.state='playing';session.baseState='playing';session.room=room;session.mission=0;session.game=new CoopGame({mission:0,room,localRole:'guest',seed:9044});session.local=session.game.selectPilot('guest');session.target={x:420,y:190};
 assert.equal(session.applySnapshot(snap,1,{age:.12,source:'direct'}),true);assert.ok(Math.abs(session.local.player.hitCrash.age-.32)<1e-9,'snapshot latency advances the nested crash clock');
 assert.ok(session.local.player.x<session.target.x-80,'local target input does not overwrite the authoritative crash position');
 const x=session.local.player.x;session.predict(.05);assert.ok(Math.abs(session.local.player.hitCrash.age-.37)<1e-9,'guest prediction advances the nested crash clock');assert.ok(session.local.player.x<x+12,'guest prediction continues along the crash trajectory');
}
{
 const room={mode:'online',host:{id:'host',choice:{shipIndex:0}},guest:{id:'guest',choice:{shipIndex:2}}},hostGame=new CoopGame({mission:0,room,seed:90431});hostGame.start();
 const authoritative=hostGame.spawn(1,250,260);authoritative.alive=false;authoritative.hp=0;authoritative.crashing={x:250,y:260,vx:32,vy:48,age:.2,duration:.82,rotation:.25};authoritative.rotation=authoritative.crashing.rotation+authoritative.crashing.age*3.2;
 const snapshot={v:1,mission:0,state:'playing',pauseFlags:{host:false,guest:false},networkPaused:false,failureReason:'',transitionLeft:0,...hostGame.snapshot(),events:[]};
 const session=new CoopSession({account:{user:{id:'guest'}},autoSync:false,now:()=>1000});session.role='guest';session.state='playing';session.baseState='playing';session.room=room;session.mission=0;session.game=new CoopGame({mission:0,room,localRole:'guest',seed:90432});session.local=session.game.selectPilot('guest');
 assert.equal(session.applySnapshot(snapshot,1,{source:'direct'}),true);const predicted=session.game.enemies.find(enemy=>enemy.id===authoritative.id);assert.equal(predicted.crashing.age,.2);
 session.predict(.05);assert.ok(Math.abs(predicted.crashing.age-.25)<1e-9,'guest prediction advances an enemy crash animation between snapshots');assert.ok(Math.abs(predicted.rotation-(.25+.25*3.2))<1e-9,'guest prediction advances the crashed enemy rotation smoothly');
 assert.equal(predicted.alive,false);assert.equal(predicted.hp,0);assert.equal(authoritative.crashing.age,.2);assert.equal(authoritative.rotation,.25+.2*3.2,'visual prediction does not alter host crash, health, or alive state');
}
{
 const game=new Game({stage,seed:905});game.start();game.firingEnemy={type:9};game.laser(225,120,50,{warn:1.25});const laser=game.hazards[0];
 assert.ok(laser.warn>=1.6,'enemy lasers give at least 1.6 seconds of warning');renderer.ctx.clearRect(0,0,450,800);renderer.hazard(laser,1,true);assert.ok(renderer.ctx.getImageData(225,400,1,1).data[0]>0,'the laser danger lane is visibly highlighted before activation');const labels=[],fillText=renderer.ctx.fillText.bind(renderer.ctx);renderer.ctx.fillText=(text,x,y)=>{labels.push({text:String(text),x,y});return fillText(text,x,y);};renderer.hazard({...laser,x:10,y:770,age:0},1,true);renderer.ctx.fillText=fillText;assert.ok(labels[0].x>=90&&labels[0].x<=360&&labels[0].y>=180&&labels[0].y<=675,'edge laser warnings keep their countdown label inside the visible playfield');
 const fast=game.enemyFire;game.firingEnemy=null;const ordinary=game.spawn(1,100,180);game.enemyFire(ordinary);const fastRound=game.bullets.find(b=>b.simpleRound);game.enemyFire(ordinary);const slowRound=game.bullets.filter(b=>b.simpleRound)[2];
 assert.ok(fastRound?.fastRound&&slowRound&&!slowRound.fastRound,'enemy aircraft alternate fast and slow visible round shots');assert.ok(Math.hypot(fastRound.vx,fastRound.vy)>Math.hypot(slowRound.vx,slowRound.vy));
}
{
 const game=new Game({stage,difficulty:'hard',seed:9051});game.start();for(let i=0;i<4;i++)game.spawnWave();
 const styles=new Set(game.enemies.map(enemy=>enemy.movementStyle));assert.ok(styles.has('formation')&&styles.has('irregular')&&styles.has('kamikaze'),'enemy waves cycle through formations, erratic flight and kamikaze attacks');
 const formation=game.enemies.filter(enemy=>enemy.formationId===4);assert.ok(formation.length>=3,'a full wave enters in formation');game.updateEnemies(.05);const offsets=formation.map(enemy=>enemy.x-enemy.formationCenter-enemy.formationOffset);assert.ok(offsets.every(offset=>Math.abs(offset-offsets[0])<.1),'formation flight preserves spacing while the group moves');
 const varied=new Game({stage,seed:610}),speeds=Array.from({length:12},()=>varied.spawn(1,100,10).speedMultiplier);assert.ok(Math.min(...speeds)<.95&&Math.max(...speeds)>1.4,'individual aircraft receive clearly different movement speeds');
 const dive=game.spawn(1,225,126,{movementStyle:'kamikaze',speedMultiplier:1});dive.age=.9;game.player.x=225;game.player.y=510;game.player.targetX=225;game.player.targetY=510;game.updateEnemies(.05);assert.equal(dive.diveState,'warning');assert.ok(dive.diveWarning>.8&&dive.diveTargetY===510,'the diving enemy warns and marks the target before charging');renderer.enemy(dive,game,1);assert.ok(dive.diveWarning>0,'the red impact lane and countdown remain visible during the warning');
 for(let i=0;i<19;i++)game.updateEnemies(.05);assert.ok(dive.diveState==='diving'||dive.diveState==='coasting','the warned kamikaze executes a fast dive toward the marked target');
 dive.x=game.player.x;dive.y=game.player.y;dive.diveState='diving';dive.diveTargetX=dive.x;dive.diveTargetY=dive.y;game.player.invulnerable=0;const lives=game.player.lives;game.updateEnemies(.01);assert.equal(dive.alive,false,'a kamikaze aircraft is consumed on impact');assert.equal(game.player.lives,lives-1,'the dive can damage the player if it connects');
 const room={mode:'online',host:{id:'host',choice:{shipIndex:0}},guest:{id:'guest',choice:{shipIndex:2}}},coop=new CoopGame({mission:0,room,seed:9052});coop.start();const guest=coop.crew.find(pilot=>pilot.role==='guest'),impact=coop.spawn(1,guest.player.x,guest.player.y,{movementStyle:'kamikaze',diveState:'diving',diveTargetX:guest.player.x,diveTargetY:guest.player.y});guest.player.invulnerable=0;const guestLives=guest.player.lives;coop.updateEnemies(.01);assert.equal(impact.alive,false,'a kamikaze also crashes after hitting a co-op teammate');assert.equal(guest.player.lives,guestLives-1,'co-op teammates can be hit by the dive');
}
{
 const game=new Game({stage,seed:9053});game.start();const dive=game.spawn(1,100,220,{movementStyle:'kamikaze',diveState:'diving',diveTargetX:170,diveTargetY:400}),start={x:dive.x,y:dive.y};
 game.updateEnemies(.01);const movementAngle=Math.atan2(dive.y-start.y,dive.x-start.x),sprite=renderer.sprite;let drawnRotation;
 renderer.sprite=(...args)=>{drawnRotation=args[5];return true;};try{renderer.enemy(dive,game,0);}finally{renderer.sprite=sprite;}
 const drawnAngle=-Math.PI/2+drawnRotation;assert.ok(Math.abs(Math.atan2(Math.sin(drawnAngle-movementAngle),Math.cos(drawnAngle-movementAngle)))<1e-9,'the rendered kamikaze nose follows its actual downward dive vector');
}
{
 const game=new Game({stage,seed:9054});game.start();game.player.x=225;game.player.y=510;const dive=game.spawn(1,150,260,{movementStyle:'kamikaze',diveState:'coasting',diveAngle:Math.PI/2,diveCoast:.01});
 game.updateEnemies(.01);assert.equal(dive.diveState,'approach','a completed dive returns to normal approach flight');assert.ok(dive.diveCooldown>0,'a short recovery gap separates dive attempts');
 for(let i=0;i<30&&dive.diveState!=='warning';i++)game.updateEnemies(.05);assert.equal(dive.diveState,'warning','the kamikaze reacquires the player and warns before its next dive');assert.ok(dive.diveWarning>0);
 const escaping=game.spawn(1,539.5,300,{movementStyle:'kamikaze',diveState:'coasting',diveAngle:0,diveCoast:.2});game.updateEnemies(.05);assert.equal(escaping.alive,false,'a kamikaze that leaves the playfield during coasting is removed');assert.ok(!game.enemies.includes(escaping),'the escaped enemy does not remain as a permanent world object');
 const escapingTop=game.spawn(1,150,-94,{movementStyle:'kamikaze',diveState:'diving',diveTargetX:150,diveTargetY:-115});game.updateEnemies(.05);assert.equal(escapingTop.alive,false,'an active dive that crosses the upper boundary is removed');
}
{
 const combatStage=stageConfig(1,2,'campaign','quick'),single=new Game({stage:combatStage,seed:9055});single.start();single.spawnBoss();const p=single.player,impact=single.spawn(8,p.x,p.y,{movementStyle:'kamikaze',diveState:'diving',diveTargetX:p.x,diveTargetY:p.y}),shield=single.spawn(17,p.x+35,p.y),bossHp=single.boss.hp;
 p.invulnerable=0;const lives=p.lives;single.updateEnemies(.01);assert.equal(impact.shielded,true,'the shield drone protects a kamikaze at contact range');assert.equal(impact.alive,false,'a shielded kamikaze is still destroyed by its own impact');assert.equal(impact.hp,0);assert.equal(p.lives,lives-1);assert.equal(shield.alive,true,'self-destruction does not kill the nearby shield drone');assert.equal(single.boss.hp,bossHp,'self-destruction does not damage the boss');
 const room={mode:'online',host:{id:'host',choice:{shipIndex:0}},guest:{id:'guest',choice:{shipIndex:2}}},coop=new CoopGame({mission:5,room,seed:9056});coop.start();coop.spawnBoss();const guest=coop.crew.find(pilot=>pilot.role==='guest'),coopImpact=coop.spawn(8,guest.player.x,guest.player.y,{movementStyle:'kamikaze',diveState:'diving',diveTargetX:guest.player.x,diveTargetY:guest.player.y}),coopShield=coop.spawn(17,guest.player.x+35,guest.player.y),coopBossHp=coop.boss.hp;
 guest.player.invulnerable=0;const guestLives=guest.player.lives;coop.updateEnemies(.01);assert.equal(coopImpact.shielded,true);assert.equal(coopImpact.alive,false,'co-op self-destruction ignores shield damage reduction');assert.equal(coopImpact.hp,0);assert.equal(guest.player.lives,guestLives-1);assert.equal(coopShield.alive,true);assert.equal(coop.boss.hp,coopBossHp,'co-op self-destruction cannot damage the boss');
}
{
 const game=new Game({stage,seed:906});game.start();assert.equal(game.player.maxBombs,5);
 for(let i=0;i<8;i++)game.collect({kind:'bomb',tier:'s'});assert.equal(game.player.bombs,5,'bomb pickups never exceed five');
 for(let i=0;i<12;i++){const enemy=game.spawn(1,50+i*25,260);game.killEnemy(enemy);}
 assert.equal(game.pickups.length,1,'twelve routine scout kills produce only one resource pickup');
}
{
 const game=new Game({stage:stageConfig(1,0,'campaign','quick'),seed:907});game.start();const enemy=game.spawn(4,180,200);game.killEnemy(enemy);assert.ok(enemy.crashing,'some destroyed enemy aircraft enter a crash animation');renderer.enemyCrash(enemy);game.updateEnemies(.7);assert.equal(enemy.crashing,null,'enemy crash animation resolves into its final explosion');
}
{
 const sprites=new Map(await Promise.all(Object.values(WINGMEN).map(async wingman=>[wingman.sprite,await loadImage(new URL('../dist/'+wingman.sprite,import.meta.url).pathname)])));
 renderer.assets.get=src=>sprites.get(src)||null;
 const game=new Game({stage,seed:908});game.start();assert.equal(game.callWingmen(),true);
 for(const unit of game.wingmen){unit.mode='active';unit.x=55+(unit.index%5)*85;unit.y=230+Math.floor(unit.index/5)*92;}
 renderer.ctx.clearRect(0,0,450,800);renderer.wingmen(game,1);renderer.wingmanCallup(game,1);
 let coloredPixels=0;for(let y=200;y<355;y+=5)for(let x=45;x<420;x+=5){const pixel=renderer.ctx.getImageData(x,y,1,1).data;if(pixel[0]+pixel[1]+pixel[2]>40)coloredPixels++;}
 assert.ok(coloredPixels>20,'transparent squadron SVGs and arrival shield render to native Canvas');
}
console.log(JSON.stringify({passed:true,checks:['bomb-only Japanese brush-title and hero-name callouts reveal glyph-by-glyph','Dawn plasma beam and accelerated rounds','Bastion full-damage shield, orbiting satellites and focused blasts','Wraith stealth immunity and chained slash','formation and erratic kamikaze cycles, shield-safe impacts and aligned dive art in single and co-op play','five-second solo and co-op respawn protection and player/enemy crash sequences','laser warning and mixed fast/slow bullets','five-bomb cap, sparse drops and native-alpha wingmen rendering']}));
