import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {Game} from '../dist/engine.js?v=30.1';
import {CoopGame,CoopSession} from '../dist/coop.js?v=30.1';
import {Renderer} from '../dist/renderer.js?v=30.1';
import {SHIPS,stageConfig} from '../dist/data.js?v=30.1';
import {createProfile,normalizeProfile,exportProfile,parseBackup} from '../dist/profile.js?v=30.1';
import {createLocalDuoGame,rememberDuoCharge,localDuoCharges,localDuoResult} from '../dist/local-duo.js?v=30.1';
import {flightKeyBinding} from '../dist/flight-input.js?v=30.1';
import {duoSetupHtml,duoStatusHtml,flightControlsHtml} from '../dist/flight-ui.js?v=30.1';
import {missionWavePlan,missionBrief,missionHint} from '../dist/mission-flow.js?v=30.1';
import {setLocale,getLocale,tr} from '../dist/i18n.js?v=30.1';
import {segmentPointDistance} from '../dist/combat-geometry.js?v=30.1';
import {REFERENCE_LOADOUTS} from '../dist/economy.js?v=30.1';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const manifestFile=path.join(root,'assets/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile));
assert.ok(fs.statSync(manifestFile).size<250000,'the entry manifest stays below 250 KB');
const references=new Set();let cropCount=0;
function audit(value){
 if(!value||typeof value!=='object')return;
 for(const [key,item]of Object.entries(value)){
  if(typeof item==='string'&&item.startsWith('data:image/'))assert.fail('The entry manifest must not carry base64 image data');
  if(['src','fallback'].includes(key)&&typeof item==='string'&&!/^(https?:|data:)/.test(item))references.add(item.split('?')[0]);
  if(item&&typeof item==='object')audit(item);
 }
 if(Number.isFinite(value.atlasWidth)&&Number.isFinite(value.x)&&Number.isFinite(value.width)){
  assert.ok(value.x>=0&&value.y>=0&&value.width>0&&value.height>0,'atlas cells have positive dimensions');
  assert.ok(value.x+value.width<=value.atlasWidth+.01,'atlas cell stays within its sheet width');
  if(Number.isFinite(value.atlasHeight))assert.ok(value.y+value.height<=value.atlasHeight+.01,'atlas cell stays within its sheet height');
  cropCount++;
 }
}
audit(manifest);
for(const src of references)assert.ok(fs.existsSync(path.join(root,src)),'Missing image: '+src);
for(const filename of fs.readdirSync(root).filter(name=>name.endsWith('.js'))){
 const source=fs.readFileSync(path.join(root,filename),'utf8');
 for(const match of source.matchAll(/\bfrom\s*['"](\.[^'"]+\.js(?:\?[^'"]*)?)['"]/g)){
  assert.match(match[1],/\?v=30\.1$/,'One shared module version prevents duplicated locale/game state: '+filename);
  assert.ok(fs.existsSync(path.resolve(root,match[1].split('?')[0])),'Missing module '+match[1]);
 }
}
setLocale('en');assert.equal(getLocale(),'en');assert.equal(tr('同屏双打'),'Local co-op');
assert.equal(tr('第一次出击？查看飞行指南'),'First flight? Open the pilot guide');
assert.equal(tr('游戏模式'),'Game modes');
const english=new Game({stage:stageConfig(0,0,'campaign','quick')});assert.equal(english.ship.name,'Dawn-7','the engine sees the same localized data instance as the app');
assert.ok(!/[\u4e00-\u9fff]/.test(duoSetupHtml({ships:SHIPS,hostShip:0,guestShip:2,enabled:true,locale:'en'})),'local co-op setup is fully translated');
setLocale('zh');
assert.equal(flightControlsHtml(false,'zh').split('电脑操作').length-1,1,'the solo controls have one heading');

assert.equal(flightKeyBinding({code:'KeyP',repeat:true}),null,'holding pause must not toggle resume repeatedly');
assert.equal(flightKeyBinding({code:'KeyQ',editable:true}),null,'typing in a form cannot activate skills');
assert.equal(flightKeyBinding({code:'Space',buttonActivation:true}),null,'activating a focused button must not also use an ultimate');
assert.equal(flightKeyBinding({code:'Numpad2',duo:true}).role,'guest');
assert.equal(flightKeyBinding({code:'AltRight',duo:true}).type,'wingmen');
assert.equal(flightKeyBinding({code:'KeyQ'}).role,'host');
assert.equal(segmentPointDistance(0,0,0,20,0,10),0);
assert.equal(segmentPointDistance(0,0,0,0,3,4),5);
{
 const game=new Game({stage:stageConfig(0,2,'campaign','quick'),ship:1});game.start();game.firePlayer();
 const spread=game.bullets.filter(bullet=>bullet.kind==='heavy').map(bullet=>Math.abs(Math.atan2(bullet.vy,bullet.vx)+Math.PI/2));game.bullets=[];game.bulletCounts.player=0;game.spawnBoss();game.boss.y=180;game.firePlayer();
 const focused=game.bullets.filter(bullet=>bullet.kind==='heavy');assert.equal(focused.length,5,'Bastion keeps five primary shells');
 assert.ok(Math.max(...focused.map(bullet=>Math.abs(Math.atan2(bullet.vy,bullet.vx)+Math.PI/2)))<Math.max(...spread)*.5,'Bastion focuses its spread against a Boss instead of losing most of its damage offscreen');
}

const profile=createProfile();profile.levels={Dawn7:10,Bastion3:10,WraithX:10};profile.talents={assault_core:2,mobility_core:2};
const expected=normalizeProfile(profile);
const events=[],duo=createLocalDuoGame({mission:0,hostShip:0,guestShip:2,profile,onEvent:event=>{events.push(event);rememberDuoCharge(profile,event);}});
duo.start();const host=duo.crew[0],guest=duo.crew[1];
assert.equal(host.dps,new Game({stage:duo.stage,ship:0,profile:expected}).dps,'local co-op inherits real hangar firepower');
assert.equal(guest.player.speed,new Game({stage:duo.stage,ship:2,profile:expected}).player.speed,'both pilots inherit movement talents');
assert.equal(duo.use('guest','wingmen'),true);assert.equal(duo.use('host','wingmen'),true);
const saved=parseBackup(exportProfile(profile));assert.deepEqual(localDuoCharges(saved,0),{host:2,guest:2});
const retry=createLocalDuoGame({mission:1,hostShip:0,guestShip:2,profile:saved});assert.equal(retry.crew[0].player.wingmanCharges,2);assert.equal(retry.crew[1].player.wingmanCharges,2,'retrying or advancing within a chapter does not refill wingmen');
assert.deepEqual(localDuoCharges(saved,1),{host:3,guest:3},'the next chapter has a separate three-call budget');
assert.match(duoStatusHtml(duo,'en'),/P2/);assert.ok(!/[\u4e00-\u9fff]/.test(duoStatusHtml(duo,'en').replaceAll(guest.ship.name,'').replaceAll(host.ship.name,'')));
duo.bossDefeated=true;duo.drop('coin',225,120,{amount:42});duo.drop('data',225,120,{amount:1});duo.finish(true);duo.finish(true);
assert.equal(events.filter(event=>event.type==='coop-stage-over').length,1,'one settlement per local round');assert.ok(duo.coins>=42);assert.ok(duo.materials.data>0,'boss drops are collected before settlement');
assert.equal(localDuoResult(duo,true).level,host.level);
{
 const room={host:{id:'host',choice:{shipIndex:0}},guest:{id:'guest',choice:{shipIndex:2}}};
 const authoritative=new CoopGame({mission:0,room});authoritative.start();authoritative.use('host','wingmen');authoritative.use('host','bomb');authoritative.use('guest','bomb');
 const session=new CoopSession({account:{user:{id:'guest'}},autoSync:false,now:()=>1000});session.role='guest';session.baseState='playing';session.state='playing';session.mission=0;session.room=room;session.game=new CoopGame({mission:0,room,localRole:'guest'});session.local=session.game.selectPilot('guest');
 session.applySnapshot({v:1,mission:0,state:'playing',pauseFlags:{host:false,guest:false},...authoritative.snapshot(),events:[]},1,{source:'direct'});
 const remote=session.game.crew[0].player,local=session.game.crew[1].player,charges=remote.wingmanCharges;
 session.predict(.05);
 assert.equal(remote.heroBomb.age,.05,'the remote hero animation advances between network frames');assert.equal(local.heroBomb.age,.05,'the local hero is advanced exactly once');assert.equal(remote.wingmanCall.age,.05);assert.equal(session.game.wingmen[0].age,.05,'guest wingmen no longer freeze between host frames');assert.equal(remote.wingmanCharges,charges,'prediction never invents resource costs or damage');
}

for(const multiplayer of [false,true]){
 const game=multiplayer?new CoopGame({mission:0,room:{host:{choice:{shipIndex:0}},guest:{choice:{shipIndex:2}}}}):new Game({stage:stageConfig(0,0,'campaign','quick')});
 game.start();const player=multiplayer?game.crew[1].player:game.player;player.invulnerable=0;
 game.shoot(player.x,player.y-32,Math.PI/2,2000,1,'enemy');game.updateBullets(.033);
 assert.equal(player.lives,2,'fast enemy bullets crossing the hitbox cannot tunnel in '+(multiplayer?'co-op':'solo'));
 if(multiplayer)assert.equal(game.crew[0].player.lives,3);
}

const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:false})};globalThis.ResizeObserver=class{observe(){}};
for(const id of ['Dawn7','Bastion3','WraithX'])for(const meta of manifest.players[id]){
 const image=await loadImage(path.join(root,meta.src));const c=createCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);
 const pixels=ctx.getImageData(0,0,image.width,image.height).data;
 assert.equal(pixels[3],0,'aircraft crop corners remain transparent');assert.ok(pixels.some((value,index)=>index%4===3&&value>0),'aircraft is not an empty cutout');
}
{
 const canvas=createCanvas(450,800);canvas.getBoundingClientRect=()=>({width:450,height:800});
 const renderer=new Renderer(canvas,{manifest,get:()=>null},{detail:false,numbers:false,shake:false,flash:true}),game=new Game({stage:stageConfig(0,0,'campaign','quick')});
 game.start();const order=[];renderer.background=()=>{};renderer.players=()=>{};renderer.bullet=bullet=>order.push(bullet.owner);renderer.weaponEffect=()=>order.push('fx');renderer.pilotMarkers=()=>order.push('markers');
 game.shoot(200,200,1,100,1,'enemy');game.shoot(200,500,1,100,1,'player');game.weaponEffects=[{art:'x'}];renderer.draw(game,0);
 assert.ok(order.indexOf('enemy')>order.indexOf('fx'),'hostile bullets are rendered above friendly effects');assert.equal(order.at(-1),'markers');
}

const signatures=new Set(),runs=[];
for(let chapter=0;chapter<9;chapter++)for(let substage=0;substage<3;substage++){
 const stage=stageConfig(chapter,substage,'campaign','quick');
 signatures.add(JSON.stringify(Array.from({length:8},(_,index)=>missionWavePlan(stage,index+1))));
 assert.ok(missionBrief(stage,'en'));assert.ok(missionHint({stage,time:10},{locale:'en'})||chapter>0||substage>0);
 for(const difficulty of ['easy','normal','hard']){
  const loadout=REFERENCE_LOADOUTS[chapter],ship=(chapter+substage)%3;
  const campaignProfile={levels:{[SHIPS[ship].id]:loadout.level},weapons:{[SHIPS[ship].id]:loadout.tier}};
  const game=new Game({stage,ship,profile:campaignProfile,difficulty,seed:3000+chapter*30+substage});game.start();
  let peakBullets=0,bossStarted=0,phase=0;
  for(let frame=0;frame<12000&&game.state!=='finished';frame++){
   game.player.invulnerable=10;
   const part=game.boss?.parts.find(item=>!item.dead);
   const target=game.boss&&!game.boss.dead?{x:game.boss.x+(part?.x||0)*game.boss.w}:game.enemies.find(enemy=>enemy.alive&&enemy.y>50);
   game.moveTo(target?.x??225,620);game.skill();
   if(game.boss&&!bossStarted)bossStarted=game.time;
   if(game.boss?.age>12&&game.player.bombs>0)game.bomb();
   if(game.player.energy>=1000)game.ultimate();
   game.update(1/30);peakBullets=Math.max(peakBullets,game.bullets.length);phase=Math.max(phase,game.boss?.phase||0);
   assert.ok(Number.isFinite(game.player.x)&&Number.isFinite(game.player.y)&&Number.isFinite(game.score));
   assert.ok(game.enemies.every(enemy=>stage.enemies.includes(enemy.type)),'no foreign enemy type in '+stage.id);
  }
  assert.equal(game.state,'finished','mission completes with reference hangar upgrades and controlled invulnerable weakpoint aim: '+stage.id+'/'+difficulty);
  assert.ok(game.player.lives>0);assert.ok(peakBullets<1280,'combat stays below snapshot projectile capacity');
  runs.push({id:stage.id,difficulty,ship:game.ship.id,seconds:Math.round(game.time),bossSeconds:bossStarted?Math.round(game.time-bossStarted):null,phase,peakBullets});
 }
}
assert.equal(signatures.size,27,'all 27 routes have a distinct formation/timing signature');
const output=process.env.AERO_QA_OUTPUT;if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'build30-matrix.json'),JSON.stringify(runs,null,2));}
console.log(JSON.stringify({passed:true,missions:runs.length,manifestBytes:fs.statSync(manifestFile).size,imageReferences:references.size,atlasCells:cropCount,routeSignatures:signatures.size,maxBullets:Math.max(...runs.map(run=>run.peakBullets)),bossSeconds:runs.filter(run=>run.bossSeconds).map(run=>({id:run.id,difficulty:run.difficulty,seconds:run.bossSeconds,phase:run.phase}))}));
