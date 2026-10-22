import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../dist/engine.js?v=28';
import {CoopGame} from '../dist/coop.js?v=28';
import {stageConfig} from '../dist/data.js?v=28';
import {createProfile,normalizeProfile} from '../dist/profile.js?v=28';
import {WINGMEN,WINGMAN_COUNT,WINGMAN_PRELAUNCH,WINGMAN_SORTIE,WINGMAN_EXIT} from '../dist/wingmen.js?v=28';
import {packCoopSnapshot,unpackCoopSnapshot} from '../dist/coop-wire.js?v=28';

const stage=stageConfig(0,0,'campaign','quick');
{
 const profile=createProfile();assert.equal(profile.wingmenCharges,3,'a new save starts each chapter with three allied sorties');
 profile.wingmenChapter=0;profile.wingmenCharges=2;profile.wingmenChargesByChapter[0]=2;
 assert.equal(new Game({stage,profile}).player.wingmanCharges,2,'charges persist between missions of the same chapter');
 assert.equal(new Game({stage:stageConfig(1,0,'campaign','quick'),profile}).player.wingmanCharges,3,'a new chapter receives a fresh set of charges');
 assert.equal(new Game({stage,profile}).player.wingmanCharges,2,'trying another chapter does not reset a saved chapter count');
 const legacy=normalizeProfile({...profile,wingmenChapter:0,wingmenCharges:1,wingmenChargesByChapter:undefined});
 assert.equal(legacy.wingmenChargesByChapter[0],1,'legacy saves migrate their current chapter count');assert.equal(legacy.wingmenChargesByChapter[1],3,'legacy saves initialize unopened chapter counts');
 const normalized=normalizeProfile({...profile,wingmenChapter:99,wingmenCharges:8});
 assert.equal(normalized.wingmenChapter,8,'saved chapter values are bounded');assert.equal(normalized.wingmenCharges,3,'saved support charges are bounded');
}

{
 const game=new Game({stage,ship:0,seed:421});game.start();game.player.invulnerable=0;
 assert.equal(game.callWingmen(),true,'the support command launches during a mission');
 assert.equal(game.player.wingmanCharges,2);assert.equal(game.player.invulnerable,5,'the call grants five seconds of protection');
 assert.equal(game.wingmen.length,WINGMAN_COUNT,'each call deploys ten matching aircraft');
 assert.equal(game.callWingmen(),false,'the squadron cannot be called again while on mission');
 game.updatePlayer(4.99);assert.ok(game.player.invulnerable<=.02,'the protection lasts five simulated seconds');
 for(let i=0;i<90;i++)game.updateWingmen(.05);
 assert.ok(game.wingmen.every(unit=>unit.mode==='assembling'),'the squadron gathers throughout the five-second prelaunch');
 assert.equal(game.bullets.filter(b=>b.wingman).length,0,'the squadron waits until takeoff before firing');
 for(let i=0;i<20;i++)game.updateWingmen(.05);
 assert.ok(game.wingmen.some(unit=>['entering','active'].includes(unit.mode)),'the squadron launches after the five-second muster');
 assert.ok(game.bullets.some(b=>b.wingman),'wingmen begin firing as the sortie starts');
 for(let i=0;i<289;i++)game.updateWingmen(.05);
 assert.ok(game.wingmen.some(unit=>unit.mode==='active'),'wingmen keep attacking through the full fifteen-second sortie');
 for(let i=0;i<11;i++)game.updateWingmen(.05);
 assert.ok(game.wingmen.every(unit=>unit.mode==='exiting'),'the squadron leaves after fifteen seconds in the field');
 for(let i=0;i<25;i++)game.updateWingmen(.05);
 assert.equal(game.player.wingmanCall,null,'the sortie cooldown ends after the squadron exits');assert.equal(game.wingmen.length,0);
 game.player.wingmanCharges=1;game.player.lives=2;game.collect({kind:'repair',tier:'s'});
 assert.equal(game.player.wingmanCharges,1,'repair pickups do not restore chapter support charges');
}

{
 const game=new Game({stage,seed:422});game.start();const enemy=game.spawn(1,225,150),hp=enemy.hp;
 const pilot=game.player;pilot.consecutive=0;
 const shot=game.shoot(225,195,-Math.PI/2,600,20,'player',{wingman:true,wingmanShip:'Dawn7',color:WINGMEN.Dawn7.color,simpleRound:true});
 game.updateBullets(.05);
 assert.ok(enemy.hp<hp,'friendly wingman fire damages enemies');assert.equal(pilot.consecutive,0,'wingman fire does not alter the player combo counter');assert.equal(shot.wingman,true);
}

{
 const game=new Game({stage,seed:423});game.start();assert.equal(game.callWingmen(),true);
 const [unit]=game.wingmen;unit.mode='active';unit.x=225;unit.y=240;
 for(const other of game.wingmen.slice(1))other.mode='gone';
 game.shoot(unit.x,unit.y,0,0,10,'enemy',{r:5});game.updateBullets(0);
 assert.equal(unit.hp,1,'an enemy projectile damages a wingman');
 game.shoot(unit.x,unit.y,0,0,10,'enemy',{r:5});game.updateBullets(0);
 assert.equal(unit.mode,'crash','a second hit starts the crash animation');
 const crashY=unit.y;game.updateWingmen(.2);assert.ok(unit.y>crashY,'the damaged aircraft falls while spinning');
 game.updateWingmen(1);assert.equal(unit.mode,'gone','the crash animation ends in a small explosion');
 assert.ok(game.effects.some(effect=>effect.name==='Wingman_Crash_Burst'));
}

{
 const expected=new Set();
 for(const [index,ship]of ['Dawn7','Bastion3','WraithX'].entries()){
  const game=new Game({stage,ship:index,seed:430+index});game.start();const target=game.spawn(1,225,150),unit={ship,x:225,y:240,index:0},config=WINGMEN[ship];expected.add(config.skill);
  game.fireWingman(unit,target,config,false);
  const normal=game.bullets.at(-1);assert.equal(normal.wingman,true);assert.equal(normal.wingmanShip,ship);
  assert.equal(!!normal.homing,ship==='WraithX','each hero has a distinct primary wingman weapon');
  game.fireWingman(unit,target,config,true);
  if(ship==='Dawn7')assert.equal(game.bullets.filter(b=>b.wingman).length,4,'Dawn7 calls a three-lance special');
  if(ship==='Bastion3')assert.ok(game.effects.some(effect=>effect.name==='Wingman_Bastion_Pulse'),'Bastion3 calls an area pulse');
  if(ship==='WraithX')assert.ok(game.bullets.at(-1).homing,'WraithX calls a homing phase glaive');
 }
 assert.equal(expected.size,3,'all three hero squadrons use distinct support skills');
}

{
 const room={mode:'online',host:{id:'host',choice:{shipIndex:0}},guest:{id:'guest',choice:{shipIndex:2}}};
 const coop=new CoopGame({mission:0,room,seed:450});coop.start();assert.equal(coop.use('host','wingmen'),true);
 assert.equal(coop.crew.find(p=>p.role==='host').player.wingmanCharges,2);
 assert.equal(coop.wingmen.length,WINGMAN_COUNT);assert.ok(coop.wingmen.every(unit=>unit.role==='host'));
 const packed=packCoopSnapshot(coop.snapshot()),decoded=unpackCoopSnapshot(packed),restored=new CoopGame({mission:0,room,seed:451});restored.restore(decoded);
 assert.equal(restored.wingmen.length,WINGMAN_COUNT,'snapshots preserve deployed wingmen');assert.equal(restored.wingmen[0].ship,'Dawn7','snapshots preserve squadron identity');
 const nextMission=new CoopGame({mission:1,room,crew:coop.crew,seed:452});assert.equal(nextMission.crew.find(p=>p.role==='host').player.wingmanCharges,2,'co-op charges carry between missions of the chapter');
 const nextChapter=new CoopGame({mission:3,room,crew:coop.crew,seed:453});assert.equal(nextChapter.crew.find(p=>p.role==='host').player.wingmanCharges,3,'co-op charges replenish when the next chapter starts');
}

for(const ship of Object.keys(WINGMEN)){
 const svg=fs.readFileSync(new URL(`../dist/${WINGMEN[ship].sprite}`,import.meta.url),'utf8');
 assert.match(svg,/<svg[^>]+viewBox=/);assert.match(svg,/fill="none"/);assert.doesNotMatch(svg,/background-color\s*:/i,`${ship} has a transparent background`);
}
assert.equal(WINGMAN_PRELAUNCH,5);assert.equal(WINGMAN_SORTIE,15);assert.ok(WINGMAN_EXIT>0);
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert.match(html,/id="life-ship-icon"[\s\S]*id="lives-value"/,'the HUD shows the player aircraft beside the life count');
assert.equal((html.match(/class="wingman-flame"/g)||[]).length,3,'the support button contains three dynamic flame charges');
console.log('Build 28 wingmen, charge persistence, hero weapons, crashes and co-op snapshots passed');
