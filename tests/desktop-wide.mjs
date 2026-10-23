import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {battlefieldForViewport,fitBattlefield} from '../dist/battlefield-layout.js?v=31';
import {Game} from '../dist/engine.js?v=31';
import {CoopGame,CoopSession} from '../dist/coop.js?v=31';
import {packCoopSnapshot,unpackCoopSnapshot} from '../dist/coop-wire.js?v=31';
import {createLocalDuoGame,moveLocalDuoPilots} from '../dist/local-duo.js?v=31';
import {Renderer} from '../dist/renderer.js?v=31';
import {stageConfig,SHIPS} from '../dist/data.js?v=31';
import {REFERENCE_LOADOUTS} from '../dist/economy.js?v=31';

for(const [pw,ph] of [[1366,768],[1920,1080],[2560,1440],[1920,1200],[3440,1440]]){
 const world=battlefieldForViewport(pw,ph),fit=fitBattlefield(pw,ph,world.width,world.height);
 assert.equal(world.desktop,true);assert.ok(world.width>=1280);
 assert.ok(Math.abs(world.width/world.height-pw/ph)<.001);
 assert.ok(Math.abs(fit.x)<1&&Math.abs(fit.y)<1,'desktop uses the complete viewport');
}
assert.deepEqual(battlefieldForViewport(390,844),{width:450,height:800,desktop:false});

const width=1422,height=800,stage=stageConfig(0,0,'campaign','quick');
const game=new Game({stage,width,height,seed:31});game.start();
game.moveTo(width-20,650);for(let i=0;i<210;i++)game.updatePlayer(1/60);
assert.ok(game.player.x>width*.9,'the right third is playable space, not decoration');
game.moveTo(20,650);for(let i=0;i<270;i++)game.updatePlayer(1/60);
assert.ok(game.player.x<width*.1,'the aircraft can cross the full landscape arena');
game.bullets=[];game.player.x=game.player.targetX=width*.82;game.player.invulnerable=0;
game.shoot(game.player.x,game.player.y-32,Math.PI/2,2000,1,'enemy');game.updateBullets(.033);
assert.equal(game.player.lives,2,'collision works outside the former portrait boundary');
game.enemies=[];const centers=[];
for(let i=0;i<70;i++){game.enemies=[];game.spawnWave();centers.push(...game.enemies.map(e=>e.x));}
assert.ok(Math.min(...centers)<width*.2&&Math.max(...centers)>width*.8,'formations use both outer sides');
game.bullets=[];game.wall(10,150,3);
assert.ok(Math.max(...game.bullets.map(b=>b.x))>width*.9,'Boss walls cover the horizontal arena');
game.enemies=[];game.player.hitCrash=null;game.player.x=game.player.targetX=width*.8;game.player.lives=2;
game.spawnBoss();game.boss.y=185;game.boss.parts[0].hp=123;
game.callWingmen();const budgets=game.player.wingmanCharges,bossHp=game.boss.hp;
game.resizeWorld(1280,800);
assert.ok(Math.abs(game.player.x/1280-.8)<.001);assert.equal(game.player.lives,2);
assert.equal(game.player.wingmanCharges,budgets);assert.equal(game.boss.hp,bossHp);assert.equal(game.boss.parts[0].hp,123);
assert.ok(game.wingmen.every(w=>Number.isFinite(w.x)));

const duo=createLocalDuoGame({mission:0,hostShip:0,guestShip:2,width,height});duo.start();
for(let i=0;i<240;i++){moveLocalDuoPilots(duo,new Set(['KeyA','ArrowRight']),1/60);duo.updatePlayer(1/60);}
assert.ok(duo.crew[0].player.x<50&&duo.crew[1].player.x>width-50,'both pilots can independently reach opposite edges');
duo.resizeWorld(1600,800);assert.ok(duo.crew[1].player.x>1500);
const snapshot=unpackCoopSnapshot(packCoopSnapshot(duo.snapshot()));
const guest=new CoopGame({mission:0,room:{},localRole:'guest'});guest.restore(snapshot);
assert.equal(guest.width,1600);assert.equal(guest.height,800);
assert.equal(guest.crew[1].player.x,duo.crew[1].player.x);
const session=new CoopSession({account:{user:{id:'guest'}},autoSync:false});session.game=guest;session.local=guest.selectPilot('guest');session.role='guest';session.state='playing';session.baseState='playing';session.queueInput=()=>{};
session.moveTo(1550,650);assert.equal(guest.player.targetX,1550,'network input is not clamped at x=430');
guest.shoot(1500,350,Math.PI/2,150,10,'enemy');session.predict(.01);
assert.ok(guest.bullets.some(b=>b.x===1500),'guest prediction retains right-side bullets');

const require=createRequire(import.meta.url),{createCanvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:false})};globalThis.ResizeObserver=class{observe(){}};
const canvas=createCanvas(1920,1080);canvas.getBoundingClientRect=()=>({left:0,top:0,width:1920,height:1080});
const renderer=new Renderer(canvas,{manifest:{},get:()=>null},{shake:false});renderer.background=()=>{};
renderer.players=()=>{};renderer.pilotMarkers=()=>{};renderer.draw(new Game({stage,width,height}),0);
assert.equal(renderer.sx,renderer.sy,'aircraft, hitboxes and projectiles are never stretched');
const point=renderer.point(960,540);assert.ok(Math.abs(point.x-width/2)<.001&&Math.abs(point.y-height/2)<.001);

const runs=[];
for(let chapter=0;chapter<9;chapter++){
 const ship=chapter%3,loadout=REFERENCE_LOADOUTS[chapter],wide=new Game({stage:stageConfig(chapter,2,'campaign','quick'),width,height,ship,seed:3100+chapter,profile:{levels:{[SHIPS[ship].id]:loadout.level},weapons:{[SHIPS[ship].id]:loadout.tier}}});wide.start();
 for(let i=0;i<16000&&wide.state!=='finished';i++){
  wide.player.invulnerable=10;const part=wide.boss?.parts.find(p=>!p.dead),target=wide.boss&&!wide.boss.dead?{x:wide.boss.x+(part?.x||0)*wide.boss.w}:wide.enemies.find(e=>e.alive&&e.y>50);
  wide.moveTo(target?.x??width/2,620);wide.skill();if(wide.player.energy>=1000)wide.ultimate();if(wide.boss?.age>12&&wide.player.bombs>0)wide.bomb();wide.update(1/30);
  assert.ok(Number.isFinite(wide.player.x)&&wide.player.x>=20&&wide.player.x<=width-20);
 }
 assert.equal(wide.bossDefeated,true,'landscape chapter '+(chapter+1)+' remains completable');runs.push({chapter:chapter+1,seconds:Math.round(wide.time)});
}
console.log(JSON.stringify({passed:true,viewports:5,world:{width,height},bossRuns:runs}));
